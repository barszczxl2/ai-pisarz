# Optymalizacja treści pod AI - kluczowe pojęcia i procesy

## Podstawowe pojęcia

**Tytułem przypomnienia**, w tym kursie będziemy zamiennie używać dwóch pojęć:

> **Knowledge Graph**: "Big Picture", czyli holistyczne spojrzenie na temat, jego strukturę i wzajemne powiązania między encjami.

> **Information Graph**: Głęboka wiedza na dany temat, szczegółowe informacje i fakty.

## Budowa i struktura jednostki treści

Każdy artykuł, który będziemy tworzyć, zostanie zbudowany w oparciu o precyzyjną strukturę, kluczową dla zrozumienia go zarówno przez użytkowników, jak i przez algorytmy AI.

- **Makrokontekst** (góra treści): Najważniejsze informacje muszą znaleźć się na samej górze. Zawsze zaczynamy od definicji głównej encji artykułu oraz jej kluczowych atrybutów.

- **Mikrokontekst** (dół treści): Ta część zawiera dodatkowe perspektywy i odpowiedzi na bardziej szczegółowe, długie pytania (long-tail). Dzięki temu treść ma szansę zostać wykorzystana przez AI do syntezy odpowiedzi na szeroki zakres zapytań użytkowników.

## Odtworzenie procesu Google AI Overview (RAG)

W tym kursie odtworzymy proces bardzo zbliżony do tego, jakiego używa Google do generowania odpowiedzi w AI Overview. Ten proces, znany jako **Retrieval-Augmented Generation (RAG)**, składa się z kilku etapów:

1. **Gromadzenie wiedzy**: Wyszukiwanie informacji w internecie – ze stron z Top 10, źródeł użytych w AI Overview oraz potencjalnie z dodatkowych źródeł znalezionych dzięki technice Query Expansion.

2. **Dzielenie danych (Data Chunking)**: Zebrana wiedza jest dzielona na małe, konkretne fragmenty (snippety), podobnie jak robi to Google.

3. **Wyszukiwanie i generowanie (RAG)**: Dla każdego nagłówka w naszym artykule będziemy przeszukiwać naszą bazę wiedzy (stworzoną z tych fragmentów), aby znaleźć najbardziej dopasowane informacje. Zostaną one następnie użyte do wygenerowania spójnego i merytorycznego akapitu.

4. **Humanizacja i formatowanie**: Ostatni etap to weryfikacja, nadanie treści naturalnego brzmienia i odpowiednie sformatowanie.

## Kluczowe techniki optymalizacji

Aby tworzone przez nas treści były jak najwyższej jakości i miały największe szanse na zaistnienie w wynikach AI, wykorzystamy dwie zaawansowane koncepcje.

### 1. Modele rerankingowe

Google, aby wybrać najlepsze fragmenty do syntezy AI Overview, musi ocenić ich trafność (relevance). Robi to za pomocą modeli rerankingowych. My zastosujemy dokładnie tę samą metodę, aby wybrać najlepsze fragmenty wiedzy do nasycenia naszego artykułu. Dzięki temu strony, które nie znajdują się w Top 10, ale zawierają idealnie dopasowaną informację, mogą zostać wykorzystane w syntezie.

### 2. Wykorzystanie "Reasoning Gap"

To jedna z największych szans w optymalizacji treści. Treści konkurencji, z których AI czerpie wiedzę, mogą być niekompletne lub niskiej jakości. Prowadzi to do **"luk w rozumowaniu" (Reasoning Gap)**, gdzie model AI halucynuje lub udziela banalnych odpowiedzi (np. "samochód to w języku polskim samochód"). 

Naszym celem jest tworzenie tak kompletnych i dobrze zoptymalizowanych treści, aby wypełniały te luki, stając się najlepszym i najbardziej trafnym źródłem dla AI.