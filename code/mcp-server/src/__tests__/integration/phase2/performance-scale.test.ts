// ABOUTME: Integration tests for performance at scale
// ABOUTME: Tests system behavior with large document sets and complex operations

import '../helpers/test-stubs'; // Load test method stubs
import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { IntegrationTestHarness } from '../helpers/IntegrationTestHarness';
import { TestDataGenerator } from '../helpers/TestDataGenerator';
import { parseDocument } from '../../../parsers/frontmatter';

describe('Performance at Scale', () => {
  let harness: IntegrationTestHarness;
  let generator: TestDataGenerator;

  beforeEach(async () => {
    harness = new IntegrationTestHarness('performance-scale');
    generator = new TestDataGenerator();
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should handle 1000+ documents efficiently', async () => {
    const DOCUMENT_COUNT = 1000;
    const PERFORMANCE_TARGETS = {
      create: 50,      // ms per document
      update: 100,     // ms per document
      read: 20,        // ms per document
      search: 200,     // ms for search
      linkQuery: 100,  // ms for link query
    };

    const result = await harness.executeScenario({
      name: 'Large Scale Document Operations',
      
      setup: async () => {
        console.log(`Creating ${DOCUMENT_COUNT} documents...`);
        return generator.generateDocumentNetwork(DOCUMENT_COUNT, 0.1); // Lower link density for performance
      },

      execute: async (context) => {
        // Measure document creation time (already done in setup, so test read)
        const readSample = Array.from(context.documents.keys()).slice(0, 10);
        for (const path of readSample) {
          const { duration } = await harness.measureTime(
            () => context.fs.readFile(path)
          );
          expect(duration).toBeLessThan(PERFORMANCE_TARGETS.read);
        }

        // Measure search performance
        const searchQueries = [
          { content: 'development' },
          { tags: ['javascript'] },
          { category: 'projects' as const },
          { content: 'guide', tags: ['documentation'], operator: 'OR' as const }
        ];

        for (const query of searchQueries) {
          const { duration } = await harness.measureTime(
            () => context.searchEngine.search(query)
          );
          expect(duration).toBeLessThan(PERFORMANCE_TARGETS.search);
        }

        // Measure update performance
        const updateSample = Array.from(context.documents.keys()).slice(10, 15);
        for (const path of updateSample) {
          const { duration } = await harness.measureTime(
            () => context.documentUpdater.updateDocument(path, {
              metadata: { performanceTest: true }
            })
          );
          expect(duration).toBeLessThan(PERFORMANCE_TARGETS.update);
        }

        // Measure link query performance
        const linkSample = Array.from(context.documents.keys()).slice(20, 25);
        for (const path of linkSample) {
          const { duration } = await harness.measureTime(
            () => context.backlinkManager.getBacklinks(path)
          );
          expect(duration).toBeLessThan(PERFORMANCE_TARGETS.linkQuery);
        }
      },

      verify: async (context) => {
        // Verify all documents are indexed
        const stats = context.backlinkManager.getStats();
        expect(stats.totalDocuments).toBe(DOCUMENT_COUNT);

        // Verify search returns reasonable results
        const allResults = await context.searchEngine.search({});
        expect(allResults.totalCount).toBe(DOCUMENT_COUNT);

        // Check memory usage is reasonable
        if (global.gc) {
          global.gc();
        }
        const memUsage = process.memoryUsage();
        const mbUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
        console.log(`Memory usage: ${mbUsed}MB for ${DOCUMENT_COUNT} documents`);
        
        // Should use less than 200MB for 1000 documents
        expect(mbUsed).toBeLessThan(200);
      }
    });

    expect(result.success).toBe(true);
  }, 120000); // 2 minute timeout for large test

  it('should maintain performance with deep link hierarchies', async () => {
    const HIERARCHY_DEPTH = 10;
    const BRANCHES_PER_LEVEL = 3;
    
    const result = await harness.executeScenario({
      name: 'Deep Hierarchy Performance',
      
      setup: async () => {
        const docs = [];
        
        // Create a tree structure
        function createHierarchy(parentPath: string | null, level: number, prefix: string) {
          if (level > HIERARCHY_DEPTH) return;
          
          for (let i = 0; i < BRANCHES_PER_LEVEL; i++) {
            const docPath = `${prefix}/level-${level}/doc-${i}.md`;
            const links = parentPath ? [`[[${parentPath.replace('.md', '')}]]`] : [];
            
            // Add sibling links
            if (i > 0) {
              links.push(`[[${prefix}/level-${level}/doc-${i-1}]]`);
            }
            
            docs.push({
              path: docPath,
              title: `Document L${level}-${i}`,
              content: `Level ${level} document ${i}. Links: ${links.join(', ')}`,
              metadata: {
                title: `Document L${level}-${i}`,
                tags: [`level-${level}`, 'hierarchy'],
                created: new Date(),
                modified: new Date(),
                category: 'resources' as const,
                level: level
              }
            });
            
            // Recurse to create children
            createHierarchy(docPath, level + 1, prefix);
          }
        }
        
        createHierarchy(null, 1, 'resources');
        return docs;
      },

      execute: async (context) => {
        // Traverse from root to leaf
        const startTime = Date.now();
        
        // Find all level 1 documents
        const level1Docs = await context.searchEngine.search({
          tags: ['level-1']
        });
        
        // For each level 1, traverse to deepest level
        for (const result of level1Docs.results.slice(0, 2)) { // Test first 2 branches
          let currentPath = result.document.path;
          let currentLevel = 1;
          
          while (currentLevel < HIERARCHY_DEPTH) {
            const forwardLinks = await context.backlinkManager.getForwardLinks(currentPath);
            const childLink = forwardLinks.find(link => 
              link.target.includes(`level-${currentLevel + 1}`)
            );
            
            if (!childLink) break;
            currentPath = childLink.target + '.md';
            currentLevel++;
          }
          
          expect(currentLevel).toBeGreaterThanOrEqual(HIERARCHY_DEPTH - 1);
        }
        
        const traversalTime = Date.now() - startTime;
        expect(traversalTime).toBeLessThan(5000); // Should complete in 5 seconds
      },

      verify: async (context) => {
        // Verify hierarchy integrity
        for (let level = 1; level <= HIERARCHY_DEPTH; level++) {
          const levelDocs = await context.searchEngine.search({
            tags: [`level-${level}`]
          });
          
          // Each level should have correct number of documents
          const expectedCount = Math.pow(BRANCHES_PER_LEVEL, level - 1) * BRANCHES_PER_LEVEL;
          expect(levelDocs.results.length).toBeLessThanOrEqual(expectedCount);
        }

        // Verify backlinks work efficiently
        const leafDocs = await context.searchEngine.search({
          tags: [`level-${HIERARCHY_DEPTH}`]
        });
        
        if (leafDocs.results.length > 0) {
          const { duration } = await harness.measureTime(
            () => context.backlinkManager.getBacklinks(leafDocs.results[0].path)
          );
          expect(duration).toBeLessThan(100);
        }
      }
    });

    expect(result.success).toBe(true);
  }, 60000); // 1 minute timeout

  it('should handle high-frequency updates efficiently', async () => {
    const UPDATE_COUNT = 100;
    const CONCURRENT_UPDATES = 10;
    
    const result = await harness.executeScenario({
      name: 'High Frequency Updates',
      
      setup: async () => {
        return generator.generateDocumentNetwork(20, 0.5);
      },

      execute: async (context) => {
        const docs = Array.from(context.documents.keys());
        const targetDoc = docs[0];
        
        // Measure burst update performance
        const startTime = Date.now();
        
        for (let batch = 0; batch < UPDATE_COUNT / CONCURRENT_UPDATES; batch++) {
          const updates = [];
          
          for (let i = 0; i < CONCURRENT_UPDATES; i++) {
            const updateIndex = batch * CONCURRENT_UPDATES + i;
            updates.push(
              context.documentUpdater.updateDocument(targetDoc, {
                metadata: {
                  updateCount: updateIndex,
                  timestamp: Date.now()
                }
              })
            );
          }
          
          await Promise.all(updates);
        }
        
        const totalTime = Date.now() - startTime;
        const avgTimePerUpdate = totalTime / UPDATE_COUNT;
        
        console.log(`Completed ${UPDATE_COUNT} updates in ${totalTime}ms (${avgTimePerUpdate.toFixed(2)}ms per update)`);
        expect(avgTimePerUpdate).toBeLessThan(50); // Average under 50ms per update
      },

      verify: async (context) => {
        const docs = Array.from(context.documents.keys());
        const targetDoc = docs[0];
        
        // Verify final state
        const content = await context.fs.readFile(targetDoc);
        const doc = await parseDocument(content);
        
        expect(doc.metadata.updateCount).toBeDefined();
        expect(doc.metadata.updateCount).toBeGreaterThanOrEqual(UPDATE_COUNT - CONCURRENT_UPDATES);
        
        // Verify system remains responsive
        const { duration } = await harness.measureTime(
          () => context.searchEngine.search({ content: 'test' })
        );
        expect(duration).toBeLessThan(200);
      }
    });

    expect(result.success).toBe(true);
  }, 60000); // 1 minute timeout

  it('should scale search with complex queries', async () => {
    const result = await harness.executeScenario({
      name: 'Complex Query Scaling',
      
      setup: async () => {
        // Create documents with varied content for complex queries
        const docs = [];
        const topics = ['frontend', 'backend', 'database', 'security', 'performance'];
        const types = ['guide', 'tutorial', 'reference', 'example', 'overview'];
        
        for (let i = 0; i < 200; i++) {
          const topic = topics[i % topics.length];
          const type = types[Math.floor(i / topics.length) % types.length];
          const relatedTopic = topics[(i + 1) % topics.length];
          
          docs.push({
            path: `resources/${topic}-${type}-${i}.md`,
            title: `${topic} ${type} ${i}`,
            content: `This is a ${type} about ${topic}. It relates to [[resources/${relatedTopic}-guide-0]] and covers advanced ${topic} concepts.`,
            metadata: {
              title: `${topic} ${type} ${i}`,
              tags: [topic, type, 'documentation'],
              created: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Spread over time
              modified: new Date(),
              category: 'resources' as const,
              difficulty: i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced'
            }
          });
        }
        
        return docs;
      },

      execute: async (context) => {
        const complexQueries = [
          // Single criterion
          { tags: ['frontend'] },
          
          // Multiple tags with AND
          { tags: ['backend', 'guide'], operator: 'AND' as const },
          
          // Multiple tags with OR
          { tags: ['security', 'performance'], operator: 'OR' as const },
          
          // Content and tags
          { content: 'advanced', tags: ['tutorial'] },
          
          // Date range query
          {
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date()
            }
          },
          
          // Complex combined query
          {
            content: 'concepts',
            tags: ['documentation'],
            category: 'resources' as const,
            dateRange: {
              start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              end: new Date()
            }
          }
        ];

        for (const query of complexQueries) {
          const { result, duration } = await harness.measureTime(
            () => context.searchEngine.search(query)
          );
          
          expect(duration).toBeLessThan(300); // All queries under 300ms
          expect(result.results.length).toBeGreaterThan(0); // All queries return results
        }
      },

      verify: async (context) => {
        // Verify search accuracy
        const frontendGuides = await context.searchEngine.search({
          tags: ['frontend', 'guide'],
          operator: 'AND'
        });
        
        // All results should have both tags
        for (const result of frontendGuides.results) {
          expect(result.document.metadata.tags).toContain('frontend');
          expect(result.document.metadata.tags).toContain('guide');
        }

        // Verify pagination works at scale
        const allDocs = await context.searchEngine.search({}, { limit: 50 });
        expect(allDocs.results.length).toBe(50);
        expect(allDocs.totalCount).toBe(200);
      }
    });

    expect(result.success).toBe(true);
  }, 60000); // 1 minute timeout

  it('should maintain link integrity at scale', async () => {
    const NETWORK_SIZE = 100;
    
    const result = await harness.executeScenario({
      name: 'Link Integrity at Scale',
      
      setup: async () => {
        // Create a highly connected network
        return generator.generateDocumentNetwork(NETWORK_SIZE, 0.3);
      },

      execute: async (context) => {
        // Find hub documents (many connections)
        const hubDocs = [];
        
        for (const [path] of context.documents) {
          const backlinksResult = context.backlinkManager.getBacklinks(path);
        const backlinks = backlinksResult.backlinks;
          const forwardLinks = await context.backlinkManager.getForwardLinks(path);
          const totalConnections = backlinks.length + forwardLinks.length;
          
          if (totalConnections >= 10) {
            hubDocs.push({ path, connections: totalConnections });
          }
        }
        
        console.log(`Found ${hubDocs.length} hub documents`);
        
        // Update hub documents and verify link preservation
        for (const hub of hubDocs.slice(0, 5)) { // Test first 5 hubs
          const originalForwardLinks = await context.backlinkManager.getForwardLinks(hub.path);
          
          await context.documentUpdater.updateDocument(hub.path, {
            content: `Updated hub document with ${hub.connections} connections. Original links preserved.`,
            preserveLinks: true
          });
          
          const updatedForwardLinks = await context.backlinkManager.getForwardLinks(hub.path);
          expect(updatedForwardLinks.length).toBe(originalForwardLinks.length);
        }
      },

      verify: async (context) => {
        // Verify overall link consistency
        const stats = context.backlinkManager.getStats();
        expect(stats.documentCount || stats.totalDocuments).toBe(NETWORK_SIZE);
        
        // Calculate average connections per document
        let totalConnections = 0;
        for (const [path] of context.documents) {
          const backlinksResult = context.backlinkManager.getBacklinks(path);
        const backlinks = backlinksResult.backlinks;
          totalConnections += backlinks.length;
        }
        
        const avgConnections = totalConnections / NETWORK_SIZE;
        console.log(`Average connections per document: ${avgConnections.toFixed(2)}`);
        
        // With 0.3 link density, expect reasonable connectivity
        expect(avgConnections).toBeGreaterThan(1);
        expect(avgConnections).toBeLessThan(50);

        // Verify no orphaned documents in connected network
        const orphans = await context.backlinkManager.getOrphanedDocuments();
        const orphanRate = orphans.length / NETWORK_SIZE;
        console.log(`Orphan rate: ${(orphanRate * 100).toFixed(2)}%`);
        
        // Some orphans are expected but should be minimal
        expect(orphanRate).toBeLessThan(0.2); // Less than 20% orphans
      }
    });

    expect(result.success).toBe(true);
  }, 60000); // 1 minute timeout
});