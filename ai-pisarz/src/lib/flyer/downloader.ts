/**
 * Glowna logika pobierania gazetek na dysk lokalny
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import { FlyerDownloadResult, FlyerMetadata } from '@/types/flyer';
import {
  extractFlyerValidity,
  extractTitleFromHtml,
  extractStoreNameFromTitle,
} from './date-parser';
import {
  generateFlyerDirectoryName,
  generatePageFilename,
} from './directory-name';
import {
  getBlixFlyerInfo,
  fetchImageAsBase64,
} from '@/lib/ollama/client';

/**
 * Default storage path for flyers
 * Can be overridden via FLYER_STORAGE_PATH env variable
 */
function getDefaultStoragePath(): string {
  const envPath = process.env.FLYER_STORAGE_PATH;
  if (envPath) {
    // Expand ~ to home directory
    if (envPath.startsWith('~')) {
      return path.join(os.homedir(), envPath.slice(1));
    }
    return envPath;
  }
  return path.join(os.homedir(), 'Documents', 'gazetki');
}

/**
 * Fetches page HTML to extract title and dates
 */
async function fetchPageInfo(pageUrl: string): Promise<{
  title: string;
  html: string;
}> {
  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }
  const html = await response.text();
  const title = extractTitleFromHtml(html) || 'Unknown Flyer';
  return { title, html };
}

/**
 * Downloads a single image and saves to disk
 *
 * @param imageUrl - URL of the image
 * @param savePath - Full path where to save the file
 * @returns true if successful, false otherwise
 */
async function downloadAndSaveImage(
  imageUrl: string,
  savePath: string
): Promise<boolean> {
  try {
    const { base64 } = await fetchImageAsBase64(imageUrl);
    const buffer = Buffer.from(base64, 'base64');
    await fs.writeFile(savePath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to download image ${imageUrl}:`, error);
    return false;
  }
}

/**
 * Downloads flyer from Blix.pl and saves to local disk
 *
 * Creates directory structure:
 * {basePath}/{StoreName}_{ValidFrom}_{ValidTo}/
 *   ├── metadata.json
 *   ├── page_01.jpg
 *   ├── page_02.jpg
 *   └── ...
 *
 * @param flyerUrl - URL of the Blix.pl flyer page
 * @param basePath - Base directory for storage (default: ~/Documents/gazetki)
 * @returns Download result with paths and status
 */
export async function downloadFlyer(
  flyerUrl: string,
  basePath?: string
): Promise<FlyerDownloadResult> {
  const storagePath = basePath || getDefaultStoragePath();

  // 1. Get flyer info (page count and URLs)
  console.log('Fetching flyer info from:', flyerUrl);
  const flyerInfo = await getBlixFlyerInfo(flyerUrl);
  console.log(`Found ${flyerInfo.pageCount} pages`);

  // 2. Fetch page to get title and dates
  const { title } = await fetchPageInfo(flyerUrl);
  console.log('Flyer title:', title);

  // 3. Extract validity dates
  const validity = await extractFlyerValidity(flyerUrl);
  if (!validity) {
    throw new Error('Could not extract validity dates from page title');
  }
  console.log('Validity:', validity.validFrom, '-', validity.validTo);

  // 4. Generate directory name and create directory
  const directoryName = generateFlyerDirectoryName(
    title,
    validity.validFrom,
    validity.validTo
  );
  const directoryPath = path.join(storagePath, directoryName);

  console.log('Creating directory:', directoryPath);
  await fs.mkdir(directoryPath, { recursive: true });

  // 5. Download all images
  const downloadedFiles: string[] = [];
  const failedUrls: string[] = [];

  for (let i = 0; i < flyerInfo.pageUrls.length; i++) {
    const pageUrl = flyerInfo.pageUrls[i];
    const filename = generatePageFilename(i + 1);
    const filePath = path.join(directoryPath, filename);

    console.log(`Downloading page ${i + 1}/${flyerInfo.pageCount}...`);
    const success = await downloadAndSaveImage(pageUrl, filePath);

    if (success) {
      downloadedFiles.push(filename);
    } else {
      failedUrls.push(pageUrl);
    }

    // Small delay between downloads to be nice to the server
    if (i < flyerInfo.pageUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // 6. Create metadata.json
  const storeName = extractStoreNameFromTitle(title);
  const metadata: FlyerMetadata = {
    title,
    sourceUrl: flyerUrl,
    validFrom: validity.validFrom,
    validTo: validity.validTo,
    pageCount: flyerInfo.pageCount,
    downloadedAt: new Date().toISOString(),
    storeName,
  };

  const metadataPath = path.join(directoryPath, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log('Saved metadata.json');

  // 7. Return result
  const result: FlyerDownloadResult = {
    success: failedUrls.length === 0,
    directoryPath,
    directoryName,
    metadata,
    downloadedFiles,
    failedUrls,
  };

  console.log(`Download complete: ${downloadedFiles.length} files saved, ${failedUrls.length} failed`);
  return result;
}

/**
 * Checks if a flyer directory already exists
 *
 * @param flyerUrl - URL of the flyer
 * @param basePath - Base storage path
 * @returns Directory path if exists, null otherwise
 */
export async function checkFlyerExists(
  flyerUrl: string,
  basePath?: string
): Promise<string | null> {
  try {
    const storagePath = basePath || getDefaultStoragePath();
    const { title } = await fetchPageInfo(flyerUrl);
    const validity = await extractFlyerValidity(flyerUrl);

    if (!validity) {
      return null;
    }

    const directoryName = generateFlyerDirectoryName(
      title,
      validity.validFrom,
      validity.validTo
    );
    const directoryPath = path.join(storagePath, directoryName);

    try {
      await fs.access(directoryPath);
      return directoryPath;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Lists all downloaded flyers in storage directory
 *
 * @param basePath - Base storage path
 * @returns Array of flyer metadata
 */
export async function listDownloadedFlyers(
  basePath?: string
): Promise<FlyerMetadata[]> {
  const storagePath = basePath || getDefaultStoragePath();

  try {
    const entries = await fs.readdir(storagePath, { withFileTypes: true });
    const flyers: FlyerMetadata[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const metadataPath = path.join(storagePath, entry.name, 'metadata.json');
      try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(content) as FlyerMetadata;
        flyers.push(metadata);
      } catch {
        // Skip directories without valid metadata
        continue;
      }
    }

    // Sort by downloadedAt descending
    flyers.sort((a, b) =>
      new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
    );

    return flyers;
  } catch {
    return [];
  }
}
