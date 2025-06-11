// ABOUTME: This file extends SearchEngine with advanced features like fuzzy search, facets, and suggestions
// ABOUTME: providing a comprehensive search solution with sophisticated query capabilities

import { SearchEngine } from './SearchEngine.js';
import {
  AdvancedSearchQuery,
  AdvancedSearchResponse,
  ParsedQuery,
  SortCriteria,
  SearchFacet,
  SearchSuggestion,
} from './advanced-types.js';
import { SearchOptions, SearchResult, IndexedDocument } from './types.js';
import { QueryParser } from './query-parser.js';
import { FacetGenerator } from './facet-generator.js';
import { AdvancedRelevanceScorer } from './advanced-relevance.js';
import { SearchSuggester } from './search-suggester.js';
import { logger } from '../utils/logger.js';

/**
 * Advanced search engine with fuzzy matching, facets, and query parsing
 */
export class AdvancedSearchEngine extends SearchEngine {
  private queryParser = new QueryParser();
  private facetGenerator = new FacetGenerator();
  private advancedScorer = new AdvancedRelevanceScorer();
  private suggester = new SearchSuggester();

  /**
   * Initialize the advanced search engine
   */
  override async initialize(): Promise<void> {
    await super.initialize();

    // Build suggestion index
    const documents = Array.from(this.getIndexedDocuments());
    this.suggester.buildIndex(documents);

    logger.info('Advanced search engine initialized with suggestion index');
  }

