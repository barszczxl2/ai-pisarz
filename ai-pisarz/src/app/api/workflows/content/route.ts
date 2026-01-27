import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDifyClient, NodeTokenDetail } from '@/lib/dify/client';
import { workflowProjectIdSchema, validateRequest } from '@/lib/validations/api';
// TODO: Włączyć po wdrożeniu w Dify
// import {
//   processSectionForContext,
//   buildPreviousSectionsContext,
//   buildUpcomingSectionsContext,
//   buildAntiRepetitionInstruction,
//   SectionSummary,
// } from '@/lib/summarizer';

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

    if (!process.env.DIFY_CONTENT_WORKFLOW_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get all required data
    const { data: project } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Use order + limit to handle duplicates (get latest)
    const { data: briefArr } = await supabase
      .from('pisarz_briefs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);
    const brief = briefArr?.[0];

    const { data: sections } = await supabase
      .from('pisarz_content_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('section_order', { ascending: true });

    const { data: shArr } = await supabase
      .from('pisarz_generated_headers')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .limit(1);
    const selectedHeaders = shArr?.[0];

    if (!project || !brief || !sections || sections.length === 0 || !selectedHeaders) {
      console.error('Missing required data:', {
        hasProject: !!project,
        hasBrief: !!brief,
        hasSections: !!sections,
        sectionsLength: sections?.length || 0,
        hasSelectedHeaders: !!selectedHeaders,
      });
      return NextResponse.json({
        error: 'Missing required data',
        details: {
          hasProject: !!project,
          hasBrief: !!brief,
          hasSections: !!sections,
          sectionsLength: sections?.length || 0,
          hasSelectedHeaders: !!selectedHeaders,
        }
      }, { status: 400 });
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
        stage: 5,
        stage_name: 'Generowanie treści',
        status: 'running',
      })
      .select()
      .single();

    // Update project status
    await supabase
      .from('pisarz_projects')
      .update({ status: 'content_generating', current_stage: 5 })
      .eq('id', projectId);

    // Get or create context store
    let { data: contextStore } = await supabase
      .from('pisarz_context_store')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!contextStore) {
      const { data: newContext } = await supabase
        .from('pisarz_context_store')
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
    let totalTokens = 0;
    const allTokenDetails: NodeTokenDetail[] = [];
    const difyClient = getDifyClient();

    // Iterate through sections
    for (let i = startIndex; i < sections.length; i++) {
      const section = sections[i];
      const briefItem = briefItems[i];

      // Update section status to processing
      await supabase
        .from('pisarz_content_sections')
        .update({ status: 'processing' })
        .eq('id', section.id);

      try {
        // Call Dify API with streaming for this section
        const { result, tokenDetails, totalTokens: sectionTokens } = await difyClient.runWorkflowStreaming(
          'content',
          {
            naglowek: section.heading_html,
            language: project.language,
            knowledge: briefItem?.knowledge || section.heading_knowledge || '',
            keywords: briefItem?.keywords || section.heading_keywords || '',
            headings: selectedHeaders.headers_html || '',
            done: contextStore?.accumulated_content || '',
            keyword: project.keyword,
            instruction: '',
          },
          'ai-pisarz'
        );

        if (result?.data?.status === 'succeeded') {
          const generatedContent = result.data.outputs?.result || '';
          totalTokens += sectionTokens || result.data.total_tokens || 0;
          // Append section token details with section identifier
          tokenDetails.forEach(td => {
            allTokenDetails.push({
              ...td,
              node_title: `[Sekcja ${i + 1}] ${td.node_title}`,
            });
          });

          // Update section with generated content
          await supabase
            .from('pisarz_content_sections')
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
            .from('pisarz_context_store')
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
          throw new Error(result?.data?.error || `Failed to generate section ${i}`);
        }
      } catch (sectionError) {
        // Mark section as error but continue
        await supabase
          .from('pisarz_content_sections')
          .update({ status: 'error' })
          .eq('id', section.id);

        console.error(`Error generating section ${i}:`, sectionError);
        // Optionally, you could throw here to stop the entire process
      }
    }

    // Combine all sections into final content
    const { data: completedSections } = await supabase
      .from('pisarz_content_sections')
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
      .from('pisarz_generated_content')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (existingContent) {
      await supabase
        .from('pisarz_generated_content')
        .update({
          content_html: fullContentHtml,
          content_text: fullContentText,
        })
        .eq('project_id', projectId);
    } else {
      await supabase.from('pisarz_generated_content').insert({
        project_id: projectId,
        content_html: fullContentHtml,
        content_text: fullContentText,
      });
    }

    // Update project status
    await supabase
      .from('pisarz_projects')
      .update({ status: 'completed', current_stage: 5 })
      .eq('id', projectId);

    // Complete workflow run with detailed token info
    await supabase
      .from('pisarz_workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_tokens: totalTokens,
        token_details: allTokenDetails,
      })
      .eq('id', run?.id);

    return NextResponse.json({
      success: true,
      contentHtml: fullContentHtml,
      contentText: fullContentText,
      sectionsCompleted: completedSections?.length || 0,
      totalSections: sections.length,
      totalTokens,
      tokenDetails: allTokenDetails,
    });
  } catch (error) {
    console.error('Content workflow error:', error);

    // Update project status to error
    const body = await request.clone().json().catch(() => ({}));
    if (body.projectId) {
      const errorSupabase = getSupabase();
      await errorSupabase
        .from('pisarz_projects')
        .update({ status: 'error' })
        .eq('id', body.projectId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
