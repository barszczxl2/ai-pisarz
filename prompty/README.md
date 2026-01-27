# Katalog Prompty - Dokumentacja Promptów z Dify

Repozytorium dokumentacji promptów używanych w workflow'ach Dify do generowania contentu SEO.

## Spis treści

### 01 - Budowa Bazy Wiedzy
| Plik | Opis | Rekomendowany LLM |
|------|------|-------------------|
| [ekstrakcja_brandow.md](01_budowa_bazy_wiedzy/ekstrakcja_brandow.md) | Wyciąga marki i domeny z wyników SERP | Ollama: `llama3.1:8b` |
| [predykaty_semantyczne.md](01_budowa_bazy_wiedzy/predykaty_semantyczne.md) | Tworzy trójki semantyczne (podmiot-orzeczenie-dopełnienie) | OpenRouter: `gpt-4o-mini` |
| [graf_informacji.md](01_budowa_bazy_wiedzy/graf_informacji.md) | Buduje graf informacji z relacjami między encjami | OpenRouter: `claude-3.5-sonnet` |
| [ekstrakcja_keywords.md](01_budowa_bazy_wiedzy/ekstrakcja_keywords.md) | Wyciąga słowa kluczowe i encje z treści | Ollama: `gemma2:27b` |
| [keywords_z_serp.md](01_budowa_bazy_wiedzy/keywords_z_serp.md) | Analizuje SERP i wyciąga unikalne frazy kluczowe | Ollama: `llama3.1:8b` |
| [ekstrakcja_naglowkow.md](01_budowa_bazy_wiedzy/ekstrakcja_naglowkow.md) | Wyciąga strukturę H2/H3 z konkurencji | Ollama: `llama3.1:8b` |
| [generowanie_naglowkow.md](01_budowa_bazy_wiedzy/generowanie_naglowkow.md) | Tworzy unikalne nagłówki na podstawie analizy | OpenRouter: `gpt-4o-mini` |
| [knowledge_graph_builder.md](01_budowa_bazy_wiedzy/knowledge_graph_builder.md) | Buduje rozbudowany graf wiedzy z encjami | OpenRouter: `claude-3.5-sonnet` |

### 02 - Generowanie Nagłówków
| Plik | Opis | Rekomendowany LLM |
|------|------|-------------------|
| [naglowki_rozbudowane.md](02_generowanie_naglowkow/naglowki_rozbudowane.md) | Tworzy pełny outline SEO z H2/H3/H4 | OpenRouter: `o4-mini` |
| [naglowki_h2.md](02_generowanie_naglowkow/naglowki_h2.md) | Tworzy uproszczony outline tylko z H2 | OpenRouter: `o4-mini` |
| [naglowki_pytania.md](02_generowanie_naglowkow/naglowki_pytania.md) | Przekształca nagłówki w formę pytań | OpenRouter: `o4-mini` |

### 03 - Budowa RAG
| Plik | Opis | Rekomendowany LLM |
|------|------|-------------------|
| [pytania_dokladne.md](03_budowa_rag/pytania_dokladne.md) | Dzieli treść na chunki Q&A z nagłówkami | OpenRouter: `gemini-2.5-flash` |
| [pytania_ogolne.md](03_budowa_rag/pytania_ogolne.md) | Tworzy ogólne Q&A do retrieval | OpenRouter: `gpt-4.1-mini` |

### 04 - Content Brief
| Plik | Opis | Rekomendowany LLM |
|------|------|-------------------|
| [generator_briefu.md](04_content_brief/generator_briefu.md) | Tworzy brief contentu z knowledge i keywords | OpenRouter: `gpt-4.1-mini` |
| [json_to_html.md](04_content_brief/json_to_html.md) | Konwertuje brief JSON na czytelny HTML | OpenRouter: `o4-mini` |

### 05 - Generowanie Contentu
| Plik | Opis | Rekomendowany LLM |
|------|------|-------------------|
| [generowanie_sekcji.md](05_generowanie_contentu/generowanie_sekcji.md) | Pisze treść SEO dla pojedynczej sekcji | OpenRouter: `gpt-4o-mini` |
| [jasnosc_jezyka.md](05_generowanie_contentu/jasnosc_jezyka.md) | Sprawdza i poprawia czytelność tekstu | OpenRouter: `gpt-4o-mini` |
| [humanizacja.md](05_generowanie_contentu/humanizacja.md) | Nadaje tekstowi naturalny, ludzki ton | OpenRouter: `gpt-4o-mini` |
| [formatowanie_html.md](05_generowanie_contentu/formatowanie_html.md) | Formatuje tekst do czystego HTML | OpenRouter: `gpt-4o-mini` |
| [korekta.md](05_generowanie_contentu/korekta.md) | Sprawdza błędy i weryfikuje spójność | OpenRouter: `gpt-4o-mini` |

---

## Rekomendacje modeli LLM

### Ollama Cloud (priorytet 1 - darmowe/tanie)

| Model | Zastosowanie | Kontekst |
|-------|--------------|----------|
| `llama3.1:8b` | Proste ekstrakcje, formatowanie | 128K |
| `gemma2:27b` | Analiza, korekta, ocena jakości | 8K |
| `qwen3:32b` | Złożone zadania logiczne | 32K |
| `mistral-large` | Instrukcje krok-po-kroku | 128K |

### OpenRouter (priorytet 2 - płatne)

| Model | Zastosowanie | Cena/1M tokenów |
|-------|--------------|-----------------|
| `openai/gpt-4o-mini` | Balans jakość/cena | $0.15/$0.60 |
| `openai/gpt-4.1-mini` | Nowsza wersja mini | $0.40/$1.60 |
| `google/gemini-2.5-flash` | Szybkie odpowiedzi | $0.075/$0.30 |
| `anthropic/claude-3.5-sonnet` | Najwyższa jakość | $3.00/$15.00 |
| `openai/o4-mini` | Rozumowanie | $1.10/$4.40 |

---

## Format dokumentacji

Każdy plik dokumentacji zawiera:
- **Opis** - krótkie wyjaśnienie funkcji prompta
- **Zastosowanie** - konkretne przypadki użycia
- **Rekomendowany model** - sugerowany LLM
- **Prompt (oryginalny)** - pełna treść prompta w oryginale
- **Prompt (polski)** - przetłumaczona treść prompta
- **Parametry wejściowe** - opis zmiennych
- **Przykład użycia** - przykładowy JSON

---

## Źródła

Prompty zostały wyodrębnione z następujących workflow'ów Dify:

```
dify/[SEO3.0] Budowa bazy wiedzy-ver1.yml
dify/[SEO 3.0] Budowa nagłówków - blog_11-24-25.yml
dify/[SEO 3.0] Budowa RAG (1)_11-24-25.yml
dify/[SEO 3.0] Content brief.yml
dify/[SEO 3.0] Generowanie contentu.yml
```
