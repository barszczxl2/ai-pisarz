# Praca nad treścią z wykorzystaniem AI

> Pełne materiały kursu do NotebookLM
> Wygenerowano: 17.01.2026

---
# Wstęp do tworzenia treści z AI

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-1"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/6d443011-6e98-4f76-88de-0fe2da3afc98?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja rozpoczyna ten bardzo praktyczny kurs, w którym skupimy się na **automatyzacjach, workflowach i zaawansowanej pracy z jednostką treści**. Poznasz procesy i narzędzia, które pozwolą nie tylko generować, ale także skutecznie optymalizować content pod kątem nowoczesnych wyszukiwarek i AI Overview.

## 📝 Notatka z lekcji

Tytułem przypomnienia, w tym kursie będziemy zamiennie używać dwóch pojęć:

- **Knowledge Graph:** "Big Picture", czyli holistyczne spojrzenie na temat, jego strukturę i wzajemne powiązania między encjami.
- **Information Graph:** Głęboka wiedza na dany temat, szczegółowe informacje i fakty.

### Budowa i struktura jednostki treści

Każdy artykuł, który będziemy tworzyć, zostanie zbudowany w oparciu o precyzyjną strukturę, kluczową dla zrozumienia go zarówno przez użytkowników, jak i przez algorytmy AI.

- **Makrokontekst (góra treści):** Najważniejsze informacje muszą znaleźć się na samej górze. Zawsze zaczynamy od definicji głównej encji artykułu oraz jej kluczowych atrybutów.
- **Mikrokontekst (dół treści):** Ta część zawiera dodatkowe perspektywy i odpowiedzi na bardziej szczegółowe, długie pytania (long-tail). Dzięki temu treść ma szansę zostać wykorzystana przez AI do syntezy odpowiedzi na szeroki zakres zapytań użytkowników.

### Odtworzenie procesu Google AI Overview (RAG)

W tym kursie odtworzymy proces bardzo zbliżony do tego, jakiego używa Google do generowania odpowiedzi w AI Overview. Ten proces, znany jako **Retrieval-Augmented Generation (RAG)**, składa się z kilku etapów:

1. **Gromadzenie wiedzy:** Wyszukiwanie informacji w internecie – ze stron z Top 10, źródeł użytych w AI Overview oraz potencjalnie z dodatkowych źródeł znalezionych dzięki technice *Query Expansion*.
2. **Dzielenie danych (Data Chunking):** Zebrana wiedza jest dzielona na małe, konkretne fragmenty (snippety), podobnie jak robi to Google.
3. **Wyszukiwanie i generowanie (RAG):** Dla każdego nagłówka w naszym artykule będziemy przeszukiwać naszą bazę wiedzy (stworzoną z tych fragmentów), aby znaleźć najbardziej dopasowane informacje. Zostaną one następnie użyte do wygenerowania spójnego i merytorycznego akapitu.
4. **Humanizacja i formatowanie:** Ostatni etap to weryfikacja, nadanie treści naturalnego brzmienia i odpowiednie sformatowanie.

### Kluczowe techniki optymalizacji

Aby tworzone przez nas treści były jak najwyższej jakości i miały największe szanse na zaistnienie w wynikach AI, wykorzystamy dwie zaawansowane koncepcje.

#### 1. Modele rerankingowe

Google, aby wybrać najlepsze fragmenty do syntezy AI Overview, musi ocenić ich trafność (relevance). Robi to za pomocą modeli rerankingowych. My zastosujemy dokładnie tę samą metodę, aby wybrać najlepsze fragmenty wiedzy do nasycenia naszego artykułu. Dzięki temu strony, które nie znajdują się w Top 10, ale zawierają idealnie dopasowaną informację, mogą zostać wykorzystane w syntezie.

#### 2. Wykorzystanie "Reasoning Gap"

To jedna z największych szans w optymalizacji treści. Treści konkurencji, z których AI czerpie wiedzę, mogą być niekompletne lub niskiej jakości. Prowadzi to do "luk w rozumowaniu" (Reasoning Gap), gdzie model AI halucynuje lub udziela banalnych odpowiedzi (np. "samochód to w języku polskim samochód"). Naszym celem jest tworzenie tak kompletnych i dobrze zoptymalizowanych treści, aby wypełniały te luki, stając się najlepszym i najbardziej trafnym źródłem dla AI.

## 📥 Materiały dodatkowe

### Co otrzymasz w tym kursie?

Ten kurs jest w 100% praktyczny. Otrzymasz gotowe do wdrożenia narzędzia i procesy:

- **Kompletne automatyzacje** do generowania i optymalizacji treści.
- **Szczegółowe wytyczne redakcyjne** opisujące, jak powinna być zbudowana idealna treść.
- **Specjalny Google Colab**, który za pomocą modeli rerankingowych i semantyki leksykalnej pomoże Ci zidentyfikować "Reasoning Gap" w istniejących treściach i da konkretne sugestie optymalizacyjne.
- Na koniec kursu przeprowadzimy **audyt contentowy**, który będzie praktycznym podsumowaniem zdobytej wiedzy.

### Przydatne linki


  
  
  


---

<div id="sensai-comments"></div>


---

# Budowa wiedzy

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-2"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/be71120b-aa7c-4029-8259-6dbaa2dd473f?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja rozpoczyna serię poświęconą budowie profesjonalnego procesu generowania treści z użyciem sztucznej inteligencji. Zaczynamy od fundamentalnego etapu: tworzenia solidnej bazy wiedzy. Dowiesz się, jak zbierać i przetwarzać informacje z różnych źródeł, aby przygotować fundament pod wysokiej jakości artykuł.

## 📥 Materiały do pobrania


  


## 📝 Notatka z lekcji

### Cel i etapy procesu generacji treści

Celem jest stworzenie kompletnego, zautomatyzowanego procesu do generowania treści. Każdy proces, niezależnie od tematu, składa się z kilku kluczowych etapów:

1. **Budowa wiedzy:** Zbieranie informacji z zewnętrznych źródeł, ponieważ modele językowe są procesorami języka, a nie źródłami wiedzy.
2. **Tworzenie struktury nagłówków:** Kluczowy etap decydujący o jakości, kontekście i semantyce finalnego tekstu. Zła struktura może sprawić, że cały artykuł będzie bezwartościowy.
3. **Generacja treści:** Wykorzystanie zebranej wiedzy do tworzenia tekstu dla poszczególnych nagłówków (proces RAG – Retrieval-Augmented Generation).
4. **Tworzenie briefu generacyjnego:** Wzbogacenie struktury o konkretne frazy kluczowe, pytania i informacje, które muszą znaleźć się w każdej sekcji. To tak, jakby dać copywriterowi szczegółowe wytyczne zamiast samych nagłówków.
5. **Finalna generacja, humanizacja i formatowanie:** Ostatni szlif nadający treści ostateczny kształt.

