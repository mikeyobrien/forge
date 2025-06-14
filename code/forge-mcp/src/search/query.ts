// ABOUTME: This file implements search query validation and parsing logic
// ABOUTME: ensuring proper input validation and error handling

import { SearchQuery, SearchError, SearchErrorType } from './types';

/**
 * Validates a search query for correctness
 * @param query - The search query to validate
 * @throws {SearchError} If the query is invalid
 */
export function validateSearchQuery(query: SearchQuery): void {
  // Validate that at least one search criterion is provided
  if (!query.tags?.length && !query.content && !query.title && !query.category) {
    throw new SearchError(
      SearchErrorType.INVALID_QUERY,
      'At least one search criterion must be provided',
    );
  }

  // Validate date range if provided
  if (query.dateRange) {
    const { start, end } = query.dateRange;

    // Ensure dates are valid Date objects
    if ((start && !(start instanceof Date)) || (start && isNaN(start.getTime()))) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Invalid start date in date range');
    }

    if ((end && !(end instanceof Date)) || (end && isNaN(end.getTime()))) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Invalid end date in date range');
    }

    // Ensure start date is before end date
    if (start && end && start > end) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Start date must be before end date');
    }
  }

  // Validate operator
  if (query.operator && !['AND', 'OR'].includes(query.operator)) {
    throw new SearchError(SearchErrorType.INVALID_QUERY, 'Operator must be either "AND" or "OR"');
  }

  // Validate limit
  if (query.limit !== undefined) {
    if (typeof query.limit !== 'number' || query.limit <= 0 || !Number.isInteger(query.limit)) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Limit must be a positive integer');
    }
  }

  // Validate offset
  if (query.offset !== undefined) {
    if (typeof query.offset !== 'number' || query.offset < 0 || !Number.isInteger(query.offset)) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Offset must be a non-negative integer');
    }
  }

  // Validate tags
  if (query.tags) {
    if (!Array.isArray(query.tags)) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Tags must be an array');
    }

    for (const tag of query.tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new SearchError(SearchErrorType.INVALID_QUERY, 'Tags must be non-empty strings');
      }
    }
  }

  // Validate title and content
  if (query.title !== undefined && typeof query.title !== 'string') {
    throw new SearchError(SearchErrorType.INVALID_QUERY, 'Title must be a string');
  }

  if (query.content !== undefined && typeof query.content !== 'string') {
    throw new SearchError(SearchErrorType.INVALID_QUERY, 'Content must be a string');
  }
}

/**
 * Normalizes a search query by trimming strings and setting defaults
 * @param query - The search query to normalize
 * @returns The normalized query
 */
export function normalizeSearchQuery(query: SearchQuery): SearchQuery {
  const normalized: SearchQuery = { ...query };

  // Trim string fields
  if (normalized.title) {
    normalized.title = normalized.title.trim();
  }

  if (normalized.content) {
    normalized.content = normalized.content.trim();
  }

  // Normalize tags
  if (normalized.tags) {
    normalized.tags = normalized.tags
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
  }

  // Set default operator
  if (!normalized.operator) {
    normalized.operator = 'AND';
  }

  // Set default limit
  if (normalized.limit === undefined) {
    normalized.limit = 20;
  }

  // Set default offset
  if (normalized.offset === undefined) {
    normalized.offset = 0;
  }

  return normalized;
}
