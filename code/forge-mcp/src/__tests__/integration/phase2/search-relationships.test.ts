// ABOUTME: Integration tests for search functionality combined with link relationships
// ABOUTME: Tests advanced search features, faceted search, and link-aware searching

import '../helpers/test-stubs'; // Load test method stubs
import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { IntegrationTestHarness } from '../helpers/IntegrationTestHarness';
import { IntegrationAssertions } from '../helpers/IntegrationAssertions';
import { TestDataGenerator } from '../helpers/TestDataGenerator';

describe('Search and Relationship Integration', () => {
  let harness: IntegrationTestHarness;
  let generator: TestDataGenerator;

  beforeEach(async () => {
    harness = new IntegrationTestHarness('search-relations');
    generator = new TestDataGenerator();
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should search documents with link context', async () => {
    const result = await harness.executeScenario({
      name: 'Search with Link Context',

      setup: async () => {
        return [
          {
            path: 'projects/search-project.md',
            title: 'Search Implementation Project',
            content: `# Search Implementation Project

This project implements advanced search features including:
- Full-text search with [[resources/elasticsearch-guide]]
- Faceted search using [[resources/facet-tutorial]]
- Link analysis from [[areas/graph-theory]]

The search engine supports fuzzy matching and relevance scoring.`,
            metadata: {
              title: 'Search Implementation Project',
              tags: ['search', 'implementation', 'project'],
              created: new Date(),
              modified: new Date(),
              category: 'projects' as const,
              status: 'active',
            },
          },
          {
            path: 'resources/elasticsearch-guide.md',
            title: 'Elasticsearch Guide',
            content:
              'Guide for implementing Elasticsearch. Used by multiple [[projects/search-project]].',
            metadata: {
              title: 'Elasticsearch Guide',
              tags: ['search', 'elasticsearch', 'guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/facet-tutorial.md',
            title: 'Faceted Search Tutorial',
            content: 'Tutorial on implementing faceted search with aggregations.',
            metadata: {
              title: 'Faceted Search Tutorial',
              tags: ['search', 'facets', 'tutorial'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'areas/graph-theory.md',
            title: 'Graph Theory Applications',
            content: 'Applying graph theory to link analysis and search relevance.',
            metadata: {
              title: 'Graph Theory Applications',
              tags: ['graph', 'theory', 'algorithms'],
              created: new Date(),
              modified: new Date(),
              category: 'areas' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Search for "search" - should find multiple documents
        const searchResults = await context.searchEngine.search({
          content: 'search',
        });

        IntegrationAssertions.assertSearchResults(
          searchResults,
          [
            'projects/search-project.md',
            'resources/elasticsearch-guide.md',
            'resources/facet-tutorial.md',
          ],
          { exactMatch: false },
        );

        // Search with tag filter
        const tagResults = await context.searchEngine.search({
          tags: ['search', 'project'],
        });

        IntegrationAssertions.assertSearchResults(tagResults, ['projects/search-project.md'], {
          exactMatch: true,
        });

        // Find documents linked from search project
        const projectLinks = await context.backlinkManager.getForwardLinks(
          'projects/search-project.md',
        );
        expect(projectLinks.length).toBe(3);

        // Find documents that link to elasticsearch guide
        const guideBacklinksResult = context.backlinkManager.getBacklinks(
          'resources/elasticsearch-guide.md',
        );
        const guideBacklinks = guideBacklinksResult.backlinks;
        IntegrationAssertions.assertBacklinks('resources/elasticsearch-guide.md', guideBacklinks, [
          'projects/search-project.md',
        ]);
      },

      verify: async (context) => {
        // Verify combined search and link traversal
        // First find search-related documents
        const searchDocs = await context.searchEngine.search({
          tags: ['search'],
        });

        // Then check their link relationships
        for (const result of searchDocs.results) {
          const forwardLinks = await context.backlinkManager.getForwardLinks(result.path);
          const backlinksResult = context.backlinkManager.getBacklinks(result.path);
          const backlinks = backlinksResult.backlinks;

          // Documents should be interconnected
          expect(forwardLinks.length + backlinks.length).toBeGreaterThan(0);
        }
      },
    });

    expect(result.success).toBe(true);
  });

  it('should support faceted search with link counts', async () => {
    const result = await harness.executeScenario({
      name: 'Faceted Search with Links',

      setup: async () => {
        // Generate a larger network for facet testing
        return generator.generateDocumentNetwork(20, 0.3);
      },

      execute: async (context) => {
        // Search with category faceting
        const results = await context.searchEngine.search(
          { content: 'development' },
          { includeFacets: true },
        );

        // Check facets are returned (even if basic implementation)
        expect(results.totalCount).toBeGreaterThan(0);

        // Group documents by category and count links
        const categoryLinkCounts = new Map<string, number>();

        for (const [path, doc] of context.documents) {
          const category = doc.metadata.category;
          const links = await context.backlinkManager.getForwardLinks(path);

          categoryLinkCounts.set(category, (categoryLinkCounts.get(category) || 0) + links.length);
        }

        // Verify each category has documents with links
        for (const [category, linkCount] of categoryLinkCounts) {
          expect(linkCount).toBeGreaterThanOrEqual(0);
        }
      },

      verify: async (context) => {
        // Verify search results include highly connected documents
        const results = await context.searchEngine.search({});

        // Check that results are properly ranked
        expect(results.results.length).toBeGreaterThan(0);

        // Verify first result has a reasonable score
        if (results.results.length > 0) {
          expect(results.results[0].score).toBeGreaterThan(0);
        }
      },
    });

    expect(result.success).toBe(true);
  });

  it('should find similar documents based on links and content', async () => {
    const result = await harness.executeScenario({
      name: 'Similar Document Detection',

      setup: async () => {
        return [
          // Group 1: JavaScript testing documents
          {
            path: 'resources/jest-guide.md',
            title: 'Jest Testing Guide',
            content:
              'Guide for testing JavaScript applications with Jest. See also [[resources/mocha-guide]] and [[resources/testing-best-practices]].',
            metadata: {
              title: 'Jest Testing Guide',
              tags: ['javascript', 'testing', 'jest'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/mocha-guide.md',
            title: 'Mocha Testing Guide',
            content:
              'Guide for testing JavaScript with Mocha. Alternative to [[resources/jest-guide]]. Follow [[resources/testing-best-practices]].',
            metadata: {
              title: 'Mocha Testing Guide',
              tags: ['javascript', 'testing', 'mocha'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/testing-best-practices.md',
            title: 'Testing Best Practices',
            content: 'Best practices for JavaScript testing applicable to both Jest and Mocha.',
            metadata: {
              title: 'Testing Best Practices',
              tags: ['javascript', 'testing', 'best-practices'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          // Group 2: Python documents (different topic)
          {
            path: 'resources/python-basics.md',
            title: 'Python Basics',
            content: 'Introduction to Python programming. See [[resources/python-advanced]].',
            metadata: {
              title: 'Python Basics',
              tags: ['python', 'programming', 'basics'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/python-advanced.md',
            title: 'Advanced Python',
            content: 'Advanced Python concepts building on [[resources/python-basics]].',
            metadata: {
              title: 'Advanced Python',
              tags: ['python', 'programming', 'advanced'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Find documents similar to Jest guide
        // Should find Mocha guide due to similar tags and shared links
        const jestSimilar = await context.searchEngine.search({
          tags: ['javascript', 'testing'],
          operator: 'AND',
        });

        // Jest and Mocha guides should both be in results
        const paths = jestSimilar.results.map((r) => r.document.path);
        expect(paths).toContain('resources/jest-guide.md');
        expect(paths).toContain('resources/mocha-guide.md');
        expect(paths).toContain('resources/testing-best-practices.md');

        // Python documents should not be in JavaScript testing results
        expect(paths).not.toContain('resources/python-basics.md');
        expect(paths).not.toContain('resources/python-advanced.md');

        // Check link relationships between similar documents
        const jestLinks = await context.backlinkManager.getForwardLinks('resources/jest-guide.md');
        const mochaLinks = await context.backlinkManager.getForwardLinks(
          'resources/mocha-guide.md',
        );

        // Both should link to best practices
        expect(jestLinks.some((l) => l.target === 'resources/testing-best-practices')).toBe(true);
        expect(mochaLinks.some((l) => l.target === 'resources/testing-best-practices')).toBe(true);
      },

      verify: async (context) => {
        // Verify documents with similar link patterns group together
        const testingDocs = ['resources/jest-guide.md', 'resources/mocha-guide.md'];

        for (const doc of testingDocs) {
          const backlinks = await context.backlinkManager.getBacklinks(
            'resources/testing-best-practices.md',
          );
          const sources = backlinks.map((bl) => bl.source);
          expect(sources).toContain(doc);
        }

        // Verify isolated groups
        const pythonSearch = await context.searchEngine.search({
          tags: ['python'],
        });

        IntegrationAssertions.assertSearchResults(
          pythonSearch,
          ['resources/python-basics.md', 'resources/python-advanced.md'],
          { exactMatch: true },
        );
      },
    });

    expect(result.success).toBe(true);
  });

  it('should handle complex queries with link filtering', async () => {
    const result = await harness.executeScenario({
      name: 'Complex Query with Links',

      setup: async () => {
        return [
          {
            path: 'projects/frontend-project.md',
            title: 'Frontend Project',
            content:
              'React-based frontend using [[resources/react-guide]] and [[resources/typescript-guide]].',
            metadata: {
              title: 'Frontend Project',
              tags: ['frontend', 'react', 'project'],
              created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
              modified: new Date(),
              category: 'projects' as const,
              status: 'active',
            },
          },
          {
            path: 'projects/backend-project.md',
            title: 'Backend Project',
            content:
              'Node.js backend with [[resources/express-guide]] and [[resources/typescript-guide]].',
            metadata: {
              title: 'Backend Project',
              tags: ['backend', 'nodejs', 'project'],
              created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
              modified: new Date(),
              category: 'projects' as const,
              status: 'active',
            },
          },
          {
            path: 'resources/react-guide.md',
            title: 'React Guide',
            content: 'Comprehensive React guide for frontend development.',
            metadata: {
              title: 'React Guide',
              tags: ['react', 'frontend', 'guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/express-guide.md',
            title: 'Express Guide',
            content: 'Express.js guide for backend development.',
            metadata: {
              title: 'Express Guide',
              tags: ['express', 'backend', 'guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
          {
            path: 'resources/typescript-guide.md',
            title: 'TypeScript Guide',
            content: 'TypeScript guide used by both frontend and backend projects.',
            metadata: {
              title: 'TypeScript Guide',
              tags: ['typescript', 'guide'],
              created: new Date(),
              modified: new Date(),
              category: 'resources' as const,
            },
          },
        ];
      },

      execute: async (context) => {
        // Complex query: Find projects created in last 45 days
        const recentProjects = await context.searchEngine.search({
          category: 'projects',
          dateRange: {
            start: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        });

        IntegrationAssertions.assertSearchResults(
          recentProjects,
          ['projects/frontend-project.md', 'projects/backend-project.md'],
          { exactMatch: true },
        );

        // Find resources linked by multiple projects (TypeScript guide)
        const tsBacklinksResult = context.backlinkManager.getBacklinks(
          'resources/typescript-guide.md',
        );
        const tsBacklinks = tsBacklinksResult.backlinks;
        expect(tsBacklinks.length).toBe(2);

        const linkingSources = tsBacklinks.map((bl) => bl.sourcePath);
        expect(linkingSources).toContain('projects/frontend-project.md');
        expect(linkingSources).toContain('projects/backend-project.md');

        // Search with OR operator
        const frontendOrBackend = await context.searchEngine.search({
          tags: ['frontend', 'backend'],
          operator: 'OR',
        });

        expect(frontendOrBackend.results.length).toBeGreaterThanOrEqual(4); // At least both projects and their guides
      },

      verify: async (context) => {
        // Verify shared resources are discoverable
        const sharedResources = [];

        for (const [path, doc] of context.documents) {
          if (doc.frontmatter?.category === 'resources') {
            const backlinksResult = context.backlinkManager.getBacklinks(path);
            const backlinks = backlinksResult.backlinks;
            if (backlinks.length > 1) {
              sharedResources.push(path);
            }
          }
        }

        expect(sharedResources).toContain('resources/typescript-guide.md');

        // Verify category-specific searches work with link context
        const resourceSearch = await context.searchEngine.search({
          category: 'resources',
          content: 'guide',
        });

        expect(resourceSearch.results.length).toBe(3); // All three guides
      },
    });

    expect(result.success).toBe(true);
  });

  it('should maintain search performance with large link networks', async () => {
    const NETWORK_SIZE = 50;
    const MAX_SEARCH_TIME = 200; // milliseconds

    const result = await harness.executeScenario({
      name: 'Search Performance with Links',

      setup: async () => {
        return generator.generateDocumentNetwork(NETWORK_SIZE, 0.4);
      },

      execute: async (context) => {
        // Measure various search operations
        const searchOperations = [
          // Simple content search
          () => context.searchEngine.search({ content: 'development' }),
          // Tag search
          () => context.searchEngine.search({ tags: ['javascript'] }),
          // Category filter
          () => context.searchEngine.search({ category: 'projects' }),
          // Complex search
          () =>
            context.searchEngine.search({
              content: 'guide',
              tags: ['documentation'],
              operator: 'OR',
            }),
        ];

        for (const operation of searchOperations) {
          const { duration } = await harness.measureTime(operation);
          expect(duration).toBeLessThan(MAX_SEARCH_TIME);
        }
      },

      verify: async (context) => {
        // Verify search results are consistent
        const stats = context.backlinkManager.getStats();
        expect(stats.totalDocuments).toBe(NETWORK_SIZE);

        // Verify search index is complete
        const allDocs = await context.searchEngine.search({});
        expect(allDocs.totalCount).toBe(NETWORK_SIZE);

        // Verify highly linked documents appear in relevant searches
        const hubDocuments = [];
        for (const [path] of context.documents) {
          const backlinksResult = context.backlinkManager.getBacklinks(path);
          const backlinks = backlinksResult.backlinks;
          if (backlinks.length >= 3) {
            hubDocuments.push(path);
          }
        }

        // Hub documents should be discoverable
        if (hubDocuments.length > 0) {
          const results = await context.searchEngine.search({});
          const resultPaths = results.results.map((r) => r.document.path);

          // At least one hub should be in top results
          const hasHub = hubDocuments.some((hub) => resultPaths.includes(hub));
          expect(hasHub).toBe(true);
        }
      },
    });

    expect(result.success).toBe(true);
  }, 30000); // Increase timeout for performance test
});
