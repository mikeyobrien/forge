import { GraphAlgorithms } from '../algorithms/index.js';
import { Graph, GraphNode, GraphEdge } from '../types.js';
import { PARACategory } from '../../para/types.js';

describe('GraphAlgorithms', () => {
  let algorithms: GraphAlgorithms;
  let testGraph: Graph;

  beforeEach(() => {
    algorithms = new GraphAlgorithms();
    testGraph = createTestGraph();
  });

  // Helper function to create a test graph
  function createTestGraph(): Graph {
    const graph: Graph = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      reverseAdjacencyList: new Map(),
    };

    // Create nodes A, B, C, D, E (with A->B->C->D cycle and E as orphan)
    const nodes = ['A', 'B', 'C', 'D', 'E'];
    for (const id of nodes) {
      const node: GraphNode = {
        id,
        title: `Node ${id}`,
        category: PARACategory.Resources,
        metadata: { title: `Node ${id}` },
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      graph.nodes.set(id, node);
      graph.adjacencyList.set(id, new Set());
      graph.reverseAdjacencyList.set(id, new Set());
    }

    // Add edges: A->B, B->C, C->D, D->A (cycle), B->D (shortcut)
    const edges = [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'B', target: 'C', weight: 1 },
      { source: 'C', target: 'D', weight: 1 },
      { source: 'D', target: 'A', weight: 1 },
      { source: 'B', target: 'D', weight: 2 }, // Higher weight
    ];

    for (const { source, target, weight } of edges) {
      const edge: GraphEdge = {
        id: `${source}->${target}`,
        source,
        target,
        type: 'wiki-link',
        weight,
      };
      graph.edges.set(edge.id, edge);
      graph.adjacencyList.get(source)?.add(target);
      graph.reverseAdjacencyList.get(target)?.add(source);
    }

    return graph;
  }

  describe('traversal algorithms', () => {
    it('should perform depth-first search', () => {
      const visited: string[] = [];
      algorithms.depthFirstSearch(testGraph, 'A', (node) => {
        visited.push(node.id);
      });

      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).toContain('D');
      expect(visited.length).toBe(4); // E is not connected
    });

    it('should perform breadth-first search', () => {
      const visited: string[] = [];
      algorithms.breadthFirstSearch(testGraph, 'A', (node) => {
        visited.push(node.id);
      });

      expect(visited[0]).toBe('A'); // First visited
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).toContain('D');
      expect(visited.length).toBe(4);
    });

    it('should handle disconnected nodes', () => {
      const visited: string[] = [];
      algorithms.depthFirstSearch(testGraph, 'E', (node) => {
        visited.push(node.id);
      });

      expect(visited).toEqual(['E']); // Only E is visited
    });
  });

  describe('path finding', () => {
    it('should find shortest path', () => {
      const path = algorithms.shortestPath(testGraph, 'A', 'D');
      expect(path).toEqual(['A', 'B', 'D']); // Shortest path via B
    });

    it('should return null for unreachable nodes', () => {
      const path = algorithms.shortestPath(testGraph, 'A', 'E');
      expect(path).toBeNull();
    });

    it('should find all paths', () => {
      const paths = algorithms.allPaths(testGraph, 'A', 'D', 5);
      expect(paths.length).toBe(2);

      // Should find both A->B->D and A->B->C->D
      const pathStrings = paths.map((p) => p.join('->'));
      expect(pathStrings).toContain('A->B->D');
      expect(pathStrings).toContain('A->B->C->D');
    });

    it('should respect max length in path finding', () => {
      const paths = algorithms.allPaths(testGraph, 'A', 'D', 2);
      expect(paths.length).toBe(1); // Only A->B->D is within length 2
    });
  });

  describe('connectivity', () => {
    it('should find connected components', () => {
      const components = algorithms.findConnectedComponents(testGraph);
      expect(components.length).toBe(2); // Main component and E

      const componentSizes = components.map((c) => c.length).sort();
      expect(componentSizes).toEqual([1, 4]); // E alone, and A-B-C-D connected
    });

    it('should check reachability', () => {
      expect(algorithms.isReachable(testGraph, 'A', 'D')).toBe(true);
      expect(algorithms.isReachable(testGraph, 'A', 'E')).toBe(false);
      expect(algorithms.isReachable(testGraph, 'D', 'A')).toBe(true); // Cycle
    });
  });

  describe('cycle detection', () => {
    it('should detect cycles', () => {
      const cycles = algorithms.detectCycles(testGraph);
      expect(cycles.length).toBeGreaterThan(0);

      // Should find the A->B->C->D->A cycle
      const hasCycle = cycles.some(
        (cycle) =>
          cycle.length === 5 && // 4 nodes + repeated start
          cycle.includes('A') &&
          cycle.includes('B') &&
          cycle.includes('C') &&
          cycle.includes('D'),
      );
      expect(hasCycle).toBe(true);
    });

    it('should handle acyclic graphs', () => {
      // Create acyclic graph
      const acyclicGraph = createTestGraph();
      // Remove the D->A edge to break the cycle
      acyclicGraph.adjacencyList.get('D')?.delete('A');
      acyclicGraph.reverseAdjacencyList.get('A')?.delete('D');
      acyclicGraph.edges.delete('D->A');

      const cycles = algorithms.detectCycles(acyclicGraph);
      expect(cycles.length).toBe(0);
    });

    it('should perform topological sort on DAG', () => {
      // Create DAG
      const dag = createTestGraph();
      dag.adjacencyList.get('D')?.delete('A');
      dag.reverseAdjacencyList.get('A')?.delete('D');
      dag.edges.delete('D->A');

      const sorted = algorithms.topologicalSort(dag);
      expect(sorted).not.toBeNull();
      expect(sorted?.length).toBe(5);

      // A should come before B, B before C and D, C before D
      const indexA = sorted!.indexOf('A');
      const indexB = sorted!.indexOf('B');
      const indexC = sorted!.indexOf('C');
      const indexD = sorted!.indexOf('D');

      expect(indexA).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexC);
      expect(indexC).toBeLessThan(indexD);
    });

    it('should return null for topological sort on cyclic graph', () => {
      const sorted = algorithms.topologicalSort(testGraph);
      expect(sorted).toBeNull();
    });
  });

  describe('centrality metrics', () => {
    it('should calculate degree centrality', () => {
      const centrality = algorithms.degreeCentrality(testGraph);

      // B has highest degree (2 out, 1 in)
      const bCentrality = centrality.get('B');
      const eCentrality = centrality.get('E');

      expect(bCentrality).toBeGreaterThan(0);
      expect(eCentrality).toBe(0); // E has no connections
    });

    it('should calculate betweenness centrality', () => {
      const centrality = algorithms.betweennessCentrality(testGraph);

      // B should have high betweenness (on shortest paths)
      const bCentrality = centrality.get('B');
      expect(bCentrality).toBeGreaterThan(0);
    });

    it('should calculate PageRank', () => {
      const pagerank = algorithms.pageRank(testGraph, 10);

      // All connected nodes should have non-zero PageRank
      expect(pagerank.get('A')).toBeGreaterThan(0);
      expect(pagerank.get('B')).toBeGreaterThan(0);
      expect(pagerank.get('C')).toBeGreaterThan(0);
      expect(pagerank.get('D')).toBeGreaterThan(0);

      // Sum of PageRank should be approximately 1
      const sum = Array.from(pagerank.values()).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 1);
    });
  });

  describe('clustering', () => {
    it('should find clusters using label propagation', () => {
      // Create a graph with clear clusters
      const clusterGraph: Graph = {
        nodes: new Map(),
        edges: new Map(),
        adjacencyList: new Map(),
        reverseAdjacencyList: new Map(),
      };

      // Create two clusters: A-B-C and D-E-F
      const nodes = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (const id of nodes) {
        const node: GraphNode = {
          id,
          title: `Node ${id}`,
          category: PARACategory.Resources,
          metadata: { title: `Node ${id}` },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        clusterGraph.nodes.set(id, node);
        clusterGraph.adjacencyList.set(id, new Set());
        clusterGraph.reverseAdjacencyList.set(id, new Set());
      }

      // Add edges within clusters
      const clusterEdges = [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'], // Cluster 1
        ['D', 'E'],
        ['E', 'F'],
        ['F', 'D'], // Cluster 2
      ];

      for (const [source, target] of clusterEdges) {
        if (typeof source === 'string' && typeof target === 'string') {
          const sourceAdjacency = clusterGraph.adjacencyList.get(source);
          const targetAdjacency = clusterGraph.adjacencyList.get(target);
          const sourceReverse = clusterGraph.reverseAdjacencyList.get(source);
          const targetReverse = clusterGraph.reverseAdjacencyList.get(target);

          if (sourceAdjacency && targetAdjacency && sourceReverse && targetReverse) {
            sourceAdjacency.add(target);
            targetAdjacency.add(source);
            sourceReverse.add(target);
            targetReverse.add(source);
          }
        }
      }

      const clusters = algorithms.findClusters(clusterGraph);

      // Should identify two distinct clusters
      const uniqueClusters = new Set(clusters.values());
      expect(uniqueClusters.size).toBe(2);
    });

    it('should calculate clustering coefficient', () => {
      // Create a triangle graph for testing
      const triangleGraph: Graph = {
        nodes: new Map(),
        edges: new Map(),
        adjacencyList: new Map(),
        reverseAdjacencyList: new Map(),
      };

      // Create triangle A-B-C
      const nodes = ['A', 'B', 'C'];
      for (const id of nodes) {
        const node: GraphNode = {
          id,
          title: `Node ${id}`,
          category: PARACategory.Resources,
          metadata: { title: `Node ${id}` },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        triangleGraph.nodes.set(id, node);
        triangleGraph.adjacencyList.set(id, new Set());
        triangleGraph.reverseAdjacencyList.set(id, new Set());
      }

      // Add all edges to form a complete triangle
      triangleGraph.adjacencyList.get('A')?.add('B');
      triangleGraph.adjacencyList.get('A')?.add('C');
      triangleGraph.adjacencyList.get('B')?.add('A');
      triangleGraph.adjacencyList.get('B')?.add('C');
      triangleGraph.adjacencyList.get('C')?.add('A');
      triangleGraph.adjacencyList.get('C')?.add('B');

      const coefficient = algorithms.clusteringCoefficient(triangleGraph, 'A');
      expect(coefficient).toBe(1); // Perfect triangle

      const globalCoefficient = algorithms.clusteringCoefficient(triangleGraph);
      expect(globalCoefficient).toBe(1); // All nodes form perfect triangles
    });
  });
});
