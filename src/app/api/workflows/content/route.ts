import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_CONTENT_KEY = process.env.DIFY_CONTENT_WORKFLOW_KEY;

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

    if (!DIFY_CONTENT_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get all required data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: brief } = await supabase
      .from('briefs')
      .select('*')
      .eq('project_id', projectId)
      .single();

    const { data: sections } = await supabase
      .from('content_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('section_order', { ascending: true });

    const { data: selectedHeaders } = await supabase
      .from('generated_headers')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .single();

    if (!project || !brief || !sections || sections.length === 0 || !selectedHeaders) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Create workflow run
    const { data: run } = await supabase
      .from('workflow_runs')
      .insert({
        project_id: projectId,
        stage: 5,
        stage_name: 'Generowanie treści',
        status: 'running',
      })
      .select()
      .single();

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'content_generating', current_stage: 5 })
      .eq('id', projectId);

    // Get or create context store
    let { data: contextStore } = await supabase
      .from('context_store')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!contextStore) {
      const { data: newContext } = await supabase
        .from('context_store')
        .insert({
          project_id: projectId,
          accumulated_content: '',
          current_heading_index: 0,
        })
        .select()
        .single();
      contextStore = newContext;
    }

    const startIndex = contextStore?.current_heading_index || 0;
    const briefItems = (brief.brief_json as BriefItem[]) || [];

    // Iterate through sections
    for (let i = startIndex; i < sections.length; i++) {
      const section = sections[i];
      const briefItem = briefItems[i];

      // Update section status to processing
      await supabase
        .from('content_sections')
        .update({ status: 'processing' })
        .eq('id', section.id);

      try {
        // Call Dify API for this section
        const difyResponse = await fetch(`${DIFY_API_BASE}/workflows/run`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DIFY_CONTENT_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              naglowek: section.heading_html,
              language: project.language,
              knowledge: briefItem?.knowledge || section.heading_knowledge || '',
              keywords: briefItem?.keywords || section.heading_keywords || '',
              headings: selectedHeaders.headers_html || '',
              done: contextStore?.accumulated_content || '',
              keyword: project.keyword,
              instruction: '',
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
          const generatedContent = result.data.outputs?.result || '';

          // Update section with generated content
          await supabase
            .from('content_sections')
            .update({
              content_html: generatedContent,
              status: 'completed',
            })
            .eq('id', section.id);

          // Update context store
          const newAccumulatedContent =
            (contextStore?.accumulated_content || '') +
            `\n\n${section.heading_html}\n${generatedContent}`;

          await supabase
            .from('context_store')
            .update({
              accumulated_content: newAccumulatedContent,
              current_heading_index: i + 1,
            })
            .eq('project_id', projectId);

          // Update local reference
          contextStore = {
            ...contextStore!,
            accumulated_content: newAccumulatedContent,
            current_heading_index: i + 1,
          };
        } else {
          throw new Error(result.data?.error || `Failed to generate section ${i}`);
        }
      } catch (sectionError) {
        // Mark section as error but continue
        await supabase
          .from('content_sections')
          .update({ status: 'error' })
          .eq('id', section.id);

        console.error(`Error generating section ${i}:`, sectionError);
        // Optionally, you could throw here to stop the entire process
      }
    }

    // Combine all sections into final content
    const { data: completedSections } = await supabase
      .from('content_sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .order('section_order', { ascending: true });

    const fullContentHtml = completedSections
      ?.map(s => `${s.heading_html}\n${s.content_html}`)
      .join('\n\n') || '';

    const fullContentText = fullContentHtml
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n');

    // Save or update final content
    const { data: existingContent } = await supabase
      .from('generated_content')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (existingContent) {
      await supabase
        .from('generated_content')
        .update({
          content_html: fullContentHtml,
          content_text: fullContentText,
        })
        .eq('project_id', projectId);
    } else {
      await supabase.from('generated_content').insert({
        project_id: projectId,
        content_html: fullContentHtml,
        content_text: fullContentText,
      });
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'completed', current_stage: 5 })
      .eq('id', projectId);

    // Complete workflow run
    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', run?.id);

    return NextResponse.json({
      success: true,
      contentHtml: fullContentHtml,
      contentText: fullContentText,
      sectionsCompleted: completedSections?.length || 0,
      totalSections: sections.length,
    });
  } catch (error) {
    console.error('Content workflow error:', error);

    // Update project status to error
    const body = await request.clone().json().catch(() => ({}));
    if (body.projectId) {
      const supabase = createServiceRoleClient();
      await supabase
        .from('projects')
        .update({ status: 'error' })
        .eq('id', body.projectId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
