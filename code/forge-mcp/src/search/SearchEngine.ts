// ABOUTME: This file implements the main search engine that indexes documents and executes searches
// ABOUTME: providing efficient document retrieval with relevance scoring

import { readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import {
  SearchQuery,
  SearchResult,
  SearchResponse,
  IndexedDocument,
  SearchOptions,
  SearchError,
  SearchErrorType,
} from './types.js';
import { RelevanceScorer } from './relevance.js';
import { FrontmatterParser } from '../parsers/frontmatter.js';
import { FileSystem } from '../filesystem/FileSystem.js';
import { PARAManager } from '../para/PARAManager.js';
import { PARACategory } from '../para/types.js';
import { logger } from '../utils/logger.js';

/**
 * Main search engine implementation
 */
export class SearchEngine {
  private index: Map<string, IndexedDocument> = new Map();
  private readonly scorer = new RelevanceScorer();
  private isIndexed = false;

  constructor(
    private readonly fileSystem: FileSystem,
    private readonly paraManager: PARAManager,
    private readonly contextRoot: string,
  ) {}

  /**
   * Initialize the search engine and build the index
   */
  async initialize(): Promise<void> {
    logger.info('Initializing search engine...');
    await this.buildIndex();
    logger.info(`Search engine initialized with ${this.index.size} documents`);
  }

  /**
   * Build or rebuild the search index
   */
  async buildIndex(): Promise<void> {
    this.index.clear();
    const startTime = Date.now();

    try {
      // Index all PARA categories
      for (const category of Object.values(PARACategory)) {
        await this.indexCategory(category);
      }

      this.isIndexed = true;
      const duration = Date.now() - startTime;
      logger.info(`Index built in ${duration}ms`);
    } catch (error) {
      logger.error('Failed to build search index:', error);
      throw new SearchError(SearchErrorType.INDEX_ERROR, 'Failed to build search index', error);
    }
  }

  /**
   * Index all documents in a PARA category
   */
  private async indexCategory(category: PARACategory): Promise<void> {
    const categoryPath = this.paraManager.getCategoryPath(category);

    try {
      const files = await this.fileSystem.readdir(categoryPath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const fullPath = join(categoryPath, file);
          await this.indexDocument(fullPath);
        }
      }
    } catch (_error) {
      // Category directory might not exist yet
      logger.debug(`Category ${category} not found or empty`);
    }
  }

  /**
   * Index a single document
   */
  private async indexDocument(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);
      const relativePath = relative(this.contextRoot, filePath);

      // Parse the document
      const parser = new FrontmatterParser();
      const { frontmatter, content: body } = parser.parse(content);

      // Determine PARA category from path
      const category = this.paraManager.getDocumentCategory(filePath) || PARACategory.Resources;

      const title = (frontmatter?.['title'] as string) || 'Untitled';
      const tags = (frontmatter?.['tags'] as string[]) || [];
      const createdStr = frontmatter?.['created'] as string | undefined;
      const modifiedStr = frontmatter?.['modified'] as string | undefined;
      const created = createdStr ? new Date(createdStr) : undefined;
      const modified = modifiedStr ? new Date(modifiedStr) : undefined;

      const indexedDoc: IndexedDocument = {
        path: filePath,
        relativePath,
        title,
        content: body,
        tags,
        category,
        created: created || stats.birthtime,
        modified: modified || stats.mtime,
        searchTokens: {
          titleTokens: this.tokenize(title),
          contentTokens: this.tokenize(body),
          tagTokens: tags.map((tag: string) => tag.toLowerCase()),
        },
      };

      this.index.set(relativePath, indexedDoc);
      logger.debug(`Indexed document: ${relativePath}`);
    } catch (error) {
      logger.error(`Failed to index document ${filePath}:`, error);
    }
  }

  /**
   * Execute a search query
   */
  async search(query: SearchQuery, options: SearchOptions = {}): Promise<SearchResponse> {
    if (!this.isIndexed) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Validate query
      this.validateQuery(query);

      // Get all documents and score them
      const scoredResults: Array<{ doc: IndexedDocument; score: number }> = [];

      for (const doc of this.index.values()) {
        if (this.matchesFilters(doc, query)) {
          const score = this.scorer.calculateScore(doc, query);
          if (score > 0) {
            scoredResults.push({ doc, score });
          }
        }
      }

      // Sort by relevance score (descending)
      scoredResults.sort((a, b) => b.score - a.score);

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const paginatedResults = scoredResults.slice(offset, offset + limit);

      // Convert to search results
      const results: SearchResult[] = paginatedResults.map(({ doc, score }) => {
        const result: SearchResult = {
          path: doc.relativePath,
          title: doc.title,
          relevanceScore: score,
          tags: doc.tags,
          category: doc.category,
          metadata: {
            ...(doc.created && { created: doc.created }),
            ...(doc.modified && { modified: doc.modified }),
          },
        };

        // Add snippet if requested
        if (options.includeSnippets && query.content) {
          result.snippet = RelevanceScorer.generateSnippet(
            doc.content,
            query.content,
            options.snippetLength,
            options.snippetContext,
          );
        }

        return result;
      });

      const executionTime = Date.now() - startTime;

      return {
        results,
        totalCount: scoredResults.length,
        query,
        executionTime,
      };
    } catch (error) {
      logger.error('Search failed:', error);
      if (error instanceof SearchError) {
        throw error;
      }
      throw new SearchError(SearchErrorType.INTERNAL_ERROR, 'Search operation failed', error);
    }
  }

  /**
   * Check if a document matches query filters
   */
  private matchesFilters(doc: IndexedDocument, query: SearchQuery): boolean {
    const checks: boolean[] = [];

    // Category filter
    if (query.category !== undefined) {
      checks.push(doc.category === query.category);
    }

    // Date range filter
    if (query.dateRange) {
      const docDate = doc.modified || doc.created;
      if (docDate) {
        if (query.dateRange.start) {
          checks.push(docDate >= query.dateRange.start);
        }
        if (query.dateRange.end) {
          checks.push(docDate <= query.dateRange.end);
        }
      } else {
        checks.push(false); // No date means it doesn't match date filter
      }
    }

    // If no filters or OR operator, document passes
    if (checks.length === 0) {
      return true;
    }

    // Apply operator logic
    if (query.operator === 'OR') {
      return checks.some((check) => check);
    } else {
      // Default to AND
      return checks.every((check) => check);
    }
  }

  /**
   * Validate search query
   */
  private validateQuery(query: SearchQuery): void {
    // At least one search criterion must be provided
    if (!query.tags && !query.content && !query.title && !query.category && !query.dateRange) {
      throw new SearchError(
        SearchErrorType.INVALID_QUERY,
        'At least one search criterion must be provided',
      );
    }

    // Validate date range
    if (query.dateRange) {
      if (query.dateRange.start && query.dateRange.end) {
        if (query.dateRange.start > query.dateRange.end) {
          throw new SearchError(
            SearchErrorType.INVALID_QUERY,
            'Invalid date range: start date must be before end date',
          );
        }
      }
    }

    // Validate pagination
    if (query.limit !== undefined && query.limit <= 0) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Limit must be greater than 0');
    }

    if (query.offset !== undefined && query.offset < 0) {
      throw new SearchError(SearchErrorType.INVALID_QUERY, 'Offset must be non-negative');
    }
  }

  /**
   * Tokenize text for searching
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Get index statistics
   */
  getIndexStats(): { documentCount: number; categories: Record<PARACategory, number> } {
    const stats = {
      documentCount: this.index.size,
      categories: {} as Record<PARACategory, number>,
    };

    // Initialize category counts
    for (const category of Object.values(PARACategory)) {
      stats.categories[category] = 0;
    }

    // Count documents per category
    for (const doc of this.index.values()) {
      stats.categories[doc.category]++;
    }

    return stats;
  }

  /**
   * Update a single document in the index
   */
  async updateDocument(filePath: string): Promise<void> {
    const relativePath = relative(this.contextRoot, filePath);

    // Remove old entry if exists
    this.index.delete(relativePath);

    // Re-index the document
    await this.indexDocument(filePath);
  }

  /**
   * Remove a document from the index
   */
  removeDocument(filePath: string): void {
    const relativePath = relative(this.contextRoot, filePath);
    this.index.delete(relativePath);
    logger.debug(`Removed document from index: ${relativePath}`);
  }
}
