'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Search,
  BarChart3,
  Globe,
  Zap,
  Target,
  LineChart,
  Flame,
  Newspaper,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { GoogleTrend } from '@/types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

const FEATURES = [
  {
    icon: Search,
    title: 'Analiza trendow wyszukiwania',
    description: 'Monitoruj popularnosc fraz kluczowych w czasie i identyfikuj rosnace trendy',
  },
  {
    icon: Globe,
    title: 'Trendy regionalne',
    description: 'Sprawdz jakie tematy sa popularne w Polsce i innych krajach',
  },
  {
    icon: LineChart,
    title: 'Porownanie fraz',
    description: 'Porownuj do 5 fraz jednoczesnie i analizuj ich wzajemne relacje',
  },
  {
    icon: Target,
    title: 'Powiazane zapytania',
    description: 'Odkrywaj powiazane tematy i rozszerzaj strategie content marketingu',
  },
  {
    icon: Zap,
    title: 'Alerty trendow',
    description: 'Otrzymuj powiadomienia gdy Twoje frazy zyskuja na popularnosci',
  },
  {
    icon: BarChart3,
    title: 'Eksport danych',
    description: 'Pobieraj dane do CSV i integruj z innymi narzedziami analitycznymi',
  },
];

type SortOption = 'traffic' | 'date' | 'keyword';

function formatTraffic(traffic: number | null): string {
  if (!traffic) return '-';
  if (traffic >= 1000) return `${Math.floor(traffic / 1000)}M+`;
  if (traffic >= 100) return `${traffic}K+`;
  return `${traffic}K`;
}

/**
 * Parsuje pole media_links z bazy danych.
 *
 * Format w bazie (multi-line string):
 * ```
 * - tytuł: Tytuł artykułu 1
 *  - Link: https://example.com/article1
 *
 * - tytuł: Tytuł artykułu 2
 *  - Link: https://example.com/article2
 * ```
 *
 * Wpisy są rozdzielone podwójnymi znakami nowej linii.
 * Każdy wpis ma "- tytuł:" i " - Link:" na osobnych liniach.
 */
function parseMediaLinks(mediaLinksString: string | null): { title: string; url: string }[] {
  if (!mediaLinksString) return [];
  try {
    // Rozdziel wpisy po podwójnej nowej linii
    const entries = mediaLinksString.split(/\n\n+/);

    return entries.map((entry) => {
      // Znajdź tytuł: "- tytuł: [treść]"
      const titleMatch = entry.match(/-\s*tytuł:\s*(.+)/i);
      // Znajdź link: " - Link: [url]"
      const linkMatch = entry.match(/-\s*Link:\s*(https?:\/\/[^\s]+)/i);

      return {
        title: titleMatch?.[1]?.trim() || '',
        url: linkMatch?.[1]?.trim() || ''
      };
    }).filter(item => item.title && item.url);
  } catch {
    return [];
  }
}

function parseMedia(mediaString: string | null): string[] {
  if (!mediaString) return [];
  return mediaString.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<GoogleTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('traffic');
  const [filterInteria, setFilterInteria] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<GoogleTrend | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTrends();

    // Supabase Realtime subscription
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('rrs_google_trends_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'rrs_google_trends',
        },
        (payload: RealtimePostgresChangesPayload<GoogleTrend>) => {
          console.log('Realtime update:', payload.eventType);
          // Reload all trends on any change
          loadTrends();
        }
      )
      .subscribe((status: string) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadTrends() {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('rrs_google_trends')
        .select('id, trend_id, keyword, approx_traffic, pub_date, description, media, media_links, picture, picture_source, has_interia, fetched_at, created_at')
        .order('pub_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTrends(data || []);
    } catch (err) {
      console.error('Error loading trends:', err);
      setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac trendow');
    } finally {
      setLoading(false);
    }
  }

  const { paginatedTrends, totalPages, totalFiltered } = useMemo(() => {
    let result = [...trends];

    // Filter by Interia
    if (filterInteria) {
      result = result.filter((t) => t.has_interia);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'traffic':
          return (b.approx_traffic || 0) - (a.approx_traffic || 0);
        case 'date':
          return new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime();
        case 'keyword':
          return a.keyword.localeCompare(b.keyword, 'pl');
        default:
          return 0;
      }
    });

    const totalFiltered = result.length;
    const totalPages = Math.ceil(result.length / pageSize);

    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedTrends = result.slice(startIndex, startIndex + pageSize);

    return { paginatedTrends, totalPages, totalFiltered };
  }, [trends, sortBy, filterInteria, pageSize, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterInteria, sortBy, pageSize]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Google Trends</h2>
            <p className="text-slate-500">Analiza trendow wyszukiwania</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {realtimeConnected && (
            <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </Badge>
          )}
          <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
            {trends.length} trendow
          </Badge>
        </div>
      </div>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Jak wykorzystasz dane z Google Trends?
          </CardTitle>
          <CardDescription>
            Integracja z Google Trends pozwoli Ci tworzyc tresci dopasowane do aktualnych zainteresowan
            uzytkownikow. Znajdz tematy, ktore zyskuja na popularnosci i wyprzedz konkurencje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <feature.icon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends List Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Aktualne trendy
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sortuj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic">Popularnosc</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="keyword">Alfabetycznie</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filterInteria"
                  checked={filterInteria}
                  onCheckedChange={(checked) => setFilterInteria(checked === true)}
                />
                <label
                  htmlFor="filterInteria"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Tylko z Interia
                </label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-500">Ladowanie trendow...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>{error}</span>
              <Button variant="outline" size="sm" className="ml-4" onClick={loadTrends}>
                Sprobuj ponownie
              </Button>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <TrendingUp className="h-12 w-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">Brak trendow do wyswietlenia</p>
              <p className="text-sm">
                {filterInteria
                  ? 'Nie ma trendow z artykulami Interii. Odznacz filtr aby zobaczyc wszystkie.'
                  : 'Trendy pojawia sie wkrotce.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTrends.map((trend) => (
                <div
                  key={trend.id}
                  className={`rounded-lg border p-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                    selectedTrend?.id === trend.id ? 'border-green-300 bg-green-50' : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedTrend(selectedTrend?.id === trend.id ? null : trend)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                        <h3 className="font-semibold text-slate-900 truncate">{trend.keyword}</h3>
                        {trend.has_interia && (
                          <Badge className="bg-green-100 text-green-700 border-green-300 shrink-0">
                            Interia
                          </Badge>
                        )}
                      </div>
                      {selectedTrend?.id === trend.id && trend.description && (
                        <p className="mt-2 text-sm text-slate-600">{trend.description}</p>
                      )}
                      {selectedTrend?.id === trend.id && trend.media && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Newspaper className="h-4 w-4 text-slate-400" />
                          {parseMedia(trend.media).map((source, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedTrend?.id === trend.id && trend.media_links && (
                        <div className="mt-3 space-y-2">
                          {parseMediaLinks(trend.media_links).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{link.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="text-sm">
                        <span className="font-semibold text-slate-900">
                          {formatTraffic(trend.approx_traffic)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 min-w-[60px]">
                        {formatDistanceToNow(new Date(trend.pub_date), {
                          addSuffix: true,
                          locale: pl,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Pokazuj</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>z {totalFiltered}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-slate-600">
                  Strona {currentPage} z {totalPages}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
