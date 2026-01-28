# AI Pisarz - Opis Aplikacji

## Czym jest AI Pisarz?

Aplikacja webowa do automatycznego generowania treści SEO oraz analizy trendów i promocji. Wykorzystuje workflow'y AI do tworzenia artykułów zoptymalizowanych pod wyszukiwarki.

---

## Główne Funkcje

### 1. Generator Treści SEO
- Pipeline 5 workflow'ów AI: budowa wiedzy → nagłówki → RAG → brief → treść
- System anty-powtórzeniowy (streszczenia sekcji)
- Eksport gotowych artykułów HTML

### 2. Google Trends (`/trends`)
- Wyświetlanie trendów z tabeli `rrs_google_trends`
- Filtrowanie po traffic, obecności w Interia
- Linki do artykułów źródłowych

### 3. Wyszukiwanie Semantyczne (`/semantyka`)
- Interaktywny graf klastrów tematycznych
- Klasteryzacja trendów na podstawie cosine similarity
- Wyszukiwarka podobnych trendów (embeddingi Jina AI)

### 4. Gazetki Promocyjne (`/gazetki`)
- Wyszukiwarka semantyczna promocji
- OCR gazetek - wyciąganie produktów i cen z obrazów
- Wycinanie obrazków produktów z bounding boxami
- **Wybór modelu OCR** - obsługa wielu providerów (Ollama Cloud, OpenRouter)

---

## Stack Technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Baza danych | Supabase (PostgreSQL + pgvector) |
| AI Workflows | Dify (self-hosted) |
| Embeddingi | Jina AI (`jina-embeddings-v3`, 1024 dim) |
| OCR/Vision | Ollama Cloud + OpenRouter (multi-model) |
| Przetwarzanie obrazów | Sharp |
| Wizualizacja | react-force-graph-2d |
| API zewnętrzne | SerpData.io (SERP) |

---

## Baza Danych (Supabase)

### Tabele projektu AI Pisarz:
- `pisarz_projects` - projekty z keyword i statusem
- `pisarz_knowledge_graphs` - grafy wiedzy (JSON)
- `pisarz_information_graphs` - trójki informacyjne
- `pisarz_search_phrases` - frazy wyszukiwania
- `pisarz_competitor_headers` - nagłówki konkurencji
- `pisarz_generated_headers` - wygenerowane nagłówki
- `pisarz_rag_data` - dane RAG (Q&A)
- `pisarz_briefs` - briefy contentu
- `pisarz_content_sections` - sekcje artykułu
- `pisarz_context_store` - kontekst dla anty-powtórzeń

### Tabele zewnętrzne:
- `rrs_google_trends` - trendy Google z embeddingami
- `rrs_blix_gazetki` - gazetki promocyjne
- `rrs_blix_products` - produkty z OCR gazetek

---

## Workflow'y Dify (Pipeline)

```
[1] Knowledge Building → graf wiedzy, frazy, nagłówki konkurencji
[2] Headers Generation → 3 typy nagłówków do wyboru
[3] RAG Creation → szczegółowe i ogólne Q&A
[4] Brief Creation → struktura artykułu (JSON + HTML)
[5] Content Generation → iteracyjne pisanie sekcji
```

---

## Klucze API (wymagane)

- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- `DIFY_*_WORKFLOW_KEY` (5 kluczy dla workflow'ów)
- `JINA_API_KEY` (embeddingi)
- `OLLAMA_API_KEY` (OCR vision - Ollama Cloud)
- `OPENROUTER_API_KEY` (OCR vision - OpenRouter, opcjonalnie)
- `SERPDATA_API_KEY` (opcjonalnie)

## Dostępne modele OCR

**Ollama Cloud:**
- `qwen3-vl:235b-instruct` - Najlepsza dokładność (domyślny)
- `qwen3-vl:32b` - Dobra jakość, szybszy
- `qwen3-vl:8b` - Lekki, szybki
- `ministral-3:14b` - Edge deployment, vision
- `devstral-small-2` - 24B, tools + vision
- `gemma3:27b` - Google, single GPU

**OpenRouter:**
- `google/gemini-flash-1.5` - Bardzo szybki i tani
- `google/gemini-2.0-flash-001` - Najnowszy Gemini
- `anthropic/claude-3.5-sonnet` - Wysoka jakość
- `openai/gpt-4o` - OpenAI multimodal
- `meta-llama/llama-3.2-90b-vision-instruct` - Open source

---

## Uruchomienie

```bash
cd ai-pisarz
npm install
npm run dev
# http://localhost:3000
```

Dify (wymagane dla workflow'ów):
```bash
cd ~/dify/docker
docker compose up -d
# http://localhost
```
