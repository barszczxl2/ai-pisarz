#!/usr/bin/env python3
"""
Neo4j Sync Script - Synchronizuje dane z Supabase do Neo4j

Pobiera trendy z tabeli rrs_google_trends i tworzy graf w Neo4j:
- Keyword nodes (słowa kluczowe)
- Article nodes (artykuły)
- Domain nodes (domeny źródłowe)
- TrendSnapshot nodes (migawki trendów w czasie)
- Relacje między węzłami

Uruchomienie:
    python scripts/neo4j_sync.py

Wymagane zmienne środowiskowe:
    SUPABASE_URL, SUPABASE_KEY, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
"""

import os
import re
import hashlib
from datetime import datetime
from urllib.parse import urlparse
from dotenv import load_dotenv
from supabase import create_client, Client
from neo4j import GraphDatabase

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

# Validate required env vars
if not all([SUPABASE_URL, SUPABASE_KEY, NEO4J_PASSWORD]):
    raise ValueError("Missing required environment variables. Check .env file.")


def parse_media_links(media_links_text: str) -> list[dict]:
    """
    Parse media_links field from rrs_google_trends.

    Format:
    - tytuł: Article Title
     - Link: https://example.com/article

    Returns list of {title, url, source}
    """
    if not media_links_text:
        return []

    articles = []
    entries = media_links_text.strip().split("\n\n")

    for entry in entries:
        title_match = re.search(r'-\s*tytuł:\s*(.+)', entry, re.IGNORECASE)
        link_match = re.search(r'-\s*Link:\s*(https?://[^\s]+)', entry, re.IGNORECASE)

        if title_match and link_match:
            url = link_match.group(1)
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.replace("www.", "")

            articles.append({
                "title": title_match.group(1).strip(),
                "url": url,
                "source": domain
            })

    return articles


def generate_article_id(url: str) -> str:
    """Generate unique ID for article based on URL hash."""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def generate_snapshot_id(keyword_id: int, date: str) -> str:
    """Generate unique ID for trend snapshot."""
    return f"{keyword_id}_{date}"


