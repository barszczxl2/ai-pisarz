'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Brain,
  Network,
  RefreshCw,
  Filter,
  Loader2,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { GoogleTrendWithEmbedding, ClusterNode, SemanticCluster } from '@/types/database';
import { buildGraphData, filterGraphData, ClusteringAlgorithm } from '@/lib/clustering';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import ClusterDetails from '@/components/semantic/ClusterDetails';
import SemanticSearch from '@/components/semantic/SemanticSearch';
import TrendDetailsModal from '@/components/semantic/TrendDetailsModal';
import { Info } from 'lucide-react';

// Dynamic import for ClusterGraph to avoid SSR issues with canvas
const ClusterGraph = dynamic(() => import('@/components/semantic/ClusterGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-slate-100 rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  ),
});

// Traffic filter options
const TRAFFIC_OPTIONS = [
  { label: 'Wszystkie', value: 0 },
  { label: '10K+', value: 10 },
  { label: '50K+', value: 50 },
  { label: '100K+', value: 100 },
];

// Similarity threshold options (niższe progi dla lepszych wyników)
const SIMILARITY_OPTIONS = [
  { label: '10%', value: 0.1 },
  { label: '20%', value: 0.2 },
  { label: '30%', value: 0.3 },
  { label: '40%', value: 0.4 },
];

// Clustering algorithm options
const ALGORITHM_OPTIONS: { label: string; value: ClusteringAlgorithm; description: string }[] = [
  {
    label: 'Grupy powiązane',
    value: 'union-find',
    description: 'Łączy trendy w grupy na podstawie połączeń (tranzytywnie)'
  },
  {
    label: 'K-Means',
    value: 'kmeans',
    description: 'Dzieli trendy na optymalną liczbę grup tematycznych'
  },
];

