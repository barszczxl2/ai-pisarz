import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_BRIEF_KEY = process.env.DIFY_BRIEF_WORKFLOW_KEY;

interface BriefItem {
  heading: string;
  knowledge: string;
  keywords: string;
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!DIFY_BRIEF_KEY) {
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

    if (!project || !knowledgeGraph || !informationGraph || !searchPhrases || !selectedHeaders) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
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

    // Call Dify API
    const difyResponse = await fetch(`${DIFY_API_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_BRIEF_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          keyword: project.keyword,
          keywords: searchPhrases.phrases || '',
          headings: selectedHeaders.headers_html || '',
          knowledge_graph: typeof knowledgeGraph.graph_data === 'string'
            ? knowledgeGraph.graph_data
            : JSON.stringify(knowledgeGraph.graph_data),
          information_graph: typeof informationGraph.triplets === 'string'
            ? informationGraph.triplets
            : JSON.stringify(informationGraph.triplets),
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

      // Parse brief JSON
      let briefJson: BriefItem[] | null = null;
      if (outputs.brief) {
        try {
          briefJson = JSON.parse(outputs.brief);
        } catch {
          briefJson = null;
        }
      }

      // Save brief
      await supabase.from('pisarz_briefs').insert({
        project_id: projectId,
        brief_json: briefJson,
        brief_html: outputs.html || '',
      });

      // Create content sections from brief
      if (briefJson && Array.isArray(briefJson)) {
        const sections = briefJson.map((item, index) => ({
          project_id: projectId,
          section_order: index,
          heading_html: item.heading,
          heading_knowledge: item.knowledge,
          heading_keywords: item.keywords,
          status: 'pending' as const,
        }));

        await supabase.from('pisarz_content_sections').insert(sections);
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
    console.error('Brief workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
