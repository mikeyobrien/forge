// ABOUTME: Builds knowledge graphs from document collections
// ABOUTME: Converts wiki-links and relationships into graph structures

import { LinkIndexer } from '../links/LinkIndexer.js';
import { SearchEngine } from '../search/SearchEngine.js';
import { SearchResult } from '../search/types.js';
import { PARACategory } from '../para/types.js';
import { LinkQueryType } from '../links/types.js';
import { Graph, GraphNode, GraphEdge, GraphBuildOptions } from './types.js';

// Internal document representation
interface GraphDocument {
  path: string;
  title: string;
  tags: string[];
  category: PARACategory;
  created?: Date;
  modified?: Date;
}

/**
 * Builds knowledge graphs from document collections
 */
export class GraphBuilder {
  constructor(
    private linkIndexer: LinkIndexer,
    private searchEngine: SearchEngine,
  ) {}

  /**
   * Build a complete graph from all documents
   */
  async buildGraph(options: GraphBuildOptions = {}): Promise<Graph> {
    // Get all documents by searching with a wildcard that matches any content
    const searchResult = await this.searchEngine.search({
      content: '.', // Period matches any character, effectively matching all documents
      limit: 10000, // Very high limit to get all documents
    });
    const documents = searchResult.results.map((r) => this.searchResultToDocument(r));
    return this.buildFromDocuments(documents, options);
  }

  /**
   * Build a graph from documents in a specific category
   */
  async buildFromCategory(category: PARACategory, options: GraphBuildOptions = {}): Promise<Graph> {
    const documents = await this.searchEngine.search({
      category,
      limit: 1000, // Large limit to get all documents
    });
    return this.buildFromDocuments(
      documents.results.map((r) => this.searchResultToDocument(r)),
      options,
    );
  }

  /**
   * Build a graph from documents with specific tags
   */
  async buildFromTags(tags: string[], options: GraphBuildOptions = {}): Promise<Graph> {
    const documents = await this.searchEngine.search({
      tags,
      limit: 1000,
    });
    return this.buildFromDocuments(
      documents.results.map((r) => this.searchResultToDocument(r)),
      options,
    );
  }

  /**
   * Build a subgraph starting from specific root paths
   */
  async buildSubgraph(
    rootPaths: string[],
    depth: number,
    options: GraphBuildOptions = {},
  ): Promise<Graph> {
    const visited = new Set<string>();
    const documents = new Map<string, GraphDocument>();

    // BFS to collect documents up to specified depth
    const queue: Array<{ path: string; currentDepth: number }> = rootPaths.map((path) => ({
      path,
      currentDepth: 0,
    }));

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { path, currentDepth } = item;

      if (visited.has(path) || currentDepth > depth) {
        continue;
      }

      visited.add(path);

      try {
        // Try to get document through search
        const searchResult = await this.searchEngine.search({
          content: path,
          limit: 1,
        });

        if (searchResult.results.length > 0 && searchResult.results[0]) {
          const searchDoc = searchResult.results[0];
          if (searchDoc.path === path) {
            const doc = this.searchResultToDocument(searchDoc);
            documents.set(path, doc);

            // Add linked documents to queue
            if (currentDepth < depth) {
              const linkResults = await this.linkIndexer.query({
                path,
                type: LinkQueryType.FORWARD,
              });

              if (linkResults.length > 0 && linkResults[0] && linkResults[0].forward_links) {
                for (const targetPath of linkResults[0].forward_links) {
                  queue.push({
                    path: targetPath,
                    currentDepth: currentDepth + 1,
                  });
                }
              }
            }
          }
        }
      } catch (_error) {
        // Skip documents that can't be loaded
      }
    }

