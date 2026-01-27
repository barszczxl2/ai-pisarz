#!/bin/bash

# ===========================================
# AI PISARZ - Setup Script (nowy Mac)
# ===========================================

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   AI PISARZ - Setup na nowym Mac${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ===========================================
# 1. Sprawdzenie wymagań
# ===========================================
echo -e "${YELLOW}[1/6] Sprawdzanie wymagań...${NC}"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  ${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "  ${RED}✗${NC} Node.js nie znaleziony"
    echo -e "    Zainstaluj: ${BLUE}brew install node${NC}"
    echo -e "    lub: ${BLUE}https://nodejs.org/${NC}"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "  ${GREEN}✓${NC} npm: $NPM_VERSION"
else
    echo -e "  ${RED}✗${NC} npm nie znaleziony"
    exit 1
fi

# Docker (opcjonalnie dla Dify)
if command -v docker &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker zainstalowany"
else
    echo -e "  ${YELLOW}!${NC} Docker nie znaleziony (potrzebny dla Dify)"
    echo -e "    Zainstaluj: ${BLUE}https://docker.com/products/docker-desktop${NC}"
fi

# ===========================================
# 2. Konfiguracja .env.local
# ===========================================
echo ""
echo -e "${YELLOW}[2/6] Konfiguracja środowiska...${NC}"

ENV_FILE="$PROJECT_ROOT/ai-pisarz/.env.local"
ENV_EXAMPLE="$PROJECT_ROOT/ai-pisarz/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo -e "  ${YELLOW}!${NC} Utworzono .env.local z szablonu"
        echo -e "    ${RED}WAŻNE: Uzupełnij klucze API w pliku .env.local${NC}"
    else
        echo -e "  ${RED}✗${NC} Brak pliku .env.local i .env.example"
        echo -e "    Stwórz plik $ENV_FILE z konfiguracją"
    fi
else
    echo -e "  ${GREEN}✓${NC} Plik .env.local istnieje"
fi

# ===========================================
# 3. Instalacja zależności
# ===========================================
echo ""
echo -e "${YELLOW}[3/6] Instalacja zależności npm...${NC}"

cd "$PROJECT_ROOT/ai-pisarz"
npm install

# ===========================================
# 4. Informacja o Dify
# ===========================================
echo ""
echo -e "${YELLOW}[4/6] Konfiguracja Dify (lokalne AI)...${NC}"
echo ""
echo -e "  Dify wymaga lokalnej instalacji Docker."
echo -e "  Workflow'y Dify znajdują się w: ${BLUE}$PROJECT_ROOT/dify/${NC}"
echo ""
echo -e "  Aby zainstalować Dify:"
echo -e "    ${BLUE}git clone https://github.com/langgenius/dify.git ~/dify${NC}"
echo -e "    ${BLUE}cd ~/dify/docker${NC}"
echo -e "    ${BLUE}cp .env.example .env${NC}"
echo -e "    ${BLUE}docker compose up -d${NC}"
echo ""
echo -e "  Po uruchomieniu Dify (http://localhost):"
echo -e "    1. Zaimportuj workflow'y z folderu dify/"
echo -e "    2. Skopiuj klucze API workflow'ów do .env.local"
echo ""

# ===========================================
# 5. Informacja o Supabase
# ===========================================
echo -e "${YELLOW}[5/6] Konfiguracja Supabase...${NC}"
echo ""
echo -e "  Supabase jest hostowane zewnętrznie (self-hosted na Hetzner)."
echo -e "  Upewnij się, że masz dostęp do:"
echo -e "    - NEXT_PUBLIC_SUPABASE_URL"
echo -e "    - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""

if [ -d "$PROJECT_ROOT/supabase-data" ]; then
    echo -e "  ${GREEN}✓${NC} Znaleziono backup danych Supabase"
    echo -e "    Dane można przywrócić za pomocą Supabase Dashboard lub API"
fi

# ===========================================
# 6. Podsumowanie
# ===========================================
echo ""
echo -e "${YELLOW}[6/6] Finalizacja...${NC}"
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Setup zakończony!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Aby uruchomić aplikację:"
echo -e "  ${BLUE}cd $PROJECT_ROOT/ai-pisarz${NC}"
echo -e "  ${BLUE}npm run dev${NC}"
echo ""
echo -e "Aplikacja będzie dostępna: ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Checklist przed uruchomieniem:${NC}"
echo -e "  [ ] Uzupełnij klucze w .env.local"
echo -e "  [ ] Uruchom Dify (docker compose up -d)"
echo -e "  [ ] Zaimportuj workflow'y do Dify"
echo -e "  [ ] Sprawdź połączenie z Supabase"
echo ""
