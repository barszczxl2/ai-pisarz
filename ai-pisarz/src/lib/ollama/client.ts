/**
 * Vision API Client (Ollama Cloud + OpenRouter)
 *
 * Obsługuje wielu providerów do analizy obrazów gazetek:
 * - Ollama Cloud (qwen3-vl, llava, minicpm-v)
 * - OpenRouter (gemini-flash, claude-3.5-sonnet, gpt-4o)
 */

// Provider configuration
const OLLAMA_LOCAL_URL = 'http://localhost:11434/v1';
const OLLAMA_CLOUD_URL = process.env.OLLAMA_API_URL || 'https://ollama.com/v1';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'qwen3-vl:8b';

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Typy dla providerów
export type VisionProvider = 'ollama' | 'ollama-cloud' | 'openrouter';

/**
 * Sprawdza czy model jest cloud (ma suffix -cloud)
 */
function isCloudModel(modelId: string): boolean {
  return modelId.includes('-cloud');
}

// Typy dla produktów wyciągniętych z gazetki
export interface ExtractedProduct {
  name: string;
  brand?: string | null;
  price: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  unit?: string | null;
  category?: string | null;
  confidence?: number;
  bbox?: [number, number, number, number] | null;
}

export interface OCRResult {
  products: ExtractedProduct[];
  page_number?: number;
  raw_response?: string;
  processing_time_ms?: number;
  source_image_url?: string;
  model_used?: string;
  provider_used?: VisionProvider;
}

// Prompt do ekstrakcji produktów z gazetki
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

// Prompt do ekstrakcji bounding boxów
const BBOX_EXTRACTION_PROMPT = `Przeanalizuj obraz gazetki i dla KAZDEGO widocznego produktu podaj jego lokalizacje.

Zwroc JSON z lista produktow i ich bounding boxami:
{
  "products": [
    {"name": "nazwa produktu", "bbox": [x1, y1, x2, y2]}
  ]
}

bbox = [lewy_gorny_x, lewy_gorny_y, prawy_dolny_x, prawy_dolny_y] w pikselach
Prostokat powinien obejmowac: obrazek produktu, nazwe i cene.

Odpowiedz TYLKO JSON.`;

export interface BboxResult {
  name: string;
  bbox: [number, number, number, number];
}

/**
 * Pobiera konfigurację dla danego providera i modelu
 */
function getProviderConfig(provider: VisionProvider, model?: string): { apiUrl: string; apiKey: string | undefined; needsAuth: boolean } {
  if (provider === 'openrouter') {
    return {
      apiUrl: OPENROUTER_API_URL,
      apiKey: OPENROUTER_API_KEY,
      needsAuth: true,
    };
  }

  // Ollama - sprawdź czy model jest cloud czy lokalny
  const isCloud = model ? isCloudModel(model) : false;

  if (isCloud) {
    return {
      apiUrl: OLLAMA_CLOUD_URL,
      apiKey: OLLAMA_API_KEY,
      needsAuth: true,
    };
  }

  // Lokalny Ollama - nie wymaga auth
  return {
    apiUrl: OLLAMA_LOCAL_URL,
    apiKey: undefined,
    needsAuth: false,
  };
}

/**
 * Sprawdza czy provider jest skonfigurowany
 */
export function isProviderConfigured(provider: VisionProvider): boolean {
  if (provider === 'openrouter') {
    return !!OPENROUTER_API_KEY;
  }
  if (provider === 'ollama-cloud') {
    return !!OLLAMA_API_KEY;
  }
  // Lokalny Ollama - zawsze dostępny (jeśli uruchomiony)
  return true;
}


/**
 * Wywołuje API vision dla danego providera
 */
