/**
 * Parser dat waznosci gazetek z Blix.pl
 */

import { FlyerValidity } from '@/types/flyer';

/**
 * Polish month names to numbers
 */
const POLISH_MONTHS: Record<string, number> = {
  'stycznia': 1,
  'lutego': 2,
  'marca': 3,
  'kwietnia': 4,
  'maja': 5,
  'czerwca': 6,
  'lipca': 7,
  'sierpnia': 8,
  'wrzesnia': 9,
  'września': 9,
  'pazdziernika': 10,
  'października': 10,
  'listopada': 11,
  'grudnia': 12,
};

/**
 * Extracts flyer validity dates from Blix.pl page
 *
 * Tries multiple patterns:
 * 1. DD.MM.YYYY format dates on page
 * 2. Text format "od X stycznia do Y stycznia"
 * 3. DD.MM-DD.MM format in title
 *
 * @param pageUrl - URL of the Blix.pl flyer page
 * @returns Validity dates or null if not found
 */
export async function extractFlyerValidity(pageUrl: string): Promise<FlyerValidity | null> {
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch Blix page: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Try multiple extraction methods
    let validity: FlyerValidity | null = null;

    // Method 1 (BEST): Look for text format "od X stycznia do Y stycznia"
    // This is the most reliable as it's the actual validity text
    validity = extractDatesFromTextFormat(html);
    if (validity) {
      console.log('Extracted dates using text format:', validity.validFrom, '-', validity.validTo);
      return validity;
    }

    // Method 2: Try title DD.MM-DD.MM format
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      validity = parseDatesFromTitle(titleMatch[1]);
      if (validity) {
        console.log('Extracted dates from title:', validity.validFrom, '-', validity.validTo);
        return validity;
      }
    }

    // Method 3 (LAST RESORT): Look for DD.MM.YYYY format dates
    // This is unreliable because page contains many other flyer dates
    validity = extractDatesFromFullFormat(html);
    if (validity) {
      console.log('Extracted dates using DD.MM.YYYY format (fallback):', validity.validFrom, '-', validity.validTo);
      return validity;
    }

    console.warn('Could not extract dates from page');
    return null;
  } catch (error) {
    console.error('Error extracting flyer validity:', error);
    return null;
  }
}

/**
 * Extracts dates from DD.MM.YYYY format found on page
 *
 * Looks for two consecutive dates which are likely the validity range
 */
function extractDatesFromFullFormat(html: string): FlyerValidity | null {
  // Pattern: DD.MM.YYYY
  const datePattern = /(\d{2})\.(\d{2})\.(\d{4})/g;
  const matches: Array<{ day: number; month: number; year: number; date: Date }> = [];

  let match;
  while ((match = datePattern.exec(html)) !== null) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Validate date
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
      const date = new Date(year, month - 1, day);
      matches.push({ day, month, year, date });
    }
  }

  if (matches.length < 2) {
    return null;
  }

  // Sort by date and take first two unique dates
  const uniqueDates = matches.filter((m, i, arr) =>
    arr.findIndex(x => x.day === m.day && x.month === m.month && x.year === m.year) === i
  );

  uniqueDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (uniqueDates.length < 2) {
    return null;
  }

  const from = uniqueDates[0];
  const to = uniqueDates[1];

  return {
    validFrom: formatISODate(from.year, from.month, from.day),
    validTo: formatISODate(to.year, to.month, to.day),
  };
}

/**
 * Extracts dates from Polish text format
 *
 * Pattern: "od X miesiąca do Y miesiąca"
 */
function extractDatesFromTextFormat(html: string): FlyerValidity | null {
  // Pattern: od DD miesiaca do DD miesiaca
  const textPattern = /od\s+(\d{1,2})\s+([a-ząęółśżźćń]+)\s+do\s+(\d{1,2})\s+([a-ząęółśżźćń]+)/i;
  const match = html.match(textPattern);

  if (!match) {
    return null;
  }

  const [, fromDay, fromMonthName, toDay, toMonthName] = match;

  const fromMonth = POLISH_MONTHS[fromMonthName.toLowerCase()];
  const toMonth = POLISH_MONTHS[toMonthName.toLowerCase()];

  if (!fromMonth || !toMonth) {
    console.warn('Unknown month names:', fromMonthName, toMonthName);
    return null;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let fromYear = currentYear;
  let toYear = currentYear;

  // Handle year transition
  if (fromMonth > toMonth) {
    if (currentMonth <= 3 && fromMonth >= 10) {
      fromYear = currentYear - 1;
    } else {
      toYear = currentYear + 1;
    }
  }

  return {
    validFrom: formatISODate(fromYear, fromMonth, parseInt(fromDay, 10)),
    validTo: formatISODate(toYear, toMonth, parseInt(toDay, 10)),
  };
}

/**
 * Parses date range from title string
 *
 * Expected formats:
 * - "19.01-25.01" (same year)
 * - "27.12-02.01" (year transition)
 *
 * @param title - Page title containing date range
 * @returns Validity dates or null
 */
export function parseDatesFromTitle(title: string): FlyerValidity | null {
  // Pattern: DD.MM-DD.MM (with optional spaces)
  const datePattern = /(\d{1,2})\.(\d{1,2})\s*[-–]\s*(\d{1,2})\.(\d{1,2})/;
  const match = title.match(datePattern);

  if (!match) {
    return null;
  }

  const [, fromDay, fromMonth, toDay, toMonth] = match;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const fromMonthNum = parseInt(fromMonth, 10);
  const toMonthNum = parseInt(toMonth, 10);

  let fromYear = currentYear;
  let toYear = currentYear;

  // Handle year transition (e.g., December -> January)
  if (fromMonthNum > toMonthNum) {
    if (currentMonth <= 3 && fromMonthNum >= 10) {
      fromYear = currentYear - 1;
    } else {
      toYear = currentYear + 1;
    }
  }

  const validFrom = formatISODate(fromYear, fromMonthNum, parseInt(fromDay, 10));
  const validTo = formatISODate(toYear, toMonthNum, parseInt(toDay, 10));

  return { validFrom, validTo };
}

/**
 * Formats date as ISO string (YYYY-MM-DD)
 */
function formatISODate(year: number, month: number, day: number): string {
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Extracts store name from Blix.pl page title
 *
 * Expected formats:
 * - "Gazetka Biedronka - Od poniedzialku..."
 * - "Biedronka - Od poniedzialku - 19.01..."
 *
 * @param title - Page title
 * @returns Store name or "Unknown"
 */
export function extractStoreNameFromTitle(title: string): string {
  // Try pattern: "Gazetka {StoreName} -"
  const gazetkaPattern = /Gazetka\s+([^-|,]+?)(?:\s*[-|,]|\s+\d)/i;
  const gazetkaMatch = title.match(gazetkaPattern);

  if (gazetkaMatch && gazetkaMatch[1]) {
    return gazetkaMatch[1].trim();
  }

  // Try pattern: "{StoreName} - Od" (like "Biedronka - Od poniedziałku")
  const storePattern = /^([^-]+?)\s*-\s*Od/i;
  const storeMatch = title.match(storePattern);

  if (storeMatch && storeMatch[1]) {
    return storeMatch[1].trim();
  }

  // Try first word before any separator
  const firstWordPattern = /^([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)/;
  const firstMatch = title.match(firstWordPattern);

  if (firstMatch && firstMatch[1]) {
    return firstMatch[1].trim();
  }

  return 'Unknown';
}

/**
 * Extracts page title from HTML
 */
export function extractTitleFromHtml(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}
