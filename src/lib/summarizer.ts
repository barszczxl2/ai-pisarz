// Funkcja do generowania streszczeń sekcji artykułu
// Używa prostego algorytmu ekstrakcji + opcjonalnie AI

/**
 * Generuje krótkie streszczenie sekcji (2-3 zdania)
 * Usuwa HTML tagi i wybiera najważniejsze zdania
 */
export function summarizeSection(
  heading: string,
  content: string,
  maxSentences: number = 2
): string {
  // Usuń tagi HTML
  const plainText = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Podziel na zdania
  const sentences = plainText
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 20); // Ignoruj bardzo krótkie zdania

  if (sentences.length === 0) {
    return '';
  }

  // Wybierz pierwsze zdania (najważniejsze w artykułach)
  const selectedSentences = sentences.slice(0, maxSentences);

  // Usuń nagłówek z treści streszczenia
  const headingText = heading.replace(/<[^>]+>/g, '').trim().toLowerCase();

  return selectedSentences
    .map(s => s.trim())
    .filter(s => !s.toLowerCase().includes(headingText))
    .join(' ');
}

/**
 * Buduje kontekst poprzednich sekcji (streszczenia)
 */
export function buildPreviousSectionsContext(
  summaries: Array<{ heading: string; summary: string }>
): string {
  if (summaries.length === 0) {
    return '';
  }

  return summaries
    .map(s => `${s.heading}\n${s.summary}`)
    .join('\n\n');
}

/**
 * Buduje plan przyszłych sekcji z brief
 */
export function buildUpcomingSectionsContext(
  briefItems: Array<{ heading: string; knowledge: string; keywords: string }>,
  currentIndex: number
): string {
  const upcoming = briefItems.slice(currentIndex + 1);

  if (upcoming.length === 0) {
    return '';
  }

  return upcoming
    .map(item => {
      const headingText = item.heading.replace(/<[^>]+>/g, '').trim();
      // Skróć knowledge do max 150 znaków
      const shortKnowledge = item.knowledge.length > 150
        ? item.knowledge.substring(0, 150) + '...'
        : item.knowledge;
      return `## ${headingText}\nTemat: ${shortKnowledge}`;
    })
    .join('\n\n');
}

/**
 * Generuje instrukcję anty-powtórzeniową
 */
export function buildAntiRepetitionInstruction(
  previousTopics: string[],
  upcomingTopics: string[]
): string {
  let instruction = `WAŻNE ZASADY:
1. NIE powtarzaj informacji z poprzednich sekcji.
2. NIE pisz o tematach zaplanowanych na kolejne sekcje.
3. Skup się TYLKO na aktualnym nagłówku.
4. Unikaj ogólników - pisz konkretnie o temacie tej sekcji.`;

  if (previousTopics.length > 0) {
    instruction += `\n\nTematy już omówione (NIE powtarzaj): ${previousTopics.slice(-5).join(', ')}`;
  }

  if (upcomingTopics.length > 0) {
    instruction += `\n\nTematy na kolejne sekcje (NIE pisz o nich teraz): ${upcomingTopics.slice(0, 3).join(', ')}`;
  }

  return instruction;
}

/**
 * Ekstrahuje główne tematy z tekstu
 */
export function extractTopics(text: string): string[] {
  // Proste wyciąganie tematów - nagłówki i kluczowe frazy
  const headingMatches = text.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
  const topics = headingMatches.map(h => h.replace(/<[^>]+>/g, '').trim());

  return topics.filter(t => t.length > 0);
}

export interface SectionSummary {
  heading: string;
  summary: string;
  topics: string[];
}

/**
 * Przetwarza ukończoną sekcję i generuje streszczenie
 */
export function processSectionForContext(
  headingHtml: string,
  contentHtml: string
): SectionSummary {
  const summary = summarizeSection(headingHtml, contentHtml, 2);
  const topics = extractTopics(headingHtml + contentHtml);

  return {
    heading: headingHtml.replace(/<[^>]+>/g, '').trim(),
    summary,
    topics,
  };
}
