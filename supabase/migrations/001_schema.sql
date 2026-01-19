-- AI PISARZ Database Schema
-- Migration: 001_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (main entity)
CREATE TABLE projects (
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
CREATE TABLE knowledge_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  graph_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Information Graphs (Stage 1 output)
CREATE TABLE information_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  triplets JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search Phrases (Stage 1 output)
CREATE TABLE search_phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phrases TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor Headers (Stage 1 output)
CREATE TABLE competitor_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  headers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Headers (Stage 2 output - 3 types)
CREATE TABLE generated_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  header_type VARCHAR(50) NOT NULL, -- 'rozbudowane', 'h2', 'pytania'
  headers_html TEXT,
  headers_json JSONB,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Data (Stage 3 output)
CREATE TABLE rag_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  detailed_qa TEXT,
  general_qa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Briefs (Stage 4 output)
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  brief_json JSONB,
  brief_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Content (Stage 5 output)
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content_html TEXT,
  content_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Sections (individual section progress)
CREATE TABLE content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
CREATE TABLE context_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  accumulated_content TEXT DEFAULT '',
  current_heading_index INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Runs (execution history)
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  stage_name VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'error'
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_generated_headers_project ON generated_headers(project_id);
CREATE INDEX idx_generated_headers_selected ON generated_headers(project_id, is_selected);
CREATE INDEX idx_content_sections_project ON content_sections(project_id);
CREATE INDEX idx_content_sections_order ON content_sections(project_id, section_order);
CREATE INDEX idx_workflow_runs_project ON workflow_runs(project_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at
    BEFORE UPDATE ON generated_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sections_updated_at
    BEFORE UPDATE ON content_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_context_store_updated_at
    BEFORE UPDATE ON context_store
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - for future multi-user support)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- Policies for single-user access (allow all for authenticated/anon)
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all access to knowledge_graphs" ON knowledge_graphs FOR ALL USING (true);
CREATE POLICY "Allow all access to information_graphs" ON information_graphs FOR ALL USING (true);
CREATE POLICY "Allow all access to search_phrases" ON search_phrases FOR ALL USING (true);
CREATE POLICY "Allow all access to competitor_headers" ON competitor_headers FOR ALL USING (true);
CREATE POLICY "Allow all access to generated_headers" ON generated_headers FOR ALL USING (true);
CREATE POLICY "Allow all access to rag_data" ON rag_data FOR ALL USING (true);
CREATE POLICY "Allow all access to briefs" ON briefs FOR ALL USING (true);
CREATE POLICY "Allow all access to generated_content" ON generated_content FOR ALL USING (true);
CREATE POLICY "Allow all access to content_sections" ON content_sections FOR ALL USING (true);
CREATE POLICY "Allow all access to context_store" ON context_store FOR ALL USING (true);
CREATE POLICY "Allow all access to workflow_runs" ON workflow_runs FOR ALL USING (true);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE content_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;
