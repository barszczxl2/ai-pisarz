'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PipelineCompact } from '@/components/workflow/pipeline';
import {
  Plus,
  Search,
  FolderKanban,
  ArrowRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { Project, ProjectStatus } from '@/types/database';
import { STATUS_LABELS } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pisarz_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }

    setIsLoading(false);
  }

  async function deleteProject(projectId: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('pisarz_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast.error('Nie udało się usunąć projektu');
    } else {
      toast.success('Projekt został usunięty');
      setProjects(projects.filter(p => p.id !== projectId));
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.keyword
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Szukaj projektów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="draft">Szkic</SelectItem>
              <SelectItem value="knowledge_building">Budowa wiedzy</SelectItem>
              <SelectItem value="headers_generated">Nagłówki wygenerowane</SelectItem>
              <SelectItem value="headers_selected">Nagłówki wybrane</SelectItem>
              <SelectItem value="rag_created">RAG utworzony</SelectItem>
              <SelectItem value="brief_created">Brief utworzony</SelectItem>
              <SelectItem value="content_generating">Generowanie treści</SelectItem>
              <SelectItem value="completed">Ukończone</SelectItem>
              <SelectItem value="error">Błąd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/projects/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Nowy projekt
          </Button>
        </Link>
      </div>

      {/* Projects list */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Brak projektów spełniających kryteria'
                : 'Brak projektów'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link href="/projects/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Utwórz pierwszy projekt
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-2 pr-8">{project.keyword}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <PipelineCompact
                  currentStage={project.current_stage}
                  status={project.status}
                />

                <div className="text-xs text-slate-500">
                  Utworzono: {new Date(project.created_at).toLocaleDateString('pl-PL')}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      Otwórz
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usuń projekt</AlertDialogTitle>
                        <AlertDialogDescription>
                          Czy na pewno chcesz usunąć projekt &quot;{project.keyword}&quot;?
                          Ta operacja jest nieodwracalna.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject(project.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Usuń
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
