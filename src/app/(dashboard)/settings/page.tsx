'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Info,
  Key,
  Database,
  Workflow,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationStatus {
  connected: boolean | null;
  testing: boolean;
}

export default function SettingsPage() {
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, IntegrationStatus>>({
    serpdata: { connected: null, testing: false },
    supabase: { connected: null, testing: false },
  });
  const [testKeyword, setTestKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, unknown> | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function testSerpData() {
    setIntegrationStatus(prev => ({
      ...prev,
      serpdata: { ...prev.serpdata, testing: true }
    }));

    try {
      const response = await fetch('/api/serpdata');
      const result = await response.json();

      setIntegrationStatus(prev => ({
        ...prev,
        serpdata: { testing: false, connected: result.success }
      }));

      if (result.success) {
        toast.success('Połączenie z SerpData.io działa!');
      } else {
        toast.error(`Błąd: ${result.message}`);
      }
    } catch {
      setIntegrationStatus(prev => ({
        ...prev,
        serpdata: { testing: false, connected: false }
      }));
      toast.error('Nie udało się połączyć z SerpData.io');
    }
  }

  async function testSupabase() {
    setIntegrationStatus(prev => ({
      ...prev,
      supabase: { ...prev.supabase, testing: true }
    }));

    try {
      const response = await fetch('/api/projects');
      const connected = response.ok;

      setIntegrationStatus(prev => ({
        ...prev,
        supabase: { testing: false, connected }
      }));

      if (connected) {
        toast.success('Połączenie z Supabase działa!');
      } else {
        toast.error('Błąd połączenia z Supabase');
      }
    } catch {
      setIntegrationStatus(prev => ({
        ...prev,
        supabase: { testing: false, connected: false }
      }));
      toast.error('Nie udało się połączyć z Supabase');
    }
  }

  async function searchSerp() {
    if (!testKeyword.trim()) {
      toast.error('Wprowadź słowo kluczowe');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);

    try {
      const response = await fetch('/api/serpdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: testKeyword, num: 5 }),
      });

      const result = await response.json();

      if (response.ok) {
        setSearchResults(result);
        toast.success('Wyszukiwanie zakończone');
      } else {
        toast.error(result.error || 'Błąd wyszukiwania');
      }
    } catch {
      toast.error('Błąd połączenia z API');
    } finally {
      setIsSearching(false);
    }
  }

  function StatusBadge({ status }: { status: IntegrationStatus }) {
    if (status.testing) {
      return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Testowanie...</Badge>;
    }
    if (status.connected === true) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Połączono</Badge>;
    }
    if (status.connected === false) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Błąd</Badge>;
    }
    return <Badge variant="secondary">Skonfigurowano</Badge>;
  }

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

      {/* SerpData.io Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-orange-600" />
            SerpData.io
            <StatusBadge status={integrationStatus.serpdata} />
          </CardTitle>
          <CardDescription>
            API do wyszukiwania wyników Google (SERP) - analiza konkurencji i AI Overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SERPDATA_API_KEY</Label>
            <div className="flex gap-2">
              <Input
                value="serpdata_****...****Cxyc"
                disabled
                className="bg-slate-50 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={testSerpData}
                disabled={integrationStatus.serpdata.testing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${integrationStatus.serpdata.testing ? 'animate-spin' : ''}`} />
                Test
              </Button>
            </div>
            <p className="text-xs text-slate-500">Klucz API z serpdata.io</p>
          </div>

          <div className="space-y-2">
            <Label>SERPDATA_BASE_URL</Label>
            <Input
              value="https://api.serpdata.io/v1"
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Bazowy URL API</p>
          </div>

          <Separator />

          {/* Test Search */}
          <div className="space-y-3">
            <Label>Test wyszukiwania SERP</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Wprowadź słowo kluczowe..."
                value={testKeyword}
                onChange={(e) => setTestKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSerp()}
              />
              <Button onClick={searchSerp} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {searchResults && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Wyniki:</p>
              <pre className="text-xs overflow-auto max-h-48 p-2 bg-white rounded border">
                {JSON.stringify(searchResults, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <a
              href="https://serpdata.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              Otwórz SerpData.io
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Supabase Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Supabase
            <StatusBadge status={integrationStatus.supabase} />
          </CardTitle>
          <CardDescription>
            Baza danych PostgreSQL i real-time subscriptions (self-hosted)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>NEXT_PUBLIC_SUPABASE_URL</Label>
            <div className="flex gap-2">
              <Input
                value={process.env.NEXT_PUBLIC_SUPABASE_URL ? '***configured***' : 'Not configured'}
                disabled
                className="bg-slate-50 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={testSupabase}
                disabled={integrationStatus.supabase.testing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${integrationStatus.supabase.testing ? 'animate-spin' : ''}`} />
                Test
              </Button>
            </div>
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
            <Badge variant="outline">Wymaga konfiguracji</Badge>
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

          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/settings/workflows"
              className="inline-flex items-center text-sm text-purple-600 hover:underline font-medium"
            >
              Konfiguracja workflow'ów i mapowanie pól
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
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

# SerpData.io
SERPDATA_API_KEY=serpdata_xxx
SERPDATA_BASE_URL=https://api.serpdata.io/v1

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
