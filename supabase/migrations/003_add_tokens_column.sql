-- Migration: 003_add_tokens_column.sql
-- Adds total_tokens column to track API token usage per workflow run

ALTER TABLE pisarz_workflow_runs ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;

COMMENT ON COLUMN pisarz_workflow_runs.total_tokens IS 'Total tokens used by this workflow run from Dify API';
