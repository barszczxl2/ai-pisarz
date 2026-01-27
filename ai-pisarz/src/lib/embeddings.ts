/**
 * Embedding utilities for semantic search
 */

/**
 * Parse embedding from pgvector string format
 * Example: "[0.1,0.2,0.3]" -> [0.1, 0.2, 0.3]
 */
export function parseEmbedding(embedding: string | number[] | null | undefined): number[] | null {
  if (!embedding) return null

  // Already an array
  if (Array.isArray(embedding)) {
    return embedding
  }

  // String format from pgvector
  if (typeof embedding === 'string') {
    try {
      // Remove brackets and split
      const cleaned = embedding.replace(/^\[|\]$/g, '')
      const values = cleaned.split(',').map((v) => parseFloat(v.trim()))

      // Validate all values are numbers
      if (values.some(isNaN)) {
        return null
      }

      return values
    } catch {
      return null
    }
  }

  return null
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`)
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

  if (magnitude === 0) {
    return 0
  }

  return dotProduct / magnitude
}
