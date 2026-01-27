# AI Pisarz - Dokumentacja dla Claude

## Opis projektu

AI Pisarz to aplikacja Next.js do automatycznego generowania treści SEO. Wykorzystuje Dify (self-hosted) jako silnik workflow'ów AI oraz Supabase jako bazę danych.

## Stack technologiczny

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Baza danych:** Supabase (self-hosted na Hetzner)
- **AI Workflows:** Dify (self-hosted, port 80)
- **API zewnętrzne:** SerpData.io (wyszukiwanie SERP), Jina AI (embeddings & web scraping)
- **Wizualizacja:** Canvas API (grafy Neo4j)
- **Graf bazy:** Neo4j (Community Edition lub Aura)

## Konfiguracja (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-xxx.sslip.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Dify
DIFY_API_BASE_URL=http://localhost/v1
DIFY_KNOWLEDGE_WORKFLOW_KEY=app-xxx
DIFY_HEADERS_WORKFLOW_KEY=app-xxx
DIFY_RAG_WORKFLOW_KEY=app-xxx
DIFY_BRIEF_WORKFLOW_KEY=app-xxx
DIFY_CONTENT_WORKFLOW_KEY=app-xxx

# SerpData
SERPDATA_API_KEY=xxx
SERPDATA_BASE_URL=https://api.serpdata.io/v1

# Jina AI (Embeddings dla wyszukiwania semantycznego)
JINA_API_KEY=jina_...

# Ollama Cloud (Vision API dla OCR gazetek)
OLLAMA_API_URL=https://ollama.com/v1
OLLAMA_API_KEY=xxx
OLLAMA_VISION_MODEL=qwen3-vl:235b-instruct

# Neo4j (Graf semantyki)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
```

---

## Graf Semantyki - Neo4j (/semantyka)

Strona `/semantyka` oferuje wizualizację grafu powiązań między trendami Google, artykułami i domenami źródłowymi. Dane są synchronizowane z Supabase do Neo4j.

### Architektura:
```
Supabase (rrs_google_trends)
       ↓
[Python] scripts/neo4j_sync.py
       ↓
Neo4j (graf relacji)
       ↓
[API] /api/neo4j/query
       ↓
[UI] GraphViewer (Canvas API)
```

### Schema grafu Neo4j:

**Węzły (Nodes):**
- `Keyword` - słowo kluczowe z Google Trends (kolor: #F79767)
- `Article` - artykuł powiązany z trendem (kolor: #6DCE9E)
- `Domain` - domena źródłowa artykułu (kolor: #FF756E)
- `TrendSnapshot` - migawka trendu w czasie (kolor: #A5ABB6)

**Relacje (Relationships):**
- `HAS_TREND` - Keyword → TrendSnapshot
- `HAS_ARTICLE` - Keyword → Article
- `PUBLISHED_ON` - Article → Domain
- `RELATED_TO` - Keyword ↔ Keyword (na podstawie wspólnych domen)

### Pliki:
| Plik | Opis |
|------|------|
| `src/app/(dashboard)/semantyka/page.tsx` | Główna strona z grafem |
| `src/components/neo4j/GraphViewer.tsx` | Komponent wizualizacji (Canvas API) |
| `src/app/api/neo4j/query/route.ts` | API proxy do Neo4j |
| `scripts/neo4j_sync.py` | Skrypt synchronizacji Supabase → Neo4j |
| `scripts/requirements.txt` | Zależności Python |
| `scripts/.env.example` | Przykładowa konfiguracja |

### Synchronizacja danych:
```bash
# Instalacja zależności
cd ai-pisarz/scripts
pip install -r requirements.txt

# Konfiguracja
cp .env.example .env
# Uzupełnij wartości w .env

# Uruchomienie synchronizacji
python neo4j_sync.py
```

### Przykładowe zapytania Cypher:
```cypher
-- Trendy z ostatniego tygodnia
MATCH (k:Keyword)-[:HAS_TREND]->(t:TrendSnapshot)
WHERE t.date >= date() - duration('P7D')
RETURN k, t

