'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pipeline } from '@/components/workflow/pipeline';
import { HeaderSelection } from '@/components/workflow/header-selection';
import { ContentPreview, ContentFull } from '@/components/workflow/content-preview';
import { StageEditor } from '@/components/workflow/stage-editor';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCw,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  Project,
  GeneratedHeaders,
  ContentSection,
  Brief,
  WorkflowRun,
} from '@/types/database';
import { STATUS_LABELS, STAGE_NAMES } from '@/types/database';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [headers, setHeaders] = useState<GeneratedHeaders[]>([]);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const loadProject = useCallback(async () => {
    const supabase = getSupabaseClient();

    const { data: projectData } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectData) {
      setProject(projectData);

      // Load related data based on stage
      if (projectData.current_stage >= 2) {
        const { data: headersData } = await supabase
          .from('pisarz_generated_headers')
          .select('*')
          .eq('project_id', projectId);

        if (headersData) {
          setHeaders(headersData as GeneratedHeaders[]);
          const selected = (headersData as GeneratedHeaders[]).find((h: GeneratedHeaders) => h.is_selected);
          if (selected) {
            setSelectedHeaderId(selected.id);
          }
        }
      }

      if (projectData.current_stage >= 4) {
        const { data: briefData } = await supabase
          .from('pisarz_briefs')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (briefData) {
          setBrief(briefData);
        }
      }

      if (projectData.current_stage >= 5) {
        const { data: sectionsData } = await supabase
          .from('pisarz_content_sections')
          .select('*')
          .eq('project_id', projectId)
          .order('section_order', { ascending: true });

        if (sectionsData) {
          setSections(sectionsData);
        }
      }

      const { data: runsData } = await supabase
        .from('pisarz_workflow_runs')
        .select('*')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false });

      if (runsData) {
        setWorkflowRuns(runsData);
      }
    }

    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadProject();

    // Set up realtime subscription
    const supabase = getSupabaseClient();

    const projectChannel = supabase
      .channel('project-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pisarz_projects',
          filter: `id=eq.${projectId}`,
        },
        (payload: { new: Record<string, unknown> | null }) => {
          if (payload.new) {
            setProject(payload.new as unknown as Project);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pisarz_content_sections',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: { eventType: string; new: Record<string, unknown> | null }) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newSection = payload.new as unknown as ContentSection;
            setSections(prev =>
              prev.map(s => (s.id === newSection.id ? newSection : s))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
    };
  }, [projectId, loadProject]);

  async function runWorkflow(stage: number) {
    setIsRunning(true);

    try {
      const response = await fetch(`/api/workflows/${getStageEndpoint(stage)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Workflow failed');
      }

      toast.success(`${STAGE_NAMES[stage]} zakończono pomyślnie`);
      await loadProject();
    } catch (error) {
      console.error('Workflow error:', error);
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd');
    } finally {
      setIsRunning(false);
    }
  }

  function getStageEndpoint(stage: number): string {
    switch (stage) {
      case 1: return 'knowledge';
      case 2: return 'headers';
      case 3: return 'rag';
      case 4: return 'brief';
      case 5: return 'content';
      default: return '';
    }
  }

  async function rerunFromStage(stage: number) {
    if (!confirm(`Czy na pewno chcesz ponownie uruchomić od etapu "${STAGE_NAMES[stage]}"? Dane z kolejnych etapów zostaną usunięte.`)) {
      return;
    }

    setIsRunning(true);

    try {
      const supabase = getSupabaseClient();

      // Reset project to previous stage
      const previousStage = stage - 1;
      const statusMap: Record<number, string> = {
        0: 'draft',
        1: 'knowledge_building',
        2: 'headers_generated',
        3: 'rag_created',
        4: 'brief_created',
      };

      // Delete data from current and later stages
      if (stage <= 2) {
        await supabase.from('pisarz_generated_headers').delete().eq('project_id', projectId);
      }
      if (stage <= 3) {
        await supabase.from('pisarz_rag_data').delete().eq('project_id', projectId);
      }
      if (stage <= 4) {
        await supabase.from('pisarz_briefs').delete().eq('project_id', projectId);
        await supabase.from('pisarz_content_sections').delete().eq('project_id', projectId);
        await supabase.from('pisarz_context_store').delete().eq('project_id', projectId);
      }
      if (stage <= 5) {
        await supabase.from('pisarz_generated_content').delete().eq('project_id', projectId);
      }

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({
          current_stage: previousStage,
          status: statusMap[previousStage] || 'draft',
        })
        .eq('id', projectId);

      toast.success(`Zresetowano do etapu ${previousStage}. Uruchamiam ${STAGE_NAMES[stage]}...`);

      // Run the workflow
      await runWorkflow(stage);
    } catch (error) {
      console.error('Rerun error:', error);
      toast.error('Nie udało się ponownie uruchomić workflow');
      setIsRunning(false);
    }
  }

  async function handleStageDataChanged(stage: number) {
    // When stage data is edited, offer to regenerate from next stage
    const nextStage = stage + 1;
    if (nextStage <= 5 && project && project.current_stage >= nextStage) {
      const shouldRegenerate = confirm(
        `Dane etapu "${STAGE_NAMES[stage]}" zostały zmienione. Czy chcesz ponownie wygenerować kolejne etapy od "${STAGE_NAMES[nextStage]}"?`
      );

      if (shouldRegenerate) {
        await rerunFromStage(nextStage);
      }
    }

    // Reload project data
    await loadProject();
  }

  async function selectHeaders(headerId: string) {
    setSelectedHeaderId(headerId);
  }

  async function confirmHeaderSelection() {
    if (!selectedHeaderId) return;

    setIsRunning(true);

    try {
      const supabase = getSupabaseClient();

      // Deselect all headers first
      await supabase
        .from('pisarz_generated_headers')
        .update({ is_selected: false })
        .eq('project_id', projectId);

      // Select the chosen header
      await supabase
        .from('pisarz_generated_headers')
        .update({ is_selected: true })
        .eq('id', selectedHeaderId);

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({ status: 'headers_selected' })
        .eq('id', projectId);

      toast.success('Nagłówki zostały wybrane');
      await loadProject();
    } catch (error) {
      console.error('Error selecting headers:', error);
      toast.error('Nie udało się zapisać wyboru');
    } finally {
      setIsRunning(false);
    }
  }

  async function exportContent(format: 'html' | 'markdown') {
    if (!project) return;

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('pisarz_generated_content')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!data) {
      toast.error('Brak wygenerowanej treści');
      return;
    }

    let content = format === 'html' ? data.content_html : data.content_text;
    const filename = `${project.keyword.replace(/\s+/g, '-')}.${format === 'html' ? 'html' : 'md'}`;

    const blob = new Blob([content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Eksportowano jako ${format.toUpperCase()}`);
  }

  async function copyContent() {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('pisarz_generated_content')
      .select('content_html')
      .eq('project_id', projectId)
      .single();

    if (data?.content_html) {
      await navigator.clipboard.writeText(data.content_html);
      toast.success('Skopiowano do schowka');
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <p className="mt-4 text-slate-500">Projekt nie został znaleziony</p>
        <Link href="/projects">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Button>
        </Link>
      </div>
    );
  }

  const canRunStage = (stage: number): boolean => {
    if (isRunning) return false;

    switch (stage) {
      case 1:
        return project.current_stage === 0 || project.status === 'draft';
      case 2:
        return project.current_stage === 1;
      case 3:
        return project.status === 'headers_selected';
      case 4:
        return project.status === 'rag_created';
      case 5:
        return project.status === 'brief_created' || project.status === 'content_generating';
      default:
        return false;
    }
  };

  const getNextAction = () => {
    if (project.status === 'completed') return null;
    if (project.status === 'error') return { stage: project.current_stage, label: 'Ponów' };
    if (project.current_stage === 0 || project.status === 'draft') return { stage: 1, label: 'Rozpocznij budowę wiedzy' };
    if (project.current_stage === 1) return { stage: 2, label: 'Generuj nagłówki' };
    if (project.status === 'headers_generated') return null; // Need to select headers
    if (project.status === 'headers_selected') return { stage: 3, label: 'Buduj RAG' };
    if (project.status === 'rag_created') return { stage: 4, label: 'Twórz brief' };
    if (project.status === 'brief_created') return { stage: 5, label: 'Generuj treść' };
    return null;
  };

  const nextAction = getNextAction();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{project.keyword}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">{project.language}</Badge>
            <Badge
              variant={
                project.status === 'completed'
                  ? 'default'
                  : project.status === 'error'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>
        </div>

        {project.status === 'completed' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyContent}>
              <Copy className="mr-2 h-4 w-4" />
              Kopiuj
            </Button>
            <Button variant="outline" onClick={() => exportContent('html')}>
              <Download className="mr-2 h-4 w-4" />
              HTML
            </Button>
            <Button variant="outline" onClick={() => exportContent('markdown')}>
              <Download className="mr-2 h-4 w-4" />
              Markdown
            </Button>
          </div>
        )}
      </div>

      {/* Pipeline visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline generacji</CardTitle>
          <CardDescription>
            Etapy tworzenia artykułu SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Pipeline
            currentStage={project.current_stage}
            status={project.status}
            interactive={false}
          />

          {/* Info: wybierz nagłówki */}
          {project.status === 'headers_generated' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-amber-800 font-medium">
                Wybierz jeden z wariantów nagłówków poniżej
              </p>
            </div>
          )}

          {/* Wybrane nagłówki */}
          {headers.some(h => h.is_selected) && project.current_stage >= 2 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">Wybrane nagłówki:</p>
              <div
                className="prose prose-sm max-w-none text-green-900"
                dangerouslySetInnerHTML={{
                  __html: headers.find(h => h.is_selected)?.headers_html || ''
                }}
              />
            </div>
          )}

          {nextAction && (
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={() => runWorkflow(nextAction.stage)}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {nextAction.label}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Data Editor */}
      {project.current_stage >= 1 && (
        <StageEditor
          projectId={projectId}
          currentStage={project.current_stage}
          onDataChanged={handleStageDataChanged}
          isRunning={isRunning}
        />
      )}

      {/* Stage-specific content */}
      {project.status === 'headers_generated' && headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wybierz nagłówki</CardTitle>
            <CardDescription>
              Wybierz jeden z trzech wygenerowanych wariantów nagłówków
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HeaderSelection
              headers={headers}
              selectedHeaderId={selectedHeaderId}
              onSelect={selectHeaders}
              onConfirm={confirmHeaderSelection}
              isLoading={isRunning}
            />
          </CardContent>
        </Card>
      )}

      {/* Brief preview */}
      {brief && project.current_stage >= 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Brief contentu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: brief.brief_html || '' }}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Content generation progress */}
      {(project.status === 'content_generating' || project.status === 'completed') &&
        sections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {project.status === 'completed' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Wygenerowana treść
                  </>
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    Generowanie treści...
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.status === 'completed' ? (
                <ContentFull sections={sections} />
              ) : (
                <ContentPreview
                  sections={sections}
                  currentSectionIndex={
                    sections.findIndex(s => s.status === 'processing') ||
                    sections.filter(s => s.status === 'completed').length
                  }
                />
              )}
            </CardContent>
          </Card>
        )}

      {/* Workflow history */}
      {workflowRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historia workflow</CardTitle>
            <CardDescription>
              Kliknij &quot;Uruchom ponownie&quot; aby zregenerować od wybranego etapu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workflowRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {run.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : run.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : run.status === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-slate-200" />
                    )}
                    <div>
                      <span className="font-medium">{run.stage_name}</span>
                      <span className="ml-2 text-xs text-slate-400">Etap {run.stage}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {run.error_message && (
                      <span className="text-sm text-red-500">{run.error_message}</span>
                    )}
                    <span className="text-sm text-slate-500">
                      {new Date(run.started_at).toLocaleString('pl-PL')}
                    </span>
                    {run.status === 'completed' && !isRunning && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rerunFromStage(run.stage)}
                        className="ml-2"
                      >
                        <RotateCw className="mr-1 h-3 w-3" />
                        Ponów
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
