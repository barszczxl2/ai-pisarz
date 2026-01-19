'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Key, Database, Workflow, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Konfiguracja</AlertTitle>
        <AlertDescription>
          Zmienne środowiskowe należy skonfigurować w pliku <code className="rounded bg-slate-100 px-1">.env.local</code>{' '}
          w katalogu głównym projektu. Po zmianie wartości wymagane jest ponowne uruchomienie serwera.
        </AlertDescription>
      </Alert>

      {/* Supabase Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Supabase
          </CardTitle>
          <CardDescription>
            Baza danych PostgreSQL i real-time subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>NEXT_PUBLIC_SUPABASE_URL</Label>
            <Input
              value={process.env.NEXT_PUBLIC_SUPABASE_URL ? '***configured***' : 'Not configured'}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">URL projektu Supabase</p>
          </div>

          <div className="space-y-2">
            <Label>NEXT_PUBLIC_SUPABASE_ANON_KEY</Label>
            <Input
              value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***configured***' : 'Not configured'}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Publiczny klucz anon Supabase</p>
          </div>

          <div className="space-y-2">
            <Label>SUPABASE_SERVICE_ROLE_KEY</Label>
            <Input
              value="***hidden***"
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Service role key (tylko po stronie serwera)</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              Otwórz Supabase Dashboard
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Dify Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-purple-600" />
            Dify Workflows
          </CardTitle>
          <CardDescription>
            Klucze API do 5 workflow&apos;ów generacji treści
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>DIFY_API_BASE_URL</Label>
            <Input
              value={process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1'}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Bazowy URL API Dify</p>
          </div>

          <Separator />

          {[
            { key: 'DIFY_KNOWLEDGE_WORKFLOW_KEY', name: 'Budowa wiedzy', stage: 1 },
            { key: 'DIFY_HEADERS_WORKFLOW_KEY', name: 'Generowanie nagłówków', stage: 2 },
            { key: 'DIFY_RAG_WORKFLOW_KEY', name: 'Budowa RAG', stage: 3 },
            { key: 'DIFY_BRIEF_WORKFLOW_KEY', name: 'Content brief', stage: 4 },
            { key: 'DIFY_CONTENT_WORKFLOW_KEY', name: 'Generowanie contentu', stage: 5 },
          ].map((workflow) => (
            <div key={workflow.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>{workflow.key}</Label>
                <Badge variant="outline" className="text-xs">
                  Etap {workflow.stage}
                </Badge>
              </div>
              <Input
                value="***hidden***"
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                Klucz API dla workflow &quot;{workflow.name}&quot;
              </p>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <a
              href="https://cloud.dify.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              Otwórz Dify Dashboard
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Environment file template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            Szablon .env.local
          </CardTitle>
          <CardDescription>
            Skopiuj poniższy szablon i uzupełnij własnymi kluczami
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Dify
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_KNOWLEDGE_WORKFLOW_KEY=app-xxx
DIFY_HEADERS_WORKFLOW_KEY=app-xxx
DIFY_RAG_WORKFLOW_KEY=app-xxx
DIFY_BRIEF_WORKFLOW_KEY=app-xxx
DIFY_CONTENT_WORKFLOW_KEY=app-xxx`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
