// ABOUTME: This file defines advanced search types for fuzzy matching, query parsing, and facets
// ABOUTME: extending the basic search functionality with more sophisticated features

import { SearchQuery, SearchResponse } from './types.js';

/**
 * Extended search query with advanced features
 */
export interface AdvancedSearchQuery extends SearchQuery {
  /** Fuzzy search tolerance (0-1, where 0 is exact match, 1 is very fuzzy) */
  fuzzyTolerance?: number;

  /** Raw query string for advanced syntax parsing */
  rawQuery?: string;

  /** Parsed query structure from advanced syntax */
  parsedQuery?: ParsedQuery;

  /** Sorting options for results */
  sortBy?: SortCriteria[];

  /** Requested facets to generate */
  requestedFacets?: FacetType[];

  /** Whether to find similar documents */
  similarTo?: string; // Document path

  /** Whether to return search suggestions */
  includeSuggestions?: boolean;
}

/**
 * Parsed query structure for advanced boolean logic
 */
export interface ParsedQuery {
  /** AND conditions - all must match */
  must: QueryClause[];

  /** OR conditions - at least one must match */
  should: QueryClause[];

  /** NOT conditions - none must match */
  mustNot: QueryClause[];
}

/**
 * Individual query clause with field-specific matching
 */
export interface QueryClause {
  /** Specific field to search in */
  field?: 'title' | 'content' | 'tags' | 'all';

  /** Search value */
  value: string;

  /** Type of matching to perform */
  type: 'exact' | 'fuzzy' | 'wildcard' | 'phrase' | 'regex';

  /** Fuzzy tolerance for this specific clause */
  fuzzyTolerance?: number;
}

/**
 * Sort criteria for search results
 */
export interface SortCriteria {
  /** Field to sort by */
  field: 'relevance' | 'title' | 'created' | 'modified' | 'size';

  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Types of facets that can be generated
 */
export enum FacetType {
  Category = 'category',
  Tags = 'tags',
  DateRange = 'dateRange',
  Year = 'year',
  Month = 'month',
}

/**
 * Facet data for search refinement
 */
export interface SearchFacet {
  /** Facet field name */
  field: FacetType;

  /** Facet values with counts */
  values: FacetValue[];

  /** Total count across all values */
  totalCount?: number;
}

/**
 * Individual facet value with count
 */
export interface FacetValue {
  /** The value (e.g., tag name, category) */
  value: string;

  /** Number of documents with this value */
  count: number;

  /** Display label (optional, defaults to value) */
  label?: string;
}

/**
 * Extended search response with advanced features
 */
export interface AdvancedSearchResponse extends SearchResponse {
  /** Generated facets for refinement */
  facets?: SearchFacet[];

  /** Search suggestions based on query */
  suggestions?: SearchSuggestion[];

  /** Applied sort criteria */
  sortedBy?: SortCriteria[];

  /** Query parsing information */
  queryInfo?: {
    /** Was advanced syntax used */
    usedAdvancedSyntax: boolean;

    /** Any parsing warnings */
    warnings?: string[];

    /** Normalized query for debugging */
    normalizedQuery?: string;
  };
}

/**
 * Search suggestion for auto-complete
 */
export interface SearchSuggestion {
  /** Suggested search term or phrase */
  text: string;

  /** Type of suggestion */
  type: 'title' | 'tag' | 'phrase' | 'correction';

  /** Relevance score for ordering */
  score: number;

  /** Number of documents that would match */
  documentCount?: number;
}

/**
 * Saved search configuration
 */
export interface SavedSearch {
  /** Unique identifier */
  id: string;

  /** User-friendly name */
  name: string;

  /** The saved query */
  query: AdvancedSearchQuery;

  /** Creation timestamp */
  created: Date;

  /** Last used timestamp */
  lastUsed?: Date;

  /** Usage count */
  useCount: number;

  /** Optional description */
  description?: string;

  /** Tags for organizing saved searches */
  tags?: string[];
}

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  /** The executed query */
  query: AdvancedSearchQuery;

  /** Execution timestamp */
  timestamp: Date;

  /** Number of results returned */
  resultCount: number;

  /** Execution time in ms */
  executionTime: number;

  /** Whether results were clicked/used */
  wasUseful?: boolean;
}

/**
 * Configuration for fuzzy matching
 */
export interface FuzzyMatchConfig {
  /** Maximum allowed edit distance */
  maxEditDistance: number;

  /** Whether to consider transpositions as single edit */
  includeTranspositions: boolean;

  /** Minimum similarity score (0-1) to consider a match */
  minSimilarity: number;

  /** Weight for prefix matching (higher = prefer prefix matches) */
  prefixWeight: number;
}

/**
 * Default fuzzy match configuration
 */
export const DEFAULT_FUZZY_CONFIG: FuzzyMatchConfig = {
  maxEditDistance: 2,
  includeTranspositions: true,
  minSimilarity: 0.7,
  prefixWeight: 1.5,
};

/**
 * Document similarity options
 */
export interface SimilarityOptions {
  /** Minimum similarity score to include */
  minScore: number;

  /** Maximum number of similar documents to return */
  maxResults: number;

  /** Fields to consider for similarity */
  compareFields: Array<'title' | 'content' | 'tags'>;

  /** Whether to use TF-IDF weighting */
  useTfIdf: boolean;
}

/**
 * Default similarity options
 */
export const DEFAULT_SIMILARITY_OPTIONS: SimilarityOptions = {
  minScore: 0.3,
  maxResults: 10,
  compareFields: ['title', 'content', 'tags'],
  useTfIdf: true,
};
