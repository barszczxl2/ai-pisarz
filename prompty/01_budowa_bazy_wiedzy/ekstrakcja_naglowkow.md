# Ekstrakcja Nagłówków

## Opis
Prompt do wyodrębniania struktury nagłówków H2 i H3 z treści markdown stron konkurencji. Identyfikuje hierarchię nagłówków i zachowuje ich kolejność, dostarczając strukturę do analizy contentu konkurencji.

## Zastosowanie
- Analiza struktury contentu konkurencji
- Identyfikacja popularnych tematów w SERP
- Budowa wzorców nagłówków dla danego tematu
- Research struktury artykułów

## Rekomendowany model
**Ollama Cloud:** `llama3.1:8b`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
You are tasked with extracting h2 and h3 headings from the given markdown website content. Here's the content you'll be working with:

Your goal is to identify and extract all h2 and h3 headings from this markdown content. Here's how to recognize these headings:

- h2 headings start with two hash symbols (##) followed by a space and then the heading text
- h3 headings start with three hash symbols (###) followed by a space and then the heading text

When you find these headings, you should extract them and format your output as follows:

- For h2 headings, use the format: <h2>Heading text</h2>
- For h3 headings, use the format: <h3>Heading text</h3>

Here's an example of how your output should look:

<example>
<h2>Introduction</h2>
<h3>Background</h3>
<h3>Objectives</h3>
<h2>Methodology</h2>
<h3>Data Collection</h3>
<h3>Analysis</h3>
</example>

Process the entire markdown content and extract all h2 and h3 headings you find. Maintain the order in which they appear in the original content.

Provide your final output enclosed in <extracted_headings> tags. Do not include any explanations or additional text outside of these tags.
```

## Prompt (polski)

```
Twoim zadaniem jest wyodrębnienie nagłówków h2 i h3 z podanej treści markdown strony internetowej. Oto treść, z którą będziesz pracować:

Twoim celem jest zidentyfikowanie i wyodrębnienie wszystkich nagłówków h2 i h3 z tej treści markdown. Oto jak rozpoznać te nagłówki:

- nagłówki h2 zaczynają się od dwóch symboli hash (##) po których następuje spacja i tekst nagłówka
- nagłówki h3 zaczynają się od trzech symboli hash (###) po których następuje spacja i tekst nagłówka

Gdy znajdziesz te nagłówki, powinieneś je wyodrębnić i sformatować wynik w następujący sposób:

- Dla nagłówków h2 użyj formatu: <h2>Tekst nagłówka</h2>
- Dla nagłówków h3 użyj formatu: <h3>Tekst nagłówka</h3>

Oto przykład jak powinien wyglądać twój wynik:

<example>
<h2>Wprowadzenie</h2>
<h3>Tło</h3>
<h3>Cele</h3>
<h2>Metodologia</h2>
<h3>Zbieranie danych</h3>
<h3>Analiza</h3>
</example>

Przetwórz całą treść markdown i wyodrębnij wszystkie nagłówki h2 i h3, które znajdziesz. Zachowaj kolejność, w jakiej pojawiają się w oryginalnej treści.

Dostarcz końcowy wynik zamknięty w tagach <extracted_headings>. Nie dołączaj żadnych wyjaśnień ani dodatkowego tekstu poza tymi tagami.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `markdown_content` | string | Treść markdown do analizy |

## Przykład użycia

```json
{
  "inputs": {
    "markdown_content": "# Główny tytuł\n\nWstęp do artykułu.\n\n## Czym jest fotowoltaika?\n\nFotowoltaika to technologia...\n\n### Zasada działania\n\nPanele słoneczne działają poprzez...\n\n### Rodzaje paneli\n\nWyróżniamy panele monokrystaliczne...\n\n## Korzyści z instalacji\n\nGłówne zalety to...\n\n### Oszczędności\n\nMożna zaoszczędzić do..."
  }
}
```

## Oczekiwany wynik

```
<extracted_headings>
<h2>Czym jest fotowoltaika?</h2>
<h3>Zasada działania</h3>
<h3>Rodzaje paneli</h3>
<h2>Korzyści z instalacji</h2>
<h3>Oszczędności</h3>
</extracted_headings>
```
