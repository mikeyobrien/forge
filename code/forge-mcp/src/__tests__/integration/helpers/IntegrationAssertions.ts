// ABOUTME: Integration test assertion helpers for validating complex scenarios
// ABOUTME: Provides specialized assertions for documents, links, and search results

import { Document } from '../../../models/types';
import { WikiLink } from '../../../parser/wiki-link';
import { SearchResponse } from '../../../search/types';
import { BacklinkEntry } from '../../../backlinks/types';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IntegrationAssertions {
  /**
   * Assert that all links in documents are consistent
   */
  export function assertLinkConsistency(
    _documents: Map<string, Document>,
    linkIndex: Map<string, WikiLink[]>,
    backlinkIndex: Map<string, BacklinkEntry[]>,
  ): void {
    // Check that every forward link has a corresponding backlink
    for (const [docPath, links] of linkIndex.entries()) {
      for (const link of links) {
        const targetBacklinks = backlinkIndex.get(link.target);

        if (!targetBacklinks) {
          throw new Error(
            `Missing backlinks for document "${link.target}" referenced from "${docPath}"`,
          );
        }

        const hasBacklink = targetBacklinks.some((bl) => bl.sourcePath === docPath);
        if (!hasBacklink) {
          throw new Error(`Document "${link.target}" is missing backlink from "${docPath}"`);
        }
      }
    }

    // Check that every backlink has a corresponding forward link
    for (const [docPath, backlinks] of backlinkIndex.entries()) {
      for (const backlink of backlinks) {
        const sourceLinks = linkIndex.get(backlink.sourcePath);

        if (!sourceLinks) {
          throw new Error(
            `Document "${backlink.sourcePath}" has no forward links but claims to link to "${docPath}"`,
          );
        }

        const hasForwardLink = sourceLinks.some((link) => link.target === docPath);
        if (!hasForwardLink) {
          throw new Error(
            `Document "${backlink.sourcePath}" claims to link to "${docPath}" but no such link found`,
          );
        }
      }
    }
  }

  /**
   * Assert that search results match expected documents
   */
  export function assertSearchResults(
    actual: SearchResponse,
    expectedPaths: string[],
    options: {
      exactMatch?: boolean;
      ordered?: boolean;
      minScore?: number;
    } = {},
  ): void {
    const actualPaths = actual.results.map((r) => r.path);

    if (options.exactMatch) {
      // Check exact match and order
      if (options.ordered) {
        if (actualPaths.length !== expectedPaths.length) {
          throw new Error(
            `Expected exactly ${expectedPaths.length} results, got ${actualPaths.length}`,
          );
        }

        for (let i = 0; i < expectedPaths.length; i++) {
          if (actualPaths[i] !== expectedPaths[i]) {
            throw new Error(
              `Expected result ${i} to be "${expectedPaths[i]}", got "${actualPaths[i]}"`,
            );
          }
        }
      } else {
        // Check exact match, any order
        const actualSet = new Set(actualPaths);
        const expectedSet = new Set(expectedPaths);

        if (actualSet.size !== expectedSet.size) {
          throw new Error(
            `Expected exactly ${expectedSet.size} unique results, got ${actualSet.size}`,
          );
        }

        for (const expected of expectedSet) {
          if (!actualSet.has(expected)) {
            throw new Error(`Expected result "${expected}" not found in actual results`);
          }
        }
      }
    } else {
      // Check that all expected are present (subset match)
      for (const expected of expectedPaths) {
        if (!actualPaths.includes(expected)) {
          throw new Error(`Expected result "${expected}" not found in actual results`);
        }
      }
    }

    // Check minimum scores if specified
    if (options.minScore !== undefined) {
      for (const result of actual.results) {
        if (result.relevanceScore < options.minScore) {
          throw new Error(
            `Result "${result.path}" has score ${result.relevanceScore}, ` +
              `expected at least ${options.minScore}`,
          );
        }
      }
    }
  }

  /**
   * Assert backlinks for a document
   */
  export function assertBacklinks(
    docPath: string,
    actualBacklinks: BacklinkEntry[],
    expectedSources: string[],
    options: { exactMatch?: boolean } = {},
  ): void {
    const actualSources = actualBacklinks.map((bl) => bl.sourcePath);

    if (options.exactMatch) {
      const actualSet = new Set(actualSources);
      const expectedSet = new Set(expectedSources);

      if (actualSet.size !== expectedSet.size) {
        throw new Error(
          `Document "${docPath}" expected exactly ${expectedSet.size} backlinks, got ${actualSet.size}`,
        );
      }

      for (const expected of expectedSet) {
        if (!actualSet.has(expected)) {
          throw new Error(
            `Document "${docPath}" expected backlink from "${expected}" but not found`,
          );
        }
      }
    } else {
      // Check that all expected are present
      for (const expected of expectedSources) {
        if (!actualSources.includes(expected)) {
          throw new Error(
            `Document "${docPath}" expected backlink from "${expected}" but not found`,
          );
        }
      }
    }
  }

  /**
   * Assert forward links for a document
   */
  export function assertForwardLinks(
    docPath: string,
    actualLinks: WikiLink[],
    expectedTargets: string[],
    options: { exactMatch?: boolean } = {},
  ): void {
    const actualTargets = actualLinks.map((link) => link.target);

    if (options.exactMatch) {
      const actualSet = new Set(actualTargets);
      const expectedSet = new Set(expectedTargets);

      if (actualSet.size !== expectedSet.size) {
        throw new Error(
          `Document "${docPath}" expected exactly ${expectedSet.size} forward links, got ${actualSet.size}`,
        );
      }

      for (const expected of expectedSet) {
        if (!actualSet.has(expected)) {
          throw new Error(`Document "${docPath}" expected link to "${expected}" but not found`);
        }
      }
    } else {
      // Check that all expected are present
      for (const expected of expectedTargets) {
        if (!actualTargets.includes(expected)) {
          throw new Error(`Document "${docPath}" expected link to "${expected}" but not found`);
        }
      }
    }
  }

  /**
   * Assert document metadata
   */
  export function assertDocumentMetadata(
    document: Document,
    expected: Record<string, unknown>,
  ): void {
    for (const [key, value] of Object.entries(expected)) {
      const actual = document.frontmatter[key];

      if (Array.isArray(value) && Array.isArray(actual)) {
        // For arrays, check if all expected values are present
        const actualSet = new Set(actual);
        for (const expectedItem of value) {
          if (!actualSet.has(expectedItem)) {
            throw new Error(
              `Document "${document.path}" metadata.${key} missing expected value "${expectedItem}"`,
            );
          }
        }
      } else if (actual !== value) {
        throw new Error(
          `Document "${document.path}" metadata.${key} expected "${String(value)}", got "${String(actual)}"`,
        );
      }
    }
  }

  /**
   * Assert link query results
   */
  export function assertLinkQueryResults(
    results: Array<{ path: string; exists?: boolean }>,
    expectedPaths: string[],
    options: {
      exactMatch?: boolean;
      checkBroken?: boolean;
    } = {},
  ): void {
    const actualPaths = results.map((r) => r.path);

    if (options.exactMatch) {
      const actualSet = new Set(actualPaths);
      const expectedSet = new Set(expectedPaths);

      if (actualSet.size !== expectedSet.size) {
        throw new Error(`Expected exactly ${expectedSet.size} link results, got ${actualSet.size}`);
      }

      for (const expected of expectedSet) {
        if (!actualSet.has(expected)) {
          throw new Error(`Expected link result "${expected}" not found`);
        }
      }
    } else {
      for (const expected of expectedPaths) {
        if (!actualPaths.includes(expected)) {
          throw new Error(`Expected link result "${expected}" not found`);
        }
      }
    }

    // Check broken links if requested
    if (options.checkBroken) {
      const brokenLinks = results.filter((r) => r.exists === false);
      if (brokenLinks.length > 0) {
        throw new Error(
          `Found ${brokenLinks.length} broken links: ${brokenLinks.map((l) => l.path).join(', ')}`,
        );
      }
    }
  }

  /**
   * Assert document content contains expected text
   */
  export function assertContentContains(
    document: Document,
    expectedText: string,
    options: { caseSensitive?: boolean } = {},
  ): void {
    const content = options.caseSensitive ? document.content : document.content.toLowerCase();

    const searchText = options.caseSensitive ? expectedText : expectedText.toLowerCase();

    if (!content.includes(searchText)) {
      throw new Error(
        `Document "${document.path}" content does not contain expected text "${expectedText}"`,
      );
    }
  }

  /**
   * Assert operation completes within time limit
   */
  export async function assertOperationTime<T>(
    operation: () => Promise<T>,
    maxDuration: number,
    operationName: string,
  ): Promise<T> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    if (duration > maxDuration) {
      throw new Error(
        `Operation "${operationName}" took ${duration}ms, expected max ${maxDuration}ms`,
      );
    }

    return result;
  }

  /**
   * Assert no orphaned documents (documents with no backlinks)
   */
  export function assertNoOrphanedDocuments(
    documents: Map<string, Document>,
    backlinkIndex: Map<string, BacklinkEntry[]>,
    allowedOrphans: string[] = [],
  ): void {
    const orphans: string[] = [];

    for (const [path] of documents) {
      const backlinks = backlinkIndex.get(path) || [];
      if (backlinks.length === 0 && !allowedOrphans.includes(path)) {
        orphans.push(path);
      }
    }

    if (orphans.length > 0) {
      throw new Error(`Found ${orphans.length} orphaned documents: ${orphans.join(', ')}`);
    }
  }

  /**
   * Assert search facets contain expected values
   */
  export function assertSearchFacets(
    facets: Record<string, Array<{ value: string; count: number }>>,
    expectedFacets: Record<string, string[]>,
  ): void {
    for (const [facetName, expectedValues] of Object.entries(expectedFacets)) {
      const actualFacet = facets[facetName];

      if (!actualFacet) {
        throw new Error(`Expected facet "${facetName}" not found in results`);
      }

      const actualValues = actualFacet.map((f) => f.value);
      for (const expected of expectedValues) {
        if (!actualValues.includes(expected)) {
          throw new Error(`Facet "${facetName}" missing expected value "${expected}"`);
        }
      }
    }
  }
}