-- Top 10 domen
MATCH (d:Domain)<-[:PUBLISHED_ON]-(a:Article)
RETURN d.name, count(a) as articles
ORDER BY articles DESC LIMIT 10

-- Graf powiązań dla słowa kluczowego
MATCH path = (k:Keyword {name: "AI"})-[*1..2]-(connected)
RETURN path
```

### Wymagania:
- **Neo4j**: Community Edition (lokalna) lub Neo4j Aura (cloud)
- **Python 3.9+**: Do skryptu synchronizacji
- **Zmienne środowiskowe**: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

---

## Wyszukiwarka Gazetek Promocyjnych (/gazetki)

Strona `/gazetki` oferuje semantyczne wyszukiwanie promocji z gazetek sklepowych (Blix).

### Funkcjonalności:
- **Wyszukiwarka semantyczna** - znajdowanie promocji na podstawie opisu w języku naturalnym
- **Wyniki z podobieństwem** - każdy wynik pokazuje % dopasowania semantycznego
- **Linki do gazetek** - bezpośrednie linki do źródłowych gazetek na Blix.pl
- **Statystyki** - liczba gazetek, embeddingów, unikalnych sklepów

### Pliki:
| Plik | Opis |
|------|------|
| `src/app/(dashboard)/gazetki/page.tsx` | Strona wyszukiwarki gazetek |
| `src/app/api/product-search/route.ts` | API endpoint do wyszukiwania produktów |

### Tabela bazy danych: `rrs_blix_gazetki`

```sql
id              | serial (PK)
item_id         | text (unique) - identyfikator gazetki
title           | text - tytuł gazetki (np. "Gazetka Biedronka - Od poniedziałku")
description     | text - opis z listą promocji
link            | text - URL do gazetki na Blix.pl
pub_date        | timestamptz - data publikacji
context_query   | text - przykładowe zapytania pasujące do tej gazetki
embedding       | vector(1024) - embedding Jina AI
embedding_text  | text - tekst użyty do embeddingu (context_query + description)
fetched_at      | timestamptz
created_at      | timestamptz
```

### Embeddingi:
- Model: `jina-embeddings-v3`
- Wymiary: 1024
- Task (storage): `retrieval.passage`
- Task (query): `retrieval.query`
- Index: HNSW z `vector_cosine_ops`

### Przykładowe zapytania:
- "promocje na mleko"
- "tanie owoce i warzywa"
- "kosmetyki w Lidlu"
- "zabawki dla dzieci"

---

## OCR Gazetek (Vision API)

Funkcjonalność wyciągania produktów i cen z obrazów gazetek promocyjnych przy użyciu Ollama Cloud Vision API.

### Architektura:
```
Obraz strony gazetki (URL)
       ↓
[1] POST /api/ocr-gazetka
       ↓
[2] Ollama Cloud Vision API (mistral-large-3)
       ↓
[3] Parsowanie JSON z produktami
       ↓
[4] (opcjonalnie) Zapis do rrs_blix_products z embeddingiem Jina AI
```

### Konfiguracja (.env.local):
```env
# Ollama Cloud (Turbo $20/mies)
OLLAMA_API_URL=https://ollama.com/v1
OLLAMA_API_KEY=xxx
OLLAMA_VISION_MODEL=qwen3-vl:235b-instruct  # Najlepsza dokładność OCR
```

### Funkcjonalności UI:
- **Automatyczne wykrycie URL Blix** - wklej link do gazetki, system pobierze obrazy
- **Wybór strony** - selektor numeru strony z informacją o łącznej liczbie stron
- **Nawigacja w modalu** - strzałki ← → do przeskakiwania między stronami
- **Siatka kart produktów** - każdy produkt jako osobna karta z obrazkiem
- **Wycinanie obrazków (crop)** - automatyczne wycinanie produktów z gazetki na podstawie bounding boxów
- **Przełącznik widoku** - siatka kart lub tabela z miniaturkami
- **Supabase Storage** - przechowywanie wyciętych obrazków produktów

### Pliki:
| Plik | Opis |
|------|------|
| `src/lib/ollama/client.ts` | Klient Ollama Vision API z bounding boxami |
| `src/app/api/ocr-gazetka/route.ts` | API endpoint do OCR |
| `src/app/api/crop-products/route.ts` | API endpoint do wycinania produktów (Sharp) |
| `src/app/(dashboard)/gazetki/page.tsx` | UI z siatką kart produktów |
| `src/components/gazetki/ProductCard.tsx` | Komponent karty produktu |
| `supabase/migrations/20260125_create_rrs_blix_products.sql` | Migracja tabeli produktów |
| `supabase/migrations/20260125_add_bbox_columns.sql` | Migracja kolumn bbox |

### API Endpoint: `/api/ocr-gazetka`

**POST** - Analizuje obraz gazetki i wyciąga produkty

```typescript
// Request
{
  imageUrl: string;           // URL gazetki Blix.pl lub obrazka
  gazetkaId?: number;         // ID z rrs_blix_gazetki (opcjonalne)
  pageNumber?: number;        // Numer strony gazetki (domyślnie: 1)
  saveToDatabase?: boolean;   // Zapisz do rrs_blix_products (domyślnie: false)
}

