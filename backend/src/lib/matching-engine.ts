/**
 * Simplified AI Matching Engine
 * Uses ONLY vector similarity for matching (no tag weighting)
 */

export class MatchingEngine {
  /**
   * Calculate match score using ONLY vector similarity
   * Direct vector similarity calculation - no hybrid complexity
   */
  static calculateVectorScore(vectorDistance: number): number {
    const cosineSimilarity = 1 - vectorDistance;
    return this.convertSimilarityToScore(cosineSimilarity);
  }

  /**
   * Convert cosine similarity to realistic match score
   */
  private static convertSimilarityToScore(cosineSimilarity: number): number {
    // Non-linear scaling for more realistic perception
    if (cosineSimilarity >= 0.98) {
      // 98-100% similarity = Nearly identical (score: 95-100)
      return 95 + (cosineSimilarity - 0.98) * 250;
    } else if (cosineSimilarity >= 0.9) {
      // 90-98% similarity = Very similar (score: 85-95)
      return 85 + (cosineSimilarity - 0.9) * 125;
    } else if (cosineSimilarity >= 0.8) {
      // 80-90% similarity = Similar (score: 70-85)
      return 70 + (cosineSimilarity - 0.8) * 150;
    } else if (cosineSimilarity >= 0.7) {
      // 70-80% similarity = Somewhat similar (score: 55-70)
      return 55 + (cosineSimilarity - 0.7) * 150;
    } else if (cosineSimilarity >= 0.6) {
      // 60-70% similarity = Loosely related (score: 40-55)
      return 40 + (cosineSimilarity - 0.6) * 150;
    } else {
      // < 60% similarity = Low match (score: 0-40)
      return Math.max(0, cosineSimilarity * 66.7);
    }
  }

  /**
   * Extract matching tags between two tag arrays (simple string matching)
   */
  static extractMatchingTags(tags1: string[], tags2: string[]): string[] {
    const normalizedTags2 = new Set(tags2.map((t) => t.toLowerCase().trim()));
    return tags1.filter((tag) => normalizedTags2.has(tag.toLowerCase().trim()));
  }

  /**
   * Re-rank matches based on multiple factors
   */
  static reRankMatches<T extends { finalScore: number; distance: number }>(
    matches: T[],
    options: {
      minScore?: number;
      diversityBoost?: boolean;
      categoryPreference?: string;
    } = {}
  ): T[] {
    const { minScore = 40, diversityBoost = false } = options;

    // Filter by minimum score
    let filtered = matches.filter((m) => m.finalScore >= minScore);

    // Sort by final score (descending)
    filtered.sort((a, b) => b.finalScore - a.finalScore);

    // Optional: Boost diversity (reduce clustering of very similar results)
    if (diversityBoost && filtered.length > 5) {
      const diversified: T[] = [filtered[0]]; // Keep top match
      const remaining = filtered.slice(1);

      for (const match of remaining) {
        // Check if it's sufficiently different from already selected
        const isDifferent = diversified.every(
          (selected) => Math.abs(selected.distance - match.distance) > 0.05
        );

        if (isDifferent || diversified.length < 3) {
          diversified.push(match);
        }
      }

      return diversified;
    }

    return filtered;
  }
}
