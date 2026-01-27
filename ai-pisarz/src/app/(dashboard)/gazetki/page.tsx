'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  ShoppingCart,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  Info,
  ScanLine,
  X,
  CheckCircle,
  Tag,
  Crop,
  Grid3X3,
  Table,
  Package,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ProductSearchResult, OCRExtractedProduct, PRODUCT_CATEGORY_LABELS, ProductCategory } from '@/types/database';
import { ProductCard, ProductGrid } from '@/components/gazetki/ProductCard';
import { CropEditor } from '@/components/gazetki/CropEditor';

interface GazetkaStats {
  total: number;
  withEmbeddings: number;
  stores: string[];
}

interface OllamaModel {
  id: string;
  name: string;
  size: string;
  isCloud: boolean;
  isVision: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
}

interface ModelsData {
  ollama: {
    configured: boolean;
    all: OllamaModel[];
    vision: OllamaModel[];
    local: OllamaModel[];
    cloud: OllamaModel[];
  };
  openrouter: {
    configured: boolean;
    models: OpenRouterModel[];
  };
}

interface OCRState {
  isScanning: boolean;
  imageUrl: string;
  pageNumber: number;
  totalPages: number | null;
  results: OCRExtractedProduct[];
  error: string | null;
  processingTime: number | null;
  showModal: boolean;
  sourceImageUrl: string | null;     // URL obrazu zrodlowego (do wycinania)
  isCropping: boolean;               // Czy trwa wycinanie obrazkow
  croppedProducts: Map<number, string>; // index -> cropped image URL
  viewMode: 'grid' | 'table';        // Tryb wyswietlania wynikow
  selectedModel: string;             // Wybrany model OCR
  modelUsed: string | null;          // Model uzyty do ostatniego skanowania
  providerUsed: string | null;       // Provider uzyty do ostatniego skanowania
  // Progress tracking
  ocrProgress: number;               // 0-100 progress OCR
  ocrStage: string;                  // Aktualny etap OCR
  cropProgress: number;              // 0-100 progress wycinania
  cropStage: string;                 // Aktualny etap wycinania
  croppedCount: number;              // Ile juz wycieto
  totalToCrop: number;               // Ile do wyciecia
}

interface CropEditorState {
  isOpen: boolean;
  productIndex: number;
  productName: string;
  sourceImageUrl: string;
}