// Response
{
  success: boolean;
  products: OCRExtractedProduct[];
  productCount: number;
  pageNumber: number;
  totalPages?: number;        // Łączna liczba stron (gdy URL to gazetka Blix)
  processingTimeMs?: number;
  savedToDatabase: boolean;
  savedCount?: number;
  saveError?: string;
}

// OCRExtractedProduct
{
  name: string;
  brand?: string | null;
  price: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  unit?: string | null;         // "1L", "500g", "1szt"
  category?: string | null;     // nabial, mieso, pieczywo, etc.
  confidence?: number;
  bbox?: [number, number, number, number] | null;  // [x1, y1, x2, y2] bounding box
  cropped_image_url?: string | null;  // URL wyciętego obrazka
}
```

**GET** - Sprawdza konfigurację OCR

### Tabela bazy danych: `rrs_blix_products`

```sql
id               | serial (PK)
gazetka_id       | integer FK -> rrs_blix_gazetki(id)
page_number      | integer
product_name     | text NOT NULL
brand            | text
price            | decimal(10,2)
original_price   | decimal(10,2) - cena przed promocją
discount_percent | integer
unit             | text - jednostka (kg, szt, l)
category         | text - kategoria produktu
image_url        | text - URL obrazka produktu
ocr_confidence   | float - pewność OCR (0-1)
embedding        | vector(1024) - Jina AI embedding
embedding_text   | text - tekst użyty do embeddingu
bbox_x1          | integer - lewy górny X bounding boxa
bbox_y1          | integer - lewy górny Y bounding boxa
bbox_x2          | integer - prawy dolny X bounding boxa
bbox_y2          | integer - prawy dolny Y bounding boxa
cropped_image_url| text - URL wyciętego obrazka w Supabase Storage
created_at       | timestamptz
```

### API Endpoint: `/api/crop-products`

**POST** - Wycina produkty z obrazu gazetki

```typescript
// Request
{
  imageUrl: string;       // URL obrazu źródłowego
  products: [{
    id: string;           // Identyfikator produktu
    bbox: [x1, y1, x2, y2]; // Bounding box w pikselach
  }];
  gazetkaId?: number;
  pageNumber?: number;
}

// Response
{
  success: boolean;
  croppedImages: [{
    id: string;
    imageUrl: string;     // URL w Supabase Storage
    width: number;
    height: number;
  }];
  errors: [{id: string, error: string}];
  processingTimeMs: number;
}
```

**Technologie:**
- **Sharp** - biblioteka do przetwarzania obrazów (server-side)
- **Supabase Storage** - bucket `product-images` do przechowywania wyciętych obrazków
- **Format:** WebP (85% quality) dla oszczędności miejsca

### Kategorie produktów:
- `nabial` - Nabiał
- `mieso` - Mięso
- `pieczywo` - Pieczywo
- `owoce_warzywa` - Owoce i warzywa
- `napoje` - Napoje
- `slodycze` - Słodycze
- `chemia` - Chemia
- `kosmetyki` - Kosmetyki
- `inne` - Inne

### Koszty:
- Ollama Cloud Turbo: $20/mies. (flat rate z limitami)
- Jina embedding (per produkt): ~$0.0001
- Supabase Storage: ~$5/mies. (obrazki produktów)
- Sharp: Open source (0$)

---

## Integracja Dify - Workflow'y

### Architektura pipeline'u

```
Projekt (keyword, language)
    ↓