  /**
   * Execute an advanced search query
   */
  async advancedSearch(
    query: AdvancedSearchQuery,
    options: SearchOptions = {},
  ): Promise<AdvancedSearchResponse> {
    const startTime = Date.now();

    try {
      // Parse raw query if provided
      let parsedQuery: ParsedQuery | undefined = query.parsedQuery;
      if (query.rawQuery && !parsedQuery) {
        parsedQuery = this.queryParser.parse(query.rawQuery);
      }

      // Get all matching documents
      let documents: IndexedDocument[];

      if (parsedQuery) {
        // Use advanced scoring with parsed query
        documents = this.searchWithParsedQuery(parsedQuery, query);
      } else if (query.similarTo) {
        // Find similar documents
        documents = this.findSimilarDocuments(query.similarTo, query);
      } else {
        // Fall back to basic search
        const basicResponse = await this.search(query, options);
        documents = this.getDocumentsFromResults(basicResponse.results);
      }

      // Apply sorting
      if (query.sortBy && query.sortBy.length > 0) {
        documents = this.sortDocuments(documents, query.sortBy);
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const totalCount = documents.length;
      const paginatedDocs = documents.slice(offset, offset + limit);

      // Convert to search results
      const results = this.documentsToResults(paginatedDocs, query, options);

      // Generate facets if requested
      let facets: SearchFacet[] | undefined;
      if (query.requestedFacets && query.requestedFacets.length > 0) {
        facets = this.facetGenerator.generateFacets(documents, query.requestedFacets);
      }

      // Generate suggestions if requested
      let suggestions: SearchSuggestion[] | undefined;
      if (query.includeSuggestions && query.rawQuery) {
        suggestions = this.suggester.getSuggestions(query.rawQuery, 5);
      }

      const executionTime = Date.now() - startTime;

      const response: AdvancedSearchResponse = {
        results,
        totalCount,
        query,
        executionTime,
      };

      if (facets) response.facets = facets;
      if (suggestions) response.suggestions = suggestions;
      if (query.sortBy) response.sortedBy = query.sortBy;
      if (query.rawQuery) {
        response.queryInfo = {
          usedAdvancedSyntax: !!parsedQuery,
          ...(parsedQuery && { normalizedQuery: QueryParser.normalize(parsedQuery) }),
        };
      }

      return response;
    } catch (error) {
      logger.error('Advanced search failed:', error);
      throw error;
    }
  }

  /**
   * Search with parsed query structure
   */
  private searchWithParsedQuery(
    parsedQuery: ParsedQuery,
    baseQuery: AdvancedSearchQuery,
  ): IndexedDocument[] {
    const allDocuments = Array.from(this.getIndexedDocuments());
    const scoredDocs: Array<{ doc: IndexedDocument; score: number }> = [];

    for (const doc of allDocuments) {
      // Apply basic filters first
      if (!this.matchesBasicFilters(doc, baseQuery)) {
        continue;
      }

      // Calculate advanced score
      const score = this.advancedScorer.calculateAdvancedScore(doc, parsedQuery);

      if (score > 0) {
        scoredDocs.push({ doc, score });
      }
    }

    // Sort by score
    scoredDocs.sort((a, b) => b.score - a.score);

    return scoredDocs.map((item) => item.doc);
  }

  /**
   * Find documents similar to a given document
   */
  private findSimilarDocuments(
    referencePath: string,
    query: AdvancedSearchQuery,
  ): IndexedDocument[] {
    // Find reference document
    const refDoc = this.getDocumentByPath(referencePath);
    if (!refDoc) {
      logger.warn(`Reference document not found: ${referencePath}`);
      return [];
    }

    const allDocuments = Array.from(this.getIndexedDocuments());
    const similarities: Array<{ doc: IndexedDocument; similarity: number }> = [];

    for (const doc of allDocuments) {
      // Skip the reference document itself
      if (doc.relativePath === referencePath) continue;

      // Apply basic filters
      if (!this.matchesBasicFilters(doc, query)) continue;

      // Calculate similarity
      const similarity = this.advancedScorer.calculateDocumentSimilarity(refDoc, doc);

      if (similarity > 0.3) {
        // Minimum similarity threshold
        similarities.push({ doc, similarity });
      }
    }

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Limit results
    const maxResults = query.limit || 10;
    return similarities.slice(0, maxResults).map((item) => item.doc);
  }

  /**
   * Sort documents by specified criteria
   */
  private sortDocuments(
    documents: IndexedDocument[],
    sortCriteria: SortCriteria[],
  ): IndexedDocument[] {
    return documents.sort((a, b) => {
      for (const criteria of sortCriteria) {
        const compareValue = this.compareDocuments(a, b, criteria);
        if (compareValue !== 0) {
          return compareValue;
        }
      }
      return 0;
    });
  }

  /**
   * Compare two documents for sorting
   */
  private compareDocuments(a: IndexedDocument, b: IndexedDocument, criteria: SortCriteria): number {
    let result = 0;

    switch (criteria.field) {
      case 'title':
        result = a.title.localeCompare(b.title);
        break;

      case 'created': {
        const aCreated = a.created?.getTime() || 0;
        const bCreated = b.created?.getTime() || 0;
        result = aCreated - bCreated;
        break;
      }

      case 'modified': {
        const aModified = a.modified?.getTime() || 0;
        const bModified = b.modified?.getTime() || 0;
        result = aModified - bModified;
        break;
      }

      case 'size':
        result = a.content.length - b.content.length;
        break;

      case 'relevance':
        // Relevance sorting is handled elsewhere
        result = 0;
        break;
    }

    return criteria.direction === 'desc' ? -result : result;
  }

  /**
   * Check if document matches basic filters
   */
  private matchesBasicFilters(doc: IndexedDocument, query: AdvancedSearchQuery): boolean {
    // Category filter
    if (query.category && doc.category !== query.category) {
      return false;
    }

    // Date range filter
    if (query.dateRange) {
      const docDate = doc.modified || doc.created;
      if (!docDate) return false;

      if (query.dateRange.start && docDate < query.dateRange.start) {
        return false;
      }
      if (query.dateRange.end && docDate > query.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get indexed documents (protected method for access)
   */
  private getIndexedDocuments(): IndexedDocument[] {
    // Access the private index through a workaround
    // In a real implementation, we'd make this properly accessible
    const engine = this as unknown as { index?: Map<string, IndexedDocument> };
    return Array.from(engine.index?.values() || []);
  }

  /**
   * Get document by path
   */
  private getDocumentByPath(path: string): IndexedDocument | undefined {
    const engine = this as unknown as { index?: Map<string, IndexedDocument> };
    return engine.index?.get(path);
  }

  /**
   * Convert indexed documents to search results
   */
  private documentsToResults(
    documents: IndexedDocument[],
    query: AdvancedSearchQuery,
    options: SearchOptions,
  ): SearchResult[] {
    return documents.map((doc) => {
      const result: SearchResult = {
        path: doc.relativePath,
        title: doc.title,
        relevanceScore: 100, // Already sorted by relevance
        tags: doc.tags,
        category: doc.category,
        metadata: {
          ...(doc.created && { created: doc.created }),
          ...(doc.modified && { modified: doc.modified }),
        },
      };

      // Add snippet if requested
      if (options.includeSnippets && (query.content || query.rawQuery)) {
        const searchTerm = query.content || query.rawQuery || '';
        result.snippet = AdvancedRelevanceScorer.generateSnippet(
          doc.content,
          searchTerm,
          options.snippetLength,
          options.snippetContext,
        );
      }

      return result;
    });
  }

  /**
   * Get documents from search results
   */
  private getDocumentsFromResults(results: SearchResult[]): IndexedDocument[] {
    const documents: IndexedDocument[] = [];

    for (const result of results) {
      const doc = this.getDocumentByPath(result.path);
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  }

  /**
   * Update document in index (override to update suggester)
   */
  override async updateDocument(filePath: string): Promise<void> {
    await super.updateDocument(filePath);

    // Rebuild suggestion index
    const documents = Array.from(this.getIndexedDocuments());
    this.suggester.buildIndex(documents);
  }

  /**
   * Get search suggestions
   */
  getSuggestions(prefix: string, maxSuggestions: number = 10): SearchSuggestion[] {
    return this.suggester.getSuggestions(prefix, maxSuggestions);
  }

  /**
   * Get popular searches
   */
  getPopularSearches(limit: number = 10): SearchSuggestion[] {
    return this.suggester.getPopularSearches(limit);
  }
}
