# Generator Briefu

## Opis
Prompt do generowania kompleksowego briefu contentowego. Mapuje wiedzę z grafów informacji i słowa kluczowe do predefiniowanej listy nagłówków, tworząc strukturę JSON z wiedzą i keywords dla każdej sekcji artykułu.

## Zastosowanie
- Tworzenie briefów dla copywriterów
- Planowanie struktury artykułów SEO
- Przydzielanie słów kluczowych do sekcji
- Organizacja wiedzy przed pisaniem

## Rekomendowany model
**OpenRouter:** `openai/gpt-4.1-mini`
**OpenRouter:** `anthropic/claude-3.5-sonnet`

## Prompt (oryginalny)

```
Your role is to act as an expert content brief generator. You will be provided with distinct inputs, and your task is to precisely map relevant knowledge and keywords to a predefined list of content headings.

# Inputs Provided:

- <keywords>: A comprehensive list of individual keywords and key phrases that must be integrated into the content brief.

- <information_graph>: A structured representation containing factual data, statistics, verifiable statements, and concrete details pertinent to the content topic.

- <knowledge_graph>: A structured representation illustrating conceptual relationships, hierarchies, definitions, and broader contextual information related to the content topic.

- <headings>: An ordered list of content headings, each enclosed in <hX>...</hX> tags (e.g., <h2>...</h2>, <h3>...</h3>). These headings define the immutable structure of the content brief.

# Objective:

For each heading provided in <headings>, you must:
- Extract and synthesize the most relevant and comprehensive knowledge from both the <information_graph> and <knowledge_graph>.

- Assign all designated keywords from <keywords> to the appropriate headings, ensuring every keyword is used at least once.

# Key Principles & Constraints:
- Exact Heading Preservation: The text and HTML tag structure (<hX>...</hX>) of each heading from the <headings> input must be preserved exactly in the output. Do not alter, rephrase, or modify them in any way.

- Exhaustive Keyword Coverage: Every single keyword provided in the <keywords> list must be assigned to at least one heading. If a keyword does not have an immediately obvious or direct fit, assign it to the most broadly related heading to ensure its inclusion.

- Comprehensive Knowledge Integration: Utilize all relevant information and relationships from both the <information_graph> and <knowledge_graph> that pertain to each heading. Synthesize this information coherently.

- Token Limit Adherence: The combined "knowledge" and "keywords" content for each heading object must not exceed 500 tokens each. If the comprehensive knowledge or keywords for a heading would naturally exceed this, prioritize the most critical, most relevant, and most unique points or keywords, and concisely summarize to fit within the limit. Avoid abrupt truncation; aim for a complete, albeit condensed, thought.

- Strict Output Format: The output must be a JSON array of objects, exactly as specified below, with no additional text, commentary, preambles, or postambles.

# Step-by-Step Task Execution:

- Thoroughly review the <keywords> list to understand all required terms.

- Analyze the <information_graph> and <knowledge_graph> to grasp the factual data, conceptual relationships, and overall domain knowledge.

- Iterate through each heading in the <headings> input:
a.  Knowledge Assignment: Identify all direct, supporting, and contextual information from both <information_graph> and <knowledge_graph> that is highly relevant to the current heading. Synthesize this into a concise, informative summary.
b.  Keyword Assignment: From the <keywords> list, assign all keywords that logically and directly relate to the current heading. Mark these keywords as "used."

- After processing all headings, perform a final review of the <keywords> list. Any keywords not yet assigned must be assigned to the most appropriate, or most general, heading that can accommodate them without violating the 500-token limit. Prioritize distributing remaining keywords logically.

- Construct the final output JSON array.

# Desired Output Format (Strict JSON):

[
  {
    "heading": "<hX>...</hX>",
    "knowledge": "A synthesized summary of information and knowledge relevant to this heading, extracted from the provided graphs. This should be concise and within the 500-token limit.",
    "keywords": "A comma-separated list of keywords directly assigned to this heading from the input <keywords> list, ensuring all keywords are covered and within the 500-token limit."
  },
  {
    "heading": "<hX>...</hX>",
    "knowledge": "...",
    "keywords": "..."
  }
]
```

## Prompt (polski)

