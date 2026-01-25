import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { extractProducts, getBlixFlyerInfo, OCRResult } from '@/lib/ollama/client';

/**
 * Generate embedding for product text using Jina AI
 */
async function generateProductEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;

  if (!apiKey) {
    throw new Error('JINA_API_KEY is not configured');
  }

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: [text],
      model: 'jina-embeddings-v3',
      task: 'retrieval.passage', // Passage for storage (matching z query)
      dimensions: 1024,
      normalized: true,
      embedding_type: 'float',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Jina AI API error:', errorText);
    throw new Error(`Jina AI API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Invalid response from Jina AI API');
  }

  return data.data[0].embedding;
}

/**
 * POST: Analyze flyer image and extract products
 *
 * Body:
 * - imageUrl: string - URL of the flyer page image
 * - gazetkaId: number - ID of the gazetka in rrs_blix_gazetki
 * - pageNumber: number - Page number (1-indexed)
 * - saveToDatabase: boolean - Whether to save products to rrs_blix_products (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, gazetkaId, pageNumber = 1, saveToDatabase = false } = body;

    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'imageUrl is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate imageUrl format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'imageUrl must be a valid URL' },
        { status: 400 }
      );
    }

    // Check Ollama API key
    if (!process.env.OLLAMA_API_KEY) {
      return NextResponse.json(
        { error: 'OLLAMA_API_KEY is not configured. Add it to .env.local' },
        { status: 500 }
      );
    }

    // Get flyer info if it's a Blix page URL
    let totalPages: number | undefined;
    if (imageUrl.includes('blix.pl/sklep/') && imageUrl.includes('/gazetka/')) {
      try {
        const flyerInfo = await getBlixFlyerInfo(imageUrl);
        totalPages = flyerInfo.pageCount;
        console.log(`Flyer has ${totalPages} pages, scanning page ${pageNumber}`);
      } catch (infoError) {
        console.warn('Could not get flyer info:', infoError);
      }
    }

    // Extract products from image
    let ocrResult: OCRResult;
    try {
      ocrResult = await extractProducts(imageUrl, pageNumber);
    } catch (ocrError) {
      console.error('OCR extraction error:', ocrError);
      const message = ocrError instanceof Error ? ocrError.message : 'OCR extraction failed';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // If saveToDatabase is true, save products
    if (saveToDatabase && gazetkaId && ocrResult.products.length > 0) {
      try {
        const supabase = await createServerSupabaseClient();

        // Prepare products for insertion with embeddings
        const productsToInsert = [];

        for (const product of ocrResult.products) {
          // Generate embedding text
          const embeddingText = [
            product.name,
            product.brand,
            product.category,
            product.price ? `${product.price}zł` : null,
          ].filter(Boolean).join(' ');

          // Generate embedding
          let embedding: number[] | null = null;
          try {
            if (process.env.JINA_API_KEY) {
              embedding = await generateProductEmbedding(embeddingText);
            }
          } catch (embErr) {
            console.error('Failed to generate embedding for product:', embErr);
            // Continue without embedding
          }

          productsToInsert.push({
            gazetka_id: gazetkaId,
            page_number: pageNumber,
            product_name: product.name,
            brand: product.brand,
            price: product.price,
            original_price: product.original_price,
            discount_percent: product.discount_percent,
            unit: product.unit,
            category: product.category,
            ocr_confidence: product.confidence || 0.8,
            embedding: embedding ? JSON.stringify(embedding) : null,
            embedding_text: embeddingText,
          });
        }

        // Insert products
        const { error: insertError } = await supabase
          .from('rrs_blix_products')
          .insert(productsToInsert);

        if (insertError) {
          console.error('Failed to insert products:', insertError);
          // Return products even if insert fails
          return NextResponse.json({
            success: true,
            products: ocrResult.products,
            productCount: ocrResult.products.length,
            pageNumber,
            processingTimeMs: ocrResult.processing_time_ms,
            savedToDatabase: false,
            saveError: insertError.message,
          });
        }

        return NextResponse.json({
          success: true,
          products: ocrResult.products,
          productCount: ocrResult.products.length,
          pageNumber,
          processingTimeMs: ocrResult.processing_time_ms,
          savedToDatabase: true,
          savedCount: productsToInsert.length,
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Return products even if DB fails
        return NextResponse.json({
          success: true,
          products: ocrResult.products,
          productCount: ocrResult.products.length,
          pageNumber,
          processingTimeMs: ocrResult.processing_time_ms,
          savedToDatabase: false,
          saveError: dbError instanceof Error ? dbError.message : 'Database error',
        });
      }
    }

    // Return products without saving
    return NextResponse.json({
      success: true,
      products: ocrResult.products,
      productCount: ocrResult.products.length,
      pageNumber,
      totalPages,
      processingTimeMs: ocrResult.processing_time_ms,
      savedToDatabase: false,
    });
  } catch (error) {
    console.error('OCR gazetka error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Test OCR connection and configuration
 */
export async function GET() {
  const hasOllamaKey = !!process.env.OLLAMA_API_KEY;
  const hasJinaKey = !!process.env.JINA_API_KEY;
  const ollamaUrl = process.env.OLLAMA_API_URL || 'https://api.ollama.com/v1';
  const visionModel = process.env.OLLAMA_VISION_MODEL || 'mistral-large-3';

  return NextResponse.json({
    status: 'ok',
    config: {
      ollamaConfigured: hasOllamaKey,
      jinaConfigured: hasJinaKey,
      ollamaUrl,
      visionModel,
    },
    usage: {
      method: 'POST',
      body: {
        imageUrl: 'URL of flyer page image',
        gazetkaId: 'ID from rrs_blix_gazetki (optional)',
        pageNumber: 'Page number 1-indexed (default: 1)',
        saveToDatabase: 'Save products to rrs_blix_products (default: false)',
      },
    },
  });
}
