Dlaczego brief jest kluczowy?
Sztuczna inteligencja działa na zasadzie prawdopodobieństwa. Aby uzyskać spójny i merytoryczny tekst, musimy precyzyjnie określić, co ma zostać wygenerowane w każdym kroku. Dzielenie procesu na mniejsze części, takie jak generowanie osobnych akapitów dla każdego nagłówka, minimalizuje ryzyko błędów i “zapominania” o istotnych informacjach przez model językowy. Proces ten przypomina przygotowywanie wytycznych dla profesjonalnego copywritera.

Elementy potrzebne do stworzenia briefu
Do wygenerowania kompletnego briefu konieczne jest zebranie i wykorzystanie następujących danych z Twojego pliku roboczego:

Wszystkie słowa kluczowe: Pełna lista fraz kluczowych z Google, które mają zostać użyte w artykule.
Nagłówki (Headings): Struktura artykułu w postaci nagłówków, dla których w poprzednim kroku przygotowano bazę wiedzy (RAG).
Knowledge Graph: Graf wiedzy zapewniający szeroki obraz tematu i relacji między pojęciami.
Information Graph: Graf informacji, który dostarcza dodatkowego kontekstu i szczegółów, uzupełniając wiedzę z bazy RAG.
Wskazówka: Celowo wykorzystuje się dane z różnych źródeł (RAG, Knowledge Graph, Information Graph), aby zapewnić modelowi AI jak najszerszą perspektywę i zminimalizować ryzyko pominięcia ważnych informacji.

Struktura wygenerowanego briefu
Wynikiem procesu jest precyzyjny brief dla każdego nagłówka, który zawiera trzy kluczowe elementy:

Nagłówek: Wskazuje konkretny fragment tekstu, który ma zostać w danym momencie wygenerowany (np. “Co to jest kortyzol?”).
Wiedza do zawarcia: Informacje pochodzące z Information Graph i Knowledge Graph, które muszą znaleźć się w danym segmencie tekstu.
Słowa kluczowe: Konkretne frazy, które muszą zostać użyte w treści pod danym nagłówkiem.
Automatyzacja procesu w Make
Proces tworzenia briefu jest dodawany jako kolejny krok do istniejącej automatyzacji, która budowała bazę wiedzy RAG. Poniżej przedstawiono, jak to skonfigurować.

Krok 1: Dodanie modułu API do Dify
W istniejącym scenariuszu Make, po module generującym RAG, dodaj nowy moduł API. Nazwij go “Brief” i wklej swój klucz API do Dify.

Krok 2: Konfiguracja danych wejściowych (JSON)
W module “Brief” należy przygotować strukturę danych w formacie JSON, która zostanie wysłana do Dify. Musi ona zawierać wszystkie wymagane elementy. Pamiętaj, aby zmapować odpowiednie zmienne z poprzednich modułów w Make.

Dane wejściowe powinny zawierać:

keyword: Główne słowo kluczowe.
frazy: Wszystkie słowa kluczowe pobrane z wyników wyszukiwania.
headings: Lista wszystkich nagłówków artykułu.
knowledge_graph: Dane z grafu wiedzy.
information_graph: Dane z grafu informacji.
Wskazówka: Jeśli nowo dodane zmienne (np. frazy) nie są od razu widoczne w panelu mapowania, zapisz scenariusz i odśwież okno przeglądarki.

Krok 3: Uruchomienie testowe i obsługa wyników
Uruchom scenariusz raz, aby Make “nauczył się” struktury danych wyjściowych z modułu Dify. Wynikiem działania modułu “Brief” będą dwie części: właściwy brief w formie tekstowej oraz jego wersja w formacie .html.

Krok 4: Zapisywanie wyników w Google Sheets i Google Drive
Aby w pełni zautomatyzować proces i archiwizować wyniki, dodaj kolejne moduły w Make:

Zapisz brief tekstowy: Użyj modułu Google Sheets, aby zapisać wygenerowany brief tekstowy w odpowiedniej kolumnie arkusza (w przykładzie jest to kolumna Q).
Stwórz plik HTML: Dodaj moduł Google Docs z akcją “Create Document”. Jako treść dokumentu przekaż dane HTML otrzymane z Dify. Nazwij plik, używając np. numeru wiersza i słowa kluczowego, aby łatwo go zidentyfikować.
Zapisz link do pliku: Na koniec, w module Google Sheets, zapisz link do nowo utworzonego dokumentu Google (web view link) w dedykowanej kolumnie (w przykładzie — R).
Podsumowanie
Po wykonaniu tych kroków proces jest w pełni zautomatyzowany. Dla każdego tematu generowany jest nie tylko brief tekstowy zapisany w arkuszu, ale także gotowy do udostępnienia plik HTML na Dysku Google. Z tak przygotowanym materiałem można przejść do finalnego etapu, czyli generowania treści artykułu.

