/**
 * API Endpoint do ekstrakcji bounding boxow produktow
 *
 * POST /api/extract-bbox
 * Body: { imageUrl: string }
 *
 * Returns: {
 *   success: boolean,
 *   bboxes: [{ name: string, bbox: [x1, y1, x2, y2] }],
 *   processingTimeMs: number
 * }
 */

import { NextResponse } from 'next/server';
import { extractBoundingBoxes } from '@/lib/ollama/client';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    console.log('Extracting bounding boxes from:', imageUrl);
    const bboxes = await extractBoundingBoxes(imageUrl);
    const processingTime = Date.now() - startTime;

    console.log(`Extracted ${bboxes.length} bounding boxes in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      bboxes,
      count: bboxes.length,
      processingTimeMs: processingTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('extract-bbox error:', message);

    return NextResponse.json(
      { success: false, error: message, bboxes: [] },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    usage: {
      method: 'POST',
      body: { imageUrl: 'URL obrazu gazetki' },
      returns: 'Lista bounding boxow dla kazdego produktu',
    },
  });
}