class Neo4jSync:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    def close(self):
        self.driver.close()

    def create_constraints(self):
        """Create uniqueness constraints for node types."""
        constraints = [
            "CREATE CONSTRAINT keyword_id IF NOT EXISTS FOR (k:Keyword) REQUIRE k.id IS UNIQUE",
            "CREATE CONSTRAINT article_id IF NOT EXISTS FOR (a:Article) REQUIRE a.id IS UNIQUE",
            "CREATE CONSTRAINT domain_name IF NOT EXISTS FOR (d:Domain) REQUIRE d.name IS UNIQUE",
            "CREATE CONSTRAINT snapshot_id IF NOT EXISTS FOR (t:TrendSnapshot) REQUIRE t.id IS UNIQUE",
        ]

        with self.driver.session(database=NEO4J_DATABASE) as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                    print(f"Created constraint: {constraint[:50]}...")
                except Exception as e:
                    if "already exists" not in str(e).lower():
                        print(f"Warning: {e}")

    def fetch_trends(self, limit: int = 1000) -> list[dict]:
        """Fetch trends from Supabase."""
        print(f"Fetching up to {limit} trends from Supabase...")

        response = self.supabase.table("rrs_google_trends") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()

        print(f"Fetched {len(response.data)} trends")
        return response.data

    def sync_keyword(self, tx, trend: dict):
        """Create or update Keyword node."""
        query = """
        MERGE (k:Keyword {id: $id})
        SET k.name = $name,
            k.search_volume = $search_volume,
            k.traffic = $traffic
        RETURN k
        """

        tx.run(query,
            id=trend["id"],
            name=trend.get("keyword", ""),
            search_volume=trend.get("approx_traffic", 0),
            traffic=f"{trend.get('approx_traffic', 0)}K+"
        )

    def sync_trend_snapshot(self, tx, trend: dict):
        """Create TrendSnapshot and link to Keyword."""
        date_str = trend.get("pub_date", "")[:10] if trend.get("pub_date") else datetime.now().strftime("%Y-%m-%d")
        snapshot_id = generate_snapshot_id(trend["id"], date_str)

        query = """
        MATCH (k:Keyword {id: $keyword_id})
        MERGE (t:TrendSnapshot {id: $snapshot_id})
        SET t.date = date($date),
            t.search_volume = $search_volume,
            t.traffic = $traffic
        MERGE (k)-[:HAS_TREND {date: date($date)}]->(t)
        """

        tx.run(query,
            keyword_id=trend["id"],
            snapshot_id=snapshot_id,
            date=date_str,
            search_volume=trend.get("approx_traffic", 0),
            traffic=f"{trend.get('approx_traffic', 0)}K+"
        )

    def sync_articles(self, tx, trend: dict):
        """Create Article and Domain nodes, link to Keyword."""
        articles = parse_media_links(trend.get("media_links", ""))

        for article in articles:
            article_id = generate_article_id(article["url"])

            # Create/update Article
            article_query = """
            MERGE (a:Article {id: $id})
            SET a.title = $title,
                a.url = $url
            WITH a
            MATCH (k:Keyword {id: $keyword_id})
            MERGE (k)-[:HAS_ARTICLE {relevance: 1.0}]->(a)
            """

            tx.run(article_query,
                id=article_id,
                title=article["title"],
                url=article["url"],
                keyword_id=trend["id"]
            )

            # Create/update Domain and link
            domain_query = """
            MERGE (d:Domain {name: $domain})
            ON CREATE SET d.article_count = 1
            ON MATCH SET d.article_count = d.article_count + 1
            WITH d
            MATCH (a:Article {id: $article_id})
            MERGE (a)-[:PUBLISHED_ON]->(d)
            """

            tx.run(domain_query,
                domain=article["source"],
                article_id=article_id
            )

    def sync_related_keywords(self, tx, trends: list[dict]):
        """
        Create RELATED_TO relationships between keywords
        that share articles or have similar topics.
        """
        # Group keywords by shared domains
        keyword_domains = {}

        for trend in trends:
            articles = parse_media_links(trend.get("media_links", ""))
            domains = set(a["source"] for a in articles)
            keyword_domains[trend["id"]] = domains

        # Create relationships for keywords sharing domains
        processed = set()

        for id1, domains1 in keyword_domains.items():
            for id2, domains2 in keyword_domains.items():
                if id1 >= id2 or (id1, id2) in processed:
                    continue

                shared = domains1 & domains2
                if shared:
                    strength = len(shared) / max(len(domains1), len(domains2), 1)
                    if strength >= 0.3:  # Minimum 30% overlap
                        query = """
                        MATCH (k1:Keyword {id: $id1}), (k2:Keyword {id: $id2})
                        MERGE (k1)-[r:RELATED_TO]->(k2)
                        SET r.strength = $strength
                        """
                        tx.run(query, id1=id1, id2=id2, strength=strength)
                        processed.add((id1, id2))

    def run_sync(self, limit: int = 1000):
        """Main synchronization method."""
        print("=" * 50)
        print("Neo4j Sync - Starting synchronization")
        print("=" * 50)

        # Create constraints first
        print("\n1. Creating constraints...")
        self.create_constraints()

        # Fetch trends
        print("\n2. Fetching trends from Supabase...")
        trends = self.fetch_trends(limit)

        if not trends:
            print("No trends found. Exiting.")
            return

        # Sync data
        print(f"\n3. Syncing {len(trends)} trends to Neo4j...")

        with self.driver.session(database=NEO4J_DATABASE) as session:
            for i, trend in enumerate(trends):
                with session.begin_transaction() as tx:
                    self.sync_keyword(tx, trend)
                    self.sync_trend_snapshot(tx, trend)
                    self.sync_articles(tx, trend)
                    tx.commit()

                if (i + 1) % 100 == 0:
                    print(f"  Processed {i + 1}/{len(trends)} trends...")

            # Create relationships between keywords
            print("\n4. Creating keyword relationships...")
            with session.begin_transaction() as tx:
                self.sync_related_keywords(tx, trends)
                tx.commit()

        # Print summary
        print("\n" + "=" * 50)
        print("Synchronization complete!")
        self.print_stats()

    def print_stats(self):
        """Print statistics about the graph."""
        with self.driver.session(database=NEO4J_DATABASE) as session:
            stats = session.run("""
                MATCH (k:Keyword) WITH count(k) as keywords
                MATCH (a:Article) WITH keywords, count(a) as articles
                MATCH (d:Domain) WITH keywords, articles, count(d) as domains
                MATCH (t:TrendSnapshot) WITH keywords, articles, domains, count(t) as snapshots
                RETURN keywords, articles, domains, snapshots
            """).single()

            print(f"""
Graph Statistics:
-----------------
Keywords:        {stats['keywords']}
Articles:        {stats['articles']}
Domains:         {stats['domains']}
TrendSnapshots:  {stats['snapshots']}
""")


def main():
    sync = Neo4jSync()
    try:
        sync.run_sync(limit=1000)
    finally:
        sync.close()


if __name__ == "__main__":
    main()
