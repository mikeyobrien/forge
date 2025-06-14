// ABOUTME: This file extends the relevance scoring with advanced features
// ABOUTME: including fuzzy matching, wildcard support, and field boosting

import { IndexedDocument } from './types.js';
import { QueryClause, ParsedQuery } from './advanced-types.js';
import { FuzzyMatcher } from './fuzzy-matcher.js';
import { RelevanceScorer } from './relevance.js';

/**
 * Advanced relevance scoring configuration
 */
export interface AdvancedScoringConfig {
  /** Base scoring weights */
  baseWeights: {
    exactMatch: number;
    fuzzyMatch: number;
    wildcardMatch: number;
    phraseMatch: number;
  };

  /** Field-specific boost factors */
  fieldBoosts: {
    title: number;
    content: number;
    tags: number;
  };

  /** Fuzzy matching tolerance */
  fuzzyTolerance: number;

  /** Boost for matching all terms vs some terms */
  allTermsBoost: number;
}

/**
 * Default advanced scoring configuration
 */
export const DEFAULT_ADVANCED_CONFIG: AdvancedScoringConfig = {
  baseWeights: {
    exactMatch: 100,
    fuzzyMatch: 70,
    wildcardMatch: 80,
    phraseMatch: 90,
  },
  fieldBoosts: {
    title: 2.0,
    content: 1.0,
    tags: 1.5,
  },
  fuzzyTolerance: 0.8,
  allTermsBoost: 1.2,
};

/**
 * Advanced relevance scorer with fuzzy matching and complex queries
 */
export class AdvancedRelevanceScorer extends RelevanceScorer {
  private readonly fuzzyMatcher: FuzzyMatcher;

  constructor(private readonly config: AdvancedScoringConfig = DEFAULT_ADVANCED_CONFIG) {
    super();
    this.fuzzyMatcher = new FuzzyMatcher();
  }

  /**
   * Calculate relevance score for parsed query
   */
  calculateAdvancedScore(document: IndexedDocument, query: ParsedQuery): number {
    let score = 0;

    // Score MUST clauses (all must match)
    const mustScores = query.must.map((clause) => this.scoreClause(document, clause));
    if (query.must.length > 0 && mustScores.some((s) => s === 0)) {
      // If any MUST clause doesn't match, document doesn't match
      return 0;
    }
    score += mustScores.reduce((sum, s) => sum + s, 0);

    // Score SHOULD clauses (at least one should match)
    const shouldScores = query.should.map((clause) => this.scoreClause(document, clause));
    if (query.should.length > 0) {
      // Use the best score from SHOULD clauses
      const bestShouldScore = Math.max(...shouldScores, 0);
      score += bestShouldScore * 0.7; // Slightly lower weight for optional matches
    }

    // Check MUST_NOT clauses (none should match)
    const mustNotScores = query.mustNot.map((clause) => this.scoreClause(document, clause));
    if (mustNotScores.some((s) => s > 0)) {
      // If any MUST_NOT clause matches, document doesn't match
      return 0;
    }

    // Apply all-terms boost if all clauses matched well
    const totalClauses = query.must.length + query.should.length;
    const matchedClauses = [...mustScores, ...shouldScores].filter((s) => s > 0).length;
    if (totalClauses > 0 && matchedClauses === totalClauses) {
      score *= this.config.allTermsBoost;
    }

    // Normalize to 0-100 range
    const normalized = Math.min(100, Math.max(0, Math.round(score)));

    // Ensure different queries produce different scores when possible
    if (normalized === 100 && score < 100) {
      return 99; // Reserve 100 for perfect matches
    }

    return normalized;
  }

  /**
   * Score a single query clause
   */
  private scoreClause(document: IndexedDocument, clause: QueryClause): number {
    let score = 0;

    // Determine which fields to search
    const fields =
      clause.field === 'all' || !clause.field
        ? (['title', 'content', 'tags'] as const)
        : [clause.field];

    // Score each field
    for (const field of fields) {
      const fieldScore = this.scoreFieldMatch(document, field, clause);
      if (fieldScore > 0) {
        score += fieldScore * this.config.fieldBoosts[field];
      }
    }

    return score;
  }

  /**
   * Score a field match based on clause type
   */
  private scoreFieldMatch(
    document: IndexedDocument,
    field: 'title' | 'content' | 'tags',
    clause: QueryClause,
  ): number {
    const fieldValue = this.getFieldValue(document, field);
    if (!fieldValue) return 0;

    switch (clause.type) {
      case 'exact':
        return this.scoreExactMatch(fieldValue, clause.value);

      case 'fuzzy':
        return this.scoreFuzzyMatch(
          fieldValue,
          clause.value,
          clause.fuzzyTolerance || this.config.fuzzyTolerance,
        );

      case 'wildcard':
        return this.scoreWildcardMatch(fieldValue, clause.value);

      case 'phrase':
        return this.scorePhraseMatch(fieldValue, clause.value);

      case 'regex':
        return this.scoreRegexMatch(fieldValue, clause.value);

      default:
        return 0;
    }
  }

