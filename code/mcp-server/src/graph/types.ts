// ABOUTME: Type definitions for the knowledge graph data structures
// ABOUTME: Provides interfaces for nodes, edges, graphs, and analysis results

import { PARACategory } from '../para/types.js';
import { DocumentMetadata } from '../models/types.js';

/**
 * Represents a node in the knowledge graph (a document)
 */
export interface GraphNode {
  /** Document path (unique identifier) */
  id: string;
  /** Document title */
  title: string;
  /** PARA category of the document */
  category: PARACategory;
  /** Full document metadata */
  metadata: DocumentMetadata;
  /** Document tags */
  tags: string[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Represents an edge in the knowledge graph (a relationship between documents)
 */
export interface GraphEdge {
  /** Unique edge identifier */
  id: string;
  /** Source document path */
  source: string;
  /** Target document path */
  target: string;
  /** Type of relationship */
  type: 'wiki-link' | 'tag-relation' | 'category-relation';
  /** Edge weight for weighted algorithms */
  weight: number;
  /** Additional edge metadata */
  metadata?: {
    /** Display text from wiki-link */
    anchorText?: string;
    /** Anchor fragment */
    anchor?: string;
    /** Surrounding text snippet */
    context?: string;
  };
}

/**
 * Represents the complete knowledge graph
 */
export interface Graph {
  /** All nodes indexed by path */
  nodes: Map<string, GraphNode>;
  /** All edges indexed by ID */
  edges: Map<string, GraphEdge>;
  /** Adjacency list for forward traversal */
  adjacencyList: Map<string, Set<string>>;
  /** Reverse adjacency list for backward traversal */
  reverseAdjacencyList: Map<string, Set<string>>;
}

/**
 * Options for building a graph
 */
export interface GraphBuildOptions {
  /** Include tag-based relationships */
  includeTagRelations?: boolean;
  /** Include category-based relationships */
  includeCategoryRelations?: boolean;
  /** Minimum tag overlap for tag relations */
  minTagOverlap?: number;
  /** Maximum depth for subgraph building */
  maxDepth?: number;
}

/**
 * Statistical information about a graph
 */
export interface GraphStats {
  /** Total number of nodes */
  nodeCount: number;
  /** Total number of edges */
  edgeCount: number;
  /** Graph density (edges / possible edges) */
  density: number;
  /** Average node degree */
  avgDegree: number;
  /** Number of connected components */
  connectedComponents: number;
  /** Whether the graph contains cycles */
  hasCycles: boolean;
}

/**
 * Result of graph analysis
 */
export interface GraphAnalysis {
  /** Basic graph statistics */
  stats: GraphStats;
  /** Most central nodes by various metrics */
  centralNodes: {
    byDegree: GraphNode[];
    byBetweenness: GraphNode[];
    byPageRank: GraphNode[];
  };
  /** Identified clusters */
  clusters: Map<string, number>;
  /** Nodes with no connections */
  orphanNodes: GraphNode[];
  /** Nodes with many outgoing connections */
  hubNodes: GraphNode[];
  /** Nodes that connect different parts of the graph */
  bridgeNodes: GraphNode[];
}

/**
 * Suggested connection between two nodes
 */
export interface SuggestedConnection {
  /** Source document path */
  from: string;
  /** Target document path */
  to: string;
  /** Reason for the suggestion */
  reason: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Options for graph algorithms
 */
export interface AlgorithmOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Maximum iterations for iterative algorithms */
  maxIterations?: number;
  /** Convergence threshold for iterative algorithms */
  convergenceThreshold?: number;
}

/**
 * Clustering method options
 */
export type ClusteringMethod = 'louvain' | 'label-propagation';

/**
 * Centrality metric type
 */
export type CentralityMetric = 'degree' | 'betweenness' | 'pagerank';