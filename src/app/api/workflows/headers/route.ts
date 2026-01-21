import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDifyClient } from '@/lib/dify/client';

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

    if (!process.env.DIFY_HEADERS_WORKFLOW_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get project and related data
    const { data: project } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Use order + limit to handle duplicates (get latest)
    const { data: knowledgeGraphs } = await supabase
      .from('pisarz_knowledge_graphs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const knowledgeGraph = knowledgeGraphs?.[0];

    const { data: searchPhrasesArr } = await supabase
      .from('pisarz_search_phrases')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const searchPhrases = searchPhrasesArr?.[0];

    const { data: competitorHeadersArr } = await supabase
      .from('pisarz_competitor_headers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const competitorHeaders = competitorHeadersArr?.[0];

    if (!project || !knowledgeGraph || !searchPhrases) {
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
        stage: 2,
        stage_name: 'Generowanie nagłówków',
        status: 'running',
      })
      .select()
      .single();

    // Call Dify API with streaming to get detailed token info
    const difyClient = getDifyClient();
    const { result, tokenDetails, totalTokens } = await difyClient.runWorkflowStreaming(
      'headers',
      {
        keyword: project.keyword,
        language: project.language,
        frazy: searchPhrases.phrases || '',
        graf: typeof knowledgeGraph.graph_data === 'string'
          ? knowledgeGraph.graph_data
          : JSON.stringify(knowledgeGraph.graph_data),
        headings: competitorHeaders?.headers || '',
      },
      'ai-pisarz'
    );

    if (result?.data?.status === 'succeeded') {
      const outputs = result.data.outputs || {};

      // Save three types of headers
      const headerTypes = [
        { type: 'rozbudowane', key: 'naglowki_rozbudowane' },
        { type: 'h2', key: 'naglowki_h2' },
        { type: 'pytania', key: 'naglowki_pytania' },
      ] as const;

      for (const { type, key } of headerTypes) {
        if (outputs[key]) {
          await supabase.from('pisarz_generated_headers').insert({
            project_id: projectId,
            header_type: type,
            headers_html: outputs[key],
            is_selected: false,
          });
        }
      }

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({ status: 'headers_generated', current_stage: 2 })
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
    console.error('Headers workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