### Narzędzia i założenia wstępne

Wszystkie prezentowane w lekcji kroki opierają się na narzędziu **Deefai**. Gotowe przepływy pracy (workflowy) są dostępne do importu pod lekcją.

**Wymagane dane wejściowe:**

- **Fraza kluczowa lub temat:** Na przykład `co to jest kortyzol?`.
- **Język:** Definiuje język, w którym pozyskiwana jest wiedza i frazy (np. `polski`).
- **(Opcjonalnie, ale zalecane) Treść AI Overview:** Ręcznie skopiowana treść z panelu AI Overview w wynikach wyszukiwania Google. Jest to ważne, ponieważ narzędzia nie są w stanie automatycznie pobrać pełnej, rozwiniętej treści.

### Krok po kroku: Budowa bazy wiedzy w Deefai

Proces pozyskiwania wiedzy jest pierwszym i najważniejszym elementem całego workflow. Poniżej omówiono jego logiczną strukturę i działanie poszczególnych bloków.

#### 1. Pobieranie danych z wyników wyszukiwania (SerpData)

Proces rozpoczyna się od zapytania do narzędzia **SerpData**, które pobiera dane bezpośrednio z wyników wyszukiwania Google dla podanej frazy kluczowej.

- **Co jest pobierane:** Lista 10 najlepszych wyników organicznych (Top 10) oraz, jeśli istnieje, zawartość panelu **AI Overview**.
- **Kluczowe informacje:** Narzędzie wyciąga nie tylko adresy URL z wyników organicznych, ale także adresy stron, które posłużyły Google do syntezy odpowiedzi w AI Overview. To cenne źródła, ponieważ są już "zaakceptowane" przez AI.
- **Konfiguracja:** W tym bloku można zdefiniować geolokalizację i język wyszukiwania (np. `hl=pl` dla języka polskiego, `gl=pl` dla Polski).

#### 2. Przetwarzanie i czyszczenie listy URL

Surowe dane z SerpData są następnie przetwarzane przez specjalny skrypt. Jego celem jest stworzenie jednej, unikalnej listy adresów URL do dalszej analizy. Skrypt usuwa duplikaty i ogranicza listę do 25 adresów (standardowy limit w Deefai).

#### 3. Pobieranie treści ze stron (Crawling)

Następnie proces iteruje po każdym adresie URL z listy, aby pobrać treść strony internetowej. Wykorzystywany jest do tego blok **Gina**.

- **Równoległość:** Aby przyspieszyć proces, Deefai pozwala na równoległe przetwarzanie kilku stron jednocześnie (w tym przypadku 4 wątki).
- **Obsługa błędów:** To kluczowy element. Jeśli pobranie którejś ze stron się nie powiedzie (np. z powodu zabezpieczeń), proces nie jest przerywany. Zamiast tego zwracana jest pusta wartość (spacja), co pozwala kontynuować pracę z pozostałymi źródłami.

> **Wskazówka:** Gina pobiera całą zawartość strony, włączając w to nawigację i inne "szumy". Dla uzyskania czystszych danych i lepszych wyników, zaawansowani użytkownicy mogą zastąpić ten blok własnym, bardziej zaawansowanym crawlerem.

#### 4. Analiza treści i ekstrakcja wiedzy (praca AI)

Po zebraniu treści ze wszystkich źródeł, workflow rozdziela się na cztery równoległe gałęzie, w których AI wykonuje różne zadania analityczne.

**Usuwanie brandów:** Na początku procesu AI identyfikuje i ekstrahuje nazwy marek (np. Medicover, Apteka Melisa) z domen, aby uniknąć umieszczania ich w generowanej, neutralnej treści.

- **Gałąź 1: Ekstrakcja słów kluczowych i encji.** AI analizuje wszystkie teksty w poszukiwaniu najważniejszych słów kluczowych i encji silnie powiązanych z głównym tematem (np. "kortyzol"). Proces jest dwuetapowy: najpierw ekstrakcja, a potem filtrowanie i usuwanie duplikatów dla zapewnienia wysokiej jakości.
- **Gałąź 2: Ekstrakcja bazy wiedzy (trójniki semantyczne).** To najważniejsza część. AI przekształca tekst w ustrukturyzowane dane w formie trójników semantycznych (`podmiot-orzeczenie-dopełnienie`, np. `kortyzol-jest-hormonem stresu`). Zapewnia to głęboką, szczegółową wiedzę, która będzie podstawą do tworzenia nagłówków i treści. Ten proces jest wykonywany zarówno na treściach z pobranych stron, jak i na wklejonej ręcznie treści AI Overview.
- **Gałąź 3: Ekstrakcja nagłówków konkurencji.** AI wyciąga nagłówki H2 i H3 ze stron konkurencji. Będą one przydatne w późniejszym etapie planowania struktury artykułu.
- **Gałąź 4: Tworzenie grafu wiedzy (Knowledge Graph).** Używając promptu od Senuto, AI tworzy graf wiedzy, który daje szerszy, "big picture" obraz tematu. Uzupełnia on szczegółowe trójniki semantyczne o relacje i szerszy kontekst.

#### 5. Łączenie i finalizowanie wyników

Na końcu wszystkie dane z równoległych gałęzi są łączone. Otrzymujemy kompletny zestaw informacji gotowy do wykorzystania w kolejnym kroku.

### Wyniki etapu budowy wiedzy

Po zakończeniu tego workflow otrzymujemy cztery kluczowe zestawy danych:

1. **Zestaw słów kluczowych:** Lista fraz i encji, które muszą znaleźć się w tekście.
2. **Graf informacji (trójniki semantyczne):** Czysta, ustrukturyzowana wiedza na dany temat. To fundament merytoryczny artykułu.
3. **Nagłówki konkurencji:** Inspiracja do budowy własnej, kompleksowej struktury.
4. **Graf wiedzy (Senuto):** Ogólny obraz tematu, pomocny w zrozumieniu relacji między pojęciami.

## Podsumowanie

Z tak przygotowaną bazą wiedzy jesteśmy gotowi, aby przejść do kolejnej lekcji, w której zajmiemy się budową optymalnej struktury nagłówków dla naszego artykułu.

---

<div id="sensai-comments"></div>

---

# Tworzenie treści z AI: Automatyzacja do budowy wiedzy

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-3"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/5aa4ed39-1154-40f3-a363-f1f2510b383e?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja koncentruje się na automatyzacji procesu, który został omówiony w poprzedniej części. Krok po kroku zbudujemy w pełni zautomatyzowany przepływ pracy, wykorzystując Google Sheets jako panel sterowania, Make.com jako silnik automatyzacji oraz Dify do przetwarzania danych i generowania wiedzy.

