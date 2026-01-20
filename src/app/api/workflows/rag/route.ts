import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_RAG_KEY = process.env.DIFY_RAG_WORKFLOW_KEY;

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!DIFY_RAG_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get project and selected headers
    const { data: project } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Use limit to handle potential duplicates
    const { data: shArr } = await supabase
      .from('pisarz_generated_headers')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .limit(1);
    const selectedHeaders = shArr?.[0];

    if (!project || !selectedHeaders) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Create workflow run
    const { data: run } = await supabase
      .from('pisarz_workflow_runs')
      .insert({
        project_id: projectId,
        stage: 3,
        stage_name: 'Budowa RAG',
        status: 'running',
      })
      .select()
      .single();

    // Call Dify API
    const difyResponse = await fetch(`${DIFY_API_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_RAG_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          keyword: project.keyword,
          language: project.language,
          headings: selectedHeaders.headers_html || '',
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

      // Save RAG data
      await supabase.from('pisarz_rag_data').insert({
        project_id: projectId,
        detailed_qa: outputs.dokladne || '',
        general_qa: outputs.ogolne || '',
      });

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({ status: 'rag_created', current_stage: 3 })
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
    console.error('RAG workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
