/**
 * Generator bezpiecznych nazw katalogow dla gazetek
 */

import { extractStoreNameFromTitle } from './date-parser';

/**
 * Polish character mapping for sanitization
 */
const POLISH_CHAR_MAP: Record<string, string> = {
  'ą': 'a',
  'ć': 'c',
  'ę': 'e',
  'ł': 'l',
  'ń': 'n',
  'ó': 'o',
  'ś': 's',
  'ź': 'z',
  'ż': 'z',
  'Ą': 'A',
  'Ć': 'C',
  'Ę': 'E',
  'Ł': 'L',
  'Ń': 'N',
  'Ó': 'O',
  'Ś': 'S',
  'Ź': 'Z',
  'Ż': 'Z',
};

/**
 * Sanitizes string for use in file/directory names
 *
 * - Converts Polish characters to ASCII equivalents
 * - Removes special characters
 * - Replaces spaces with underscores
 * - Converts to lowercase
 *
 * @param input - String to sanitize
 * @returns Sanitized string safe for filesystem
 */
export function sanitizeForFilesystem(input: string): string {
  let result = input;

  // Replace Polish characters
  for (const [polish, ascii] of Object.entries(POLISH_CHAR_MAP)) {
    result = result.replace(new RegExp(polish, 'g'), ascii);
  }

  // Remove characters that are not alphanumeric, space, hyphen, or underscore
  result = result.replace(/[^a-zA-Z0-9\s\-_]/g, '');

  // Replace multiple spaces with single space
  result = result.replace(/\s+/g, ' ').trim();

  // Replace spaces with underscores
  result = result.replace(/\s/g, '_');

  // Remove consecutive underscores
  result = result.replace(/_+/g, '_');

  return result;
}

/**
 * Generates directory name for a flyer
 *
 * Format: {StoreName}_{YYYY-MM-DD}_{YYYY-MM-DD}
 * Example: Biedronka_2026-01-27_2026-02-02
 *
 * @param title - Flyer page title
 * @param validFrom - Start date in ISO format
 * @param validTo - End date in ISO format
 * @returns Directory name
 */
export function generateFlyerDirectoryName(
  title: string,
  validFrom: string,
  validTo: string
): string {
  const storeName = extractStoreNameFromTitle(title);
  const sanitizedStoreName = sanitizeForFilesystem(storeName);

  // Capitalize first letter for nicer display
  const capitalizedStoreName = sanitizedStoreName.charAt(0).toUpperCase() +
    sanitizedStoreName.slice(1);

  return `${capitalizedStoreName}_${validFrom}_${validTo}`;
}

/**
 * Generates page filename
 *
 * Format: page_01.jpg, page_02.jpg, etc.
 *
 * @param pageNumber - Page number (1-based)
 * @param extension - File extension (default: jpg)
 * @returns Filename
 */
export function generatePageFilename(pageNumber: number, extension: string = 'jpg'): string {
  const paddedNumber = pageNumber.toString().padStart(2, '0');
  return `page_${paddedNumber}.${extension}`;
}
