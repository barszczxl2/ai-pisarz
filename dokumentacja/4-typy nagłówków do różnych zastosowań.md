Trzy typy nagłówków do różnych zastosowań
Proces generuje trzy rodzaje struktur nagłówków, które można dopasować do konkretnego celu i miejsca publikacji treści. Wybór zależy od strategicznego znaczenia artykułu w ramach Twojej mapy tematycznej (Topical Map).

Nagłówki rozbudowane (H2 + H3): Najbardziej szczegółowa i opasła struktura. Idealna dla artykułów stanowiących rdzeń tematyczny (core section) Twojej strony. Taka hierarchiczna budowa (H2 z podpunktami H3) ułatwia tworzenie rozbudowanego linkowania wewnętrznego do powiązanych tematów.
Nagłówki H2: Typowa, płaska struktura składająca się wyłącznie z nagłówków H2. To standardowy format, który można stosować zamiennie z nagłówkami w formie pytań.
Nagłówki jako pytania: W opinii prowadzącego, najbardziej przydatny format z perspektywy SEO. Użytkownicy często wpisują w wyszukiwarki pytania, a taka struktura bezpośrednio na nie odpowiada. Doskonale sprawdza się na blogach i w artykułach pomocniczych (outer section).
Logika skutecznego promptu dla modeli reasoningowych
Skuteczność generowania nagłówków opiera się na zaawansowanym prompcie, który został zoptymalizowany pod kątem modeli wnioskujących (reasoning models). Dzięki nim cały proces można zamknąć w jednym kroku, w przeciwieństwie do starszych metod wymagających kilku etapów.

Kluczowe instrukcje w prompcie to:

Optymalizacja i unikanie redundancji: Model ma za zadanie stworzyć logiczny i zoptymalizowany plan artykułu (outline), agresywnie usuwając i grupując zbędne lub powtarzające się tematy. Celem jest plan “tak krótki, jak to możliwe, i tak długi, jak to wymagane”.
Logiczny przepływ i podróż użytkownika: Nagłówki muszą tworzyć naturalną progresję, gdzie każdy kolejny wynika z poprzedniego. Struktura powinna prowadzić użytkownika od zdefiniowania głównego pojęcia do tematów pomocniczych.
Unikanie generycznych fraz: Prompt zawiera zakaz używania typowych, generowanych przez AI nagłówków, takich jak “Wprowadzenie”, “Podsumowanie”, “Conclusion” czy “Ultimate Guide”.
Wykorzystanie przykładów: Prompt jest zasilony dużą liczbą przykładów świetnie zoptymalizowanych planów artykułów, co pozwala modelowi lepiej zrozumieć pożądany rezultat.
Automatyzacja generowania nagłówków
Proces jest w pełni zautomatyzowany przy użyciu arkusza Google Sheets oraz platformy Make.com. Poniżej przedstawiono kroki konfiguracji.

Krok 1: Przygotowanie arkusza Google
Do arkusza z poprzedniej lekcji dodawane są nowe kolumny:

Nagłówki rozbudowane
Nagłówki H2
Nagłówki jako pytania
Status - Nagłówki (do sterowania automatyzacją tego etapu)
Krok 2: Konfiguracja scenariusza w Make.com
Tworzony jest nowy scenariusz, który wykonuje następujące czynności:

Wyzwalacz (Trigger): Scenariusz uruchamia się, gdy w kolumnie Status - Nagłówki pojawi się wartość “generuj”.
Filtr logiczny: Dodano warunek sprawdzający, czy komórka z frazą kluczową nie jest pusta (exist). To zabezpieczenie zapobiega błędom, gdy scenariusz próbuje uruchomić się dla już przetworzonego lub pustego wiersza.
Pobranie danych i wywołanie API: Scenariusz pobiera dane wejściowe z wiersza (m.in. frazę kluczową i graf informacji z poprzedniego etapu), a następnie wysyła je do odpowiedniego workflow w Dify poprzez API.
Aktualizacja arkusza: Po otrzymaniu odpowiedzi z Dify, scenariusz wkleja trzy wygenerowane zestawy nagłówków do odpowiednich kolumn w arkuszu i zmienia status w kolumnie Status - Nagłówki na “gotowe”.
Krok 3: Wprowadzenie etapu weryfikacji
Na końcu prowadzący dodaje kolejną kolumnę statusu: Status - Generacja. Jej celem jest stworzenie manualnego punktu kontrolnego.

Po wygenerowaniu nagłówków i otrzymaniu statusu “gotowe”, użytkownik może je przejrzeć, dokonać edycji lub usunąć niechciane elementy. Dopiero po tej weryfikacji ręcznie zmienia status w kolumnie Status - Generacja na “generuj”, co uruchomi kolejny, ostatni etap procesu: pisanie treści artykułu.