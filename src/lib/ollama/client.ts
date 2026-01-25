/**
 * Ollama Cloud Vision API Client
 *
 * Wykorzystuje API kompatybilne z OpenAI do analizy obrazow gazetek
 * Modele: mistral-large-3 (vision), llava (alternatywa)
 */

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'https://api.ollama.com/v1';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'mistral-large-3';

// Typy dla produktow wyciagnietych z gazetki
export interface ExtractedProduct {
  name: string;
  brand?: string | null;
  price: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  unit?: string | null;
  category?: string | null;
  confidence?: number;
}

export interface OCRResult {
  products: ExtractedProduct[];
  page_number?: number;
  raw_response?: string;
  processing_time_ms?: number;
}

// Prompt do ekstrakcji produktow z gazetki - zoptymalizowany dla polskich gazetek
const EXTRACTION_PROMPT = `Jestes ekspertem od analizy polskich gazetek promocyjnych. Przeanalizuj DOKLADNIE ten obraz gazetki.

ZADANIE: Wypisz KAZDY produkt widoczny na obrazku. Zwroc szczegolna uwage na:
- Duze ceny promocyjne (zazwyczaj czerwone/zolte)
- Przekresloną stara cene (to jest original_price)
- Procent znizki (np. "-50%", "TANIEJ 30%")
- Nazwe produktu i marke
- Gramature/objetosc (np. 500g, 1L, 6szt)

FORMAT ODPOWIEDZI (TYLKO JSON, bez tekstu):
{
  "products": [
    {
      "name": "Filet z piersi kurczaka",
      "brand": "Kraina Mies",
      "price": 14.99,
      "original_price": 24.99,
      "discount_percent": 40,
      "unit": "1kg",
      "category": "mieso"
    }
  ]
}

ZASADY EKSTRAKCJI CEN:
- Cena promocyjna to DUZA liczba (np. "14,99" lub "14.99" -> zapisz jako 14.99)
- Stara cena jest przekreslona lub mniejsza (to jest original_price)
- Jesli widzisz "za kg" lub "/kg" - unit to "1kg"
- Jesli widzisz "za szt" lub "/szt" - unit to "1szt"
- Ceny w formacie "X,YY zl" zamien na liczbe X.YY

KATEGORIE (wybierz jedna):
- mieso: kurczak, wieprzowina, wolowina, wedliny, kielbasy, bekon, szynka
- nabial: mleko, jogurt, ser, smietana, maslo, jajka, twarog
- pieczywo: chleb, bulki, bagietki, croissanty
- owoce_warzywa: owoce, warzywa, ziemniaki, salatki, grzyby
- napoje: woda, soki, cola, piwo, wino, kawa, herbata
- slodycze: czekolada, ciastka, lody, cukierki, batony
- chemia: proszki, plyny, srodki czystosci
- kosmetyki: szampony, kremy, mydla, dezodoranty
- inne: wszystko inne

WAZNE:
- Wypisz WSZYSTKIE produkty, nawet jesli sa czesciowo widoczne
- Jesli nie mozesz odczytac ceny, wpisz null
- Jesli widzisz "od X,XX zl" - uzyj tej ceny jako price
- Zwroc uwage na male teksty z gramatura/objetoscia

Odpowiedz TYLKO JSON, bez zadnego tekstu przed ani po.`;

/**
 * Wyciaga wszystkie URL obrazkow stron ze strony Blix.pl
 * Zwraca tablice URL w najwyzszej rozdzielczosci
 */
