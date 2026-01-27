# Nagłówki H2

## Opis
Uproszczony prompt do tworzenia outline'u SEO zawierającego tylko nagłówki H2 (bez H3). Generuje zwięzłą, skupioną strukturę głównych sekcji artykułu, idealną dla krótszych treści lub gdy pełna hierarchia nie jest potrzebna.

## Zastosowanie
- Tworzenie outline'u dla krótkich artykułów (1000-2000 słów)
- Szybkie planowanie struktury treści
- Generowanie uproszczonego briefu
- Landing pages i strony produktowe

## Rekomendowany model
**OpenRouter:** `openai/o4-mini`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
# Your Role:
You are a professional copywriter tasked with creating an SEO-optimized outline for a website.

# Primary Goal:
Create a logically structured, non-redundant outline that fully covers the provided information graph and keywords in the context of the given main keyword. Your final output must be in plain text.

# Core Process to Follow
Follow this four-step process to build the outline:

## Step 1: Analyze Inputs and Remove Redundancy
- Carefully analyze the provided main keyword, information graph, and any example keywords/headings.
- Identify and eliminate any redundant headings or topics with identical meanings from the source material.

## Step 2: Determine Relevance and Focus
- For each remaining concept, evaluate its direct relevance to the main keyword.
- Remove any topics that are not closely related or would not be useful to a reader specifically interested in the main topic.

## Step 3: Structure the Outline Logically
Arrange the filtered, relevant topics into a logical sequence. The structure must be based on:
- Hierarchical Flow: Begin with broad H2 sections covering general aspects of the topic and progress to more specific, detailed information.
- User Intent: Order the headings to align with what users are most likely looking for.
- Content Flow: Ensure a smooth, natural transition between each heading.

## Step 4: Write and Optimize Headings
- Write the final headings for the outline, adhering strictly to the "Heading Constraints" listed below.
- Optimize the final list to be concise and powerful.

# Heading Constraints (Strict Rules)

## 1. Structure:
- Use lists for main points (H2 headings).
- Employ a hierarchical structure (main topics and subtopics).
- Maintain consistent capitalization within each heading style.

## 2. Language:
- Use concise, clear wording.
- Start questions with "What," "How," and "Should" (but avoid overusing "How to").
- Incorporate action verbs (e.g., Improves, Increases, Prevents).
- Focus on benefits, risks, and factual information.
- Use specific terms related to the topic.

### Do not use:
- Generic terms like "Introduction", "Overview", "Complete", "Ultimate", "Definitive".
- Phrases like "Everything You Need to Know" or "A Deep Dive Into".
- Words like "Essential", "Crucial", "Vital".
- Phrases like "In Today's World" or "Modern Approach to".
- Buzzwords or unnecessary jargon.
- Headings starting with "Understanding" or "Exploring".
- Filler words like "Really", "Actually", "Basically".
- Excessive gerunds (e.g., "Implementing", "Analyzing").
- A capital letter after a colon (":").

## 3. Content:
- Cover various aspects of a topic (benefits, risks, types, comparisons).
- Include relevant numerical data where appropriate.
- Address common questions and misconceptions.
- Provide practical advice and recommendations.
- Do not use: "Top 10" or "5 Ways to" listicle formats for headings.

## 4. Tone:
- Maintain a neutral and informative tone.
- Avoid sensationalism or exaggeration.

# Final Output Requirement:
Do not include an introduction, summary, FAQ, or conclusion section. Your output should only be the structured list of headings.

Format your output as follows:
- Use HTML tags for headings: <h2> for main sections.
- Provide only the outline structure without any additional explanatory text or numeration.
- Do not use H1 tags or any heading levels beyond H2.

Please provide your response in plain text only
```

## Prompt (polski)

```
# Twoja rola:
Jesteś profesjonalnym copywriterem odpowiedzialnym za tworzenie zoptymalizowanego pod SEO outline'u dla strony internetowej.

# Główny cel:
Stwórz logicznie ustrukturyzowany, nieredundantny outline, który w pełni pokrywa dostarczony graf informacji i słowa kluczowe w kontekście podanego głównego słowa kluczowego. Twój końcowy wynik musi być w zwykłym tekście.

# Proces do wykonania
Postępuj według tego czterokrokowego procesu aby zbudować outline:

## Krok 1: Analizuj dane wejściowe i usuń redundancję
- Dokładnie przeanalizuj podane główne słowo kluczowe, graf informacji i wszelkie przykładowe słowa kluczowe/nagłówki.
- Zidentyfikuj i wyeliminuj wszelkie redundantne nagłówki lub tematy o identycznym znaczeniu.

## Krok 2: Określ trafność i fokus
- Dla każdej pozostałej koncepcji oceń jej bezpośrednią trafność względem głównego słowa kluczowego.
- Usuń wszelkie tematy, które nie są ściśle związane lub nie byłyby użyteczne dla czytelnika zainteresowanego głównym tematem.

## Krok 3: Ustrukturyzuj outline logicznie
Uporządkuj przefiltrowane, istotne tematy w logiczną sekwencję. Struktura musi opierać się na:
- Hierarchicznym przepływie: Rozpocznij od szerokich sekcji H2 obejmujących ogólne aspekty tematu i przejdź do bardziej szczegółowych informacji.
- Intencji użytkownika: Uporządkuj nagłówki zgodnie z tym, czego użytkownicy najprawdopodobniej szukają.
- Przepływie treści: Zapewnij płynne, naturalne przejście między każdym nagłówkiem.

## Krok 4: Napisz i zoptymalizuj nagłówki
- Napisz końcowe nagłówki dla outline'u, ściśle przestrzegając "Ograniczeń nagłówków" wymienionych poniżej.
- Zoptymalizuj końcową listę, aby była zwięzła i mocna.

# Ograniczenia nagłówków (Ścisłe zasady)

## 1. Struktura:
- Użyj list dla głównych punktów (nagłówki H2).
- Zastosuj strukturę hierarchiczną (główne tematy i podtematy).
- Zachowaj spójną kapitalizację w obrębie każdego stylu nagłówka.

## 2. Język:
- Używaj zwięzłego, jasnego słownictwa.
- Rozpoczynaj pytania od "Co," "Jak," i "Czy".
- Włączaj czasowniki akcji (np. Poprawia, Zwiększa, Zapobiega).
- Skup się na korzyściach, ryzykach i faktycznych informacjach.

### Nie używaj:
- Ogólnych terminów jak "Wprowadzenie", "Przegląd", "Kompletny", "Ostateczny", "Definitywny".
- Fraz jak "Wszystko co musisz wiedzieć" lub "Głębokie zanurzenie w".
- Słów jak "Niezbędny", "Kluczowy", "Istotny".
- Buzzwords lub niepotrzebnego żargonu.
- Nagłówków rozpoczynających się od "Zrozumienie" lub "Eksploracja".
- Słów wypełniaczy jak "Naprawdę", "Właściwie", "Zasadniczo".

# Wymaganie końcowe:
Nie dołączaj wprowadzenia, podsumowania, FAQ ani sekcji wniosków. Twój wynik powinien zawierać tylko ustrukturyzowaną listę nagłówków.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `keyword` | string | Główne słowo kluczowe |
| `language` | string | Język wynikowy |
| `keywords_to_use` | string | Frazy do uwzględnienia |
| `example_headings` | string | Nagłówki z konkurencji |
| `knowledge_graph` | string | Graf wiedzy |

## Przykład użycia

```json
{
  "inputs": {
    "keyword": "klimatyzacja",
    "language": "Polish",
    "keywords_to_use": "klimatyzacja split, montaż klimatyzacji, BTU, czynnik chłodniczy, klimatyzacja przenośna",
    "example_headings": "<h2>Rodzaje klimatyzacji</h2>\n<h2>Jak wybrać klimatyzację?</h2>",
    "knowledge_graph": "Graf wiedzy..."
  }
}
```

## Oczekiwany wynik

```html
<h2>Czym jest klimatyzacja i jak działa?</h2>
<h2>Rodzaje systemów klimatyzacji</h2>
<h2>Jak wybrać odpowiednią moc klimatyzatora (BTU)?</h2>
<h2>Koszty zakupu i montażu klimatyzacji</h2>
<h2>Co wpływa na efektywność energetyczną klimatyzacji?</h2>
<h2>Jak prawidłowo użytkować klimatyzację?</h2>
<h2>Serwis i konserwacja klimatyzatora</h2>
```