```
Twoją rolą jest działanie jako ekspert generowania briefów contentowych. Otrzymasz różne dane wejściowe, a twoim zadaniem jest precyzyjne mapowanie istotnej wiedzy i słów kluczowych do predefiniowanej listy nagłówków treści.

# Dostarczone dane wejściowe:

- <keywords>: Kompleksowa lista indywidualnych słów kluczowych i fraz kluczowych, które muszą być zintegrowane w briefie contentowym.

- <information_graph>: Strukturalna reprezentacja zawierająca dane faktyczne, statystyki, weryfikowalne stwierdzenia i konkretne szczegóły dotyczące tematu treści.

- <knowledge_graph>: Strukturalna reprezentacja ilustrująca relacje koncepcyjne, hierarchie, definicje i szerszy kontekst związany z tematem treści.

- <headings>: Uporządkowana lista nagłówków treści, każdy zamknięty w tagach <hX>...</hX>. Te nagłówki definiują niezmienną strukturę briefu contentowego.

# Cel:

Dla każdego nagłówka dostarczonego w <headings> musisz:
- Wyodrębnić i zsyntetyzować najbardziej istotną i kompleksową wiedzę z <information_graph> i <knowledge_graph>.

- Przypisać wszystkie wyznaczone słowa kluczowe z <keywords> do odpowiednich nagłówków, upewniając się, że każde słowo kluczowe jest użyte przynajmniej raz.

# Kluczowe zasady i ograniczenia:
- Dokładne zachowanie nagłówków: Tekst i struktura tagów HTML (<hX>...</hX>) każdego nagłówka musi być zachowana dokładnie w wyniku. Nie zmieniaj, nie przeformułowuj ani nie modyfikuj ich w żaden sposób.

- Wyczerpujące pokrycie słów kluczowych: Każde słowo kluczowe z listy <keywords> musi być przypisane do przynajmniej jednego nagłówka.

- Kompleksowa integracja wiedzy: Wykorzystaj wszystkie istotne informacje i relacje z obu grafów odnoszące się do każdego nagłówka. Zsyntetyzuj te informacje spójnie.

- Przestrzeganie limitu tokenów: Połączona treść "knowledge" i "keywords" dla każdego obiektu nagłówka nie może przekraczać 500 tokenów każda.

- Ścisły format wyjściowy: Wynik musi być tablicą JSON obiektów, dokładnie jak określono poniżej, bez dodatkowego tekstu.

# Pożądany format wyjściowy (Ścisły JSON):

[
  {
    "heading": "<hX>...</hX>",
    "knowledge": "Zsyntetyzowane podsumowanie informacji i wiedzy istotnej dla tego nagłówka.",
    "keywords": "Lista słów kluczowych oddzielonych przecinkami przypisanych bezpośrednio do tego nagłówka."
  }
]
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `keywords` | string | Lista słów kluczowych |
| `information_graph` | string | Graf informacji (fakty, dane) |
| `knowledge_graph` | string | Graf wiedzy (relacje, koncepcje) |
| `headings` | string | Lista nagłówków w tagach HTML |

## Przykład użycia

```json
{
  "inputs": {
    "keywords": "fotowoltaika, panele słoneczne, energia odnawialna, inwerter, prosument, net-metering",
    "information_graph": "{\"graf informacji\": [{\"entity\": \"panele fotowoltaiczne\", \"relationship\": \"mają wydajność\", \"attribute\": \"18-22%\"}]}",
    "knowledge_graph": "Graf wiedzy:\n(\"ent\" | \"fotowoltaika\" | \"technologia\" | \"Przekształcanie energii słonecznej w elektryczność\" | 100)",
    "headings": "<h2>Czym jest fotowoltaika?</h2>\n<h2>Jak działa instalacja fotowoltaiczna?</h2>"
  }
}
```

## Oczekiwany wynik

```json
[
  {
    "heading": "<h2>Czym jest fotowoltaika?</h2>",
    "knowledge": "Fotowoltaika to technologia przekształcania energii słonecznej w energię elektryczną przy pomocy paneli słonecznych. Proces wykorzystuje efekt fotoelektryczny w materiałach półprzewodnikowych. Panele fotowoltaiczne osiągają wydajność na poziomie 18-22%.",
    "keywords": "fotowoltaika, panele słoneczne, energia odnawialna"
  },
  {
    "heading": "<h2>Jak działa instalacja fotowoltaiczna?</h2>",
    "knowledge": "Instalacja fotowoltaiczna składa się z paneli słonecznych, inwertera przekształcającego prąd stały na zmienny, oraz systemu przyłączenia do sieci. Prosument może oddawać nadwyżki energii do sieci w ramach systemu net-metering.",
    "keywords": "inwerter, prosument, net-metering"
  }
]
```