[WF1] Knowledge Building
    ↓ knowledge_graph, information_graph, search_phrases, competitor_headers
[WF2] Headers Generation
    ↓ 3 typy nagłówków (rozbudowane, h2, pytania)
    ↓ (wybór użytkownika)
[WF3] RAG Creation
    ↓ detailed_qa, general_qa
[WF4] Brief Creation
    ↓ brief_json, brief_html
[WF5] Content Generation (iteracyjnie dla każdej sekcji)
    ↓ content_html
FINAL CONTENT
```

### Wywołanie API Dify

```typescript
POST http://localhost/v1/workflows/run
Headers:
  Authorization: Bearer app-xxxxx
  Content-Type: application/json

Body:
{
  "inputs": { /* dane wejściowe */ },
  "response_mode": "blocking",
  "user": "ai-pisarz"
}
```

---

## ⚠️ Ważne uwagi - Workflow'y

1. **Graf informacji (`grafinformacji`) nie generuje się**, jeśli pole `aio` (AI Overview) nie ma ustawionej wartości `"BRAK"`. Gdy `aio` jest puste lub zawiera treść AI Overview, workflow pomija generowanie grafu informacji i zwraca pusty wynik.

---

### Workflow 1: Budowa bazy wiedzy

**Klucz:** `DIFY_KNOWLEDGE_WORKFLOW_KEY`
**Endpoint:** `POST /api/workflows/knowledge`

| Wejście (inputs) | Źródło | Wymagane |
|------------------|--------|----------|
| `keyword` | projekt.keyword | tak |
| `language` | projekt.language | tak |
| `aio` | projekt.ai_overview_content | nie (domyślnie: `"BRAK"`) |

> ⚠️ **UWAGA:** Jeśli `aio` nie jest ustawione na `"BRAK"`, graf informacji nie zostanie wygenerowany!

| Wyjście (outputs) | Tabela docelowa |
|-------------------|-----------------|
| `knowledge_graph` | pisarz_knowledge_graphs.graph_data |
| `grafinformacji` | pisarz_information_graphs.triplets |
| `frazy z serp` | pisarz_search_phrases.phrases |
| `naglowki` | pisarz_competitor_headers.headers |

---

### Workflow 2: Generowanie nagłówków

**Klucz:** `DIFY_HEADERS_WORKFLOW_KEY`
**Endpoint:** `POST /api/workflows/headers`

| Wejście (inputs) | Źródło | Wymagane |
|------------------|--------|----------|
| `keyword` | projekt.keyword | tak |
| `language` | projekt.language | tak |
| `frazy` | pisarz_search_phrases.phrases | tak |
| `graf` | JSON.stringify(knowledge_graph) | tak |
| `headings` | pisarz_competitor_headers.headers | nie |

| Wyjście (outputs) | Tabela docelowa |
|-------------------|-----------------|
| `naglowki_rozbudowane` | pisarz_generated_headers (type: rozbudowane) |
| `naglowki_h2` | pisarz_generated_headers (type: h2) |
| `naglowki_pytania` | pisarz_generated_headers (type: pytania) |

---

### Workflow 3: RAG Creation

**Klucz:** `DIFY_RAG_WORKFLOW_KEY`
**Endpoint:** `POST /api/workflows/rag`

| Wejście (inputs) | Źródło | Wymagane |
|------------------|--------|----------|
| `keyword` | projekt.keyword | tak |
| `language` | projekt.language | tak |
| `headings` | wybrane nagłówki (is_selected=true) | tak |

| Wyjście (outputs) | Tabela docelowa |
|-------------------|-----------------|
| `dokladne` | pisarz_rag_data.detailed_qa |
| `ogolne` | pisarz_rag_data.general_qa |

---

### Workflow 4: Brief Creation

**Klucz:** `DIFY_BRIEF_WORKFLOW_KEY`
**Endpoint:** `POST /api/workflows/brief`

| Wejście (inputs) | Źródło | Wymagane |
|------------------|--------|----------|
| `keyword` | projekt.keyword | tak |
| `keywords` | pisarz_search_phrases.phrases | tak |
| `headings` | wybrane nagłówki | tak |
| `knowledge_graph` | JSON.stringify(graph_data) | tak |
| `information_graph` | JSON.stringify(triplets) | tak |

| Wyjście (outputs) | Tabela docelowa |
|-------------------|-----------------|
| `brief` | JSON array BriefItem[] |
| `html` | pisarz_briefs.brief_html |

**Struktura BriefItem:**
```typescript
interface BriefItem {
  heading: string;
  knowledge: string;
  keywords: string;
}
```

---

### Workflow 5: Content Generation (iteracyjny)

**Klucz:** `DIFY_CONTENT_WORKFLOW_KEY`
**Endpoint:** `POST /api/workflows/content`

Wywoływany **dla każdej sekcji osobno** z systemem anty-powtórzeniowym.

| Wejście (inputs) | Źródło | Wymagane |
|------------------|--------|----------|
| `naglowek` | aktualny nagłówek HTML | tak |
| `language` | projekt.language | tak |
| `knowledge` | briefItem.knowledge | tak |
| `keywords` | briefItem.keywords | tak |
| `headings` | wszystkie nagłówki (kontekst struktury) | tak |
| `done` | **streszczenia poprzednich sekcji** (2-3 zdania każda) | tak |
| `keyword` | projekt.keyword | tak |
| `last_section` | pełna treść ostatniej sekcji (dla ciągłości) | nie |
| `upcoming` | plan przyszłych sekcji z brief (temat każdej) | nie |
| `instruction` | **instrukcja anty-powtórzeniowa** (auto-generowana) | nie |

| Wyjście (outputs) | Tabela docelowa |
|-------------------|-----------------|
| `result` | pisarz_content_sections.content_html |

**Context Store:** `pisarz_context_store` przechowuje:
- `accumulated_content` - pełna treść (backup)
- `current_heading_index` - indeks aktualnej sekcji
- `section_summaries` - JSON array streszczeń `[{heading, summary, topics}]`
- `last_section_content` - pełna treść ostatniej sekcji

**System anty-powtórzeniowy:**

Model przy każdej sekcji otrzymuje:
1. **Streszczenia poprzednich sekcji** (zamiast pełnej treści) - oszczędność tokenów
2. **Pełną ostatnią sekcję** - dla zachowania ciągłości stylu
3. **Plan przyszłych sekcji** - wie co będzie pisane później
4. **Instrukcję anty-powtórzeniową** - lista tematów do unikania

```
Przykład instrukcji:
WAŻNE ZASADY:
1. NIE powtarzaj informacji z poprzednich sekcji.
2. NIE pisz o tematach zaplanowanych na kolejne sekcje.
3. Skup się TYLKO na aktualnym nagłówku.

