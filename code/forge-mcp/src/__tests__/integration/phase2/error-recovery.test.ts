// ABOUTME: Integration tests for error handling and recovery scenarios
// ABOUTME: Tests graceful degradation, corruption handling, and system resilience

import '../helpers/test-stubs'; // Load test method stubs
import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { IntegrationTestHarness } from '../helpers/IntegrationTestHarness';
import { IntegrationAssertions } from '../helpers/IntegrationAssertions';
import { parseDocument } from '../../../parsers/frontmatter';

describe('Error Handling and Recovery', () => {
  let harness: IntegrationTestHarness;

  beforeEach(async () => {
    harness = new IntegrationTestHarness('error-recovery');
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should handle corrupted frontmatter gracefully', async () => {
    const result = await harness.executeScenario({
      name: 'Corrupted Frontmatter Recovery',

      setup: async () => {
        return [
          {
            path: 'resources/valid-doc.md',
            title: 'Valid Document',
            content: 'This is a valid document with [[resources/corrupted-doc]].',
            metadata: {
              title: 'Valid Document',
              tags: ['valid', 'test'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Create a document with corrupted frontmatter
        await context.fs.writeFile(
          'resources/corrupted-doc.md',
          `---
title: Corrupted Document
tags: [unclosed array
category: resources
invalid yaml here: [
---

This document has corrupted frontmatter but valid content with [[resources/valid-doc]].`,
        );

        // Try to rebuild indices - should not crash
        await context.backlinkManager.rebuildIndex();
        await context.searchEngine.buildIndex();

        // Create another document with different corruption
        await context.fs.writeFile(
          'resources/partially-corrupted.md',
          `---
title: "Partially Corrupted
tags: ['test']
---

Document with unclosed quote in title.`,
        );

        // Rebuild again
        await context.backlinkManager.rebuildIndex();
      },

      verify: async (context) => {
        // Valid document should still be searchable
        const results = await context.searchEngine.search({
          tags: ['valid'],
        });

        IntegrationAssertions.assertSearchResults(results, ['resources/valid-doc.md'], {
          exactMatch: false,
        });

        // System should continue functioning
        const stats = context.backlinkManager.getStats();
        expect(stats.totalDocuments).toBeGreaterThanOrEqual(1);

        // Valid links should still be tracked
        const validBacklinks = await context.backlinkManager.getBacklinks('resources/valid-doc.md');
        expect(validBacklinks).toBeDefined();
      },
    });

    expect(result.success).toBe(true);
  });

  it('should recover from missing linked documents', async () => {
    const result = await harness.executeScenario({
      name: 'Missing Document Recovery',

      setup: async () => {
        return [
          {
            path: 'projects/main-project.md',
            title: 'Main Project',
            content:
              'Links to [[resources/existing]], [[resources/missing]], and [[resources/to-be-deleted]].',
            metadata: {
              title: 'Main Project',
              tags: ['project'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
            },
          },
          {
            path: 'resources/existing.md',
            title: 'Existing Resource',
            content: 'This resource exists.',
            metadata: {
              title: 'Existing Resource',
              tags: ['resource'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/to-be-deleted.md',
            title: 'To Be Deleted',
            content: 'This will be deleted.',
            metadata: {
              title: 'To Be Deleted',
              tags: ['resource', 'temporary'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Delete a linked document
        await context.fs.deleteFile('resources/to-be-deleted.md');

        // Rebuild to detect broken links
        await context.backlinkManager.rebuildIndex();

        // Try to update the main project - should handle broken links
        await context.documentUpdater.updateDocument('projects/main-project.md', {
          metadata: { updated: true },
        });

        // Search should still work
        const results = await context.searchEngine.search({
          category: 'projects',
        });
        expect(results.results.length).toBeGreaterThan(0);
      },

      verify: async (context) => {
        // Check broken links are detected
        const brokenLinks = await context.backlinkManager.getBrokenLinks();
        expect(brokenLinks.length).toBe(2); // missing and to-be-deleted

        // Valid links should still work
        const existingBacklinksResult =
          context.backlinkManager.getBacklinks('resources/existing.md');
        const existingBacklinks = existingBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks('resources/existing.md', existingBacklinks, [
          'projects/main-project.md',
        ]);

        // Document should still be readable
        const content = await context.fs.readFile('projects/main-project.md');
        expect(content).toContain('[[resources/existing]]');
      },
    });

    expect(result.success).toBe(true);
  });

  it('should handle file system errors gracefully', async () => {
    const result = await harness.executeScenario({
      name: 'File System Error Handling',

      setup: async () => {
        return harness.generateDocuments(5, 0.3);
      },

      execute: async (context) => {
        // Try to read non-existent file
        try {
          await context.fs.readFile('non/existent/path.md');
        } catch (error) {
          // Expected error
          expect(error).toBeDefined();
        }

        // Try to write to invalid path
        try {
          await context.fs.writeFile('../../outside/context/root.md', 'content');
        } catch (error) {
          // Expected security error
          expect(error).toBeDefined();
        }

        // Try to update non-existent document
        try {
          await context.documentUpdater.updateDocument('missing/document.md', {
            content: 'new content',
          });
        } catch (error) {
          // Expected error
          expect(error).toBeDefined();
        }

        // System should still be functional
        const results = await context.searchEngine.search({});
        expect(results.totalCount).toBe(5);
      },

      verify: async (context) => {
        // Verify system is still consistent after errors
        const stats = context.backlinkManager.getStats();
        expect(stats.totalDocuments).toBe(5);

        // All original documents should still exist
        for (const [path] of context.documents) {
          const exists = await context.fs.exists(path);
          expect(exists).toBe(true);
        }
      },
    });

    expect(result.success).toBe(true);
  });

  it('should handle circular link references without stack overflow', async () => {
    const result = await harness.executeScenario({
      name: 'Circular Reference Handling',

      setup: async () => {
        // Create a deep circular reference chain
        const docs = [];
        const chainLength = 10;

        for (let i = 0; i < chainLength; i++) {
          const nextIndex = (i + 1) % chainLength;
          const prevIndex = (i - 1 + chainLength) % chainLength;

          docs.push({
            path: `areas/circular-${i}.md`,
            title: `Circular ${i}`,
            content: `Links to [[areas/circular-${nextIndex}]] and [[areas/circular-${prevIndex}]].`,
            metadata: {
              title: `Circular ${i}`,
              tags: ['circular', `level-${i}`],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const,
            },
          });
        }

        return docs;
      },

      execute: async (context) => {
        // Try to traverse the circular graph
        const visited = new Set<string>();
        const queue = ['areas/circular-0.md'];

        while (queue.length > 0 && visited.size < 20) {
          // Limit iterations
          const current = queue.shift()!;
          if (visited.has(current)) continue;

          visited.add(current);

          const forwardLinks = await context.backlinkManager.getForwardLinks(current);
          for (const link of forwardLinks) {
            queue.push(link.target + '.md');
          }
        }

        // Should have visited all documents without infinite loop
        expect(visited.size).toBe(10);
      },

      verify: async (context) => {
        // Verify all documents have correct link counts
        for (let i = 0; i < 10; i++) {
          const doc = `areas/circular-${i}.md`;
          const forwardLinks = await context.backlinkManager.getForwardLinks(doc);
          const backlinksResult = context.backlinkManager.getBacklinks(doc);
          const backlinks = backlinksResult.backlinks;

          expect(forwardLinks.length).toBe(2);
          expect(backlinks.length).toBe(2);
        }

        // System should handle circular references in search
        const results = await context.searchEngine.search({
          tags: ['circular'],
        });
        expect(results.results.length).toBe(10);
      },
    });

    expect(result.success).toBe(true);
  });

  it('should handle large documents without memory issues', async () => {
    const result = await harness.executeScenario({
      name: 'Large Document Handling',

      setup: async () => {
        return [
          {
            path: 'resources/normal-doc.md',
            title: 'Normal Document',
            content: 'Normal sized document linking to [[resources/large-doc]].',
            metadata: {
              title: 'Normal Document',
              tags: ['normal'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Create a large document (1MB of text)
        const largeContent = 'Large content. '.repeat(70000); // ~1MB
        const largeDoc = `---
title: Large Document
tags: [large, test]
category: resources
---

${largeContent}

Links to [[resources/normal-doc]].`;

        await context.fs.writeFile('resources/large-doc.md', largeDoc);

        // Operations should still work
        await context.backlinkManager.rebuildIndex();
        await context.searchEngine.buildIndex();

        // Search in large document
        const results = await context.searchEngine.search({
          content: 'Large content',
        });
        expect(results.results.length).toBeGreaterThan(0);
      },

      verify: async (context) => {
        // Verify large document is handled
        const largeExists = await context.fs.exists('resources/large-doc.md');
        expect(largeExists).toBe(true);

        // Backlinks should work
        const normalBacklinksResult =
          context.backlinkManager.getBacklinks('resources/normal-doc.md');
        const normalBacklinks = normalBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks('resources/normal-doc.md', normalBacklinks, [
          'resources/large-doc.md',
        ]);

        // Updates should work on large documents
        await context.documentUpdater.updateDocument('resources/large-doc.md', {
          metadata: { processed: true },
        });
      },
    });

    expect(result.success).toBe(true);
  });

  it('should recover from partial update failures', async () => {
    const result = await harness.executeScenario({
      name: 'Partial Update Recovery',

      setup: async () => {
        return [
          {
            path: 'projects/update-test.md',
            title: 'Update Test Project',
            content: 'Original content with [[resources/linked-resource]].',
            metadata: {
              title: 'Update Test Project',
              tags: ['update', 'test'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
              version: 1,
            },
          },
          {
            path: 'resources/linked-resource.md',
            title: 'Linked Resource',
            content: 'Resource linked by project.',
            metadata: {
              title: 'Linked Resource',
              tags: ['resource'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Simulate partial failures by attempting invalid updates
        const updates = [
          // Valid update
          context.documentUpdater.updateDocument('projects/update-test.md', {
            metadata: { version: 2 },
          }),

          // Invalid update (non-existent document)
          context.documentUpdater
            .updateDocument('projects/non-existent.md', {
              content: 'This will fail',
            })
            .catch(() => 'expected failure'),

          // Another valid update
          context.documentUpdater.updateDocument('projects/update-test.md', {
            metadata: { version: 3, lastUpdate: new Date().toISOString() },
          }),

          // Update with potential race condition
          context.documentUpdater.updateDocument('projects/update-test.md', {
            content:
              'Updated content with [[resources/linked-resource]] and [[resources/new-link]].',
          }),
        ];

        const results = await Promise.allSettled(updates);

        // Some should succeed, some should fail
        const successes = results.filter((r) => r.status === 'fulfilled');
        expect(successes.length).toBeGreaterThanOrEqual(3);
      },

      verify: async (context) => {
        // Document should still be valid
        const content = await context.fs.readFile('projects/update-test.md');
        const doc = parseDocument(content);

        expect(doc).toBeDefined();
        expect(doc.metadata.title).toBe('Update Test Project');

        // Version should be updated (at least one update succeeded)
        expect(doc.metadata.version).toBeGreaterThanOrEqual(2);

        // Links should still be tracked
        const forwardLinks =
          await context.backlinkManager.getForwardLinks('projects/update-test.md');
        expect(forwardLinks.length).toBeGreaterThan(0);

        // System should remain searchable
        const searchResults = await context.searchEngine.search({
          tags: ['update', 'test'],
        });
        IntegrationAssertions.assertSearchResults(searchResults, ['projects/update-test.md'], {
          exactMatch: false,
        });
      },
    });

    expect(result.success).toBe(true);
  });
});
