'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Brain,
  Layers,
  MessageSquare,
  FileSearch,
  Clock,
  Sparkles,
  Network,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Rozumienie kontekstu',
    description: 'Wyszukiwanie oparte na znaczeniu, nie tylko na dopasowaniu słów kluczowych',
  },
  {
    icon: FileSearch,
    title: 'Przeszukiwanie bazy wiedzy',
    description: 'Znajdź powiązane informacje w swoich poprzednich projektach i artykułach',
  },
  {
    icon: Network,
    title: 'Podobieństwo semantyczne',
    description: 'Odkrywaj powiązane tematy i koncepcje na podstawie znaczenia treści',
  },
  {
    icon: MessageSquare,
    title: 'Zapytania w języku naturalnym',
    description: 'Zadawaj pytania tak jak rozmawiasz - system zrozumie Twoje intencje',
  },
  {
    icon: Layers,
    title: 'Klasteryzacja tematów',
    description: 'Automatyczne grupowanie podobnych treści i identyfikacja luk contentowych',
  },
  {
    icon: Sparkles,
    title: 'Sugestie powiązań',
    description: 'Otrzymuj rekomendacje powiązanych tematów do rozwinięcia w artykułach',
  },
];

export default function SemantykaPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <Search className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Wyszukiwanie semantyczne</h2>
            <p className="text-slate-500">Inteligentne przeszukiwanie treści</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          W przygotowaniu
        </Badge>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Czym jest wyszukiwanie semantyczne?
          </CardTitle>
          <CardDescription>
            Wyszukiwanie semantyczne wykorzystuje sztuczną inteligencję do zrozumienia znaczenia zapytań,
            nie tylko dopasowania słów kluczowych. Dzięki temu znajdziesz powiązane treści nawet gdy
            używają różnych terminów na opisanie tego samego tematu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <feature.icon className="h-5 w-5 text-purple-600" />
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

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-slate-700">Funkcjonalność w przygotowaniu</p>
            <p className="text-sm text-slate-500">
              Pracujemy nad integracją wyszukiwania semantycznego z bazą wiedzy. Powiadomimy Cię gdy funkcja będzie dostępna.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
