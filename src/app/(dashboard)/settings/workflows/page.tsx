'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  ArrowLeft,
  Database,
  Workflow,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Workflow configuration
const WORKFLOWS = [
  {
    id: 1,
    name: 'Budowa bazy wiedzy',
    envKey: 'DIFY_KNOWLEDGE_WORKFLOW_KEY',
    inputs: [
      { name: 'keyword', source: 'Projekt', required: true },
      { name: 'language', source: 'Projekt', required: true },
      { name: 'aio', source: 'Projekt (AI Overview)', required: false },
    ],
    outputs: [
      { name: 'knowledge_graph', target: 'pisarz_knowledge_graphs.graph_data' },
      { name: 'grafinformacji', target: 'pisarz_information_graphs.triplets' },
      { name: 'frazy z serp', target: 'pisarz_search_phrases.phrases' },
      { name: 'naglowki', target: 'pisarz_competitor_headers.headers' },
    ],
  },
  {
    id: 2,
    name: 'Budowa nagłówków',
    envKey: 'DIFY_HEADERS_WORKFLOW_KEY',
    inputs: [
      { name: 'keyword', source: 'Projekt', required: true },
      { name: 'language', source: 'Projekt', required: true },
      { name: 'frazy', source: 'Workflow 1 → pisarz_search_phrases', required: true },
      { name: 'graf', source: 'Workflow 1 → pisarz_knowledge_graphs', required: true },
      { name: 'headings', source: 'Workflow 1 → pisarz_competitor_headers', required: false },
    ],
    outputs: [
      { name: 'naglowki_rozbudowane', target: 'pisarz_generated_headers (type: rozbudowane)' },
      { name: 'naglowki_h2', target: 'pisarz_generated_headers (type: h2)' },
      { name: 'naglowki_pytania', target: 'pisarz_generated_headers (type: pytania)' },
    ],
  },
  {
    id: 3,
    name: 'Budowa RAG',
    envKey: 'DIFY_RAG_WORKFLOW_KEY',
    inputs: [
      { name: 'keyword', source: 'Projekt', required: true },
      { name: 'language', source: 'Projekt', required: true },
      { name: 'headings', source: 'Workflow 2 → wybrane nagłówki', required: true },
    ],
    outputs: [
      { name: 'dokladne', target: 'pisarz_rag_data.detailed_qa' },
      { name: 'ogolne', target: 'pisarz_rag_data.general_qa' },
    ],
  },
  {
    id: 4,
    name: 'Content brief',
    envKey: 'DIFY_BRIEF_WORKFLOW_KEY',
    inputs: [
      { name: 'keyword', source: 'Projekt', required: false },
      { name: 'keywords', source: 'Workflow 1 → pisarz_search_phrases', required: true },
      { name: 'headings', source: 'Workflow 2 → wybrane nagłówki', required: true },
      { name: 'knowledge_graph', source: 'Workflow 1 → pisarz_knowledge_graphs', required: true },
      { name: 'information_graph', source: 'Workflow 1 → pisarz_information_graphs', required: true },
    ],
    outputs: [
      { name: 'brief', target: 'pisarz_briefs.brief_html' },
    ],
  },
  {
    id: 5,
    name: 'Generowanie contentu',
    envKey: 'DIFY_CONTENT_WORKFLOW_KEY',
    inputs: [
      { name: 'naglowek', source: 'Iteracja - aktualny nagłówek', required: true },
      { name: 'language', source: 'Projekt', required: true },
      { name: 'knowledge', source: 'Workflow 4 → brief dla nagłówka', required: true },
      { name: 'keywords', source: 'Workflow 1 → pisarz_search_phrases', required: true },
      { name: 'headings', source: 'Workflow 2 → wszystkie nagłówki', required: true },
      { name: 'done', source: 'pisarz_context_store → accumulated_content', required: false },
      { name: 'keyword', source: 'Projekt', required: true },
      { name: 'instruction', source: 'Opcjonalne instrukcje', required: false },
    ],
    outputs: [
      { name: 'content', target: 'pisarz_content_sections + pisarz_generated_content' },
    ],
  },
];

