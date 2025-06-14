// ABOUTME: Tests for LinkIndexer class that builds and queries link graphs
// ABOUTME: Verifies indexing, querying, and statistics functionality

import { LinkIndexer } from '../LinkIndexer';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import { LinkQueryType } from '../types';
import { join } from 'path';

describe('LinkIndexer', () => {
  let indexer: LinkIndexer;
  let mockFs: MockFileSystem;
  const contextRoot = '/test/context';

  beforeEach(() => {
    mockFs = new MockFileSystem(contextRoot);
    indexer = new LinkIndexer(contextRoot, mockFs);

    // Set up test documents with links
    mockFs.writeFileSync(
      join(contextRoot, 'index.md'),
      `---
title: Index
tags: [home, index]
---

# Index

Welcome to the knowledge base.

- [[projects/project1|Project One]]
- [[areas/daily-notes]]
- [[non-existent|Broken Link]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'projects', 'project1.md'),
      `---
title: Project One
tags: [project, active]
---

# Project One

This project links to:
- [[../index|Home]]
- [[project2|Another Project]]
- [[/areas/daily-notes#today|Today's Notes]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'projects', 'project2.md'),
      `---
title: Project Two
tags: [project, planning]
---

# Project Two

References:
- [[project1]]
- [[../resources/guide|Resource Guide]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'areas', 'daily-notes.md'),
      `---
title: Daily Notes
tags: [daily, notes]
---

# Daily Notes

Today's links:
- [[/projects/project1|Current Project]]
- [[/index]]
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'resources', 'guide.md'),
      `---
title: Resource Guide
tags: [resource, guide]
---

# Resource Guide

No links here - this is an orphaned document.
`,
    );

    mockFs.writeFileSync(
      join(contextRoot, 'archives', 'old-project.md'),
      `---
title: Old Project
tags: [archive, project]
---

# Old Project

Links to archived content:
- [[old-resource|Archived Resource]]
- [[../projects/project1|Active Project]]
`,
    );
  });

  describe('buildIndex', () => {
    it('should build index of all documents', async () => {
      await indexer.buildIndex();

      const stats = indexer.getStatistics();
      expect(stats.totalDocuments).toBe(6);
      expect(stats.totalLinks).toBeGreaterThan(0);
    });

    it('should identify broken links', async () => {
      await indexer.buildIndex();

      const stats = indexer.getStatistics();
      expect(stats.totalBrokenLinks).toBeGreaterThan(0);
      expect(stats.documentsWithBrokenLinks.length).toBeGreaterThan(0);
    });

    it('should identify orphaned documents', async () => {
      await indexer.buildIndex();

      const stats = indexer.getStatistics();
      expect(stats.orphanedDocuments).toContain('resources/guide.md');
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await indexer.buildIndex();
    });

    describe('FORWARD query', () => {
      it('should return forward links for a document', async () => {
        const results = await indexer.query({
          path: join(contextRoot, 'index.md'),
          type: LinkQueryType.FORWARD,
        });

        expect(results).toHaveLength(1);
        expect(results[0]?.document).toBe('index.md');
        expect(results[0]?.forward_links).toContain('projects/project1.md');
        expect(results[0]?.forward_links).toContain('areas/daily-notes.md');
      });

      it('should include metadata when requested', async () => {
        const results = await indexer.query({
          path: join(contextRoot, 'index.md'),
          type: LinkQueryType.FORWARD,
          includeMetadata: true,
        });

        expect(results[0]?.metadata).toBeDefined();
        expect(results[0]?.metadata?.title).toBe('Index');
        expect(results[0]?.metadata?.tags).toContain('home');
      });

      it('should include broken links when requested', async () => {
        const results = await indexer.query({
          path: join(contextRoot, 'index.md'),
          type: LinkQueryType.FORWARD,
          includeBroken: true,
        });

        expect(results[0]?.broken_links).toBeDefined();
        expect(results[0]?.broken_links).toContain('non-existent.md');
      });
    });

    describe('BACKLINKS query', () => {
      it('should return documents linking to target', async () => {
        const results = await indexer.query({
          path: join(contextRoot, 'projects', 'project1.md'),
          type: LinkQueryType.BACKLINKS,
        });

        expect(results).toHaveLength(1);
        expect(results[0]?.backlinks).toContain('index.md');
        expect(results[0]?.backlinks).toContain('projects/project2.md');
        expect(results[0]?.backlinks).toContain('areas/daily-notes.md');
      });
    });

    describe('ORPHANED query', () => {
      it('should return documents with no backlinks', async () => {
        const results = await indexer.query({
          type: LinkQueryType.ORPHANED,
        });

        const orphanedPaths = results.map((r) => r.document);
        expect(orphanedPaths).toContain('resources/guide.md');

        // All orphaned documents should have empty backlinks
        for (const result of results) {
          expect(result.backlinks).toHaveLength(0);
        }
      });

      it('should support pagination', async () => {
        const page1 = await indexer.query({
          type: LinkQueryType.ORPHANED,
          limit: 2,
          offset: 0,
        });

        const page2 = await indexer.query({
          type: LinkQueryType.ORPHANED,
          limit: 2,
          offset: 2,
        });

        expect(page1.length).toBeLessThanOrEqual(2);
        expect(page2.length).toBeLessThanOrEqual(2);

        // Should not have duplicate results
        const page1Docs = page1.map((r) => r.document);
        const page2Docs = page2.map((r) => r.document);
        expect(page1Docs.filter((d) => page2Docs.includes(d))).toHaveLength(0);
      });
    });

    describe('BROKEN query', () => {
      it('should return documents with broken links', async () => {
        const results = await indexer.query({
          type: LinkQueryType.BROKEN,
        });

        const docsWithBroken = results.map((r) => r.document);
        expect(docsWithBroken).toContain('index.md');
        expect(docsWithBroken).toContain('archives/old-project.md');

        // Check that broken links are included
        const indexResult = results.find((r) => r.document === 'index.md');
        expect(indexResult?.broken_links).toContain('non-existent.md');
      });
    });

    describe('ALL query', () => {
      it('should return all link information for a document', async () => {
        const results = await indexer.query({
          path: join(contextRoot, 'projects', 'project1.md'),
          type: LinkQueryType.ALL,
        });

        expect(results).toHaveLength(1);
        const result = results[0];

        expect(result?.forward_links.length).toBeGreaterThan(0);
        expect(result?.backlinks.length).toBeGreaterThan(0);
        expect(result?.broken_links).toBeDefined();
        expect(result?.stats).toBeDefined();
        expect(result?.stats?.total_forward).toBe(result?.forward_links.length);
        expect(result?.stats?.total_backlinks).toBe(result?.backlinks.length);
      });

      it('should return all documents when no path specified', async () => {
        const results = await indexer.query({
          type: LinkQueryType.ALL,
        });

        expect(results.length).toBe(6); // Total documents

        // Each result should have link information
        for (const result of results) {
          expect(result.forward_links).toBeDefined();
          expect(result.backlinks).toBeDefined();
          expect(result.broken_links).toBeDefined();
        }
      });
    });
  });

  describe('updateDocument', () => {
    beforeEach(async () => {
      await indexer.buildIndex();
    });

    it('should update index when document changes', async () => {
      // Get initial state
      const initialResults = await indexer.query({
        path: join(contextRoot, 'index.md'),
        type: LinkQueryType.FORWARD,
      });
      const initialLinkCount = initialResults[0]?.forward_links.length || 0;

      // Update document with new link
      mockFs.writeFileSync(
        join(contextRoot, 'index.md'),
        `---
title: Index
tags: [home, index]
---

# Index

Updated with new links:
- [[projects/project1|Project One]]
- [[projects/project2|Project Two]]
- [[areas/daily-notes]]
- [[resources/guide|New Link to Guide]]
`,
      );

      await indexer.updateDocument(join(contextRoot, 'index.md'));

      // Check updated state
      const updatedResults = await indexer.query({
        path: join(contextRoot, 'index.md'),
        type: LinkQueryType.FORWARD,
      });

      expect(updatedResults[0]?.forward_links.length).toBeGreaterThan(initialLinkCount);
      expect(updatedResults[0]?.forward_links).toContain('resources/guide.md');
    });

    it('should update backlinks when document changes', async () => {
      // Check initial backlinks for guide
      const initialResults = await indexer.query({
        path: join(contextRoot, 'resources', 'guide.md'),
        type: LinkQueryType.BACKLINKS,
      });
      expect(initialResults[0]?.backlinks).toHaveLength(1); // Only project2

      // Update index to link to guide
      mockFs.writeFileSync(
        join(contextRoot, 'index.md'),
        `---
title: Index
---

New link to [[resources/guide|Guide]]
`,
      );

      await indexer.updateDocument(join(contextRoot, 'index.md'));

      // Check updated backlinks
      const updatedResults = await indexer.query({
        path: join(contextRoot, 'resources', 'guide.md'),
        type: LinkQueryType.BACKLINKS,
      });
      expect(updatedResults[0]?.backlinks).toContain('index.md');
    });

    it('should handle document deletion', async () => {
      // Delete a document
      mockFs.deleteFile(join(contextRoot, 'projects', 'project2.md'));
      await indexer.updateDocument(join(contextRoot, 'projects', 'project2.md'));

      // Check that it's removed from index
      const stats = indexer.getStatistics();
      expect(stats.totalDocuments).toBe(5); // One less document

      // Check that backlinks are updated
      const project1Results = await indexer.query({
        path: join(contextRoot, 'projects', 'project1.md'),
        type: LinkQueryType.BACKLINKS,
      });
      expect(project1Results[0]?.backlinks).not.toContain('projects/project2.md');
    });
  });

  describe('removeDocument', () => {
    beforeEach(async () => {
      await indexer.buildIndex();
    });

    it('should remove document from index', () => {
      const initialStats = indexer.getStatistics();

      indexer.removeDocument(join(contextRoot, 'projects', 'project1.md'));

      const updatedStats = indexer.getStatistics();
      expect(updatedStats.totalDocuments).toBe(initialStats.totalDocuments - 1);
    });
  });

  describe('getStatistics', () => {
    it('should throw if index not built', () => {
      expect(() => indexer.getStatistics()).toThrow('Index not built');
    });

    it('should return comprehensive statistics', async () => {
      await indexer.buildIndex();

      const stats = indexer.getStatistics();

      expect(stats.totalDocuments).toBe(6);
      expect(stats.totalLinks).toBeGreaterThan(0);
      expect(stats.totalBrokenLinks).toBeGreaterThan(0);
      expect(stats.orphanedDocuments.length).toBeGreaterThan(0);
      expect(stats.mostLinkedDocuments.length).toBeGreaterThan(0);
      expect(stats.documentsWithBrokenLinks.length).toBeGreaterThan(0);

      // Most linked should be sorted by count
      for (let i = 1; i < stats.mostLinkedDocuments.length; i++) {
        expect(stats.mostLinkedDocuments[i - 1]?.backlinkCount).toBeGreaterThanOrEqual(
          stats.mostLinkedDocuments[i]?.backlinkCount || 0,
        );
      }
    });
  });

  describe('performance', () => {
    it('should handle large document sets efficiently', async () => {
      // Create many documents
      for (let i = 0; i < 100; i++) {
        const links = [];
        // Create some random links
        for (let j = 0; j < 5; j++) {
          const target = Math.floor(Math.random() * 100);
          links.push(`[[doc${target}|Document ${target}]]`);
        }

        mockFs.writeFileSync(
          join(contextRoot, `doc${i}.md`),
          `---
title: Document ${i}
---

${links.join('\n')}
`,
        );
      }

      const startTime = Date.now();
      await indexer.buildIndex();
      const buildTime = Date.now() - startTime;

      // Should build index reasonably quickly
      expect(buildTime).toBeLessThan(5000); // 5 seconds max

      const stats = indexer.getStatistics();
      expect(stats.totalDocuments).toBeGreaterThan(100);
    });
  });
});
