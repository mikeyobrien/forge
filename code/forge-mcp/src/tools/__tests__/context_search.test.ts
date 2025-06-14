// ABOUTME: This file contains unit tests for the context_search MCP tool
// ABOUTME: testing tool functionality, input validation, and error handling

import { createSearchTool } from '../context_search';
import { SearchEngine, SearchResponse } from '../../search/index';
import { PARACategory } from '../../para/types';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('context_search tool', () => {
  let searchEngine: SearchEngine;
  let searchTool: ReturnType<typeof createSearchTool>;
  let mockSearch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock search engine
    mockSearch = jest.fn();
    searchEngine = {
      search: mockSearch,
      initialize: jest.fn(),
      buildIndex: jest.fn(),
      getIndexStats: jest.fn(),
      updateDocument: jest.fn(),
      removeDocument: jest.fn(),
    } as unknown as SearchEngine;

    searchTool = createSearchTool(searchEngine);
  });

  describe('tool metadata', () => {
    it('should have correct name and description', () => {
      expect(searchTool.name).toBe('context_search');
      expect(searchTool.description).toBe(
        'Search for documents by tags, content, title, or metadata',
      );
    });

    it('should have valid input schema', () => {
      expect(searchTool.inputSchema).toBeDefined();
      expect(searchTool.inputSchema['type']).toBe('object'); // JSON Schema
      expect(searchTool.inputSchema['properties']).toBeDefined();
    });
  });

  describe('successful searches', () => {
    const mockSearchResponse: SearchResponse = {
      results: [
        {
          path: 'projects/test.md',
          title: 'Test Document',
          relevanceScore: 85,
          snippet: 'This is a **test** document',
          tags: ['test', 'example'],
          category: PARACategory.Projects,
          metadata: {
            created: new Date('2024-01-01'),
            modified: new Date('2024-01-15'),
          },
        },
      ],
      totalCount: 1,
      query: { content: 'test' },
      executionTime: 25,
    };

    beforeEach(() => {
      mockSearch.mockResolvedValue(mockSearchResponse);
    });

    it('should execute search with content parameter', async () => {
      const input = { content: 'test' };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'test' }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results?.[0]).toMatchObject({
        path: 'projects/test.md',
        title: 'Test Document',
        score: 85,
        snippet: 'This is a **test** document',
        tags: ['test', 'example'],
        category: 'projects',
      });
    });

    it('should execute search with tags parameter', async () => {
      const input = { tags: ['javascript', 'testing'] };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['javascript', 'testing'] }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
    });

    it('should execute search with title parameter', async () => {
      const input = { title: 'Guide' };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Guide' }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
    });

    it('should execute search with category filter', async () => {
      const input = {
        content: 'test',
        category: 'projects',
      };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'test',
          category: PARACategory.Projects,
        }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
    });

    it('should execute search with date range', async () => {
      const input = {
        content: 'test',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
      };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            start: new Date('2024-01-01T00:00:00Z'),
            end: new Date('2024-12-31T23:59:59Z'),
          },
        }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
    });

    it('should handle OR operator', async () => {
      const input = {
        tags: ['javascript', 'typescript'],
        operator: 'OR',
      };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ operator: 'OR' }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const input = {
        content: 'test',
        limit: 5,
        offset: 10,
      };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 10,
        }),
        expect.any(Object),
      );

      expect(result.success).toBe(true);
    });

    it('should respect includeSnippets parameter', async () => {
      const input = {
        content: 'test',
        includeSnippets: false,
      };
      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ includeSnippets: false }),
      );

      expect(result.success).toBe(true);
    });

    it('should include execution time in response', async () => {
      const input = { content: 'test' };
      const result = await searchTool.execute(input);

      expect(result.executionTime).toBe(25);
    });

    it('should format dates in ISO format', async () => {
      const input = { content: 'test' };
      const result = await searchTool.execute(input);

      expect(result.results?.[0]?.created).toBe('2024-01-01T00:00:00.000Z');
      expect(result.results?.[0]?.modified).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('input validation', () => {
    it('should reject invalid category', async () => {
      const input = {
        content: 'test',
        category: 'invalid',
      };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
      expect(result.details).toBeDefined();
    });

    it('should reject invalid date format', async () => {
      const input = {
        content: 'test',
        dateRange: {
          start: 'not-a-date',
        },
      };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
    });

    it('should reject invalid operator', async () => {
      const input = {
        content: 'test',
        operator: 'XOR',
      };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
    });

    it('should reject limit over 100', async () => {
      const input = {
        content: 'test',
        limit: 101,
      };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
    });

    it('should reject negative offset', async () => {
      const input = {
        content: 'test',
        offset: -1,
      };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
    });

    it('should use default values for optional parameters', async () => {
      mockSearch.mockResolvedValue({
        results: [],
        totalCount: 0,
        query: { content: 'test' },
      });

      const input = { content: 'test' };
      await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        }),
        expect.objectContaining({
          includeSnippets: true,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle search engine errors', async () => {
      mockSearch.mockRejectedValue(new Error('Search engine failure'));

      const input = { content: 'test' };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search operation failed');
      expect(result.details).toBe('Search engine failure');
    });

    it('should handle search errors with type', async () => {
      const searchError = new Error('Permission denied') as Error & { type: string };
      searchError.type = 'PERMISSION_DENIED';
      mockSearch.mockRejectedValue(searchError);

      const input = { content: 'test' };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
      expect(result.errorType).toBe('PERMISSION_DENIED');
    });

    it('should handle unexpected input types', async () => {
      const result = await searchTool.execute('not an object');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
    });

    it('should handle null input', async () => {
      const result = await searchTool.execute(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid search parameters');
    });
  });

  describe('complex queries', () => {
    it('should handle all parameters combined', async () => {
      mockSearch.mockResolvedValue({
        results: [],
        totalCount: 0,
        query: {},
      });

      const input = {
        tags: ['javascript', 'testing'],
        content: 'async',
        title: 'Guide',
        category: 'resources',
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-06-30T23:59:59Z',
        },
        operator: 'AND',
        limit: 10,
        offset: 0,
        includeSnippets: true,
      };

      const result = await searchTool.execute(input);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['javascript', 'testing'],
          content: 'async',
          title: 'Guide',
          category: PARACategory.Resources,
          operator: 'AND',
          limit: 10,
          offset: 0,
        }),
        expect.objectContaining({
          includeSnippets: true,
        }),
      );

      expect(result.success).toBe(true);
    });

    it('should return empty results gracefully', async () => {
      mockSearch.mockResolvedValue({
        results: [],
        totalCount: 0,
        query: { content: 'nonexistent' },
        executionTime: 5,
      });

      const input = { content: 'nonexistent' };
      const result = await searchTool.execute(input);

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
