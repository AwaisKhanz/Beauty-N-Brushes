/**
 * Advanced AI Matching Engine
 * Hybrid approach combining vector similarity + semantic tags + category awareness
 */

export interface MatchingConfig {
  vectorWeight: number; // 0-1
  tagWeight: number; // 0-1
  categoryWeight: number; // 0-1
}

export class MatchingEngine {
  // Category-specific matching configurations
  private static readonly CATEGORY_CONFIGS: Record<string, MatchingConfig> = {
    hair: { vectorWeight: 0.6, tagWeight: 0.3, categoryWeight: 0.1 },
    makeup: { vectorWeight: 0.5, tagWeight: 0.4, categoryWeight: 0.1 },
    nails: { vectorWeight: 0.4, tagWeight: 0.5, categoryWeight: 0.1 },
    lashes: { vectorWeight: 0.5, tagWeight: 0.4, categoryWeight: 0.1 },
    brows: { vectorWeight: 0.5, tagWeight: 0.4, categoryWeight: 0.1 },
    skincare: { vectorWeight: 0.6, tagWeight: 0.3, categoryWeight: 0.1 },
    default: { vectorWeight: 0.5, tagWeight: 0.4, categoryWeight: 0.1 },
  };

  /**
   * Tag synonyms and related terms for better matching
   */
  private static readonly TAG_SYNONYMS: Record<string, string[]> = {
    // Hair - Braids
    'box-braids': ['box braids', 'boxbraids', 'individual braids', 'singles'],
    'knotless-braids': ['knotless', 'no-knot braids', 'tension-free braids'],
    cornrows: ['corn rows', 'canerows', 'rows', 'feed-in braids'],
    'passion-twists': ['passion twist', 'spring twists', 'water wave twists'],
    'faux-locs': ['faux locs', 'fake locs', 'goddess locs', 'bohemian locs'],

    // Hair - Natural
    'silk-press': ['silk press', 'straightening', 'flat iron', 'press'],
    'wash-and-go': ['wash and go', 'wash n go', 'wng', 'natural curls'],
    'twist-out': ['twist out', 'twistout', 'defined curls'],
    afro: ['natural hair', 'fro', 'natural afro', 'big hair'],

    // Makeup
    'natural-makeup': ['natural glam', 'no-makeup makeup', 'soft glam', 'everyday makeup'],
    'glam-makeup': ['full glam', 'glamorous', 'dramatic makeup', 'evening makeup'],
    'smokey-eye': ['smoky eye', 'smokey eyes', 'dark eyes', 'dramatic eyes'],
    'bridal-makeup': ['wedding makeup', 'bride makeup', 'bridal glam'],

    // Nails
    'french-tips': ['french tip', 'french manicure', 'french nails', 'classic french'],
    'ombre-nails': ['ombre', 'gradient nails', 'fade nails', 'color fade'],
    'acrylic-nails': ['acrylic', 'acrylics', 'acrylic extensions'],
    'gel-nails': ['gel', 'gel polish', 'shellac', 'gel manicure'],

    // Lashes
    'volume-lashes': ['volume', 'voluminous lashes', 'full lashes', 'dramatic lashes'],
    'classic-lashes': ['classic', 'natural lashes', 'simple lashes'],
    'hybrid-lashes': ['hybrid', 'mixed lashes', 'classic-volume'],

    // General
    natural: ['organic', 'au naturel', 'minimalist', 'simple'],
    dramatic: ['bold', 'statement', 'striking', 'eye-catching'],
    professional: ['polished', 'refined', 'elegant', 'sophisticated'],
  };

  /**
   * Normalize tag for consistent matching
   */
  static normalizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
      .replace(/\s+/g, '-') // Convert spaces to hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  }

  /**
   * Expand tags with synonyms and related terms
   */
  static expandTags(tags: string[]): string[] {
    const expanded = new Set<string>();

    tags.forEach((tag) => {
      const normalized = this.normalizeTag(tag);
      expanded.add(normalized);

      // Add synonyms
      const synonyms = this.TAG_SYNONYMS[normalized] || [];
      synonyms.forEach((syn) => expanded.add(this.normalizeTag(syn)));
    });

    return Array.from(expanded);
  }

  /**
   * Calculate tag overlap score (Jaccard similarity with synonym expansion)
   */
  static calculateTagOverlap(tags1: string[], tags2: string[]): number {
    if (tags1.length === 0 || tags2.length === 0) return 0;

    const expanded1 = this.expandTags(tags1);
    const expanded2 = this.expandTags(tags2);

    const set2 = new Set(expanded2);

    // Calculate Jaccard similarity
    const intersection = expanded1.filter((tag) => set2.has(tag)).length;
    const union = new Set([...expanded1, ...expanded2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Calculate hybrid match score
   * Combines: vector similarity + tag overlap + category match
   */
  static calculateHybridScore(
    vectorDistance: number,
    inspirationTags: string[],
    serviceTags: string[],
    serviceCategory: string
  ): {
    finalScore: number;
    vectorScore: number;
    tagScore: number;
    breakdown: string;
  } {
    // Get category-specific weights
    const categoryLower = serviceCategory.toLowerCase();
    const config = this.CATEGORY_CONFIGS[categoryLower] || this.CATEGORY_CONFIGS.default;

    // 1. Vector Similarity Score (0-100)
    const cosineSimilarity = 1 - vectorDistance;
    const vectorScore = this.convertSimilarityToScore(cosineSimilarity);

    // 2. Tag Overlap Score (0-100)
    const tagOverlap = this.calculateTagOverlap(inspirationTags, serviceTags);
    const tagScore = tagOverlap * 100;

    // 3. Weighted Final Score
    const finalScore = vectorScore * config.vectorWeight + tagScore * config.tagWeight;

    const breakdown = `Vector: ${vectorScore.toFixed(1)}% (${(config.vectorWeight * 100).toFixed(0)}%) + Tags: ${tagScore.toFixed(1)}% (${(config.tagWeight * 100).toFixed(0)}%)`;

    return {
      finalScore: Math.round(Math.min(100, Math.max(0, finalScore))),
      vectorScore: Math.round(vectorScore),
      tagScore: Math.round(tagScore),
      breakdown,
    };
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
   * Extract matching tags between two tag arrays (with synonym awareness)
   */
  static extractMatchingTags(tags1: string[], tags2: string[]): string[] {
    const set2 = new Set(this.expandTags(tags2));

    // Find all tags from tags1 that match expanded tags2
    return tags1.filter((tag) => {
      const normalized = this.normalizeTag(tag);
      const expanded = this.TAG_SYNONYMS[normalized] || [normalized];
      return expanded.some((exp) => set2.has(this.normalizeTag(exp)));
    });
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
