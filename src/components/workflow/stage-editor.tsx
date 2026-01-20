'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Save,
  RotateCw,
  Loader2,
  CheckCircle,
  Eye,
  Edit3,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { STAGE_NAMES } from '@/types/database';

interface StageData {
  knowledgeGraph?: { id: string; graph_data: unknown };
  informationGraph?: { id: string; triplets: unknown };
  searchPhrases?: { id: string; phrases: string };
  competitorHeaders?: { id: string; headers: string };
  generatedHeaders?: { id: string; headers_html: string; is_selected: boolean }[];
  ragData?: { id: string; detailed_qa: string; general_qa: string };
  brief?: { id: string; brief_html: string };
}

interface StageEditorProps {
  projectId: string;
  currentStage: number;
  onDataChanged: (stage: number) => void;
  isRunning: boolean;
}

export function StageEditor({ projectId, currentStage, onDataChanged, isRunning }: StageEditorProps) {
  const [stageData, setStageData] = useState<StageData>({});
  const [openStages, setOpenStages] = useState<number[]>([]);
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStageData();
  }, [projectId, currentStage]);

  async function loadStageData() {
    const supabase = getSupabaseClient();
    const data: StageData = {};

    // Stage 1 data - use order + limit to handle duplicates
    if (currentStage >= 1) {
      const { data: kgArr } = await supabase
        .from('pisarz_knowledge_graphs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (kgArr?.[0]) data.knowledgeGraph = kgArr[0];

      const { data: igArr } = await supabase
        .from('pisarz_information_graphs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (igArr?.[0]) data.informationGraph = igArr[0];

      const { data: spArr } = await supabase
        .from('pisarz_search_phrases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (spArr?.[0]) data.searchPhrases = spArr[0];

      const { data: chArr } = await supabase
        .from('pisarz_competitor_headers')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (chArr?.[0]) data.competitorHeaders = chArr[0];
    }

    // Stage 2 data
    if (currentStage >= 2) {
      const { data: headers } = await supabase
        .from('pisarz_generated_headers')
        .select('*')
        .eq('project_id', projectId);
      if (headers) data.generatedHeaders = headers;
    }

    // Stage 3 data - use order + limit to handle duplicates
    if (currentStage >= 3) {
      const { data: ragArr } = await supabase
        .from('pisarz_rag_data')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (ragArr?.[0]) data.ragData = ragArr[0];
    }

    // Stage 4 data - use order + limit to handle duplicates
    if (currentStage >= 4) {
      const { data: briefArr } = await supabase
        .from('pisarz_briefs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (briefArr?.[0]) data.brief = briefArr[0];
    }

    setStageData(data);
  }

  function toggleStage(stage: number) {
    setOpenStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  }

  function startEditing(stage: number) {
    setEditingStage(stage);
    // Initialize edited values
    const values: Record<string, string> = {};

    if (stage === 1) {
      values.knowledgeGraph = JSON.stringify(stageData.knowledgeGraph?.graph_data || {}, null, 2);
      values.informationGraph = JSON.stringify(stageData.informationGraph?.triplets || {}, null, 2);
      values.searchPhrases = stageData.searchPhrases?.phrases || '';
      values.competitorHeaders = stageData.competitorHeaders?.headers || '';
    } else if (stage === 2) {
      const selected = stageData.generatedHeaders?.find(h => h.is_selected);
      values.headers = selected?.headers_html || '';
    } else if (stage === 4) {
      values.brief = stageData.brief?.brief_html || '';
    }

    setEditedValues(values);
  }

  function cancelEditing() {
    setEditingStage(null);
    setEditedValues({});
  }

  async function saveChanges(stage: number) {
    setIsSaving(true);
    const supabase = getSupabaseClient();

    try {
      if (stage === 1) {
        // Save knowledge graph
        if (stageData.knowledgeGraph?.id) {
          await supabase
            .from('pisarz_knowledge_graphs')
            .update({ graph_data: JSON.parse(editedValues.knowledgeGraph || '{}') })
            .eq('id', stageData.knowledgeGraph.id);
        }

        // Save information graph
        if (stageData.informationGraph?.id) {
          await supabase
            .from('pisarz_information_graphs')
            .update({ triplets: JSON.parse(editedValues.informationGraph || '{}') })
            .eq('id', stageData.informationGraph.id);
        }

        // Save search phrases
        if (stageData.searchPhrases?.id) {
          await supabase
            .from('pisarz_search_phrases')
            .update({ phrases: editedValues.searchPhrases })
            .eq('id', stageData.searchPhrases.id);
        }

        // Save competitor headers
        if (stageData.competitorHeaders?.id) {
          await supabase
            .from('pisarz_competitor_headers')
            .update({ headers: editedValues.competitorHeaders })
            .eq('id', stageData.competitorHeaders.id);
        }
      } else if (stage === 2) {
        const selected = stageData.generatedHeaders?.find(h => h.is_selected);
        if (selected?.id) {
          await supabase
            .from('pisarz_generated_headers')
            .update({ headers_html: editedValues.headers })
            .eq('id', selected.id);
        }
      } else if (stage === 4) {
        if (stageData.brief?.id) {
          await supabase
            .from('pisarz_briefs')
            .update({ brief_html: editedValues.brief })
            .eq('id', stageData.brief.id);
        }
      }

      toast.success('Zmiany zapisane');
      setEditingStage(null);
      setEditedValues({});
      await loadStageData();

      // Notify parent that data changed - might need regeneration
      onDataChanged(stage);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Nie udało się zapisać zmian');
    } finally {
      setIsSaving(false);
    }
  }

  const stages = [
    { stage: 1, name: STAGE_NAMES[1], editable: true },
    { stage: 2, name: STAGE_NAMES[2], editable: true },
    { stage: 3, name: STAGE_NAMES[3], editable: false }, // RAG is read-only
    { stage: 4, name: STAGE_NAMES[4], editable: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane etapów workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map(({ stage, name, editable }) => {
          if (stage > currentStage) return null;

          const isOpen = openStages.includes(stage);
          const isEditing = editingStage === stage;

          return (
            <Collapsible key={stage} open={isOpen} onOpenChange={() => toggleStage(stage)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{name}</span>
                    <Badge variant="outline" className="text-xs">Etap {stage}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <Badge variant="secondary" className="text-xs">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edytowalny
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Tylko podgląd
                      </Badge>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border border-t-0 rounded-b-lg bg-slate-50/50">
                  {/* Stage 1: Budowa wiedzy */}
                  {stage === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Graf wiedzy (JSON)</Label>
                        {isEditing ? (
                          <Textarea
                            value={editedValues.knowledgeGraph || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, knowledgeGraph: e.target.value }))}
                            className="mt-1 font-mono text-xs"
                            rows={6}
                          />
                        ) : (
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32">
                            {JSON.stringify(stageData.knowledgeGraph?.graph_data || {}, null, 2)}
                          </pre>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Graf informacji (JSON)</Label>
                        {isEditing ? (
                          <Textarea
                            value={editedValues.informationGraph || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, informationGraph: e.target.value }))}
                            className="mt-1 font-mono text-xs"
                            rows={6}
                          />
                        ) : (
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32">
                            {JSON.stringify(stageData.informationGraph?.triplets || {}, null, 2)}
                          </pre>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Frazy wyszukiwania</Label>
                        {isEditing ? (
                          <Textarea
                            value={editedValues.searchPhrases || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, searchPhrases: e.target.value }))}
                            className="mt-1"
                            rows={4}
                          />
                        ) : (
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                            {stageData.searchPhrases?.phrases || 'Brak danych'}
                          </pre>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Nagłówki konkurencji</Label>
                        {isEditing ? (
                          <Textarea
                            value={editedValues.competitorHeaders || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, competitorHeaders: e.target.value }))}
                            className="mt-1"
                            rows={4}
                          />
                        ) : (
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                            {stageData.competitorHeaders?.headers || 'Brak danych'}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stage 2: Nagłówki */}
                  {stage === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Wybrane nagłówki (HTML)</Label>
                        {isEditing ? (
                          <Textarea
                            value={editedValues.headers || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, headers: e.target.value }))}
                            className="mt-1 font-mono text-xs"
                            rows={10}
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-white rounded border">
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: stageData.generatedHeaders?.find(h => h.is_selected)?.headers_html || 'Brak wybranych nagłówków'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stage 3: RAG (read-only) */}
                  {stage === 3 && (
                    <div className="space-y-4">
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <Eye className="h-4 w-4 inline mr-2" />
                        Dane RAG są tylko do odczytu - generowane automatycznie przez Dify
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Szczegółowe Q&A</Label>
                        <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                          {stageData.ragData?.detailed_qa || 'Brak danych'}
                        </pre>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Ogólne Q&A</Label>
                        <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                          {stageData.ragData?.general_qa || 'Brak danych'}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Stage 4: Brief */}
                  {stage === 4 && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Brief (HTML)</Label>
                        {isEditing ? (
                          <Textarea
                            value={editedValues.brief || ''}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, brief: e.target.value }))}
                            className="mt-1 font-mono text-xs"
                            rows={12}
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-white rounded border">
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: stageData.brief?.brief_html || 'Brak briefu'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons for editable stages */}
                  {editable && (
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                            Anuluj
                          </Button>
                          <Button size="sm" onClick={() => saveChanges(stage)} disabled={isSaving}>
                            {isSaving ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-3 w-3" />
                            )}
                            Zapisz zmiany
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => startEditing(stage)} disabled={isRunning}>
                          <Edit3 className="mr-2 h-3 w-3" />
                          Edytuj
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