  /**
   * Get field value from document
   */
  private getFieldValue(document: IndexedDocument, field: 'title' | 'content' | 'tags'): string {
    switch (field) {
      case 'title':
        return document.title;
      case 'content':
        return document.content;
      case 'tags':
        return document.tags.join(' ');
      default:
        return '';
    }
  }

  /**
   * Score exact match
   */
  private scoreExactMatch(fieldValue: string, queryValue: string): number {
    const normalizedField = fieldValue.toLowerCase();
    const normalizedQuery = queryValue.toLowerCase();

    if (normalizedField === normalizedQuery) {
      return this.config.baseWeights.exactMatch;
    }

    if (normalizedField.includes(normalizedQuery)) {
      return this.config.baseWeights.exactMatch * 0.8;
    }

    return 0;
  }

  /**
   * Score fuzzy match
   */
  private scoreFuzzyMatch(fieldValue: string, queryValue: string, tolerance: number): number {
    // Try full string similarity
    const fullSimilarity = this.fuzzyMatcher.calculateSimilarity(fieldValue, queryValue);
    if (fullSimilarity >= tolerance) {
      return this.config.baseWeights.fuzzyMatch * fullSimilarity;
    }

    // Try token-based similarity for multi-word fields
    const tokenSimilarity = this.fuzzyMatcher.calculateTokenSimilarity(fieldValue, queryValue);
    if (tokenSimilarity >= tolerance) {
      return this.config.baseWeights.fuzzyMatch * tokenSimilarity * 0.9;
    }

    return 0;
  }

  /**
   * Score wildcard match
   */
  private scoreWildcardMatch(fieldValue: string, pattern: string): number {
    const regex = this.wildcardToRegex(pattern);

    try {
      if (regex.test(fieldValue.toLowerCase())) {
        return this.config.baseWeights.wildcardMatch;
      }
    } catch {
      // Invalid regex, no match
    }

    return 0;
  }

  /**
   * Score phrase match
   */
  private scorePhraseMatch(fieldValue: string, phrase: string): number {
    const normalizedField = fieldValue.toLowerCase();
    const normalizedPhrase = phrase.toLowerCase();

    if (normalizedField.includes(normalizedPhrase)) {
      // Boost if phrase appears at the beginning
      if (normalizedField.startsWith(normalizedPhrase)) {
        return this.config.baseWeights.phraseMatch * 1.1;
      }
      return this.config.baseWeights.phraseMatch;
    }

    return 0;
  }

  /**
   * Score regex match
   */
  private scoreRegexMatch(fieldValue: string, pattern: string): number {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(fieldValue)) {
        return this.config.baseWeights.exactMatch * 0.9;
      }
    } catch {
      // Invalid regex, no match
    }

    return 0;
  }

  /**
   * Convert wildcard pattern to regex
   */
  private wildcardToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Replace wildcards with regex equivalents
    const regexPattern = escaped
      .replace(/\*/g, '.*') // * matches any number of characters
      .replace(/\?/g, '.'); // ? matches single character

    // For suffix wildcards, don't require exact match at beginning
    if (pattern.startsWith('*')) {
      return new RegExp(`${regexPattern}$`, 'i');
    }
    // For prefix wildcards, don't require exact match at end
    if (pattern.endsWith('*')) {
      return new RegExp(`^${regexPattern}`, 'i');
    }

    return new RegExp(`^${regexPattern}$`, 'i');
  }

  /**
   * Calculate similarity between documents (for "similar to" queries)
   */
  calculateDocumentSimilarity(doc1: IndexedDocument, doc2: IndexedDocument): number {
    let similarity = 0;
    let factors = 0;

    // Compare titles
    const titleSim = this.fuzzyMatcher.calculateSimilarity(doc1.title, doc2.title);
    similarity += titleSim * this.config.fieldBoosts.title;
    factors += this.config.fieldBoosts.title;

    // Compare tags (Jaccard similarity)
    if (doc1.tags.length > 0 || doc2.tags.length > 0) {
      const tagSet1 = new Set(doc1.tags.map((t) => t.toLowerCase()));
      const tagSet2 = new Set(doc2.tags.map((t) => t.toLowerCase()));
      const intersection = new Set([...tagSet1].filter((t) => tagSet2.has(t)));
      const union = new Set([...tagSet1, ...tagSet2]);

      const tagSim = union.size > 0 ? intersection.size / union.size : 0;
      similarity += tagSim * this.config.fieldBoosts.tags;
      factors += this.config.fieldBoosts.tags;
    }

    // Compare content (simplified - in production might use TF-IDF)
    const contentSim = this.calculateContentSimilarity(doc1.content, doc2.content);
    similarity += contentSim * this.config.fieldBoosts.content;
    factors += this.config.fieldBoosts.content;

    // Normalize by total factors
    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate content similarity using keyword overlap
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    // Extract significant words (simple approach)
    const words1 = this.extractSignificantWords(content1);
    const words2 = this.extractSignificantWords(content2);

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Extract significant words from content
   */
  private extractSignificantWords(content: string): Set<string> {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
    ]);

    const words = content
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    return new Set(words);
  }
}
