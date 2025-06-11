import { GraphAnalyzer } from '../GraphAnalyzer.js';
import { GraphAlgorithms } from '../algorithms/index.js';
import { Graph, GraphNode } from '../types.js';
import { PARACategory } from '../../para/types.js';

describe('GraphAnalyzer', () => {
  let algorithms: GraphAlgorithms;
  let analyzer: GraphAnalyzer;

  beforeEach(() => {
    algorithms = new GraphAlgorithms();
    analyzer = new GraphAnalyzer(algorithms);
  });

  // Helper to create a rich test graph
  function createRichTestGraph(): Graph {
    const graph: Graph = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      reverseAdjacencyList: new Map(),
    };

    // Create a more complex graph structure
    const nodeData = [
      { id: 'hub', title: 'Central Hub', tags: ['important', 'core'] },
      { id: 'A', title: 'Node A', tags: ['web', 'frontend'] },
      { id: 'B', title: 'Node B', tags: ['web', 'backend'] },
      { id: 'C', title: 'Node C', tags: ['backend', 'api'] },
      { id: 'D', title: 'Node D', tags: ['frontend', 'ui'] },
      { id: 'E', title: 'Node E', tags: ['documentation'] },
      { id: 'orphan', title: 'Orphan Node', tags: ['isolated'] },
      { id: 'bridge', title: 'Bridge Node', tags: ['connector'] },
      { id: 'cluster1', title: 'Cluster 1', tags: ['group1'] },
      { id: 'cluster2', title: 'Cluster 2', tags: ['group1'] },
    ];

    // Create nodes
    for (const data of nodeData) {
      const node: GraphNode = {
        id: data.id,
        title: data.title,
        category: PARACategory.Resources,
        metadata: { title: data.title, tags: data.tags },
        tags: data.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      graph.nodes.set(data.id, node);
      graph.adjacencyList.set(data.id, new Set());
      graph.reverseAdjacencyList.set(data.id, new Set());
    }

    // Create edges to form interesting structure
    const edges = [
      // Hub connects to many nodes
      ['hub', 'A'], ['hub', 'B'], ['hub', 'C'], ['hub', 'D'],
      // A and B form a small cluster
      ['A', 'B'], ['B', 'A'],
      // C and D are connected through bridge
      ['C', 'bridge'], ['bridge', 'D'],
      // E is weakly connected
      ['E', 'hub'],
      // Cluster nodes
      ['cluster1', 'cluster2'], ['cluster2', 'cluster1'],
    ];

    for (const [source, target] of edges) {
      if (typeof source === 'string' && typeof target === 'string') {
        const sourceAdjacency = graph.adjacencyList.get(source);
        const targetReverse = graph.reverseAdjacencyList.get(target);
        
        if (sourceAdjacency && targetReverse) {
          sourceAdjacency.add(target);
          targetReverse.add(source);
        }
      }
    }

    return graph;
  }

  describe('analyzeGraph', () => {
    it('should perform comprehensive graph analysis', () => {
      const graph = createRichTestGraph();
      const analysis = analyzer.analyzeGraph(graph);

      expect(analysis.stats).toBeDefined();
      expect(analysis.centralNodes).toBeDefined();
      expect(analysis.clusters).toBeDefined();
      expect(analysis.orphanNodes).toBeDefined();
      expect(analysis.hubNodes).toBeDefined();
      expect(analysis.bridgeNodes).toBeDefined();
    });

    it('should calculate correct statistics', () => {
      const graph = createRichTestGraph();
      const analysis = analyzer.analyzeGraph(graph);

      expect(analysis.stats.nodeCount).toBe(10);
      expect(analysis.stats.avgDegree).toBeGreaterThan(0);
      expect(analysis.stats.density).toBeGreaterThan(0);
      expect(analysis.stats.density).toBeLessThan(1);
    });

    it('should identify orphan nodes', () => {
      const graph = createRichTestGraph();
      const analysis = analyzer.analyzeGraph(graph);

      expect(analysis.orphanNodes.length).toBe(1);
      expect(analysis.orphanNodes[0]?.id).toBe('orphan');
    });

    it('should identify hub nodes', () => {
      const graph = createRichTestGraph();
      const analysis = analyzer.analyzeGraph(graph);

      expect(analysis.hubNodes.length).toBeGreaterThan(0);
      const hubIds = analysis.hubNodes.map(n => n.id);
      expect(hubIds).toContain('hub'); // Central hub should be identified
    });

    it('should identify central nodes by different metrics', () => {
      const graph = createRichTestGraph();
      const analysis = analyzer.analyzeGraph(graph);

      // Hub should be central by degree
      const degreeIds = analysis.centralNodes.byDegree.map(n => n.id);
      expect(degreeIds[0]).toBe('hub');

      // All centrality lists should be populated
      expect(analysis.centralNodes.byBetweenness.length).toBeGreaterThan(0);
      expect(analysis.centralNodes.byPageRank.length).toBeGreaterThan(0);
    });

    it('should identify clusters', () => {
      const graph = createRichTestGraph();
      const analysis = analyzer.analyzeGraph(graph);

      expect(analysis.clusters.size).toBeGreaterThan(0);
      
      // Cluster1 and cluster2 should be in the same cluster
      const cluster1Label = analysis.clusters.get('cluster1');
      const cluster2Label = analysis.clusters.get('cluster2');
      expect(cluster1Label).toBe(cluster2Label);
    });
  });

  describe('findInfluencers', () => {
    it('should find influential nodes', () => {
      const graph = createRichTestGraph();
      const influencers = analyzer.findInfluencers(graph, 3);

      expect(influencers.length).toBeLessThanOrEqual(3);
      expect(influencers[0]?.id).toBe('hub'); // Hub should be most influential
    });
  });

  describe('findRelatedDocuments', () => {
    it('should find documents related to a given document', () => {
      const graph = createRichTestGraph();
      const related = analyzer.findRelatedDocuments(graph, 'A', 5);

      expect(related.length).toBeGreaterThan(0);
      
      // B should be highly related to A (bidirectional link)
      const relatedIds = related.map(n => n.id);
      expect(relatedIds[0]).toBe('B');
      
      // Hub should also be related (direct link)
      expect(relatedIds).toContain('hub');
    });

    it('should return empty array for non-existent document', () => {
      const graph = createRichTestGraph();
      const related = analyzer.findRelatedDocuments(graph, 'nonexistent', 5);

      expect(related).toEqual([]);
    });

    it('should include two-hop neighbors with lower score', () => {
      const graph = createRichTestGraph();
      const related = analyzer.findRelatedDocuments(graph, 'C', 10);

      const relatedIds = related.map(n => n.id);
      // Bridge is directly connected
      expect(relatedIds).toContain('bridge');
      // D is two hops away (through bridge)
      expect(relatedIds).toContain('D');
      
      // Bridge should come before D in the results
      const bridgeIndex = relatedIds.indexOf('bridge');
      const dIndex = relatedIds.indexOf('D');
      expect(bridgeIndex).toBeLessThan(dIndex);
    });
  });

  describe('suggestConnections', () => {
    it('should suggest connections based on common neighbors', () => {
      const graph = createRichTestGraph();
      const suggestions = analyzer.suggestConnections(graph, 10);

      expect(suggestions.length).toBeGreaterThan(0);
      
      // A and C both connect to hub, so they might be suggested
      const acSuggestion = suggestions.find(s =>
        (s.from === 'A' && s.to === 'C') ||
        (s.from === 'C' && s.to === 'A')
      );
      
      if (acSuggestion) {
        expect(acSuggestion.reason).toContain('common connections');
        expect(acSuggestion.confidence).toBeGreaterThan(0);
      }
    });

    it('should suggest connections based on similar tags', () => {
      const graph = createRichTestGraph();
      const suggestions = analyzer.suggestConnections(graph, 20);

      // A and B both have 'web' tag
      const tagSuggestion = suggestions.find(s =>
        s.reason.includes('Similar tags') &&
        s.reason.includes('web')
      );

      expect(tagSuggestion).toBeDefined();
    });

    it('should not suggest existing connections', () => {
      const graph = createRichTestGraph();
      const suggestions = analyzer.suggestConnections(graph, 50);

      // Should not suggest A->B since it already exists
      const existingConnection = suggestions.find(s =>
        s.from === 'A' && s.to === 'B'
      );

      expect(existingConnection).toBeUndefined();
    });

    it('should rank suggestions by confidence', () => {
      const graph = createRichTestGraph();
      const suggestions = analyzer.suggestConnections(graph, 10);

      if (suggestions.length > 1) {
        for (let i = 1; i < suggestions.length; i++) {
          expect(suggestions[i - 1]?.confidence).toBeGreaterThanOrEqual(
            suggestions[i]?.confidence || 0
          );
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty graph', () => {
      const emptyGraph: Graph = {
        nodes: new Map(),
        edges: new Map(),
        adjacencyList: new Map(),
        reverseAdjacencyList: new Map(),
      };

      const analysis = analyzer.analyzeGraph(emptyGraph);
      expect(analysis.stats.nodeCount).toBe(0);
      expect(analysis.stats.edgeCount).toBe(0);
      expect(analysis.stats.density).toBe(0);
      expect(analysis.orphanNodes).toEqual([]);
    });

    it('should handle single node graph', () => {
      const singleNodeGraph: Graph = {
        nodes: new Map([['A', {
          id: 'A',
          title: 'Single Node',
          category: PARACategory.Resources,
          metadata: { title: 'Single Node' },
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }]]),
        edges: new Map(),
        adjacencyList: new Map([['A', new Set()]]),
        reverseAdjacencyList: new Map([['A', new Set()]]),
      };

      const analysis = analyzer.analyzeGraph(singleNodeGraph);
      expect(analysis.stats.nodeCount).toBe(1);
      expect(analysis.orphanNodes.length).toBe(1);
    });
  });
});