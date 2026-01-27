#!/bin/bash

# ===========================================
# AI PISARZ - Backup Script
# ===========================================

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ścieżki
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ai-pisarz-backup-$TIMESTAMP"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   AI PISARZ - Backup${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Tworzenie katalogu backupów
mkdir -p "$BACKUP_DIR"

# Katalog tymczasowy dla backupu
TEMP_BACKUP="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$TEMP_BACKUP"

echo -e "${YELLOW}[1/5] Kopiowanie aplikacji Next.js...${NC}"
# Kopiuj ai-pisarz BEZ node_modules i .next
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.turbo' \
    "$PROJECT_ROOT/ai-pisarz/" "$TEMP_BACKUP/ai-pisarz/"

echo -e "${YELLOW}[2/5] Kopiowanie workflow'ów Dify...${NC}"
cp -r "$PROJECT_ROOT/dify" "$TEMP_BACKUP/"

echo -e "${YELLOW}[3/5] Kopiowanie dokumentacji...${NC}"
cp -r "$PROJECT_ROOT/dokumentacja" "$TEMP_BACKUP/"

echo -e "${YELLOW}[4/5] Kopiowanie pozostałych folderów...${NC}"
[ -d "$PROJECT_ROOT/make" ] && cp -r "$PROJECT_ROOT/make" "$TEMP_BACKUP/"
[ -d "$PROJECT_ROOT/n8n" ] && cp -r "$PROJECT_ROOT/n8n" "$TEMP_BACKUP/"
[ -d "$PROJECT_ROOT/struktura bazy" ] && cp -r "$PROJECT_ROOT/struktura bazy" "$TEMP_BACKUP/"
[ -d "$PROJECT_ROOT/koszty-api" ] && cp -r "$PROJECT_ROOT/koszty-api" "$TEMP_BACKUP/"

# Kopiuj skrypty
mkdir -p "$TEMP_BACKUP/scripts"
cp "$SCRIPT_DIR/backup.sh" "$TEMP_BACKUP/scripts/" 2>/dev/null || true
cp "$SCRIPT_DIR/setup.sh" "$TEMP_BACKUP/scripts/" 2>/dev/null || true
cp "$SCRIPT_DIR/restore.sh" "$TEMP_BACKUP/scripts/" 2>/dev/null || true

echo -e "${YELLOW}[5/5] Eksport danych z Supabase...${NC}"

# Eksport struktury tabel z Supabase (jeśli dostępne)
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$PROJECT_ROOT/ai-pisarz/.env.local" 2>/dev/null | cut -d'=' -f2)
SUPABASE_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY "$PROJECT_ROOT/ai-pisarz/.env.local" 2>/dev/null | cut -d'=' -f2)

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
    mkdir -p "$TEMP_BACKUP/supabase-data"

    # Lista tabel do eksportu
    TABLES=(
        "pisarz_projects"
        "pisarz_workflow_runs"
        "pisarz_knowledge_graphs"
        "pisarz_information_graphs"
        "pisarz_search_phrases"
        "pisarz_competitor_headers"
        "pisarz_generated_headers"
        "pisarz_rag_data"
        "pisarz_briefs"
        "pisarz_content_sections"
        "pisarz_context_store"
        "pisarz_generated_content"
        "rrs_google_trends"
    )

    for table in "${TABLES[@]}"; do
        echo "  Eksport: $table"
        curl -s "$SUPABASE_URL/rest/v1/$table?select=*" \
            -H "apikey: $SUPABASE_KEY" \
            -H "Authorization: Bearer $SUPABASE_KEY" \
            > "$TEMP_BACKUP/supabase-data/$table.json" 2>/dev/null || echo "  (pominięto - brak dostępu)"
    done
else
    echo -e "${YELLOW}  Pominięto - brak konfiguracji Supabase${NC}"
fi

# Tworzenie archiwum
echo ""
echo -e "${YELLOW}Tworzenie archiwum ZIP...${NC}"
cd "$BACKUP_DIR"
zip -r "$BACKUP_NAME.zip" "$BACKUP_NAME" -x "*.DS_Store"

# Usuwanie katalogu tymczasowego
rm -rf "$TEMP_BACKUP"

# Podsumowanie
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.zip" | cut -f1)
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Backup zakończony!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Plik: ${YELLOW}$BACKUP_DIR/$BACKUP_NAME.zip${NC}"
echo -e "Rozmiar: ${YELLOW}$BACKUP_SIZE${NC}"
echo ""
echo -e "Aby przenieść na innego Maca:"
echo -e "  1. Skopiuj plik ZIP na nowy komputer"
echo -e "  2. Rozpakuj: unzip $BACKUP_NAME.zip"
echo -e "  3. Uruchom: ./scripts/setup.sh"
echo ""
