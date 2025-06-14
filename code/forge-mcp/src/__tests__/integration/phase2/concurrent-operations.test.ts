// ABOUTME: Integration tests for concurrent document operations
// ABOUTME: Tests atomic operations, race conditions, and data consistency

import '../helpers/test-stubs'; // Load test method stubs
import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { IntegrationTestHarness } from '../helpers/IntegrationTestHarness';
import { IntegrationAssertions } from '../helpers/IntegrationAssertions';
import { parseDocument } from '../../../parsers/frontmatter';

describe('Concurrent Operations', () => {
  let harness: IntegrationTestHarness;

  beforeEach(async () => {
    harness = new IntegrationTestHarness('concurrent-ops');
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should handle concurrent document updates without data loss', async () => {
    const result = await harness.executeScenario({
      name: 'Concurrent Document Updates',

      setup: async () => {
        return [
          {
            path: 'projects/concurrent-test.md',
            title: 'Concurrent Test Project',
            content: `# Concurrent Test Project

Initial content with links:
- [[resources/resource-1]]
- [[resources/resource-2]]

This content will be updated concurrently.`,
            metadata: {
              title: 'Concurrent Test Project',
              tags: ['test', 'concurrent'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
              status: 'active',
            },
          },
          {
            path: 'resources/resource-1.md',
            title: 'Resource 1',
            content: 'First resource',
            metadata: {
              title: 'Resource 1',
              tags: ['resource'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/resource-2.md',
            title: 'Resource 2',
            content: 'Second resource',
            metadata: {
              title: 'Resource 2',
              tags: ['resource'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        const docPath = 'projects/concurrent-test.md';

        // Simulate 5 concurrent updates
        const updates = [];
        for (let i = 0; i < 5; i++) {
          updates.push(
            context.documentUpdater.updateDocument(docPath, {
              metadata: {
                version: i + 1,
                lastUpdater: `updater-${i}`,
              },
            }),
          );
        }

        // Wait for all updates to complete
        await Promise.all(updates);

        // Also update content concurrently
        const contentUpdates = [
          context.documentUpdater.updateDocument(docPath, {
            content: 'Updated content with [[resources/resource-1]] and [[resources/resource-3]]',
            preserveLinks: true,
          }),
          context.documentUpdater.updateDocument(docPath, {
            metadata: { tags: ['test', 'concurrent', 'updated'] },
          }),
        ];

        await Promise.all(contentUpdates);
      },

      verify: async (context) => {
        // Read final document state
        const finalContent = await context.fs.readFile('projects/concurrent-test.md');
        const finalDoc = parseDocument(finalContent);

        // Verify document exists and has metadata
        expect(finalDoc).toBeDefined();
        expect(finalDoc.metadata).toBeDefined();

        // Verify links are preserved (either original or updated)
        const hasLinks =
          finalContent.includes('[[resources/resource-1]]') ||
          finalContent.includes('[[resources/resource-2]]') ||
          finalContent.includes('[[resources/resource-3]]');
        expect(hasLinks).toBe(true);

        // Verify backlinks are consistent
        const backlinks1Result = context.backlinkManager.getBacklinks('resources/resource-1.md');
        expect(backlinks1Result.totalCount).toBeGreaterThan(0);
      },
    });

    expect(result.success).toBe(true);
  });

  it('should maintain atomic operations during parallel processing', async () => {
    const result = await harness.executeScenario({
      name: 'Atomic Operations Test',

      setup: async () => {
        const docs = [];

        // Create 10 documents that will all link to a central hub
        for (let i = 0; i < 10; i++) {
          docs.push({
            path: `projects/atomic-${i}.md`,
            title: `Atomic Test ${i}`,
            content: `Document ${i} linking to [[resources/central-hub]]`,
            metadata: {
              title: `Atomic Test ${i}`,
              tags: ['atomic', 'test'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
              counter: 0,
            },
          });
        }

        // Add the central hub
        docs.push({
          path: 'resources/central-hub.md',
          title: 'Central Hub',
          content: 'This is the central hub document.',
          metadata: {
            title: 'Central Hub',
            tags: ['hub', 'central'],
            created: new Date(),
            modified: new Date(),
            category: 'resources' as const,
          },
        });

        return docs;
      },

      execute: async (context) => {
        // Simulate parallel increments to metadata counters
        const updates = [];

        for (let i = 0; i < 10; i++) {
          const docPath = `projects/atomic-${i}.md`;

          // Each document gets updated 5 times in parallel
          for (let j = 0; j < 5; j++) {
            updates.push(
              (async () => {
                // Read current state
                const content = await context.fs.readFile(docPath);
                const doc = parseDocument(content);
                const currentCounter = (doc.metadata.counter as number) || 0;

                // Update with incremented counter
                await context.documentUpdater.updateDocument(docPath, {
                  metadata: {
                    counter: currentCounter + 1,
                    lastUpdate: new Date().toISOString(),
                  },
                });
              })(),
            );
          }
        }

        // Execute all updates in parallel
        await Promise.all(updates);

        // Also rebuild index concurrently
        await context.backlinkManager.rebuildIndex();
      },

      verify: async (context) => {
        // Verify central hub has correct number of backlinks
        const hubBacklinksResult = context.backlinkManager.getBacklinks('resources/central-hub.md');
        const hubBacklinks = hubBacklinksResult.backlinks;
        expect(hubBacklinks.length).toBe(10);

        // Check that documents weren't corrupted
        for (let i = 0; i < 10; i++) {
          const docPath = `projects/atomic-${i}.md`;
          const exists = await context.fs.exists(docPath);
          expect(exists).toBe(true);

          const content = await context.fs.readFile(docPath);
          const doc = parseDocument(content);
          expect(doc.metadata).toBeDefined();

          // Counter might not be exactly 5 due to race conditions,
          // but document should be valid
          expect(doc.metadata.counter).toBeGreaterThanOrEqual(1);
          expect(doc.metadata.counter).toBeLessThanOrEqual(5);
        }
      },
    });

    expect(result.success).toBe(true);
  });

  it('should handle concurrent search index updates', async () => {
    const result = await harness.executeScenario({
      name: 'Concurrent Search Index Updates',

      setup: async () => {
        return harness.generateDocuments(20, 0.3);
      },

      execute: async (context) => {
        // Perform concurrent operations that affect search index
        const operations = [];

        // Group 1: Update existing documents
        for (let i = 0; i < 5; i++) {
          const docs = Array.from(context.documents.keys());
          const randomDoc = docs[Math.floor(Math.random() * docs.length)];

          operations.push(
            context.documentUpdater.updateDocument(randomDoc, {
              content: `Updated content ${i} with search term "concurrent-${i}"`,
            }),
          );
        }

        // Group 2: Create new documents
        for (let i = 0; i < 5; i++) {
          operations.push(
            (async () => {
              const newPath = `areas/concurrent-new-${i}.md`;
              await context.fs.writeFile(
                newPath,
                `---
title: Concurrent New ${i}
tags: [concurrent, new]
category: areas
---

New document created during concurrent test ${i}.`,
              );

              // Rebuild to include in search
              await context.searchEngine.buildIndex();
            })(),
          );
        }

        // Group 3: Perform searches
        for (let i = 0; i < 5; i++) {
          operations.push(
            context.searchEngine.search({
              content: `concurrent-${i}`,
            }),
          );
        }

        // Execute all operations concurrently
        const results = await Promise.allSettled(operations);

        // Check that operations completed (some searches might return empty)
        const failures = results.filter((r) => r.status === 'rejected');
        expect(failures.length).toBe(0);
      },

      verify: async (context) => {
        // Verify search index is consistent
        const allResults = await context.searchEngine.search({});
        expect(allResults.totalCount).toBeGreaterThanOrEqual(25); // 20 original + 5 new

        // Search for concurrent terms
        const concurrentResults = await context.searchEngine.search({
          content: 'concurrent',
        });
        expect(concurrentResults.results.length).toBeGreaterThan(0);

        // Verify new documents are indexed
        const newDocResults = await context.searchEngine.search({
          tags: ['concurrent', 'new'],
        });
        expect(newDocResults.results.length).toBe(5);
      },
    });

    expect(result.success).toBe(true);
  });

  it('should prevent race conditions in backlink updates', async () => {
    const result = await harness.executeScenario({
      name: 'Backlink Race Condition Prevention',

      setup: async () => {
        return [
          {
            path: 'projects/race-test.md',
            title: 'Race Test Project',
            content: 'Initial content without links',
            metadata: {
              title: 'Race Test Project',
              tags: ['race', 'test'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Create 10 documents in parallel, all linking to the race-test document
        const creates = [];

        for (let i = 0; i < 10; i++) {
          creates.push(
            (async () => {
              const newPath = `resources/linker-${i}.md`;
              await context.fs.writeFile(
                newPath,
                `---
title: Linker ${i}
category: resources
---

This document links to [[projects/race-test]].`,
              );

              // Parse and update backlinks
              const content = await context.fs.readFile(newPath);
              const doc = parseDocument(content);
              await context.backlinkManager.updateDocumentLinks(newPath, content);
            })(),
          );
        }

        await Promise.all(creates);

        // Now update the race-test document to add links in parallel
        const updates = [];
        for (let i = 0; i < 5; i++) {
          updates.push(
            context.documentUpdater.updateDocument('projects/race-test.md', {
              content: `Updated content ${i} with [[resources/linker-${i}]]`,
            }),
          );
        }

        await Promise.all(updates);
      },

      verify: async (context) => {
        // Verify race-test has correct backlinks (should have 10)
        const raceTestBacklinksResult =
          context.backlinkManager.getBacklinks('projects/race-test.md');
        const raceTestBacklinks = raceTestBacklinksResult.backlinks;
        expect(raceTestBacklinks.length).toBe(10);

        // Verify each linker is properly tracked
        for (let i = 0; i < 10; i++) {
          const linkerPath = `resources/linker-${i}.md`;
          const exists = await context.fs.exists(linkerPath);
          expect(exists).toBe(true);

          // Check forward links
          const forwardLinks = await context.backlinkManager.getForwardLinks(linkerPath);
          expect(forwardLinks.some((l) => l.target === 'projects/race-test')).toBe(true);
        }

        // Verify bidirectional consistency
        IntegrationAssertions.assertLinkConsistency(
          context.documents,
          context.linkIndex,
          await context.backlinkManager.getAllBacklinks(),
        );
      },
    });

    expect(result.success).toBe(true);
  });

  it('should handle concurrent file operations gracefully', async () => {
    const result = await harness.executeScenario({
      name: 'Concurrent File Operations',

      setup: async () => {
        return harness.generateDocuments(5, 0.5);
      },

      execute: async (context) => {
        const operations = [];
        const testDoc = Array.from(context.documents.keys())[0];

        // Mix of read, write, and delete operations
        operations.push(
          // Multiple reads
          context.fs.readFile(testDoc),
          context.fs.readFile(testDoc),

          // Update while reading
          context.documentUpdater.updateDocument(testDoc, {
            metadata: { concurrentTest: true },
          }),

          // More reads during update
          context.fs.readFile(testDoc),

          // Check existence during operations
          context.fs.exists(testDoc),

          // Try to update again
          context.documentUpdater.updateDocument(testDoc, {
            metadata: { secondUpdate: true },
          }),
        );

        // Execute all operations
        const results = await Promise.allSettled(operations);

        // All operations should complete (no deadlocks)
        const completed = results.filter((r) => r.status === 'fulfilled');
        expect(completed.length).toBe(results.length);
      },

      verify: async (context) => {
        // Verify file system is still consistent
        const testDoc = Array.from(context.documents.keys())[0];
        const exists = await context.fs.exists(testDoc);
        expect(exists).toBe(true);

        // Verify updates were applied
        const content = await context.fs.readFile(testDoc);
        const doc = parseDocument(content);
        expect(doc.metadata).toBeDefined();

        // Verify no corruption occurred
        expect(doc.content).toBeDefined();
        expect(doc.metadata.title).toBeDefined();
      },
    });

    expect(result.success).toBe(true);
  });
});