async function extractAllImageUrlsFromBlixPage(pageUrl: string): Promise<string[]> {
  console.log('Fetching Blix page:', pageUrl);

  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Blix page: ${response.status}`);
  }

  const html = await response.text();

  // Szukaj URL obrazkow w najwyzszej rozdzielczosci (bucket=3000)
  const imagePattern = /https:\/\/imgproxy\.blix\.pl\/image\/leaflet\/\d+\/[a-f0-9]+\.jpg\?ext=webp&(?:amp;)?bucket=3000/g;
  const uniqueUrls = new Set<string>();

  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    const url = match[0].replace('&amp;', '&');
    uniqueUrls.add(url);
  }

  if (uniqueUrls.size === 0) {
    throw new Error('Nie znaleziono obrazkow na stronie Blix. Sprawdz czy URL jest poprawny.');
  }

  const urls = Array.from(uniqueUrls);
  console.log(`Found ${urls.length} page images`);
  return urls;
}

/**
 * Wyciaga URL obrazka ze strony Blix.pl dla konkretnej strony
 * Np. https://blix.pl/sklep/biedronka/gazetka/473157/ -> https://imgproxy.blix.pl/image/leaflet/473157/...
 */
async function extractImageUrlFromBlixPage(pageUrl: string, pageNumber: number = 1): Promise<string> {
  const allUrls = await extractAllImageUrlsFromBlixPage(pageUrl);

  // Strony sa numerowane od 1
  const pageIndex = Math.max(0, Math.min(pageNumber - 1, allUrls.length - 1));
  const selectedUrl = allUrls[pageIndex];

  console.log(`Selected page ${pageNumber}/${allUrls.length}: ${selectedUrl}`);
  return selectedUrl;
}

/**
 * Sprawdza czy URL to strona Blix czy bezposredni obrazek
 */
function isBlixPageUrl(url: string): boolean {
  return url.includes('blix.pl/sklep/') && url.includes('/gazetka/');
}

/**
 * Pobiera obrazek z URL i konwertuje do base64
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';

  // Sprawdz czy to rzeczywiscie obrazek
  if (!contentType.startsWith('image/')) {
    throw new Error(
      `URL nie prowadzi do obrazka (otrzymano: ${contentType}). ` +
      `Uzyj bezposredniego URL do obrazka, np. https://imgproxy.blix.pl/image/leaflet/...`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  return { base64, mimeType: contentType };
}

/**
 * Analizuje obrazek gazetki i zwraca liste produktow
 */
export async function extractProducts(imageUrl: string, pageNumber?: number): Promise<OCRResult> {
  if (!OLLAMA_API_KEY) {
    throw new Error('OLLAMA_API_KEY is not configured');
  }

  const startTime = Date.now();

  try {
    // Jesli to strona Blix, wyciagnij URL obrazka
    let actualImageUrl = imageUrl;
    if (isBlixPageUrl(imageUrl)) {
      console.log('Detected Blix page URL, extracting image...');
      actualImageUrl = await extractImageUrlFromBlixPage(imageUrl, pageNumber || 1);
    }

    // Pobierz obrazek i konwertuj do base64
    console.log('Fetching image from:', actualImageUrl);
    const { base64, mimeType } = await fetchImageAsBase64(actualImageUrl);
    console.log('Image fetched, size:', base64.length, 'mime:', mimeType);

    // Stworz data URL
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await fetch(`${OLLAMA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1, // Niska temperatura dla dokładniejszej ekstrakcji
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Ollama API error:', response.status, errorData);
      throw new Error(`Ollama API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    // Wyciagnij odpowiedz z formatu OpenAI-compatible
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Parsuj JSON z odpowiedzi
    const products = parseProductsFromResponse(rawContent);

    return {
      products,
      page_number: pageNumber,
      raw_response: rawContent,
      processing_time_ms: processingTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('extractProducts error:', message);
    throw new Error(`Failed to extract products: ${message}`);
  }
}

/**
 * Parsuje JSON z odpowiedzi modelu
 */
function parseProductsFromResponse(response: string): ExtractedProduct[] {
  try {
    // Usun ewentualne markdown code blocks
    let cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Sprobuj znalezc obiekt JSON
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON object found in response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.products || !Array.isArray(parsed.products)) {
      console.warn('No products array in parsed response');
      return [];
    }

    // Waliduj i normalizuj produkty
    return parsed.products
      .map((p: unknown) => normalizeProduct(p))
      .filter((p: ExtractedProduct | null): p is ExtractedProduct => p !== null);
  } catch (error) {
    console.error('Failed to parse products JSON:', error);
    console.error('Raw response:', response);
    return [];
  }
}

/**
 * Normalizuje i waliduje pojedynczy produkt
 */
function normalizeProduct(raw: unknown): ExtractedProduct | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const p = raw as Record<string, unknown>;

  // Nazwa produktu jest wymagana
  if (!p.name || typeof p.name !== 'string') {
    return null;
  }

  // Normalizuj cene
  const price = parsePrice(p.price);
  const originalPrice = parsePrice(p.original_price);

  // Oblicz procent znizki jesli nie podany
  let discountPercent = typeof p.discount_percent === 'number' ? p.discount_percent : null;
  if (!discountPercent && price !== null && originalPrice !== null && originalPrice > price) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  return {
    name: cleanProductName(p.name as string),
    brand: typeof p.brand === 'string' ? p.brand : null,
    price,
    original_price: originalPrice,
    discount_percent: discountPercent,
    unit: typeof p.unit === 'string' ? p.unit : null,
    category: normalizeCategory(p.category),
    confidence: typeof p.confidence === 'number' ? p.confidence : undefined,
  };
}

