# Pytania Ogólne

## Opis
Uproszczony prompt do dzielenia treści na chunki w formacie pytanie-odpowiedź. Każdy chunk jest ograniczony do 400 tokenów, co czyni go idealnym do systemów RAG z ograniczeniami na długość kontekstu. Tworzy ogólne Q&A do retrieval.

## Zastosowanie
- Budowa lekkiej bazy wiedzy Q&A
- Przygotowanie danych do prostszych systemów RAG
- FAQ i chatboty obsługi klienta
- Chunking z kontrolą długości

## Rekomendowany model
**OpenRouter:** `openai/gpt-4.1-mini`
**Ollama Cloud:** `llama3.1:8b`

## Prompt (oryginalny)

```
You will be chunking content into a set of all possible questions and answers. Each chunk should focus on a main topic and be no more than 400 tokens long. Follow these steps:

1. The main keyword to focus on is <keyword>

2. Output should be in the following language <language>

3. Exclude any entities, brands, or names from this list <brands_to_exclude>

4. Chunk the content into sets of all possible questions and answers following these guidelines:
   - Each question should reflect a main topic related to <keyword> from the content.
   - Ensure that each chunk (question + answer) does not exceed 400 tokens.
   - Write the question on one line.
   - On the next line, write the answer as long as possible while staying within the 400 token limit.
   - After each question-answer pair, add "###" as a separator.
   - Do not include "Ask Question" or "Give Answer" in the output.
   - Do not mention or include any of the brands, entities, or names listed in the <brands_to_exclude> section.

5. Here's an example of the desired output format:

What is the capital of France?
The capital of France is Paris. It is known for its iconic landmarks such as the Eiffel Tower and the Louvre Museum.
###
How does photosynthesis work?
Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.
###

6. Begin chunking the content now, following the instructions above. Output in plain text in <language>.
```

## Prompt (polski)

```
Będziesz dzielić treść na zestaw wszystkich możliwych pytań i odpowiedzi. Każdy chunk powinien skupiać się na głównym temacie i nie przekraczać 400 tokenów. Wykonaj następujące kroki:

1. Główne słowo kluczowe do skupienia się to <keyword>

2. Wynik powinien być w następującym języku <language>

3. Wyklucz wszelkie encje, marki lub nazwy z tej listy <brands_to_exclude>

4. Podziel treść na zestawy wszystkich możliwych pytań i odpowiedzi zgodnie z wytycznymi:
   - Każde pytanie powinno odzwierciedlać główny temat związany z <keyword> z treści.
   - Upewnij się, że każdy chunk (pytanie + odpowiedź) nie przekracza 400 tokenów.
   - Napisz pytanie w jednej linii.
   - W następnej linii napisz odpowiedź tak długą jak to możliwe, pozostając w limicie 400 tokenów.
   - Po każdej parze pytanie-odpowiedź dodaj "###" jako separator.
   - Nie uwzględniaj "Zadaj pytanie" ani "Udziel odpowiedzi" w wyniku.
   - Nie wspominaj ani nie uwzględniaj żadnych marek, encji lub nazw wymienionych w sekcji <brands_to_exclude>.

5. Oto przykład pożądanego formatu wyjściowego:

Jaka jest stolica Francji?
Stolicą Francji jest Paryż. Jest znany z ikonicznych zabytków takich jak Wieża Eiffla i Muzeum Luwru.
###
Jak działa fotosynteza?
Fotosynteza to proces, w którym rośliny wykorzystują światło słoneczne, wodę i dwutlenek węgla do produkcji tlenu i energii w formie cukru.
###

6. Rozpocznij teraz dzielenie treści, postępując zgodnie z powyższymi instrukcjami. Wynik w zwykłym tekście w języku <language>.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `keyword` | string | Główne słowo kluczowe |
| `language` | string | Język wynikowy |
| `brands_to_exclude` | string | Lista wykluczonych marek |
| `content` | string | Treść do przetworzenia |

## Przykład użycia

```json
{
  "inputs": {
    "keyword": "pompa ciepła",
    "language": "Polish",
    "brands_to_exclude": "Viessmann\nBosch\nDaikin",
    "content": "Pompa ciepła to urządzenie pobierające ciepło z otoczenia (powietrza, gruntu lub wody) i przenosząca je do budynku. Współczynnik COP określa ile energii cieplnej uzyskamy z jednostki energii elektrycznej. Typowe wartości COP to 3-5, co oznacza że z 1 kWh prądu uzyskujemy 3-5 kWh ciepła."
  }
}
```

## Oczekiwany wynik

```
Czym jest pompa ciepła?
Pompa ciepła to urządzenie pobierające ciepło z otoczenia (powietrza, gruntu lub wody) i przenosząca je do budynku. Działa na zasadzie odwróconego obiegu chłodniczego, gdzie czynnik chłodniczy pobiera ciepło z niskotemperaturowego źródła i oddaje je do systemu grzewczego.
###
Co oznacza współczynnik COP pompy ciepła?
Współczynnik COP (Coefficient of Performance) określa ile energii cieplnej uzyskamy z jednostki energii elektrycznej. Typowe wartości COP wynoszą 3-5, co oznacza że z 1 kWh prądu uzyskujemy 3-5 kWh ciepła. Im wyższy COP, tym bardziej efektywna jest pompa ciepła.
###
Jakie są źródła ciepła dla pompy ciepła?
Pompa ciepła może pobierać ciepło z trzech głównych źródeł: powietrza (pompy powietrzne), gruntu (pompy gruntowe z wymiennikiem poziomym lub pionowym) oraz wody gruntowej lub powierzchniowej (pompy wodne). Wybór źródła zależy od warunków lokalnych i budżetu.
###
```
