# Generowanie Nagłówków

## Opis
Prompt do generowania unikalnych nagłówków na podstawie listy wyodrębnionych nagłówków z konkurencji. Tworzy zoptymalizowaną strukturę nagłówków H2/H3 w formacie JSON, usuwając duplikaty i zachowując fokus na głównym temacie.

## Zastosowanie
- Tworzenie unikalnej struktury nagłówków dla artykułu
- Konsolidacja nagłówków z wielu źródeł
- Generowanie outline'u contentu
- Przygotowanie briefu dla copywritera

## Rekomendowany model
**Ollama Cloud:** `gemma2:27b`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
Your task is to generate unique headings from a given list of headings. These headings should reflect the main topic <main_topic> and be in the specified language <language>. Follow these instructions carefully:

1. You will be provided with a list of headings in <headings_list>

2. Review the list and select unique headings that best represent the main topic <main_topic>. Avoid duplicates or very similar headings.

3. Ensure that the selected headings are relevant to the main topic and can be easily understood in the context of <main_topic>.

4. Organize headings in the following json format:
[
{
        "heading": "h2",
        "value": "..."
},
{
        "heading": "h2",
        "value": "..."
},
{
        "heading": "h3",
        "value": "..."
}
]

Do not include any explanations or additional text
```

## Prompt (polski)

```
Twoim zadaniem jest wygenerowanie unikalnych nagłówków z podanej listy nagłówków. Te nagłówki powinny odzwierciedlać główny temat <main_topic> i być w określonym języku <language>. Postępuj dokładnie według instrukcji:

1. Otrzymasz listę nagłówków w <headings_list>

2. Przejrzyj listę i wybierz unikalne nagłówki, które najlepiej reprezentują główny temat <main_topic>. Unikaj duplikatów lub bardzo podobnych nagłówków.

3. Upewnij się, że wybrane nagłówki są istotne dla głównego tematu i mogą być łatwo zrozumiane w kontekście <main_topic>.

4. Uporządkuj nagłówki w następującym formacie JSON:
[
{
        "heading": "h2",
        "value": "..."
},
{
        "heading": "h2",
        "value": "..."
},
{
        "heading": "h3",
        "value": "..."
}
]

Nie dołączaj żadnych wyjaśnień ani dodatkowego tekstu
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `main_topic` | string | Główny temat/słowo kluczowe |
| `language` | string | Język wynikowy |
| `headings_list` | string | Lista nagłówków do przetworzenia |

## Przykład użycia

```json
{
  "inputs": {
    "main_topic": "pompa ciepła",
    "language": "Polish",
    "headings_list": "<h2>Czym jest pompa ciepła?</h2>\n<h3>Zasada działania</h3>\n<h2>Co to pompa ciepła</h2>\n<h2>Rodzaje pomp ciepła</h2>\n<h3>Pompy powietrzne</h3>\n<h3>Pompy gruntowe</h3>\n<h2>Typy pomp ciepła</h2>\n<h2>Koszty instalacji</h2>"
  }
}
```

## Oczekiwany wynik

```json
[
  {
    "heading": "h2",
    "value": "Czym jest pompa ciepła?"
  },
  {
    "heading": "h3",
    "value": "Zasada działania"
  },
  {
    "heading": "h2",
    "value": "Rodzaje pomp ciepła"
  },
  {
    "heading": "h3",
    "value": "Pompy powietrzne"
  },
  {
    "heading": "h3",
    "value": "Pompy gruntowe"
  },
  {
    "heading": "h2",
    "value": "Koszty instalacji"
  }
]
```
