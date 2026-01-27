# RSS & Google Trends - Agregacja danych z gazetek

## Opis funkcjonalności

Nowa funkcjonalność agregująca trendy z Google Trends oraz dane z gazetek (RSS). System automatycznie pobiera popularne tematy, wzbogaca je o artykuły z polskich portali informacyjnych i generuje embeddingi wektorowe do wyszukiwania semantycznego.

## Źródła danych

1. **Google Trends** - polskie trendy wyszukiwania
2. **RSS feeds** - dane z gazetek i portali informacyjnych
3. **Interia.pl** - dodatkowe artykuły (oznaczone flagą `has_interia`)

## Tabela w Supabase: `rrs_google_trends`

### Struktura

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | integer | Klucz główny (auto-increment) |
| `trend_id` | text | Unikalny ID trendu (format: `YYYYMMDD-keyword`) |
| `keyword` | text | Słowo kluczowe trendu |
| `approx_traffic` | integer | Przybliżony ruch w tysiącach |
| `pub_date` | timestamptz | Data publikacji trendu |
| `description` | text | Opis trendu |
| `media` | text | Lista źródeł medialnych (np. "Wyborcza.pl - Euronews.com") |
| `media_links` | text | Linki do artykułów w formacie markdown |
| `picture` | text | URL obrazka powiązanego z trendem |
| `picture_source` | text | Źródło obrazka |
| `has_interia` | boolean | Czy Interia.pl ma artykuł o tym trendzie |
| `embedding` | vector(1024) | Embedding wektorowy (pgvector) |
| `embedding_text` | text | Tekst użyty do generowania embeddingu |
| `fetched_at` | timestamptz | Data i czas pobrania danych |
| `created_at` | timestamptz | Data utworzenia rekordu |

## Model embeddingowy

### Jina.ai - jina-embeddings-v3

- **Provider:** [Jina.ai](https://jina.ai/)
- **Model:** `jina-embeddings-v3`
- **Wymiary wektora:** 1024
- **Cechy:**
  - Wielojęzyczny (obsługuje polski)
  - Wysoka jakość dla krótkich tekstów (nagłówki, słowa kluczowe)
  - Szybkie generowanie embeddingów

### Zastosowania embeddingów

1. **Wyszukiwanie semantyczne** - znajdowanie podobnych trendów
2. **Grupowanie tematyczne** - automatyczne kategoryzowanie trendów
3. **Rekomendacje** - sugerowanie powiązanych tematów
4. **Analiza podobieństwa** - porównywanie trendów z różnych okresów

## Przykłady zapytań SQL

### Podstawowe pobieranie danych

```sql
-- Pobierz najnowsze trendy
SELECT keyword, approx_traffic, media, pub_date
FROM rrs_google_trends
ORDER BY pub_date DESC
LIMIT 20;

-- Trendy z Interia
SELECT keyword, approx_traffic
FROM rrs_google_trends
WHERE has_interia = true;
```

### Wyszukiwanie semantyczne (pgvector)

```sql
-- Znajdź trendy podobne do podanego embeddingu
SELECT keyword, approx_traffic,
       embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM rrs_google_trends
ORDER BY distance
LIMIT 10;

-- Grupowanie podobnych trendów (cosine similarity)
SELECT a.keyword, b.keyword,
       1 - (a.embedding <=> b.embedding) AS similarity
FROM rrs_google_trends a
CROSS JOIN rrs_google_trends b
WHERE a.id < b.id
  AND 1 - (a.embedding <=> b.embedding) > 0.8
ORDER BY similarity DESC;
```

## Integracja z API Supabase

### Pobieranie danych (REST API)

```bash
curl 'https://your-supabase-url/rest/v1/rrs_google_trends?select=*&limit=10' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

### Pobieranie z filtrem

```bash
# Tylko trendy z ruchem > 10k
curl 'https://your-supabase-url/rest/v1/rrs_google_trends?approx_traffic=gt.10&select=keyword,approx_traffic,media' \
  -H 'apikey: YOUR_ANON_KEY'
```

## Przepływ danych

```
Google Trends API
       ↓
Pobieranie trendów (keyword, traffic, pub_date)
       ↓
Wzbogacanie o artykuły z RSS/gazetek
       ↓
Sprawdzanie Interia.pl (has_interia)
       ↓
Generowanie embeddingu (Jina.ai)
       ↓
Zapis do Supabase (rrs_google_trends)
```

## Konfiguracja

### Zmienne środowiskowe

```env
# Jina.ai
JINA_API_KEY=jina_xxx

# Supabase (już skonfigurowane)
NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-xxx.sslip.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Uwagi

- Dane są pobierane automatycznie (cron/scheduler)
- Embeddingi są generowane dla pola `embedding_text` które zawiera połączenie keyword + description
- Tabela używa rozszerzenia `pgvector` do przechowywania wektorów
- Format `trend_id` zapewnia unikalność: `YYYYMMDD-keyword`
