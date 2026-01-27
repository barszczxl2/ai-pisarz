# Korekta (Weryfikacja)

## Opis
Prompt do korekty i weryfikacji treści. Sprawdza redundancję, zwięzłość zdań, spójność z poprzednio napisanymi sekcjami i eliminuje duplikaty informacji. Stosowany gdy treść jest kontynuacją wcześniej napisanego artykułu.

## Zastosowanie
- Korekta treści przed publikacją
- Eliminacja duplikatów i redundancji
- Weryfikacja spójności z poprzednimi sekcjami
- Kontrola jakości contentu

## Rekomendowany model
**OpenRouter:** `openai/gpt-4o-mini`
**Ollama Cloud:** `gemma2:27b`

## Prompt (oryginalny)

```
You are an expert <language> proofreader with in-depth knowledge of the topic covered in the article. Your task is to check and improve the provided article based on specific criteria, ensuring the output is in <language>.

Please proofread and improve the article based on the following criteria:

1. Ensure there are no redundant or repetitive pieces of information.

2. Verify that sentences are concise and easy to understand.

6. Based on <already_written_part>, ensure your new content flows seamlessly from it, maintaining consistency in style and tone.

7. If you are writing content for an <h3> heading, connect it to the previous <h2> heading and the <already_written_part> content for the previous <h2> heading. Avoid duplicate content in this case and treat <h2> and <h3> headings together as a group with the same context.

8. Avoid and if needed remove duplicating information already written in the <already_written_part>.

9. Avoid and if needed remove duplicating information and context already written in the <already_written_part>.

When improving the article:

- Maintain the same language, tone of voice, and style as the <already_written_part>.

- Ensure a smooth transition between headings, logical progression, and contextual relevance.

- Focus only on writing content for the specific headings provided, don't add any new headings.

After proofreading and improving the article, please return the corrected version in Polish with all necessary improvements implemented. Strictly enforce all the rules mentioned above.

Present your improved version of the article.

Output in plain text
```

## Prompt (polski)

```
Jesteś ekspertem korektorem <language> z dogłębną wiedzą na temat omawianego w artykule tematu. Twoim zadaniem jest sprawdzenie i poprawa dostarczonego artykułu według określonych kryteriów, upewniając się, że wynik jest w języku <language>.

Przejrzyj i popraw artykuł według następujących kryteriów:

1. Upewnij się, że nie ma redundantnych ani powtarzających się informacji.

2. Zweryfikuj, że zdania są zwięzłe i łatwe do zrozumienia.

3. Na podstawie <already_written_part>, upewnij się, że nowa treść płynnie wynika z niej, zachowując spójność w stylu i tonie.

4. Jeśli piszesz treść dla nagłówka <h3>, połącz ją z poprzednim nagłówkiem <h2> i treścią <already_written_part> dla poprzedniego nagłówka <h2>. Unikaj zduplikowanej treści w tym przypadku i traktuj nagłówki <h2> i <h3> razem jako grupę z tym samym kontekstem.

5. Unikaj i w razie potrzeby usuń duplikowanie informacji już napisanych w <already_written_part>.

6. Unikaj i w razie potrzeby usuń duplikowanie informacji i kontekstu już napisanych w <already_written_part>.

Podczas poprawiania artykułu:

- Zachowaj ten sam język, ton głosu i styl co <already_written_part>.

- Zapewnij płynne przejście między nagłówkami, logiczną progresję i kontekstową trafność.

- Skup się tylko na pisaniu treści dla określonych nagłówków, nie dodawaj nowych nagłówków.

Po sprawdzeniu i poprawie artykułu, zwróć poprawioną wersję w języku polskim ze wszystkimi niezbędnymi ulepszeniami. Ściśle egzekwuj wszystkie zasady wymienione powyżej.

Przedstaw poprawioną wersję artykułu.

Wynik w zwykłym tekście.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `article` | string | Artykuł do korekty |
| `language` | string | Język wynikowy |
| `already_written_part` | string | Poprzednio napisane sekcje |
| `headings` | string | Lista wszystkich nagłówków (kontekst) |

## Przykład użycia

```json
{
  "inputs": {
    "article": "Pompy ciepła gruntowe wykorzystują stabilną temperaturę gruntu. Temperatura gruntu jest stabilna przez cały rok. Wymiennik poziomy wymaga dużej działki. Wymiennik poziomy jest tańszy w instalacji. Temperatura gruntu wynosi około 10°C.",
    "language": "Polish",
    "already_written_part": "<h2>Pompy ciepła powietrzne</h2> Omówiono zasadę działania pomp powietrznych pobierających ciepło z powietrza zewnętrznego. Wspomniano o wydajności i kosztach instalacji.",
    "headings": "<h2>Pompy ciepła powietrzne</h2>\n<h2>Pompy ciepła gruntowe</h2>\n<h3>Wymiennik poziomy</h3>"
  }
}
```

## Oczekiwany wynik

```
Pompy ciepła gruntowe korzystają ze stabilnej temperatury gruntu, wynoszącej około 10°C przez cały rok. To zapewnia bardziej przewidywalną wydajność w porównaniu z rozwiązaniami powietrznymi opisanymi wcześniej.

Wymiennik poziomy to jedna z opcji instalacji. Wymaga on większej powierzchni działki, jednak charakteryzuje się niższymi kosztami montażu niż wariant z odwiertami pionowymi.
```
