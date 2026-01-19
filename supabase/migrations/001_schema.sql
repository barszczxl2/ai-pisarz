-- AI PISARZ Database Schema
-- Migration: 001_schema.sql
-- All tables prefixed with "pisarz_"

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (main entity)
CREATE TABLE pisarz_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(256) NOT NULL,
  language VARCHAR(48) NOT NULL DEFAULT 'Polish',
  ai_overview_content TEXT,
  current_stage INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Graphs (Stage 1 output)
CREATE TABLE pisarz_knowledge_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  graph_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Information Graphs (Stage 1 output)
CREATE TABLE pisarz_information_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  triplets JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search Phrases (Stage 1 output)
CREATE TABLE pisarz_search_phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  phrases TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor Headers (Stage 1 output)
CREATE TABLE pisarz_competitor_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  headers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Headers (Stage 2 output - 3 types)
CREATE TABLE pisarz_generated_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  header_type VARCHAR(50) NOT NULL, -- 'rozbudowane', 'h2', 'pytania'
  headers_html TEXT,
  headers_json JSONB,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Data (Stage 3 output)
CREATE TABLE pisarz_rag_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  detailed_qa TEXT,
  general_qa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Briefs (Stage 4 output)
CREATE TABLE pisarz_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  brief_json JSONB,
  brief_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Content (Stage 5 output)
CREATE TABLE pisarz_generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  content_html TEXT,
  content_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Sections (individual section progress)
CREATE TABLE pisarz_content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  heading_html TEXT NOT NULL,
  heading_knowledge TEXT,
  heading_keywords TEXT,
  content_html TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context Store (replaces Make.com Data Store)
CREATE TABLE pisarz_context_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE UNIQUE,
  accumulated_content TEXT DEFAULT '',
  current_heading_index INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Runs (execution history)
CREATE TABLE pisarz_workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES pisarz_projects(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  stage_name VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'error'
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX idx_pisarz_projects_status ON pisarz_projects(status);
CREATE INDEX idx_pisarz_generated_headers_project ON pisarz_generated_headers(project_id);
CREATE INDEX idx_pisarz_generated_headers_selected ON pisarz_generated_headers(project_id, is_selected);
CREATE INDEX idx_pisarz_content_sections_project ON pisarz_content_sections(project_id);
CREATE INDEX idx_pisarz_content_sections_order ON pisarz_content_sections(project_id, section_order);
CREATE INDEX idx_pisarz_workflow_runs_project ON pisarz_workflow_runs(project_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION pisarz_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER pisarz_update_projects_updated_at
    BEFORE UPDATE ON pisarz_projects
    FOR EACH ROW
    EXECUTE FUNCTION pisarz_update_updated_at_column();

CREATE TRIGGER pisarz_update_generated_content_updated_at
    BEFORE UPDATE ON pisarz_generated_content
    FOR EACH ROW
    EXECUTE FUNCTION pisarz_update_updated_at_column();

CREATE TRIGGER pisarz_update_content_sections_updated_at
    BEFORE UPDATE ON pisarz_content_sections
    FOR EACH ROW
    EXECUTE FUNCTION pisarz_update_updated_at_column();

CREATE TRIGGER pisarz_update_context_store_updated_at
    BEFORE UPDATE ON pisarz_context_store
    FOR EACH ROW
    EXECUTE FUNCTION pisarz_update_updated_at_column();

-- Enable Row Level Security (optional - for future multi-user support)
ALTER TABLE pisarz_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_knowledge_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_information_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_search_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_competitor_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_generated_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_rag_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_context_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisarz_workflow_runs ENABLE ROW LEVEL SECURITY;

-- Policies for single-user access (allow all for authenticated/anon)
CREATE POLICY "Allow all access to pisarz_projects" ON pisarz_projects FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_knowledge_graphs" ON pisarz_knowledge_graphs FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_information_graphs" ON pisarz_information_graphs FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_search_phrases" ON pisarz_search_phrases FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_competitor_headers" ON pisarz_competitor_headers FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_generated_headers" ON pisarz_generated_headers FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_rag_data" ON pisarz_rag_data FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_briefs" ON pisarz_briefs FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_generated_content" ON pisarz_generated_content FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_content_sections" ON pisarz_content_sections FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_context_store" ON pisarz_context_store FOR ALL USING (true);
CREATE POLICY "Allow all access to pisarz_workflow_runs" ON pisarz_workflow_runs FOR ALL USING (true);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE pisarz_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE pisarz_content_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE pisarz_workflow_runs;
