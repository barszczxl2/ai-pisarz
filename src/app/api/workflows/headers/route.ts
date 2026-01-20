import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_HEADERS_KEY = process.env.DIFY_HEADERS_WORKFLOW_KEY;

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

    if (!DIFY_HEADERS_KEY) {
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

    // Call Dify API
    const difyResponse = await fetch(`${DIFY_API_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_HEADERS_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          keyword: project.keyword,
          language: project.language,
          frazy: searchPhrases.phrases || '',
          graf: typeof knowledgeGraph.graph_data === 'string'
            ? knowledgeGraph.graph_data
            : JSON.stringify(knowledgeGraph.graph_data),
          headings: competitorHeaders?.headers || '',
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

      // Complete workflow run
      await supabase
        .from('pisarz_workflow_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run?.id);

      return NextResponse.json({ success: true, outputs });
    } else {
      throw new Error(result.data?.error || 'Workflow failed');
    }
  } catch (error) {
    console.error('Headers workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