Tematy już omówione (NIE powtarzaj): Wprowadzenie, Historia
Tematy na kolejne sekcje (NIE pisz o nich teraz): Przyszłość, Podsumowanie
```

**Pliki implementacji:**
- `src/lib/summarizer.ts` - funkcje streszczania i budowania kontekstu
- `src/app/api/workflows/content/route.ts` - API endpoint
- `src/lib/orchestrator/index.ts` - logika orkiestracji

---

## Struktura bazy danych

```
pisarz_projects
├── id, keyword, language, ai_overview_content
├── current_stage, status

pisarz_workflow_runs
├── id, project_id, stage, stage_name, status, error_message

pisarz_knowledge_graphs
├── id, project_id, graph_data (JSON)

pisarz_information_graphs
├── id, project_id, triplets (JSON)

pisarz_search_phrases
├── id, project_id, phrases (text)

pisarz_competitor_headers
├── id, project_id, headers (text)

pisarz_generated_headers
├── id, project_id, header_type, headers_html, is_selected

pisarz_rag_data
├── id, project_id, detailed_qa, general_qa

pisarz_briefs
├── id, project_id, brief_json, brief_html

pisarz_content_sections
├── id, project_id, section_order, heading_html
├── heading_knowledge, heading_keywords
├── content_html, status