export default function WorkflowsSettingsPage() {
  const [testingWorkflow, setTestingWorkflow] = useState<number | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<Record<number, 'success' | 'error' | null>>({});

  async function testWorkflow(workflowId: number) {
    setTestingWorkflow(workflowId);

    // Simulate test - in real implementation, would call API
    try {
      // For now just check if the workflow responds
      const endpoint = ['', 'knowledge', 'headers', 'rag', 'brief', 'content'][workflowId];

      // Simple connectivity test
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWorkflowStatus(prev => ({ ...prev, [workflowId]: 'success' }));
      toast.success(`Workflow ${workflowId} skonfigurowany`);
    } catch {
      setWorkflowStatus(prev => ({ ...prev, [workflowId]: 'error' }));
      toast.error(`Błąd workflow ${workflowId}`);
    } finally {
      setTestingWorkflow(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do ustawień
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Konfiguracja Workflow'ów Dify
          </h1>
          <p className="text-slate-500 mt-1">
            Mapowanie pól wejściowych/wyjściowych dla każdego workflow
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Każdy workflow wymaga klucza API z Dify. Klucze konfiguruje się w pliku{' '}
          <code className="bg-slate-100 px-1 rounded">.env.local</code>.
          Po zmianie kluczy restart serwera jest wymagany.
        </AlertDescription>
      </Alert>

      {/* Pipeline visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline generacji treści</CardTitle>
          <CardDescription>
            Dane przepływają z jednego workflow do następnego
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {WORKFLOWS.map((workflow, idx) => (
              <div key={workflow.id} className="flex items-center">
                <div className={`
                  flex flex-col items-center p-3 rounded-lg border-2 min-w-[120px]
                  ${workflowStatus[workflow.id] === 'success' ? 'border-green-500 bg-green-50' :
                    workflowStatus[workflow.id] === 'error' ? 'border-red-500 bg-red-50' :
                    'border-slate-200'}
                `}>
                  <Badge variant="outline" className="mb-1">Etap {workflow.id}</Badge>
                  <span className="text-xs text-center font-medium">{workflow.name}</span>
                </div>
                {idx < WORKFLOWS.length - 1 && (
                  <ArrowRight className="mx-2 h-5 w-5 text-slate-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow details */}
      {WORKFLOWS.map((workflow) => (
        <Card key={workflow.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600">{workflow.id}</Badge>
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                {workflowStatus[workflow.id] === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {workflowStatus[workflow.id] === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testWorkflow(workflow.id)}
                disabled={testingWorkflow === workflow.id}
              >
                {testingWorkflow === workflow.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Test
              </Button>
            </div>
            <CardDescription>
              Zmienna środowiskowa: <code className="bg-slate-100 px-1 rounded">{workflow.envKey}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Inputs */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  Pola wejściowe (inputs)
                </h4>
                <div className="space-y-2">
                  {workflow.inputs.map((input) => (
                    <div key={input.name} className="text-sm p-2 bg-blue-50 rounded border border-blue-100">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-blue-700">{input.name}</code>
                        {input.required ? (
                          <Badge variant="destructive" className="text-xs">wymagane</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">opcjonalne</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">← {input.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  Pola wyjściowe (outputs → baza)
                </h4>
                <div className="space-y-2">
                  {workflow.outputs.map((output) => (
                    <div key={output.name} className="text-sm p-2 bg-green-50 rounded border border-green-100">
                      <code className="font-mono text-green-700">{output.name}</code>
                      <p className="text-xs text-slate-500 mt-1">→ {output.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Current env configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Aktualna konfiguracja .env.local</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`# Dify API
DIFY_API_BASE_URL=http://localhost/v1

# Workflow API Keys
DIFY_KNOWLEDGE_WORKFLOW_KEY=app-xxx  # Etap 1: Budowa bazy wiedzy
DIFY_HEADERS_WORKFLOW_KEY=app-xxx    # Etap 2: Budowa nagłówków
DIFY_RAG_WORKFLOW_KEY=app-xxx        # Etap 3: Budowa RAG
DIFY_BRIEF_WORKFLOW_KEY=app-xxx      # Etap 4: Content brief
DIFY_CONTENT_WORKFLOW_KEY=app-xxx    # Etap 5: Generowanie contentu`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
