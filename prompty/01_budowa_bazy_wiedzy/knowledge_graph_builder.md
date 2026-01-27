# Knowledge Graph Builder

## Opis
Zaawansowany prompt do budowy rozbudowanego grafu wiedzy z encjami i relacjami. Identyfikuje kluczowe encje, definiuje ich typy, określa siłę powiązania z głównym tematem oraz tworzy sieć relacji między encjami. Uwzględnia intencję użytkownika wyszukującego dane słowo kluczowe.

## Zastosowanie
- Budowa kompleksowej bazy wiedzy
- Mapowanie relacji między koncepcjami
- Przygotowanie danych do generowania treści eksperckiej
- Analiza semantyczna tematu

## Rekomendowany model
**OpenRouter:** `anthropic/claude-3.5-sonnet` (zalecany ze względu na złożoność)
**OpenRouter:** `openai/o1-mini` (alternatywa dla rozumowania)

## Prompt (oryginalny)

```
# Goal

Identify and extract key entities and their relationships from the provided text, focusing on specific and unique information related to the central keyword while considering the source of each piece of information and the likely intent of users searching for the central keyword "<keyword>".

## Input Structure

The input consists of two parts:
1. The central keyword, provided in the format: "Central Keyword: <keyword>"
2. A TXT file containing content from multiple web pages

The central keyword is the main focus of the entity extraction task. All identified entities and relationships should be relevant to this central keyword and align with the likely intent of users searching for this keyword.

The TXT file is structured as follows:
-----TEXT-----
[content1]
-----TEXT-----
[content2]
...

## Entity Definition and Guidelines

An entity is a specific, well-defined element providing meaningful and unique information related to the central keyword. Entities should be more specific than broad categories but not excessively detailed.

### Guidelines for identifying entities:

1. **User Intent**: Consider the likely intent of users searching for the central keyword.
2. **Specificity**: Entities should be specific but not overly detailed.
3. **Relevance**: Each entity must directly relate to the central keyword.
4. **Informativeness**: Entities should offer valuable insights about the topic.
5. **Distinctiveness**: Include entities that are distinct from each other.
6. **Language**: Keep entity names in their original language, but translate entity types to <language_name>.
7. **Named Entities**: Include company names, brands, or products if they are strongly related to the central keyword.
8. **People**: Include names of people only if they are inventors of a concept or strongly associated with the central keyword.
9. **Uniqueness**: Each entity should appear only once.
10. **Multi-aspect**: If an entity describes multiple elements, assign it 2-3 types.
11. **Source consideration**: Pay attention to the URL of each text segment.
12. **Brand-specific entities**: Do not generate entities that are specific to a single brand unless ALL conditions are met.

## Steps

1. Analyze the central keyword and determine the likely intent of users searching for this keyword.
2. Read through all text segments, keeping track of which entities appear in which sources.
3. Identify all relevant entities within the text segments.
4. Create a temporary list of all identified entities.
5. Process the temporary list to remove duplicates and merge similar entities.
6. After processing, create a comprehensive list of at least 20-30 unique entities.
7. Review the list of provided entities and create a list of relationships.
8. Calculate the score for each relationship based on cosine similarity.
9. Review and apply exclusion checks.
10. Process the temporary list of relationships to remove duplicates.
11. Create the final list of unique relationships.
12. Generalize entities that follow the same pattern.
13. Translate relationship descriptions and entity types to <language_name>.
14. Include only entities and relationships with a relationship_strength of 60 or above.
15. Perform a final check for any remaining duplicates.
16. Output the results as a single list of entities followed by relationships.

## Output Format

The output should consist of:
1. A list of entities in the format:
Graf wiedzy:
   ("ent" | <entity_name> | <entity_type_1>, <entity_type_2>, <entity_type_3 (optional)> | <entity_description> | <entity_strength>)

2. Followed by a list of relationships in the format:
   ("rel" | <source_entity> | <target_entity> | <relationship_description> | <relationship_strength>)

3. The {{completed}} marker on a new line after all entities and relationships have been listed.
```

## Prompt (polski)

