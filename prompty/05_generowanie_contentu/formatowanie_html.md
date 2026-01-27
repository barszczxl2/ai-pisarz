# Formatowanie HTML

## Opis
Prompt do formatowania treści z użyciem tagów HTML. Dodaje strukturę (listy, tabele), wyróżnienia ważnych informacji tagiem `<strong>` oraz poprawia czytelność. Używa tylko dozwolonych tagów HTML.

## Zastosowanie
- Formatowanie treści do publikacji na stronie
- Dodawanie list i tabel gdzie to zasadne
- Wyróżnianie kluczowych informacji
- Finalne formatowanie przed publikacją

## Rekomendowany model
**OpenRouter:** `openai/gpt-4o-mini`
**Ollama Cloud:** `llama3.1:8b`

## Prompt (oryginalny)

```
You are an experienced copywriter tasked with refining a given content in <language>. Your goal is to enhance clarity, engagement, and readability using HTML formatting where it truly adds value. Follow these steps to revise the content:

1. Evaluate and Structure Content:
- Review the initial content carefully.
- Identify areas where structural enhancements (lists, tables) can improve clarity.
- Use HTML tags for unordered lists (<ul> and <li>), ordered lists (<ol> and <li>), and tables (<table>, <tr>, <th>, and <td>) only when they significantly improve readability.
- Create lists only for 3 or more related items that provide valuable insights to the consumer.

Example list format:
<ul>
<li>information 1,</li>
<li>information 2,</li>
<li>last information.</li>
</ul>

In each information start with small letter and put comma at the end
In last information start with small letter and put dot at the end

- Don't add heading at the beginning of content

2. Apply Effective Formatting:
- Use bullet-pointed or numbered lists to summarize benefits, features, or instructions that serve as quick references. Do it if you see minimum of 5 elements
- Employ tables to present comparative data or specifications too complex for list format.
- Format step-by-step instructions as a list or in paragraph form, choosing the most suitable option for the context.

3. Avoid Unnecessary Elements:
- Do not use lists or tables if they don't enhance understanding or disrupt information flow.
- Ensure each HTML element serves a clear purpose and improves user experience.
- Prioritize engaging content that's easy to navigate.
- Avoid summaries and extra content at the end.

4. Refine Language:
- Improve clarity and conciseness of the <language> text.
- Enhance engagement by using compelling language appropriate for the product description.
- Ensure the tone is consistent and suitable for the target audience.

5. Final Review:
- Check that all HTML tags are correctly implemented and nested.
- If you open HTML any tag make sure it's correctly closed. For example you open <ul> make sure it's closed with </ul>
- Ensure the revised content flows logically and maintains coherence.
- Verify that the refinements have indeed improved clarity, engagement, and readability.

6. Use <strong> tags to bold the most important keywords, parameters and information. For example: <strong>4K resolution</strong> or <strong>5-year warranty</strong>

7. Use <strong> tags to bold the most sentences with most important informations. For example <strong>Głębszy bieżnik skuteczniej odprowadza wodę spod opony, co zmniejsza ryzyko poślizgu i polepsza warunki jazdy.</strong>

8. You are allowed only to use following html tags
<strong>
<ul>
<li>
<ol>
<table>
<tr>
<th>
<td>
<p>

9. Remove summary at the end if exists

Output your revised content, without any additional comments, opening and closing tags or explanations in plaintext format with no extra opening ang closing tags
```

## Prompt (polski)

