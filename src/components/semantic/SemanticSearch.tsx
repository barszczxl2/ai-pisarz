'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SemanticCluster } from '@/types/database';

interface SemanticSearchProps {
  onResults?: (results: SemanticCluster[]) => void;
  onSearching?: (isSearching: boolean) => void;
}

export default function SemanticSearch({ onResults, onSearching }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SemanticCluster[]>([]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    onSearching?.(true);

    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd wyszukiwania');
      }

      const data = await response.json();
      setResults(data.results || []);
      onResults?.(data.results || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      setResults([]);
      onResults?.([]);
    } finally {
      setIsSearching(false);
      onSearching?.(false);
    }
  }, [query, onResults, onSearching]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
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
            placeholder="Wpisz zapytanie semantyczne..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isSearching}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">
            Znaleziono {results.length} podobnych trendów:
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 truncate">
                    {result.keyword}
                  </span>
                  <span className="text-xs text-purple-600 font-medium ml-2">
                    {Math.round(result.similarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  {result.approx_traffic && (
                    <span>{result.approx_traffic}K traffic</span>
                  )}
                  {result.has_interia && (
                    <span className="text-green-600">Interia</span>
                  )}
                </div>
                {result.description && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                    {result.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
