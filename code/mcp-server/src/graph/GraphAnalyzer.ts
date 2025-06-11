// ABOUTME: Analyzes knowledge graphs to extract insights and patterns
// ABOUTME: Provides high-level analysis functions for graph understanding

import { GraphAlgorithms } from './algorithms/index.js';
import {
  Graph,
  GraphNode,
  GraphStats,
  GraphAnalysis,
  SuggestedConnection,
} from './types.js';

/**
 * Analyzes knowledge graphs to extract insights
 */
export class GraphAnalyzer {
  constructor(private algorithms: GraphAlgorithms) {}

  /**
   * Perform comprehensive analysis of a graph
   */
  analyzeGraph(graph: Graph): GraphAnalysis {
    const stats = this.calculateStats(graph);
    const centralNodes = this.findCentralNodes(graph);
    const clusters = this.identifyClusters(graph);
    const orphanNodes = this.findOrphanNodes(graph);
    const hubNodes = this.findHubNodes(graph);
    const bridgeNodes = this.findBridgeNodes(graph);

    return {
      stats,
      centralNodes,
      clusters,
      orphanNodes,
      hubNodes,
      bridgeNodes,
    };
  }

  /**
   * Calculate basic statistics about the graph
   */
  private calculateStats(graph: Graph): GraphStats {
    const nodeCount = graph.nodes.size;
    const edgeCount = graph.edges.size;
    
    // Calculate density
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
    
    // Calculate average degree
    let totalDegree = 0;
    for (const nodeId of graph.nodes.keys()) {
      const outDegree = graph.adjacencyList.get(nodeId)?.size || 0;
      const inDegree = graph.reverseAdjacencyList.get(nodeId)?.size || 0;
      totalDegree += outDegree + inDegree;
    }
    const avgDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;
    
    // Find connected components
    const components = this.algorithms.findConnectedComponents(graph);
    const connectedComponents = components.length;
    
    // Check for cycles
    const cycles = this.algorithms.detectCycles(graph);
    const hasCycles = cycles.length > 0;
    
    return {
      nodeCount,
      edgeCount,
      density,
      avgDegree,
      connectedComponents,
      hasCycles,
    };
  }

  /**
   * Find the most central nodes by various metrics
   */
  private findCentralNodes(graph: Graph, topK: number = 5): GraphAnalysis['centralNodes'] {
    // Calculate centrality metrics
    const degreeCentrality = this.algorithms.degreeCentrality(graph);
    const betweennessCentrality = this.algorithms.betweennessCentrality(graph);
    const pageRank = this.algorithms.pageRank(graph);
    
    // Sort and get top nodes for each metric
    const byDegree = this.getTopNodesByCentrality(graph, degreeCentrality, topK);
    const byBetweenness = this.getTopNodesByCentrality(graph, betweennessCentrality, topK);
    const byPageRank = this.getTopNodesByCentrality(graph, pageRank, topK);
    
    return {
      byDegree,
      byBetweenness,
      byPageRank,
    };
  }

  /**
   * Get top K nodes by centrality score
   */
  private getTopNodesByCentrality(
    graph: Graph,
    centrality: Map<string, number>,
    topK: number
  ): GraphNode[] {
    const sorted = Array.from(centrality.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK);
    
    return sorted
      .map(([nodeId]) => graph.nodes.get(nodeId))
      .filter((node): node is GraphNode => node !== undefined);
  }

  /**
   * Identify clusters in the graph
   */
  private identifyClusters(graph: Graph): Map<string, number> {
    return this.algorithms.findClusters(graph, 'label-propagation');
  }

  /**
   * Find nodes with no connections
   */
  private findOrphanNodes(graph: Graph): GraphNode[] {
    const orphans: GraphNode[] = [];
    
    for (const [nodeId, node] of graph.nodes) {
      const outDegree = graph.adjacencyList.get(nodeId)?.size || 0;
      const inDegree = graph.reverseAdjacencyList.get(nodeId)?.size || 0;
      
      if (outDegree === 0 && inDegree === 0) {
        orphans.push(node);
      }
    }
    
    return orphans;
  }

  /**
   * Find hub nodes (high out-degree)
   */
  private findHubNodes(graph: Graph, threshold: number = 5): GraphNode[] {
    const hubs: GraphNode[] = [];
    
    for (const [nodeId, node] of graph.nodes) {
      const outDegree = graph.adjacencyList.get(nodeId)?.size || 0;
      
      if (outDegree >= threshold) {
        hubs.push(node);
      }
    }
    
    // Sort by out-degree
    return hubs.sort((a, b) => {
      const aDegree = graph.adjacencyList.get(a.id)?.size || 0;
      const bDegree = graph.adjacencyList.get(b.id)?.size || 0;
      return bDegree - aDegree;
    });
  }

