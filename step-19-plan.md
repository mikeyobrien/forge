# Step 19: Knowledge Graph Builder - Implementation Plan

## Overview

Implement a Knowledge Graph Builder that creates a typed graph data structure from the document link indexes. This will provide a foundation for graph analysis and visualization features.

## Requirements Summary

1. Create typed graph data structure with nodes (documents) and edges (wiki-links)
2. Build from existing link indexes with full TypeScript type safety
3. Add typed metadata to both nodes and edges
4. Implement graph algorithms (traversal, shortest path, cycle detection)
5. Scope all operations to CONTEXT_ROOT documents
6. Handle cyclic graphs gracefully

## Implementation Plan

### 1. Core Graph Types and Interfaces

```typescript
// src/graph/types.ts
interface GraphNode {
  id: string;                    // Document path
  title: string;
  category: PARACategory;
  metadata: DocumentMetadata;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface GraphEdge {
  id: string;                    // Unique edge ID
  source: string;                // Source document path
  target: string;                // Target document path
  type: 'wiki-link' | 'tag-relation' | 'category-relation';
  weight: number;                // For weighted algorithms
  metadata?: {
    anchorText?: string;         // Display text from wiki-link
    anchor?: string;             // Anchor fragment
    context?: string;            // Surrounding text snippet
  };
}

interface Graph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  adjacencyList: Map<string, Set<string>>;
  reverseAdjacencyList: Map<string, Set<string>>;
}

interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  density: number;
  avgDegree: number;
  connectedComponents: number;
  hasCycles: boolean;
}
```

### 2. GraphBuilder Class

```typescript
// src/graph/GraphBuilder.ts
class GraphBuilder {
  private fileSystem: IFileSystem;
  private linkIndexer: LinkIndexer;
  private paraManager: PARAManager;
  private searchEngine: SearchEngine;
  
  async buildGraph(options?: GraphBuildOptions): Promise<Graph>;
  async buildFromCategory(category: PARACategory): Promise<Graph>;
  async buildFromTags(tags: string[]): Promise<Graph>;
  async buildSubgraph(rootPaths: string[], depth: number): Promise<Graph>;
  
  private createNode(doc: Document): GraphNode;
  private createEdge(from: string, to: string, link: WikiLink): GraphEdge;
  private addTagRelations(graph: Graph): void;
  private addCategoryRelations(graph: Graph): void;
}
```

### 3. Graph Algorithms

```typescript
// src/graph/algorithms/index.ts
class GraphAlgorithms {
  // Traversal
  depthFirstSearch(graph: Graph, start: string, visitor: (node: GraphNode) => void): void;
  breadthFirstSearch(graph: Graph, start: string, visitor: (node: GraphNode) => void): void;
  
  // Path finding
  shortestPath(graph: Graph, start: string, end: string): string[] | null;
  allPaths(graph: Graph, start: string, end: string, maxLength?: number): string[][];
  
  // Connectivity
  findConnectedComponents(graph: Graph): GraphNode[][];
  isReachable(graph: Graph, start: string, end: string): boolean;
  
  // Cycle detection
  detectCycles(graph: Graph): string[][];
  topologicalSort(graph: Graph): string[] | null;
  
  // Centrality metrics
  degreeCentrality(graph: Graph): Map<string, number>;
  betweennessCentrality(graph: Graph): Map<string, number>;
  pageRank(graph: Graph, iterations?: number): Map<string, number>;
  
  // Clustering
  findClusters(graph: Graph, method: 'louvain' | 'label-propagation'): Map<string, number>;
  clusteringCoefficient(graph: Graph, node?: string): number;
}
```

### 4. Graph Analysis Features

```typescript
// src/graph/GraphAnalyzer.ts
class GraphAnalyzer {
  constructor(private algorithms: GraphAlgorithms) {}
  
  analyzeGraph(graph: Graph): GraphAnalysis {
    return {
      stats: this.calculateStats(graph),
      centralNodes: this.findCentralNodes(graph),
      clusters: this.identifyClusters(graph),
      orphanNodes: this.findOrphanNodes(graph),
      hubNodes: this.findHubNodes(graph),
      bridgeNodes: this.findBridgeNodes(graph),
    };
  }
  
  findInfluencers(graph: Graph, limit: number): GraphNode[];
  findRelatedDocuments(graph: Graph, docPath: string, limit: number): GraphNode[];
  suggestConnections(graph: Graph): Array<{from: string, to: string, reason: string}>;
}
```

### 5. Testing Strategy

1. **Unit Tests**
   - Test graph construction with various document sets
   - Test each algorithm with known graph structures
   - Test cycle detection with cyclic and acyclic graphs
   - Test edge cases (empty graph, single node, disconnected components)

2. **Integration Tests**
   - Test building graphs from actual document structures
   - Test integration with LinkIndexer and SearchEngine
   - Test performance with large document sets

3. **Algorithm Correctness Tests**
   - Verify shortest path algorithms with known solutions
   - Test topological sort with DAGs
   - Verify centrality calculations with small test graphs

### 6. Implementation Steps

1. **Create graph type definitions** (`src/graph/types.ts`)
2. **Implement GraphBuilder** (`src/graph/GraphBuilder.ts`)
   - Start with basic node/edge creation
   - Add document-to-graph conversion
   - Implement various build methods
3. **Implement core algorithms** (`src/graph/algorithms/`)
   - Start with basic traversal (DFS, BFS)
   - Add shortest path (Dijkstra's algorithm)
   - Implement cycle detection
   - Add centrality metrics
4. **Create GraphAnalyzer** (`src/graph/GraphAnalyzer.ts`)
   - Implement graph statistics calculation
   - Add node classification methods
   - Create relationship suggestion algorithm
5. **Write comprehensive tests**
   - Unit tests for each component
   - Integration tests with real data
   - Performance benchmarks

### 7. Performance Considerations

1. **Lazy Loading**: Build graph incrementally as needed
2. **Caching**: Cache computed metrics (centrality, clusters)
3. **Memory Efficiency**: Use adjacency lists for sparse graphs
4. **Parallel Processing**: Use worker threads for expensive computations

### 8. Security Considerations

1. All paths must be validated against CONTEXT_ROOT
2. Prevent graph operations from accessing files outside the allowed directory
3. Limit graph size to prevent memory exhaustion
4. Add timeouts for expensive algorithms

### 9. Future Extensions

1. **Visualization Support**: Prepare data structures for graph visualization tools
2. **Graph Queries**: Add a query language for graph traversal
3. **Real-time Updates**: Support incremental graph updates as documents change
4. **Export Formats**: Prepare for various export formats (GraphML, JSON, DOT)

## Success Criteria

1. All graph operations are type-safe with no `any` types
2. Graph builder correctly represents document relationships
3. Algorithms handle cyclic graphs without infinite loops
4. All operations respect CONTEXT_ROOT boundaries
5. Comprehensive test coverage (>90%)
6. Performance benchmarks show acceptable speed for 1000+ documents

## Dependencies

- Existing components: LinkIndexer, SearchEngine, PARAManager, FileSystem
- No external graph libraries - implement from scratch
- Use only TypeScript standard library and existing project dependencies

## Estimated Effort

- Core implementation: 4-6 hours
- Algorithm implementation: 3-4 hours
- Testing: 2-3 hours
- Total: 9-13 hours