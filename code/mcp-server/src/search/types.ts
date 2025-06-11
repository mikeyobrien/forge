// ABOUTME: This file defines TypeScript interfaces and types for the search functionality
// ABOUTME: including search queries, results, and response structures

import { PARACategory } from '../para/types.js';

/**
 * Represents a search query with various filter criteria
 */
export interface SearchQuery {
  /** Tags to match (supports exact and prefix matching) */
  tags?: string[];

  /** Content substring search (case-insensitive) */
  content?: string;

  /** Title search (case-insensitive) */
  title?: string;

  /** Filter by PARA category */
  category?: PARACategory;

  /** Date range filter */
  dateRange?: {
    start?: Date;
    end?: Date;
  };

  /** How to combine search criteria (default: AND) */
  operator?: 'AND' | 'OR';

  /** Maximum number of results to return */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Represents a single search result
 */
export interface SearchResult {
  /** Document path relative to CONTEXT_ROOT */
  path: string;

  /** Document title */
  title: string;

  /** Relevance score (0-100) */
  relevanceScore: number;

  /** Content snippet with search term highlighted */
  snippet?: string;

  /** Document tags */
  tags: string[];

  /** PARA category */
  category: PARACategory;

  /** Document metadata */
  metadata: {
    created?: Date;
    modified?: Date;
  };
}

/**
 * Response structure for search operations
 */
export interface SearchResponse {
  /** Array of search results sorted by relevance */
  results: SearchResult[];

  /** Total count of matching documents (before pagination) */
  totalCount: number;

  /** The original search query */
  query: SearchQuery;

  /** Time taken to execute search (in milliseconds) */
  executionTime?: number;
}

/**
 * Options for configuring search behavior
 */
export interface SearchOptions {
  /** Whether to include content snippets in results */
  includeSnippets?: boolean;

  /** Maximum length of content snippets */
  snippetLength?: number;

  /** Number of context words around search term in snippets */
  snippetContext?: number;

  /** Whether to highlight search terms in snippets */
  highlightTerms?: boolean;
}

/**
 * Internal document index entry for efficient searching
 */
export interface IndexedDocument {
  /** Full file path */
  path: string;

  /** Relative path from CONTEXT_ROOT */
  relativePath: string;

  /** Document title */
  title: string;

  /** Full document content */
  content: string;

  /** Document tags */
  tags: string[];

  /** PARA category */
  category: PARACategory;

  /** Creation date */
  created?: Date;

  /** Last modified date */
  modified?: Date;

  /** Pre-computed search tokens for efficiency */
  searchTokens?: {
    titleTokens: string[];
    contentTokens: string[];
    tagTokens: string[];
  };
}

/**
 * Relevance scoring weights for different match types
 */
export interface ScoringWeights {
  /** Weight for exact tag matches */
  exactTagMatch: number;

  /** Weight for partial tag matches */
  partialTagMatch: number;

  /** Weight for title matches */
  titleMatch: number;

  /** Weight for content matches */
  contentMatch: number;

  /** Maximum points from content matches */
  maxContentScore: number;

  /** Boost factor for recent documents */
  recencyBoost: number;
}

/**
 * Default scoring weights
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  exactTagMatch: 30,
  partialTagMatch: 15,
  titleMatch: 25,
  contentMatch: 10,
  maxContentScore: 50,
  recencyBoost: 0.1,
};

/**
 * Search error types
 */
export enum SearchErrorType {
  INVALID_QUERY = 'INVALID_QUERY',
  INDEX_ERROR = 'INDEX_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Custom error class for search-related errors
 */
export class SearchError extends Error {
  constructor(
    public readonly type: SearchErrorType,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'SearchError';
  }
}
