// Orchestrator - manages the 5-stage workflow pipeline

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  runKnowledgeWorkflow,
  runHeadersWorkflow,
  runRagWorkflow,
  runBriefWorkflow,
  runContentWorkflow,
  type KnowledgeWorkflowInputs,
  type HeadersWorkflowInputs,
  type RagWorkflowInputs,
  type BriefWorkflowInputs,
  type ContentWorkflowInputs,
} from '@/lib/dify/client';
import {
  processSectionForContext,
  buildPreviousSectionsContext,
  buildUpcomingSectionsContext,
  buildAntiRepetitionInstruction,
  SectionSummary,
} from '@/lib/summarizer';
import type { BriefItem, ContentSection, ProjectStatus } from '@/types/database';

export class Orchestrator {
  private supabase = createServiceRoleClient();

  async updateProjectStatus(projectId: string, status: ProjectStatus, stage?: number) {
    const update: { status: ProjectStatus; current_stage?: number } = { status };
    if (stage !== undefined) {
      update.current_stage = stage;
    }
    await this.supabase.from('pisarz_projects').update(update).eq('id', projectId);
  }

  async createWorkflowRun(projectId: string, stage: number, stageName: string) {
    const { data } = await this.supabase
      .from('pisarz_workflow_runs')
      .insert({
        project_id: projectId,
        stage,
        stage_name: stageName,
        status: 'running',
      })
      .select()
      .single();
    return data;
  }

