// ABOUTME: This file contains unit tests for search query validation and parsing
// ABOUTME: ensuring proper input validation and error handling

import { SearchQuery, SearchError } from '../types';
import { validateSearchQuery, normalizeSearchQuery } from '../query';
import { PARACategory } from '../../para/types';

describe('Search Query Validation', () => {
  describe('valid queries', () => {
    it('should accept query with single tag', () => {
      const query: SearchQuery = { tags: ['javascript'] };
      expect(() => validateSearchQuery(query)).not.toThrow();
    });

    it('should accept query with multiple search criteria', () => {
      const query: SearchQuery = {
        tags: ['javascript', 'testing'],
        content: 'test',
        title: 'Guide',
        category: PARACategory.Projects,
        operator: 'AND',
      };
      expect(() => validateSearchQuery(query)).not.toThrow();
    });

    it('should accept query with date range', () => {
      const query: SearchQuery = {
        content: 'test',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };
      expect(() => validateSearchQuery(query)).not.toThrow();
    });

    it('should accept query with only start date', () => {
      const query: SearchQuery = {
        content: 'test',
        dateRange: { start: new Date('2024-01-01') },
      };
      expect(() => validateSearchQuery(query)).not.toThrow();
    });

    it('should accept query with only end date', () => {
      const query: SearchQuery = {
        content: 'test',
        dateRange: { end: new Date('2024-12-31') },
      };
      expect(() => validateSearchQuery(query)).not.toThrow();
    });

    it('should accept query with pagination', () => {
      const query: SearchQuery = {
        tags: ['test'],
        limit: 10,
        offset: 20,
      };
      expect(() => validateSearchQuery(query)).not.toThrow();
    });
  });

  describe('invalid queries', () => {
    it('should reject empty query', () => {
      const query: SearchQuery = {};
      expect(() => validateSearchQuery(query)).toThrow(SearchError);
      expect(() => validateSearchQuery(query)).toThrow(
        'At least one search criterion must be provided',
      );
    });

    it('should reject query with only pagination', () => {
      const query: SearchQuery = { limit: 10, offset: 0 };
      expect(() => validateSearchQuery(query)).toThrow(
        'At least one search criterion must be provided',
      );
    });

    it('should reject query with invalid date range', () => {
      const query: SearchQuery = {
        content: 'test',
        dateRange: {
          start: new Date('2024-12-31'),
          end: new Date('2024-01-01'),
        },
      };
      expect(() => validateSearchQuery(query)).toThrow(
        'Start date must be before end date',
      );
    });

    it('should reject query with zero limit', () => {
      const query: SearchQuery = {
        content: 'test',
        limit: 0,
      };
      expect(() => validateSearchQuery(query)).toThrow('Limit must be a positive integer');
    });

    it('should reject query with negative limit', () => {
      const query: SearchQuery = {
        content: 'test',
        limit: -5,
      };
      expect(() => validateSearchQuery(query)).toThrow('Limit must be a positive integer');
    });

    it('should reject query with negative offset', () => {
      const query: SearchQuery = {
        content: 'test',
        offset: -1,
      };
      expect(() => validateSearchQuery(query)).toThrow('Offset must be a non-negative integer');
    });
  });

  describe('query normalization', () => {
    it('should normalize tag case', () => {
      const query: SearchQuery = { tags: ['JavaScript', 'TESTING', 'Guide'] };
      const normalized = normalizeSearchQuery(query);

      expect(normalized.tags).toEqual(['javascript', 'testing', 'guide']);
    });

    it('should trim whitespace from strings', () => {
      const query: SearchQuery = {
        content: '  test content  ',
        title: ' Guide ',
      };
      const normalized = normalizeSearchQuery(query);

      expect(normalized.content).toBe('test content');
      expect(normalized.title).toBe('Guide');
    });

    it('should remove empty tags', () => {
      const query: SearchQuery = { tags: ['javascript', '', '  ', 'testing'] };
      const normalized = normalizeSearchQuery(query);

      expect(normalized.tags).toEqual(['javascript', 'testing']);
    });

    it('should set default operator if not specified', () => {
      const query: SearchQuery = { tags: ['test'] };
      const normalized = normalizeSearchQuery(query);

      expect(normalized.operator).toBe('AND');
    });

    it('should preserve valid dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const query: SearchQuery = {
        content: 'test',
        dateRange: { start, end },
      };
      const normalized = normalizeSearchQuery(query);

      expect(normalized.dateRange?.start).toEqual(start);
      expect(normalized.dateRange?.end).toEqual(end);
    });
  });
});
