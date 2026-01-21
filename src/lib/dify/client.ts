// Dify API Client for workflow execution

export interface DifyWorkflowInputs {
  [key: string]: string | number | boolean;
}

export interface DifyWorkflowResult {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs: Record<string, string>;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

export type WorkflowType = 'knowledge' | 'headers' | 'rag' | 'brief' | 'content';

const WORKFLOW_KEYS: Record<WorkflowType, string> = {
  knowledge: process.env.DIFY_KNOWLEDGE_WORKFLOW_KEY || '',
  headers: process.env.DIFY_HEADERS_WORKFLOW_KEY || '',
  rag: process.env.DIFY_RAG_WORKFLOW_KEY || '',
  brief: process.env.DIFY_BRIEF_WORKFLOW_KEY || '',
  content: process.env.DIFY_CONTENT_WORKFLOW_KEY || '',
};

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';

export class DifyClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DIFY_API_BASE;
  }

  private getApiKey(workflowType: WorkflowType): string {
    const key = WORKFLOW_KEYS[workflowType];
    if (!key) {
      throw new Error(`Missing API key for workflow: ${workflowType}`);
    }
    return key;
  }

  async runWorkflow(
    workflowType: WorkflowType,
    inputs: DifyWorkflowInputs,
    userId: string = 'default-user'
  ): Promise<DifyWorkflowResult> {
    const apiKey = this.getApiKey(workflowType);

    const response = await fetch(`${this.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        response_mode: 'blocking',
        user: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async runWorkflowStreaming(
    workflowType: WorkflowType,
    inputs: DifyWorkflowInputs,
    userId: string = 'default-user',
    onEvent?: (event: DifyStreamEvent) => void
  ): Promise<DifyWorkflowResult | null> {
    const apiKey = this.getApiKey(workflowType);

    const response = await fetch(`${this.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        response_mode: 'streaming',
        user: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let result: DifyWorkflowResult | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        try {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          if (jsonStr.trim()) {
            const event = JSON.parse(jsonStr) as DifyStreamEvent;
            onEvent?.(event);

            if (event.event === 'workflow_finished') {
              result = {
                workflow_run_id: event.workflow_run_id,
                task_id: event.task_id,
                data: event.data as DifyWorkflowResult['data'],
              };
            }
          }
        } catch (e) {
          console.warn('Failed to parse SSE event:', e);
        }
      }
    }

    return result;
  }
}

export interface DifyStreamEvent {
  event: 'workflow_started' | 'node_started' | 'node_finished' | 'workflow_finished' | 'error';
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs?: Record<string, string>;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps?: number;
    created_at?: number;
    finished_at?: number;
  };
}

// Singleton instance
let difyClient: DifyClient | null = null;

export function getDifyClient(): DifyClient {
  if (!difyClient) {
    difyClient = new DifyClient();
  }
  return difyClient;
}

// Workflow-specific input types
export interface KnowledgeWorkflowInputs {
  keyword: string;
  language: string;
  ai_overview_content?: string;
}

export interface HeadersWorkflowInputs {
  keyword: string;
  language: string;
  frazy: string; // search phrases
  graf: string; // knowledge graph
  headings?: string; // competitor headers
}

export interface RagWorkflowInputs {
  keyword: string;
  language: string;
  headings: string;
}

export interface BriefWorkflowInputs {
  keyword: string;
  keywords: string; // search phrases
  headings: string;
  knowledge_graph: string;
  information_graph: string;
}

export interface ContentWorkflowInputs {
  naglowek: string; // current heading
  language: string;
  knowledge: string;
  keywords: string;
  headings: string; // all headings for context
  done: string; // accumulated content (summaries of previous sections)
  keyword: string; // main keyword
  instruction?: string;
  // Nowe pola dla kontekstu
  last_section?: string; // pełna treść ostatniej sekcji (dla ciągłości)
  upcoming?: string; // plan przyszłych sekcji z brief
}

// Helper functions for running specific workflows
export async function runKnowledgeWorkflow(inputs: KnowledgeWorkflowInputs): Promise<DifyWorkflowResult> {
  const client = getDifyClient();
  return client.runWorkflow('knowledge', inputs as unknown as DifyWorkflowInputs);
}

export async function runHeadersWorkflow(inputs: HeadersWorkflowInputs): Promise<DifyWorkflowResult> {
  const client = getDifyClient();
  return client.runWorkflow('headers', inputs as unknown as DifyWorkflowInputs);
}

export async function runRagWorkflow(inputs: RagWorkflowInputs): Promise<DifyWorkflowResult> {
  const client = getDifyClient();
  return client.runWorkflow('rag', inputs as unknown as DifyWorkflowInputs);
}

export async function runBriefWorkflow(inputs: BriefWorkflowInputs): Promise<DifyWorkflowResult> {
  const client = getDifyClient();
  return client.runWorkflow('brief', inputs as unknown as DifyWorkflowInputs);
}

export async function runContentWorkflow(inputs: ContentWorkflowInputs): Promise<DifyWorkflowResult> {
  const client = getDifyClient();
  return client.runWorkflow('content', inputs as unknown as DifyWorkflowInputs);
}
