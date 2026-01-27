import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy do pobierania obrazow z zewnetrznych zrodel (omija CORS)
 * GET /api/proxy-image?url=https://...
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Walidacja URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }

    // Pobierz obraz
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Sprawdz czy to obraz
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      );
    }

    const buffer = await response.arrayBuffer();

    // Zwroc obraz z odpowiednimi headerami CORS
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
