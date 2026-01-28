'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  Calendar,
  Newspaper,
  ExternalLink,
  FileText,
  Link2,
} from 'lucide-react';

export interface TrendData {
  id: string;
  keyword: string;
  traffic: number;
  cluster: number;
  hasInteria: boolean;
  description: string | null;
  pubDate?: string;
  media?: string | null;
  mediaLinks?: string | null;
  picture?: string | null;
  embeddingText?: string | null;
  trendId?: string;
}

interface TrendDetailsModalProps {
  trend: TrendData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MediaLink {
  title: string;
  url: string;
}

/**
 * Parse media_links field format:
 * - tytuł: Article Title
 *  - Link: https://example.com/article
 */
function parseMediaLinks(mediaLinks: string | null | undefined): MediaLink[] {
  if (!mediaLinks) return [];

  const links: MediaLink[] = [];

  // Split by double newlines to separate entries
  const entries = mediaLinks.split(/\n\n+/);

  for (const entry of entries) {
    if (!entry.trim()) continue;

    // Extract title: - tytuł: or -tytuł:
    const titleMatch = entry.match(/-\s*tytuł:\s*(.+)/i);
    // Extract URL: - Link: or -Link:
    const urlMatch = entry.match(/-\s*Link:\s*(https?:\/\/[^\s]+)/i);

    if (titleMatch && urlMatch) {
      links.push({
        title: titleMatch[1].trim(),
        url: urlMatch[1].trim(),
      });
    }
  }

  return links;
}

/**
 * Format date to Polish locale
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Brak daty';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get domain from URL
 */
function getDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}

export default function TrendDetailsModal({
  trend,
  open,
  onOpenChange,
}: TrendDetailsModalProps) {
  if (!trend) return null;

  const mediaLinks = parseMediaLinks(trend.mediaLinks);
  const googleTrendsUrl = trend.trendId
    ? `https://trends.google.com/trends/explore?q=${encodeURIComponent(trend.keyword)}&geo=PL`
    : `https://trends.google.com/trends/explore?q=${encodeURIComponent(trend.keyword)}&geo=PL`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl pr-6">{trend.keyword}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend.traffic}K traffic
              </Badge>
              {trend.pubDate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(trend.pubDate)}
                </Badge>
              )}
              {trend.hasInteria && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Ma Interię
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 pb-4">
            {/* Picture */}
            {trend.picture && (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trend.picture}
                  alt={trend.keyword}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Description */}
            {trend.description && (
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                {trend.description}
              </div>
            )}

            {/* Media Sources */}
            {mediaLinks.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Newspaper className="h-4 w-4" />
                  Źródła ({mediaLinks.length})
                </h4>
                <div className="space-y-2">
                  {mediaLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-purple-600">
                            {link.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {getDomain(link.url)}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-purple-500 flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Media list (if no parsed links) */}
            {mediaLinks.length === 0 && trend.media && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Newspaper className="h-4 w-4" />
                  Źródła medialne
                </h4>
                <p className="text-sm text-slate-600">
                  {trend.media.split(' - ').join(', ')}
                </p>
              </div>
            )}

            {/* Embedding Text */}
            {trend.embeddingText && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <FileText className="h-4 w-4" />
                  Tekst użyty do embeddingu
                </h4>
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 font-mono break-words">
                  {trend.embeddingText.length > 500
                    ? trend.embeddingText.substring(0, 500) + '...'
                    : trend.embeddingText}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Google Trends link */}
        <div className="pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(googleTrendsUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Otwórz w Google Trends
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
