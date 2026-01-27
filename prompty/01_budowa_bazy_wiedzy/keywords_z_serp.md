# Keywords z SERP

## Opis
Prompt do ekstrakcji unikalnych słów kluczowych i encji z wyników SERP. Konsoliduje i deduplikuje frazy kluczowe, tłumaczy je na docelowy język i filtruje według listy wykluczeń.

## Zastosowanie
- Analiza wyników wyszukiwania pod kątem fraz kluczowych
- Budowa listy słów kluczowych SEO
- Identyfikacja trendów wyszukiwania
- Przygotowanie strategii contentowej

## Rekomendowany model
**Ollama Cloud:** `llama3.1:8b`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
You are tasked with extracting unique keywords and entities from the provided text that are **directly related to the main topic** specified by the keyword: <keyword>. The keywords and entities must be presented in the following language: <language>.

### Instructions:

1. **Identify Keywords and Entities**:
   - Extract significant nouns, proper nouns, phrases, and technical terms from the text.
   - Focus on recurring themes or concepts tied to the <keyword>.
   - Include relevant acronyms or abbreviations, providing their full forms if applicable (e.g., "AI (Artificial Intelligence)").

2. **Ensure Relevance**:
   - Include only keywords and entities that are **directly or closely connected** to the main keyword: <keyword>.
   - Exclude terms that are only tangentially related or not central to the main topic.

3. **Remove Duplicates**:
   - Ensure each keyword or entity appears only once in the final list.

4. **Maintain Language Consistency**:
   - Translate any keywords or entities from other languages into <language>.

5. **Apply Exclusions**:
   - Exclude the following brands, entities, and names from your list: <brands>.

6. **Format the Output**:
   - Present the final list in a comma-separated format:

     *Keyword/Entity 1, Keyword/Entity 2, Keyword/Entity 3, ...*

### Important Notes:
- Prioritize relevance to the main keyword: <keyword>.
- Do not include explanations, commentary, or unrelated terms.
- Deliver a concise, unique list that adheres to the specified language and format.
```

## Prompt (polski)

```
Twoim zadaniem jest wyodrębnienie unikalnych słów kluczowych i encji z dostarczonego tekstu, które są **bezpośrednio związane z głównym tematem** określonym przez słowo kluczowe: <keyword>. Słowa kluczowe i encje muszą być przedstawione w następującym języku: <language>.

### Instrukcje:

1. **Zidentyfikuj słowa kluczowe i encje**:
   - Wyodrębnij znaczące rzeczowniki, nazwy własne, frazy i terminy techniczne z tekstu.
   - Skup się na powtarzających się tematach lub koncepcjach związanych z <keyword>.
   - Uwzględnij odpowiednie akronimy lub skróty, podając ich pełne formy jeśli dotyczy (np. "AI (Sztuczna Inteligencja)").

2. **Zapewnij trafność**:
   - Uwzględnij tylko słowa kluczowe i encje, które są **bezpośrednio lub blisko związane** z głównym słowem kluczowym: <keyword>.
   - Wyklucz terminy, które są tylko pośrednio związane lub nie są centralne dla głównego tematu.

3. **Usuń duplikaty**:
   - Upewnij się, że każde słowo kluczowe lub encja pojawia się tylko raz na końcowej liście.

4. **Zachowaj spójność językową**:
   - Przetłumacz wszelkie słowa kluczowe lub encje z innych języków na <language>.

5. **Zastosuj wykluczenia**:
   - Wyklucz następujące marki, encje i nazwy z listy: <brands>.

6. **Sformatuj wynik**:
   - Przedstaw końcową listę w formacie oddzielonym przecinkami:

     *Słowo kluczowe 1, Słowo kluczowe 2, Słowo kluczowe 3, ...*

### Ważne uwagi:
- Priorytetyzuj trafność względem głównego słowa kluczowego: <keyword>.
- Nie uwzględniaj wyjaśnień, komentarzy ani niezwiązanych terminów.
- Dostarcz zwięzłą, unikalną listę zgodną z określonym językiem i formatem.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `keyword` | string | Główne słowo kluczowe |
| `language` | string | Język wynikowy |
| `brands` | string | Lista wykluczonych marek |
| `text` | string | Treść SERP i wyodrębnione keywords |

## Przykład użycia

```json
{
  "inputs": {
    "keyword": "klimatyzacja",
    "language": "Polish",
    "brands": "Gree\nMidea\nHaier",
    "text": "klimatyzacja split, montaż klimatyzacji, klimatyzator ścienny, BTU, chłodzenie pomieszczeń, Gree Lomo, czynnik R32, klimatyzacja domowa, klimatyzacja biurowa, efektywność energetyczna SEER"
  }
}
```

## Oczekiwany wynik

```
klimatyzacja split, montaż klimatyzacji, klimatyzator ścienny, BTU, chłodzenie pomieszczeń, czynnik R32, klimatyzacja domowa, klimatyzacja biurowa, efektywność energetyczna, SEER
```