```
# Cel

Zidentyfikuj i wyodrębnij kluczowe encje oraz ich relacje z dostarczonego tekstu, koncentrując się na specyficznych i unikalnych informacjach związanych z centralnym słowem kluczowym, uwzględniając źródło każdej informacji oraz prawdopodobną intencję użytkowników szukających centralnego słowa kluczowego "<keyword>".

## Struktura wejściowa

Wejście składa się z dwóch części:
1. Centralne słowo kluczowe w formacie: "Centralne słowo kluczowe: <keyword>"
2. Plik TXT zawierający treść z wielu stron internetowych

## Definicja encji i wytyczne

Encja to specyficzny, dobrze zdefiniowany element dostarczający znaczących i unikalnych informacji związanych z centralnym słowem kluczowym. Encje powinny być bardziej szczegółowe niż szerokie kategorie, ale nie nadmiernie szczegółowe.

### Wytyczne identyfikacji encji:

1. **Intencja użytkownika**: Rozważ prawdopodobną intencję użytkowników szukających centralnego słowa kluczowego.
2. **Specyficzność**: Encje powinny być specyficzne, ale nie nadmiernie szczegółowe.
3. **Trafność**: Każda encja musi bezpośrednio odnosić się do centralnego słowa kluczowego.
4. **Informatywność**: Encje powinny oferować wartościowe informacje o temacie.
5. **Odrębność**: Uwzględnij encje, które są od siebie odrębne.
6. **Język**: Zachowaj nazwy encji w oryginalnym języku, ale przetłumacz typy encji na <language_name>.
7. **Encje nazwane**: Uwzględnij nazwy firm, marek lub produktów jeśli są silnie związane z centralnym słowem kluczowym.
8. **Ludzie**: Uwzględnij imiona osób tylko jeśli są wynalazcami koncepcji lub silnie związani z centralnym słowem kluczowym.
9. **Unikalność**: Każda encja powinna pojawić się tylko raz.
10. **Wieloaspektowość**: Jeśli encja opisuje wiele elementów, przypisz jej 2-3 typy.

## Format wyjściowy

Wynik powinien składać się z:
1. Listy encji w formacie:
Graf wiedzy:
   ("ent" | <nazwa_encji> | <typ_encji_1>, <typ_encji_2>, <typ_encji_3 (opcjonalnie)> | <opis_encji> | <siła_encji>)

2. Listy relacji w formacie:
   ("rel" | <encja_źródłowa> | <encja_docelowa> | <opis_relacji> | <siła_relacji>)

3. Znacznik {{completed}} w nowej linii po wylistowaniu wszystkich encji i relacji.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `keyword` | string | Centralne słowo kluczowe |
| `language_name` | string | Język wynikowy |
| `aio` | string | Treść AI Overview |
| `content` | string | Treść z wielu stron (format TXT) |

## Przykład użycia

```json
{
  "inputs": {
    "keyword": "fotowoltaika",
    "language_name": "Polish",
    "content": "-----TEXT-----\nPanele fotowoltaiczne przekształcają energię słoneczną...\n-----TEXT-----\nKoszty instalacji fotowoltaicznej wynoszą..."
  }
}
```

## Oczekiwany wynik (fragment)

```
Graf wiedzy:
("ent" | "fotowoltaika" | "technologia", "energia odnawialna" | "Technologia przekształcania energii słonecznej w elektryczność za pomocą paneli słonecznych" | 100)
("ent" | "panele monokrystaliczne" | "rodzaj paneli", "komponent" | "Panele o najwyższej wydajności, wykonane z jednego kryształu krzemu" | 85)
("ent" | "inwerter" | "urządzenie", "komponent systemu" | "Przetwarza prąd stały DC na prąd zmienny AC do użytku domowego" | 80)

("rel" | "fotowoltaika" | "panele monokrystaliczne" | "Wykorzystuje panele monokrystaliczne jako główny element systemu" | 90)
("rel" | "panele monokrystaliczne" | "inwerter" | "Wymagają inwertera do konwersji wyprodukowanego prądu" | 85)

{{completed}}
```