pisarz_context_store
├── project_id, accumulated_content, current_heading_index
├── section_summaries (JSONB), last_section_content

pisarz_content_sections
├── ... + summary (TEXT) - streszczenie sekcji

pisarz_generated_content
├── id, project_id, content_html, content_text

rrs_google_trends (zewnętrzna tabela z trendami Google)
├── id (integer, PK)
├── trend_id (text) - unikalny identyfikator trendu
├── keyword (text) - słowo kluczowe trendu
├── approx_traffic (integer) - przybliżony ruch w tysiącach (np. 100 = 100K)
├── pub_date (timestamptz) - data publikacji trendu
├── description (text) - opis trendu
├── media (text) - lista źródeł mediów, format: "Media1 - Media2 - Media3"
├── media_links (text) - linki do artykułów, format multi-line (patrz niżej)
├── picture (text) - URL obrazka
├── picture_source (text) - źródło obrazka
├── has_interia (boolean) - czy Interia ma artykuł o tym trendzie
├── fetched_at (timestamptz) - data pobrania
├── created_at (timestamptz) - data utworzenia
├── embedding (vector) - embedding pgvector
├── embedding_text (text) - tekst użyty do embeddingu

rrs_blix_gazetki (zewnętrzna tabela z gazetkami promocyjnymi)
├── id (serial, PK)
├── item_id (text, unique) - unikalny identyfikator gazetki
├── title (text) - tytuł gazetki (np. "Gazetka Biedronka - Od poniedziałku")
├── description (text) - opis z listą promocji
├── link (text) - URL do gazetki na Blix.pl
├── pub_date (timestamptz) - data publikacji
├── context_query (text) - przykładowe zapytania pasujące do tej gazetki
├── embedding (vector(1024)) - embedding Jina AI (retrieval.passage)
├── embedding_text (text) - tekst użyty do embeddingu
├── fetched_at (timestamptz) - data pobrania
├── created_at (timestamptz) - data utworzenia

rrs_blix_products (produkty z OCR gazetek)
├── id (serial, PK)
├── gazetka_id (integer, FK) - referencja do rrs_blix_gazetki
├── page_number (integer) - numer strony gazetki
├── product_name (text) - nazwa produktu
├── brand (text) - marka produktu
├── price (decimal) - cena promocyjna
├── original_price (decimal) - cena przed promocją
├── discount_percent (integer) - procent rabatu
├── unit (text) - jednostka (kg, szt, l)
├── category (text) - kategoria produktu
├── image_url (text) - URL obrazka produktu
├── ocr_confidence (float) - pewność rozpoznania OCR
├── embedding (vector(1024)) - embedding Jina AI
├── embedding_text (text) - tekst użyty do embeddingu
├── created_at (timestamptz)
```

### Format pola `media_links` (rrs_google_trends)

Pole `media_links` zawiera linki do artykułów w formacie multi-line string:

```
- tytuł: Tytuł pierwszego artykułu
 - Link: https://example.com/article1

- tytuł: Tytuł drugiego artykułu
 - Link: https://example.com/article2

- tytuł: Tytuł trzeciego artykułu
 - Link: https://example.com/article3
