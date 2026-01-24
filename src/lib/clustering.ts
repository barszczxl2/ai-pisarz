// Clustering utilities for semantic search

import { GoogleTrendWithEmbedding, ClusterNode, ClusterLink, GraphData } from '@/types/database';

// Algorithm type for clustering
export type ClusteringAlgorithm = 'union-find' | 'kmeans';

/**
 * Parse pgvector embedding string to number array
 * Format: "[-0.07, 0.04, ...]" or "[...]"
 */
export function parseEmbedding(embeddingStr: string | null): number[] | null {
  if (!embeddingStr) return null;

  try {
    // Remove brackets and parse
    const cleaned = embeddingStr.trim();
    if (!cleaned.startsWith('[') || !cleaned.endsWith(']')) {
      return null;
    }

    const values = JSON.parse(cleaned);
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }

    return values.map(Number);
  } catch {
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Build similarity matrix for all trends with embeddings
 */
export function buildSimilarityMatrix(
  trends: GoogleTrendWithEmbedding[]
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();
  const embeddings = new Map<string, number[]>();

  // Parse all embeddings
  for (const trend of trends) {
    const embedding = parseEmbedding(trend.embedding);
    if (embedding) {
      embeddings.set(String(trend.id), embedding);
    }
  }

  // Calculate pairwise similarities
  const ids = Array.from(embeddings.keys());
  for (let i = 0; i < ids.length; i++) {
    const row = new Map<string, number>();
    for (let j = 0; j < ids.length; j++) {
      if (i !== j) {
        const similarity = cosineSimilarity(
          embeddings.get(ids[i])!,
          embeddings.get(ids[j])!
        );
        row.set(ids[j], similarity);
      }
    }
    matrix.set(ids[i], row);
  }

  return matrix;
}

/**
 * Find connected components using Union-Find
 */
function findClusters(
  ids: string[],
  edges: Array<[string, string]>
): Map<string, number> {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  // Initialize
  for (const id of ids) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  // Find with path compression
  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }

  // Union by rank
  function union(x: string, y: string): void {
    const rootX = find(x);
    const rootY = find(y);

    if (rootX !== rootY) {
      const rankX = rank.get(rootX)!;
      const rankY = rank.get(rootY)!;

      if (rankX < rankY) {
        parent.set(rootX, rootY);
      } else if (rankX > rankY) {
        parent.set(rootY, rootX);
      } else {
        parent.set(rootY, rootX);
        rank.set(rootX, rankX + 1);
      }
    }
  }

  // Union all edges
  for (const [a, b] of edges) {
    union(a, b);
  }

  // Assign cluster IDs
  const roots = new Map<string, number>();
  const clusters = new Map<string, number>();
  let nextCluster = 0;

  for (const id of ids) {
    const root = find(id);
    if (!roots.has(root)) {
      roots.set(root, nextCluster++);
    }
    clusters.set(id, roots.get(root)!);
  }

  return clusters;
}

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * K-Means++ initialization for better centroid selection
 */
function kMeansPlusPlusInit(
  embeddings: number[][],
  k: number
): number[][] {
  const centroids: number[][] = [];
  const n = embeddings.length;

  // Pick first centroid randomly
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push([...embeddings[firstIdx]]);

  // Pick remaining centroids with probability proportional to squared distance
  for (let c = 1; c < k; c++) {
    const distances: number[] = [];
    let totalDist = 0;

    for (let i = 0; i < n; i++) {
      // Find minimum distance to existing centroids
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(embeddings[i], centroid);
        if (dist < minDist) minDist = dist;
      }
      distances.push(minDist * minDist);
      totalDist += minDist * minDist;
    }

    // Select next centroid with weighted probability
    let threshold = Math.random() * totalDist;
    let selectedIdx = 0;
    for (let i = 0; i < n; i++) {
      threshold -= distances[i];
      if (threshold <= 0) {
        selectedIdx = i;
        break;
      }
    }

    centroids.push([...embeddings[selectedIdx]]);
  }

  return centroids;
}

/**
 * Run k-means clustering
 */
