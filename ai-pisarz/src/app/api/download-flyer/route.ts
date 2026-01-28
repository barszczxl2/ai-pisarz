/**
 * API endpoint for downloading flyers from Blix.pl to local disk
 *
 * POST /api/download-flyer
 * Body: { flyerUrl: string, basePath?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadFlyer, checkFlyerExists, listDownloadedFlyers } from '@/lib/flyer';
import { downloadFlyerSchema, validateRequest } from '@/lib/validations/api';

/**
 * POST - Download flyer to local disk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(downloadFlyerSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { flyerUrl, basePath } = validation.data;

    // Check if already downloaded
    const existingPath = await checkFlyerExists(flyerUrl, basePath);
    if (existingPath) {
      return NextResponse.json(
        {
          success: true,
          message: 'Flyer already downloaded',
          alreadyExists: true,
          directoryPath: existingPath,
        },
        { status: 200 }
      );
    }

    // Download flyer
    const result = await downloadFlyer(flyerUrl, basePath);

    return NextResponse.json(
      {
        success: result.success,
        message: result.success
          ? `Downloaded ${result.downloadedFiles.length} pages`
          : `Downloaded with ${result.failedUrls.length} errors`,
        alreadyExists: false,
        directoryPath: result.directoryPath,
        directoryName: result.directoryName,
        metadata: result.metadata,
        downloadedFiles: result.downloadedFiles,
        failedUrls: result.failedUrls,
      },
      { status: result.success ? 200 : 207 } // 207 Multi-Status for partial success
    );
  } catch (error) {
    console.error('Download flyer error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List downloaded flyers or check status
 *
 * Query params:
 * - action=list: List all downloaded flyers
 * - action=check&url={flyerUrl}: Check if specific flyer exists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    if (action === 'check') {
      const flyerUrl = searchParams.get('url');
      if (!flyerUrl) {
        return NextResponse.json(
          { error: 'Missing url parameter' },
          { status: 400 }
        );
      }

      const existingPath = await checkFlyerExists(flyerUrl);
      return NextResponse.json({
        exists: !!existingPath,
        directoryPath: existingPath,
      });
    }

    if (action === 'list') {
      const flyers = await listDownloadedFlyers();
      return NextResponse.json({
        count: flyers.length,
        flyers,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "list" or "check"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Get flyers error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
