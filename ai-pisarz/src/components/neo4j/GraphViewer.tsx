'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Search, ZoomIn, ZoomOut, Maximize2, AlertCircle, Info } from 'lucide-react'

// Dynamic import for react-force-graph-2d (requires window)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-lg">
      <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  ),
})

// Types
interface GraphNode {
  id: string
  name: string
  type: 'Keyword' | 'Article' | 'Domain' | 'TrendSnapshot'
  val: number // size
  color: string
  traffic?: number
  url?: string
  x?: number
  y?: number
}

interface GraphLink {
  source: string
  target: string
  type: string
  color: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// Soft, muted colors (pastel palette)
const NODE_COLORS: Record<string, string> = {
  Keyword: '#e8a87c',      // soft orange/peach
  Article: '#85c1ae',      // soft teal
  Domain: '#c38d94',       // soft rose
  TrendSnapshot: '#a8b5c4', // soft gray-blue
}

// Link colors (very subtle)
const LINK_COLORS: Record<string, string> = {
  HAS_ARTICLE: 'rgba(133, 193, 174, 0.3)',
  HAS_TREND: 'rgba(168, 181, 196, 0.3)',
  PUBLISHED_ON: 'rgba(195, 141, 148, 0.3)',
  RELATED_TO: 'rgba(232, 168, 124, 0.4)',
}

// Predefined queries
const PRESET_QUERIES = [
  {
    name: 'Top 50 keywords + artykuły',
    query: `MATCH (k:Keyword)
WITH k ORDER BY k.search_volume DESC LIMIT 50
OPTIONAL MATCH (k)-[r:HAS_ARTICLE]->(a:Article)
RETURN k, r, a LIMIT 200`,
  },
  {
    name: 'Powiązane słowa kluczowe',
    query: `MATCH (k1:Keyword)-[r:RELATED_TO]->(k2:Keyword)
RETURN k1, r, k2 LIMIT 100`,
  },
  {
    name: 'Top 20 domen + artykuły',
    query: `MATCH (d:Domain)<-[:PUBLISHED_ON]-(a:Article)
WITH d, count(a) as cnt ORDER BY cnt DESC LIMIT 20
MATCH (a2:Article)-[r:PUBLISHED_ON]->(d)
RETURN d, r, a2 LIMIT 150`,
  },
  {
    name: 'Tylko Keywords (top 100)',
    query: `MATCH (k:Keyword)
RETURN k ORDER BY k.search_volume DESC LIMIT 100`,
  },
  {
    name: 'Keywords + Domeny (przez artykuły)',
    query: `MATCH (k:Keyword)-[:HAS_ARTICLE]->(a:Article)-[:PUBLISHED_ON]->(d:Domain)
WITH k, d, count(a) as articles
WHERE articles > 1
RETURN k, d LIMIT 100`,
  },
]

export default function GraphViewer() {
  const graphRef = useRef<any>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuery, setSelectedQuery] = useState(PRESET_QUERIES[0].name)
  const [customQuery, setCustomQuery] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<{
    configured: boolean
    connected: boolean
    stats?: { keywords: number; articles: number; domains: number }
  } | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

