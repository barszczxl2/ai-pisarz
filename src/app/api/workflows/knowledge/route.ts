import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Dify API configuration
const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_KNOWLEDGE_KEY = process.env.DIFY_KNOWLEDGE_WORKFLOW_KEY;

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

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
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create workflow run record
    const { data: run } = await supabase
      .from('workflow_runs')
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
      .from('projects')
      .update({ status: 'knowledge_building', current_stage: 1 })
      .eq('id', projectId);

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
          language: project.language,
          ai_overview_content: project.ai_overview_content || '',
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
        await supabase.from('knowledge_graphs').insert({
          project_id: projectId,
          graph_data: graphData,
        });
      }

      // Save information graph
      if (outputs.information_graph) {
        let infoData = outputs.information_graph;
        if (typeof infoData === 'string') {
          try {
            infoData = JSON.parse(infoData);
          } catch {
            infoData = { raw: infoData };
          }
        }
        await supabase.from('information_graphs').insert({
          project_id: projectId,
          triplets: infoData,
        });
      }

      // Save search phrases
      if (outputs.search_phrases || outputs.frazy) {
        await supabase.from('search_phrases').insert({
          project_id: projectId,
          phrases: outputs.search_phrases || outputs.frazy,
        });
      }

      // Save competitor headers
      if (outputs.competitor_headers || outputs.headings) {
        await supabase.from('competitor_headers').insert({
          project_id: projectId,
          headers: outputs.competitor_headers || outputs.headings,
        });
      }

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
    console.error('Knowledge workflow error:', error);

    // Update project status to error
    const { projectId } = await request.json().catch(() => ({}));
    if (projectId) {
      await supabase
        .from('projects')
        .update({ status: 'error' })
        .eq('id', projectId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
