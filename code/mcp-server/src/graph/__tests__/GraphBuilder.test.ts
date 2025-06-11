import { GraphBuilder } from '../GraphBuilder.js';
import { MockFileSystem } from '../../filesystem/MockFileSystem.js';
import { LinkIndexer } from '../../links/LinkIndexer.js';
import { PARAManager } from '../../para/PARAManager.js';
import { SearchEngine } from '../../search/SearchEngine.js';
import { PARACategory } from '../../para/types.js';

describe('GraphBuilder', () => {
  let fileSystem: MockFileSystem;
  let linkIndexer: LinkIndexer;
  let paraManager: PARAManager;
  let searchEngine: SearchEngine;
  let graphBuilder: GraphBuilder;
  const contextRoot = '/test-root';

  beforeEach(async () => {
    fileSystem = new MockFileSystem(contextRoot);
    paraManager = new PARAManager(contextRoot, fileSystem);
    linkIndexer = new LinkIndexer(contextRoot, fileSystem);
    searchEngine = new SearchEngine(fileSystem as any, paraManager, contextRoot);
    graphBuilder = new GraphBuilder(linkIndexer, searchEngine);

    // Initialize PARA structure
    await paraManager.initializeStructure();

    // Create test documents
    const docs: Array<{ path: string; content: string; metadata: any }> = [
      {
        path: '/test-root/projects/project1.md',
        content: 'Project 1 content [[projects/project2]] [[areas/area1]]',
        metadata: {
          title: 'Project 1',
          tags: ['web', 'frontend'],
          created: '2024-01-01',
          updated: '2024-01-15',
        },
      },
      {
        path: '/test-root/projects/project2.md',
        content: 'Project 2 content [[projects/project1]] [[resources/resource1]]',
        metadata: {
          title: 'Project 2',
          tags: ['backend', 'api'],
          created: '2024-01-02',
          updated: '2024-01-16',
        },
      },
      {
        path: '/test-root/areas/area1.md',
        content: 'Area 1 content [[resources/resource1]]',
        metadata: {
          title: 'Area 1',
          tags: ['web', 'design'],
          created: '2024-01-03',
          updated: '2024-01-17',
        },
      },
      {
        path: '/test-root/resources/resource1.md',
        content: 'Resource 1 content',
        metadata: {
          title: 'Resource 1',
          tags: ['web', 'documentation'],
          created: '2024-01-04',
          updated: '2024-01-18',
        },
      },
      {
        path: '/test-root/archives/archive1.md',
        content: 'Archive 1 content (orphan)',
        metadata: {
          title: 'Archive 1',
          tags: ['old'],
          created: '2024-01-05',
          updated: '2024-01-19',
        },
      },
    ];

    // Write documents
    for (const doc of docs) {
      // Write frontmatter and content
      const frontmatter = `---\n${Object.entries(doc.metadata)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`)
        .join('\n')}\n---\n\n`;
      await fileSystem.writeFile(doc.path, frontmatter + doc.content);
    }
    
    // Initialize search engine and link indexer
    await searchEngine.initialize();
    await linkIndexer.buildIndex();
  });

  describe('buildGraph', () => {
    it('should build a complete graph from all documents', async () => {
      const graph = await graphBuilder.buildGraph();

      expect(graph.nodes.size).toBe(5);
      expect(graph.edges.size).toBe(4); // 4 wiki-link edges

      // Check nodes
      expect(graph.nodes.has('/test-root/projects/project1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/archives/archive1.md')).toBe(true);

      // Check edges
      const project1Neighbors = graph.adjacencyList.get('/test-root/projects/project1.md');
      expect(project1Neighbors).toBeDefined();
      expect(project1Neighbors?.has('/test-root/projects/project2.md')).toBe(true);
      expect(project1Neighbors?.has('/test-root/areas/area1.md')).toBe(true);

      // Check reverse edges
      const project2Incoming = graph.reverseAdjacencyList.get('/test-root/projects/project2.md');
      expect(project2Incoming?.has('/test-root/projects/project1.md')).toBe(true);
    });

    it('should include tag relations when requested', async () => {
      const graph = await graphBuilder.buildGraph({
        includeTagRelations: true,
        minTagOverlap: 1,
      });

      // Should have wiki-link edges + tag relation edges
      expect(graph.edges.size).toBeGreaterThan(4);

      // Check for tag relation between project1 and area1 (both have 'web' tag)
      const tagEdges = Array.from(graph.edges.values()).filter(e => e.type === 'tag-relation');
      expect(tagEdges.length).toBeGreaterThan(0);

      const webRelation = tagEdges.find(e => 
        (e.source.includes('project1') && e.target.includes('area1')) ||
        (e.source.includes('area1') && e.target.includes('project1'))
      );
      expect(webRelation).toBeDefined();
    });

    it('should include category relations when requested', async () => {
      const graph = await graphBuilder.buildGraph({
        includeCategoryRelations: true,
      });

      // Check for category relation between project1 and project2
      const categoryEdges = Array.from(graph.edges.values()).filter(e => e.type === 'category-relation');
      expect(categoryEdges.length).toBeGreaterThan(0);

      const projectRelation = categoryEdges.find(e =>
        e.source.includes('project1') && e.target.includes('project2')
      );
      expect(projectRelation).toBeDefined();
    });
  });

  describe('buildFromCategory', () => {
    it('should build a graph from documents in a specific category', async () => {
      const graph = await graphBuilder.buildFromCategory(PARACategory.Projects);

      expect(graph.nodes.size).toBe(2); // Only project1 and project2
      expect(graph.nodes.has('/test-root/projects/project1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/projects/project2.md')).toBe(true);
      expect(graph.nodes.has('/test-root/areas/area1.md')).toBe(false);
    });
  });

  describe('buildFromTags', () => {
    it('should build a graph from documents with specific tags', async () => {
      const graph = await graphBuilder.buildFromTags(['web']);

      expect(graph.nodes.size).toBe(3); // project1, area1, resource1
      expect(graph.nodes.has('/test-root/projects/project1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/areas/area1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/resources/resource1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/projects/project2.md')).toBe(false);
    });
  });

  describe('buildSubgraph', () => {
    it('should build a subgraph with depth limit', async () => {
      const graph = await graphBuilder.buildSubgraph(
        ['/test-root/projects/project1.md'],
        1
      );

      // Depth 1: project1 and its direct neighbors (project2, area1)
      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.has('/test-root/projects/project1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/projects/project2.md')).toBe(true);
      expect(graph.nodes.has('/test-root/areas/area1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/resources/resource1.md')).toBe(false);
    });

    it('should build a larger subgraph with depth 2', async () => {
      const graph = await graphBuilder.buildSubgraph(
        ['/test-root/projects/project1.md'],
        2
      );

      // Depth 2: Should include resource1 (linked from project2 and area1)
      expect(graph.nodes.size).toBe(4);
      expect(graph.nodes.has('/test-root/resources/resource1.md')).toBe(true);
    });

    it('should handle multiple root paths', async () => {
      const graph = await graphBuilder.buildSubgraph(
        ['/test-root/projects/project1.md', '/test-root/archives/archive1.md'],
        1
      );

      // Should include both roots and project1's neighbors
      expect(graph.nodes.has('/test-root/projects/project1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/archives/archive1.md')).toBe(true);
      expect(graph.nodes.has('/test-root/projects/project2.md')).toBe(true);
    });
  });

  describe('node creation', () => {
    it('should create nodes with correct metadata', async () => {
      const graph = await graphBuilder.buildGraph();
      
      const project1Node = graph.nodes.get('/test-root/projects/project1.md');
      expect(project1Node).toBeDefined();
      expect(project1Node?.title).toBe('Project 1');
      expect(project1Node?.category).toBe(PARACategory.Projects);
      expect(project1Node?.tags).toEqual(['web', 'frontend']);
      expect(project1Node?.metadata.created).toBe('2024-01-01');
    });
  });

  describe('edge creation', () => {
    it('should create edges with correct metadata', async () => {
      const graph = await graphBuilder.buildGraph();
      
      const edges = Array.from(graph.edges.values());
      const project1ToProject2 = edges.find(e =>
        e.source === '/test-root/projects/project1.md' &&
        e.target === '/test-root/projects/project2.md'
      );

      expect(project1ToProject2).toBeDefined();
      expect(project1ToProject2?.type).toBe('wiki-link');
      expect(project1ToProject2?.weight).toBe(1);
    });
  });

  describe('cyclic graphs', () => {
    it('should handle cyclic references correctly', async () => {
      const graph = await graphBuilder.buildGraph();
      
      // project1 -> project2 and project2 -> project1 form a cycle
      const project1Neighbors = graph.adjacencyList.get('/test-root/projects/project1.md');
      const project2Neighbors = graph.adjacencyList.get('/test-root/projects/project2.md');
      
      expect(project1Neighbors?.has('/test-root/projects/project2.md')).toBe(true);
      expect(project2Neighbors?.has('/test-root/projects/project1.md')).toBe(true);
    });
  });

  describe('orphan nodes', () => {
    it('should include orphan nodes in the graph', async () => {
      const graph = await graphBuilder.buildGraph();
      
      const archiveNode = graph.nodes.get('/test-root/archives/archive1.md');
      expect(archiveNode).toBeDefined();
      
      const archiveOutgoing = graph.adjacencyList.get('/test-root/archives/archive1.md');
      const archiveIncoming = graph.reverseAdjacencyList.get('/test-root/archives/archive1.md');
      
      expect(archiveOutgoing?.size).toBe(0);
      expect(archiveIncoming?.size).toBe(0);
    });
  });
});