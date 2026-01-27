import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDifyClient } from '@/lib/dify/client';
import { workflowProjectIdSchema, validateRequest } from '@/lib/validations/api';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface BriefItem {
  heading: string;
  knowledge: string;
  keywords: string;
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

    if (!process.env.DIFY_BRIEF_WORKFLOW_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get all required data
    const { data: project } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Use order + limit to handle duplicates (get latest)
    const { data: kgArr } = await supabase
      .from('pisarz_knowledge_graphs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const knowledgeGraph = kgArr?.[0];

    const { data: igArr } = await supabase
      .from('pisarz_information_graphs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const informationGraph = igArr?.[0];

    const { data: spArr } = await supabase
      .from('pisarz_search_phrases')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const searchPhrases = spArr?.[0];

    const { data: shArr } = await supabase
      .from('pisarz_generated_headers')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .limit(1);
    const selectedHeaders = shArr?.[0];

    // informationGraph is optional - only generated when aio="BRAK"
    if (!project || !knowledgeGraph || !searchPhrases || !selectedHeaders) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
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

    // Create workflow run
    const { data: run } = await supabase
      .from('pisarz_workflow_runs')
      .insert({
        project_id: projectId,
        stage: 4,
        stage_name: 'Tworzenie briefu',
        status: 'running',
      })
      .select()
      .single();

    // Call Dify API with streaming to get detailed token info
    const difyClient = getDifyClient();
    const { result, tokenDetails, totalTokens } = await difyClient.runWorkflowStreaming(
      'brief',
      {
        keyword: project.keyword,
        keywords: searchPhrases.phrases || '',
        headings: selectedHeaders.headers_html || '',
        knowledge_graph: typeof knowledgeGraph.graph_data === 'string'
          ? knowledgeGraph.graph_data
          : JSON.stringify(knowledgeGraph.graph_data),
        information_graph: informationGraph?.triplets
          ? (typeof informationGraph.triplets === 'string'
            ? informationGraph.triplets
            : JSON.stringify(informationGraph.triplets))
          : '',
      },
      'ai-pisarz'
    );

    if (result?.data?.status === 'succeeded') {
      const outputs = result.data.outputs || {};

      // Debug: log FULL Dify response
      console.log('=== DIFY BRIEF FULL RESPONSE ===');
      console.log('result.data keys:', Object.keys(result.data));
      console.log('outputs keys:', Object.keys(outputs));
      console.log('outputs FULL:', JSON.stringify(outputs, null, 2).substring(0, 2000));
      console.log('outputs.brief type:', typeof outputs.brief);
      console.log('outputs.brief value:', outputs.brief ? String(outputs.brief).substring(0, 1000) : 'EMPTY/NULL/UNDEFINED');
      console.log('outputs.html type:', typeof outputs.html);
      console.log('=== END DIFY DEBUG ===');

      // Parse brief JSON
      let briefJson: BriefItem[] | null = null;
      if (outputs.brief) {
        try {
          // Clean potential markdown code blocks
          let briefStr = String(outputs.brief).trim();
          if (briefStr.startsWith('```json')) {
            briefStr = briefStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (briefStr.startsWith('```')) {
            briefStr = briefStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          console.log('Brief string after cleanup (first 500 chars):', briefStr.substring(0, 500));
          briefJson = JSON.parse(briefStr);
        } catch (e) {
          console.error('Failed to parse brief JSON:', e);
          console.error('Raw brief value:', String(outputs.brief).substring(0, 500));
          briefJson = null;
        }
      } else {
        console.error('outputs.brief is FALSY - nothing to parse');
      }

      // Save brief
      await supabase.from('pisarz_briefs').insert({
        project_id: projectId,
        brief_json: briefJson,
        brief_html: outputs.html || '',
      });

      // Create content sections from brief
      console.log('Brief JSON parsed:', { briefJson: !!briefJson, isArray: Array.isArray(briefJson), length: briefJson?.length });
      if (briefJson && Array.isArray(briefJson) && briefJson.length > 0) {
        const sections = briefJson.map((item, index) => ({
          project_id: projectId,
          section_order: index,
          heading_html: item.heading,
          heading_knowledge: item.knowledge,
          heading_keywords: item.keywords,
          status: 'pending' as const,
        }));

        console.log('Creating sections:', sections.length);
        const { error: sectionsError } = await supabase.from('pisarz_content_sections').insert(sections);
        if (sectionsError) {
          console.error('Error creating sections:', sectionsError);
        }
      } else {
        console.error('Brief JSON invalid - cannot create sections');
      }

      // Initialize context store
      await supabase.from('pisarz_context_store').upsert({
        project_id: projectId,
        accumulated_content: '',
        current_heading_index: 0,
      });

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({ status: 'brief_created', current_stage: 4 })
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

      return NextResponse.json({ success: true, outputs, tokenDetails });
    } else {
      throw new Error(result?.data?.error || 'Workflow failed');
    }
  } catch (error) {
    console.error('Brief workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
