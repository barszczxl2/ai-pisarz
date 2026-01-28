# ✅ Lista zadań - AI Pisarz

**Ostatnia aktualizacja:** 20 stycznia 2025

---

## 🔴 PRIORYTET 1 - Natychmiastowe (Dzisiaj)

### 1.1 Commitować zmiany w Git
- [ ] Przejrzeć zmiany: `git status`
- [ ] Dodać zmodyfikowane pliki: `git add src/`
- [ ] Dodać nowy plik: `git add CLAUDE.md`
- [ ] Commitować: `git commit -m "feat: Update workflow routes and add documentation"`
- [ ] Usunąć folder `.temp/`: `rm -rf supabase/.temp/`
- [ ] Aktualizować `.gitignore` o `.temp/`

**Czas:** 15 minut
**Priorytet:** 🔴 Krytyczny

---

### 1.2 Dodać Error Boundary
- [ ] Stworzyć `src/components/error-boundary.tsx`
- [ ] Dodać globalny Error Boundary w `src/app/layout.tsx`
- [ ] Dodać try-catch w API routes:
  - [ ] `/api/workflows/knowledge/route.ts`
  - [ ] `/api/workflows/headers/route.ts`
  - [ ] `/api/workflows/rag/route.ts`
  - [ ] `/api/workflows/brief/route.ts`
  - [ ] `/api/workflows/content/route.ts`
- [ ] Dodać graceful degradation dla workflow failures
- [ ] Testować error scenarios

**Czas:** 2 godziny
**Priorytet:** 🔴 Krytyczny

---

