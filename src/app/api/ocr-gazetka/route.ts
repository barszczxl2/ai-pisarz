import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  extractProducts,
  getBlixFlyerInfo,
  OCRResult,
  VisionProvider,
  isProviderConfigured,
} from '@/lib/ollama/client';
import { ocrGazetkaSchema, validateRequest } from '@/lib/validations/api';

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
      task: 'retrieval.passage',
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
 * - provider: 'ollama' | 'openrouter' - Vision API provider (default: 'ollama')
 * - model: string - Model ID to use (default: based on provider)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validation = validateRequest(ocrGazetkaSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const {
      imageUrl,
      gazetkaId,
      pageNumber,
      saveToDatabase,
      provider,
      model,
    } = validation.data;

    // Validate provider
    const validProvider: VisionProvider = provider === 'openrouter' ? 'openrouter' : 'ollama';

    // Check if provider is configured
    if (!isProviderConfigured(validProvider)) {
      const keyName = validProvider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'OLLAMA_API_KEY';
      return NextResponse.json(
        { error: `${keyName} is not configured. Add it to .env.local` },
        { status: 500 }
      );
    }

    // Model validation - accept any model string
    // Models are validated dynamically via /api/ocr-models endpoint

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
      ocrResult = await extractProducts(imageUrl, pageNumber, {
        provider: validProvider,
        model: model || undefined,
      });
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
          return NextResponse.json({
            success: true,
            products: ocrResult.products,
            productCount: ocrResult.products.length,
            pageNumber,
            totalPages,
            processingTimeMs: ocrResult.processing_time_ms,
            savedToDatabase: false,
            saveError: insertError.message,
            sourceImageUrl: ocrResult.source_image_url,
            modelUsed: ocrResult.model_used,
            providerUsed: ocrResult.provider_used,
          });
        }

        return NextResponse.json({
          success: true,
          products: ocrResult.products,
          productCount: ocrResult.products.length,
          pageNumber,
          totalPages,
          processingTimeMs: ocrResult.processing_time_ms,
          savedToDatabase: true,
          savedCount: productsToInsert.length,
          sourceImageUrl: ocrResult.source_image_url,
          modelUsed: ocrResult.model_used,
          providerUsed: ocrResult.provider_used,
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({
          success: true,
          products: ocrResult.products,
          productCount: ocrResult.products.length,
          pageNumber,
          totalPages,
          processingTimeMs: ocrResult.processing_time_ms,
          savedToDatabase: false,
          saveError: dbError instanceof Error ? dbError.message : 'Database error',
          sourceImageUrl: ocrResult.source_image_url,
          modelUsed: ocrResult.model_used,
          providerUsed: ocrResult.provider_used,
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
      sourceImageUrl: ocrResult.source_image_url,
      modelUsed: ocrResult.model_used,
      providerUsed: ocrResult.provider_used,
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
 * GET: Get OCR configuration info
 * For available models use /api/ocr-models endpoint
 */
export async function GET() {
  const ollamaConfigured = isProviderConfigured('ollama');
  const openrouterConfigured = isProviderConfigured('openrouter');

  return NextResponse.json({
    status: 'ok',
    providers: {
      ollama: {
        configured: ollamaConfigured,
        url: process.env.OLLAMA_API_URL || 'https://ollama.com/v1',
      },
      openrouter: {
        configured: openrouterConfigured,
        url: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
      },
    },
    defaultModel: process.env.OLLAMA_VISION_MODEL || 'qwen3-vl:235b-instruct',
    modelsEndpoint: '/api/ocr-models',
    usage: {
      method: 'POST',
      body: {
        imageUrl: 'URL of flyer page image (required)',
        gazetkaId: 'ID from rrs_blix_gazetki (optional)',
        pageNumber: 'Page number 1-indexed (default: 1)',
        saveToDatabase: 'Save products to rrs_blix_products (default: false)',
        provider: 'ollama | openrouter (default: ollama)',
        model: 'Model ID (optional)',
      },
    },
  });
}
