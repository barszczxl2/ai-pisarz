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

// Extended GoogleTrend with embedding data
export interface GoogleTrendWithEmbedding extends GoogleTrend {
  embedding: string | null;  // pgvector format: "[-0.07, 0.04, ...]"
  embedding_text: string | null;
}

// Semantic search result
export interface SemanticCluster {
  id: number;
  keyword: string;
  approx_traffic: number | null;
  description: string | null;
  has_interia: boolean;
  similarity: number;
}

// Gazetki (Blix promotional flyers) types
export interface GazetkaProduct {
  id: number;
  item_id: string;
  title: string;
  description: string | null;
  link: string | null;
  pub_date: string | null;
  context_query: string | null;
  embedding: string | null;
  embedding_text: string | null;
  fetched_at: string | null;
  created_at: string | null;
}

export interface ProductSearchResult {
  id: number;
  item_id: string;
  title: string;
  description: string | null;
  link: string | null;
  pub_date: string | null;
  context_query: string | null;
  similarity: number;
}

// OCR Products (rrs_blix_products) - produkty wyciagniete z gazetek przez OCR
export interface BlixProduct {
  id: number;
  gazetka_id: number | null;
  page_number: number | null;
  product_name: string;
  brand: string | null;
  price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  unit: string | null;
  category: string | null;
  image_url: string | null;
  ocr_confidence: number;
  embedding: string | null;
  embedding_text: string | null;
  created_at: string;
}

// OCR result from Vision API
export interface OCRExtractedProduct {
  name: string;
  brand?: string | null;
  price: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  unit?: string | null;
  category?: string | null;
  confidence?: number;
}

export interface OCRApiResponse {
  success: boolean;
  products: OCRExtractedProduct[];
  productCount: number;
  pageNumber: number;
  processingTimeMs?: number;
  savedToDatabase: boolean;
  savedCount?: number;
  saveError?: string;
}

// Product categories for OCR
export type ProductCategory =
  | 'nabial'
  | 'mieso'
  | 'pieczywo'
  | 'owoce_warzywa'
  | 'napoje'
  | 'slodycze'
  | 'chemia'
  | 'kosmetyki'
  | 'inne';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  nabial: 'Nabial',
  mieso: 'Mieso',
  pieczywo: 'Pieczywo',
  owoce_warzywa: 'Owoce i warzywa',
  napoje: 'Napoje',
  slodycze: 'Slodycze',
  chemia: 'Chemia',
  kosmetyki: 'Kosmetyki',
  inne: 'Inne',
};

// Graph visualization types
export interface ClusterNode {
  id: string;
  keyword: string;
  traffic: number;
  cluster: number;
  hasInteria: boolean;
  description: string | null;
  // Extended fields for TrendDetailsModal
  pubDate?: string;
  media?: string | null;
  mediaLinks?: string | null;
  picture?: string | null;
  embeddingText?: string | null;
  trendId?: string;
}

export interface ClusterLink {
  source: string;
  target: string;
  similarity: number;
}

export interface GraphData {
  nodes: ClusterNode[];
  links: ClusterLink[];
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