```

**Parsowanie w kodzie (`src/app/(dashboard)/trends/page.tsx`):**
1. Rozdziel wpisy po podwójnej nowej linii (`\n\n`)
2. Dla każdego wpisu znajdź tytuł regex: `/-\s*tytuł:\s*(.+)/i`
3. Znajdź URL regex: `/-\s*Link:\s*(https?:\/\/[^\s]+)/i`

**Liczba linków:** Zależy od tego ile mediów pisało o danym trendzie (zazwyczaj 1-5).

---

## Kluczowe pliki

| Plik | Opis |
|------|------|
| `src/lib/dify/client.ts` | Klient Dify API |
| `src/lib/orchestrator/index.ts` | Orkiestrator workflow'ów |
| `src/app/api/workflows/*/route.ts` | API routes dla workflow'ów |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Strona projektu |
| `src/app/(dashboard)/settings/workflows/page.tsx` | Konfiguracja workflow'ów |
| `src/app/(dashboard)/trends/page.tsx` | Google Trends - wyświetlanie trendów z tabeli rrs_google_trends |
| `src/app/(dashboard)/semantyka/page.tsx` | Graf Neo4j - wizualizacja powiązań trendów |
| `src/components/neo4j/GraphViewer.tsx` | Komponent wizualizacji grafu Neo4j |
| `src/app/api/neo4j/query/route.ts` | API proxy do zapytań Neo4j (Cypher) |
| `scripts/neo4j_sync.py` | Skrypt synchronizacji Supabase → Neo4j |
| `src/app/(dashboard)/gazetki/page.tsx` | Wyszukiwarka gazetek promocyjnych + OCR |
| `src/app/api/product-search/route.ts` | API endpoint do wyszukiwania produktów w gazetkach |
| `src/app/api/ocr-gazetka/route.ts` | API endpoint do OCR gazetek (Ollama Vision) |
| `src/lib/ollama/client.ts` | Klient Ollama Vision API |
| `src/types/database.ts` | Typy TypeScript dla tabel (Project, GoogleTrend, GazetkaProduct, itp.) |

---

## Uruchomienie Dify

```bash
cd ~/dify/docker
docker compose up -d
```

Dify działa na porcie 80: http://localhost

---

## Statusy projektu

1. `draft` - nowy projekt
2. `knowledge_building` → `knowledge_built`
3. `headers_generating` → `headers_generated` → `headers_selected`
4. `rag_creating` → `rag_created`
5. `brief_creating` → `brief_created`
6. `content_generating` → `completed`
7. `error` - błąd w dowolnym etapie

---

## 🐛 Znane błędy do naprawienia

### 1. Brief HTML nie renderuje się poprawnie

**Problem:** Brief workflow zwraca HTML opakowany w markdown code blocks (` ```html `) oraz tagi `<html><body>`. Mimo że funkcja `formatBriefHtml` usuwa te tagi, HTML wyświetla się jako tekst zamiast być renderowany.

**Lokalizacja:**
- `src/app/(dashboard)/projects/[id]/page.tsx` - karta "Brief contentu"
- `src/components/workflow/stage-editor.tsx` - sekcja Stage 4

**Obecne rozwiązanie:** Dodano funkcję `formatBriefHtml()` która usuwa markdown code blocks i tagi html/body, ale to nie rozwiązuje problemu.

**Do zbadania:**
- Sprawdzić console.log w przeglądarce (dodane debugowanie)
- Możliwe że dane są escapowane w bazie danych
- Sprawdzić czy Tailwind prose class działa poprawnie
- Rozważyć użycie dedykowanego komponentu do renderowania HTML

**Status:** Do naprawienia

---

### 2. RAG Workflow - przekroczenie limitu tokenów

**Problem:** Dify RAG workflow przekracza limit 200k tokenów (żąda ~570k tokenów). Aplikacja wysyła tylko 222 znaki headings, więc problem jest wewnątrz workflow Dify.

**Błąd:**
```
PluginInvokeError: This endpoint's maximum context length is 200000 tokens.
However, you requested about 569607 tokens
```

**Przyczyna:** Workflow RAG w Dify prawdopodobnie:
- Ładuje cały knowledge_graph który jest bardzo duży
- Ma źle skonfigurowane node'y które łączą za dużo danych
- Używa modelu z małym kontekstem

**Do naprawienia w Dify:**
1. Sprawdzić workflow RAG - które node'y generują dużo tokenów
2. Zmniejszyć rozmiar knowledge_graph przed wysłaniem do modelu
3. Użyć modelu z większym kontekstem (np. Claude 3.5 z 200k)
4. Włączyć "middle-out" kompresję jeśli dostępna

**Status:** Do naprawienia w Dify

---

## 🔄 Punkty przywracania (Restore Points)

### Restore Point 1 - 2026-01-21
**Commit:** `9e03a32`
**Opis:** Aplikacja działa, dodane debug logging do Brief workflow, anti-repetition system wyłączony (nie wdrożony w Dify)

**Aby przywrócić ten stan:**
```bash
git reset --hard 9e03a32
```