  async completeWorkflowRun(runId: string, status: 'completed' | 'error', errorMessage?: string) {
    await this.supabase
      .from('pisarz_workflow_runs')
      .update({
        status,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
  }

  // Stage 1: Knowledge Building
  async runKnowledgeBuilding(projectId: string) {
    const run = await this.createWorkflowRun(projectId, 1, 'Budowa wiedzy');
    await this.updateProjectStatus(projectId, 'knowledge_building', 1);

    try {
      // Get project data
      const { data: project } = await this.supabase
        .from('pisarz_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) throw new Error('Project not found');

      const inputs: KnowledgeWorkflowInputs = {
        keyword: project.keyword,
        language: project.language,
        ai_overview_content: project.ai_overview_content || '',
      };

      const result = await runKnowledgeWorkflow(inputs);

      if (result.data.status === 'succeeded') {
        const outputs = result.data.outputs;

        // Save knowledge graph
        if (outputs.knowledge_graph) {
          await this.supabase.from('pisarz_knowledge_graphs').insert({
            project_id: projectId,
            graph_data: typeof outputs.knowledge_graph === 'string'
              ? JSON.parse(outputs.knowledge_graph)
              : outputs.knowledge_graph,
          });
        }

        // Save information graph
        if (outputs.information_graph) {
          await this.supabase.from('pisarz_information_graphs').insert({
            project_id: projectId,
            triplets: typeof outputs.information_graph === 'string'
              ? JSON.parse(outputs.information_graph)
              : outputs.information_graph,
          });
        }

        // Save search phrases
        if (outputs.search_phrases) {
          await this.supabase.from('pisarz_search_phrases').insert({
            project_id: projectId,
            phrases: outputs.search_phrases,
          });
        }

        // Save competitor headers
        if (outputs.competitor_headers) {
          await this.supabase.from('pisarz_competitor_headers').insert({
            project_id: projectId,
            headers: outputs.competitor_headers,
          });
        }

        await this.completeWorkflowRun(run!.id, 'completed');
        await this.updateProjectStatus(projectId, 'knowledge_building', 1);
        return { success: true, outputs };
      } else {
        throw new Error(result.data.error || 'Workflow failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeWorkflowRun(run!.id, 'error', errorMessage);
      await this.updateProjectStatus(projectId, 'error');
      throw error;
    }
  }

  // Stage 2: Header Generation
  async runHeaderGeneration(projectId: string) {
    const run = await this.createWorkflowRun(projectId, 2, 'Generowanie nagłówków');

    try {
      // Get required data
      const { data: project } = await this.supabase
        .from('pisarz_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      const { data: knowledgeGraph } = await this.supabase
        .from('pisarz_knowledge_graphs')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: searchPhrases } = await this.supabase
        .from('pisarz_search_phrases')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: competitorHeaders } = await this.supabase
        .from('pisarz_competitor_headers')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (!project || !knowledgeGraph || !searchPhrases) {
        throw new Error('Missing required data for header generation');
      }

      const inputs: HeadersWorkflowInputs = {
        keyword: project.keyword,
        language: project.language,
        frazy: searchPhrases.phrases || '',
        graf: JSON.stringify(knowledgeGraph.graph_data),
        headings: competitorHeaders?.headers || '',
      };

      const result = await runHeadersWorkflow(inputs);

      if (result.data.status === 'succeeded') {
        const outputs = result.data.outputs;

        // Save three types of headers
        const headerTypes = [
          { type: 'rozbudowane', key: 'naglowki_rozbudowane' },
          { type: 'h2', key: 'naglowki_h2' },
          { type: 'pytania', key: 'naglowki_pytania' },
        ] as const;

        for (const { type, key } of headerTypes) {
          if (outputs[key]) {
            await this.supabase.from('pisarz_generated_headers').insert({
              project_id: projectId,
              header_type: type,
              headers_html: outputs[key],
              is_selected: false,
            });
          }
        }

        await this.completeWorkflowRun(run!.id, 'completed');
        await this.updateProjectStatus(projectId, 'headers_generated', 2);
        return { success: true, outputs };
      } else {
        throw new Error(result.data.error || 'Workflow failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeWorkflowRun(run!.id, 'error', errorMessage);
      await this.updateProjectStatus(projectId, 'error');
      throw error;
    }
  }

  // Stage 3: RAG Creation
  async runRagCreation(projectId: string) {
    const run = await this.createWorkflowRun(projectId, 3, 'Budowa RAG');

    try {
      const { data: project } = await this.supabase
        .from('pisarz_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      const { data: selectedHeaders } = await this.supabase
        .from('pisarz_generated_headers')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_selected', true)
        .single();

      if (!project || !selectedHeaders) {
        throw new Error('Missing required data for RAG creation');
      }

      const inputs: RagWorkflowInputs = {
        keyword: project.keyword,
        language: project.language,
        headings: selectedHeaders.headers_html || '',
      };

      const result = await runRagWorkflow(inputs);

      if (result.data.status === 'succeeded') {
        const outputs = result.data.outputs;

        await this.supabase.from('pisarz_rag_data').insert({
          project_id: projectId,
          detailed_qa: outputs.dokladne || '',
          general_qa: outputs.ogolne || '',
        });

        await this.completeWorkflowRun(run!.id, 'completed');
        await this.updateProjectStatus(projectId, 'rag_created', 3);
        return { success: true, outputs };
      } else {
        throw new Error(result.data.error || 'Workflow failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeWorkflowRun(run!.id, 'error', errorMessage);
      await this.updateProjectStatus(projectId, 'error');
      throw error;
    }
  }

  // Stage 4: Brief Creation
  async runBriefCreation(projectId: string) {
    const run = await this.createWorkflowRun(projectId, 4, 'Tworzenie briefu');

    try {
      const { data: project } = await this.supabase
        .from('pisarz_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      const { data: knowledgeGraph } = await this.supabase
        .from('pisarz_knowledge_graphs')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: informationGraph } = await this.supabase
        .from('pisarz_information_graphs')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: searchPhrases } = await this.supabase
        .from('pisarz_search_phrases')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: selectedHeaders } = await this.supabase
        .from('pisarz_generated_headers')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_selected', true)
        .single();

      if (!project || !knowledgeGraph || !informationGraph || !searchPhrases || !selectedHeaders) {
        throw new Error('Missing required data for brief creation');
      }

      const inputs: BriefWorkflowInputs = {
        keyword: project.keyword,
        keywords: searchPhrases.phrases || '',
        headings: selectedHeaders.headers_html || '',
        knowledge_graph: JSON.stringify(knowledgeGraph.graph_data),
        information_graph: JSON.stringify(informationGraph.triplets),
      };

      const result = await runBriefWorkflow(inputs);

      if (result.data.status === 'succeeded') {
        const outputs = result.data.outputs;

        let briefJson: BriefItem[] | null = null;
        if (outputs.brief) {
          try {
            briefJson = JSON.parse(outputs.brief);
          } catch {
            briefJson = null;
          }
        }

        await this.supabase.from('pisarz_briefs').insert({
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

          await this.supabase.from('pisarz_content_sections').insert(sections);
        }

        // Initialize context store with summaries support
        await this.supabase.from('pisarz_context_store').upsert({
          project_id: projectId,
          accumulated_content: '',
          current_heading_index: 0,
          section_summaries: [],
          last_section_content: '',
        });

        await this.completeWorkflowRun(run!.id, 'completed');
        await this.updateProjectStatus(projectId, 'brief_created', 4);
        return { success: true, outputs };
      } else {
        throw new Error(result.data.error || 'Workflow failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeWorkflowRun(run!.id, 'error', errorMessage);
      await this.updateProjectStatus(projectId, 'error');
      throw error;
    }
  }

  // Stage 5: Content Generation (iterative)
  async runContentGeneration(projectId: string, onSectionComplete?: (section: ContentSection) => void) {
    const run = await this.createWorkflowRun(projectId, 5, 'Generowanie treści');
    await this.updateProjectStatus(projectId, 'content_generating', 5);

    try {
      const { data: project } = await this.supabase
        .from('pisarz_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      const { data: brief } = await this.supabase
        .from('pisarz_briefs')
        .select('*')
        .eq('project_id', projectId)
        .single();

      const { data: sections } = await this.supabase
        .from('pisarz_content_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order', { ascending: true });

      const { data: selectedHeaders } = await this.supabase
        .from('pisarz_generated_headers')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_selected', true)
        .single();

      if (!project || !brief || !sections || sections.length === 0 || !selectedHeaders) {
        throw new Error('Missing required data for content generation');
      }

      // Initialize or get context store
      let { data: contextStore } = await this.supabase
        .from('pisarz_context_store')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (!contextStore) {
        const { data: newContext } = await this.supabase
          .from('pisarz_context_store')
          .insert({
            project_id: projectId,
            accumulated_content: '',
            current_heading_index: 0,
            section_summaries: [],
            last_section_content: '',
          })
          .select()
          .single();
        contextStore = newContext;
      }

      const startIndex = contextStore?.current_heading_index || 0;
      const briefItems = (brief.brief_json as BriefItem[]) || [];

      // Parse section_summaries if it's a string
      const sectionSummaries: SectionSummary[] =
        typeof contextStore?.section_summaries === 'string'
          ? JSON.parse(contextStore.section_summaries)
          : (contextStore?.section_summaries || []);

      // Iterate through sections
      for (let i = startIndex; i < sections.length; i++) {
        const section = sections[i];

        // Update section status to processing
        await this.supabase
          .from('pisarz_content_sections')
          .update({ status: 'processing' })
          .eq('id', section.id);

        const briefItem = briefItems[i];

        // Build context for this section
        const previousContext = buildPreviousSectionsContext(
          sectionSummaries.map(s => ({ heading: s.heading, summary: s.summary }))
        );
        const upcomingContext = buildUpcomingSectionsContext(briefItems, i);

        // Get topics from previous and upcoming sections for anti-repetition
        const previousTopics = sectionSummaries.flatMap(s => s.topics);
        const upcomingTopics = briefItems.slice(i + 1).map(b =>
          b.heading.replace(/<[^>]+>/g, '').trim()
        );

        const antiRepetitionInstruction = buildAntiRepetitionInstruction(
          previousTopics,
          upcomingTopics
        );

        const inputs: ContentWorkflowInputs = {
          naglowek: section.heading_html,
          language: project.language,
          knowledge: briefItem?.knowledge || section.heading_knowledge || '',
          keywords: briefItem?.keywords || section.heading_keywords || '',
          headings: selectedHeaders.headers_html || '',
          // ZMIANA: zamiast pełnej treści, przekazujemy streszczenia
          done: previousContext,
          keyword: project.keyword,
          // NOWE: pełna treść ostatniej sekcji dla ciągłości
          last_section: contextStore?.last_section_content || '',
          // NOWE: plan przyszłych sekcji
          upcoming: upcomingContext,
          // NOWE: instrukcja anty-powtórzeniowa
          instruction: antiRepetitionInstruction,
        };

        const result = await runContentWorkflow(inputs);

        if (result.data.status === 'succeeded') {
          const generatedContent = result.data.outputs.result || '';

          // Generate summary for this section
          const sectionSummary = processSectionForContext(
            section.heading_html,
            generatedContent
          );

          // Update section with generated content and summary
          await this.supabase
            .from('pisarz_content_sections')
            .update({
              content_html: generatedContent,
              summary: sectionSummary.summary,
              status: 'completed',
            })
            .eq('id', section.id);

          // Update summaries array
          sectionSummaries.push(sectionSummary);

          // Update context store with summaries
          const newAccumulatedContent = (contextStore?.accumulated_content || '') +
            `\n\n${section.heading_html}\n${generatedContent}`;

          await this.supabase
            .from('pisarz_context_store')
            .update({
              accumulated_content: newAccumulatedContent,
              current_heading_index: i + 1,
              section_summaries: sectionSummaries,
              last_section_content: `${section.heading_html}\n${generatedContent}`,
            })
            .eq('project_id', projectId);

          // Update local context store reference
          contextStore = {
            ...contextStore!,
            accumulated_content: newAccumulatedContent,
            current_heading_index: i + 1,
            section_summaries: sectionSummaries,
            last_section_content: `${section.heading_html}\n${generatedContent}`,
          };

          // Callback for real-time updates
          onSectionComplete?.({
            ...section,
            content_html: generatedContent,
            status: 'completed',
          });
        } else {
          // Mark section as error
          await this.supabase
            .from('pisarz_content_sections')
            .update({ status: 'error' })
            .eq('id', section.id);

          throw new Error(`Failed to generate content for section ${i}: ${result.data.error}`);
        }
      }

      // Combine all sections into final content
      const { data: completedSections } = await this.supabase
        .from('pisarz_content_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order', { ascending: true });

      const fullContentHtml = completedSections
        ?.map(s => `${s.heading_html}\n${s.content_html}`)
        .join('\n\n') || '';

      const fullContentText = fullContentHtml
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n');

      // Save final content
      await this.supabase.from('pisarz_generated_content').upsert({
        project_id: projectId,
        content_html: fullContentHtml,
        content_text: fullContentText,
      });

      await this.completeWorkflowRun(run!.id, 'completed');
      await this.updateProjectStatus(projectId, 'completed', 5);

      return { success: true, contentHtml: fullContentHtml, contentText: fullContentText };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.completeWorkflowRun(run!.id, 'error', errorMessage);
      await this.updateProjectStatus(projectId, 'error');
      throw error;
    }
  }

  // Resume content generation from where it left off
  async resumeContentGeneration(projectId: string, onSectionComplete?: (section: ContentSection) => void) {
    return this.runContentGeneration(projectId, onSectionComplete);
  }
}

// Singleton instance
let orchestrator: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestrator) {
    orchestrator = new Orchestrator();
  }
  return orchestrator;
}
