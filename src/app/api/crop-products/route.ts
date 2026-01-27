/**
 * API Endpoint do wycinania produktow z obrazu gazetki
 *
 * POST /api/crop-products
 * Body: {
 *   imageUrl: string,
 *   products: [{ id: string, bbox: [x1, y1, x2, y2] }],
 *   gazetkaId?: number,
 *   pageNumber?: number
 * }
 *
 * Returns: {
 *   success: boolean,
 *   croppedImages: [{ id: string, imageUrl: string, width: number, height: number }],
 *   errors: [{ id: string, error: string }]
 * }
 */

import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { cropProductsSchema, validateRequest } from '@/lib/validations/api';

// Konfiguracja
const CROPPED_IMAGE_SIZE = 300; // Docelowy rozmiar w px (kwadrat)
const IMAGE_QUALITY = 85;

interface CropRequest {
  imageUrl: string;
  products: Array<{
    id: string;
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  }>;
  gazetkaId?: number;
  pageNumber?: number;
}

interface CroppedImageResult {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
}

interface CropError {
  id: string;
  error: string;
}

/**
 * Pobiera obraz z URL i zwraca Buffer
 */
async function fetchImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL nie prowadzi do obrazka (otrzymano: ${contentType})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Wycina region z obrazu i normalizuje rozmiar
 */
async function cropRegion(
  imageBuffer: Buffer,
  bbox: [number, number, number, number]
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const [x1, y1, x2, y2] = bbox;
  const width = x2 - x1;
  const height = y2 - y1;

  // Sprawdz czy bbox jest poprawny
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid bbox dimensions: ${width}x${height}`);
  }

  // Pobierz metadane obrazu zrodlowego
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 0;
  const imgHeight = metadata.height || 0;

  // Ogranicz bbox do granic obrazu
  const safeX1 = Math.max(0, Math.min(x1, imgWidth - 1));
  const safeY1 = Math.max(0, Math.min(y1, imgHeight - 1));
  const safeX2 = Math.max(safeX1 + 1, Math.min(x2, imgWidth));
  const safeY2 = Math.max(safeY1 + 1, Math.min(y2, imgHeight));

  const safeWidth = safeX2 - safeX1;
  const safeHeight = safeY2 - safeY1;

  // Wytnij region
  const cropped = await sharp(imageBuffer)
    .extract({
      left: Math.round(safeX1),
      top: Math.round(safeY1),
      width: Math.round(safeWidth),
      height: Math.round(safeHeight),
    })
    .resize(CROPPED_IMAGE_SIZE, CROPPED_IMAGE_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: IMAGE_QUALITY })
    .toBuffer();

  return {
    buffer: cropped,
    width: CROPPED_IMAGE_SIZE,
    height: CROPPED_IMAGE_SIZE,
  };
}

/**
 * Konwertuje buffer do data URL (base64)
 */
function bufferToDataUrl(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return `data:image/webp;base64,${base64}`;
}

/**
 * POST /api/crop-products
 * Wycina produkty z obrazu gazetki na podstawie bounding boxow
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validation = validateRequest(cropProductsSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { imageUrl, products } = validation.data;

    // Pobierz obraz zrodlowy
    console.log('Fetching source image:', imageUrl);
    const imageBuffer = await fetchImage(imageUrl);
    console.log('Image fetched, size:', imageBuffer.length, 'bytes');

    const croppedImages: CroppedImageResult[] = [];
    const errors: CropError[] = [];

    // Przetwarzaj kazdy produkt
    for (const product of products) {
      try {
        if (!product.bbox || product.bbox.length !== 4) {
          errors.push({
            id: product.id,
            error: 'Invalid or missing bbox',
          });
          continue;
        }

        // Wytnij region
        const { buffer, width, height } = await cropRegion(imageBuffer, product.bbox);

        // Konwertuj do data URL (base64)
        const dataUrl = bufferToDataUrl(buffer);

        croppedImages.push({
          id: product.id,
          imageUrl: dataUrl,
          width,
          height,
        });

        console.log(`Cropped product ${product.id}: ${dataUrl.substring(0, 50)}...`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error cropping product ${product.id}:`, message);
        errors.push({
          id: product.id,
          error: message,
        });
      }
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      croppedImages,
      errors,
      processingTimeMs: processingTime,
      totalProducts: products.length,
      successCount: croppedImages.length,
      errorCount: errors.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('crop-products error:', message);

    return NextResponse.json(
      {
        success: false,
        error: message,
        croppedImages: [],
        errors: [],
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crop-products
 * Health check i informacje o konfiguracji
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    config: {
      imageSize: CROPPED_IMAGE_SIZE,
      format: 'webp',
      quality: IMAGE_QUALITY,
      storage: 'base64 data URL',
    },
  });
}