export default function GazetkiPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);

  // Stats state
  const [stats, setStats] = useState<GazetkaStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Vision models state
  const [modelsData, setModelsData] = useState<ModelsData | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  // OCR state
  const [ocr, setOcr] = useState<OCRState>({
    isScanning: false,
    imageUrl: '',
    pageNumber: 1,
    totalPages: null,
    results: [],
    error: null,
    processingTime: null,
    showModal: false,
    sourceImageUrl: null,
    isCropping: false,
    croppedProducts: new Map(),
    viewMode: 'grid',
    selectedModel: '',
    modelUsed: null,
    providerUsed: null,
    ocrProgress: 0,
    ocrStage: '',
    cropProgress: 0,
    cropStage: '',
    croppedCount: 0,
    totalToCrop: 0,
  });

  // CropEditor state
  const [cropEditor, setCropEditor] = useState<CropEditorState>({
    isOpen: false,
    productIndex: 0,
    productName: '',
    sourceImageUrl: '',
  });

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/ocr-models');
        if (response.ok) {
          const data = await response.json();
          setModelsData(data.models || null);
          // Set default model
          if (data.defaultModel) {
            setOcr(prev => ({ ...prev, selectedModel: data.defaultModel }));
          }
        }
      } catch (err) {
        console.error('Error loading OCR models:', err);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = getSupabaseClient();

        // Get total count
        const { count: total } = await supabase
          .from('rrs_blix_gazetki')
          .select('*', { count: 'exact', head: true });

        // Get count with embeddings
        const { count: withEmbeddings } = await supabase
          .from('rrs_blix_gazetki')
          .select('*', { count: 'exact', head: true })
          .not('embedding', 'is', null);

        // Get unique stores from titles
        const { data: titles } = await supabase
          .from('rrs_blix_gazetki')
          .select('title')
          .limit(500);

        const stores = new Set<string>();
        titles?.forEach((item: { title: string }) => {
          // Extract store name from "Gazetka STORE - ..."
          const match = item.title.match(/Gazetka\s+([^-]+)/i);
          if (match) {
            stores.add(match[1].trim());
          }
        });

        setStats({
          total: total || 0,
          withEmbeddings: withEmbeddings || 0,
          stores: Array.from(stores).sort(),
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/product-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          threshold: 0.15,
          limit: 50,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Blad wyszukiwania');
      }

      const data = await response.json();
      setResults(data.results || []);
      setSearchTotal(data.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany blad';
      setError(message);
      setResults([]);
      setSearchTotal(0);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Funkcja do wycinania obrazkow produktow (dwuetapowa: bbox + crop)
  const cropProductImages = useCallback(async (
    sourceImageUrl: string,
    productCount: number,
    pageNumber: number
  ) => {
    if (productCount === 0) {
      console.log('No products to crop');
      return;
    }

    setOcr(prev => ({
      ...prev,
      isCropping: true,
      cropProgress: 0,
      cropStage: 'Wykrywanie pozycji produktow...',
      totalToCrop: productCount,
      croppedCount: 0,
    }));

    try {
      // ETAP 1: Ekstrakcja bounding boxow (0-40%)
      setOcr(prev => ({ ...prev, cropProgress: 10, cropStage: 'Wysylanie do AI (bounding boxes)...' }));

      const bboxResponse = await fetch('/api/extract-bbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: sourceImageUrl }),
      });

      setOcr(prev => ({ ...prev, cropProgress: 30, cropStage: 'Przetwarzanie pozycji...' }));

      if (!bboxResponse.ok) {
        console.error('Bbox extraction failed:', bboxResponse.status);
        setOcr(prev => ({ ...prev, isCropping: false, cropProgress: 0, cropStage: 'Blad wykrywania pozycji' }));
        return;
      }

      const bboxData = await bboxResponse.json();
      const bboxes = bboxData.bboxes || [];

      if (bboxes.length === 0) {
        console.log('No bounding boxes extracted');
        setOcr(prev => ({ ...prev, isCropping: false, cropProgress: 0, cropStage: 'Nie wykryto pozycji produktow' }));
        return;
      }

      setOcr(prev => ({
        ...prev,
        cropProgress: 40,
        cropStage: `Wykryto ${bboxes.length} produktow, wycinanie...`,
        totalToCrop: bboxes.length,
      }));

      // ETAP 2: Wycinanie obrazkow (40-100%)
      const cropResponse = await fetch('/api/crop-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sourceImageUrl,
          products: bboxes.map((b: { name: string; bbox: number[] }, index: number) => ({
            id: `product_${index}`,
            bbox: b.bbox,
          })),
          pageNumber,
        }),
      });

      setOcr(prev => ({ ...prev, cropProgress: 80, cropStage: 'Przetwarzanie obrazkow...' }));

      if (!cropResponse.ok) {
        console.error('Crop API error:', cropResponse.status);
        setOcr(prev => ({ ...prev, isCropping: false, cropProgress: 0, cropStage: 'Blad wycinania' }));
        return;
      }

      const cropData = await cropResponse.json();

      if (cropData.croppedImages && cropData.croppedImages.length > 0) {
        const croppedMap = new Map<number, string>();
        for (const img of cropData.croppedImages) {
          const indexMatch = img.id.match(/product_(\d+)/);
          if (indexMatch) {
            const index = parseInt(indexMatch[1], 10);
            croppedMap.set(index, img.imageUrl);
          }
        }

        setOcr(prev => ({
          ...prev,
          croppedProducts: croppedMap,
          cropProgress: 100,
          cropStage: `Wycieto ${croppedMap.size} obrazkow`,
          croppedCount: croppedMap.size,
          isCropping: false,
        }));

        console.log(`Cropped ${croppedMap.size} product images`);
      } else {
        setOcr(prev => ({ ...prev, isCropping: false, cropProgress: 100, cropStage: 'Brak obrazkow do wyciecia' }));
      }
    } catch (err) {
      console.error('Error in crop pipeline:', err);
      setOcr(prev => ({ ...prev, isCropping: false, cropProgress: 0, cropStage: 'Blad wycinania' }));
    }
  }, []);

  // OCR scan handler - accepts optional URL and page number for direct scanning
  const handleOcrScan = useCallback(async (directUrl?: string, pageNum?: number) => {
    const urlToScan = directUrl || ocr.imageUrl.trim();
    const pageToScan = pageNum || ocr.pageNumber;
    if (!urlToScan) return;

    // Determine provider based on selected model
    const isOpenRouter = ocr.selectedModel.includes('/'); // OpenRouter models have format "provider/model"
    const provider = isOpenRouter ? 'openrouter' : 'ollama';
    const model = ocr.selectedModel || undefined;

    setOcr(prev => ({
      ...prev,
      imageUrl: urlToScan,
      pageNumber: pageToScan,
      isScanning: true,
      error: null,
      results: [],
      processingTime: null,
      sourceImageUrl: null,
      croppedProducts: new Map(),
      modelUsed: null,
      providerUsed: null,
      ocrProgress: 0,
      ocrStage: 'Pobieranie strony gazetki...',
      cropProgress: 0,
      cropStage: '',
      croppedCount: 0,
      totalToCrop: 0,
    }));

    try {
      // Stage 1: Fetching
      setOcr(prev => ({ ...prev, ocrProgress: 10, ocrStage: 'Pobieranie obrazu...' }));

      // Stage 2: Sending to API
      setOcr(prev => ({ ...prev, ocrProgress: 30, ocrStage: 'Wysylanie do modelu AI...' }));

      const response = await fetch('/api/ocr-gazetka', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: urlToScan,
          pageNumber: pageToScan,
          saveToDatabase: false,
          provider,
          model,
        }),
      });

      // Stage 3: Processing response
      setOcr(prev => ({ ...prev, ocrProgress: 80, ocrStage: 'Przetwarzanie wynikow...' }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Blad OCR');
      }

      const data = await response.json();
      const products = data.products || [];
      const sourceUrl = data.sourceImageUrl || null;

      // Stage 4: Done
      setOcr(prev => ({
        ...prev,
        results: products,
        totalPages: data.totalPages || null,
        processingTime: data.processingTimeMs || null,
        sourceImageUrl: sourceUrl,
        showModal: true,
        isScanning: false,
        modelUsed: data.modelUsed || null,
        providerUsed: data.providerUsed || null,
        ocrProgress: 100,
        ocrStage: `Znaleziono ${products.length} produktow`,
      }));

      // Automatyczne wycinanie obrazkow produktow
      if (sourceUrl && products.length > 0) {
        cropProductImages(sourceUrl, products.length, pageToScan);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany blad';
      setOcr(prev => ({
        ...prev,
        error: message,
        isScanning: false,
        ocrProgress: 0,
        ocrStage: '',
      }));
    }
  }, [ocr.imageUrl, ocr.pageNumber, ocr.selectedModel, cropProductImages]);

  // Close OCR modal
  const closeOcrModal = useCallback(() => {
    setOcr(prev => ({
      ...prev,
      showModal: false,
    }));
  }, []);

  // Otworz CropEditor dla produktu
  const handleOpenCropEditor = useCallback((index: number) => {
    if (!ocr.sourceImageUrl) {
      console.error('No source image URL available');
      return;
    }

    const product = ocr.results[index];
    if (!product) {
      console.error('Product not found at index:', index);
      return;
    }

    setCropEditor({
      isOpen: true,
      productIndex: index,
      productName: product.name,
      sourceImageUrl: ocr.sourceImageUrl,
    });
  }, [ocr.sourceImageUrl, ocr.results]);

  // Zamknij CropEditor
  const handleCloseCropEditor = useCallback(() => {
    setCropEditor(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Po zatwierdzeniu kadrowania - aktualizuj obrazek produktu
  const handleCropComplete = useCallback((productIndex: number, croppedImageUrl: string) => {
    setOcr(prev => {
      const newCroppedProducts = new Map(prev.croppedProducts);
      newCroppedProducts.set(productIndex, croppedImageUrl);
      return {
        ...prev,
        croppedProducts: newCroppedProducts,
      };
    });

    // Zamknij CropEditor
    setCropEditor(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Format price for display
  const formatPrice = (price: number | null): string => {
    if (price === null) return '-';
    return `${price.toFixed(2).replace('.', ',')} zl`;
  };

  // Get category label
  const getCategoryLabel = (category: string | null): string => {
    if (!category) return 'Inne';
    return PRODUCT_CATEGORY_LABELS[category as ProductCategory] || category;
  };

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  // Extract store name from title
  const extractStoreName = (title: string) => {
    const match = title.match(/Gazetka\s+([^-]+)/i);
    return match ? match[1].trim() : null;
  };

  // Extract gazetka name (without store prefix)
  const extractGazetkaName = (title: string) => {
    // Remove "Gazetka STORE - " prefix and "Gazetka " prefix from the rest
    let name = title.replace(/^Gazetka\s+[^-]+\s*-\s*/i, '');
    name = name.replace(/^Gazetka\s+/i, '');
    return name || title;
  };

  // Extract products with prices from description
  const extractProducts = (description: string | null): string => {
    if (!description) return '-';

    // Find products with prices pattern: "product za X,XXzł" or "product X,XXzł"
    const pricePattern = /([A-ZĄĆĘŁŃÓŚŹŻ][^,]*?)\s+(?:za\s+)?(\d+[,\.]\d{2}\s*zł)/gi;
    const matches: string[] = [];
    let match;

    while ((match = pricePattern.exec(description)) !== null && matches.length < 4) {
      const product = match[1].trim();
      const price = match[2].trim();
      // Clean up product name - remove common prefixes
      const cleanProduct = product
        .replace(/^oferty na:\s*/i, '')
        .replace(/^m\.in\.\s*/i, '')
        .replace(/^Znajdziesz w niej\s*/i, '')
        .trim();
      if (cleanProduct.length > 3 && cleanProduct.length < 60) {
        matches.push(`${cleanProduct} ${price}`);
      }
    }

    if (matches.length === 0) {
      // Try to extract any mention of products
      const shortDesc = description.slice(0, 150);
      if (shortDesc.includes('promocj')) {
        return 'Różne promocje';
      }
      return '-';
    }

    return matches.join(', ');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <ShoppingCart className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Wyszukiwarka gazetek</h2>
            <p className="text-slate-500">Znajdz promocje semantycznie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {stats.withEmbeddings} gazetek
            </Badge>
          )}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Jak dziala wyszukiwarka?</h3>
              <p className="text-sm text-slate-600">
                Wpisz czego szukasz w jezyku naturalnym, np. &quot;promocje na mleko&quot;,
                &quot;tanie owoce&quot;, &quot;kosmetyki w lidlu&quot;. System znajdzie najbardziej
                pasujace gazetki promocyjne na podstawie znaczenia, nie tylko slow kluczowych.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                  np. &quot;promocje na pieczywo&quot;
                </span>
                <span className="text-xs bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                  np. &quot;sery i wedliny&quot;
                </span>
                <span className="text-xs bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                  np. &quot;zabawki dla dzieci&quot;
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-orange-600" />
            Wyszukaj promocje
          </CardTitle>
          <CardDescription>
            Wpisz zapytanie w jezyku naturalnym, aby znalezc pasujace gazetki
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Czego szukasz? np. promocje na owoce, tanie mleko, kosmetyki..."
                  className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isSearching}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="bg-orange-600 hover:bg-orange-700 px-6"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Szukam...
                  </>
                ) : (
                  'Szukaj'
                )}
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OCR Scan Card */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="h-5 w-5 text-purple-600" />
            Skanuj gazetke (OCR)
          </CardTitle>
          <CardDescription>
            Wklej URL gazetki z Blix.pl lub kliknij przycisk &quot;Skanuj&quot; przy wyniku wyszukiwania
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Model selector */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700">
                <Cpu className="h-4 w-4" />
                <span className="text-sm font-medium">Model OCR:</span>
              </div>
              <div className="relative flex-1 max-w-lg">
                <select
                  value={ocr.selectedModel}
                  onChange={(e) => setOcr(prev => ({ ...prev, selectedModel: e.target.value }))}
                  disabled={ocr.isScanning || loadingModels}
                  className="w-full px-3 py-2 pr-8 text-sm border border-purple-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingModels ? (
                    <option>Ladowanie modeli...</option>
                  ) : !modelsData ? (
                    <option>Brak modeli (uruchom Ollama)</option>
                  ) : (
                    <>
                      {/* Ollama Local */}
                      {modelsData.ollama.local.filter(m => m.isVision).length > 0 && (
                        <optgroup label="Ollama Lokalnie">
                          {modelsData.ollama.local
                            .filter(m => m.isVision)
                            .map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.size})
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {/* Ollama Cloud */}
                      {modelsData.ollama.cloud.length > 0 && (
                        <optgroup label="Ollama Cloud">
                          {modelsData.ollama.cloud.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.isVision ? '(vision)' : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {/* OpenRouter */}
                      {modelsData.openrouter.configured && modelsData.openrouter.models.length > 0 && (
                        <optgroup label="OpenRouter">
                          {modelsData.openrouter.models.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} - {model.description}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500 pointer-events-none" />
              </div>
              {modelsData && (
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                  {modelsData.ollama.vision.length + (modelsData.openrouter.configured ? modelsData.openrouter.models.length : 0)} vision
                </Badge>
              )}
            </div>

            {/* Image URL input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={ocr.imageUrl}
                  onChange={(e) => setOcr(prev => ({ ...prev, imageUrl: e.target.value, totalPages: null }))}
                  placeholder="https://blix.pl/sklep/biedronka/gazetka/473157/"
                  className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={ocr.isScanning}
                />
              </div>
              {/* Page number selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 whitespace-nowrap">Strona:</label>
                <input
                  type="number"
                  min={1}
                  max={ocr.totalPages || 999}
                  value={ocr.pageNumber}
                  onChange={(e) => setOcr(prev => ({ ...prev, pageNumber: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 px-2 py-3 text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={ocr.isScanning}
                />
                {ocr.totalPages && (
                  <span className="text-sm text-slate-500">/ {ocr.totalPages}</span>
                )}
              </div>
              <Button
                onClick={() => handleOcrScan()}
                disabled={ocr.isScanning || !ocr.imageUrl.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-6"
                size="lg"
              >
                {ocr.isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Skanuje...
                  </>
                ) : (
                  'Skanuj'
                )}
              </Button>
            </div>

            {/* OCR Status */}
            {ocr.isScanning && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Skanowanie strony {ocr.pageNumber}...</span>
              </div>
            )}

            {/* OCR Error message */}
            {ocr.error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{ocr.error}</span>
              </div>
            )}

            {/* Help text */}
            <div className="text-xs text-slate-500">
              <span className="font-medium">Wskazowka:</span> Wklej link do gazetki z Blix.pl.
              System automatycznie pobierze wszystkie strony. Uzyj selektora &quot;Strona&quot; aby przeskakiwac miedzy stronami gazetki.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR Results Modal */}
      {ocr.showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Wyniki OCR - Strona {ocr.pageNumber}{ocr.totalPages && ` z ${ocr.totalPages}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Znaleziono {ocr.results.length} produktow
                    {ocr.processingTime && (
                      <span className="ml-2 text-xs">
                        (czas: {(ocr.processingTime / 1000).toFixed(1)}s)
                      </span>
                    )}
                    {ocr.modelUsed && (
                      <span className="ml-2 text-xs text-purple-600">
                        <Cpu className="inline h-3 w-3 mr-1" />
                        {ocr.modelUsed}
                      </span>
                    )}
                    {ocr.isCropping && (
                      <span className="ml-2 text-xs text-orange-600">
                        <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                        Wycinanie obrazkow...
                      </span>
                    )}
                    {ocr.croppedProducts.size > 0 && !ocr.isCropping && (
                      <span className="ml-2 text-xs text-green-600">
                        <Crop className="inline h-3 w-3 mr-1" />
                        {ocr.croppedProducts.size} obrazkow wyciętych
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* View mode toggle */}
                  <div className="flex items-center border rounded-lg overflow-hidden mr-2">
                    <Button
                      variant={ocr.viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setOcr(prev => ({ ...prev, viewMode: 'grid' }))}
                      className={`h-8 px-3 rounded-none ${ocr.viewMode === 'grid' ? 'bg-purple-600' : ''}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={ocr.viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setOcr(prev => ({ ...prev, viewMode: 'table' }))}
                      className={`h-8 px-3 rounded-none ${ocr.viewMode === 'table' ? 'bg-purple-600' : ''}`}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Page navigation */}
                  {ocr.totalPages && ocr.totalPages > 1 && (
                    <div className="flex items-center gap-1 mr-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ocr.pageNumber <= 1 || ocr.isScanning}
                        onClick={() => handleOcrScan(ocr.imageUrl, ocr.pageNumber - 1)}
                        className="h-8 px-2"
                      >
                        ←
                      </Button>
                      <span className="text-sm text-slate-600 px-2">
                        {ocr.pageNumber} / {ocr.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ocr.pageNumber >= ocr.totalPages || ocr.isScanning}
                        onClick={() => handleOcrScan(ocr.imageUrl, ocr.pageNumber + 1)}
                        className="h-8 px-2"
                      >
                        →
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeOcrModal}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 p-4">
              {ocr.isScanning ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-purple-500 animate-spin" />
                  <p>Skanuje strone {ocr.pageNumber}...</p>
                  <p className="text-sm mt-2">Model AI analizuje obraz gazetki</p>
                </div>
              ) : ocr.results.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <ScanLine className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Nie znaleziono produktow na tej stronie.</p>
                  <p className="text-sm mt-2">Sprobuj inna strone gazetki - uzyj strzalek powyzej.</p>
                </div>
              ) : ocr.viewMode === 'grid' ? (
                /* Grid view with ProductCards */
                <ProductGrid columns={4}>
                  {ocr.results.map((product, index) => (
                    <ProductCard
                      key={index}
                      imageUrl={ocr.croppedProducts.get(index) || product.cropped_image_url || null}
                      name={product.name}
                      brand={product.brand}
                      price={product.price}
                      originalPrice={product.original_price}
                      discountPercent={product.discount_percent}
                      unit={product.unit}
                      category={product.category}
                      isLoading={ocr.isCropping && product.bbox != null}
                      showCropButton={!!ocr.sourceImageUrl}
                      onCropClick={() => handleOpenCropEditor(index)}
                    />
                  ))}
                </ProductGrid>
              ) : (
                /* Table view */
                <div className="overflow-x-auto -mx-4">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Produkt
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Marka
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Cena
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Cena przed
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Rabat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Kategoria
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ocr.results.map((product, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {/* Mini thumbnail z przyciskiem kadrowania */}
                              <div className="relative group">
                                {ocr.croppedProducts.get(index) ? (
                                  <img
                                    src={ocr.croppedProducts.get(index)}
                                    alt={product.name}
                                    className="w-12 h-12 object-contain rounded border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center">
                                    <Package className="w-6 h-6 text-slate-300" />
                                  </div>
                                )}
                                {/* Przycisk kadrowania przy hover */}
                                {ocr.sourceImageUrl && (
                                  <button
                                    onClick={() => handleOpenCropEditor(index)}
                                    className="absolute inset-0 bg-purple-600/80 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Kadruj"
                                  >
                                    <Crop className="w-4 h-4 text-white" />
                                  </button>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{product.name}</div>
                                {product.unit && (
                                  <div className="text-xs text-slate-500">{product.unit}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {product.brand || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-green-700">
                              {formatPrice(product.price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-500">
                            {product.original_price ? (
                              <span className="line-through">
                                {formatPrice(product.original_price)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {product.discount_percent ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-700">
                                -{product.discount_percent}%
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Tag className="h-3 w-3" />
                              {getCategoryLabel(product.category || null)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CropEditor Modal */}
      {cropEditor.isOpen && cropEditor.sourceImageUrl && (
        <CropEditor
          sourceImageUrl={cropEditor.sourceImageUrl}
          productName={cropEditor.productName}
          productIndex={cropEditor.productIndex}
          onCropComplete={handleCropComplete}
          onCancel={handleCloseCropEditor}
        />
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Znaleziono {searchTotal} wynikow
                {searchTotal > results.length && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    (pokazuje {results.length})
                  </span>
                )}
              </CardTitle>
            </div>
            <CardDescription>
              Wyniki wyszukiwania semantycznego z gazetek promocyjnych Blix.pl
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Sklep
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Gazetka
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[300px]">
                      Promocje
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Dopasowanie
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Link
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      OCR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((result) => {
                    const storeName = extractStoreName(result.title);
                    const gazetkaName = extractGazetkaName(result.title);
                    const products = extractProducts(result.description);
                    const similarity = Math.round(result.similarity * 100);

                    return (
                      <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                        {/* Sklep */}
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-semibold">
                            {storeName || 'Nieznany'}
                          </Badge>
                        </td>

                        {/* Gazetka */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">
                            {gazetkaName}
                          </div>
                          {result.pub_date && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(result.pub_date)}
                            </div>
                          )}
                        </td>

                        {/* Promocje */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-700">
                            {products}
                          </div>
                        </td>

                        {/* Dopasowanie */}
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`font-bold ${
                              similarity >= 50
                                ? 'text-green-700 border-green-300 bg-green-50'
                                : similarity >= 35
                                  ? 'text-yellow-700 border-yellow-300 bg-yellow-50'
                                  : 'text-slate-600 border-slate-300 bg-slate-50'
                            }`}
                          >
                            {similarity}%
                          </Badge>
                        </td>

                        {/* Link */}
                        <td className="px-4 py-3 text-center">
                          {result.link && (
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </td>

                        {/* OCR Scan */}
                        <td className="px-4 py-3 text-center">
                          {result.link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                              disabled={ocr.isScanning}
                              onClick={() => handleOcrScan(result.link || '')}
                            >
                              <ScanLine className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state after search */}
      {!isSearching && query && results.length === 0 && !error && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Search className="h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700">Brak wynikow</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Nie znaleziono gazetek pasujacych do zapytania &quot;{query}&quot;.
              Sprobuj innego opisu lub bardziej ogolnych slow.
            </p>
          </div>
        </Card>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-500">Wszystkich gazetek</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.withEmbeddings}</div>
            <div className="text-sm text-slate-500">Z embeddingami</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.stores.length}</div>
            <div className="text-sm text-slate-500">Unikalnych sklepow</div>
          </Card>
        </div>
      )}

      {/* Store list */}
      {stats && stats.stores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Dostepne sklepy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.stores.map((store) => (
                <Badge
                  key={store}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => {
                    setQuery(`promocje ${store}`);
                  }}
                >
                  {store}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
