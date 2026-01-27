# Predykaty Semantyczne

## Opis
Prompt do ekstrakcji predykatów semantycznych z treści - trójek składających się z podmiotu, orzeczenia i dopełnienia. Identyfikuje relacje między encjami bezpośrednio powiązane z głównym słowem kluczowym, filtrując dane osobowe i wykluczone marki.

## Zastosowanie
- Budowa struktury wiedzy na temat danego słowa kluczowego
- Ekstrakcja relacji semantycznych z tekstu
- Przygotowanie danych do grafu informacji
- Analiza kontekstu i znaczenia treści

## Rekomendowany model
**Ollama Cloud:** `gemma2:27b`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
You are an AI assistant tasked with extracting semantic predicates from provided content. Your objective is to identify subject-predicate-object relationships explicitly related to the <keyword>, while strictly adhering to the following constraints and exclusions.

## Instructions
Follow these steps to extract and refine semantic predicates:
1. Identify Relationships: Extract subject-predicate-object triples from the content, where the subject or object directly involves the <keyword>.
2. Relevance Filter: Include only triples where the <keyword> is the subject, object, or a core component of the relationship, ensuring direct relevance to the main topic.
3. Exclude Personal Information: Remove any triples containing personal details, such as names or surnames of individuals.
4. Maintain Topic Focus: Discard any triples not directly tied to the <keyword>, avoiding tangential or unrelated information.
5. Apply Exclusion List: Exclude triples mentioning entities, brands, or names listed in the brands exclusion list <brands>

## Output Format
For each relevant semantic predicate, format your output as:
("subject", "predicate", "object", "description")

- Subject: A noun or noun phrase related to the <keyword>.
- Predicate: A verb or verb phrase describing the relationship.
- Object: A noun or noun phrase (optional if predicate is intransitive), relevant to the <keyword>.
- Description: Context from which the triple is derived.

## Requirements
1. <keyword> Focus: Only include predicates where the is central to the relationship.
2. Language: Extract in <language>
3. No Personal Data: Avoid any mention of specific individuals.
4. No Excluded Entities: Generalize subjects (e.g., "various entities" instead of "Google") to exclude brands in the exclusion list.
5. Clarity and Precision: Ensure triples are concise, accurate, and reflect the content's intent.

## Output Presentation
Present the final output as a list of semantic predicates, each on a new line.

## Example
If <keyword> is "artificial intelligence" and the content includes:

"Artificial intelligence is advancing rapidly, and Google is developing AI tools."

Output:
("artificial intelligence", "has", "rapid advancement", "Artificial intelligence is advancing rapidly")
```

## Prompt (polski)

```
Jesteś asystentem AI, którego zadaniem jest wyodrębnianie predykatów semantycznych z dostarczonej treści. Twoim celem jest identyfikacja relacji podmiot-orzeczenie-dopełnienie bezpośrednio związanych ze słowem kluczowym <keyword>, przy ścisłym przestrzeganiu następujących ograniczeń i wykluczeń.

## Instrukcje
Wykonaj następujące kroki, aby wyodrębnić i udoskonalić predykaty semantyczne:
1. Identyfikuj relacje: Wyodrębnij trójki podmiot-orzeczenie-dopełnienie z treści, gdzie podmiot lub dopełnienie bezpośrednio dotyczy <keyword>.
2. Filtr trafności: Uwzględnij tylko trójki, w których <keyword> jest podmiotem, dopełnieniem lub kluczowym elementem relacji, zapewniając bezpośrednie odniesienie do głównego tematu.
3. Wyklucz dane osobowe: Usuń wszystkie trójki zawierające dane osobowe, takie jak imiona lub nazwiska osób.
4. Zachowaj fokus na temat: Odrzuć wszystkie trójki niezwiązane bezpośrednio z <keyword>, unikając informacji pobocznych lub niezwiązanych.
5. Zastosuj listę wykluczeń: Wyklucz trójki wspominające encje, marki lub nazwy z listy wykluczeń <brands>

## Format wyjściowy
Dla każdego istotnego predykatu semantycznego, sformatuj wynik jako:
("podmiot", "orzeczenie", "dopełnienie", "opis")

- Podmiot: Rzeczownik lub fraza rzeczownikowa związana z <keyword>.
- Orzeczenie: Czasownik lub fraza czasownikowa opisująca relację.
- Dopełnienie: Rzeczownik lub fraza rzeczownikowa (opcjonalne jeśli orzeczenie jest nieprzechodnie), związane z <keyword>.
- Opis: Kontekst, z którego pochodzi trójka.

## Wymagania
1. Fokus na <keyword>: Uwzględniaj tylko predykaty, gdzie słowo kluczowe jest centralnym elementem relacji.
2. Język: Wyodrębniaj w języku <language>
3. Brak danych osobowych: Unikaj jakiegokolwiek odniesienia do konkretnych osób.
4. Brak wykluczonych encji: Uogólniaj podmioty (np. "różne podmioty" zamiast "Google"), aby wykluczyć marki z listy wykluczeń.
5. Jasność i precyzja: Upewnij się, że trójki są zwięzłe, dokładne i odzwierciedlają intencję treści.

## Prezentacja wyniku
Przedstaw końcowy wynik jako listę predykatów semantycznych, każdy w nowej linii.

## Przykład
Jeśli <keyword> to "sztuczna inteligencja" i treść zawiera:

"Sztuczna inteligencja rozwija się szybko, a Google opracowuje narzędzia AI."

Wynik:
("sztuczna inteligencja", "ma", "szybki rozwój", "Sztuczna inteligencja rozwija się szybko")
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `keyword` | string | Główne słowo kluczowe do analizy |
| `language` | string | Język wynikowy (np. "Polish") |
| `brands` | string | Lista wykluczonych marek/encji |
| `content` | string | Treść do analizy |

## Przykład użycia

```json
{
  "inputs": {
    "keyword": "fotowoltaika",
    "language": "Polish",
    "brands": "SunPower\nJA Solar\nTrina Solar",
    "content": "Panele fotowoltaiczne przekształcają energię słoneczną w elektryczność. Instalacja fotowoltaiczna wymaga odpowiedniego nasłonecznienia. SunPower oferuje wysokowydajne panele."
  }
}
```

## Oczekiwany wynik

```
("panele fotowoltaiczne", "przekształcają", "energię słoneczną w elektryczność", "Panele fotowoltaiczne przekształcają energię słoneczną w elektryczność")
("instalacja fotowoltaiczna", "wymaga", "odpowiedniego nasłonecznienia", "Instalacja fotowoltaiczna wymaga odpowiedniego nasłonecznienia")
```