## 📥 Materiały


  
  
  


## 📝 Notatka z lekcji

### Konfiguracja panelu sterowania w Google Sheets

Podstawą naszej automatyzacji jest arkusz kalkulacyjny Google Sheets, który będzie pełnił rolę interfejsu do zarządzania całym procesem. Musi on zawierać odpowiednio przygotowane kolumny.

- **Dane wejściowe:**
    - **Słowo kluczowe:** Główna fraza, na podstawie której będziemy budować wiedzę.
    - **Język:** Kolumna z listą rozwijaną (dropdown), aby uniknąć błędów literowych (np. "Polish", "English").
    - **Zawartość AI Overview:** Miejsce na wklejenie treści z Google AI Overview.
    - **Status:** Kluczowa kolumna z listą rozwijaną, która będzie sterować automatyzacją. Zalecane statusy to: "Wybierz status", "generuj", "gotowe".

- **Kolumny na wyniki:**
    - Frazy z wyników wyszukiwania
    - Graf informacji
    - Nagłówki konkurencji
    - Knowledge Graph

### Budowa scenariusza automatyzacji w Make.com

Po przygotowaniu arkusza przechodzimy do serca operacji – budowy scenariusza w Make.com, który połączy wszystkie elementy.

#### Krok 1: Uruchomienie procesu (Trigger)

Pierwszym modułem w scenariuszu jest **Google Sheets > Search Rows**. Służy on jako wyzwalacz całego procesu.

- **Połączenie:** Wskaż plik i arkusz, który przygotowałeś wcześniej.
- **Filtr:** Ustaw filtr, aby moduł wyszukiwał tylko te wiersze, w których kolumna **Status** ma wartość równą **"generuj"**. Dzięki temu automatyzacja będzie przetwarzać tylko zadania gotowe do uruchomienia.
- **Limit:** Ustaw limit na `1`, aby przy każdym uruchomieniu scenariusza przetwarzany był tylko jeden wiersz. Pozwoli to na łatwiejsze zarządzanie procesem.

#### Krok 2: Przygotowanie i wysłanie danych do Dify

Zanim wyślemy dane do Dify, dobrą praktyką jest ich odpowiednie sformatowanie, a następnie skonfigurowanie modułu HTTP.

**Transformacja do JSON:** Dodaj moduł **JSON > Transform to JSON**. Przepuść przez niego dane z Google Sheets (słowo kluczowe, język, treść AI Overview). Zabezpieczy to dane przed błędami, które mogłyby powstać przez specjalne znaki lub formatowanie w arkuszu.

**Wysłanie żądania HTTP:** Dodaj moduł **HTTP > Make a request**.

- **URL:** Wklej adres URL punktu końcowego (endpoint) Twojego przepływu pracy w Dify. Znajdziesz go w dokumentacji API opublikowanej aplikacji.
- **Method:** Wybierz **POST**, ponieważ wysyłasz dane w celu rozpoczęcia procesu.
- **Headers:** Dodaj jeden nagłówek. Nazwa: `Authorization`, Wartość: `Bearer [Twój_Klucz_API_z_Dify]`.
- **Body type:** Wybierz `Raw` z typem zawartości `application/json`.
- **Request content:** Wklej tutaj strukturę JSON, której oczekuje Dify. Zmapuj w niej dane wyjściowe z modułu **Transform to JSON**.

> **Ważna wskazówka:** Mapując zmienne z modułu **Transform to JSON**, nie umieszczaj ich w cudzysłowach w ciele żądania. Te zmienne są już poprawnie sformatowanym JSON-em. Zawsze zaznaczaj opcję **Parse response**.

#### Krok 3: Pierwsze uruchomienie i mapowanie wyników

Aby Make.com "nauczył się", jaką strukturę danych zwraca Dify, musisz uruchomić scenariusz jeden raz (klikając "Run once"). Proces zakończy się błędem przy module zapisu (jeśli już go dodałeś) lub po prostu się zatrzyma, ale co najważniejsze – Make pozna strukturę odpowiedzi.

#### Krok 4: Zapisanie danych i aktualizacja statusu

Teraz możesz dodać ostatni moduł: **Google Sheets > Update a Row**.

- **Row number:** Zmapuj numer wiersza z pierwszego modułu (triggera). To gwarantuje, że zaktualizujesz właściwy wiersz.
- **Mapowanie danych:** W odpowiednich kolumnach zmapuj dane wyjściowe z modułu HTTP (frazy, graf informacji, nagłówki, knowledge graph).
- **Aktualizacja statusu:** W kolumnie **Status** wpisz ręcznie wartość **"gotowe"**. To kluczowy krok, który zapobiegnie ponownemu przetworzeniu tego samego wiersza w przyszłości.

### Uruchomienie i planowanie automatyzacji

Po zapisaniu scenariusza możesz go uruchomić ponownie. Tym razem powinien przejść od początku do końca, pobierając dane z wiersza ze statusem "generuj" i zapisując w nim wyniki wraz ze statusem "gotowe".

Aby proces był w pełni autonomiczny, możesz ustawić harmonogram działania scenariusza (np. co 15 minut), dzięki czemu będzie on samoczynnie sprawdzał arkusz w poszukiwaniu nowych zadań.

---

<div id="sensai-comments"></div>


---

# Budowa struktury nagłówków

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-4"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/6bc2e756-ee78-4e84-bff4-28bc3eea01f4?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja koncentruje się na drugim kluczowym etapie procesu generacji treści: tworzeniu struktury nagłówków. Jest to krok o fundamentalnym znaczeniu, ponieważ od jego jakości zależy spójność, długość i ostateczna wartość całego artykułu. Zobaczysz, jak wykorzystać nowoczesne modele reasoningowe do tworzenia zoptymalizowanych planów treści oraz jak zautomatyzować ten proces.

## 📥 Materiały do pobrania


  
  


## 📝 Notatka z lekcji

### Trzy typy nagłówków do różnych zastosowań

Proces generuje trzy rodzaje struktur nagłówków, które można dopasować do konkretnego celu i miejsca publikacji treści. Wybór zależy od strategicznego znaczenia artykułu w ramach Twojej mapy tematycznej (Topical Map).

- **Nagłówki rozbudowane (H2 + H3):** Najbardziej szczegółowa i opasła struktura. Idealna dla artykułów stanowiących rdzeń tematyczny (*core section*) Twojej strony. Taka hierarchiczna budowa (H2 z podpunktami H3) ułatwia tworzenie rozbudowanego linkowania wewnętrznego do powiązanych tematów.
- **Nagłówki H2:** Typowa, płaska struktura składająca się wyłącznie z nagłówków H2. To standardowy format, który można stosować zamiennie z nagłówkami w formie pytań.
- **Nagłówki jako pytania:** W opinii prowadzącego, najbardziej przydatny format z perspektywy SEO. Użytkownicy często wpisują w wyszukiwarki pytania, a taka struktura bezpośrednio na nie odpowiada. Doskonale sprawdza się na blogach i w artykułach pomocniczych (*outer section*).

