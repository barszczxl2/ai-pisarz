/**
 * Flyer download module
 *
 * Provides functionality to download promotional flyers from Blix.pl
 * and save them to local disk.
 */

// Main downloader functions
export {
  downloadFlyer,
  checkFlyerExists,
  listDownloadedFlyers,
} from './downloader';

// Date parsing utilities
export {
  extractFlyerValidity,
  parseDatesFromTitle,
  extractStoreNameFromTitle,
  extractTitleFromHtml,
} from './date-parser';

// Directory name utilities
export {
  generateFlyerDirectoryName,
  generatePageFilename,
  sanitizeForFilesystem,
} from './directory-name';

// Re-export types
export type {
  FlyerValidity,
  FlyerMetadata,
  FlyerDownloadResult,
} from '@/types/flyer';
