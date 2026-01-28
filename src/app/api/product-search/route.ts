import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cosineSimilarity, parseEmbedding } from '@/lib/clustering';
import { GazetkaProduct, ProductSearchResult } from '@/types/database';
import { productSearchSchema, validateRequest } from '@/lib/validations/api';

/**
 * Generate embedding for a query using Jina AI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;

  if (!apiKey) {
    throw new Error('Brak skonfigurowanego klucza JINA_API_KEY');
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
      task: 'retrieval.query',  // Asymetryczne - query vs passage (embeddingi w bazie używają retrieval.passage)
      dimensions: 1024,
      normalized: true,
      embedding_type: 'float',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Jina AI API error:', errorText);
    throw new Error(`Błąd Jina AI API: ${response.status}`);
  }

  const data = await response.json();

  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Nieprawidłowa odpowiedź z Jina AI API');
  }

  return data.data[0].embedding;
}

/**
 * Search for similar products in gazetki using embeddings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validation = validateRequest(productSearchSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { query, threshold, limit } = validation.data;

    // Check for Jina AI API key
    if (!process.env.JINA_API_KEY) {
      return NextResponse.json(
        { error: 'Brak skonfigurowanego klucza JINA_API_KEY. Dodaj go do .env.local' },
        { status: 500 }
      );
    }

    // Generate embedding for the query using Jina AI
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (embeddingError) {
      console.error('Jina AI embedding error:', embeddingError);
      const message = embeddingError instanceof Error ? embeddingError.message : 'Błąd generowania embeddingu';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // Fetch all products with embeddings from Supabase
    const supabase = await createServerSupabaseClient();

    const { data: products, error: dbError } = await supabase
      .from('rrs_blix_gazetki')
      .select('id, item_id, title, description, link, pub_date, context_query, embedding, embedding_text')
      .not('embedding', 'is', null);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json(
        { error: 'Błąd pobierania danych z bazy' },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        results: [],
        message: 'Brak produktów z embeddingami w bazie',
      });
    }

    // Calculate similarities
    const results: ProductSearchResult[] = [];

    for (const product of products as GazetkaProduct[]) {
      const productEmbedding = parseEmbedding(product.embedding);

      if (productEmbedding) {
        const similarity = cosineSimilarity(queryEmbedding, productEmbedding);

        if (similarity >= threshold) {
          results.push({
            id: product.id,
            item_id: product.item_id,
            title: product.title,
            description: product.description,
            link: product.link,
            pub_date: product.pub_date,
            context_query: product.context_query,
            similarity,
          });
        }
      }
    }

    // Sort by similarity and limit
    results.sort((a, b) => b.similarity - a.similarity);
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
      query,
      threshold,
    });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 }
    );
  }
}
