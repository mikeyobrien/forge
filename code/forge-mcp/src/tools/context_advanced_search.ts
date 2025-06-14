// ABOUTME: This file implements the advanced context_search MCP tool with fuzzy search, facets, and more
// ABOUTME: providing sophisticated search capabilities with query parsing and suggestions

import { z } from 'zod';
import { AdvancedSearchEngine } from '../search/AdvancedSearchEngine.js';
import {
  AdvancedSearchQuery,
  FacetType,
  SortCriteria,
  SearchFacet,
  SearchSuggestion,
} from '../search/advanced-types.js';
import { SearchErrorType } from '../search/types.js';
import { PARACategory } from '../para/types.js';
import { logger } from '../utils/logger.js';

/**
 * Enhanced search tool result with advanced features
 */
interface AdvancedSearchToolResult {
  path: string;
  title: string;
  score: number;
  snippet?: string;
  tags: string[];
  category: PARACategory;
  created?: string;
  modified?: string;
}

interface AdvancedSearchToolResponse {
  success: boolean;
  error?: string;
  errorType?: SearchErrorType;
  details?: unknown;
  results?: AdvancedSearchToolResult[];
  totalCount?: number;
  nextOffset?: number;
  executionTime?: number;
  query?: AdvancedSearchQuery;
  facets?: SearchFacet[];
  suggestions?: SearchSuggestion[];
  queryInfo?: {
    usedAdvancedSyntax: boolean;
    normalizedQuery?: string;
    warnings?: string[];
  };
}

/**
 * Zod schema for advanced search tool parameters
 */
const AdvancedSearchToolSchema = z.object({
  // Basic search fields
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

  // Advanced search fields
  query: z
    .string()
    .optional()
    .describe(
      'Advanced query string supporting: "exact phrases", field:value, wildcards*, -exclusions, (grouping), AND/OR/NOT operators',
    ),

  fuzzyTolerance: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Fuzzy search tolerance (0=exact, 1=very fuzzy, default: 0.8)'),

  similarTo: z.string().optional().describe('Find documents similar to this document path'),

  sortBy: z
    .array(
      z.object({
        field: z.enum(['relevance', 'title', 'created', 'modified', 'size']),
        direction: z.enum(['asc', 'desc']).default('desc'),
      }),
    )
    .optional()
    .describe('Sort criteria for results'),

  facets: z
    .array(z.enum(['category', 'tags', 'dateRange', 'year', 'month']))
    .optional()
    .describe('Facets to generate for result refinement'),

  // Options
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Maximum number of results to return'),

  offset: z.number().int().min(0).default(0).describe('Offset for pagination'),

  includeSnippets: z.boolean().default(true).describe('Include content snippets in results'),

  includeSuggestions: z.boolean().default(false).describe('Include search suggestions'),
});

/**
 * Create the advanced context_search tool
 */
interface AdvancedSearchTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: unknown) => Promise<AdvancedSearchToolResponse>;
}

export function createAdvancedSearchTool(searchEngine: AdvancedSearchEngine): AdvancedSearchTool {
  return {
    name: 'context_search',
    description:
      'Advanced search for documents with fuzzy matching, facets, query syntax, and similarity search',
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
        query: {
          type: 'string',
          description:
            'Advanced query string (e.g., "title:guide tag:javascript", "test*", "-exclude", "(A OR B) AND C")',
        },
        fuzzyTolerance: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Fuzzy search tolerance (0=exact match, 1=very fuzzy)',
        },
        similarTo: {
          type: 'string',
          description: 'Find documents similar to this document path',
        },
        sortBy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                enum: ['relevance', 'title', 'created', 'modified', 'size'],
              },
              direction: {
                type: 'string',
                enum: ['asc', 'desc'],
                default: 'desc',
              },
            },
            required: ['field'],
          },
          description: 'Sort criteria for results',
        },
        facets: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['category', 'tags', 'dateRange', 'year', 'month'],
          },
          description: 'Facets to generate for result refinement',
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
        includeSuggestions: {
          type: 'boolean',
          default: false,
          description: 'Include search suggestions',
        },
      },
    },

    async execute(input: unknown): Promise<AdvancedSearchToolResponse> {
      try {
        // Validate input
        const params = AdvancedSearchToolSchema.parse(input);

        logger.debug('Executing advanced search with params:', params);

        // Build advanced search query
        const query: AdvancedSearchQuery = {
          ...(params.tags && { tags: params.tags }),
          ...(params.content && { content: params.content }),
          ...(params.title && { title: params.title }),
          ...(params.category && { category: params.category as PARACategory }),
          ...(params.operator && { operator: params.operator }),
          ...(params.query && { rawQuery: params.query }),
          ...(params.fuzzyTolerance !== undefined && { fuzzyTolerance: params.fuzzyTolerance }),
          ...(params.similarTo && { similarTo: params.similarTo }),
          ...(params.sortBy && { sortBy: params.sortBy as SortCriteria[] }),
          ...(params.facets && { requestedFacets: params.facets as FacetType[] }),
          ...(params.includeSuggestions && { includeSuggestions: params.includeSuggestions }),
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

        // Execute advanced search
        const response = await searchEngine.advancedSearch(query, {
          includeSnippets: params.includeSnippets,
          snippetLength: 150,
          snippetContext: 10,
          highlightTerms: true,
        });

        logger.info(`Advanced search completed: ${response.results.length} results found`);

        // Calculate next offset for pagination
        let nextOffset: number | undefined;
        if (response.totalCount > params.offset + params.limit) {
          nextOffset = params.offset + params.limit;
        }

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
          ...(nextOffset !== undefined && { nextOffset }),
          ...(response.executionTime !== undefined && { executionTime: response.executionTime }),
          query,
          ...(response.facets && { facets: response.facets }),
          ...(response.suggestions && { suggestions: response.suggestions }),
          ...(response.queryInfo && { queryInfo: response.queryInfo }),
        };
      } catch (error) {
        logger.error('Advanced search failed:', error);

        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: 'Invalid search parameters',
            details: error.errors,
          };
        }

        if (error instanceof Error) {
          // Check for parse errors
          if (error.message.includes('Parse error')) {
            return {
              success: false,
              error: 'Invalid query syntax',
              details: error.message,
              queryInfo: {
                usedAdvancedSyntax: true,
                warnings: [error.message],
              },
            };
          }

          // Check for search errors
          if ('type' in error) {
            const searchError = error as { type: SearchErrorType; message: string };
            return {
              success: false,
              error: searchError.message,
              errorType: searchError.type,
            };
          }
        }

        return {
          success: false,
          error: 'Advanced search operation failed',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
