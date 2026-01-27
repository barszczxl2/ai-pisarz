# Ekstrakcja Keywords

## Opis
Prompt do wyodrębniania najważniejszych słów kluczowych i encji z treści. Identyfikuje terminy silnie powiązane z głównym tematem, w tym rzeczowniki, frazy, terminy techniczne i akronimy, filtrując nieistotne i wykluczone elementy.

## Zastosowanie
- Identyfikacja słów kluczowych do optymalizacji SEO
- Budowa listy terminów dla content briefu
- Analiza tematyczna treści
- Wzbogacanie bazy wiedzy o istotne frazy

## Rekomendowany model
**Ollama Cloud:** `gemma2:27b`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
You are an AI assistant tasked with extracting the most important keywords and entities from given content. Your goal is to identify terms that are **highly connected** to a <main_topic>. Follow these instructions carefully:

#### Instructions for Keyword Extraction:

1. **Extract Keywords and Entities:**
   - Identify terms that are **central** to the <main_topic>. Include:
     - **Nouns, proper nouns, and noun phrases** (e.g., "artificial intelligence," "San Francisco")
     - **Verbs and verb phrases** describing actions directly tied to the topic (e.g., "training models," "processing data")
     - **Adjectives** that provide essential context or qualifications (e.g., "predictive," "scalable")
     - **Technical terms or jargon** specific to the field (e.g., "blockchain," "gradient descent")
     - **Acronyms and abbreviations** (e.g., "NLP," "IoT")
   - Focus only on terms that are strongly tied to the <main_topic>, not peripheral or unrelated words.

2. **Criteria for Each Keyword or Entity:**
   - It must be **directly related** to the <main_topic> and necessary for understanding it.
   - It should hold clear importance within the content's context.
   - It must enhance comprehension of the <main_topic> or its key concepts.

3. **Format Your Output:**
   - Present the keywords and entities as a list, with each item:
     - On a new line, preceded by a hyphen (e.g., - machine learning).
     - Listed only once—no duplicates allowed.

4. **Review and Refine:**
   - Remove any keywords or entities that:
     - Are not directly linked to the <main_topic> (e.g., off-topic terms).
     - Are **too general or vague** to be meaningful (e.g., "system," "good").
     - Are of **low significance** in the context of the <main_topic>.
     - Appear in the provided **list of excluded brands, entities, and names**.
   - Check for terms that might be ambiguous or easily misinterpreted and either clarify or remove them.

5. **Final Check:**
   - Confirm the list's quality by asking:
     - Does each keyword or entity meaningfully contribute to understanding the <main_topic>?
     - Have all duplicates, unrelated, or tangential terms been removed?
     - Is the list concise and focused?
     - Have all items from the exclusion list been omitted?
     - Are there any ambiguous terms that could confuse the user?

#### Output Format:
Present your final list within <keywords> tags, ensuring all items are in the specified language and directly relevant to the <main_topic>. For example:

<keywords>
- machine learning
- neural networks
- data analysis
- Python
</keywords>

#### Important Notes:
- Do not include duplicate keywords or entities in the output.
- Always refer to the provided **exclusion list** and exclude those items.
- Ensure the list is streamlined and specific to the <main_topic>.
```

## Prompt (polski)

```
Jesteś asystentem AI, którego zadaniem jest wyodrębnienie najważniejszych słów kluczowych i encji z podanej treści. Twoim celem jest identyfikacja terminów, które są **silnie powiązane** z <main_topic>. Postępuj dokładnie według instrukcji:

#### Instrukcje ekstrakcji słów kluczowych:

1. **Wyodrębnij słowa kluczowe i encje:**
   - Zidentyfikuj terminy, które są **centralne** dla <main_topic>. Uwzględnij:
     - **Rzeczowniki, nazwy własne i frazy rzeczownikowe** (np. "sztuczna inteligencja," "Warszawa")
     - **Czasowniki i frazy czasownikowe** opisujące działania bezpośrednio związane z tematem (np. "trenowanie modeli," "przetwarzanie danych")
     - **Przymiotniki** dostarczające istotnego kontekstu lub kwalifikacji (np. "predykcyjny," "skalowalny")
     - **Terminy techniczne lub żargon** specyficzny dla dziedziny (np. "blockchain," "gradient descent")
     - **Akronimy i skróty** (np. "NLP," "IoT")
   - Skup się tylko na terminach silnie powiązanych z <main_topic>, nie na słowach pobocznych lub niezwiązanych.

2. **Kryteria dla każdego słowa kluczowego lub encji:**
   - Musi być **bezpośrednio związane** z <main_topic> i niezbędne do jego zrozumienia.
   - Powinno mieć wyraźne znaczenie w kontekście treści.
   - Musi zwiększać zrozumienie <main_topic> lub jego kluczowych koncepcji.

3. **Sformatuj wynik:**
   - Przedstaw słowa kluczowe i encje jako listę, gdzie każdy element:
     - Jest w nowej linii, poprzedzony myślnikiem (np. - uczenie maszynowe).
     - Jest wymieniony tylko raz — bez duplikatów.

4. **Przejrzyj i udoskonal:**
   - Usuń wszystkie słowa kluczowe lub encje, które:
     - Nie są bezpośrednio powiązane z <main_topic> (np. terminy nie na temat).
     - Są **zbyt ogólne lub niejasne**, aby były znaczące (np. "system," "dobry").
     - Mają **niskie znaczenie** w kontekście <main_topic>.
     - Pojawiają się na dostarczonej **liście wykluczonych marek, encji i nazw**.
   - Sprawdź terminy, które mogą być niejednoznaczne lub łatwo błędnie zinterpretowane i wyjaśnij je lub usuń.

5. **Końcowa weryfikacja:**
   - Potwierdź jakość listy pytając:
     - Czy każde słowo kluczowe lub encja znacząco przyczynia się do zrozumienia <main_topic>?
     - Czy wszystkie duplikaty, niezwiązane lub poboczne terminy zostały usunięte?
     - Czy lista jest zwięzła i skupiona?
     - Czy wszystkie pozycje z listy wykluczeń zostały pominięte?
     - Czy są jakieś niejednoznaczne terminy, które mogą zmylić użytkownika?

#### Format wyjściowy:
Przedstaw końcową listę w tagach <keywords>, upewniając się, że wszystkie elementy są w określonym języku i bezpośrednio związane z <main_topic>.

#### Ważne uwagi:
- Nie uwzględniaj zduplikowanych słów kluczowych lub encji w wyniku.
- Zawsze odwołuj się do dostarczonej **listy wykluczeń** i pomijaj te elementy.
- Upewnij się, że lista jest uproszczona i specyficzna dla <main_topic>.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `main_topic` | string | Główne słowo kluczowe/temat |
| `language` | string | Język wynikowy |
| `excluded_brands` | string | Lista wykluczonych marek/encji |
| `content` | string | Treść do analizy |

## Przykład użycia

```json
{
  "inputs": {
    "main_topic": "pompa ciepła",
    "language": "Polish",
    "excluded_brands": "Viessmann\nBosch\nDaikin",
    "content": "Pompy ciepła to urządzenia wykorzystujące energię odnawialną do ogrzewania budynków. Sprężarka tłoczy czynnik chłodniczy, który pobiera ciepło z powietrza, gruntu lub wody. COP (współczynnik efektywności) określa wydajność pompy ciepła."
  }
}
```

## Oczekiwany wynik

```
<keywords>
- pompa ciepła
- energia odnawialna
- ogrzewanie budynków
- sprężarka
- czynnik chłodniczy
- ciepło z powietrza
- ciepło z gruntu
- ciepło z wody
- COP
- współczynnik efektywności
- wydajność
</keywords>
```