async function callVisionAPI(
  provider: VisionProvider,
  model: string,
  prompt: string,
  imageDataUrl: string
): Promise<string> {
  const config = getProviderConfig(provider, model);

  // Sprawdź czy potrzebna jest autoryzacja
  if (config.needsAuth && !config.apiKey) {
    throw new Error(`${provider.toUpperCase()} API key is not configured`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Dodaj autoryzację tylko jeśli potrzebna
  if (config.needsAuth && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // OpenRouter wymaga dodatkowych nagłówków
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ai-pisarz.local';
    headers['X-Title'] = 'AI Pisarz OCR';
  }

  const isCloud = isCloudModel(model);
  console.log(`Calling ${isCloud ? 'Ollama Cloud' : 'Ollama Local'} API: ${config.apiUrl} with model: ${model}`);

  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`${provider} API error:`, response.status, errorData);
    throw new Error(`${provider} API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Wyciąga bounding boxy produktów z obrazu
 */
export async function extractBoundingBoxes(
  imageUrl: string,
  options?: { provider?: VisionProvider; model?: string }
): Promise<BboxResult[]> {
  const provider = options?.provider || 'ollama';
  const model = options?.model || (provider === 'ollama' ? OLLAMA_VISION_MODEL : 'google/gemini-flash-1.5');

  try {
    const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const rawContent = await callVisionAPI(provider, model, BBOX_EXTRACTION_PROMPT, dataUrl);
    return parseBboxFromResponse(rawContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('extractBoundingBoxes error:', message);
    return [];
  }
}

/**
 * Parsuje bounding boxy z odpowiedzi modelu
 */
function parseBboxFromResponse(response: string): BboxResult[] {
  try {
    let cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.products || !Array.isArray(parsed.products)) return [];

    return parsed.products
      .filter((p: { name?: string; bbox?: unknown[] }) =>
        p.name && p.bbox && Array.isArray(p.bbox) && p.bbox.length === 4
      )
      .map((p: { name: string; bbox: number[] }) => ({
        name: p.name,
        bbox: [
          Math.round(p.bbox[0]),
          Math.round(p.bbox[1]),
          Math.round(p.bbox[2]),
          Math.round(p.bbox[3]),
        ] as [number, number, number, number],
      }));
  } catch (error) {
    console.error('Failed to parse bbox JSON:', error);
    return [];
  }
}

/**
 * Wyciąga wszystkie URL obrazków stron ze strony Blix.pl
 */
export async function extractAllImageUrlsFromBlixPage(pageUrl: string): Promise<string[]> {
  console.log('Fetching Blix page:', pageUrl);

  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Blix page: ${response.status}`);
  }

  const html = await response.text();

  const imagePattern = /https:\/\/imgproxy\.blix\.pl\/image\/leaflet\/\d+\/[a-f0-9]+\.(jpg|png)\?ext=webp&(?:amp;)?bucket=3000/g;
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
 * Wyciąga URL obrazka ze strony Blix.pl dla konkretnej strony
 */
async function extractImageUrlFromBlixPage(pageUrl: string, pageNumber: number = 1): Promise<string> {
  const allUrls = await extractAllImageUrlsFromBlixPage(pageUrl);
  const pageIndex = Math.max(0, Math.min(pageNumber - 1, allUrls.length - 1));
  const selectedUrl = allUrls[pageIndex];

  console.log(`Selected page ${pageNumber}/${allUrls.length}: ${selectedUrl}`);
  return selectedUrl;
}

/**
 * Sprawdza czy URL to strona Blix czy bezpośredni obrazek
 */
function isBlixPageUrl(url: string): boolean {
  return url.includes('blix.pl/sklep/') && url.includes('/gazetka/');
}

/**
 * Pobiera obrazek z URL i konwertuje do base64
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';

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
 * Analizuje obrazek gazetki i zwraca listę produktów
 */
export async function extractProducts(
  imageUrl: string,
  pageNumber?: number,
  options?: { provider?: VisionProvider; model?: string }
): Promise<OCRResult> {
  const provider = options?.provider || 'ollama';
  // Use provided model if it's a non-empty string, otherwise fallback to default
  const model = (options?.model && options.model.trim() !== '')
    ? options.model
    : (provider === 'ollama' ? OLLAMA_VISION_MODEL : 'google/gemini-flash-1.5');

  console.log(`OCR using model: ${model} (provider: ${provider})`);

  const startTime = Date.now();

  try {
    // Jeśli to strona Blix, wyciągnij URL obrazka
    let actualImageUrl = imageUrl;
    if (isBlixPageUrl(imageUrl)) {
      console.log('Detected Blix page URL, extracting image...');
      actualImageUrl = await extractImageUrlFromBlixPage(imageUrl, pageNumber || 1);
    }

    // Pobierz obrazek i konwertuj do base64
    console.log('Fetching image from:', actualImageUrl);
    const { base64, mimeType } = await fetchImageAsBase64(actualImageUrl);
    console.log('Image fetched, size:', base64.length, 'mime:', mimeType);

    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Wywołaj API
    console.log(`Calling ${provider} API with model: ${model}`);
    const rawContent = await callVisionAPI(provider, model, EXTRACTION_PROMPT, dataUrl);

    const processingTime = Date.now() - startTime;

    // Parsuj JSON z odpowiedzi
    const products = parseProductsFromResponse(rawContent);

    return {
      products,
      page_number: pageNumber,
      raw_response: rawContent,
      processing_time_ms: processingTime,
      source_image_url: actualImageUrl,
      model_used: model,
      provider_used: provider,
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
    let cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

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

  if (!p.name || typeof p.name !== 'string') {
    return null;
  }

  const price = parsePrice(p.price);
  const originalPrice = parsePrice(p.original_price);

  let discountPercent = typeof p.discount_percent === 'number' ? p.discount_percent : null;
  if (!discountPercent && price !== null && originalPrice !== null && originalPrice > price) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const bbox = parseBbox(p.bbox);

  return {
    name: cleanProductName(p.name as string),
    brand: typeof p.brand === 'string' ? p.brand : null,
    price,
    original_price: originalPrice,
    discount_percent: discountPercent,
    unit: typeof p.unit === 'string' ? p.unit : null,
    category: normalizeCategory(p.category),
    confidence: typeof p.confidence === 'number' ? p.confidence : undefined,
    bbox,
  };
}

function parseBbox(value: unknown): [number, number, number, number] | null {
  if (!value) return null;

  if (Array.isArray(value) && value.length === 4) {
    const [x1, y1, x2, y2] = value.map(v => {
      if (typeof v === 'number') return Math.round(v);
      if (typeof v === 'string') return Math.round(parseFloat(v));
      return 0;
    });

    if (x1 >= 0 && y1 >= 0 && x2 > x1 && y2 > y1) {
      return [x1, y1, x2, y2];
    }
  }

  return null;
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[zł$€]/gi, '')
      .replace(',', '.')
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

function cleanProductName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/[^\w\s.,%-żółćęśąźńŻÓŁĆĘŚĄŹŃ]/gi, '')
    .trim();
}

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
 * Analizuje wiele stron gazetki jednocześnie
 */
export async function analyzeFlyer(
  imageUrls: string[],
  options?: {
    delayBetweenRequests?: number;
    provider?: VisionProvider;
    model?: string;
  }
): Promise<OCRResult[]> {
  const delay = options?.delayBetweenRequests || 500;
  const results: OCRResult[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    if (i > 0 && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const result = await extractProducts(imageUrls[i], i + 1, {
        provider: options?.provider,
        model: options?.model,
      });
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
 * Testuje połączenie z API
 */
export async function testConnection(provider?: VisionProvider): Promise<{
  success: boolean;
  model: string;
  provider: VisionProvider;
  error?: string;
}> {
  const p = provider || 'ollama';
  const config = getProviderConfig(p);
  const model = p === 'ollama' ? OLLAMA_VISION_MODEL : 'google/gemini-flash-1.5';

  if (!config.apiKey) {
    return {
      success: false,
      model,
      provider: p,
      error: `${p.toUpperCase()} API key is not configured`,
    };
  }

  try {
    const response = await fetch(`${config.apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        model,
        provider: p,
        error: `API returned ${response.status}`,
      };
    }

    return {
      success: true,
      model,
      provider: p,
    };
  } catch (error) {
    return {
      success: false,
      model,
      provider: p,
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
  extractBoundingBoxes,
  analyzeFlyer,
  testConnection,
  getBlixFlyerInfo,
  isProviderConfigured,
};