function runKMeans(
  embeddings: number[][],
  k: number,
  maxIterations: number = 100
): { assignments: number[]; centroids: number[][] } {
  const n = embeddings.length;
  const dim = embeddings[0].length;

  // Initialize centroids using k-means++
  let centroids = kMeansPlusPlusInit(embeddings, k);
  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    const newAssignments: number[] = [];
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let nearestCentroid = 0;
      for (let c = 0; c < k; c++) {
        const dist = euclideanDistance(embeddings[i], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          nearestCentroid = c;
        }
      }
      newAssignments.push(nearestCentroid);
    }

    // Check for convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;

    if (!changed) break;

    // Update centroids
    const newCentroids: number[][] = [];
    for (let c = 0; c < k; c++) {
      const clusterPoints = embeddings.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length === 0) {
        // Keep old centroid if cluster is empty
        newCentroids.push(centroids[c]);
      } else {
        // Calculate mean
        const newCentroid = new Array(dim).fill(0);
        for (const point of clusterPoints) {
          for (let d = 0; d < dim; d++) {
            newCentroid[d] += point[d] / clusterPoints.length;
          }
        }
        newCentroids.push(newCentroid);
      }
    }
    centroids = newCentroids;
  }

  return { assignments, centroids };
}

/**
 * Calculate silhouette score for clustering quality
 * Range: -1 (bad) to 1 (good)
 */
function calculateSilhouetteScore(
  embeddings: number[][],
  assignments: number[],
  k: number
): number {
  const n = embeddings.length;
  if (n <= k || k <= 1) return 0;

  let totalScore = 0;
  let validPoints = 0;

  for (let i = 0; i < n; i++) {
    const cluster = assignments[i];

    // Calculate a(i) - mean distance to same cluster
    const sameCluster = embeddings.filter((_, j) => j !== i && assignments[j] === cluster);
    if (sameCluster.length === 0) continue;

    let a = 0;
    for (const point of sameCluster) {
      a += euclideanDistance(embeddings[i], point);
    }
    a /= sameCluster.length;

    // Calculate b(i) - min mean distance to other clusters
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === cluster) continue;

      const otherCluster = embeddings.filter((_, j) => assignments[j] === c);
      if (otherCluster.length === 0) continue;

      let meanDist = 0;
      for (const point of otherCluster) {
        meanDist += euclideanDistance(embeddings[i], point);
      }
      meanDist /= otherCluster.length;

      if (meanDist < b) b = meanDist;
    }

    if (b === Infinity) continue;

    // Silhouette coefficient
    const s = (b - a) / Math.max(a, b);
    totalScore += s;
    validPoints++;
  }

  return validPoints > 0 ? totalScore / validPoints : 0;
}

/**
 * K-Means clustering with automatic k selection using silhouette score
 */
export function kMeansClustering(
  embeddings: Map<string, number[]>,
  maxK: number = 10
): Map<string, number> {
  const ids = Array.from(embeddings.keys());
  const embeddingArrays = ids.map(id => embeddings.get(id)!);
  const n = embeddingArrays.length;

  if (n <= 2) {
    // Too few points - each in its own cluster
    const result = new Map<string, number>();
    ids.forEach((id, i) => result.set(id, i));
    return result;
  }

  // Try different values of k
  const minK = 2;
  const testMaxK = Math.min(maxK, Math.floor(n / 2), n - 1);

  let bestScore = -1;
  let bestAssignments: number[] = [];

  for (let k = minK; k <= testMaxK; k++) {
    const { assignments } = runKMeans(embeddingArrays, k);
    const score = calculateSilhouetteScore(embeddingArrays, assignments, k);

    if (score > bestScore) {
      bestScore = score;
      bestAssignments = assignments;
    }
  }

  // Create result map
  const result = new Map<string, number>();
  ids.forEach((id, i) => result.set(id, bestAssignments[i]));

  return result;
}

/**
 * Build graph data for visualization
 */