### Logika skutecznego promptu dla modeli reasoningowych

Skuteczność generowania nagłówków opiera się na zaawansowanym prompcie, który został zoptymalizowany pod kątem modeli wnioskujących (reasoning models). Dzięki nim cały proces można zamknąć w jednym kroku, w przeciwieństwie do starszych metod wymagających kilku etapów.

Kluczowe instrukcje w prompcie to:

- **Optymalizacja i unikanie redundancji:** Model ma za zadanie stworzyć logiczny i zoptymalizowany plan artykułu (*outline*), agresywnie usuwając i grupując zbędne lub powtarzające się tematy. Celem jest plan "tak krótki, jak to możliwe, i tak długi, jak to wymagane".
- **Logiczny przepływ i podróż użytkownika:** Nagłówki muszą tworzyć naturalną progresję, gdzie każdy kolejny wynika z poprzedniego. Struktura powinna prowadzić użytkownika od zdefiniowania głównego pojęcia do tematów pomocniczych.
- **Unikanie generycznych fraz:** Prompt zawiera zakaz używania typowych, generowanych przez AI nagłówków, takich jak "Wprowadzenie", "Podsumowanie", "Conclusion" czy "Ultimate Guide".
- **Wykorzystanie przykładów:** Prompt jest zasilony dużą liczbą przykładów świetnie zoptymalizowanych planów artykułów, co pozwala modelowi lepiej zrozumieć pożądany rezultat.

### Automatyzacja generowania nagłówków

Proces jest w pełni zautomatyzowany przy użyciu arkusza Google Sheets oraz platformy Make.com. Poniżej przedstawiono kroki konfiguracji.

#### Krok 1: Przygotowanie arkusza Google

Do arkusza z poprzedniej lekcji dodawane są nowe kolumny:

- `Nagłówki rozbudowane`
- `Nagłówki H2`
- `Nagłówki jako pytania`
- `Status - Nagłówki` (do sterowania automatyzacją tego etapu)

#### Krok 2: Konfiguracja scenariusza w Make.com

Tworzony jest nowy scenariusz, który wykonuje następujące czynności:

1. **Wyzwalacz (Trigger):** Scenariusz uruchamia się, gdy w kolumnie `Status - Nagłówki` pojawi się wartość **"generuj"**.
2. **Filtr logiczny:** Dodano warunek sprawdzający, czy komórka z frazą kluczową nie jest pusta (`exist`). To zabezpieczenie zapobiega błędom, gdy scenariusz próbuje uruchomić się dla już przetworzonego lub pustego wiersza.
3. **Pobranie danych i wywołanie API:** Scenariusz pobiera dane wejściowe z wiersza (m.in. frazę kluczową i graf informacji z poprzedniego etapu), a następnie wysyła je do odpowiedniego workflow w Dify poprzez API.
4. **Aktualizacja arkusza:** Po otrzymaniu odpowiedzi z Dify, scenariusz wkleja trzy wygenerowane zestawy nagłówków do odpowiednich kolumn w arkuszu i zmienia status w kolumnie `Status - Nagłówki` na **"gotowe"**.

#### Krok 3: Wprowadzenie etapu weryfikacji

Na końcu prowadzący dodaje kolejną kolumnę statusu: `Status - Generacja`. Jej celem jest stworzenie manualnego punktu kontrolnego.

Po wygenerowaniu nagłówków i otrzymaniu statusu "gotowe", użytkownik może je przejrzeć, dokonać edycji lub usunąć niechciane elementy. Dopiero po tej weryfikacji ręcznie zmienia status w kolumnie `Status - Generacja` na "generuj", co uruchomi kolejny, ostatni etap procesu: pisanie treści artykułu.

---

<div id="sensai-comments"></div>


---

# Budowa bazy wiedzy (RAG)

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-5"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/0d35c7fc-240b-4977-8ffc-4bb57f6a61f8?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja przeprowadzi Cię przez proces tworzenia bazy wiedzy w modelu RAG (Retrieval-Augmented Generation). Celem jest przygotowanie precyzyjnych, podzielonych na fragmenty danych (tzw. "chunking"), które posłużą sztucznej inteligencji do generowania merytorycznych i zgodnych z faktami treści. Takie podejście znacząco minimalizuje ryzyko wystąpienia halucynacji w generowanych tekstach.

## 📥 Materiały do pobrania


  
  


## 📝 Notatka z lekcji

### Strategia budowy wiedzy: precyzja i kontekst

Proces opiera się na dwóch rodzajach wiedzy pozyskiwanej z internetu na podstawie wcześniej przygotowanych nagłówków:

- **Wiedza dokładna:** Polega na bezpośrednim znalezieniu odpowiedzi na pytania zawarte w Twoich nagłówkach. AI otrzymuje zadanie, aby dla każdego nagłówka (np. "Jakie funkcje pełni kortyzol?") znaleźć i sformułować konkretną, dopasowaną odpowiedź.
- **Wiedza ogólna:** W tym podejściu dajemy AI więcej swobody. Na podstawie całego zebranego materiału, model sam decyduje, jakie dodatkowe pytania warto zadać i na nie odpowiada. To pozwala wzbogacić treść o istotne konteksty i informacje, których mogliśmy nie przewidzieć w strukturze nagłówków.

### Jak ręcznie zbudować bazę wiedzy RAG w Dify

Zanim przejdziemy do automatyzacji, warto zrozumieć proces, wykonując go ręcznie. Pozwoli to lepiej poznać mechanizmy działania platformy Dify.

#### Krok 1: Wygenerowanie pliku z wiedzą

Pierwszym krokiem jest uruchomienie w Dify przepływu pracy (workflow), który przeszukuje internet, zbiera treści z najlepszych wyników, a następnie na ich podstawie generuje dwa zestawy pytań i odpowiedzi (dokładne i ogólne). Wynikiem tego procesu jest plik tekstowy (np. `kortyzol_rag.txt`), w którym każda para pytanie-odpowiedź jest oddzielona specjalnym separatorem (w tym przypadku znakiem `###`).

#### Krok 2: Tworzenie nowej bazy wiedzy

W panelu Dify przejdź do sekcji **Wiedza**. Kliknij przycisk "Utwórz wiedzę", a następnie wybierz opcję importu danych z pliku tekstowego.

#### Krok 3: Konfiguracja importu danych

Po wybraniu pliku `.txt` należy skonfigurować sposób jego przetwarzania:

