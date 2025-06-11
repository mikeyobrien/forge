// ABOUTME: This file implements the context_search MCP tool for searching documents
// ABOUTME: by tags, content, title, and other metadata within the context system

import { z } from 'zod';
import { SearchEngine, SearchQuery, SearchErrorType } from '../search/index.js';
import { PARACategory } from '../para/types.js';
import { logger } from '../utils/logger.js';

/**
 * Response from the search tool
 */
interface SearchToolResult {
  path: string;
  title: string;
  score: number;
  snippet?: string;
  tags: string[];
  category: PARACategory;
  created?: string;
  modified?: string;
}

interface SearchToolResponse {
  success: boolean;
  error?: string;
  errorType?: SearchErrorType;
  details?: unknown;
  results?: SearchToolResult[];
  totalCount?: number;
  nextOffset?: number;
  executionTime?: number;
  query?: SearchQuery;
}

/**
 * Zod schema for search tool parameters
 */
const SearchToolSchema = z.object({
  tags: z
    .array(z.string())
    .optional()
    .describe('Tags to search for (supports exact and prefix matching)'),

  content: z.string().optional().describe('Search within document content'),

  title: z.string().optional().describe('Search within document titles'),

  category: z
    .enum(['projects', 'areas', 'resources', 'archives'] as const)
    .optional()
    .describe('Filter by PARA category'),

  dateRange: z
    .object({
      start: z.string().datetime().optional().describe('Start date (ISO 8601 format)'),
      end: z.string().datetime().optional().describe('End date (ISO 8601 format)'),
    })
    .optional()
    .describe('Filter by date range'),

  operator: z
    .enum(['AND', 'OR'])
    .optional()
    .describe('How to combine search criteria (default: AND)'),

  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Maximum number of results to return'),

  offset: z.number().int().min(0).default(0).describe('Offset for pagination'),

  includeSnippets: z.boolean().default(true).describe('Include content snippets in results'),
});

/**
 * Create the context_search tool
 */
interface SearchTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => Promise<SearchToolResponse>;
}

export function createSearchTool(searchEngine: SearchEngine): SearchTool {
  return {
    name: 'context_search',
    description: 'Search for documents by tags, content, title, or metadata',
    inputSchema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to search for (supports exact and prefix matching)',
        },
        content: {
          type: 'string',
          description: 'Search within document content',
        },
        title: {
          type: 'string',
          description: 'Search within document titles',
        },
        category: {
          type: 'string',
          enum: ['projects', 'areas', 'resources', 'archives'],
          description: 'Filter by PARA category',
        },
        dateRange: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start date (ISO 8601 format)',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End date (ISO 8601 format)',
            },
          },
          description: 'Filter by date range',
        },
        operator: {
          type: 'string',
          enum: ['AND', 'OR'],
          description: 'How to combine search criteria (default: AND)',
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 20,
          description: 'Maximum number of results to return',
        },
        offset: {
          type: 'number',
          minimum: 0,
          default: 0,
          description: 'Offset for pagination',
        },
        includeSnippets: {
          type: 'boolean',
          default: true,
          description: 'Include content snippets in results',
        },
      },
    },

    async execute(input: unknown): Promise<SearchToolResponse> {
      try {
        // Validate input
        const params = SearchToolSchema.parse(input);

        logger.debug('Executing search with params:', params);

        // Build search query
        const query: SearchQuery = {
          ...(params.tags && { tags: params.tags }),
          ...(params.content && { content: params.content }),
          ...(params.title && { title: params.title }),
          ...(params.category && { category: params.category as PARACategory }),
          ...(params.operator && { operator: params.operator }),
          limit: params.limit,
          offset: params.offset,
        };

        // Handle date range
        if (params.dateRange) {
          const dateRange: { start?: Date; end?: Date } = {};
          if (params.dateRange.start) {
            dateRange.start = new Date(params.dateRange.start);
          }
          if (params.dateRange.end) {
            dateRange.end = new Date(params.dateRange.end);
          }
          if (dateRange.start || dateRange.end) {
            query.dateRange = dateRange;
          }
        }

        // Execute search
        const response = await searchEngine.search(query, {
          includeSnippets: params.includeSnippets,
          snippetLength: 150,
          snippetContext: 10,
          highlightTerms: true,
        });

        logger.info(`Search completed: ${response.results.length} results found`);

        // Format response
        return {
          success: true,
          results: response.results.map((result) => ({
            path: result.path,
            title: result.title,
            score: result.relevanceScore,
            ...(result.snippet !== undefined && { snippet: result.snippet }),
            tags: result.tags,
            category: result.category,
            ...(result.metadata.created && { created: result.metadata.created.toISOString() }),
            ...(result.metadata.modified && { modified: result.metadata.modified.toISOString() }),
          })),
          totalCount: response.totalCount,
          ...(response.executionTime !== undefined && { executionTime: response.executionTime }),
          query,
        };
      } catch (error) {
        logger.error('Search failed:', error);

        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: 'Invalid search parameters',
            details: error.errors,
          };
        }

        if (error instanceof Error && 'type' in error) {
          const searchError = error as { type: SearchErrorType; message: string };
          return {
            success: false,
            error: searchError.message,
            errorType: searchError.type,
          };
        }

        return {
          success: false,
          error: 'Search operation failed',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