export function buildGraphData(
  trends: GoogleTrendWithEmbedding[],
  similarityThreshold: number = 0.7,
  algorithm: ClusteringAlgorithm = 'union-find'
): GraphData {
  // Filter trends with embeddings
  const trendsWithEmbeddings = trends.filter(t => t.embedding);

  if (trendsWithEmbeddings.length === 0) {
    return { nodes: [], links: [] };
  }

  // Build similarity matrix
  const similarityMatrix = buildSimilarityMatrix(trendsWithEmbeddings);

  // Build edges (links) above threshold
  const edges: Array<[string, string]> = [];
  const links: ClusterLink[] = [];

  const processedPairs = new Set<string>();

  for (const [sourceId, similarities] of similarityMatrix) {
    for (const [targetId, similarity] of similarities) {
      if (similarity >= similarityThreshold) {
        // Avoid duplicate edges (A-B and B-A)
        const pairKey = [sourceId, targetId].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          edges.push([sourceId, targetId]);
          links.push({
            source: sourceId,
            target: targetId,
            similarity,
          });
        }
      }
    }
  }

  // Find clusters based on selected algorithm
  const ids = trendsWithEmbeddings.map(t => String(t.id));
  let clusters: Map<string, number>;

  if (algorithm === 'kmeans') {
    // Build embeddings map for k-means
    const embeddingsMap = new Map<string, number[]>();
    for (const trend of trendsWithEmbeddings) {
      const embedding = parseEmbedding(trend.embedding);
      if (embedding) {
        embeddingsMap.set(String(trend.id), embedding);
      }
    }
    clusters = kMeansClustering(embeddingsMap);
  } else {
    // Default: Union-Find based on connected components
    clusters = findClusters(ids, edges);
  }

  // Build nodes with extended data for modal
  const nodes: ClusterNode[] = trendsWithEmbeddings.map(trend => ({
    id: String(trend.id),
    keyword: trend.keyword,
    traffic: trend.approx_traffic || 0,
    cluster: clusters.get(String(trend.id)) || 0,
    hasInteria: trend.has_interia,
    description: trend.description,
    // Extended fields for TrendDetailsModal
    pubDate: trend.pub_date,
    media: trend.media,
    mediaLinks: trend.media_links,
    picture: trend.picture,
    embeddingText: trend.embedding_text,
    trendId: trend.trend_id,
  }));

  return { nodes, links };
}

/**
 * Get cluster colors based on cluster ID
 */
export const CLUSTER_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

export function getClusterColor(clusterId: number): string {
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}

/**
 * Filter graph data by various criteria
 */
export function filterGraphData(
  data: GraphData,
  options: {
    minTraffic?: number;
    onlyInteria?: boolean;
    searchQuery?: string;
  }
): GraphData {
  const { minTraffic = 0, onlyInteria = false, searchQuery = '' } = options;

  // Filter nodes
  const filteredNodes = data.nodes.filter(node => {
    if (node.traffic < minTraffic) return false;
    if (onlyInteria && !node.hasInteria) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!node.keyword.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  // Get filtered node IDs
  const nodeIds = new Set(filteredNodes.map(n => n.id));

  // Filter links to only include edges between filtered nodes
  const filteredLinks = data.links.filter(
    link => nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
  );

  return { nodes: filteredNodes, links: filteredLinks };
}

/**
 * Generate a cluster name based on top keywords
 */
export function generateClusterName(nodes: ClusterNode[], clusterId: number): string {
  const clusterNodes = nodes.filter(n => n.cluster === clusterId);

  if (clusterNodes.length === 0) return 'Pusta grupa';
  if (clusterNodes.length === 1) return clusterNodes[0].keyword;

  // Sort by traffic and take top 2-3 keywords
  const sorted = [...clusterNodes].sort((a, b) => b.traffic - a.traffic);
  const topKeywords = sorted.slice(0, Math.min(2, sorted.length));

  // Create a short name from the top keywords
  const name = topKeywords.map(n => {
    // Truncate long keywords
    const keyword = n.keyword;
    return keyword.length > 15 ? keyword.substring(0, 15) + '...' : keyword;
  }).join(', ');

  return name;
}

/**
 * Get statistics for a cluster
 */
export function getClusterStats(
  nodes: ClusterNode[],
  clusterId: number
): {
  count: number;
  totalTraffic: number;
  interiaCount: number;
  interiaPercentage: number;
} {
  const clusterNodes = nodes.filter(n => n.cluster === clusterId);
  const count = clusterNodes.length;
  const totalTraffic = clusterNodes.reduce((sum, n) => sum + n.traffic, 0);
  const interiaCount = clusterNodes.filter(n => n.hasInteria).length;

  return {
    count,
    totalTraffic,
    interiaCount,
    interiaPercentage: count > 0 ? Math.round((interiaCount / count) * 100) : 0,
  };
}