- **Separator bloków:** Ustaw separator, który został zdefiniowany w prompcie, czyli `###`. Dzięki temu Dify prawidłowo podzieli tekst na osobne fragmenty (chunki).
- **Pozostałe opcje:** Ustaw maksymalną długość bloku (np. 450-500 tokenów, co odpowiada ok. 2000 znaków) i pozostaw resztę ustawień domyślnych.

#### Krok 4: Ustawienia zaawansowane bazy wiedzy

Po załadowaniu fragmentów, Dify rozpocznie ich indeksowanie. W tym momencie należy skonfigurować kluczowe parametry bazy wiedzy:

- **Jakość wektoryzacji:** Zawsze wybieraj opcję **wysokiej jakości**, aby zapewnić najlepsze wyniki.
- **Tryb wyszukiwania:** Wybierz **wyszukiwanie hybrydowe**. Ten tryb, oprócz standardowego wyszukiwania wektorowego, wykorzystuje model typu "reranker", który dodatkowo analizuje i szereguje wyniki, aby znaleźć najbardziej trafne fragmenty.
- **Model rerankera:** Z listy wybierz model `base-multimodal-reranker-generic`.

#### Krok 5: Testowanie bazy wiedzy

Skorzystaj z wbudowanego przycisku **Testowanie**. Wpisz dowolny nagłówek ze swojego planu (nawet jeśli jego forma jest nieco inna niż w bazie), a system pokaże, które fragmenty wiedzy zostały uznane za najbardziej pasujące. To doskonały sposób, aby zobaczyć reranking w akcji.

### Automatyzacja budowy RAG za pomocą Make.com

Ręczne tworzenie bazy jest pouczające, ale celem jest pełna automatyzacja. Poniższe kroki pokazują, jak skonfigurować scenariusz w Make, który wykona cały proces za Ciebie.

#### Krok 1: Przygotowanie scenariusza w Make

Stwórz nowy scenariusz w Make, który będzie uruchamiany, gdy w arkuszu Google w kolumnie statusu (np. kolumna **N**) pojawi się wartość **"generuj"**. Scenariusz powinien pobierać z danego wiersza słowo kluczowe, język oraz listę nagłówków do generacji.

#### Krok 2: Wywołanie przepływu pracy w Dify

Dodaj moduł API Dify, aby wywołać workflow generujący wiedzę. Skonfiguruj go, przesyłając w ciele zapytania (JSON) pobrane wcześniej dane: `keyword`, `language` i `headings`. Pamiętaj, aby użyć klucza API z odpowiedniej aplikacji w Dify.

#### Krok 3: Wywołanie API bazy wiedzy Dify

Po otrzymaniu odpowiedzi z pierwszego modułu (zawierającej wiedzę dokładną i ogólną), dodaj nowy moduł **HTTP > Make a request**. Będzie on odpowiedzialny za dodanie wygenerowanej treści do Twojej bazy wiedzy w Dify.

- **URL:** Skonstruuj adres URL do API wiedzy. Znajdziesz go w dokumentacji Dify. Musi on zawierać **Dataset ID** Twojej bazy wiedzy. ID to znajdziesz w adresie URL, gdy otworzysz swoją bazę wiedzy w panelu Dify.
- **Metoda:** `POST`
- **Headers:** Dodaj nagłówek autoryzacji: `Authorization` z wartością `Bearer [KLUCZ_API_WIEDZY]`. Klucz ten jest inny niż klucz aplikacji i znajdziesz go w ustawieniach API w sekcji "Wiedza".
- **Body:** Prześlij treść w formacie JSON. Musi ona zawierać co najmniej dwa parametry: `name` (np. słowo kluczowe, które posłuży za nazwę dokumentu w bazie) oraz `text` (połączona wiedza ogólna i dokładna z poprzedniego kroku).

> **Ważne:** W udostępnionym szablonie automatyzacji znajdują się gotowe reguły przetwarzania, które zapewniają m.in. użycie trybu hybrydowego i wysokiej jakości wektoryzacji, tak jak w procesie ręcznym.

#### Krok 4: Aktualizacja statusu w Google Sheets

Na końcu scenariusza dodaj moduł, który zaktualizuje status w arkuszu Google (np. w kolumnie **P** na "OK", a w kolumnie **N** na "gotowe"), aby zasygnalizować zakończenie procesu dla danego słowa kluczowego.

## Podsumowanie

Po poprawnym skonfigurowaniu automatyzacji, cały proces budowy bazy wiedzy RAG będzie odbywał się bez Twojej ingerencji. Wystarczy, że dodasz nowe słowo kluczowe i nagłówki do arkusza oraz ustawisz odpowiedni status. Z tak przygotowaną bazą jesteśmy gotowi na kolejny etap: przygotowanie briefu do generacji treści.

---

<div id="sensai-comments"></div>


---

# Przygotowanie briefu do generacji treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-6"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/972e4a53-0468-4755-a530-663564a32316?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja pokazuje, jak przygotować szczegółowy brief dla sztucznej inteligencji. Celem jest precyzyjne sterowanie procesem generacji treści, aby uzyskać jak najwyższą jakość tekstu. Zamiast tworzyć cały artykuł za jednym razem, proces jest dzielony na mniejsze, zarządzalne etapy — generowanie treści nagłówek po nagłówku.

## 📥 Materiały do pobrania


  


## 📝 Notatka z lekcji

### Dlaczego brief jest kluczowy?

Sztuczna inteligencja działa na zasadzie prawdopodobieństwa. Aby uzyskać spójny i merytoryczny tekst, musimy precyzyjnie określić, co ma zostać wygenerowane w każdym kroku. Dzielenie procesu na mniejsze części, takie jak generowanie osobnych akapitów dla każdego nagłówka, minimalizuje ryzyko błędów i "zapominania" o istotnych informacjach przez model językowy. Proces ten przypomina przygotowywanie wytycznych dla profesjonalnego copywritera.

### Elementy potrzebne do stworzenia briefu

Do wygenerowania kompletnego briefu konieczne jest zebranie i wykorzystanie następujących danych z Twojego pliku roboczego:

- **Wszystkie słowa kluczowe:** Pełna lista fraz kluczowych z Google, które mają zostać użyte w artykule.
- **Nagłówki (Headings):** Struktura artykułu w postaci nagłówków, dla których w poprzednim kroku przygotowano bazę wiedzy (RAG).
- **Knowledge Graph:** Graf wiedzy zapewniający szeroki obraz tematu i relacji między pojęciami.
- **Information Graph:** Graf informacji, który dostarcza dodatkowego kontekstu i szczegółów, uzupełniając wiedzę z bazy RAG.

> **Wskazówka:** Celowo wykorzystuje się dane z różnych źródeł (RAG, Knowledge Graph, Information Graph), aby zapewnić modelowi AI jak najszerszą perspektywę i zminimalizować ryzyko pominięcia ważnych informacji.

### Struktura wygenerowanego briefu

