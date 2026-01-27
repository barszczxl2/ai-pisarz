'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  XCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowRun } from '@/types/database';
import { STAGE_NAMES } from '@/types/database';

interface ProcessPanelProps {
  projectId: string;
  onProcessKilled?: () => void;
}

export function ProcessPanel({ projectId, onProcessKilled }: ProcessPanelProps) {
  const [processes, setProcesses] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [killingIds, setKillingIds] = useState<Set<string>>(new Set());

  const loadProcesses = useCallback(async () => {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from('pisarz_workflow_runs')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (data) {
      setProcesses(data);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadProcesses();

    // Set up realtime subscription for workflow runs
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('workflow-runs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pisarz_workflow_runs',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadProcesses();
        }
      )
      .subscribe();

    // Poll every 5 seconds for running processes
    const interval = setInterval(() => {
      if (processes.some(p => p.status === 'running')) {
        loadProcesses();
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [projectId, loadProcesses, processes]);

  async function killProcess(runId: string) {
    setKillingIds(prev => new Set(prev).add(runId));

    try {
      const response = await fetch('/api/workflows/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, projectId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel workflow');
      }

      toast.success('Proces został zatrzymany');
      await loadProcesses();
      onProcessKilled?.();
    } catch (error) {
      console.error('Kill process error:', error);
      toast.error(error instanceof Error ? error.message : 'Nie udało się zatrzymać procesu');
    } finally {
      setKillingIds(prev => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }

  async function clearCompletedProcesses() {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('pisarz_workflow_runs')
      .delete()
      .eq('project_id', projectId)
      .in('status', ['completed', 'error', 'cancelled']);

    if (error) {
      toast.error('Nie udało się wyczyścić historii');
    } else {
      toast.success('Historia wyczyszczona');
      await loadProcesses();
    }
  }

  const runningProcesses = processes.filter(p => p.status === 'running');
  const otherProcesses = processes.filter(p => p.status !== 'running');

  function getStatusIcon(status: string) {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      running: 'default',
      completed: 'secondary',
      error: 'destructive',
      cancelled: 'outline',
      pending: 'outline',
    };

    const labels: Record<string, string> = {
      running: 'Uruchomiony',
      completed: 'Zakończony',
      error: 'Błąd',
      cancelled: 'Anulowany',
      pending: 'Oczekuje',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatDuration(start: string, end?: string | null) {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Panel procesów
          {runningProcesses.length > 0 && (
            <Badge variant="default" className="ml-2 bg-blue-500">
              {runningProcesses.length} aktywnych
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadProcesses}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {otherProcesses.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCompletedProcesses}>
              <Trash2 className="h-4 w-4 mr-1" />
              Wyczyść
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {processes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Brak procesów workflow
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {/* Running processes first */}
              {runningProcesses.map((process) => (
                <div
                  key={process.id}
                  className="flex items-center justify-between p-3 rounded-lg border-2 border-blue-200 bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(process.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{STAGE_NAMES[process.stage]}</span>
                        {getStatusBadge(process.status)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Start: {formatTime(process.started_at)} •
                        Czas: {formatDuration(process.started_at, process.completed_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => killProcess(process.id)}
                    disabled={killingIds.has(process.id)}
                  >
                    {killingIds.has(process.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Zatrzymaj
                      </>
                    )}
                  </Button>
                </div>
              ))}

              {/* Other processes */}
              {otherProcesses.map((process) => (
                <div
                  key={process.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(process.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{STAGE_NAMES[process.stage]}</span>
                        {getStatusBadge(process.status)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatTime(process.started_at)}
                        {process.completed_at && ` • ${formatDuration(process.started_at, process.completed_at)}`}
                      </div>
                      {process.error_message && (
                        <div className="text-xs text-red-500 mt-1">
                          {process.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