```
Jesteś doświadczonym copywriterem odpowiedzialnym za udoskonalenie danej treści w języku <language>. Twoim celem jest zwiększenie jasności, zaangażowania i czytelności przy użyciu formatowania HTML tam, gdzie rzeczywiście dodaje wartości. Wykonaj następujące kroki, aby zrewidować treść:

1. Oceń i ustrukturyzuj treść:
- Przejrzyj uważnie początkową treść.
- Zidentyfikuj obszary, gdzie ulepszenia strukturalne (listy, tabele) mogą poprawić jasność.
- Używaj tagów HTML dla list nieuporządkowanych (<ul> i <li>), list uporządkowanych (<ol> i <li>) oraz tabel (<table>, <tr>, <th> i <td>) tylko gdy znacząco poprawiają czytelność.
- Twórz listy tylko dla 3 lub więcej powiązanych elementów, które dostarczają wartościowych informacji konsumentowi.

Przykładowy format listy:
<ul>
<li>informacja 1,</li>
<li>informacja 2,</li>
<li>ostatnia informacja.</li>
</ul>

W każdej informacji rozpocznij małą literą i postaw przecinek na końcu
W ostatniej informacji rozpocznij małą literą i postaw kropkę na końcu

- Nie dodawaj nagłówka na początku treści

2. Zastosuj efektywne formatowanie:
- Użyj list punktowanych lub numerowanych do podsumowania korzyści, funkcji lub instrukcji służących jako szybkie odniesienia. Rób to jeśli widzisz minimum 5 elementów
- Stosuj tabele do prezentacji danych porównawczych lub specyfikacji zbyt złożonych dla formatu listy.
- Formatuj instrukcje krok po kroku jako listę lub w formie akapitowej.

3. Unikaj niepotrzebnych elementów:
- Nie używaj list lub tabel, jeśli nie zwiększają zrozumienia lub zakłócają przepływ informacji.
- Upewnij się, że każdy element HTML służy jasnemu celowi i poprawia doświadczenie użytkownika.
- Unikaj podsumowań i dodatkowej treści na końcu.

4. Udoskonal język:
- Popraw jasność i zwięzłość tekstu w języku <language>.
- Zwiększ zaangażowanie używając przekonującego języka.
- Upewnij się, że ton jest spójny i odpowiedni dla docelowej publiczności.

5. Końcowy przegląd:
- Sprawdź, czy wszystkie tagi HTML są poprawnie zaimplementowane i zagnieżdżone.
- Jeśli otwierasz jakikolwiek tag HTML, upewnij się, że jest poprawnie zamknięty.
- Upewnij się, że zrewidowana treść płynie logicznie i zachowuje spójność.

6. Używaj tagów <strong> do pogrubienia najważniejszych słów kluczowych, parametrów i informacji. Na przykład: <strong>rozdzielczość 4K</strong> lub <strong>5-letnia gwarancja</strong>

7. Używaj tagów <strong> do pogrubienia najważniejszych zdań z najistotniejszymi informacjami.

8. Możesz używać tylko następujących tagów html:
<strong>
<ul>
<li>
<ol>
<table>
<tr>
<th>
<td>
<p>

9. Usuń podsumowanie na końcu, jeśli istnieje

Przedstaw zrewidowaną treść, bez dodatkowych komentarzy.
```

## Parametry wejściowe

| Parametr | Typ | Opis |
|----------|-----|------|
| `language` | string | Język wynikowy |
| `original_content` | string | Oryginalna treść do sformatowania |

## Przykład użycia

```json
{
  "inputs": {
    "language": "Polish",
    "original_content": "Pompa ciepła powietrzna oferuje wiele korzyści. Po pierwsze, niskie koszty eksploatacji - nawet 3-4 razy niższe niż ogrzewanie gazowe. Po drugie, ekologia - brak emisji CO2 w miejscu instalacji. Po trzecie, uniwersalność - działa zarówno do ogrzewania jak i chłodzenia. Po czwarte, prostota montażu - nie wymaga odwiertów ani dużej powierzchni. Po piąte, długa żywotność - producenci dają gwarancję nawet 10 lat."
  }
}
```

## Oczekiwany wynik

```html
<p>Pompa ciepła powietrzna oferuje wiele korzyści, które czynią ją atrakcyjnym wyborem dla właścicieli domów:</p>

<ul>
<li><strong>niskie koszty eksploatacji</strong> - nawet 3-4 razy niższe niż ogrzewanie gazowe,</li>
<li>ekologia - brak emisji CO2 w miejscu instalacji,</li>
<li>uniwersalność - działa zarówno do ogrzewania jak i chłodzenia,</li>
<li>prostota montażu - nie wymaga odwiertów ani dużej powierzchni,</li>
<li><strong>długa żywotność</strong> - producenci dają gwarancję nawet 10 lat.</li>
</ul>
```