Wynikiem procesu jest precyzyjny brief dla każdego nagłówka, który zawiera trzy kluczowe elementy:

- **Nagłówek:** Wskazuje konkretny fragment tekstu, który ma zostać w danym momencie wygenerowany (np. "Co to jest kortyzol?").
- **Wiedza do zawarcia:** Informacje pochodzące z `Information Graph` i `Knowledge Graph`, które muszą znaleźć się w danym segmencie tekstu.
- **Słowa kluczowe:** Konkretne frazy, które muszą zostać użyte w treści pod danym nagłówkiem.

### Automatyzacja procesu w Make

Proces tworzenia briefu jest dodawany jako kolejny krok do istniejącej automatyzacji, która budowała bazę wiedzy RAG. Poniżej przedstawiono, jak to skonfigurować.

#### Krok 1: Dodanie modułu API do Dify

W istniejącym scenariuszu Make, po module generującym RAG, dodaj nowy moduł API. Nazwij go "Brief" i wklej swój klucz API do **Dify**.

#### Krok 2: Konfiguracja danych wejściowych (JSON)

W module "Brief" należy przygotować strukturę danych w formacie JSON, która zostanie wysłana do Dify. Musi ona zawierać wszystkie wymagane elementy. Pamiętaj, aby zmapować odpowiednie zmienne z poprzednich modułów w Make.

Dane wejściowe powinny zawierać:

- `keyword`: Główne słowo kluczowe.
- `frazy`: Wszystkie słowa kluczowe pobrane z wyników wyszukiwania.
- `headings`: Lista wszystkich nagłówków artykułu.
- `knowledge_graph`: Dane z grafu wiedzy.
- `information_graph`: Dane z grafu informacji.

> **Wskazówka:** Jeśli nowo dodane zmienne (np. `frazy`) nie są od razu widoczne w panelu mapowania, zapisz scenariusz i odśwież okno przeglądarki.

#### Krok 3: Uruchomienie testowe i obsługa wyników

Uruchom scenariusz raz, aby Make "nauczył się" struktury danych wyjściowych z modułu Dify. Wynikiem działania modułu "Brief" będą dwie części: właściwy brief w formie tekstowej oraz jego wersja w formacie `.html`.

#### Krok 4: Zapisywanie wyników w Google Sheets i Google Drive

Aby w pełni zautomatyzować proces i archiwizować wyniki, dodaj kolejne moduły w Make:

1. **Zapisz brief tekstowy:** Użyj modułu Google Sheets, aby zapisać wygenerowany brief tekstowy w odpowiedniej kolumnie arkusza (w przykładzie jest to kolumna **Q**).
2. **Stwórz plik HTML:** Dodaj moduł Google Docs z akcją "Create Document". Jako treść dokumentu przekaż dane HTML otrzymane z Dify. Nazwij plik, używając np. numeru wiersza i słowa kluczowego, aby łatwo go zidentyfikować.
3. **Zapisz link do pliku:** Na koniec, w module Google Sheets, zapisz link do nowo utworzonego dokumentu Google (`web view link`) w dedykowanej kolumnie (w przykładzie — **R**).

## Podsumowanie

Po wykonaniu tych kroków proces jest w pełni zautomatyzowany. Dla każdego tematu generowany jest nie tylko brief tekstowy zapisany w arkuszu, ale także gotowy do udostępnienia plik HTML na Dysku Google. Z tak przygotowanym materiałem można przejść do finalnego etapu, czyli generowania treści artykułu.

---

<div id="sensai-comments"></div>


---

# Generowanie i humanizacja

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-7"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/37b0b5a3-2154-4e08-8d42-c81c3f7b1848?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja to kulminacyjny moment procesu tworzenia treści. Łączymy w niej wszystkie wcześniej przygotowane elementy – brief, bazę wiedzy RAG i strukturę artykułu – aby wygenerować finalny tekst, a następnie poddać go procesowi humanizacji. Celem jest uzyskanie treści, która będzie nie tylko merytoryczna i zoptymalizowana pod kątem maszyn (wyszukiwarek, AI Overview), ale przede wszystkim naturalna i czytelna dla człowieka.

## 📥 Materiały do pobrania


  
  


## 📝 Notatka z lekcji

### Logika procesu: generacja nagłówek po nagłówku

Podstawową zasadą jest generowanie treści dla jednego nagłówka na raz. Takie podejście pozwala na precyzyjne zarządzanie kontekstem i jakością, minimalizując ryzyko powtórzeń i halucynacji, które często pojawiają się przy próbie generowania całego artykułu za jednym razem. Aby proces przebiegł poprawnie, dla każdego generowanego nagłówka przekazujemy do AI komplet informacji:

- **Obecny nagłówek:** Konkretny fragment, nad którym aktualnie pracuje AI.
- **Wiedza z briefu:** Dane przeznaczone specjalnie dla tego nagłówka.
- **Frazy kluczowe:** Słowa kluczowe, które muszą znaleźć się w tej sekcji.
- **Cały plan artykułu:** Pełna lista wszystkich nagłówków, aby AI rozumiała strukturę i kontekst całego tekstu.
- **Wygenerowana treść (Done):** Tekst stworzony dla poprzednich nagłówków, co zapobiega powtórzeniom i utrzymuje spójność stylu.
- **Główny temat (Keyword):** Makrokontekst całego artykułu, który nadaje kierunek całej treści.
- **Dodatkowe instrukcje:** Wszelkie niestandardowe wytyczne, np. dotyczące stylu marki (brand voice).

### Sześcioetapowy przepływ pracy w Dify

Generowanie jednego fragmentu tekstu to złożony, wieloetapowy proces, który ma na celu zapewnienie najwyższej jakości. Poniżej przedstawiono jego kluczowe kroki.

#### Krok 1: Wzbogacenie wiedzy z bazy RAG

Oprócz wiedzy z briefu, system dodatkowo odpytuje wcześniej zbudowaną bazę wiedzy RAG. Dzięki temu AI korzysta z dwóch niezależnych, ale spójnych źródeł, co dodatkowo zwiększa merytoryczną poprawność i ogranicza ryzyko błędów.

#### Krok 2: Główna generacja treści

To serce całego procesu. Na podstawie wszystkich dostarczonych danych AI tworzy pierwszą wersję tekstu dla danego nagłówka. Kluczowe są tu dwie grupy instrukcji w prompcie:

- **Reguły językowe:** Precyzyjnie definiują zasady gramatyki, interpunkcji i stylistyki dla konkretnego języka (np. polskiego). Zapobiega to stosowaniu przez AI domyślnych, angloamerykańskich konstrukcji, co jest częstą przyczyną "sztucznego" brzmienia tekstu.
- **Reguły pisania treści:** Zestaw wytycznych dotyczących tworzenia treści zwięzłych, konkretnych i łatwych do przyswojenia. Obejmują one m.in. umieszczanie najważniejszych informacji na początku, unikanie niejednoznaczności i słów-wypełniaczy oraz stosowanie krótkich, prostych zdań.

