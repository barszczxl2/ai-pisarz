import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_KNOWLEDGE_KEY = process.env.DIFY_KNOWLEDGE_WORKFLOW_KEY;

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
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!DIFY_KNOWLEDGE_KEY) {
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

    // Call Dify API
    const difyResponse = await fetch(`${DIFY_API_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_KNOWLEDGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          keyword: project.keyword,
          language: project.language || 'Polish',
          aio: aioValue,
        },
        response_mode: 'blocking',
        user: 'ai-pisarz',
      }),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      throw new Error(`Dify API error: ${difyResponse.status} - ${errorText}`);
    }

    const result = await difyResponse.json();

    if (result.data?.status === 'succeeded') {
      const outputs = result.data.outputs || {};

      // Save knowledge graph
      if (outputs.knowledge_graph) {
        let graphData = outputs.knowledge_graph;
        if (typeof graphData === 'string') {
          try {
            graphData = JSON.parse(graphData);
          } catch {
            graphData = { raw: graphData };
          }
        }
        await supabase.from('pisarz_knowledge_graphs').insert({
          project_id: projectId,
          graph_data: graphData,
        });
      }

      // Save information graph (from "grafinformacji" output)
      const infoGraphData = outputs.grafinformacji || outputs.information_graph;
      if (infoGraphData) {
        let parsedData = infoGraphData;
        if (typeof parsedData === 'string') {
          try {
            // Remove markdown code blocks if present
            const cleaned = parsedData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleaned);
          } catch {
            parsedData = { raw: infoGraphData };
          }
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

      // Complete workflow run
      await supabase
        .from('pisarz_workflow_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run?.id);

      return NextResponse.json({
        success: true,
        outputs: {
          knowledge_graph: outputs.knowledge_graph ? true : false,
          information_graph: infoGraphData ? true : false,
          search_phrases: phrasesData ? true : false,
          competitor_headers: headersData ? true : false,
        },
        tokens: result.data.total_tokens,
        elapsed_time: result.data.elapsed_time,
      });
    } else {
      throw new Error(result.data?.error || 'Workflow failed');
    }
  } catch (error) {
    console.error('Knowledge workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
