import { NextRequest, NextResponse } from 'next/server'

// Neo4j configuration from environment
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j'

// Convert bolt URI to HTTP API URL
function getHttpApiUrl(): string {
  let uri = NEO4J_URI
  // Handle different URI schemes
  uri = uri.replace('neo4j://', 'http://')
  uri = uri.replace('neo4j+s://', 'https://')
  uri = uri.replace('bolt://', 'http://')
  uri = uri.replace('bolt+s://', 'https://')
  // Change port from 7687 to 7474 for HTTP API
  uri = uri.replace(':7687', ':7474')
  return `${uri}/db/${NEO4J_DATABASE}/tx/commit`
}

interface Neo4jRecord {
  keys: string[]
  _fields: unknown[]
  _fieldLookup: Record<string, number>
}

interface Neo4jResponse {
  records: Neo4jRecord[]
  summary?: {
    counters?: {
      nodesCreated?: number
      nodesDeleted?: number
      relationshipsCreated?: number
      relationshipsDeleted?: number
    }
  }
}

/**
 * POST /api/neo4j/query
 * Execute Cypher query against Neo4j database
 *
 * Request body:
 * {
 *   query: string - Cypher query to execute
 *   params?: object - Optional parameters for the query
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   data: array of records
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    if (!NEO4J_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Neo4j not configured. Set NEO4J_PASSWORD in .env.local' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { query, params = {} } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate query - only allow read operations for safety
    const queryUpper = query.toUpperCase().trim()
    const dangerousKeywords = ['DELETE', 'REMOVE', 'DROP', 'CREATE', 'SET', 'MERGE']
    const isReadOnly = !dangerousKeywords.some(keyword =>
      queryUpper.includes(keyword) &&
      !queryUpper.startsWith('MATCH') // Allow MATCH ... CREATE for visualization
    )

    // For now, allow all queries in development
    // In production, you might want to restrict to read-only
    if (process.env.NODE_ENV === 'production' && !isReadOnly) {
      return NextResponse.json(
        { success: false, error: 'Only read queries are allowed' },
        { status: 403 }
      )
    }

    // Execute query using Neo4j HTTP API
    const response = await fetch(getHttpApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${NEO4J_USER}:${NEO4J_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({
        statements: [{ statement: query, parameters: params }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { success: false, error: `Neo4j error: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()

    if (result.errors && result.errors.length > 0) {
      return NextResponse.json(
        { success: false, error: result.errors[0].message },
        { status: 400 }
      )
    }

    // Transform Neo4j response to simpler format
    const records = result.results[0]?.data || []
    const columns = result.results[0]?.columns || []

    const data = records.map((record: { row: unknown[] }) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col: string, idx: number) => {
        obj[col] = record.row[idx]
      })
      return obj
    })

    return NextResponse.json({
      success: true,
      data,
      columns,
      count: data.length
    })

  } catch (error) {
    console.error('Neo4j query error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/neo4j/query
 * Check Neo4j connection status
 */
export async function GET() {
  try {
    if (!NEO4J_PASSWORD) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Neo4j not configured. Add NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD to .env.local'
      })
    }

    // Try to connect and get basic stats
    const response = await fetch(getHttpApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${NEO4J_USER}:${NEO4J_PASSWORD}`).toString('base64'),
      },
      body: JSON.stringify({
        statements: [{
          statement: `
            MATCH (k:Keyword) WITH count(k) as keywords
            MATCH (a:Article) WITH keywords, count(a) as articles
            MATCH (d:Domain) WITH keywords, articles, count(d) as domains
            RETURN keywords, articles, domains
          `
        }]
      })
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        message: 'Cannot connect to Neo4j'
      })
    }

    const result = await response.json()

    if (result.errors && result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: true,
        message: result.errors[0].message
      })
    }

    const stats = result.results[0]?.data[0]?.row || [0, 0, 0]

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      stats: {
        keywords: stats[0],
        articles: stats[1],
        domains: stats[2]
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      configured: !!NEO4J_PASSWORD,
      connected: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    })
  }
}
