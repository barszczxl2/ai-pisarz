# Graf Informacji

## Opis
Prompt do budowy grafu informacji z listy predykatów semantycznych. Tworzy strukturę JSON zawierającą encje, relacje, atrybuty i opisy, która może być wykorzystana do dalszego przetwarzania wiedzy i generowania contentu.

## Zastosowanie
- Przekształcenie predykatów semantycznych w strukturę grafową
- Organizacja wiedzy w formie JSON
- Przygotowanie danych do generowania treści
- Wizualizacja relacji między koncepcjami

## Rekomendowany model
**Ollama Cloud:** `mistral-large`
**OpenRouter:** `anthropic/claude-3.5-sonnet`

## Prompt (oryginalny)

```
You are tasked with building a information graph from a given list of semantic predicates.

The information graph must focus exclusively on the main topic defined by the <keyword> and be presented in a structured JSON format. Follow the instructions carefully to ensure the graph is accurate, relevant, and adheres to all specified constraints.

## Instructions
To build the information graph, follow these steps:
1. Analyze Predicates: Review each semantic predicate in the provided list to identify entities, relationships, and attributes.
2. Relevance Filter: Include only those predicates that are directly related to the <keyword>. Discard any predicates that do not pertain to the main topic.
3. Exclude Personal Information: Remove any predicates containing personal details, such as names or surnames of individuals.
4. Apply Exclusion List: Exclude any predicates that mention entities, brands, or names listed in the exclusion list <brands>
5. Structure the Graph: For each relevant predicate, extract the entity, relationship, attribute, and description, and format them according to the specified JSON structure.

## Output Format
Organize the information graph in the following JSON format:
 "graf informacji": [
    {
        "entity": "...",
        "relationship": "...",
        "attribute": "...",
        "description": "..."
    },
    {
        "entity": "...",
        "relationship": "...",
        "attribute": "...",
        "description": "..."
    }
]

1. Entity: The primary subject or object related to the <keyword>.
2. Relationship: The connection or interaction between entities.
3. Attribute: A characteristic or property of the entity.
4. Description: A brief explanation or context for the predicate.

## Requirements
1. Topic Focus: Ensure all elements in the information graph are directly relevant to the <keyword>.
2. No Personal Data: Avoid including any personal information, such as names or surnames.
3. No Excluded Entities: Generalize or omit any mentions of brands or entities in the exclusion list.
4. Clarity and Precision: Each entry should be concise, accurate, and reflect the intent of the original predicate.
5. Language: Present the information graph in <language>

## Output Presentation
Provide the final information graph as a JSON array in plain text, without any additional explanation or commentary.
```

## Prompt (polski)

```
Twoim zadaniem jest zbudowanie grafu informacji z podanej listy predykatów semantycznych.

Graf informacji musi skupiać się wyłącznie na głównym temacie zdefiniowanym przez <keyword> i być przedstawiony w strukturze JSON. Postępuj zgodnie z instrukcjami, aby upewnić się, że graf jest dokładny, trafny i zgodny ze wszystkimi określonymi ograniczeniami.

## Instrukcje
Aby zbudować graf informacji, wykonaj następujące kroki:
1. Analizuj predykaty: Przejrzyj każdy predykat semantyczny na podanej liście, aby zidentyfikować encje, relacje i atrybuty.
2. Filtr trafności: Uwzględnij tylko te predykaty, które są bezpośrednio związane z <keyword>. Odrzuć wszystkie predykaty niezwiązane z głównym tematem.
3. Wyklucz dane osobowe: Usuń wszystkie predykaty zawierające dane osobowe, takie jak imiona lub nazwiska osób.
4. Zastosuj listę wykluczeń: Wyklucz wszystkie predykaty, które wspominają encje, marki lub nazwy z listy wykluczeń <brands>
5. Ustrukturyzuj graf: Dla każdego istotnego predykatu wyodrębnij encję, relację, atrybut i opis, i sformatuj je zgodnie z określoną strukturą JSON.

## Format wyjściowy
Uporządkuj graf informacji w następującym formacie JSON:
"graf informacji": [
    {
        "entity": "...",
        "relationship": "...",
        "attribute": "...",
        "description": "..."
    },
    {
        "entity": "...",
        "relationship": "...",
        "attribute": "...",
        "description": "..."
    }
]

1. Entity (Encja): Główny podmiot lub obiekt związany z <keyword>.
2. Relationship (Relacja): Połączenie lub interakcja między encjami.
3. Attribute (Atrybut): Cecha lub właściwość encji.
4. Description (Opis): Krótkie wyjaśnienie lub kontekst dla predykatu.

## Wymagania
1. Fokus na temat: Upewnij się, że wszystkie elementy w grafie informacji są bezpośrednio związane z <keyword>.
2. Brak danych osobowych: Unikaj uwzględniania jakichkolwiek danych osobowych, takich jak imiona lub nazwiska.
3. Brak wykluczonych encji: Uogólnij lub pomiń wszelkie wzmianki o markach lub encjach z listy wykluczeń.
4. Jasność i precyzja: Każdy wpis powinien być zwięzły, dokładny i odzwierciedlać intencję oryginalnego predykatu.
5. Język: Przedstaw graf informacji w języku <language>

## Prezentacja wyniku
Dostarcz końcowy graf informacji jako tablicę JSON w zwykłym tekście, bez dodatkowych wyjaśnień lub komentarzy.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `semantic_predicates` | string | Lista predykatów semantycznych |
| `keyword` | string | Główne słowo kluczowe |
| `language` | string | Język wynikowy |
| `brands` | string | Lista wykluczonych marek |

## Przykład użycia

```json
{
  "inputs": {
    "keyword": "fotowoltaika",
    "language": "Polish",
    "brands": "SunPower\nJA Solar",
    "semantic_predicates": "(\"panele fotowoltaiczne\", \"przekształcają\", \"energię słoneczną\", \"Panele przekształcają światło w prąd\")\n(\"instalacja\", \"wymaga\", \"nasłonecznienia\", \"Instalacja potrzebuje odpowiedniego nasłonecznienia\")"
  }
}
```

## Oczekiwany wynik

```json
{
  "graf informacji": [
    {
      "entity": "panele fotowoltaiczne",
      "relationship": "przekształcają",
      "attribute": "energia słoneczna",
      "description": "Panele fotowoltaiczne przekształcają światło słoneczne w energię elektryczną"
    },
    {
      "entity": "instalacja fotowoltaiczna",
      "relationship": "wymaga",
      "attribute": "nasłonecznienie",
      "description": "Prawidłowe działanie instalacji wymaga odpowiedniego poziomu nasłonecznienia"
    }
  ]
}
```
