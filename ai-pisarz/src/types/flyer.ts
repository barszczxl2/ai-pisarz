/**
 * Types for flyer downloading functionality
 */

/**
 * Validity period of a flyer
 */
export interface FlyerValidity {
  validFrom: string;  // "2026-01-27" (ISO date format)
  validTo: string;    // "2026-02-02" (ISO date format)
}

/**
 * Metadata stored in metadata.json for each downloaded flyer
 */
export interface FlyerMetadata {
  title: string;
  sourceUrl: string;
  validFrom: string;
  validTo: string;
  pageCount: number;
  downloadedAt: string;  // ISO timestamp
  storeName: string;
}

/**
 * Result of flyer download operation
 */
export interface FlyerDownloadResult {
  success: boolean;
  directoryPath: string;
  directoryName: string;
  metadata: FlyerMetadata;
  downloadedFiles: string[];
  failedUrls: string[];
}
