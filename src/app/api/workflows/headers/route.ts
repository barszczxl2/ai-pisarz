import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_HEADERS_KEY = process.env.DIFY_HEADERS_WORKFLOW_KEY;

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

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
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: knowledgeGraph } = await supabase
      .from('knowledge_graphs')
      .select('*')
      .eq('project_id', projectId)
      .single();

    const { data: searchPhrases } = await supabase
      .from('search_phrases')
      .select('*')
      .eq('project_id', projectId)
      .single();

    const { data: competitorHeaders } = await supabase
      .from('competitor_headers')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!project || !knowledgeGraph || !searchPhrases) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Create workflow run
    const { data: run } = await supabase
      .from('workflow_runs')
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
          await supabase.from('generated_headers').insert({
            project_id: projectId,
            header_type: type,
            headers_html: outputs[key],
            is_selected: false,
          });
        }
      }

      // Update project status
      await supabase
        .from('projects')
        .update({ status: 'headers_generated', current_stage: 2 })
        .eq('id', projectId);

      // Complete workflow run
      await supabase
        .from('workflow_runs')
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
