import { NextRequest, NextResponse } from 'next/server';

/**
 * Whitelist dozwolonych domen do proxy
 * Dodaj tutaj domeny, z których chcesz pobierać obrazy
 */
const ALLOWED_DOMAINS = [
  'blix.pl',
  'www.blix.pl',
  'cdn.blix.pl',
  'img.blix.pl',
  'static.blix.pl',
  // Dodaj inne zaufane domeny w razie potrzeby
];

/**
 * Whitelist dozwolonych origins dla CORS
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  // Dodaj produkcyjne domeny
];

/**
 * Sprawdza czy domena jest na whitelist
 */
function isDomainAllowed(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  return ALLOWED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );
}

/**
 * Sprawdza czy origin jest dozwolony
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Brak origin = request z serwera
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Proxy do pobierania obrazow z zewnetrznych zrodel (omija CORS)
 * GET /api/proxy-image?url=https://...
 *
 * Ograniczenia bezpieczeństwa:
 * - Tylko dozwolone domeny (whitelist)
 * - Tylko CORS z localhost
 * - Tylko protokoły HTTP/HTTPS
 * - Tylko content-type image/*
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const origin = request.headers.get('origin');

  // Sprawdź CORS origin
  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    );
  }

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Walidacja URL
    const parsedUrl = new URL(url);

    // Sprawdź protokół
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }

    // Sprawdź whitelist domen
    if (!isDomainAllowed(parsedUrl)) {
      return NextResponse.json(
        { error: 'Domain not allowed. Only whitelisted domains are supported.' },
        { status: 403 }
      );
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

    // Przygotuj CORS headers
    const corsHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    };

    // Dodaj CORS header tylko dla dozwolonych origins
    if (origin && isOriginAllowed(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    }

    return new NextResponse(buffer, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

/**
 * Obsługa preflight requests (OPTIONS)
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
