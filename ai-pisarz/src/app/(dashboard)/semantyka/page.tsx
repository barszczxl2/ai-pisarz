'use client'

import GraphViewer from '@/components/neo4j/GraphViewer'

export default function SemantykaPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Semantyka - Graf Neo4j</h1>
        <p className="text-muted-foreground mt-2">
          Wizualizacja powiązań między trendami, artykułami i domenami.
          Dane są synchronizowane z tabeli rrs_google_trends.
        </p>
      </div>

      <GraphViewer />

      {/* Example queries documentation */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-2">Przykładowe zapytania Cypher</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Trendy z ostatniego tygodnia:</p>
              <pre className="bg-background p-2 rounded mt-1 overflow-x-auto">
{`MATCH (k:Keyword)-[:HAS_TREND]->(t:TrendSnapshot)
WHERE t.date >= date() - duration('P7D')
RETURN k, t`}
              </pre>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Top 10 domen:</p>
              <pre className="bg-background p-2 rounded mt-1 overflow-x-auto">
{`MATCH (d:Domain)<-[:PUBLISHED_ON]-(a:Article)
RETURN d.name, count(a) as articles
ORDER BY articles DESC LIMIT 10`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-2">Struktura grafu</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F79767]" />
              <span><strong>Keyword</strong> - słowo kluczowe z Google Trends</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6DCE9E]" />
              <span><strong>Article</strong> - artykuł powiązany z trendem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF756E]" />
              <span><strong>Domain</strong> - domena źródłowa artykułu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#A5ABB6]" />
              <span><strong>TrendSnapshot</strong> - migawka trendu w czasie</span>
            </div>
          </div>

          <h4 className="font-medium mt-4 mb-2">Relacje:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><code>HAS_TREND</code> - Keyword → TrendSnapshot</li>
            <li><code>HAS_ARTICLE</code> - Keyword → Article</li>
            <li><code>PUBLISHED_ON</code> - Article → Domain</li>
            <li><code>RELATED_TO</code> - Keyword ↔ Keyword</li>
          </ul>
        </div>
      </div>

      {/* Sync instructions */}
      <div className="bg-muted/50 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Synchronizacja danych</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Aby zsynchronizować dane z Supabase do Neo4j, uruchom skrypt:
        </p>
        <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
{`# Instalacja zależności
cd ai-pisarz/scripts
pip install -r requirements.txt

# Konfiguracja (skopiuj i uzupełnij .env)
cp .env.example .env

# Synchronizacja
python neo4j_sync.py`}
        </pre>
      </div>
    </div>
  )
}
