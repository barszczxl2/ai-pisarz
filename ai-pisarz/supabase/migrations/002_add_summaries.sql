-- Migration: 002_add_summaries.sql
-- Adds section summaries support for anti-repetition context

-- Add new columns to context_store for summaries
ALTER TABLE pisarz_context_store
ADD COLUMN IF NOT EXISTS section_summaries JSONB DEFAULT '[]'::jsonb;

ALTER TABLE pisarz_context_store
ADD COLUMN IF NOT EXISTS last_section_content TEXT DEFAULT '';

-- Add summary column to content_sections for individual section summaries
ALTER TABLE pisarz_content_sections
ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';

-- Comment explaining the new columns
COMMENT ON COLUMN pisarz_context_store.section_summaries IS 'Array of {heading, summary, topics} for each completed section';
COMMENT ON COLUMN pisarz_context_store.last_section_content IS 'Full content of the last completed section for continuity';
COMMENT ON COLUMN pisarz_content_sections.summary IS 'Short summary (2-3 sentences) of the section content';
