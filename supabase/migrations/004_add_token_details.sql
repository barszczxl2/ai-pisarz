-- Migration: 004_add_token_details.sql
-- Adds detailed token tracking per workflow run

-- Add token_details JSONB column to store per-node token breakdown
ALTER TABLE pisarz_workflow_runs ADD COLUMN IF NOT EXISTS token_details JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN pisarz_workflow_runs.token_details IS 'Detailed token usage per node: [{node_id, node_type, node_title, total_tokens, model_name}]';
