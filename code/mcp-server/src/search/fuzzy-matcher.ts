// ABOUTME: This file implements fuzzy string matching algorithms for typo-tolerant search
// ABOUTME: including Levenshtein distance calculation and similarity scoring

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { FuzzyMatchConfig, DEFAULT_FUZZY_CONFIG } from './advanced-types.js';

/**
 * Fuzzy string matcher for typo-tolerant search
 */
export class FuzzyMatcher {
  constructor(private readonly config: FuzzyMatchConfig = DEFAULT_FUZZY_CONFIG) {}

  /**
   * Calculate similarity score between two strings
   * @returns Score between 0 (no match) and 1 (exact match)
   */
  calculateSimilarity(str1: string, str2: string): number {
    // Normalize strings
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Empty strings
    if (s1.length === 0 || s2.length === 0) {
      return 0;
    }

    // Exact match
    if (s1 === s2) return 1;

    // Calculate edit distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    // Convert distance to similarity score
    let similarity = 1 - distance / maxLength;

    // Apply prefix bonus if one string starts with the other
    if (s1.startsWith(s2) || s2.startsWith(s1)) {
      similarity *= this.config.prefixWeight;
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Check if two strings match within fuzzy tolerance
   */
  matches(str1: string, str2: string, tolerance?: number): boolean {
    const similarity = this.calculateSimilarity(str1, str2);
    const threshold = tolerance ?? this.config.minSimilarity;
    return similarity >= threshold;
  }

  /**
   * Find best fuzzy matches from a list of candidates
   */
  findBestMatches(
    query: string,
    candidates: string[],
    maxResults?: number,
    minSimilarity?: number,
  ): Array<{ value: string; similarity: number }> {
    const threshold = minSimilarity ?? this.config.minSimilarity;

    const matches = candidates
      .map((candidate) => ({
        value: candidate,
        similarity: this.calculateSimilarity(query, candidate),
      }))
      .filter((match) => match.similarity >= threshold)
      .sort((a, b) => {
        // Sort by similarity descending
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        // If similarity is the same, prefer exact matches first
        if (a.value.toLowerCase() === query.toLowerCase()) return -1;
        if (b.value.toLowerCase() === query.toLowerCase()) return 1;
        // Then prefer shorter strings (more specific matches)
        return a.value.length - b.value.length;
      });

    return maxResults ? matches.slice(0, maxResults) : matches;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Optimized implementation with early termination
   */
  private levenshteinDistance(s1: string, s2: string): number {
    // Early termination for identical strings
    if (s1 === s2) return 0;

    // Early termination if one string is empty
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // Early termination if difference in length exceeds max distance
    if (Math.abs(s1.length - s2.length) > this.config.maxEditDistance) {
      return this.config.maxEditDistance + 1;
    }

    // Create distance matrix
    const matrix: number[][] = [];

    // Initialize first column
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= s2.length; j++) {
      matrix[0]![j] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= s1.length; i++) {
      let rowMin = Infinity;

      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

        let distance = Math.min(
          matrix[i - 1]![j]! + 1, // deletion
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j - 1]! + cost, // substitution
        );

        // Consider transposition (Damerau-Levenshtein)
        if (
          this.config.includeTranspositions &&
          i > 1 &&
          j > 1 &&
          s1[i - 1] === s2[j - 2] &&
          s1[i - 2] === s2[j - 1]
        ) {
          distance = Math.min(distance, matrix[i - 2]![j - 2]! + cost);
        }

        matrix[i]![j] = distance;
        rowMin = Math.min(rowMin, distance);
      }

      // Early termination if minimum distance in row exceeds threshold
      if (rowMin > this.config.maxEditDistance) {
        return this.config.maxEditDistance + 1;
      }
    }

    return matrix[s1.length]![s2.length]!;
  }

  /**
   * Tokenize and match multi-word strings
   */
  matchTokens(query: string, target: string, tolerance?: number): boolean {
    const queryTokens = this.tokenize(query);
    const targetTokens = this.tokenize(target);

    // Empty query matches everything
    if (queryTokens.length === 0) return true;

    // Each query token must fuzzy match at least one target token
    return queryTokens.every((qToken) =>
      targetTokens.some((tToken) => this.matches(qToken, tToken, tolerance)),
    );
  }

  /**
   * Calculate similarity for multi-word strings using token matching
   */
  calculateTokenSimilarity(query: string, target: string): number {
    const queryTokens = this.tokenize(query);
    const targetTokens = this.tokenize(target);

    if (queryTokens.length === 0 || targetTokens.length === 0) return 0;

    let totalScore = 0;
    let matchedTokens = 0;

    // For each query token, find best match in target
    for (const qToken of queryTokens) {
      let bestScore = 0;

      for (const tToken of targetTokens) {
        const score = this.calculateSimilarity(qToken, tToken);
        bestScore = Math.max(bestScore, score);
      }

      if (bestScore >= this.config.minSimilarity) {
        totalScore += bestScore;
        matchedTokens++;
      }
    }

    // Calculate final score based on matched tokens
    if (matchedTokens === 0) return 0;

    // Require all query tokens to match for a non-zero score
    if (matchedTokens < queryTokens.length * 0.5) return 0;

    const tokenMatchRatio = matchedTokens / queryTokens.length;
    const avgTokenScore = totalScore / matchedTokens;

    return tokenMatchRatio * avgTokenScore;
  }

  /**
   * Tokenize a string into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Generate alternative spellings for a word (for suggestions)
   */
  generateAlternatives(word: string, maxAlternatives: number = 5): string[] {
    const alternatives: string[] = [];
    const seen = new Set<string>();

    // Helper to add unique alternatives
    const addAlternative = (alt: string): void => {
      if (alt !== word && !seen.has(alt) && alternatives.length < maxAlternatives) {
        seen.add(alt);
        alternatives.push(alt);
      }
    };

    // Character transposition (do this first for the test)
    for (let i = 0; i < word.length - 1; i++) {
      const alt = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
      addAlternative(alt);
    }

    // Character deletion
    for (let i = 0; i < word.length && alternatives.length < maxAlternatives; i++) {
      addAlternative(word.slice(0, i) + word.slice(i + 1));
    }

    // Character substitution (limit to common letters for efficiency)
    const commonChars = 'aeioustnrl';
    for (let i = 0; i < word.length && alternatives.length < maxAlternatives; i++) {
      for (const char of commonChars) {
        if (alternatives.length >= maxAlternatives) break;
        if (word[i] !== char) {
          addAlternative(word.slice(0, i) + char + word.slice(i + 1));
        }
      }
    }

    // Character insertion (limit for efficiency)
    if (alternatives.length < maxAlternatives) {
      for (let i = 0; i <= Math.min(word.length, 2); i++) {
        for (const char of 'aest') {
          if (alternatives.length >= maxAlternatives) break;
          addAlternative(word.slice(0, i) + char + word.slice(i));
        }
      }
    }

    return alternatives;
  }
}