#### Krok 3: Weryfikacja i spójność (Proofreading)

Ten krok jest wykonywany dla drugiego i każdego kolejnego nagłówka. AI wciela się w rolę redaktora, porównując nowo powstały fragment z treścią wygenerowaną wcześniej. Sprawdza, czy nie ma powtórzeń, czy styl jest spójny i czy zachowany jest logiczny przepływ między sekcjami.

#### Krok 4: Humanizacja (Perplexity i czytelność)

Na tym etapie poprawiamy tekst pod kątem jego odbioru przez człowieka i maszynę. Nie chodzi o omijanie detektorów, ale o optymalizację czytelności.

- **Perplexity (przewidywalność):** Dążymy do niskiego perplexity, co oznacza, że tekst jest spójny i logiczny. Ułatwia to maszynom (np. Google) jego przetworzenie, co jest kompromisem, gdyż może zwiększać "wykrywalność" tekstu jako pisanego przez AI.
- **Burstiness (zmienność):** Zwiększamy "wybuchowość" tekstu poprzez różnicowanie długości i struktury zdań, co czyni go bardziej naturalnym dla ludzkiego czytelnika.
- **Skala Flesch-Kincaid:** Stosujemy tę metrykę, aby upewnić się, że tekst jest łatwy w odbiorze dla docelowej grupy czytelników.

#### Krok 5: Humanizacja (Semantyka leksykalna)

Dalsze "uczłowieczanie" tekstu. AI otrzymuje polecenie, aby używać synonimów, jeszcze bardziej różnicować strukturę zdań i łączyć powtarzające się informacje w jedno, zwięzłe stwierdzenie.

#### Krok 6: Finalne formatowanie

Ostatni etap to nadanie tekstowi ostatecznej, czytelnej formy. AI dodaje formatowanie HTML, takie jak poprawnie skonstruowane listy (`<ul>`, `<ol>`) zgodne z polskimi zasadami pisowni oraz pogrubienia (`<strong>`) dla najważniejszych fraz.

## Podsumowanie

Przedstawiony proces, choć skomplikowany, jest niezbędny do tworzenia treści, która może konkurować o najwyższe pozycje w wyszukiwarkach i być wartościowa dla czytelników. To świadomy kompromis między pisaniem dla ludzi a optymalizacją pod maszyny. W kolejnej lekcji zajmiemy się pełną automatyzacją tego wieloetapowego procesu generacji.

---

<div id="sensai-comments"></div>


---

# Automatyzacja procesu generowania treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-8"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/3fec50f8-7428-40f7-9125-373ec12e2301?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja przedstawia ostatni, najbardziej zaawansowany element całego procesu: w pełni zautomatyzowane generowanie kompletnego artykułu na podstawie przygotowanego wcześniej planu nagłówków. Krok po kroku omówimy logikę stojącą za scenariuszem w platformie Make.com, który tworzy treść, paragraf po paragrafie, i zapisuje ją w pliku Google Docs.

Kompletny, gotowy do importu scenariusz automatyzacji jest dostępny w materiałach do pobrania oraz na GitHubie.

## 📥 Materiały do pobrania


  
  


## 📝 Notatka z lekcji

### Logika automatyzacji w Make.com

Scenariusz jest złożony, ale jego działanie opiera się na kilku kluczowych modułach i koncepcjach. Oto jego budowa krok po kroku:

#### 1. Wyzwalacz i przygotowanie danych

- **Start procesu:** Automatyzacja uruchamia się, gdy w kolumnie `T` arkusza Google Sheets dla danego wiersza zostanie ustawiony status **"generuj"**.
- **Przetwarzanie danych wejściowych (JSON):** Scenariusz pobiera dane z arkusza (w tym listę nagłówków w formacie JSON). Ponieważ Make.com wymaga specyficznej struktury danych do iteracji, dane te są konwertowane dwukrotnie: najpierw z formatu JSON na obiekt (*bundle*), a następnie na tablicę (*array*), która może być użyta w kolejnych modułach.

#### 2. Utworzenie pliku docelowego

Jeszcze przed rozpoczęciem generowania treści, scenariusz tworzy pusty plik w Google Drive. Nazwa pliku jest generowana dynamicznie i zawiera słowo kluczowe, co ułatwia identyfikację. To w tym pliku będą zapisywane kolejne akapity artykułu.

#### 3. Zarządzanie kontekstem za pomocą Data Store

To najważniejszy mechanizm w całej automatyzacji, który pozwala na zachowanie kontekstu między generowaniem kolejnych paragrafów.

- **Czym jest Data Store:** Jest to mała, wewnętrzna baza danych w Make.com, która służy do tymczasowego przechowywania informacji.
- **Czyszczenie bazy:** Na początku każdego uruchomienia scenariusza, Data Store jest całkowicie czyszczony. Zapobiega to przenoszeniu kontekstu z poprzednio generowanych artykułów (np. informacji o kortyzolu do artykułu o progesteronie).
- **Pobieranie poprzedniej treści:** W trakcie generowania każdego nowego akapitu, scenariusz odczytuje z Data Store całą treść wygenerowaną do tej pory.
- **Aktualizacja bazy:** Po wygenerowaniu nowego akapitu, Data Store jest ponownie czyszczony, a następnie zapisywana jest w nim zaktualizowana, pełna treść artykułu (stara treść + nowo dodany akapit).

> **Ważna instrukcja:** Aby ten proces zadziałał, musisz w swoim koncie Make.com **stworzyć własny Data Store** i dodać w nim jedno pole tekstowe o nazwie `content`. Bez tego automatyzacja napotka błąd.

#### 4. Iteracja, generowanie i zapisywanie

Sercem procesu jest iterator, który wykonuje pętlę dla każdego nagłówka z przygotowanej listy.

1. **Pętla po nagłówkach (Iterator):** Moduł pobiera listę nagłówków i dla każdego z nich po kolei wykonuje serię działań.
2. **Wywołanie API Deefai:** Dla każdego nagłówka wysyłane jest zapytanie do workflow w Deefai. Co kluczowe, oprócz samego nagłówka, przekazywana jest również pełna treść wygenerowana do tej pory (pobrana z Data Store), aby AI miało kontekst i mogło napisać spójny akapit.
3. **Dopisywanie paragrafu do pliku:** Zamiast tworzyć plik na końcu, scenariusz używa modułu **Insert a paragraph to a document**. Dzięki temu po każdej iteracji nowy akapit jest natychmiast dopisywany do istniejącego pliku Google Doc.

#### 5. Zakończenie procesu

