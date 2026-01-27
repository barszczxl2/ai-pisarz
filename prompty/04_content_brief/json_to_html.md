# JSON to HTML

## Opis
Prompt do konwersji briefu contentowego w formacie JSON na czytelny raport HTML. Tworzy prostą, dobrze sformatowaną strukturę HTML do prezentacji briefu dla copywriterów.

## Zastosowanie
- Konwersja briefów JSON na czytelny format
- Generowanie raportów HTML
- Prezentacja briefów dla zespołu
- Eksport danych do dokumentacji

## Rekomendowany model
**OpenRouter:** `openai/o4-mini`
**Ollama Cloud:** `llama3.1:8b`

## Prompt (oryginalny)

```
You will be converting a given JSON object into a simple HTML report. Your task is to create an easy-to-read HTML document using only basic HTML syntax.

Follow these steps to create the HTML report:

1. Start with the basic HTML structure:
   - Include <html>, and <body> tags

2. Iterate through the JSON object:
   - For each key-value pair in the JSON, create a new section
   - Use <h2> tags for the keys (property names) - uppercase first letter
   - Handle the values based on their data type:
     a. For strings, numbers, and booleans: Display them in a <p> tag
     b. For arrays: Create an unordered list <ul> with each item in a <li> tag - uppercase first letter

3. Use proper indentation to make the HTML structure clear:
   - Indent nested elements with 2 spaces
   - Keep opening and closing tags aligned

4. Keep the HTML simple and avoid using any CSS or advanced HTML features

Here's a basic example of how your output should be structured:

<html>
<body>
<h1>Content brief</h1>
<h4><keyword></h4>
  <h2>Property1</h2>
  <p>Value1</p>
  <h2>Property2</h2>
  <ul>
    <li>Item1</li>
    <li>Item2</li>
  </ul>
</body>
</html>

Please provide your complete HTML output.

Translate everything to Polish
```

## Prompt (polski)

```
Będziesz konwertować podany obiekt JSON na prosty raport HTML. Twoim zadaniem jest stworzenie łatwego do czytania dokumentu HTML używając tylko podstawowej składni HTML.

Wykonaj następujące kroki, aby stworzyć raport HTML:

1. Rozpocznij od podstawowej struktury HTML:
   - Uwzględnij tagi <html> i <body>

2. Iteruj przez obiekt JSON:
   - Dla każdej pary klucz-wartość w JSON stwórz nową sekcję
   - Użyj tagów <h2> dla kluczy (nazw właściwości) - pierwsza litera wielka
   - Obsłuż wartości w zależności od typu danych:
     a. Dla stringów, liczb i boolean: Wyświetl je w tagu <p>
     b. Dla tablic: Stwórz listę nieuporządkowaną <ul> z każdym elementem w tagu <li> - pierwsza litera wielka

3. Użyj właściwego wcięcia, aby struktura HTML była czytelna:
   - Wcinaj zagnieżdżone elementy o 2 spacje
   - Zachowaj wyrównanie tagów otwierających i zamykających

4. Zachowaj prostotę HTML i unikaj używania CSS lub zaawansowanych funkcji HTML

Oto podstawowy przykład jak powinien wyglądać twój wynik:

<html>
<body>
<h1>Brief contentowy</h1>
<h4><keyword></h4>
  <h2>Właściwość1</h2>
  <p>Wartość1</p>
  <h2>Właściwość2</h2>
  <ul>
    <li>Element1</li>
    <li>Element2</li>
  </ul>
</body>
</html>

Dostarcz kompletny wynik HTML.

Przetłumacz wszystko na polski.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `json_data` | string | Brief w formacie JSON |
| `keyword` | string | Główne słowo kluczowe (do tytułu) |

## Przykład użycia

```json
{
  "inputs": {
    "json_data": "[{\"heading\": \"<h2>Czym jest fotowoltaika?</h2>\", \"knowledge\": \"Technologia przekształcania energii słonecznej w elektryczność.\", \"keywords\": \"fotowoltaika, panele słoneczne\"}]",
    "keyword": "fotowoltaika"
  }
}
```

## Oczekiwany wynik

```html
<html>
<body>
<h1>Brief contentowy</h1>
<h4>fotowoltaika</h4>

<h2>Czym jest fotowoltaika?</h2>

<h3>Wiedza</h3>
<p>Technologia przekształcania energii słonecznej w elektryczność.</p>

<h3>Słowa kluczowe</h3>
<ul>
  <li>Fotowoltaika</li>
  <li>Panele słoneczne</li>
</ul>

</body>
</html>
```
