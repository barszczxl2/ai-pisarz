# AI PISARZ - Generator treści SEO

Aplikacja webowa do automatycznej generacji artykułów SEO z wykorzystaniem AI. Orkiestruje 5 workflow'ów Dify do tworzenia zoptymalizowanych treści.

## Stack technologiczny

- **Frontend**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Baza danych**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **AI Workflows**: Dify API

## Wymagania

- Node.js 18+
- Konto Supabase (https://supabase.com)
- Konto Dify (https://cloud.dify.ai)

## Instalacja

### 1. Sklonuj projekt i zainstaluj zależności

```bash
cd ai-pisarz
npm install
```

### 2. Skonfiguruj Supabase

1. Utwórz nowy projekt na https://supabase.com
2. W Supabase Dashboard przejdź do **SQL Editor**
3. Wykonaj migrację z pliku `supabase/migrations/001_schema.sql`
4. Skopiuj klucze API z **Project Settings > API**:
   - Project URL
   - Anon Key
   - Service Role Key

### 3. Skonfiguruj Dify

1. Zaloguj się na https://cloud.dify.ai
2. Zaimportuj 5 workflow'ów z folderu `/dify/`:
   - `[SEO3.0] Budowa bazy wiedzy-ver1.yml`
   - `[SEO 3.0] Budowa nagłówków - blog_11-24-25.yml`
   - `[SEO 3.0] Budowa RAG (1)_11-24-25.yml`
   - `[SEO 3.0] Content brief.yml`
   - `[SEO 3.0] Generowanie contentu.yml`
3. Dla każdego workflow skopiuj API Key z **Settings > API Access**

### 4. Skonfiguruj zmienne środowiskowe

```bash
cp .env.local.example .env.local
```

Uzupełnij plik `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Dify
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_KNOWLEDGE_WORKFLOW_KEY=app-xxx
DIFY_HEADERS_WORKFLOW_KEY=app-xxx
DIFY_RAG_WORKFLOW_KEY=app-xxx
DIFY_BRIEF_WORKFLOW_KEY=app-xxx
DIFY_CONTENT_WORKFLOW_KEY=app-xxx
```

### 5. Uruchom aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem http://localhost:3000

## Pipeline generacji

```
1. BUDOWA WIEDZY       →  Analiza tematu i tworzenie grafu wiedzy
   ↓ (automatycznie)
2. GENEROWANIE NAGŁÓWKÓW  →  3 warianty nagłówków do wyboru
   ↓ (wymaga wyboru użytkownika)
3. BUDOWA RAG         →  Tworzenie bazy wiedzy
   ↓ (automatycznie)
4. TWORZENIE BRIEFU   →  Brief dla każdej sekcji
   ↓ (automatycznie)
5. GENEROWANIE TREŚCI →  Iteracyjna generacja nagłówek po nagłówku
```

## Struktura projektu

```
ai-pisarz/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx      # Lista projektów
│   │   │   │   ├── new/page.tsx  # Nowy projekt
│   │   │   │   └── [id]/page.tsx # Szczegóły projektu
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── projects/route.ts
│   │       └── workflows/        # API dla każdego etapu
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   ├── layout/               # Sidebar, Header
│   │   └── workflow/             # Pipeline, HeaderSelection
│   ├── lib/
│   │   ├── supabase/             # Klient Supabase
│   │   ├── dify/                 # Klient Dify
│   │   └── orchestrator/         # Logika orkiestracji
│   └── types/
│       └── database.ts           # Typy TypeScript
└── supabase/
    └── migrations/               # Schemat bazy danych
```

## Funkcjonalności

- Dashboard z przeglądem projektów i statystykami
- Tworzenie nowych projektów SEO
- Wizualizacja pipeline'u 5 etapów
- Wybór wariantu nagłówków (3 opcje)
- Real-time tracking postępu generacji
- Podgląd generowanej treści w czasie rzeczywistym
- Eksport do HTML/Markdown

## Deployment

Aplikacja może być hostowana na:
- Vercel (rekomendowane dla Next.js)
- Netlify
- Własny serwer z Node.js

```bash
npm run build
npm start
```
