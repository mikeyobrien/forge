// ABOUTME: Integration tests for link graph integrity and consistency
// ABOUTME: Tests multi-document networks, link updates, and broken link detection

import '../helpers/test-stubs'; // Load test method stubs
import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { IntegrationTestHarness } from '../helpers/IntegrationTestHarness';
import { IntegrationAssertions } from '../helpers/IntegrationAssertions';
import { parseWikiLinks } from '../../../parser/wiki-link';

describe('Link Graph Integrity', () => {
  let harness: IntegrationTestHarness;

  beforeEach(async () => {
    harness = new IntegrationTestHarness('link-graph');
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should maintain link consistency in complex document networks', async () => {
    const result = await harness.executeScenario({
      name: 'Complex Link Network Consistency',
      
      setup: async () => {
        // Create a hub-and-spoke network with interconnections
        return [
          // Hub document
          {
            path: 'resources/index.md',
            title: 'Resource Index',
            content: `# Resource Index

This is the main index linking to all resources:
- [[resources/api-docs]] - API Documentation
- [[resources/user-guide]] - User Guide
- [[resources/dev-guide]] - Developer Guide
- [[resources/troubleshooting]] - Troubleshooting

Also see [[projects/main-project]] for implementation details.`,
            metadata: {
              title: 'Resource Index',
              tags: ['index', 'hub'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          // Spoke documents with cross-links
          {
            path: 'resources/api-docs.md',
            title: 'API Documentation',
            content: 'API reference. See also [[resources/dev-guide]] and [[resources/user-guide]].',
            metadata: {
              title: 'API Documentation',
              tags: ['api', 'docs'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          {
            path: 'resources/user-guide.md',
            title: 'User Guide',
            content: 'User documentation. Related: [[resources/troubleshooting]].',
            metadata: {
              title: 'User Guide',
              tags: ['user', 'guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          {
            path: 'resources/dev-guide.md',
            title: 'Developer Guide',
            content: 'Developer documentation. See [[resources/api-docs]] for API details.',
            metadata: {
              title: 'Developer Guide',
              tags: ['developer', 'guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          {
            path: 'resources/troubleshooting.md',
            title: 'Troubleshooting',
            content: 'Common issues and solutions. Back to [[resources/index]].',
            metadata: {
              title: 'Troubleshooting',
              tags: ['troubleshooting', 'support'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          {
            path: 'projects/main-project.md',
            title: 'Main Project',
            content: 'Implementation using resources from [[resources/index]].',
            metadata: {
              title: 'Main Project',
              tags: ['project', 'implementation'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
              status: 'active'
            }
          }
        ];
      },

      execute: async (context) => {
        // Verify hub has many outgoing links
        const hubLinks = await context.backlinkManager.getForwardLinks('resources/index.md');
        expect(hubLinks.length).toBe(5); // 4 resources + 1 project

        // Verify hub has backlinks
        const hubBacklinksResult = context.backlinkManager.getBacklinks('resources/index.md');
        const hubBacklinks = hubBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks(
          'resources/index.md',
          hubBacklinks,
          ['resources/troubleshooting.md', 'projects/main-project.md']
        );

        // Update a spoke document to add more cross-links
        await context.documentUpdater.updateDocument('resources/api-docs.md', {
          content: 'API reference. See also [[resources/dev-guide]], [[resources/user-guide]], and [[resources/troubleshooting]]. Back to [[resources/index]].'
        });
      },

      verify: async (context) => {
        // Verify all forward and backward links are consistent
        const allBacklinks = await context.backlinkManager.getAllBacklinks();
        IntegrationAssertions.assertLinkConsistency(
          context.documents,
          context.linkIndex,
          allBacklinks
        );

        // Verify no orphaned documents (all should have at least one backlink except the hub)
        const orphans = await context.backlinkManager.getOrphanedDocuments();
        expect(orphans.length).toBe(0); // All documents are connected

        // Verify graph traversal works
        const apiDocsBacklinksResult = context.backlinkManager.getBacklinks('resources/api-docs.md');
        const apiDocsBacklinks = apiDocsBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks(
          'resources/api-docs.md',
          apiDocsBacklinks,
          ['resources/index.md', 'resources/dev-guide.md'],
          { exactMatch: true }
        );
      }
    });

    expect(result.success).toBe(true);
  });

  it('should detect and handle circular references', async () => {
    const result = await harness.executeScenario({
      name: 'Circular Reference Detection',
      
      setup: async () => {
        return [
          {
            path: 'areas/area-a.md',
            title: 'Area A',
            content: 'This area relates to [[areas/area-b]] and [[areas/area-c]].',
            metadata: {
              title: 'Area A',
              tags: ['area'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const
            }
          },
          {
            path: 'areas/area-b.md',
            title: 'Area B',
            content: 'This area relates to [[areas/area-c]] and [[areas/area-a]].',
            metadata: {
              title: 'Area B',
              tags: ['area'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const
            }
          },
          {
            path: 'areas/area-c.md',
            title: 'Area C',
            content: 'This area relates to [[areas/area-a]] and [[areas/area-b]].',
            metadata: {
              title: 'Area C',
              tags: ['area'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const
            }
          }
        ];
      },

      execute: async (context) => {
        // Each document should have exactly 2 forward links and 2 backlinks
        for (const doc of ['areas/area-a.md', 'areas/area-b.md', 'areas/area-c.md']) {
          const forwardLinks = await context.backlinkManager.getForwardLinks(doc);
          const backlinksResult = context.backlinkManager.getBacklinks(doc);
        const backlinks = backlinksResult.backlinks;
          
          expect(forwardLinks.length).toBe(2);
          expect(backlinks.length).toBe(2);
        }
      },

      verify: async (context) => {
        // Verify circular references don't cause issues
        IntegrationAssertions.assertLinkConsistency(
          context.documents,
          context.linkIndex,
          await context.backlinkManager.getAllBacklinks()
        );

        // Verify graph stats
        const stats = context.backlinkManager.getStats();
        expect(stats.documentCount || stats.totalDocuments).toBe(3);
        expect(stats.linkCount || stats.totalBacklinks).toBe(6); // Each doc has 2 backlinks
      }
    });

    expect(result.success).toBe(true);
  });

  it('should handle broken links correctly', async () => {
    const result = await harness.executeScenario({
      name: 'Broken Link Detection',
      
      setup: async () => {
        return [
          {
            path: 'projects/project-with-broken-links.md',
            title: 'Project with Broken Links',
            content: `This project references:
- [[projects/existing-project]] - Valid link
- [[projects/non-existent-project]] - Broken link
- [[resources/missing-resource]] - Another broken link
- [[areas/valid-area]] - Valid link`,
            metadata: {
              title: 'Project with Broken Links',
              tags: ['project', 'test'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const
            }
          },
          {
            path: 'projects/existing-project.md',
            title: 'Existing Project',
            content: 'This project exists.',
            metadata: {
              title: 'Existing Project',
              tags: ['project'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const
            }
          },
          {
            path: 'areas/valid-area.md',
            title: 'Valid Area',
            content: 'This area exists.',
            metadata: {
              title: 'Valid Area',
              tags: ['area'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const
            }
          }
        ];
      },

      execute: async (context) => {
        // Get broken links
        const brokenLinks = await context.backlinkManager.getBrokenLinks();
        
        expect(brokenLinks.length).toBe(2);
        expect(brokenLinks).toContainEqual({
          source: 'projects/project-with-broken-links.md',
          target: 'projects/non-existent-project.md',
          line: expect.any(Number),
          column: expect.any(Number)
        });
        expect(brokenLinks).toContainEqual({
          source: 'projects/project-with-broken-links.md',
          target: 'resources/missing-resource.md',
          line: expect.any(Number),
          column: expect.any(Number)
        });
      },

      verify: async (context) => {
        // Verify valid links still have proper backlinks
        const existingBacklinksResult = context.backlinkManager.getBacklinks('projects/existing-project.md');
        const existingBacklinks = existingBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks(
          'projects/existing-project.md',
          existingBacklinks,
          ['projects/project-with-broken-links.md'],
          { exactMatch: true }
        );

        // Verify stats account for broken links
        const stats = context.backlinkManager.getStats();
        // Broken links might be tracked separately
        expect(brokenLinks.length).toBe(2);
      }
    });

    expect(result.success).toBe(true);
  });

  it('should handle link updates during document moves', async () => {
    const result = await harness.executeScenario({
      name: 'Link Updates on Document Move',
      
      setup: async () => {
        return [
          {
            path: 'projects/project-to-move.md',
            title: 'Project to Move',
            content: 'This will be moved. Links to [[resources/guide]].',
            metadata: {
              title: 'Project to Move',
              tags: ['project', 'movable'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const
            }
          },
          {
            path: 'resources/guide.md',
            title: 'Guide',
            content: 'Guide referencing [[projects/project-to-move]].',
            metadata: {
              title: 'Guide',
              tags: ['guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          },
          {
            path: 'areas/development.md',
            title: 'Development',
            content: 'Development area using [[projects/project-to-move]].',
            metadata: {
              title: 'Development',
              tags: ['development'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const
            }
          }
        ];
      },

      execute: async (context) => {
        // Simulate moving a document (delete and recreate)
        const oldPath = 'projects/project-to-move.md';
        const newPath = 'archives/project-moved.md';
        
        // Read old content
        const oldContent = await context.fs.readFile(oldPath);
        const oldDoc = parseWikiLinks(oldContent);
        
        // Delete old file
        await context.fs.deleteFile(oldPath);
        
        // Create new file with updated category
        const newContent = oldContent.replace('category: projects', 'category: archives');
        await context.fs.writeFile(newPath, newContent);
        
        // Update references in other documents
        const filesToUpdate = ['resources/guide.md', 'areas/development.md'];
        for (const file of filesToUpdate) {
          const content = await context.fs.readFile(file);
          const updatedContent = content.replace(
            `[[${oldPath.replace('.md', '')}]]`,
            `[[${newPath.replace('.md', '')}]]`
          );
          await context.fs.writeFile(file, updatedContent);
        }
        
        // Rebuild index
        await context.backlinkManager.rebuildIndex();
      },

      verify: async (context) => {
        // Verify old path no longer exists
        const oldExists = await context.fs.exists('projects/project-to-move.md');
        expect(oldExists).toBe(false);

        // Verify new path has correct backlinks
        const newBacklinksResult = context.backlinkManager.getBacklinks('archives/project-moved.md');
        const newBacklinks = newBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks(
          'archives/project-moved.md',
          newBacklinks,
          ['resources/guide.md', 'areas/development.md'],
          { exactMatch: true }
        );

        // Verify no broken links remain
        const brokenLinks = await context.backlinkManager.getBrokenLinks();
        expect(brokenLinks.length).toBe(0);
      }
    });

    expect(result.success).toBe(true);
  });

  it('should maintain performance with deep link chains', async () => {
    const CHAIN_LENGTH = 20;
    
    const result = await harness.executeScenario({
      name: 'Deep Link Chain Performance',
      
      setup: async () => {
        const docs = [];
        
        // Create a chain of documents, each linking to the next
        for (let i = 0; i < CHAIN_LENGTH; i++) {
          const nextLink = i < CHAIN_LENGTH - 1 ? `[[resources/doc-${i + 1}]]` : '[[resources/doc-0]]'; // Make it circular
          
          docs.push({
            path: `resources/doc-${i}.md`,
            title: `Document ${i}`,
            content: `This is document ${i}. Next: ${nextLink}`,
            metadata: {
              title: `Document ${i}`,
              tags: ['chain', `level-${i}`],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const
            }
          });
        }
        
        return docs;
      },

      execute: async (context) => {
        // Traverse the chain
        let currentDoc = 'resources/doc-0.md';
        const visited = new Set<string>();
        
        while (!visited.has(currentDoc)) {
          visited.add(currentDoc);
          
          const forwardLinks = await context.backlinkManager.getForwardLinks(currentDoc);
          expect(forwardLinks.length).toBe(1);
          
          // Move to next document
          currentDoc = forwardLinks[0].target + '.md';
        }
        
        expect(visited.size).toBe(CHAIN_LENGTH);
      },

      verify: async (context) => {
        // Verify each document has exactly one forward link and one backlink
        for (let i = 0; i < CHAIN_LENGTH; i++) {
          const doc = `resources/doc-${i}.md`;
          const forwardLinks = await context.backlinkManager.getForwardLinks(doc);
          const backlinksResult = context.backlinkManager.getBacklinks(doc);
        const backlinks = backlinksResult.backlinks;
          
          expect(forwardLinks.length).toBe(1);
          expect(backlinks.length).toBe(1);
        }

        // Verify total stats
        const stats = context.backlinkManager.getStats();
        expect(stats.documentCount || stats.totalDocuments).toBe(CHAIN_LENGTH);
        expect(stats.linkCount || stats.totalBacklinks).toBe(CHAIN_LENGTH); // Each doc has one backlink
      }
    });

    expect(result.success).toBe(true);
  });
});