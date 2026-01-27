# AI Pisarz - Backup i Przeniesienie na nowego Maca

## Szybki start

### Tworzenie backupu (na obecnym Macu)

```bash
cd "/Users/home/Documents/03_Projekty_Programistyczne/AI PISARZ"
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Backup zostanie utworzony w folderze `backups/` jako plik ZIP.

### Przywracanie na nowym Macu

1. Skopiuj plik `ai-pisarz-backup-XXXXXXXX.zip` na nowego Maca
2. Rozpakuj w wybranej lokalizacji:
   ```bash
   unzip ai-pisarz-backup-*.zip -d ~/Documents/Projekty/
   cd ~/Documents/Projekty/ai-pisarz-backup-*/
   ```
3. Uruchom setup:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

---

## Co zawiera backup

| Folder | Opis |
|--------|------|
| `ai-pisarz/` | Aplikacja Next.js (bez node_modules) |
| `dify/` | Eksportowane workflow'y Dify (pliki .yml) |
| `dokumentacja/` | Dokumentacja projektu |
| `make/` | Scenariusze Make.com |
| `n8n/` | Blueprinty n8n |
| `supabase-data/` | Eksport danych z Supabase (JSON) |
| `scripts/` | Skrypty backup/setup |

---

## Wymagania na nowym Macu

### Obowiązkowe

- **Node.js** >= 18.x
  ```bash
  brew install node
  # lub https://nodejs.org/
  ```

### Opcjonalne (dla pełnej funkcjonalności)

- **Docker Desktop** (dla Dify)
  ```bash
  # https://docker.com/products/docker-desktop
  ```

- **Git** (zazwyczaj preinstalowany)
  ```bash
  xcode-select --install
  ```

---

## Konfiguracja krok po kroku

### 1. Aplikacja Next.js

```bash
cd ai-pisarz
cp .env.example .env.local
# Edytuj .env.local i uzupełnij klucze
npm install
npm run dev
```

### 2. Dify (lokalne AI)

Dify musi być zainstalowane lokalnie na każdym Macu:

```bash
# Klonowanie Dify
git clone https://github.com/langgenius/dify.git ~/dify
cd ~/dify/docker

# Konfiguracja
cp .env.example .env

# Uruchomienie
docker compose up -d
```

Po uruchomieniu (http://localhost):
1. Zaloguj się / załóż konto
2. Zaimportuj workflow'y z folderu `dify/`:
   - `[SEO 3.0] Budowa bazy wiedzy-ver1.yml`
   - `[SEO 3.0] Budowa nagłówków - blog.yml`
   - `[SEO 3.0] Budowa RAG.yml`
   - `[SEO 3.0] Content brief.yml`
   - `[SEO 3.0] Generowanie contentu.yml`
3. Skopiuj klucze API workflow'ów do `.env.local`

### 3. Supabase

Supabase jest hostowane zewnętrznie (self-hosted na Hetzner), więc:
- Dostęp działa z każdego Maca (wymaga połączenia internetowego)
- Klucze API w `.env.local` pozostają te same
- Dane są przechowywane centralnie

Jeśli chcesz przywrócić dane z backupu:
```bash
# Dane znajdują się w supabase-data/*.json
# Można je zaimportować przez Supabase Dashboard lub API
```

---

## Zmienne środowiskowe (.env.local)

```env
# Supabase - TEN SAM dla wszystkich Maców
NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-xxx.sslip.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Dify - RÓŻNY na każdym Macu (lokalna instalacja)
DIFY_API_BASE_URL=http://localhost/v1
DIFY_KNOWLEDGE_WORKFLOW_KEY=app-xxx  # Nowy klucz po imporcie
DIFY_HEADERS_WORKFLOW_KEY=app-xxx
DIFY_RAG_WORKFLOW_KEY=app-xxx
DIFY_BRIEF_WORKFLOW_KEY=app-xxx
DIFY_CONTENT_WORKFLOW_KEY=app-xxx

# SerpData - TEN SAM
SERPDATA_API_KEY=serpdata_xxx
```

---

## Ograniczenia

### Dify (lokalne)
- Każdy Mac wymaga własnej instalacji Dify
- Workflow'y trzeba importować ręcznie
- Klucze API będą inne na każdym Macu
- Historia konwersacji nie jest przenoszona

### Rozwiązania alternatywne
1. **Dify Cloud** - płatna wersja hostowana (bez Docker)
2. **Dify na VPS** - jedna instancja dla wszystkich Maców

---

## Struktura projektu

```
AI PISARZ/
├── ai-pisarz/           # Aplikacja Next.js
│   ├── src/
│   ├── .env.local       # Konfiguracja (NIE w repozytorium)
│   ├── .env.example     # Szablon konfiguracji
│   └── CLAUDE.md        # Dokumentacja dla Claude
├── dify/                # Workflow'y Dify (export YML)
├── dokumentacja/        # Dokumentacja projektu
├── make/                # Scenariusze Make.com
├── n8n/                 # Blueprinty n8n
├── scripts/
│   ├── backup.sh        # Skrypt tworzenia backupu
│   └── setup.sh         # Skrypt konfiguracji na nowym Macu
├── backups/             # Utworzone backupy (ZIP)
└── README-BACKUP.md     # Ten plik
```

---

## Troubleshooting

### "npm install" kończy się błędem
```bash
rm -rf node_modules package-lock.json
npm install
```

### Dify nie uruchamia się
```bash
cd ~/dify/docker
docker compose down
docker compose up -d
docker compose logs -f  # sprawdź logi
```

### Brak połączenia z Supabase
- Sprawdź czy URL i klucze w `.env.local` są poprawne
- Sprawdź połączenie internetowe
- Sprawdź czy serwer Supabase działa

### Aplikacja nie widzi Dify
- Upewnij się że Dify działa: http://localhost
- Sprawdź klucze workflow'ów w `.env.local`
- Zweryfikuj że workflow'y są aktywne w Dify