  // Check connection on mount
  useEffect(() => {
    checkConnection()

    // Handle resize
    const handleResize = () => {
      const container = document.getElementById('graph-container')
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: 500,
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/neo4j/query')
      const data = await res.json()
      setConnectionStatus(data)

      if (data.success && data.stats && data.stats.keywords > 0) {
        executeQuery(PRESET_QUERIES[0].query)
      }
    } catch {
      setConnectionStatus({ configured: false, connected: false })
    }
  }

  const executeQuery = async (query: string) => {
    setLoading(true)
    setError(null)
    setSelectedNode(null)

    try {
      const res = await fetch('/api/neo4j/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Query failed')
        return
      }

      // Transform to graph format
      const nodes = new Map<string, GraphNode>()
      const links: GraphLink[] = []

      data.data.forEach((record: Record<string, unknown>) => {
        Object.entries(record).forEach(([key, value]) => {
          // Handle path results (array of nodes/relationships)
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object') {
                const val = item as Record<string, unknown>
                const nodeType = detectNodeType(val)
                if (nodeType) {
                  const nodeId = createNodeId(val, nodeType)
                  if (!nodes.has(nodeId)) {
                    const node = createNode(val, nodeType, nodeId)
                    nodes.set(nodeId, node)
                  }
                }
              }
            })
            // Create links between consecutive nodes in path
            for (let i = 0; i < value.length - 2; i += 2) {
              const sourceVal = value[i] as Record<string, unknown>
              const targetVal = value[i + 2] as Record<string, unknown>
              if (sourceVal && targetVal) {
                const sourceType = detectNodeType(sourceVal)
                const targetType = detectNodeType(targetVal)
                if (sourceType && targetType) {
                  const sourceId = createNodeId(sourceVal, sourceType)
                  const targetId = createNodeId(targetVal, targetType)
                  const linkType = getLinkType(sourceType, targetType)
                  const linkKey = `${sourceId}-${targetId}`
                  if (!links.some(l => `${l.source}-${l.target}` === linkKey)) {
                    links.push({
                      source: sourceId,
                      target: targetId,
                      type: linkType,
                      color: LINK_COLORS[linkType] || 'rgba(150,150,150,0.2)',
                    })
                  }
                }
              }
            }
            return
          }

          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const val = value as Record<string, unknown>

            // Detect node type and create node
            const nodeType = detectNodeType(val)
            if (nodeType) {
              const nodeId = createNodeId(val, nodeType)

              if (!nodes.has(nodeId)) {
                const node = createNode(val, nodeType, nodeId)
                nodes.set(nodeId, node)
              }
            }
          }
        })

        // Create links between nodes in same record
        const recordNodes = Object.values(record)
          .filter((v): v is Record<string, unknown> => v !== null && typeof v === 'object')
          .map((v) => {
            const type = detectNodeType(v)
            return type ? createNodeId(v, type) : null
          })
          .filter((id): id is string => id !== null)

        // Link consecutive nodes
        for (let i = 0; i < recordNodes.length - 1; i++) {
          const sourceId = recordNodes[i]
          const targetId = recordNodes[i + 1]

          if (sourceId !== targetId && nodes.has(sourceId) && nodes.has(targetId)) {
            const sourceType = nodes.get(sourceId)!.type
            const targetType = nodes.get(targetId)!.type
            const linkType = getLinkType(sourceType, targetType)

            // Avoid duplicate links
            const linkKey = `${sourceId}-${targetId}`
            if (!links.some(l => `${l.source}-${l.target}` === linkKey)) {
              links.push({
                source: sourceId,
                target: targetId,
                type: linkType,
                color: LINK_COLORS[linkType] || 'rgba(150,150,150,0.2)',
              })
            }
          }
        }
      })

      setGraphData({
        nodes: Array.from(nodes.values()),
        links,
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  const detectNodeType = (val: Record<string, unknown>): GraphNode['type'] | null => {
    if (val.search_volume !== undefined || (val.name && val.traffic)) return 'Keyword'
    if (val.url !== undefined || val.title !== undefined) return 'Article'
    if (val.article_count !== undefined || (val.name && !val.search_volume && !val.url)) return 'Domain'
    if (val.date !== undefined) return 'TrendSnapshot'
    // Fallback based on properties
    if (val.name && typeof val.name === 'string') {
      if (val.name.includes('.')) return 'Domain' // likely a domain
      return 'Keyword'
    }
    return null
  }

  const createNodeId = (val: Record<string, unknown>, type: string): string => {
    if (val.id) return `${type}-${val.id}`
    if (val.name) return `${type}-${val.name}`
    if (val.url) return `Article-${hashCode(String(val.url))}`
    if (val.title) return `Article-${hashCode(String(val.title))}`
    return `${type}-${Math.random().toString(36).substr(2, 9)}`
  }

  const createNode = (val: Record<string, unknown>, type: GraphNode['type'], id: string): GraphNode => {
    let name = ''
    let size = 4

    switch (type) {
      case 'Keyword':
        name = String(val.name || val.keyword || 'Keyword')
        size = Math.min(20, Math.max(6, Math.log10((val.search_volume as number) || 10) * 4))
        break
      case 'Article':
        name = String(val.title || 'Article').substring(0, 30)
        size = 3
        break
      case 'Domain':
        name = String(val.name || 'Domain')
        size = Math.min(15, Math.max(5, Math.log10((val.article_count as number) || 1) * 5 + 5))
        break
      case 'TrendSnapshot':
        name = String(val.date || 'Snapshot')
        size = 2
        break
    }

    return {
      id,
      name,
      type,
      val: size,
      color: NODE_COLORS[type],
      traffic: val.search_volume as number,
      url: val.url as string,
    }
  }

  const getLinkType = (sourceType: string, targetType: string): string => {
    if (sourceType === 'Keyword' && targetType === 'Article') return 'HAS_ARTICLE'
    if (sourceType === 'Keyword' && targetType === 'TrendSnapshot') return 'HAS_TREND'
    if (sourceType === 'Article' && targetType === 'Domain') return 'PUBLISHED_ON'
    if (sourceType === 'Keyword' && targetType === 'Keyword') return 'RELATED_TO'
    if (sourceType === 'Keyword' && targetType === 'Domain') return 'HAS_ARTICLE' // indirect
    return 'RELATED_TO'
  }

  const hashCode = (str: string): string => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  }

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)

    // Center on node
    if (graphRef.current && node.x !== undefined && node.y !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 500)
      graphRef.current.zoom(2, 500)
    }
  }, [])

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300)
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() * 0.7, 300)
  const handleReset = () => {
    graphRef.current?.zoomToFit(400, 50)
    setSelectedNode(null)
  }

  // Custom node rendering
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // Skip if coordinates not ready
    const x = node.x
    const y = node.y
    if (x === undefined || y === undefined || !isFinite(x) || !isFinite(y)) {
      return
    }

    const label = node.name
    const fontSize = Math.max(10 / globalScale, 2)
    const nodeSize = node.val || 4

    // Draw simple circle (no gradient for performance)
    ctx.beginPath()
    ctx.arc(x, y, nodeSize, 0, 2 * Math.PI)
    ctx.fillStyle = node.color
    ctx.fill()

    // Subtle border
    ctx.strokeStyle = adjustColor(node.color, -40)
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Label (only when zoomed in enough)
    if (globalScale > 0.7 && nodeSize >= 4) {
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // Text shadow for readability
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillText(label, x + 0.5, y + nodeSize + 2.5)

      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(label, x, y + nodeSize + 2)
    }
  }, [])

  // Adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
    return `rgb(${r},${g},${b})`
  }

  if (!connectionStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!connectionStatus.configured || !connectionStatus.connected) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {!connectionStatus.configured
            ? 'Neo4j nie jest skonfigurowany. Dodaj zmienne NEO4J_* do .env.local'
            : 'Nie można połączyć się z Neo4j. Sprawdź czy baza jest uruchomiona.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Graf powiązań</span>
            {connectionStatus.stats && (
              <div className="flex gap-2 text-sm font-normal">
                <Badge variant="outline" className="bg-[#e8a87c]/20 border-[#e8a87c]/50">
                  {connectionStatus.stats.keywords} keywords
                </Badge>
                <Badge variant="outline" className="bg-[#85c1ae]/20 border-[#85c1ae]/50">
                  {connectionStatus.stats.articles} articles
                </Badge>
                <Badge variant="outline" className="bg-[#c38d94]/20 border-[#c38d94]/50">
                  {connectionStatus.stats.domains} domains
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Query selection */}
          <div className="flex gap-2 flex-wrap">
            <Select
              value={selectedQuery}
              onValueChange={(value) => {
                setSelectedQuery(value)
                const query = PRESET_QUERIES.find(q => q.name === value)
                if (query) executeQuery(query.query)
              }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Wybierz widok..." />
              </SelectTrigger>
              <SelectContent>
                {PRESET_QUERIES.map((q) => (
                  <SelectItem key={q.name} value={q.name}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={handleZoomIn} title="Przybliż">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut} title="Oddal">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="Resetuj widok">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => executeQuery(PRESET_QUERIES.find(q => q.name === selectedQuery)?.query || '')}
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Odśwież</span>
            </Button>
          </div>

          {/* Custom query */}
          <div className="flex gap-2">
            <Input
              placeholder="Własne zapytanie Cypher..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customQuery && executeQuery(customQuery)}
              className="font-mono text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => customQuery && executeQuery(customQuery)}
              disabled={loading || !customQuery}
            >
              <Search className="h-4 w-4 mr-2" />
              Wykonaj
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Graph */}
      <Card>
        <CardContent className="p-0">
          <div
            id="graph-container"
            className="relative rounded-lg overflow-hidden bg-slate-900"
            style={{ height: '500px' }}
          >
            {graphData && (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                width={dimensions.width}
                height={500}
                backgroundColor="#0f172a"
                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={(node, color, ctx) => {
                  const x = node.x
                  const y = node.y
                  if (x === undefined || y === undefined || !isFinite(x) || !isFinite(y)) return
                  ctx.beginPath()
                  ctx.arc(x, y, (node as GraphNode).val || 4, 0, 2 * Math.PI)
                  ctx.fillStyle = color
                  ctx.fill()
                }}
                linkColor={(link) => (link as GraphLink).color}
                linkWidth={1}
                linkDirectionalParticles={0}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                warmupTicks={50}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                minZoom={0.3}
                maxZoom={8}
              />
            )}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg text-xs">
              <div className="flex flex-col gap-1.5">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-300">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {graphData && (
              <div className="absolute top-3 right-3 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-slate-300">
                {graphData.nodes.length} węzłów, {graphData.links.length} połączeń
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            )}

            {/* Hint */}
            <div className="absolute bottom-3 right-3 text-xs text-slate-500">
              Scroll = zoom • Drag = pan • Click = select
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected node details */}
      {selectedNode && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="truncate">{selectedNode.name}</span>
              <Badge variant="outline" className="ml-auto">{selectedNode.type}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex gap-4 flex-wrap">
              {selectedNode.traffic && (
                <span>Traffic: <strong>{selectedNode.traffic}K+</strong></span>
              )}
              {selectedNode.url && (
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline truncate max-w-xs"
                >
                  {selectedNode.url}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <strong>Wskazówki:</strong> Użyj scrolla do przybliżania/oddalania. Przeciągnij tło żeby przesunąć widok.
          Kliknij węzeł żeby zobaczyć szczegóły. Większe węzły = większy traffic/więcej artykułów.
        </div>
      </div>
    </div>
  )
}
