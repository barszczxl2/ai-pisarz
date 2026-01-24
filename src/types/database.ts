// Database types for Supabase

export type ProjectStatus = 'draft' | 'knowledge_building' | 'knowledge_built' | 'headers_generated' | 'headers_selected' | 'rag_created' | 'brief_created' | 'content_generating' | 'completed' | 'error';

// Google Trends types
export interface GoogleTrend {
  id: number;
  trend_id: string;
  keyword: string;
  approx_traffic: number | null;
  pub_date: string;
  description: string | null;
  media: string | null;
  media_links: string | null;
  picture: string | null;
  picture_source: string | null;
  has_interia: boolean;
  fetched_at: string;
  created_at: string;
}

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'error' | 'cancelled';

export type HeaderType = 'rozbudowane' | 'h2' | 'pytania';

export type SectionStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface Project {
  id: string;
  keyword: string;
  language: string;
  ai_overview_content: string | null;
  current_stage: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraph {
  id: string;
  project_id: string;
  graph_data: Record<string, unknown> | null;
  created_at: string;
}

export interface InformationGraph {
  id: string;
  project_id: string;
  triplets: Record<string, unknown> | null;
  created_at: string;
}

export interface SearchPhrases {
  id: string;
  project_id: string;
  phrases: string | null;
  created_at: string;
}

export interface CompetitorHeaders {
  id: string;
  project_id: string;
  headers: string | null;
  created_at: string;
}

export interface GeneratedHeaders {
  id: string;
  project_id: string;
  header_type: HeaderType;
  headers_html: string | null;
  headers_json: Record<string, unknown> | null;
  is_selected: boolean;
  created_at: string;
}

export interface RagData {
  id: string;
  project_id: string;
  detailed_qa: string | null;
  general_qa: string | null;
  created_at: string;
}

export interface Brief {
  id: string;
  project_id: string;
  brief_json: BriefItem[] | null;
  brief_html: string | null;
  created_at: string;
}

export interface BriefItem {
  heading: string;
  knowledge: string;
  keywords: string;
}

export interface GeneratedContent {
  id: string;
  project_id: string;
  content_html: string | null;
  content_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSection {
  id: string;
  project_id: string;
  section_order: number;
  heading_html: string;
  heading_knowledge: string | null;
  heading_keywords: string | null;
  content_html: string | null;
  status: SectionStatus;
  created_at: string;
  updated_at: string;
}

export interface ContextStore {
  id: string;
  project_id: string;
  accumulated_content: string;
  current_heading_index: number;
  updated_at: string;
}

export interface TokenDetail {
  node_id: string;
  node_type: string;
  node_title: string;
  total_tokens: number;
  model_name?: string;
  model_provider?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
}

export interface WorkflowRun {
  id: string;
  project_id: string;
  stage: number;
  stage_name: string | null;
  status: WorkflowStatus;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  total_tokens?: number;
  token_details?: TokenDetail[];
}

// Extended types with relations
export interface ProjectWithRelations extends Project {
  knowledge_graphs?: KnowledgeGraph[];
  information_graphs?: InformationGraph[];
  search_phrases?: SearchPhrases[];
  competitor_headers?: CompetitorHeaders[];
  generated_headers?: GeneratedHeaders[];
  rag_data?: RagData[];
  briefs?: Brief[];
  generated_content?: GeneratedContent[];
  content_sections?: ContentSection[];
  context_store?: ContextStore;
  workflow_runs?: WorkflowRun[];
}

// Dify workflow response types
export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs: Record<string, unknown>;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

// Stage definitions
export const STAGES = {
  KNOWLEDGE_BUILDING: 1,
  HEADER_GENERATION: 2,
  RAG_CREATION: 3,
  BRIEF_CREATION: 4,
  CONTENT_GENERATION: 5,
} as const;

export const STAGE_NAMES: Record<number, string> = {
  0: 'Nowy projekt',
  1: 'Budowa wiedzy',
  2: 'Generowanie nagłówków',
  3: 'Budowa RAG',
  4: 'Tworzenie briefu',
  5: 'Generowanie treści',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Szkic',
  knowledge_building: 'Budowa wiedzy',
  knowledge_built: 'Wiedza zbudowana',
  headers_generated: 'Nagłówki wygenerowane',
  headers_selected: 'Nagłówki wybrane',
  rag_created: 'RAG utworzony',
  brief_created: 'Brief utworzony',
  content_generating: 'Generowanie treści',
  completed: 'Ukończono',
  error: 'Błąd',
};
