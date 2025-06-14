// ABOUTME: This file implements the relevance scoring algorithm for search results
// ABOUTME: calculating scores based on various match types and document properties

import { IndexedDocument, SearchQuery, ScoringWeights, DEFAULT_SCORING_WEIGHTS } from './types.js';

/**
 * Calculates the relevance score for a document based on search criteria
 */
export class RelevanceScorer {
  constructor(private readonly weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS) {}

  /**
   * Calculate relevance score for a document
   */
  calculateScore(document: IndexedDocument, query: SearchQuery): number {
    let score = 0;

    // Tag matching
    if (query.tags && query.tags.length > 0) {
      score += this.scoreTagMatches(document.tags, query.tags);
    }

    // Title matching
    if (query.title) {
      score += this.scoreTitleMatch(document.title, query.title);
    }

    // Content matching
    if (query.content) {
      score += this.scoreContentMatch(document.content, query.content);
    }

    // Apply recency boost
    if (document.modified) {
      score += this.calculateRecencyBoost(document.modified);
    }

    // Normalize score to 0-100 range
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Score tag matches
   */
  private scoreTagMatches(documentTags: string[], queryTags: string[]): number {
    let score = 0;
    const normalizedDocTags = documentTags.map((tag) => tag.toLowerCase());

    for (const queryTag of queryTags) {
      const normalizedQueryTag = queryTag.toLowerCase();

      // Check for exact match
      if (normalizedDocTags.includes(normalizedQueryTag)) {
        score += this.weights.exactTagMatch;
      } else {
        // Check for partial match (prefix matching)
        const partialMatch = normalizedDocTags.some(
          (docTag) =>
            docTag.startsWith(normalizedQueryTag) || normalizedQueryTag.startsWith(docTag),
        );

        if (partialMatch) {
          score += this.weights.partialTagMatch;
        }
      }
    }

    return score;
  }

  /**
   * Score title match
   */
  private scoreTitleMatch(documentTitle: string, queryTitle: string): number {
    const normalizedDocTitle = documentTitle.toLowerCase();
    const normalizedQueryTitle = queryTitle.toLowerCase();

    // Exact match (case-insensitive)
    if (normalizedDocTitle === normalizedQueryTitle) {
      return this.weights.titleMatch * 2; // Double score for exact match
    }

    // Contains match
    if (normalizedDocTitle.includes(normalizedQueryTitle)) {
      return this.weights.titleMatch;
    }

    // Word-based matching
    const queryWords = this.tokenizeText(normalizedQueryTitle);
    const titleWords = this.tokenizeText(normalizedDocTitle);

    const matchingWords = queryWords.filter((word) => titleWords.includes(word));

    if (matchingWords.length > 0) {
      const matchRatio = matchingWords.length / queryWords.length;
      return Math.round(this.weights.titleMatch * matchRatio);
    }

    return 0;
  }

  /**
   * Score content match
   */
  private scoreContentMatch(documentContent: string, queryContent: string): number {
    const normalizedContent = documentContent.toLowerCase();
    const normalizedQuery = queryContent.toLowerCase();

    // Count occurrences
    let occurrences = 0;
    let position = 0;

    while ((position = normalizedContent.indexOf(normalizedQuery, position)) !== -1) {
      occurrences++;
      position += normalizedQuery.length;
    }

    if (occurrences === 0) {
      // Try word-based matching
      const queryWords = this.tokenizeText(normalizedQuery);
      const contentWords = this.tokenizeText(normalizedContent);

      for (const queryWord of queryWords) {
        occurrences += contentWords.filter((word) => word === queryWord).length;
      }
    }

    // Calculate score with maximum cap
    const rawScore = occurrences * this.weights.contentMatch;
    return Math.min(rawScore, this.weights.maxContentScore);
  }

  /**
   * Calculate recency boost based on modification date
   */
  private calculateRecencyBoost(modifiedDate: Date): number {
    const now = new Date();
    const daysSinceModified = (now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24);

    // Decay function: more recent documents get higher boost
    // Maximum boost of 10 points for documents modified today
    // Decay to 0 after 365 days
    if (daysSinceModified <= 0) {
      return 10 * this.weights.recencyBoost;
    }

    const decayFactor = Math.max(0, 1 - daysSinceModified / 365);
    return Math.round(10 * this.weights.recencyBoost * decayFactor);
  }

  /**
   * Tokenize text into words for matching
   */
  private tokenizeText(text: string): string[] {
    // Split on word boundaries, filter out empty strings and short words
    return text
      .split(/\W+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  /**
   * Generate a snippet with highlighted search terms
   */
  static generateSnippet(
    content: string,
    searchTerm: string,
    snippetLength: number = 150,
    contextWords: number = 10,
  ): string {
    const normalizedContent = content.toLowerCase();
    const normalizedTerm = searchTerm.toLowerCase();

    const position = normalizedContent.indexOf(normalizedTerm);

    if (position === -1) {
      // If exact term not found, return beginning of content
      return content.substring(0, snippetLength) + (content.length > snippetLength ? '...' : '');
    }

    // Find word boundaries around the match
    const words = content.split(/\s+/);
    let currentPos = 0;
    let matchWordIndex = -1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word && currentPos <= position && position < currentPos + word.length) {
        matchWordIndex = i;
        break;
      }
      currentPos += (word?.length || 0) + 1; // +1 for space
    }

    if (matchWordIndex === -1) {
      return content.substring(0, snippetLength) + '...';
    }

    // Extract context words around match
    const startIndex = Math.max(0, matchWordIndex - contextWords);
    const endIndex = Math.min(words.length, matchWordIndex + contextWords + 1);

    const snippetWords = words.slice(startIndex, endIndex);
    let snippet = snippetWords.join(' ');

    // Add ellipsis if needed
    if (startIndex > 0) snippet = '...' + snippet;
    if (endIndex < words.length) snippet = snippet + '...';

    // Highlight the search term
    const highlightRegex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    snippet = snippet.replace(highlightRegex, '**$1**');

    return snippet;
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
