-- Add bounding box columns and cropped_image_url to rrs_blix_products table
-- Run this migration in Supabase SQL Editor

-- Add bbox columns for storing product location on the flyer image
ALTER TABLE rrs_blix_products ADD COLUMN IF NOT EXISTS bbox_x1 INTEGER;
ALTER TABLE rrs_blix_products ADD COLUMN IF NOT EXISTS bbox_y1 INTEGER;
ALTER TABLE rrs_blix_products ADD COLUMN IF NOT EXISTS bbox_x2 INTEGER;
ALTER TABLE rrs_blix_products ADD COLUMN IF NOT EXISTS bbox_y2 INTEGER;

-- Add cropped_image_url for storing the URL of the cropped product image in Supabase Storage
ALTER TABLE rrs_blix_products ADD COLUMN IF NOT EXISTS cropped_image_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN rrs_blix_products.bbox_x1 IS 'Bounding box left X coordinate (pixels from top-left)';
COMMENT ON COLUMN rrs_blix_products.bbox_y1 IS 'Bounding box top Y coordinate (pixels from top-left)';
COMMENT ON COLUMN rrs_blix_products.bbox_x2 IS 'Bounding box right X coordinate (pixels from top-left)';
COMMENT ON COLUMN rrs_blix_products.bbox_y2 IS 'Bounding box bottom Y coordinate (pixels from top-left)';
COMMENT ON COLUMN rrs_blix_products.cropped_image_url IS 'URL to cropped product image in Supabase Storage (product-images bucket)';

-- Optional: Create index for quickly finding products with cropped images
CREATE INDEX IF NOT EXISTS idx_blix_products_has_cropped_image ON rrs_blix_products(cropped_image_url)
  WHERE cropped_image_url IS NOT NULL;