### 1.3 Walidować zmienne środowiskowe
- [ ] Stworzyć `src/lib/env.ts`
- [ ] Zaimplementować walidację 10 zmiennych:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DIFY_API_BASE_URL`
  - `DIFY_KNOWLEDGE_WORKFLOW_KEY`
  - `DIFY_HEADERS_WORKFLOW_KEY`
  - `DIFY_RAG_WORKFLOW_KEY`
  - `DIFY_BRIEF_WORKFLOW_KEY`
  - `DIFY_CONTENT_WORKFLOW_KEY`
  - `SERPDATA_API_KEY`
- [ ] Wywołać walidację w `next.config.ts`
- [ ] Dodać informacyjne error messages
- [ ] Testować z brakującymi zmiennymi

**Czas:** 1 godzina
**Priorytet:** 🔴 Krytyczny

---

## 🟡 PRIORYTET 2 - W tym tygodniu

### 2.1 Dodać testy jednostkowe
- [ ] Zainstalować Vitest: `npm install -D vitest @vitejs/plugin-react`
- [ ] Stworzyć `vitest.config.ts`
- [ ] Dodać script w `package.json`: `"test": "vitest"`
- [ ] Napisać testy dla:
  - [ ] `src/lib/dify/client.ts` (mocking HTTP)
  - [ ] `src/lib/orchestrator/index.ts` (logika workflow)
  - [ ] `src/lib/supabase/server.ts` (database operations)
- [ ] Osiągnąć 50% code coverage
- [ ] Dodać CI check dla testów

**Czas:** 1 dzień
**Priorytet:** 🟡 Ważny

---

### 2.2 Naprawić logikę grafu informacji
- [ ] Zbadać workflow Dify dla `grafinformacji`
- [ ] Refaktoryzować warunek `aio` w workflow knowledge
- [ ] Ustawić domyślną wartość `ai_overview_content = "BRAK"` w:
  - [ ] Schema bazy: `supabase/migrations/001_schema.sql`
  - [ ] Formularz tworzenia projektu: `projects/new/page.tsx`
  - [ ] API route: `/api/projects/route.ts`
- [ ] Dodać lepsze komunikaty błędów
- [ ] Dodać dokumentację tego warunku
- [ ] Testować oba scenariusze (z AIO i bez)

**Czas:** 3 godziny
**Priorytet:** 🟡 Ważny

---

### 2.3 Dodać API documentation
- [ ] Stworzyć `docs/api/` folder
- [ ] Dokumentować każdy endpoint:
  - [ ] `docs/api/workflows-knowledge.md`
  - [ ] `docs/api/workflows-headers.md`
  - [ ] `docs/api/workflows-rag.md`
  - [ ] `docs/api/workflows-brief.md`
  - [ ] `docs/api/workflows-content.md`
  - [ ] `docs/api/projects.md`
- [ ] Stworzyć OpenAPI 3.0 spec: `openapi.yaml`
- [ ] Dodać przykłady request/response (JSON)
- [ ] Dodać informacje o kodach błędów
- [ ] Dodać Swagger UI (opcjonalnie)

**Czas:** 4 godziny
**Priorytet:** 🟡 Ważny

---

## 🟢 PRIORYTET 3 - W tym miesiącu

### 3.1 Implementować CI/CD
- [ ] Stworzyć `.github/workflows/ci.yml`
- [ ] Dodać jobs:
  - [ ] `lint` - ESLint check
  - [ ] `type-check` - TypeScript compilation
  - [ ] `test` - Vitest run
  - [ ] `build` - Next.js build
- [ ] Stworzyć `.github/workflows/deploy.yml`
- [ ] Skonfigurować Vercel integration
- [ ] Dodać preview deployments dla PR
- [ ] Testować full pipeline

**Czas:** 3 godziny
**Priorytet:** 🟢 Normalny

---

### 3.2 Dodać monitoring & logging
- [ ] Zainstalować pino: `npm install pino pino-pretty`
- [ ] Stworzyć `src/lib/logger.ts`
- [ ] Dodać structured logging w:
  - [ ] API routes (request/response)
  - [ ] Orchestrator (workflow steps)
  - [ ] Dify client (API calls)
- [ ] Zintegrować Sentry:
  - [ ] `npm install @sentry/nextjs`
  - [ ] `npx @sentry/wizard@latest -i nextjs`
  - [ ] Skonfigurować error tracking
- [ ] Dodać performance monitoring
- [ ] Testować w dev i production

**Czas:** 4 godziny
**Priorytet:** 🟢 Normalny

---

### 3.3 Zabezpieczyć API
- [ ] Zainstalować rate-limit: `npm install @upstash/ratelimit @upstash/redis`
- [ ] Stworzyć `src/middleware.ts` z rate limiting
- [ ] Ustawić limity: 5 req/min per IP dla workflow endpoints
- [ ] Dodać API key authentication:
  - [ ] Stworzyć `pisarz_api_keys` table
  - [ ] Middleware sprawdzający `x-api-key` header
  - [ ] UI do zarządzania kluczami
- [ ] Dodać request validation z Zod:
  - [ ] Schemas dla każdego endpoint
  - [ ] Walidacja w API routes
- [ ] Dodać CORS configuration
- [ ] Testować security measures

**Czas:** 6 godzin
**Priorytet:** 🟢 Normalny

---

### 3.4 Optymalizować performance
- [ ] Analiza bundle size: `npm run build -- --analyze`
- [ ] Optymalizacja:
  - [ ] Lazy loading komponentów
  - [ ] Dynamic imports dla heavy dependencies
  - [ ] Tree-shaking unused code
- [ ] React Server Components optimization:
  - [ ] Przenieść fetch data do Server Components
  - [ ] Minimize 'use client' usage
- [ ] Image optimization:
  - [ ] Użyć `next/image` wszędzie
  - [ ] Webp format
  - [ ] Responsive images
- [ ] Lighthouse audit (target: 90+)
- [ ] Core Web Vitals monitoring

**Czas:** 1 dzień
**Priorytet:** 🟢 Normalny

---

## 🔵 BACKLOG - Długoterminowe

### 4.1 Multi-user support
- [ ] Dodać Supabase Auth
- [ ] Stworzyć `pisarz_users` table
- [ ] Zaktualizować RLS policies (per-user access)
- [ ] Dodać user dashboard
- [ ] Quota management per user
- [ ] Billing integration (opcjonalnie)

**Czas:** 2 tygodnie
**Priorytet:** 🔵 Backlog

---

### 4.2 Eksport treści
- [ ] Eksport do HTML
- [ ] Eksport do Markdown
- [ ] Eksport do PDF (puppeteer)
- [ ] Eksport do WordPress (XML-RPC)
- [ ] Eksport do Webflow
- [ ] UI dla wyboru formatu

**Czas:** 1 tydzień
**Priorytet:** 🔵 Backlog

---

### 4.3 Advanced AI features
- [ ] Customizable prompts per workflow
- [ ] A/B testing dla 3 wariantów nagłówków
- [ ] Quality scoring (readability, SEO)
- [ ] Fact-checking integration
- [ ] Content versioning
- [ ] Draft auto-save (każde 30s)

**Czas:** 3 tygodnie
**Priorytet:** 🔵 Backlog

---

### 4.4 Collaborative editing
- [ ] Real-time collaborative editing (Yjs)
- [ ] Comments & suggestions
- [ ] User mentions
- [ ] Activity log
- [ ] Version history

**Czas:** 3 tygodnie
**Priorytet:** 🔵 Backlog

---

### 4.5 Dashboard improvements
- [ ] Advanced statistics (graphs)
- [ ] Project search & filters
- [ ] Bulk operations
- [ ] Templates management
- [ ] Keyboard shortcuts

**Czas:** 1 tydzień
**Priorytet:** 🔵 Backlog

---

## 📋 Quick wins (< 30 min każdy)

- [ ] Dodać Prettier: `npm install -D prettier eslint-config-prettier`
- [ ] Stworzyć `.prettierrc`
- [ ] Dodać script: `"format": "prettier --write ."`
- [ ] Zaktualizować `.env.local.example` z SERPDATA_API_KEY
- [ ] Dodać loading skeletons do dashboardu
- [ ] Dodać toast notifications dla success/error
- [ ] Dodać dark mode toggle w UI
- [ ] Zaktualizować README z badges (build, coverage)
- [ ] Dodać `CONTRIBUTING.md`
- [ ] Stworzyć `.nvmrc` z wersją Node (18+)

---

## 📊 Progress tracking

### Completion by priority

- **Priorytet 1 (Krytyczne):** 0/3 (0%)
- **Priorytet 2 (Ważne):** 0/3 (0%)
- **Priorytet 3 (Normalne):** 0/4 (0%)
- **Backlog:** 0/5 (0%)
- **Quick wins:** 0/10 (0%)

### Time estimates

- **Ten tydzień:** ~2 dni robocze (P1 + P2)
- **Ten miesiąc:** ~4 dni robocze (P1 + P2 + P3)
- **Q1 2025:** ~2 tygodnie (wszystko bez backlogu)

---

## 🎯 Milestone: Version 0.2.0 (Release Candidate)

### Wymagania do osiągnięcia

- [x] ~~Wszystkie zadania P1~~ (krytyczne dla stabilności)
- [x] ~~Wszystkie zadania P2~~ (ważne dla jakości)
- [x] ~~Minimum 50% code coverage~~
- [x] ~~API documentation complete~~
- [x] ~~CI/CD pipeline działający~~
- [x] ~~Error handling & monitoring~~

**Target date:** Koniec stycznia 2025

---

## 📝 Notatki

### Zależności między zadaniami

```
P1.1 (Git) → P2.1 (Testy) → P3.1 (CI/CD)
    ↓
P1.2 (Error) → P3.2 (Monitoring)
    ↓
P1.3 (Env) → Wszystkie pozostałe
```

### Blokery

- **Brak:** Wszystkie zadania można rozpocząć natychmiast

### Uwagi

- Testy (P2.1) wymagają mocków dla Dify i Supabase
- CI/CD (P3.1) wymaga konta Vercel/GitHub Actions
- Monitoring (P3.2) wymaga konta Sentry (free tier OK)
- Rate limiting (P3.3) wymaga Upstash Redis (free tier OK)

---

*Lista zadań wygenerowana automatycznie przez Claude | Data: 2025-01-20*