export default function SemantykaPage() {
  // Data state
  const [trends, setTrends] = useState<GoogleTrendWithEmbedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime state
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Filter state
  const [minTraffic, setMinTraffic] = useState(0);
  const [onlyInteria, setOnlyInteria] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.2);
  const [searchQuery, setSearchQuery] = useState('');
  const [algorithm, setAlgorithm] = useState<ClusteringAlgorithm>('kmeans');

  // Graph state
  const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(null);
  const [searchResults, setSearchResults] = useState<SemanticCluster[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal state
  const [modalTrend, setModalTrend] = useState<ClusterNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load trends from Supabase
  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('rrs_google_trends')
        .select('id, trend_id, keyword, approx_traffic, pub_date, description, media, media_links, picture, picture_source, has_interia, fetched_at, created_at, embedding, embedding_text')
        .not('embedding', 'is', null)
        .order('pub_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTrends(data || []);
    } catch (err) {
      console.error('Error loading trends:', err);
      setError('Błąd pobierania danych');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup Supabase Realtime subscription
  useEffect(() => {
    loadTrends();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('semantic_clusters')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rrs_google_trends',
        },
        (payload: RealtimePostgresChangesPayload<GoogleTrendWithEmbedding>) => {
          console.log('Realtime update:', payload.eventType);
          loadTrends();
        }
      )
      .subscribe((status: string) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTrends]);

  // Build graph data
  const graphData = useMemo(() => {
    if (trends.length === 0) {
      return { nodes: [], links: [] };
    }
    return buildGraphData(trends, similarityThreshold, algorithm);
  }, [trends, similarityThreshold, algorithm]);

  // Filter graph data
  const filteredGraphData = useMemo(() => {
    return filterGraphData(graphData, {
      minTraffic,
      onlyInteria,
      searchQuery,
    });
  }, [graphData, minTraffic, onlyInteria, searchQuery]);

  // Handle semantic search results
  const handleSearchResults = useCallback((results: SemanticCluster[]) => {
    setSearchResults(results);
    if (results.length > 0) {
      // Filter graph to show only matching results
      const matchingIds = new Set(results.map(r => String(r.id)));
      setSearchQuery(''); // Clear text filter

      // Find matching node to select
      const matchingNode = graphData.nodes.find(n => matchingIds.has(n.id));
      if (matchingNode) {
        setSelectedNode(matchingNode);
      }
    }
  }, [graphData.nodes]);

  // Handle node click - open modal with full details
  const handleNodeClick = useCallback((node: ClusterNode) => {
    setSelectedNode(node);
    setModalTrend(node);
    setIsModalOpen(true);
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((_node: ClusterNode | null) => {
    // Could add hover effects here
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSearchResults([]);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const trendsWithEmbeddings = trends.length;
    const totalClusters = new Set(graphData.nodes.map(n => n.cluster)).size;
    const totalLinks = graphData.links.length;

    return {
      trendsWithEmbeddings,
      totalClusters,
      totalLinks,
      filteredNodes: filteredGraphData.nodes.length,
    };
  }, [trends.length, graphData, filteredGraphData]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <Search className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Wyszukiwanie semantyczne</h2>
            <p className="text-slate-500">Interaktywny graf klastrów tematycznych</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {realtimeConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTrends()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
      </div>

      {/* Semantic Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            Wyszukiwarka semantyczna
          </CardTitle>
          <CardDescription>
            Wpisz zapytanie w języku naturalnym, aby znaleźć podobne trendy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SemanticSearch
            onResults={handleSearchResults}
            onSearching={setIsSearching}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Jak czytać ten graf?</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-indigo-400 flex-shrink-0 mt-1" />
                  <span><strong>Każda kropka</strong> = jeden trend z Google Trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-slate-300 flex-shrink-0 mt-0.5 scale-75" />
                  <span><strong>Rozmiar kropki</strong> = popularność (traffic)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex gap-0.5 flex-shrink-0 mt-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                  </span>
                  <span><strong>Kolor</strong> = grupa tematyczna</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-4 h-0.5 bg-slate-400 flex-shrink-0 mt-2" />
                  <span><strong>Linia między kropkami</strong> = trendy są semantycznie podobne</span>
                </li>
              </ul>
              <p className="text-sm text-purple-700 pt-1">
                Kliknij na kropkę, aby zobaczyć szczegóły trendu i źródła.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Graph + Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graph */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Network className="h-5 w-5 text-purple-600" />
                  Mapa powiązań trendów
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{stats.filteredNodes} trendów</span>
                  <span>•</span>
                  <span>{stats.totalClusters} grup</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-[500px] bg-slate-100">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[500px] bg-red-50 text-red-600">
                  <p>{error}</p>
                </div>
              ) : (
                <ClusterGraph
                  data={filteredGraphData}
                  onNodeClick={handleNodeClick}
                  onNodeHover={handleNodeHover}
                  height={500}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          <Card className="h-[570px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Grupy tematyczne</CardTitle>
                {selectedNode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs"
                  >
                    Wszystkie grupy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ClusterDetails
                data={filteredGraphData}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeClick}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-slate-500" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            {/* Traffic filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Min. traffic:</span>
              <div className="flex gap-1">
                {TRAFFIC_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={minTraffic === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMinTraffic(option.value)}
                    className="px-3"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Similarity threshold */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Powiązanie:</span>
              <div className="flex gap-1">
                {SIMILARITY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={similarityThreshold === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSimilarityThreshold(option.value)}
                    className="px-3"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Algorithm selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Grupowanie:</span>
              <div className="flex gap-1">
                {ALGORITHM_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={algorithm === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAlgorithm(option.value)}
                    className="px-3"
                    title={option.description}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Interia filter */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="interia-filter"
                checked={onlyInteria}
                onCheckedChange={(checked) => setOnlyInteria(checked === true)}
              />
              <label
                htmlFor="interia-filter"
                className="text-sm text-slate-600 cursor-pointer"
              >
                Tylko z Interią
              </label>
            </div>

            {/* Text search */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-sm text-slate-600">Szukaj:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtruj po słowie kluczowym..."
                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.trendsWithEmbeddings}</div>
          <div className="text-sm text-slate-500">Trendów z embeddingami</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.totalClusters}</div>
          <div className="text-sm text-slate-500">Grup tematycznych</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.totalLinks}</div>
          <div className="text-sm text-slate-500">Powiązań</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.filteredNodes}</div>
          <div className="text-sm text-slate-500">Widocznych trendów</div>
        </Card>
      </div>

      {/* Trend Details Modal */}
      <TrendDetailsModal
        trend={modalTrend}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
