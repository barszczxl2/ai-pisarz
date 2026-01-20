# AI Pisarz - Dokumentacja dla Claude

## Opis projektu

AI Pisarz to aplikacja Next.js do automatycznego generowania treści SEO. Wykorzystuje Dify (self-hosted) jako silnik workflow'ów AI oraz Supabase jako bazę danych.

## Stack technologiczny

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Baza danych:** Supabase (self-hosted na Hetzner)
- **AI Workflows:** Dify (self-hosted, port 80)
- **API zewnętrzne:** SerpData.io (wyszukiwanie SERP)

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
```

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

Wywoływany **dla każdej sekcji osobno** z akumulacją treści.

| Wejście (inputs) | Źródło | Wymagane |
|------------------|--------|----------|
| `naglowek` | aktualny nagłówek HTML | tak |
| `language` | projekt.language | tak |
| `knowledge` | briefItem.knowledge | tak |
| `keywords` | pisarz_search_phrases.phrases | tak |
| `headings` | wszystkie nagłówki (kontekst) | tak |
| `done` | accumulated_content (poprzednia treść) | tak |
| `keyword` | projekt.keyword | tak |
| `instruction` | dodatkowe instrukcje | nie |

| Wyjście (outputs) | Tabela docelowa |
|-------------------|-----------------|
| `result` | pisarz_content_sections.content_html |

**Context Store:** `pisarz_context_store` przechowuje `accumulated_content` i `current_heading_index`

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

pisarz_generated_content
├── id, project_id, content_html, content_text
```

---

## Kluczowe pliki

| Plik | Opis |
|------|------|
| `src/lib/dify/client.ts` | Klient Dify API |
| `src/lib/orchestrator/index.ts` | Orkiestrator workflow'ów |
| `src/app/api/workflows/*/route.ts` | API routes dla workflow'ów |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Strona projektu |
| `src/app/(dashboard)/settings/workflows/page.tsx` | Konfiguracja workflow'ów |

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
