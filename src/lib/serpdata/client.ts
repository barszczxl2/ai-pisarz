/**
 * SerpData.io Client
 * API do wyszukiwania wyników Google (SERP)
 */

export interface SerpSearchParams {
  keyword: string;
  hl?: string; // język wyników (np. 'pl', 'en')
  gl?: string; // kraj (np. 'pl', 'us')
  num?: number; // liczba wyników (max 100)
  start?: number; // offset dla paginacji
}

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayedLink?: string;
}

export interface SerpAIOverview {
  content: string;
  sources?: { title: string; link: string }[];
}

export interface SerpSearchResponse {
  searchInformation: {
    totalResults: string;
    searchTime: number;
  };
  organicResults: SerpResult[];
  aiOverview?: SerpAIOverview;
  relatedSearches?: string[];
  peopleAlsoAsk?: { question: string; answer: string }[];
}

class SerpDataClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SERPDATA_API_KEY || '';
    this.baseUrl = process.env.SERPDATA_BASE_URL || 'https://api.serpdata.io/v1';
  }

  async search(params: SerpSearchParams): Promise<SerpSearchResponse> {
    if (!this.apiKey) {
      throw new Error('SERPDATA_API_KEY is not configured');
    }

    const searchParams = new URLSearchParams({
      keyword: params.keyword,
      hl: params.hl || 'pl',
      gl: params.gl || 'pl',
      num: String(params.num || 10),
      ...(params.start && { start: String(params.start) }),
    });

    const response = await fetch(`${this.baseUrl}/search?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SerpData API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Wykonaj prostą wyszukiwarkę testową
      await this.search({ keyword: 'test', num: 1 });
      return { success: true, message: 'Połączenie z SerpData.io działa poprawnie' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Nieznany błąd'
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const serpDataClient = new SerpDataClient();
