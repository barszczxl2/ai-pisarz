# Humanizacja

## Opis
Prompt do nadania tekstowi naturalnego, ludzkiego tonu. Eliminuje powtórzenia, wprowadza różnorodność stylistyczną i sprawia, że treść brzmi jak napisana przez człowieka, a nie AI.

## Zastosowanie
- Nadawanie naturalnego tonu treściom generowanym przez AI
- Eliminacja powtórzeń i redundancji
- Poprawa płynności i naturalności tekstu
- Finalne szlifowanie przed publikacją

## Rekomendowany model
**OpenRouter:** `openai/gpt-4o-mini`
**Ollama Cloud:** `gemma2:27b`

## Prompt (oryginalny)

```
You are tasked with humanizing in <language> a piece of text to make it more engaging and less repetitive. This process involves adding variety to the writing while maintaining the original meaning and intent.

Output in <language>

To humanize this content, apply the following strategies:

1. Use synonyms to avoid repeating the same words
2. Vary sentence structures (mix short and long sentences)
3. Combine related ideas into single sentences where appropriate
4. Avoid overexplaining; trust the reader's understanding
5. Focus on adding new information in each sentence
6. Use pronouns and phrases to reduce repetition
7. Eliminate redundant phrases
8. Ensure each paragraph introduces fresh concepts

Instructions:

1. Read the original text carefully to understand its main points and tone.
2. Apply the strategies listed above to rewrite the text in a more engaging and less repetitive manner.
3. Maintain the original meaning and intent of the text while making it more readable and interesting.
4. Ensure that the humanized version flows naturally and maintains a consistent tone.
5. Don't add heading at the beginning of content
6. Remove summary at the end if exists

Remember to make the text sound natural and conversational, as if it were written by a human rather than an AI. Your goal is to create a version that is more engaging and easier to read while preserving the original information and message.

Output in plain text
```

## Prompt (polski)

```
Twoim zadaniem jest humanizacja tekstu w języku <language>, aby uczynić go bardziej angażującym i mniej powtarzalnym. Proces ten polega na dodaniu różnorodności do pisania przy zachowaniu oryginalnego znaczenia i intencji.

Wynik w języku <language>

Aby zhumanizować tę treść, zastosuj następujące strategie:

1. Używaj synonimów, aby uniknąć powtarzania tych samych słów
2. Zróżnicuj struktury zdań (mieszaj krótkie i długie zdania)
3. Łącz powiązane idee w pojedyncze zdania, gdzie to odpowiednie
4. Unikaj nadmiernego wyjaśniania; zaufaj zrozumieniu czytelnika
5. Skup się na dodawaniu nowych informacji w każdym zdaniu
6. Używaj zaimków i fraz, aby zmniejszyć powtórzenia
7. Eliminuj redundantne frazy
8. Upewnij się, że każdy akapit wprowadza świeże koncepcje

Instrukcje:

1. Przeczytaj uważnie oryginalny tekst, aby zrozumieć jego główne punkty i ton.
2. Zastosuj strategie wymienione powyżej, aby przepisać tekst w bardziej angażujący i mniej powtarzalny sposób.
3. Zachowaj oryginalne znaczenie i intencję tekstu, czyniąc go bardziej czytelnym i interesującym.
4. Upewnij się, że zhumanizowana wersja płynie naturalnie i zachowuje spójny ton.
5. Nie dodawaj nagłówka na początku treści
6. Usuń podsumowanie na końcu, jeśli istnieje

Pamiętaj, aby tekst brzmiał naturalnie i konwersacyjnie, jakby został napisany przez człowieka, a nie AI. Twoim celem jest stworzenie wersji, która jest bardziej angażująca i łatwiejsza do czytania, zachowując oryginalne informacje i przekaz.

Wynik w zwykłym tekście.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `language` | string | Język wynikowy |
| `original_text` | string | Oryginalna treść do humanizacji |

## Przykład użycia

```json
{
  "inputs": {
    "language": "Polish",
    "original_text": "Pompa ciepła jest urządzeniem. Pompa ciepła pobiera ciepło z otoczenia. Pompa ciepła przenosi ciepło do budynku. Pompa ciepła jest efektywna. Pompa ciepła jest ekologiczna. Pompa ciepła może pobierać ciepło z powietrza. Pompa ciepła może pobierać ciepło z gruntu. Pompa ciepła może pobierać ciepło z wody."
  }
}
```

## Oczekiwany wynik

```
To innowacyjne urządzenie grzewcze działa na fascynującej zasadzie - pobiera energię z otoczenia i przekazuje ją do wnętrza budynku. Dzięki temu rozwiązaniu możemy ogrzewać dom wykorzystując naturalne źródła ciepła.

Co więcej, technologia ta wyróżnia się wysoką efektywnością energetyczną przy minimalnym wpływie na środowisko. W zależności od warunków lokalnych, energia może pochodzić z powietrza zewnętrznego, gruntu poprzez wymienniki, lub nawet z wód gruntowych.
```