Po zakończeniu wszystkich iteracji, scenariusz wkleja link do gotowego pliku w odpowiedniej kolumnie arkusza i zmienia status na **"gotowe"**.

#### Ograniczenie procesu – ważna uwaga

Należy pamiętać, że scenariusz zmienia status w arkuszu na "gotowe" i wkleja link do pliku niemal natychmiast po uruchomieniu. Jednak faktyczne generowanie treści trwa znacznie dłużej, ponieważ każdy akapit wymaga osobnego wywołania API. Obserwuj tworzony plik w Google Docs, aby śledzić postępy w generowaniu artykułu na żywo.

## Podsumowanie

Dzięki tej automatyzacji otrzymujesz kompletny, gotowy do publikacji artykuł, stworzony w sposób ustrukturyzowany i kontekstowy. Zachęcamy do eksperymentowania i rozbudowy tego workflow!

---

<div id="sensai-comments"></div>


---

# Audyt contentu

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/fRruWTwy4FpPi9LJ08T93RIxHpA.png?width=144&height=168" alt="Robert Niechciał" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Robert Niechciał</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="praca-z-trescia/lekcja-9"></div>
</div>

<div style="position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem;">
  <iframe src="https://player.mediadelivery.net/embed/565073/c41c38a8-7b56-4d6e-b966-a4183a961523?autoplay=false&loop=false&muted=false&preload=true&responsive=true" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>
</div>

## 🎯 Cel lekcji

Ta lekcja, podsumowująca tydzień pracy, koncentruje się na niezwykle ważnym procesie: audycie i optymalizacji istniejącego contentu. W dobie AI Overview i semantycznego wyszukiwania, wiele starszych treści na naszych stronach może (i powinno) performować znacznie lepiej. Dowiesz się, jak wykorzystać zaawansowane modele AI do analizy i ulepszenia pojedynczych jednostek treści.

## 📥 Materiały do pobrania


  
  


## 📝 Notatka z lekcji

### Dlaczego audyt treści jest kluczowy w dobie AI?

Google, na potrzeby syntezy odpowiedzi w AI Overview i AI Mode, aktywnie poszukuje i ekstrahuje wiedzę w formie faktów i trójników semantycznych. Algorytmy znacznie lepiej oceniają treści, które w pełni wyczerpują dany temat, pokrywając wszystkie kluczowe konteksty i perspektywy. Audyt pozwala zidentyfikować braki w naszych istniejących artykułach i dostosować je do tych nowych wymagań, zamiast tworzyć wszystko od zera.

**Zakres audytu:** W tej lekcji skupiamy się na audycie semantycznym pojedynczej jednostki treści, a nie na ogólnym audycie SEO całej strony (np. thin content, kanibalizacja).

### Rola modeli reasoningowych w audycie

W przeciwieństwie do generowania treści, gdzie można używać różnych modeli, proces audytu opiera się niemal w całości na **modelach reasoningowych** (wnioskujących). Jest to kluczowe, ponieważ audyt to zadanie polegające na **porównywaniu i analizie**:

- Porównujemy istniejący artykuł z szerokim korpusem wiedzy (grafem informacji i wiedzy) reprezentującym "konsensus" internetu.
- Identyfikujemy luki informacyjne, brakujące encje i nieobecne nagłówki.
- Model musi "zrozumieć" i wyciągnąć wnioski, czego brakuje i jak to naprawić.

### Proces audytu krok po kroku

Przygotowany workflow w **Dify** przeprowadza kompleksową analizę, której celem jest przygotowanie konkretnych wytycznych do optymalizacji. Poniżej przedstawiono jego etapy.

#### 1. Dane wejściowe

Do rozpoczęcia procesu potrzebujemy:

- **Słowo kluczowe:** Główna fraza, na którą optymalizowany jest artykuł.
- **Język.**
- **Adres URL:** Link do istniejącego artykułu, który poddajemy audytowi.
- **Zasoby wiedzowe:** Graf informacji, lista fraz kluczowych i graf wiedzy wygenerowane w pierwszym etapie tego tygodnia.

#### 2. Analiza braków (Gap Analysis)

Workflow uruchamia kilka równoległych procesów analitycznych:

- **Brakujące informacje:** AI porównuje treść Twojego artykułu z grafem wiedzy i informacji, aby zidentyfikować kluczowe fakty i konteksty, które zostały pominięte.
- **Brakujące frazy kluczowe:** System weryfikuje, których istotnych fraz (zidentyfikowanych na podstawie analizy SERP i AI Overview) brakuje w Twoim tekście.
- **Propozycje nowych nagłówków:** Na podstawie zidentyfikowanych braków informacyjnych i słów kluczowych, AI proponuje nowe nagłówki, które pozwolą rozbudować artykuł i lepiej pokryć temat.

#### 3. Generowanie finalnego raportu

To najważniejszy krok, w którym model reasoningowy zbiera wszystkie powyższe analizy (brakujące informacje, frazy, nagłówki) i tworzy jedno, spójne podsumowanie w ustrukturyzowanej formie (JSON). Następnie, w ostatnim kroku, te dane są przekształcane w czytelny raport HTML.

### Co zawiera finalny raport optymalizacyjny?

Wynikiem całego procesu jest gotowy do użycia dokument, który zawiera:

- **Podsumowanie:** Krótka analiza, co obecny artykuł już zawiera i jakie są jego główne braki.
- **Nagłówki do dodania:** Lista nowych nagłówków wraz z wytycznymi, jakie informacje i słowa kluczowe powinny się w nich znaleźć.
- **Nagłówki do edycji:** Sugestie, jak poprawić i uzupełnić istniejące już w artykule nagłówki, aby lepiej odpowiadały na zapytania użytkowników i wymogi semantyczne.
- **Listę brakujących słów kluczowych**, które warto wpleść w treść.

### Automatyzacja i dalszy rozwój

Cały proces został zautomatyzowany w Make.com i jest dostępny w arkuszu Google w nowej zakładce **"Audyt"**. Wystarczy podać wymagane dane, zmienić status na "generuj", a system sam przeprowadzi analizę i umieści wyniki, w tym gotowy raport HTML, w odpowiednich komórkach.

**Jak możesz ulepszyć ten proces?**

- **Zwiększ ilość danych:** Zbuduj bazę wiedzy na podstawie większej liczby źródeł, aby uzyskać pełniejszy obraz tematu.
- **Testuj modele reasoningowe:** Eksperymentuj z różnymi modelami lub ustawieniami (np. "Reasoning Effort" w modelach OpenAI), aby uzyskać jeszcze bardziej wnikliwe analizy.

## Podsumowanie

Mam nadzieję, że ten gotowy proces audytowy będzie dla Ciebie niezwykle przydatnym narzędziem w optymalizacji treści w 2025 roku.

---

<div id="sensai-comments"></div>
