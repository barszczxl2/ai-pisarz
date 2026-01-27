logika automatyzacji w Make.com
Scenariusz jest złożony, ale jego działanie opiera się na kilku kluczowych modułach i koncepcjach. Oto jego budowa krok po kroku:

1. Wyzwalacz i przygotowanie danych
Start procesu: Automatyzacja uruchamia się, gdy w kolumnie T arkusza Google Sheets dla danego wiersza zostanie ustawiony status “generuj”.
Przetwarzanie danych wejściowych (JSON): Scenariusz pobiera dane z arkusza (w tym listę nagłówków w formacie JSON). Ponieważ Make.com wymaga specyficznej struktury danych do iteracji, dane te są konwertowane dwukrotnie: najpierw z formatu JSON na obiekt (bundle), a następnie na tablicę (array), która może być użyta w kolejnych modułach.
2. Utworzenie pliku docelowego
Jeszcze przed rozpoczęciem generowania treści, scenariusz tworzy pusty plik w Google Drive. Nazwa pliku jest generowana dynamicznie i zawiera słowo kluczowe, co ułatwia identyfikację. To w tym pliku będą zapisywane kolejne akapity artykułu.

3. Zarządzanie kontekstem za pomocą Data Store
To najważniejszy mechanizm w całej automatyzacji, który pozwala na zachowanie kontekstu między generowaniem kolejnych paragrafów.

Czym jest Data Store: Jest to mała, wewnętrzna baza danych w Make.com, która służy do tymczasowego przechowywania informacji.
Czyszczenie bazy: Na początku każdego uruchomienia scenariusza, Data Store jest całkowicie czyszczony. Zapobiega to przenoszeniu kontekstu z poprzednio generowanych artykułów (np. informacji o kortyzolu do artykułu o progesteronie).
Pobieranie poprzedniej treści: W trakcie generowania każdego nowego akapitu, scenariusz odczytuje z Data Store całą treść wygenerowaną do tej pory.
Aktualizacja bazy: Po wygenerowaniu nowego akapitu, Data Store jest ponownie czyszczony, a następnie zapisywana jest w nim zaktualizowana, pełna treść artykułu (stara treść + nowo dodany akapit).
Ważna instrukcja: Aby ten proces zadziałał, musisz w swoim koncie Make.com stworzyć własny Data Store i dodać w nim jedno pole tekstowe o nazwie content. Bez tego automatyzacja napotka błąd.

4. Iteracja, generowanie i zapisywanie
Sercem procesu jest iterator, który wykonuje pętlę dla każdego nagłówka z przygotowanej listy.

Pętla po nagłówkach (Iterator): Moduł pobiera listę nagłówków i dla każdego z nich po kolei wykonuje serię działań.
Wywołanie API Deefai: Dla każdego nagłówka wysyłane jest zapytanie do workflow w Deefai. Co kluczowe, oprócz samego nagłówka, przekazywana jest również pełna treść wygenerowana do tej pory (pobrana z Data Store), aby AI miało kontekst i mogło napisać spójny akapit.
Dopisywanie paragrafu do pliku: Zamiast tworzyć plik na końcu, scenariusz używa modułu Insert a paragraph to a document. Dzięki temu po każdej iteracji nowy akapit jest natychmiast dopisywany do istniejącego pliku Google Doc.
5. Zakończenie procesu
Po zakończeniu wszystkich iteracji, scenariusz wkleja link do gotowego pliku w odpowiedniej kolumnie arkusza i zmienia status na “gotowe”.

Ograniczenie procesu – ważna uwaga
Należy pamiętać, że scenariusz zmienia status w arkuszu na “gotowe” i wkleja link do pliku niemal natychmiast po uruchomieniu. Jednak faktyczne generowanie treści trwa znacznie dłużej, ponieważ każdy akapit wymaga osobnego wywołania API. Obserwuj tworzony plik w Google Docs, aby śledzić postępy w generowaniu artykułu na żywo.