  /**
   * Find bridge nodes that connect different parts of the graph
   */
  private findBridgeNodes(graph: Graph): GraphNode[] {
    const bridges: GraphNode[] = [];
    const betweenness = this.algorithms.betweennessCentrality(graph);
    
    // Nodes with high betweenness are likely bridges
    const threshold = 0.1; // Adjust based on graph characteristics
    
    for (const [nodeId, score] of betweenness) {
      if (score > threshold) {
        const node = graph.nodes.get(nodeId);
        if (node) {
          bridges.push(node);
        }
      }
    }
    
    return bridges;
  }

  /**
   * Find the most influential nodes in the graph
   */
  findInfluencers(graph: Graph, limit: number = 10): GraphNode[] {
    const pageRank = this.algorithms.pageRank(graph);
    return this.getTopNodesByCentrality(graph, pageRank, limit);
  }

  /**
   * Find documents related to a given document
   */
  findRelatedDocuments(
    graph: Graph,
    docPath: string,
    limit: number = 10
  ): GraphNode[] {
    if (!graph.nodes.has(docPath)) {
      return [];
    }
    
    // Use a combination of direct links and shared neighbors
    const scores = new Map<string, number>();
    
    // Direct neighbors get highest score
    const directNeighbors = graph.adjacencyList.get(docPath) || new Set();
    for (const neighbor of directNeighbors) {
      scores.set(neighbor, 2.0);
    }
    
    // Incoming links also count
    const incomingLinks = graph.reverseAdjacencyList.get(docPath) || new Set();
    for (const incoming of incomingLinks) {
      scores.set(incoming, (scores.get(incoming) || 0) + 1.5);
    }
    
    // Two-hop neighbors get lower score
    for (const neighbor of directNeighbors) {
      const secondHop = graph.adjacencyList.get(neighbor) || new Set();
      for (const distant of secondHop) {
        if (distant !== docPath && !directNeighbors.has(distant)) {
          scores.set(distant, (scores.get(distant) || 0) + 0.5);
        }
      }
    }
    
    // Sort by score and return top results
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    return sorted
      .map(([nodeId]) => graph.nodes.get(nodeId))
      .filter((node): node is GraphNode => node !== undefined);
  }

  /**
   * Suggest new connections that might be valuable
   */
  suggestConnections(graph: Graph, limit: number = 10): SuggestedConnection[] {
    const suggestions: SuggestedConnection[] = [];
    
    // Strategy 1: Common neighbors (collaborative filtering)
    for (const nodeId of graph.nodes.keys()) {
      const neighbors = graph.adjacencyList.get(nodeId) || new Set();
      
      // For each neighbor, find their neighbors
      const candidateScores = new Map<string, number>();
      
      for (const neighbor of neighbors) {
        const neighborNeighbors = graph.adjacencyList.get(neighbor) || new Set();
        
        for (const candidate of neighborNeighbors) {
          // Skip if already connected or self-reference
          if (candidate === nodeId || neighbors.has(candidate)) {
            continue;
          }
          
          candidateScores.set(
            candidate,
            (candidateScores.get(candidate) || 0) + 1
          );
        }
      }
      
      // Create suggestions for high-scoring candidates
      for (const [candidate, score] of candidateScores) {
        if (score >= 2) {
          // At least 2 common neighbors
          suggestions.push({
            from: nodeId,
            to: candidate,
            reason: `${score} common connections`,
            confidence: Math.min(score / 5, 1.0),
          });
        }
      }
    }
    
    // Strategy 2: Similar tags (content-based filtering)
    const nodeArray = Array.from(graph.nodes.values());
    
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const node1 = nodeArray[i];
        const node2 = nodeArray[j];
        
        if (node1 && node2) {
          // Skip if already connected
          if (graph.adjacencyList.get(node1.id)?.has(node2.id)) {
            continue;
          }
          
          // Check tag similarity
          const commonTags = node1.tags.filter(tag => node2.tags.includes(tag));
          
          if (commonTags.length >= 2) {
            suggestions.push({
              from: node1.id,
              to: node2.id,
              reason: `Similar tags: ${commonTags.join(', ')}`,
              confidence: Math.min(commonTags.length / 3, 1.0),
            });
          }
        }
      }
    }
    
    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }
}