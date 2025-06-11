// ABOUTME: Tests for context_query_links MCP tool handler
// ABOUTME: Verifies link querying functionality and error handling

import { queryLinks, QueryLinksArgs } from '../index';
import { MockFileSystem } from '../../../filesystem/MockFileSystem';
import { join } from 'path';
import { configuration } from '../../../config';

// Create a partial type for easier testing
type PartialQueryLinksArgs = Partial<QueryLinksArgs> & { type: QueryLinksArgs['type'] };

// Define the result type
interface QueryLinksResult {
  results: Array<{
    document: string;
    forward_links?: string[];
    backlinks?: string[];
    broken_links?: string[];
    metadata?: Record<string, unknown>;
    stats?: {
      totalLinks: number;
      totalBacklinks: number;
      brokenLinks: number;
    };
  }>;
  query: {
    type: string;
    path?: string;
    limit: number;
    offset: number;
  };
  statistics?: {
    totalDocuments: number;
    totalLinks: number;
    orphanedDocuments: number;
    documentsWithBrokenLinks: number;
  };
}

describe('context_query_links tool', () => {
  let mockFs: MockFileSystem;
  const contextRoot = '/test/context';

  beforeEach(() => {
    mockFs = new MockFileSystem(contextRoot);

    // Mock the environment config
    process.env['CONTEXT_ROOT'] = contextRoot;

    // Mock the configuration directly
    const configMock = configuration as { instance: { contextRoot: string } };
    configMock.instance = {
      contextRoot: contextRoot,
    };

    // Set up test documents
    mockFs.writeFileSync(
      join(contextRoot, 'index.md'),
      `---
title: Index
tags: [home]
---

# Index

Links to:
- [[projects/project1|Project One]]
- [[areas/notes|Notes]]
- [[broken-link|Does not exist]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'projects', 'project1.md'),
      `---
title: Project One
tags: [project, active]
status: active
---

# Project One

Links:
- [[../index|Back to Index]]
- [[project2|Project Two]]
- [[../areas/notes#today|Today's Notes]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'projects', 'project2.md'),
      `---
title: Project Two
tags: [project]
---

# Project Two

- [[project1|Back to Project One]]
- [[../resources/guide|Guide]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'areas', 'notes.md'),
      `---
title: Daily Notes
tags: [notes, daily]
---

# Notes

- [[/index|Home]]
- [[/projects/project1|Current Project]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'resources', 'guide.md'),
      `---
title: Guide
tags: [resource, documentation]
---

# Guide

This document has no outgoing links and minimal backlinks.
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'orphaned.md'),
      `---
title: Orphaned Document
---

# Orphaned

No one links here, but links to [[index|Home]].
`,
    );
  });

  afterEach(() => {
    delete process.env['CONTEXT_ROOT'];
  });

  describe('forward links query', () => {
    it('should return outgoing links from a document', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'index.md',
        type: 'forward',
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results).toHaveLength(1);
      expect(result.results[0].document).toBe('index.md');
      expect(result.results[0].forward_links).toContain('projects/project1.md');
      expect(result.results[0].forward_links).toContain('areas/notes.md');
    });

    it('should include broken links when requested', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'index.md',
        type: 'forward',
        includeBroken: true,
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results[0].broken_links).toBeDefined();
      expect(result.results[0].broken_links).toContain('broken-link.md');
    });

    it('should include metadata when requested', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'projects/project1.md',
        type: 'forward',
        includeMetadata: true,
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results[0].metadata).toBeDefined();
      expect(result.results[0].metadata?.title).toBe('Project One');
      const metadata = result.results[0].metadata as { tags?: string[] };
      expect(metadata?.tags).toContain('project');
    });

    it('should throw error if path not provided', async () => {
      const args: PartialQueryLinksArgs = {
        type: 'forward',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(queryLinks(args as any, mockFs)).rejects.toThrow(
        'Path is required for forward query type',
      );
    });

    it('should throw error if document not found', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'non-existent.md',
        type: 'forward',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(queryLinks(args as any, mockFs)).rejects.toThrow(
        'Document not found: non-existent.md',
      );
    });
  });

  describe('backlinks query', () => {
    it('should return incoming links to a document', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'projects/project1.md',
        type: 'backlinks',
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results).toHaveLength(1);
      expect(result.results[0].backlinks).toContain('index.md');
      expect(result.results[0].backlinks).toContain('projects/project2.md');
      expect(result.results[0].backlinks).toContain('areas/notes.md');
    });

    it('should include link statistics', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'projects/project1.md',
        type: 'backlinks',
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results[0].stats).toBeDefined();
      expect(result.results[0].stats?.totalBacklinks).toBe(3);
    });
  });

  describe('orphaned query', () => {
    it('should return documents with no backlinks', async () => {
      const args: PartialQueryLinksArgs = {
        type: 'orphaned',
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      const orphanedDocs = result.results.map((r) => r.document);
      expect(orphanedDocs).toContain('orphaned.md');

      // All returned documents should have no backlinks
      for (const doc of result.results) {
        expect(doc.backlinks).toHaveLength(0);
      }
    });

    it('should support pagination', async () => {
      const args1: PartialQueryLinksArgs = {
        type: 'orphaned',
        limit: 2,
        offset: 0,
      };

      const args2: PartialQueryLinksArgs = {
        type: 'orphaned',
        limit: 2,
        offset: 2,
      };

      const result1 = (await queryLinks(args1 as QueryLinksArgs, mockFs)) as QueryLinksResult;
      const result2 = (await queryLinks(args2 as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result1.results.length).toBeLessThanOrEqual(2);
      expect(result2.results.length).toBeLessThanOrEqual(2);

      // Results should not overlap
      const docs1 = result1.results.map((r) => r.document);
      const docs2 = result2.results.map((r) => r.document);
      const overlap = docs1.filter((d) => docs2.includes(d));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('broken query', () => {
    it('should return documents with broken links', async () => {
      const args: PartialQueryLinksArgs = {
        type: 'broken',
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      const docsWithBroken = result.results.map((r) => r.document);
      expect(docsWithBroken).toContain('index.md');

      // Should include broken links
      const indexResult = result.results.find((r) => r.document === 'index.md');
      expect(indexResult.broken_links).toContain('broken-link.md');
    });
  });

  describe('all query', () => {
    it('should return comprehensive link data for a document', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'projects/project1.md',
        type: 'all',
        includeBroken: true,
        includeMetadata: true,
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results).toHaveLength(1);
      const doc = result.results[0];

      expect(doc.forward_links.length).toBeGreaterThan(0);
      expect(doc.backlinks.length).toBeGreaterThan(0);
      expect(doc.broken_links).toBeDefined();
      expect(doc.metadata).toBeDefined();
      expect(doc.stats).toBeDefined();
    });

    it('should return all documents when no path specified', async () => {
      const args: PartialQueryLinksArgs = {
        type: 'all',
        limit: 10,
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.length).toBeLessThanOrEqual(10);

      // Should include overall statistics
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalDocuments).toBeGreaterThan(0);
      expect(result.statistics.totalLinks).toBeGreaterThan(0);
      expect(result.statistics?.orphanedDocuments).toBeDefined();
    });
  });

  describe('security', () => {
    it('should prevent access outside context root', async () => {
      const args: PartialQueryLinksArgs = {
        path: '../../../etc/passwd',
        type: 'forward',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(queryLinks(args as any, mockFs)).rejects.toThrow();
    });

    it('should handle malformed paths safely', async () => {
      const malformedPaths = [
        '..\\..\\..\\windows\\system32',
        '/etc/passwd',
        'C:\\Windows\\System32',
        '\0\0\0',
        '///multiple///slashes///',
      ];

      for (const path of malformedPaths) {
        const args: PartialQueryLinksArgs = {
          path,
          type: 'forward',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await expect(queryLinks(args as any, mockFs)).rejects.toThrow();
      }
    });
  });

  describe('query formatting', () => {
    it('should include query parameters in response', async () => {
      const args: PartialQueryLinksArgs = {
        path: 'index.md',
        type: 'forward',
        limit: 5,
        offset: 10,
      };

      const result = (await queryLinks(args as QueryLinksArgs, mockFs)) as QueryLinksResult;

      expect(result.query).toBeDefined();
      expect(result.query.type).toBe('forward');
      expect(result.query.path).toBe('index.md');
      expect(result.query.limit).toBe(5);
      expect(result.query.offset).toBe(10);
    });
  });
});
