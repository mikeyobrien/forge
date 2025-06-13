// ABOUTME: Collection of graph algorithms for knowledge graph analysis
// ABOUTME: Includes traversal, pathfinding, centrality, and clustering algorithms

import { Graph, GraphNode, ClusteringMethod } from '../types.js';

/**
 * Collection of graph algorithms
 */
export class GraphAlgorithms {
  /**
   * Depth-first search traversal
   */
  depthFirstSearch(graph: Graph, start: string, visitor: (node: GraphNode) => void): void {
    const visited = new Set<string>();
    const stack = [start];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);
      const node = graph.nodes.get(current);
      if (node) {
        visitor(node);

        // Add unvisited neighbors to stack
        const neighbors = graph.adjacencyList.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }
  }

  /**
   * Breadth-first search traversal
   */
  breadthFirstSearch(graph: Graph, start: string, visitor: (node: GraphNode) => void): void {
    const visited = new Set<string>();
    const queue = [start];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);
      const node = graph.nodes.get(current);
      if (node) {
        visitor(node);

        // Add unvisited neighbors to queue
        const neighbors = graph.adjacencyList.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }
  }

  /**
   * Find shortest path between two nodes using Dijkstra's algorithm
   */
  shortestPath(graph: Graph, start: string, end: string): string[] | null {
    if (!graph.nodes.has(start) || !graph.nodes.has(end)) {
      return null;
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>(graph.nodes.keys());

    // Initialize distances
    for (const node of graph.nodes.keys()) {
      distances.set(node, node === start ? 0 : Infinity);
      previous.set(node, null);
    }

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current: string | null = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        const distance = distances.get(node)!;
        if (distance < minDistance) {
          current = node;
          minDistance = distance;
        }
      }

      if (current === null || minDistance === Infinity) {
        break;
      }

      if (current === end) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | null = end;

        while (node !== null) {
          path.unshift(node);
          node = previous.get(node) || null;
        }

        return path;
      }

      unvisited.delete(current);

      // Update distances to neighbors
      const neighbors = graph.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (unvisited.has(neighbor)) {
          const edge = Array.from(graph.edges.values()).find(
            (e) => e.source === current && e.target === neighbor,
          );
          const weight = edge?.weight || 1;
          const alt = distances.get(current)! + weight;

          if (alt < distances.get(neighbor)!) {
            distances.set(neighbor, alt);
            previous.set(neighbor, current);
          }
        }
      }
    }

    return null;
  }

  /**
   * Find all paths between two nodes up to a maximum length
   */
  allPaths(graph: Graph, start: string, end: string, maxLength: number = 10): string[][] {
    const paths: string[][] = [];
    const currentPath: string[] = [start];
    const visited = new Set<string>([start]);

    const dfs = (current: string, depth: number) => {
      if (depth > maxLength) {
        return;
      }

      if (current === end) {
        paths.push([...currentPath]);
        return;
      }

      const neighbors = graph.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          currentPath.push(neighbor);
          dfs(neighbor, depth + 1);
          currentPath.pop();
          visited.delete(neighbor);
        }
      }
    };

    dfs(start, 0);
    return paths;
  }

  /**
   * Find all connected components in the graph
   */
  findConnectedComponents(graph: Graph): GraphNode[][] {
    const visited = new Set<string>();
    const components: GraphNode[][] = [];

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const component: GraphNode[] = [];

        this.depthFirstSearch(graph, nodeId, (node) => {
          visited.add(node.id);
          component.push(node);
        });

        components.push(component);
      }
    }

    return components;
  }

  /**
   * Check if one node is reachable from another
   */
  isReachable(graph: Graph, start: string, end: string): boolean {
    if (!graph.nodes.has(start) || !graph.nodes.has(end)) {
      return false;
    }

    let found = false;
    this.breadthFirstSearch(graph, start, (node) => {
      if (node.id === end) {
        found = true;
      }
    });

    return found;
  }

  /**
   * Detect all cycles in the graph using DFS
   */
  detectCycles(graph: Graph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.adjacencyList.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart).concat(neighbor));
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const node of graph.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Perform topological sort (returns null if graph has cycles)
   */
  topologicalSort(graph: Graph): string[] | null {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Calculate in-degrees
    for (const node of graph.nodes.keys()) {
      inDegree.set(node, 0);
    }

    for (const edges of graph.adjacencyList.values()) {
      for (const target of edges) {
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    }

    // Find nodes with no incoming edges
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = graph.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If all nodes are included, the sort was successful
    return result.length === graph.nodes.size ? result : null;
  }

  /**
   * Calculate degree centrality for all nodes
   */
  degreeCentrality(graph: Graph): Map<string, number> {
    const centrality = new Map<string, number>();
    const nodeCount = graph.nodes.size;

    for (const nodeId of graph.nodes.keys()) {
      const outDegree = graph.adjacencyList.get(nodeId)?.size || 0;
      const inDegree = graph.reverseAdjacencyList.get(nodeId)?.size || 0;
      const totalDegree = outDegree + inDegree;

      // Normalize by maximum possible degree
      centrality.set(nodeId, totalDegree / (2 * (nodeCount - 1)));
    }

    return centrality;
  }

  /**
   * Calculate betweenness centrality (simplified version)
   */
  betweennessCentrality(graph: Graph): Map<string, number> {
    const centrality = new Map<string, number>();

    // Initialize all centralities to 0
    for (const node of graph.nodes.keys()) {
      centrality.set(node, 0);
    }

    // For each pair of nodes, find shortest paths and update centrality
    const nodes = Array.from(graph.nodes.keys());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sourcePath = nodes[i];
        const targetPath = nodes[j];
        if (sourcePath && targetPath) {
          const path = this.shortestPath(graph, sourcePath, targetPath);

          if (path && path.length > 2) {
            // Increment centrality for intermediate nodes
            for (let k = 1; k < path.length - 1; k++) {
              const node = path[k];
              if (node) {
                centrality.set(node, (centrality.get(node) || 0) + 1);
              }
            }
          }
        }
      }
    }

    // Normalize
    const maxPossible = ((nodes.length - 1) * (nodes.length - 2)) / 2;
    for (const [node, value] of centrality) {
      centrality.set(node, value / maxPossible);
    }

    return centrality;
  }

  /**
   * Calculate PageRank centrality
   */
  pageRank(
    graph: Graph,
    iterations: number = 50,
    dampingFactor: number = 0.85,
  ): Map<string, number> {
    const pagerank = new Map<string, number>();
    const nodeCount = graph.nodes.size;
    const initialRank = 1 / nodeCount;

    // Initialize all nodes with equal rank
    for (const node of graph.nodes.keys()) {
      pagerank.set(node, initialRank);
    }

    // Iterative calculation
    for (let i = 0; i < iterations; i++) {
      const newRanks = new Map<string, number>();

      for (const node of graph.nodes.keys()) {
        let rank = (1 - dampingFactor) / nodeCount;

        // Sum contributions from incoming links
        const incomingNodes = graph.reverseAdjacencyList.get(node) || new Set();
        for (const incoming of incomingNodes) {
          const outDegree = graph.adjacencyList.get(incoming)?.size || 1;
          rank += (dampingFactor * (pagerank.get(incoming) || 0)) / outDegree;
        }

        newRanks.set(node, rank);
      }

      // Update ranks
      for (const [node, rank] of newRanks) {
        pagerank.set(node, rank);
      }
    }

    return pagerank;
  }

  /**
   * Find clusters using label propagation
   */
  findClusters(graph: Graph, method: ClusteringMethod = 'label-propagation'): Map<string, number> {
    if (method === 'label-propagation') {
      return this.labelPropagationClustering(graph);
    } else {
      // For now, only implement label propagation
      return this.labelPropagationClustering(graph);
    }
  }

  /**
   * Label propagation clustering algorithm
   */
  private labelPropagationClustering(
    graph: Graph,
    maxIterations: number = 100,
  ): Map<string, number> {
    const labels = new Map<string, number>();
    let nodeIndex = 0;

    // Initialize each node with unique label
    for (const node of graph.nodes.keys()) {
      labels.set(node, nodeIndex++);
    }

    let changed = true;
    let iterations = 0;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Random order for nodes
      const nodes = Array.from(graph.nodes.keys()).sort(() => Math.random() - 0.5);

      for (const node of nodes) {
        const neighbors = graph.adjacencyList.get(node) || new Set();
        if (neighbors.size === 0) continue;

        // Count labels of neighbors
        const labelCounts = new Map<number, number>();
        for (const neighbor of neighbors) {
          const label = labels.get(neighbor)!;
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        }

        // Find most common label
        let maxCount = 0;
        let maxLabel = labels.get(node)!;

        for (const [label, count] of labelCounts) {
          if (count > maxCount || (count === maxCount && label < maxLabel)) {
            maxCount = count;
            maxLabel = label;
          }
        }

        // Update label if changed
        if (labels.get(node) !== maxLabel) {
          labels.set(node, maxLabel);
          changed = true;
        }
      }
    }

    return labels;
  }

  /**
   * Calculate clustering coefficient for a node or the entire graph
   */
  clusteringCoefficient(graph: Graph, nodeId?: string): number {
    if (nodeId) {
      return this.nodeClusteringCoefficient(graph, nodeId);
    } else {
      // Average clustering coefficient for the entire graph
      let sum = 0;
      let count = 0;

      for (const node of graph.nodes.keys()) {
        const coeff = this.nodeClusteringCoefficient(graph, node);
        if (coeff >= 0) {
          sum += coeff;
          count++;
        }
      }

      return count > 0 ? sum / count : 0;
    }
  }

  /**
   * Calculate clustering coefficient for a single node
   */
  private nodeClusteringCoefficient(graph: Graph, nodeId: string): number {
    const neighbors = Array.from(graph.adjacencyList.get(nodeId) || []);
    const k = neighbors.length;

    if (k < 2) {
      return -1; // Undefined for nodes with degree < 2
    }

    // Count edges between neighbors
    let edgeCount = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const n1 = neighbors[i];
        const n2 = neighbors[j];
        if (n1 && n2) {
          if (graph.adjacencyList.get(n1)?.has(n2) || graph.adjacencyList.get(n2)?.has(n1)) {
            edgeCount++;
          }
        }
      }
    }

    // Clustering coefficient = 2 * edges / (k * (k - 1))
    return (2 * edgeCount) / (k * (k - 1));
  }
}
