'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  Clock,
  FileText,
  BarChart3,
  Copy,
  Check,
  Link2,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

const CURL_EXAMPLE = `curl -X GET "https://api.ding.pl/v1/prices" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_id": "12345", "date_from": "2019-01-01"}'`;

const VALUE_PROPOSITION = `Baza DING to unikalne źródło danych cenowych produktów, zbieranych systematycznie
przez ostatnie 6 lat. Integracja tych danych z Twoimi artykułami SEO pozwala na:`;

const VALUE_POINTS = [
  {
    icon: Clock,
    title: 'Kontekst historyczny',
    description: 'Pokaż czytelnikom jak zmieniały się ceny produktów w czasie, budując wiarygodność treści',
  },
  {
    icon: TrendingUp,
    title: 'Analiza trendów',
    description: 'Automatycznie wzbogacaj artykuły o wykresy i statystyki cenowe, zwiększając wartość merytoryczną',
  },
  {
    icon: Calendar,
    title: 'Sezonowość',
    description: 'Identyfikuj najlepsze momenty zakupowe i twórz treści dopasowane do cykli cenowych',
  },
  {
    icon: BarChart3,
    title: 'Porównania produktów',
    description: 'Generuj tabele porównawcze cen różnych produktów z kategorii, zwiększając użyteczność artykułu',
  },
  {
    icon: Award,
    title: 'Wiarygodność źródła',
    description: 'Dane z 6 lat to solidna podstawa do formułowania rekomendacji zakupowych w treściach',
  },
];

const STATS = [
  { label: '6 lat danych', icon: Clock },
  { label: '2.5M+ rekordów', icon: FileText },
  { label: '150K+ produktów', icon: Database },
  { label: 'Aktualizacja: codziennie', icon: BarChart3 },
];

export default function BazaDingPage() {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(CURL_EXAMPLE);
      setCopied(true);
      toast.success('Skopiowano do schowka');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nie udało się skopiować');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">BAZA DING</h2>
            <p className="text-slate-500">Dane Cenowe Produktów</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATS.map((stat) => (
            <Badge key={stat.label} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
              <stat.icon className="h-3.5 w-3.5" />
              {stat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Value Proposition Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Jak dane cenowe wzbogacą Twoje artykuły?
          </CardTitle>
          <CardDescription>{VALUE_PROPOSITION}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_POINTS.map((point) => (
              <div
                key={point.title}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <point.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{point.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* API Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-purple-600" />
                API (cURL)
              </CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-3 w-3 mr-1" />
                Wkrótce
              </Badge>
            </div>
            <CardDescription>
              Integracja poprzez REST API - pobieraj dane cenowe bezpośrednio do swoich workflow'ów
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 pr-12">
                {CURL_EXAMPLE}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Integracja API w przygotowaniu</p>
                <p className="text-sm text-slate-500">
                  Pracujemy nad dokumentacją i endpointami. Powiadomimy Cię gdy będzie gotowe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Import Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Import z pliku
              </CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-3 w-3 mr-1" />
                Wkrótce
              </Badge>
            </div>
            <CardDescription>
              Import danych cenowych z pliku CSV lub Excel - idealne do jednorazowych analiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">
                Przeciągnij plik CSV lub XLSX tutaj
              </p>
              <p className="mt-1 text-xs text-slate-500">
                lub kliknij aby wybrać plik
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Wybierz plik
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Import plików w przygotowaniu</p>
                <p className="text-sm text-slate-500">
                  Funkcjonalność importu zostanie uruchomiona wkrótce.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
