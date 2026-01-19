import { NextResponse } from 'next/server';
import { serpDataClient } from '@/lib/serpdata/client';

export async function GET() {
  // Test connection
  const result = await serpDataClient.testConnection();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keyword, hl, gl, num } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const results = await serpDataClient.search({
      keyword,
      hl: hl || 'pl',
      gl: gl || 'pl',
      num: num || 10,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('SerpData search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
