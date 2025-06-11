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
