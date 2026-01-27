'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { List, Hash, HelpCircle, GripVertical, X, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GeneratedHeaders, HeaderType } from '@/types/database';

interface ParsedHeader {
  id: string;
  html: string;
  text: string;
  level: number;
  sourceType: HeaderType;
}

interface HeaderSelectionProps {
  headers: GeneratedHeaders[];
  onConfirm: (selectedHeaders: string[]) => void;
  isLoading?: boolean;
}

const HEADER_TYPE_INFO: Record<HeaderType, { name: string; icon: React.ElementType; description: string }> = {
  rozbudowane: {
    name: 'Rozbudowane',
    icon: List,
    description: 'Pełna struktura z H2 i H3',
  },
  h2: {
    name: 'Tylko H2',
    icon: Hash,
    description: 'Prostsza struktura',
  },
  pytania: {
    name: 'Pytania',
    icon: HelpCircle,
    description: 'Nagłówki w formie pytań',
  },
};

function parseHeadersFromHtml(html: string, sourceType: HeaderType): ParsedHeader[] {
  const regex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi;
  const matches = html.matchAll(regex);
  return Array.from(matches, (m, index) => ({
    id: `${sourceType}-${index}`,
    html: m[0],
    text: m[2].replace(/<[^>]*>/g, '').trim(),
    level: parseInt(m[1], 10),
    sourceType,
  }));
}

// Sortable item component for drag & drop
function SortableHeader({ header, onRemove }: { header: ParsedHeader; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: header.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md bg-white border',
        header.level === 3 && 'ml-6 border-l-2 border-l-slate-300',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        className="cursor-grab hover:bg-slate-100 p-1 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </button>
      <span
        className={cn(
          'flex-1 text-sm',
          header.level === 2 ? 'font-semibold text-slate-900' : 'text-slate-600'
        )}
      >
        <span className={cn(
          'text-xs mr-2 px-1 rounded',
          header.level === 2 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
        )}>
          {header.level === 2 ? 'H2' : 'H3'}
        </span>
        {header.text}
      </span>
      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
        {HEADER_TYPE_INFO[header.sourceType].name.substring(0, 3)}
      </span>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function HeaderSelection({
  headers,
  onConfirm,
  isLoading = false,
}: HeaderSelectionProps) {
  const [activeTab, setActiveTab] = useState<HeaderType>('rozbudowane');
  const [selectedHeaders, setSelectedHeaders] = useState<ParsedHeader[]>([]);

  // Parse all headers from all variants
  const allHeadersByType: Record<HeaderType, ParsedHeader[]> = {
    rozbudowane: [],
    h2: [],
    pytania: [],
  };

  headers.forEach(h => {
    allHeadersByType[h.header_type] = parseHeadersFromHtml(h.headers_html || '', h.header_type);
  });

  // Check if a header is selected
  const isHeaderSelected = (header: ParsedHeader) => {
    return selectedHeaders.some(h => h.id === header.id);
  };

  // Toggle header selection
  const toggleHeader = (header: ParsedHeader) => {
    if (isHeaderSelected(header)) {
      setSelectedHeaders(prev => prev.filter(h => h.id !== header.id));
    } else {
      setSelectedHeaders(prev => [...prev, header]);
    }
  };

  // Add all headers from a variant
  const addAllFromVariant = (type: HeaderType) => {
    const headersToAdd = allHeadersByType[type].filter(h => !isHeaderSelected(h));
    setSelectedHeaders(prev => [...prev, ...headersToAdd]);
  };

  // Remove header from selection
  const removeHeader = (headerId: string) => {
    setSelectedHeaders(prev => prev.filter(h => h.id !== headerId));
  };

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedHeaders(prev => {
        const oldIndex = prev.findIndex(h => h.id === active.id);
        const newIndex = prev.findIndex(h => h.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // Get selected headers HTML for confirmation
  const getSelectedHeadersHtml = (): string[] => {
    return selectedHeaders.map(h => h.html);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left panel - variants with headers to select */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Dostępne nagłówki</h3>
          <p className="text-sm text-slate-500">
            Kliknij nagłówki aby dodać je do wyboru
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HeaderType)}>
          <TabsList className="grid w-full grid-cols-3">
            {(['rozbudowane', 'h2', 'pytania'] as HeaderType[]).map((type) => {
              const info = HEADER_TYPE_INFO[type];
              return (
                <TabsTrigger key={type} value={type}>
                  <info.icon className="mr-2 h-4 w-4" />
                  {info.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(['rozbudowane', 'h2', 'pytania'] as HeaderType[]).map((type) => {
            const info = HEADER_TYPE_INFO[type];
            const typeHeaders = allHeadersByType[type];

            return (
              <TabsContent key={type} value={type}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{info.name}</CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addAllFromVariant(type)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Dodaj wszystkie
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1 pr-4">
                        {typeHeaders.map((header) => (
                          <div
                            key={header.id}
                            onClick={() => toggleHeader(header)}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                              isHeaderSelected(header)
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-slate-50 border border-transparent'
                            )}
                          >
                            <Checkbox
                              checked={isHeaderSelected(header)}
                              onCheckedChange={() => toggleHeader(header)}
                              className="pointer-events-none"
                            />
                            <span
                              className={cn(
                                'flex-1 text-sm',
                                header.level === 2 ? 'font-semibold text-slate-900' : 'text-slate-700 pl-2'
                              )}
                            >
                              <span className="text-slate-400 mr-2">
                                {header.level === 2 ? 'H2' : 'H3'}
                              </span>
                              {header.text}
                            </span>
                          </div>
                        ))}
                        {typeHeaders.length === 0 && (
                          <p className="text-center text-slate-500 py-8">
                            Brak nagłówków tego typu
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Right panel - selected headers with drag & drop */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            Wybrane nagłówki ({selectedHeaders.length})
          </h3>
          <p className="text-sm text-slate-500">
            Przeciągnij aby zmienić kolejność
          </p>
        </div>

        <Card className="border-green-200">
          <CardContent className="pt-4">
            {selectedHeaders.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedHeaders.map(h => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 pr-4">
                      {selectedHeaders.map((header) => (
                        <SortableHeader
                          key={header.id}
                          header={header}
                          onRemove={() => removeHeader(header.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <p>Nie wybrano żadnych nagłówków</p>
                  <p className="text-sm">Kliknij nagłówki z lewego panelu</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          size="lg"
          onClick={() => onConfirm(getSelectedHeadersHtml())}
          disabled={isLoading || selectedHeaders.length === 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Przetwarzanie...' : `Zatwierdź ${selectedHeaders.length} nagłówków`}
        </Button>
      </div>
    </div>
  );
}
