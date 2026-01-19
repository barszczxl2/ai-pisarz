'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, List, Hash, HelpCircle } from 'lucide-react';
import type { GeneratedHeaders, HeaderType } from '@/types/database';

interface HeaderSelectionProps {
  headers: GeneratedHeaders[];
  selectedHeaderId: string | null;
  onSelect: (headerId: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const HEADER_TYPE_INFO: Record<HeaderType, { name: string; icon: React.ElementType; description: string }> = {
  rozbudowane: {
    name: 'Rozbudowane',
    icon: List,
    description: 'Pełna struktura z H2 i H3, szczegółowy podział tematów',
  },
  h2: {
    name: 'Tylko H2',
    icon: Hash,
    description: 'Prostsza struktura, główne sekcje bez podsekcji',
  },
  pytania: {
    name: 'Pytania',
    icon: HelpCircle,
    description: 'Nagłówki w formie pytań, optymalne dla FAQ i "People Also Ask"',
  },
};

function parseHeaders(html: string): string[] {
  // Parse HTML to extract headings
  const regex = /<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi;
  const matches = html.matchAll(regex);
  return Array.from(matches, m => m[0]);
}

export function HeaderSelection({
  headers,
  selectedHeaderId,
  onSelect,
  onConfirm,
  isLoading = false,
}: HeaderSelectionProps) {
  const [activeTab, setActiveTab] = useState<HeaderType>(
    headers[0]?.header_type || 'rozbudowane'
  );

  const headersByType = headers.reduce((acc, h) => {
    acc[h.header_type] = h;
    return acc;
  }, {} as Record<HeaderType, GeneratedHeaders>);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Wybierz strukturę nagłówków</h3>
        <p className="text-sm text-slate-500">
          Wygenerowano 3 warianty nagłówków. Wybierz ten, który najlepiej pasuje do Twojego artykułu.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HeaderType)}>
        <TabsList className="grid w-full grid-cols-3">
          {(['rozbudowane', 'h2', 'pytania'] as HeaderType[]).map((type) => {
            const info = HEADER_TYPE_INFO[type];
            const header = headersByType[type];
            const isSelected = selectedHeaderId === header?.id;

            return (
              <TabsTrigger
                key={type}
                value={type}
                className={cn(
                  'relative',
                  isSelected && 'ring-2 ring-blue-500 ring-offset-2'
                )}
              >
                <info.icon className="mr-2 h-4 w-4" />
                {info.name}
                {isSelected && (
                  <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-blue-500 p-0.5 text-white" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(['rozbudowane', 'h2', 'pytania'] as HeaderType[]).map((type) => {
          const info = HEADER_TYPE_INFO[type];
          const header = headersByType[type];

          return (
            <TabsContent key={type} value={type}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <info.icon className="h-5 w-5" />
                    {info.name}
                  </CardTitle>
                  <CardDescription>{info.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {header ? (
                    <>
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: header.headers_html || '' }}
                        />
                      </ScrollArea>
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() => onSelect(header.id)}
                          variant={selectedHeaderId === header.id ? 'default' : 'outline'}
                          className={cn(
                            selectedHeaderId === header.id && 'bg-blue-600 hover:bg-blue-700'
                          )}
                        >
                          {selectedHeaderId === header.id ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Wybrano
                            </>
                          ) : (
                            'Wybierz ten wariant'
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-500">
                      Brak wygenerowanych nagłówków tego typu
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {selectedHeaderId && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Przetwarzanie...' : 'Zatwierdź i kontynuuj'}
          </Button>
        </div>
      )}
    </div>
  );
}