/**
 * Parsuje cene z róznych formatow
 */
function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // Usun znaki walutowe i zamien przecinek na kropke
    const cleaned = value
      .replace(/[zł$€]/gi, '')
      .replace(',', '.')
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Czysci nazwe produktu
 */
function cleanProductName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/[^\w\s.,%-żółćęśąźńŻÓŁĆĘŚĄŹŃ]/gi, '')
    .trim();
}

/**
 * Normalizuje kategorie do dozwolonych wartosci
 */
function normalizeCategory(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const categories: Record<string, string> = {
    'nabial': 'nabial',
    'nabiał': 'nabial',
    'mieso': 'mieso',
    'mięso': 'mieso',
    'pieczywo': 'pieczywo',
    'owoce_warzywa': 'owoce_warzywa',
    'owoce': 'owoce_warzywa',
    'warzywa': 'owoce_warzywa',
    'napoje': 'napoje',
    'slodycze': 'slodycze',
    'słodycze': 'slodycze',
    'chemia': 'chemia',
    'kosmetyki': 'kosmetyki',
    'inne': 'inne',
  };

  const normalized = value.toLowerCase().trim();
  return categories[normalized] || 'inne';
}

/**
 * Analizuje wiele stron gazetki jednoczesnie
 */
export async function analyzeFlyer(
  imageUrls: string[],
  options?: {
    delayBetweenRequests?: number; // ms delay to avoid rate limits
  }
): Promise<OCRResult[]> {
  const delay = options?.delayBetweenRequests || 500;
  const results: OCRResult[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    if (i > 0 && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const result = await extractProducts(imageUrls[i], i + 1);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process page ${i + 1}:`, error);
      results.push({
        products: [],
        page_number: i + 1,
        raw_response: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Testuje polaczenie z Ollama API
 */
export async function testConnection(): Promise<{
  success: boolean;
  model: string;
  error?: string;
}> {
  if (!OLLAMA_API_KEY) {
    return {
      success: false,
      model: OLLAMA_VISION_MODEL,
      error: 'OLLAMA_API_KEY is not configured',
    };
  }

  try {
    // Prosty test - sprawdz czy API odpowiada
    const response = await fetch(`${OLLAMA_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        model: OLLAMA_VISION_MODEL,
        error: `API returned ${response.status}`,
      };
    }

    return {
      success: true,
      model: OLLAMA_VISION_MODEL,
    };
  } catch (error) {
    return {
      success: false,
      model: OLLAMA_VISION_MODEL,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pobiera informacje o gazetce Blix (liczba stron)
 */
export async function getBlixFlyerInfo(pageUrl: string): Promise<{ pageCount: number; pageUrls: string[] }> {
  if (!isBlixPageUrl(pageUrl)) {
    throw new Error('URL musi byc strona gazetki Blix (np. https://blix.pl/sklep/.../gazetka/...)');
  }

  const urls = await extractAllImageUrlsFromBlixPage(pageUrl);
  return {
    pageCount: urls.length,
    pageUrls: urls,
  };
}

/**
 * Singleton export
 */
export const ollamaClient = {
  extractProducts,
  analyzeFlyer,
  testConnection,
  getBlixFlyerInfo,
};
