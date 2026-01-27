'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const LANGUAGES = [
  { value: 'Polish', label: 'Polski' },
  { value: 'English', label: 'Angielski' },
  { value: 'German', label: 'Niemiecki' },
  { value: 'French', label: 'Francuski' },
  { value: 'Spanish', label: 'Hiszpański' },
  { value: 'Italian', label: 'Włoski' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    keyword: '',
    language: 'Polish',
    ai_overview_content: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.keyword.trim()) {
      toast.error('Wprowadź słowo kluczowe');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: formData.keyword.trim(),
          language: formData.language,
          ai_overview_content: formData.ai_overview_content.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      toast.success('Projekt został utworzony');
      router.push(`/projects/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Nie udało się utworzyć projektu');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/projects">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót do listy
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Nowy Projekt SEO
          </CardTitle>
          <CardDescription>
            Wprowadź dane, aby rozpocząć generowanie artykułu SEO.
            System przeprowadzi Cię przez 5 etapów tworzenia treści.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Keyword */}
            <div className="space-y-2">
              <Label htmlFor="keyword">
                Słowo kluczowe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="keyword"
                placeholder="np. 'jak wybrać laptop do pracy'"
                value={formData.keyword}
                onChange={(e) =>
                  setFormData({ ...formData, keyword: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Główne słowo kluczowe, na które będzie zoptymalizowany artykuł
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Język</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz język" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Język, w którym zostanie wygenerowany artykuł
              </p>
            </div>

            {/* AI Overview Content */}
            <div className="space-y-2">
              <Label htmlFor="ai_overview">
                Treść AI Overview (opcjonalne)
              </Label>
              <Textarea
                id="ai_overview"
                placeholder="Wklej treść z AI Overview Google, jeśli dostępna..."
                value={formData.ai_overview_content}
                onChange={(e) =>
                  setFormData({ ...formData, ai_overview_content: e.target.value })
                }
                rows={6}
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Opcjonalna treść z Google AI Overview dla danego słowa kluczowego.
                Pomoże to wygenerować bardziej trafne nagłówki i treść.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/projects">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Anuluj
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tworzenie...
                  </>
                ) : (
                  'Utwórz projekt'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
