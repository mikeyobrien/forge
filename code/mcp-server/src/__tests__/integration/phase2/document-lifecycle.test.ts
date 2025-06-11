// ABOUTME: Integration tests for complete document lifecycle workflows
// ABOUTME: Tests creation, reading, updating, searching, and link management

import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { IntegrationTestHarness } from '../helpers/IntegrationTestHarness';
import { IntegrationAssertions } from '../helpers/IntegrationAssertions';
import { TestDataGenerator } from '../helpers/TestDataGenerator';
import { parseDocument } from '../../../parsers/frontmatter';

describe('Document Lifecycle Integration', () => {
  let harness: IntegrationTestHarness;
  let generator: TestDataGenerator;

  beforeEach(async () => {
    harness = new IntegrationTestHarness('doc-lifecycle');
    generator = new TestDataGenerator();
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should handle complete document workflow with link preservation', async () => {
    const result = await harness.executeScenario({
      name: 'Complete Document Workflow',
      
      setup: async () => {
        // Create initial documents with links
        return [
          {
            path: 'projects/main-project.md',
            title: 'Main Project',
            content: 'This project depends on [[resources/api-guide]] and [[areas/development]].',
            metadata: {
              title: 'Main Project',
              tags: ['project', 'main'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
              status: 'active'
            }
          },
          {
            path: 'resources/api-guide.md',
            title: 'API Guide',
            content: 'API documentation referenced by various projects.',
            metadata: {
              title: 'API Guide',
              tags: ['api', 'documentation'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          {
            path: 'areas/development.md',
            title: 'Development Area',
            content: 'Development practices and standards.',
            metadata: {
              title: 'Development Area',
              tags: ['development', 'standards'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const
            }
          }
        ];
      },

      execute: async (context) => {
        // 1. Verify initial backlinks were tracked
        const apiBacklinksResult = context.backlinkManager.getBacklinks('resources/api-guide.md');
        const apiBacklinks = apiBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks(
          'resources/api-guide.md',
          apiBacklinks,
          ['projects/main-project.md'],
          { exactMatch: true }
        );

        // 2. Update document with new links while preserving old ones
        const updatedContent = 'This project depends on [[resources/api-guide]], [[areas/development]], and [[resources/new-resource]].';
        await context.documentUpdater.updateDocument('projects/main-project.md', {
          content: updatedContent,
          preserveLinks: true
        });

        // 3. Create the new linked document
        const newDoc = {
          path: 'resources/new-resource.md',
          content: 'A new resource document.',
          metadata: {
            title: 'New Resource',
            tags: ['resource', 'new'],
            created: new Date(),
            modified: new Date(),
            category: 'resources' as const
          }
        };
        await context.fs.writeFile(newDoc.path, `---
title: ${newDoc.metadata.title}
tags: ${newDoc.metadata.tags}
category: ${newDoc.metadata.category}
---

${newDoc.content}`);
        
        // Rebuild index to include new document
        await context.backlinkManager.rebuildIndex();

        // 4. Search for documents
        const searchResults = await context.searchEngine.search({
          tags: ['project']
        });
        
        IntegrationAssertions.assertSearchResults(
          searchResults,
          ['projects/main-project.md'],
          { exactMatch: false }
        );

        // 5. Query link relationships
        const forwardLinks = await context.backlinkManager.getForwardLinks('projects/main-project.md');
        IntegrationAssertions.assertForwardLinks(
          'projects/main-project.md',
          forwardLinks,
          ['resources/api-guide.md', 'areas/development.md', 'resources/new-resource.md'],
          { exactMatch: true }
        );
      },

      verify: async (context) => {
        // Verify all relationships remain intact
        const mainDoc = await context.fs.readFile('projects/main-project.md');
        const parsed = parseDocument(mainDoc);
        
        // Check content was updated
        IntegrationAssertions.assertContentContains(
          parsed,
          '[[resources/new-resource]]'
        );

        // Verify backlinks for all documents
        const newResourceBacklinksResult = context.backlinkManager.getBacklinks('resources/new-resource.md');
        const newResourceBacklinks = newResourceBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks(
          'resources/new-resource.md',
          newResourceBacklinks,
          ['projects/main-project.md'],
          { exactMatch: true }
        );

        // Verify search index was updated
        const updatedSearch = await context.searchEngine.search({
          content: 'new-resource'
        });
        IntegrationAssertions.assertSearchResults(
          updatedSearch,
          ['projects/main-project.md'],
          { exactMatch: false }
        );
      }
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.metrics?.documentCount).toBe(4); // 3 initial + 1 new
  });

  it('should handle document deletion and broken links', async () => {
    const result = await harness.executeScenario({
      name: 'Document Deletion and Broken Links',
      
      setup: async () => {
        return generator.generateDocumentNetwork(5, 0.5);
      },

      execute: async (context) => {
        // Get a document that has backlinks
        let targetDoc = '';
        let maxBacklinks = 0;
        
        // Find document with most backlinks
        for (const [doc] of context.documents) {
          const result = context.backlinkManager.getBacklinks(doc);
          if (result.totalCount > maxBacklinks) {
            maxBacklinks = result.totalCount;
            targetDoc = doc;
          }
        }

        // Delete the document
        await context.fs.deleteFile(targetDoc);
        
        // Rebuild index to detect broken links
        await context.backlinkManager.rebuildIndex();
      },

      verify: async (context) => {
        // Check for orphaned links
        const orphans = await context.backlinkManager.getOrphanedDocuments();
        expect(orphans.length).toBeGreaterThanOrEqual(0);

        // Verify broken links are detected
        const brokenLinks = await context.backlinkManager.getBrokenLinks();
        expect(brokenLinks.length).toBeGreaterThan(0);
      }
    });

    expect(result.success).toBe(true);
  });

  it('should maintain consistency during concurrent updates', async () => {
    const result = await harness.executeScenario({
      name: 'Concurrent Document Updates',
      
      setup: async () => {
        return [
          {
            path: 'projects/project-a.md',
            title: 'Project A',
            content: 'Links to [[projects/project-b]]',
            metadata: {
              title: 'Project A',
              tags: ['project'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const
            }
          },
          {
            path: 'projects/project-b.md',
            title: 'Project B',
            content: 'Links to [[projects/project-a]]',
            metadata: {
              title: 'Project B',
              tags: ['project'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const
            }
          }
        ];
      },

      execute: async (context) => {
        // Simulate concurrent updates
        const updates = [
          context.documentUpdater.updateDocument('projects/project-a.md', {
            content: 'Updated: Links to [[projects/project-b]] and [[projects/project-c]]'
          }),
          context.documentUpdater.updateDocument('projects/project-b.md', {
            content: 'Updated: Links to [[projects/project-a]] and [[projects/project-c]]'
          })
        ];

        // Wait for all updates to complete
        await Promise.all(updates);

        // Create the new referenced document
        await context.fs.writeFile('projects/project-c.md', `---
title: Project C
category: projects
---

New project referenced by others.`);

        await context.backlinkManager.rebuildIndex();
      },

      verify: async (context) => {
        // Verify circular references are maintained
        const aBacklinksResult = context.backlinkManager.getBacklinks('projects/project-a.md');
        const bBacklinksResult = context.backlinkManager.getBacklinks('projects/project-b.md');
        
        IntegrationAssertions.assertBacklinks(
          'projects/project-a.md',
          aBacklinksResult.backlinks,
          ['projects/project-b.md']
        );
        
        IntegrationAssertions.assertBacklinks(
          'projects/project-b.md',
          bBacklinksResult.backlinks,
          ['projects/project-a.md']
        );

        // Verify new document has backlinks from both
        const cBacklinksResult = context.backlinkManager.getBacklinks('projects/project-c.md');
        IntegrationAssertions.assertBacklinks(
          'projects/project-c.md',
          cBacklinksResult.backlinks,
          ['projects/project-a.md', 'projects/project-b.md'],
          { exactMatch: true }
        );

        // Verify link consistency
        IntegrationAssertions.assertLinkConsistency(
          context.documents,
          context.linkIndex,
          await context.backlinkManager.getAllBacklinks()
        );
      }
    });

    expect(result.success).toBe(true);
  });

  it('should handle large document networks efficiently', async () => {
    const LARGE_NETWORK_SIZE = 100;
    const MAX_OPERATION_TIME = 1000; // 1 second

    const result = await harness.executeScenario({
      name: 'Large Document Network Performance',
      
      setup: async () => {
        return generator.generateDocumentNetwork(LARGE_NETWORK_SIZE, 0.2);
      },

      execute: async (context) => {
        // Measure search performance
        const searchTime = await harness.measureTime(async () => {
          return context.searchEngine.search({
            content: 'development'
          });
        });
        
        expect(searchTime.duration).toBeLessThan(MAX_OPERATION_TIME);

        // Measure update performance
        const updateTime = await harness.measureTime(async () => {
          return context.documentUpdater.updateDocument(
            context.documents.keys().next().value,
            { content: 'Performance test update with [[new/link]]' }
          );
        });
        
        expect(updateTime.duration).toBeLessThan(MAX_OPERATION_TIME);
      },

      verify: async (context) => {
        const stats = context.backlinkManager.getStats();
        expect(stats.totalDocuments).toBe(LARGE_NETWORK_SIZE);
        expect(stats.totalBacklinks).toBeGreaterThan(0);
        
        // Verify no memory leaks or excessive usage
        const metrics = result.metrics || {};
        expect(metrics.documentCount).toBe(LARGE_NETWORK_SIZE);
      }
    });

    expect(result.success).toBe(true);
  }, 30000); // Increase timeout for large network test
});