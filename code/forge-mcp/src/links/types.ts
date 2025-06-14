// ABOUTME: Type definitions for the link querying and indexing system
// ABOUTME: Defines interfaces for link relationships, queries, and results

import { DocumentFrontmatter } from '../models/types';

export enum LinkQueryType {
  FORWARD = 'forward', // Links from a document
  BACKLINKS = 'backlinks', // Links to a document
  ORPHANED = 'orphaned', // Documents with no backlinks
  BROKEN = 'broken', // Links to non-existent documents
  ALL = 'all', // All link information
}

export interface WikiLink {
  raw: string; // The raw link text (e.g., "[[target|display]]")
  target: string; // The target document path
  display?: string; // Optional display text
  anchor?: string; // Optional anchor (e.g., "#heading")
  position: {
    start: number; // Start position in content
    end: number; // End position in content
    line: number; // Line number (1-based)
    column: number; // Column number (1-based)
  };
}

export interface ParsedDocument {
  path: string;
  content: string;
  links: WikiLink[];
  metadata?: DocumentFrontmatter;
  lastModified: Date;
}

export interface LinkIndex {
  // Map from document path to its outgoing links
  forwardLinks: Map<string, Set<string>>;

  // Map from document path to documents linking to it
  backlinks: Map<string, Set<string>>;

  // Map from document path to non-existent targets
  brokenLinks: Map<string, Set<string>>;

  // Cache of parsed documents to avoid re-parsing
  documentCache: Map<string, ParsedDocument>;

  // Track index state
  isBuilt: boolean;
  lastBuildTime?: Date;
}

export interface LinkQueryOptions {
  path?: string; // Document path to query
  type: LinkQueryType; // Type of query
  includeMetadata?: boolean; // Include document metadata
  includeBroken?: boolean; // Include broken links
  limit?: number; // Limit results
  offset?: number; // Offset for pagination
}

export interface LinkQueryResult {
  document: string;
  forward_links: string[];
  backlinks: string[];
  broken_links?: string[];
  metadata?: DocumentFrontmatter;
  stats?: {
    total_forward: number;
    total_backlinks: number;
    total_broken: number;
  };
}

export interface LinkGraphNode {
  path: string;
  metadata?: DocumentFrontmatter;
  outgoing: string[];
  incoming: string[];
  broken?: string[];
}

export interface LinkStatistics {
  totalDocuments: number;
  totalLinks: number;
  totalBrokenLinks: number;
  orphanedDocuments: string[];
  mostLinkedDocuments: Array<{
    path: string;
    backlinkCount: number;
  }>;
  documentsWithBrokenLinks: Array<{
    path: string;
    brokenCount: number;
  }>;
}
