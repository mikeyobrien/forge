// ABOUTME: This file exports the search module's public API
// ABOUTME: providing a clean interface for search functionality

export { SearchEngine } from './SearchEngine.js';
export { RelevanceScorer } from './relevance.js';
export { validateSearchQuery, normalizeSearchQuery } from './query.js';
export {
  SearchQuery,
  SearchResult,
  SearchResponse,
  SearchOptions,
  IndexedDocument,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  SearchError,
  SearchErrorType,
} from './types.js';

// Advanced search exports
export {
  AdvancedSearchQuery,
  AdvancedSearchResponse,
  ParsedQuery,
  QueryClause,
  SortCriteria,
  FacetType,
  SearchFacet,
  FacetValue,
  SearchSuggestion,
  SavedSearch,
  SearchHistoryEntry,
  FuzzyMatchConfig,
  DEFAULT_FUZZY_CONFIG,
  SimilarityOptions,
  DEFAULT_SIMILARITY_OPTIONS,
} from './advanced-types.js';

export { FuzzyMatcher } from './fuzzy-matcher.js';
export { QueryParser } from './query-parser.js';
export { FacetGenerator } from './facet-generator.js';
export { AdvancedRelevanceScorer } from './advanced-relevance.js';
export { SearchSuggester } from './search-suggester.js';
