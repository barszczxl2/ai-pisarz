-- Create rrs_blix_products table for storing OCR-extracted products from promotional flyers
-- Run this migration in Supabase SQL Editor

-- Enable pgvector extension if not already enabled
tabela gotowa

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blix_products_gazetka_id ON rrs_blix_products(gazetka_id);
CREATE INDEX IF NOT EXISTS idx_blix_products_category ON rrs_blix_products(category);
CREATE INDEX IF NOT EXISTS idx_blix_products_price ON rrs_blix_products(price);
CREATE INDEX IF NOT EXISTS idx_blix_products_created_at ON rrs_blix_products(created_at DESC);

-- Add HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_blix_products_embedding ON rrs_blix_products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Add comment for documentation
COMMENT ON TABLE rrs_blix_products IS 'Products extracted from promotional flyers using OCR (Ollama Vision API). Linked to rrs_blix_gazetki via gazetka_id.';
COMMENT ON COLUMN rrs_blix_products.embedding IS 'Jina AI embedding (1024 dimensions) for semantic search. Task: retrieval.passage';
COMMENT ON COLUMN rrs_blix_products.ocr_confidence IS 'Confidence score from OCR extraction (0.0-1.0). Higher means more reliable.';

-- Optional: Add RLS (Row Level Security) if needed
-- ALTER TABLE rrs_blix_products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON rrs_blix_products FOR SELECT USING (true);
-- CREATE POLICY "Allow authenticated insert" ON rrs_blix_products FOR INSERT WITH CHECK (true);
