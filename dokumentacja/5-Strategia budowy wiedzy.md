Strategia budowy wiedzy: precyzja i kontekst
Proces opiera się na dwóch rodzajach wiedzy pozyskiwanej z internetu na podstawie wcześniej przygotowanych nagłówków:

Wiedza dokładna: Polega na bezpośrednim znalezieniu odpowiedzi na pytania zawarte w Twoich nagłówkach. AI otrzymuje zadanie, aby dla każdego nagłówka (np. “Jakie funkcje pełni kortyzol?”) znaleźć i sformułować konkretną, dopasowaną odpowiedź.
Wiedza ogólna: W tym podejściu dajemy AI więcej swobody. Na podstawie całego zebranego materiału, model sam decyduje, jakie dodatkowe pytania warto zadać i na nie odpowiada. To pozwala wzbogacić treść o istotne konteksty i informacje, których mogliśmy nie przewidzieć w strukturze nagłówków.
Jak ręcznie zbudować bazę wiedzy RAG w Dify
Zanim przejdziemy do automatyzacji, warto zrozumieć proces, wykonując go ręcznie. Pozwoli to lepiej poznać mechanizmy działania platformy Dify.

Krok 1: Wygenerowanie pliku z wiedzą
Pierwszym krokiem jest uruchomienie w Dify przepływu pracy (workflow), który przeszukuje internet, zbiera treści z najlepszych wyników, a następnie na ich podstawie generuje dwa zestawy pytań i odpowiedzi (dokładne i ogólne). Wynikiem tego procesu jest plik tekstowy (np. kortyzol_rag.txt), w którym każda para pytanie-odpowiedź jest oddzielona specjalnym separatorem (w tym przypadku znakiem ###).

Krok 2: Tworzenie nowej bazy wiedzy
W panelu Dify przejdź do sekcji Wiedza. Kliknij przycisk “Utwórz wiedzę”, a następnie wybierz opcję importu danych z pliku tekstowego.

Krok 3: Konfiguracja importu danych
Po wybraniu pliku .txt należy skonfigurować sposób jego przetwarzania:

Separator bloków: Ustaw separator, który został zdefiniowany w prompcie, czyli ###. Dzięki temu Dify prawidłowo podzieli tekst na osobne fragmenty (chunki).
Pozostałe opcje: Ustaw maksymalną długość bloku (np. 450-500 tokenów, co odpowiada ok. 2000 znaków) i pozostaw resztę ustawień domyślnych.
Krok 4: Ustawienia zaawansowane bazy wiedzy
Po załadowaniu fragmentów, Dify rozpocznie ich indeksowanie. W tym momencie należy skonfigurować kluczowe parametry bazy wiedzy:

Jakość wektoryzacji: Zawsze wybieraj opcję wysokiej jakości, aby zapewnić najlepsze wyniki.
Tryb wyszukiwania: Wybierz wyszukiwanie hybrydowe. Ten tryb, oprócz standardowego wyszukiwania wektorowego, wykorzystuje model typu “reranker”, który dodatkowo analizuje i szereguje wyniki, aby znaleźć najbardziej trafne fragmenty.
Model rerankera: Z listy wybierz model base-multimodal-reranker-generic.
Krok 5: Testowanie bazy wiedzy
Skorzystaj z wbudowanego przycisku Testowanie. Wpisz dowolny nagłówek ze swojego planu (nawet jeśli jego forma jest nieco inna niż w bazie), a system pokaże, które fragmenty wiedzy zostały uznane za najbardziej pasujące. To doskonały sposób, aby zobaczyć reranking w akcji.

Automatyzacja budowy RAG za pomocą Make.com
Ręczne tworzenie bazy jest pouczające, ale celem jest pełna automatyzacja. Poniższe kroki pokazują, jak skonfigurować scenariusz w Make, który wykona cały proces za Ciebie.

Krok 1: Przygotowanie scenariusza w Make
Stwórz nowy scenariusz w Make, który będzie uruchamiany, gdy w arkuszu Google w kolumnie statusu (np. kolumna N) pojawi się wartość “generuj”. Scenariusz powinien pobierać z danego wiersza słowo kluczowe, język oraz listę nagłówków do generacji.

Krok 2: Wywołanie przepływu pracy w Dify
Dodaj moduł API Dify, aby wywołać workflow generujący wiedzę. Skonfiguruj go, przesyłając w ciele zapytania (JSON) pobrane wcześniej dane: keyword, language i headings. Pamiętaj, aby użyć klucza API z odpowiedniej aplikacji w Dify.

Krok 3: Wywołanie API bazy wiedzy Dify
Po otrzymaniu odpowiedzi z pierwszego modułu (zawierającej wiedzę dokładną i ogólną), dodaj nowy moduł HTTP > Make a request. Będzie on odpowiedzialny za dodanie wygenerowanej treści do Twojej bazy wiedzy w Dify.

URL: Skonstruuj adres URL do API wiedzy. Znajdziesz go w dokumentacji Dify. Musi on zawierać Dataset ID Twojej bazy wiedzy. ID to znajdziesz w adresie URL, gdy otworzysz swoją bazę wiedzy w panelu Dify.
Metoda: POST
Headers: Dodaj nagłówek autoryzacji: Authorization z wartością Bearer [KLUCZ_API_WIEDZY]. Klucz ten jest inny niż klucz aplikacji i znajdziesz go w ustawieniach API w sekcji “Wiedza”.
Body: Prześlij treść w formacie JSON. Musi ona zawierać co najmniej dwa parametry: name (np. słowo kluczowe, które posłuży za nazwę dokumentu w bazie) oraz text (połączona wiedza ogólna i dokładna z poprzedniego kroku).
Ważne: W udostępnionym szablonie automatyzacji znajdują się gotowe reguły przetwarzania, które zapewniają m.in. użycie trybu hybrydowego i wysokiej jakości wektoryzacji, tak jak w procesie ręcznym.

Krok 4: Aktualizacja statusu w Google Sheets
Na końcu scenariusza dodaj moduł, który zaktualizuje status w arkuszu Google (np. w kolumnie P na “OK”, a w kolumnie N na “gotowe”), aby zasygnalizować zakończenie procesu dla danego słowa kluczowego.

Podsumowanie
Po poprawnym skonfigurowaniu automatyzacji, cały proces budowy bazy wiedzy RAG będzie odbywał się bez Twojej ingerencji. Wystarczy, że dodasz nowe słowo kluczowe i nagłówki do arkusza oraz ustawisz odpowiedni status. Z tak przygotowaną bazą jesteśmy gotowi na kolejny etap: przygotowanie briefu do generacji treści.

