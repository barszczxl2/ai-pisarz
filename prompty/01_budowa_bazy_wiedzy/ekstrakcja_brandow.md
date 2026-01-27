# Ekstrakcja Brandów

## Opis
Prompt do wyciągania nazw marek i domen z wyników wyszukiwania SERP. Identyfikuje firmy, produkty i adresy stron internetowych, które powinny zostać wykluczone z dalszego przetwarzania, aby uniknąć promowania konkretnych brandów w generowanej treści.

## Zastosowanie
- Identyfikacja konkurencyjnych marek w wynikach SERP
- Tworzenie listy wykluczeń dla generowania neutralnego contentu
- Filtrowanie domen przed analizą treści
- Budowa bazy wiedzy bez odniesień do konkretnych firm

## Rekomendowany model
**Ollama Cloud:** `llama3.1:8b`
**OpenRouter:** `openai/gpt-4o-mini`

## Prompt (oryginalny)

```
You will be given a list of text entries. Your task is to extract brand names and domain names from this list.

Extract all brand names and domain names from the given list. A brand name is typically a company or product name, while a domain name is a web address (e.g., example.com).

Provide your output in the following format:

<brands>
[List of extracted brand names, one per line]
</brands>

<domains>
[List of extracted domain names, one per line]
</domains>

If you're unsure whether an entry is a brand or domain, include it in the category that seems most appropriate. If an entry could be both a brand and a domain, include it in both lists.

Make sure to include all identified brands and domains, even if there are multiple occurrences of the same name.

Please provide your output now.
```

## Prompt (polski)

```
Otrzymasz listę wpisów tekstowych. Twoim zadaniem jest wyodrębnienie nazw marek i nazw domen z tej listy.

Wyodrębnij wszystkie nazwy marek i nazwy domen z podanej listy. Nazwa marki to zazwyczaj nazwa firmy lub produktu, podczas gdy nazwa domeny to adres internetowy (np. przyklad.pl).

Podaj wynik w następującym formacie:

<brands>
[Lista wyodrębnionych nazw marek, po jednej na linię]
</brands>

<domains>
[Lista wyodrębnionych nazw domen, po jednej na linię]
</domains>

Jeśli nie jesteś pewien, czy wpis to marka czy domena, umieść go w kategorii, która wydaje się najbardziej odpowiednia. Jeśli wpis może być zarówno marką, jak i domeną, umieść go w obu listach.

Upewnij się, że uwzględniasz wszystkie zidentyfikowane marki i domeny, nawet jeśli występują wielokrotnie.

Podaj teraz swój wynik.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `list` | string | Lista tekstowych wpisów do analizy (zwykle wyniki SERP) |

## Przykład użycia

```json
{
  "inputs": {
    "list": "1. Best running shoes - Nike Official Store\n2. Adidas Ultraboost Review - sneakerhead.com\n3. New Balance 990 Guide - runningwarehouse.com\n4. Asics Gel-Kayano - asics.com/running"
  }
}
```

## Oczekiwany wynik

```
<brands>
Nike
Adidas
New Balance
Asics
Ultraboost
Gel-Kayano
</brands>

<domains>
sneakerhead.com
runningwarehouse.com
asics.com
</domains>
```
