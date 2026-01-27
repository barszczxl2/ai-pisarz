'use client';

import { cn } from '@/lib/utils';
import { createSafeHtml } from '@/lib/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { ContentSection, SectionStatus } from '@/types/database';

interface ContentPreviewProps {
  sections: ContentSection[];
  currentSectionIndex: number;
}

const STATUS_CONFIG: Record<SectionStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-slate-400', label: 'Oczekuje' },
  processing: { icon: Loader2, color: 'text-blue-500', label: 'Generowanie...' },
  completed: { icon: Check, color: 'text-green-500', label: 'Ukończono' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Błąd' },
};

export function ContentPreview({ sections, currentSectionIndex }: ContentPreviewProps) {
  const completedCount = sections.filter(s => s.status === 'completed').length;
  const progress = sections.length > 0 ? (completedCount / sections.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Postęp generowania: {completedCount} / {sections.length} sekcji
          </span>
          <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Sections list */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {sections.map((section, index) => {
            const config = STATUS_CONFIG[section.status];
            const Icon = config.icon;
            const isActive = index === currentSectionIndex;

            return (
              <Card
                key={section.id}
                className={cn(
                  'transition-all',
                  isActive && 'ring-2 ring-blue-500',
                  section.status === 'completed' && 'bg-green-50',
                  section.status === 'error' && 'bg-red-50'
                )}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">
                        {index + 1}
                      </span>
                      <div
                        className="line-clamp-1"
                        dangerouslySetInnerHTML={
                          createSafeHtml(section.heading_html.replace(/<\/?h[2-3][^>]*>/gi, ''))
                        }
                      />
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn('flex items-center gap-1', config.color)}
                    >
                      <Icon className={cn('h-3 w-3', section.status === 'processing' && 'animate-spin')} />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                {section.status === 'completed' && section.content_html && (
                  <CardContent className="pt-0">
                    <div
                      className="prose prose-sm max-w-none line-clamp-3 text-slate-600"
                      dangerouslySetInnerHTML={createSafeHtml(section.content_html)}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Full content view for final preview
export function ContentFull({ sections }: { sections: ContentSection[] }) {
  return (
    <ScrollArea className="h-[600px] rounded-md border bg-white p-6">
      <article className="prose prose-slate max-w-none">
        {sections
          .filter(s => s.status === 'completed')
          .sort((a, b) => a.section_order - b.section_order)
          .map((section) => (
            <div key={section.id}>
              <div dangerouslySetInnerHTML={createSafeHtml(section.heading_html)} />
              <div dangerouslySetInnerHTML={createSafeHtml(section.content_html || '')} />
            </div>
          ))}
      </article>
    </ScrollArea>
  );
}
