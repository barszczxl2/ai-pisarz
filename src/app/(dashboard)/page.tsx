'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineCompact } from '@/components/workflow/pipeline';
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { Project } from '@/types/database';
import { STATUS_LABELS } from '@/types/database';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    error: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pisarz_projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setProjects(data);

      // Calculate stats
      const { data: allProjects } = await supabase.from('pisarz_projects').select('status');
      if (allProjects) {
        setStats({
          total: allProjects.length,
          inProgress: allProjects.filter(
            (p: { status: string }) => !['completed', 'error', 'draft'].includes(p.status)
          ).length,
          completed: allProjects.filter((p: { status: string }) => p.status === 'completed').length,
          error: allProjects.filter((p: { status: string }) => p.status === 'error').length,
        });
      }
    }

    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wszystkie projekty</CardTitle>
            <FolderKanban className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">W trakcie</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukończone</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Błędy</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Szybkie akcje</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nowy projekt
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline">
              <FolderKanban className="mr-2 h-4 w-4" />
              Wszystkie projekty
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ostatnie projekty</span>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                Zobacz wszystkie
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="py-8 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500">Brak projektów</p>
              <Link href="/projects/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Utwórz pierwszy projekt
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-slate-50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <p className="font-medium">{project.keyword}</p>
                        <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-4">
                        <PipelineCompact
                          currentStage={project.current_stage}
                          status={project.status}
                        />
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
