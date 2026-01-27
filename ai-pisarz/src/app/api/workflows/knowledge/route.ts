import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDifyClient } from '@/lib/dify/client';
import { workflowProjectIdSchema, validateRequest } from '@/lib/validations/api';

// Create Supabase client for API routes
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validation = validateRequest(workflowProjectIdSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { projectId } = validation.data;

    if (!process.env.DIFY_KNOWLEDGE_WORKFLOW_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check for already running workflows
    const { data: runningWorkflows } = await supabase
      .from('pisarz_workflow_runs')
      .select('id, stage_name')
      .eq('project_id', projectId)
      .eq('status', 'running');

    if (runningWorkflows && runningWorkflows.length > 0) {
      return NextResponse.json(
        { error: `Workflow "${runningWorkflows[0].stage_name}" jest już uruchomiony. Zatrzymaj go najpierw.` },
        { status: 409 }
      );
    }

    // Create workflow run record
    const { data: run } = await supabase
      .from('pisarz_workflow_runs')
      .insert({
        project_id: projectId,
        stage: 1,
        stage_name: 'Budowa wiedzy',
        status: 'running',
      })
      .select()
      .single();

    // Update project status
    await supabase
      .from('pisarz_projects')
      .update({ status: 'knowledge_building', current_stage: 1 })
      .eq('id', projectId);

    // Prepare AIO value - default to "BRAK" if empty
    const aioValue = project.ai_overview_content?.trim() || 'BRAK';

    // Call Dify API with streaming to get detailed token info
    const difyClient = getDifyClient();
    const { result, tokenDetails, totalTokens } = await difyClient.runWorkflowStreaming(
      'knowledge',
      {
        keyword: project.keyword,
        language: project.language || 'Polish',
        aio: aioValue,
      },
      'ai-pisarz'
    );

    if (result?.data?.status === 'succeeded') {
      const outputs = result.data.outputs || {};

      // Save knowledge graph
      if (outputs.knowledge_graph) {
        let graphData: Record<string, unknown> = {};
        const rawGraph = outputs.knowledge_graph;
        if (typeof rawGraph === 'string') {
          try {
            graphData = JSON.parse(rawGraph);
          } catch {
            graphData = { raw: rawGraph };
          }
        } else {
          graphData = rawGraph as Record<string, unknown>;
        }
        await supabase.from('pisarz_knowledge_graphs').insert({
          project_id: projectId,
          graph_data: graphData,
        });
      }

      // Save information graph (from "grafinformacji" output)
      const rawInfoGraph = outputs.grafinformacji || outputs.information_graph;
      if (rawInfoGraph) {
        let parsedData: Record<string, unknown> = {};
        if (typeof rawInfoGraph === 'string') {
          try {
            // Remove markdown code blocks if present
            const cleaned = rawInfoGraph.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleaned);
          } catch {
            parsedData = { raw: rawInfoGraph };
          }
        } else {
          parsedData = rawInfoGraph as Record<string, unknown>;
        }
        await supabase.from('pisarz_information_graphs').insert({
          project_id: projectId,
          triplets: parsedData,
        });
      }

      // Save search phrases (from "frazy z serp" output)
      const phrasesData = outputs['frazy z serp'] || outputs.search_phrases || outputs.frazy;
      if (phrasesData) {
        await supabase.from('pisarz_search_phrases').insert({
          project_id: projectId,
          phrases: phrasesData,
        });
      }

      // Save competitor headers (from "naglowki" output)
      const headersData = outputs.naglowki || outputs.competitor_headers || outputs.headings;
      if (headersData) {
        await supabase.from('pisarz_competitor_headers').insert({
          project_id: projectId,
          headers: headersData,
        });
      }

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({ status: 'knowledge_built', current_stage: 1 })
        .eq('id', projectId);

      // Complete workflow run with detailed token info
      await supabase
        .from('pisarz_workflow_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_tokens: totalTokens || result.data.total_tokens || 0,
          token_details: tokenDetails,
        })
        .eq('id', run?.id);

      return NextResponse.json({
        success: true,
        outputs: {
          knowledge_graph: outputs.knowledge_graph ? true : false,
          information_graph: rawInfoGraph ? true : false,
          search_phrases: phrasesData ? true : false,
          competitor_headers: headersData ? true : false,
        },
        tokens: totalTokens || result.data.total_tokens,
        tokenDetails,
        elapsed_time: result.data.elapsed_time,
      });
    } else {
      throw new Error(result?.data?.error || 'Workflow failed');
    }
  } catch (error) {
    console.error('Knowledge workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