    return this.buildFromDocuments(Array.from(documents.values()), options);
  }

  /**
   * Build a graph from a collection of documents
   */
  private async buildFromDocuments(
    documents: GraphDocument[],
    options: GraphBuildOptions = {},
  ): Promise<Graph> {
    const graph: Graph = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      reverseAdjacencyList: new Map(),
    };

    // Create nodes
    for (const doc of documents) {
      const node = this.createNode(doc);
      graph.nodes.set(node.id, node);
      graph.adjacencyList.set(node.id, new Set());
      graph.reverseAdjacencyList.set(node.id, new Set());
    }

    // Create wiki-link edges
    for (const doc of documents) {
      const linkResults = await this.linkIndexer.query({
        path: doc.path,
        type: LinkQueryType.FORWARD,
      });

      if (linkResults.length > 0 && linkResults[0] && linkResults[0].forward_links) {
        for (const targetPath of linkResults[0].forward_links) {
          if (graph.nodes.has(targetPath)) {
            const edge = this.createEdge(doc.path, targetPath);
            graph.edges.set(edge.id, edge);

            // Update adjacency lists
            graph.adjacencyList.get(doc.path)?.add(targetPath);
            graph.reverseAdjacencyList.get(targetPath)?.add(doc.path);
          }
        }
      }
    }

    // Add additional relationship types if requested
    if (options.includeTagRelations) {
      this.addTagRelations(graph, options.minTagOverlap || 1);
    }

    if (options.includeCategoryRelations) {
      this.addCategoryRelations(graph);
    }

    return graph;
  }

  /**
   * Create a graph node from a document
   */
  private createNode(doc: GraphDocument): GraphNode {
    return {
      id: doc.path,
      title: doc.title || doc.path,
      category: doc.category,
      metadata: {
        title: doc.title,
        category: doc.category,
        ...(doc.tags && { tags: doc.tags }),
        ...(doc.created && { created: doc.created.toISOString() }),
        ...(doc.modified && { modified: doc.modified.toISOString() }),
      },
      tags: doc.tags || [],
      createdAt: doc.created || new Date(),
      updatedAt: doc.modified || doc.created || new Date(),
    };
  }

  /**
   * Convert SearchResult to GraphDocument
   */
  private searchResultToDocument(result: SearchResult): GraphDocument {
    const doc: GraphDocument = {
      path: result.path,
      title: result.title,
      tags: result.tags,
      category: result.category,
    };

    if (result.metadata.created) {
      doc.created = new Date(result.metadata.created);
    }

    if (result.metadata.modified) {
      doc.modified = new Date(result.metadata.modified);
    }

    return doc;
  }

  /**
   * Create a graph edge from a wiki-link
   */
  private createEdge(from: string, to: string): GraphEdge {
    const edgeId = `${from}->${to}`;
    return {
      id: edgeId,
      source: from,
      target: to,
      type: 'wiki-link',
      weight: 1,
    };
  }

  /**
   * Add edges based on tag relationships
   */
  private addTagRelations(graph: Graph, minOverlap: number): void {
    const nodeArray = Array.from(graph.nodes.values());

    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const node1 = nodeArray[i];
        const node2 = nodeArray[j];

        if (node1 && node2) {
          const commonTags = node1.tags.filter((tag) => node2.tags.includes(tag));

          if (commonTags.length >= minOverlap) {
            const edgeId = `tag-${node1.id}->${node2.id}`;
            const edge: GraphEdge = {
              id: edgeId,
              source: node1.id,
              target: node2.id,
              type: 'tag-relation',
              weight: commonTags.length,
              metadata: {
                context: `Common tags: ${commonTags.join(', ')}`,
              },
            };

            graph.edges.set(edgeId, edge);
            graph.adjacencyList.get(node1.id)?.add(node2.id);
            graph.reverseAdjacencyList.get(node2.id)?.add(node1.id);

            // Also add reverse edge for undirected tag relations
            const reverseEdgeId = `tag-${node2.id}->${node1.id}`;
            const reverseEdge: GraphEdge = {
              ...edge,
              id: reverseEdgeId,
              source: node2.id,
              target: node1.id,
            };

            graph.edges.set(reverseEdgeId, reverseEdge);
            graph.adjacencyList.get(node2.id)?.add(node1.id);
            graph.reverseAdjacencyList.get(node1.id)?.add(node2.id);
          }
        }
      }
    }
  }

  /**
   * Add edges based on category relationships
   */
  private addCategoryRelations(graph: Graph): void {
    const nodesByCategory = new Map<PARACategory, GraphNode[]>();

    // Group nodes by category
    for (const node of graph.nodes.values()) {
      const category = node.category;
      if (!nodesByCategory.has(category)) {
        nodesByCategory.set(category, []);
      }
      const categoryNodes = nodesByCategory.get(category);
      if (categoryNodes) {
        categoryNodes.push(node);
      }
    }

    // Create edges between nodes in the same category
    for (const [category, nodes] of nodesByCategory) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];

          if (node1 && node2) {
            // Skip if there's already a wiki-link between these nodes
            if (graph.adjacencyList.get(node1.id)?.has(node2.id)) {
              continue;
            }

            const edgeId = `category-${node1.id}->${node2.id}`;
            const edge: GraphEdge = {
              id: edgeId,
              source: node1.id,
              target: node2.id,
              type: 'category-relation',
              weight: 0.5, // Lower weight than direct links
              metadata: {
                context: `Same category: ${category}`,
              },
            };

            graph.edges.set(edgeId, edge);
            graph.adjacencyList.get(node1.id)?.add(node2.id);
            graph.reverseAdjacencyList.get(node2.id)?.add(node1.id);

            // Add reverse edge for undirected category relations
            const reverseEdgeId = `category-${node2.id}->${node1.id}`;
            const reverseEdge: GraphEdge = {
              ...edge,
              id: reverseEdgeId,
              source: node2.id,
              target: node1.id,
            };

            graph.edges.set(reverseEdgeId, reverseEdge);
            graph.adjacencyList.get(node2.id)?.add(node1.id);
            graph.reverseAdjacencyList.get(node1.id)?.add(node2.id);
          }
        }
      }
    }
  }
}
