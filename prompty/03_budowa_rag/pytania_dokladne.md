# Pytania Dokładne

## Opis
Prompt do dzielenia treści na chunki w formacie nagłówek-wiedza, tworząc szczegółowe pary pytanie-odpowiedź. Analizuje treść pod kątem głównego słowa kluczowego i buduje strukturę wiedzy odpowiednią do retrieval w systemach RAG.

## Zastosowanie
- Budowa bazy wiedzy do RAG (Retrieval Augmented Generation)
- Przygotowanie danych do wyszukiwania semantycznego
- Tworzenie struktury Q&A dla chatbotów
- Chunking treści z zachowaniem kontekstu

## Rekomendowany model
**OpenRouter:** `google/gemini-2.5-flash`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
You are an expert content analyst tasked with chunking and structuring information from a given text. Your goal is to create a set of headings and associated knowledge based on the content provided. Follow these instructions carefully.

Chunking Process:

a) Identify a main topic related to the primary keyword.
b) Formulate a clear, concise heading that reflects this topic.
c) List out relevant information from the content related to this topic.
d) Consider potential subheadings or related topics.
e) Extract and organize comprehensive knowledge about this topic from the listed information.
f) Review the heading and knowledge pair to ensure they are well-matched and the knowledge is sufficiently detailed.
g) Check that the chunk doesn't mention any excluded brands or entities.
h) Verify that the heading-knowledge pair is relevant to the main keyword and fits within the scope of the provided headings list.

It's OK for this section to be quite long.

Output Format:
Present your results in the following format:

[Heading 1]
[Comprehensive knowledge about Heading 1]
###
[Heading 2]
[Comprehensive knowledge about Heading 2]
###
[Continue for all relevant headings]

Important notes:
- Each heading should be on a single line.
- The knowledge should be as comprehensive as possible while remaining relevant to the heading.
- Use "###" as a separator between each heading-knowledge pair.
- Do not include phrases like "Ask Question" or "Give Answer" in the output.
- Do not use any HTML tags (like <h2> or any <hX>) in the output.

Final Review:
Before submitting your response, review your output to ensure:
- All headings are relevant to the main keyword and content.
- The knowledge provided for each heading is comprehensive and well-matched.
- No excluded brands or entities are mentioned.
- The output adheres to the specified format.

Begin the chunking process now, following these instructions. Provide your output in plain text in the specified language.
```

## Prompt (polski)

```
Jesteś ekspertem analizy treści odpowiedzialnym za dzielenie i strukturyzowanie informacji z podanego tekstu. Twoim celem jest stworzenie zestawu nagłówków i powiązanej wiedzy na podstawie dostarczonej treści. Postępuj dokładnie według instrukcji.

Proces chunkowania:

a) Zidentyfikuj główny temat związany z podstawowym słowem kluczowym.
b) Sformułuj jasny, zwięzły nagłówek odzwierciedlający ten temat.
c) Wypisz istotne informacje z treści związane z tym tematem.
d) Rozważ potencjalne podnagłówki lub powiązane tematy.
e) Wyodrębnij i uporządkuj kompleksową wiedzę na ten temat z wypisanych informacji.
f) Przejrzyj parę nagłówek-wiedza, aby upewnić się, że są dobrze dopasowane i wiedza jest wystarczająco szczegółowa.
g) Sprawdź, czy chunk nie wspomina żadnych wykluczonych marek lub encji.
h) Zweryfikuj, czy para nagłówek-wiedza jest istotna dla głównego słowa kluczowego i mieści się w zakresie dostarczonej listy nagłówków.

Ta sekcja może być dość długa.

Format wyjściowy:
Przedstaw wyniki w następującym formacie:

[Nagłówek 1]
[Kompleksowa wiedza o Nagłówku 1]
###
[Nagłówek 2]
[Kompleksowa wiedza o Nagłówku 2]
###
[Kontynuuj dla wszystkich istotnych nagłówków]

Ważne uwagi:
- Każdy nagłówek powinien być w jednej linii.
- Wiedza powinna być jak najbardziej kompleksowa, pozostając istotną dla nagłówka.
- Użyj "###" jako separatora między każdą parą nagłówek-wiedza.
- Nie uwzględniaj fraz jak "Zadaj pytanie" lub "Udziel odpowiedzi" w wyniku.
- Nie używaj żadnych tagów HTML (jak <h2> czy jakiekolwiek <hX>) w wyniku.

Końcowy przegląd:
Przed przesłaniem odpowiedzi przejrzyj swój wynik, aby upewnić się:
- Wszystkie nagłówki są istotne dla głównego słowa kluczowego i treści.
- Wiedza dostarczona dla każdego nagłówka jest kompleksowa i dobrze dopasowana.
- Nie wspomniano żadnych wykluczonych marek lub encji.
- Wynik jest zgodny z określonym formatem.

Rozpocznij teraz proces chunkowania. Podaj wynik w zwykłym tekście w określonym języku.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `main_keyword` | string | Główne słowo kluczowe |
| `output_language` | string | Język wynikowy |
| `headings_to_answer` | string | Lista nagłówków do zbudowania wiedzy |
| `brands_to_exclude` | string | Lista wykluczonych marek |
| `content_to_chunk` | string | Treść do przetworzenia |

## Przykład użycia

```json
{
  "inputs": {
    "main_keyword": "fotowoltaika",
    "output_language": "Polish",
    "headings_to_answer": "<h2>Czym jest fotowoltaika?</h2>\n<h2>Rodzaje paneli fotowoltaicznych</h2>",
    "brands_to_exclude": "SunPower\nJA Solar",
    "content_to_chunk": "Fotowoltaika to technologia przekształcania światła słonecznego w energię elektryczną przy pomocy paneli słonecznych. Wyróżniamy panele monokrystaliczne o najwyższej wydajności (18-22%), panele polikrystaliczne o niższej cenie, oraz panele cienkowarstwowe stosowane na dużych powierzchniach."
  }
}
```

## Oczekiwany wynik

```
Czym jest fotowoltaika?
Fotowoltaika to technologia przekształcania światła słonecznego w energię elektryczną przy pomocy paneli słonecznych. Proces ten wykorzystuje efekt fotoelektryczny, gdzie fotony światła wybijają elektrony z materiału półprzewodnikowego, generując prąd stały. Technologia ta stanowi jeden z kluczowych elementów transformacji energetycznej i produkcji energii odnawialnej.
###
Rodzaje paneli fotowoltaicznych
Wyróżniamy trzy główne rodzaje paneli fotowoltaicznych. Panele monokrystaliczne charakteryzują się najwyższą wydajnością na poziomie 18-22% i są idealne dla instalacji o ograniczonej przestrzeni. Panele polikrystaliczne oferują niższą cenę przy nieco niższej wydajności. Panele cienkowarstwowe znajdują zastosowanie na dużych powierzchniach, gdzie koszt jednostkowy jest kluczowy.
###
```
