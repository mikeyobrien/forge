// ABOUTME: Defines types and interfaces for the backlink tracking system
// ABOUTME: Includes structures for backlink storage, queries, and index management

/**
 * Represents a single backlink relationship between documents
 */
export interface BacklinkEntry {
  /** Path to the document containing the link */
  sourcePath: string;

  /** Path to the document being linked to */
  targetPath: string;

  /** Display text of the link (if different from target) */
  linkText?: string;

  /** Surrounding text for context (±50 chars) */
  context?: string;

  /** Line number where the link appears */
  lineNumber?: number;

  /** Type of link (wiki, markdown, etc.) */
  linkType: 'wiki' | 'markdown' | 'reference';
}

/**
 * Map from document path to array of backlink entries
 */
export interface BacklinkIndex {
  [targetPath: string]: BacklinkEntry[];
}

/**
 * Persisted backlink index format
 */
export interface PersistedBacklinkIndex {
  /** Version of the index format */
  version: string;

  /** Last update timestamp */
  lastUpdated: string;

  /** The actual backlink index */
  index: BacklinkIndex;

  /** Optional metadata */
  metadata?: {
    documentCount: number;
    linkCount: number;
  };
}

/**
 * Options for querying backlinks
 */
export interface BacklinkQueryOptions {
  /** Include link context in results */
  includeContext?: boolean;

  /** Filter by link type */
  linkType?: 'wiki' | 'markdown' | 'reference' | 'all';

  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Result of a backlink query
 */
export interface BacklinkQueryResult {
  /** Target document path */
  targetPath: string;

  /** Array of documents linking to the target */
  backlinks: BacklinkEntry[];

  /** Total count (before pagination) */
  totalCount: number;
}

/**
 * Statistics about the backlink index
 */
export interface BacklinkStats {
  /** Total number of documents in the index */
  documentCount: number;

  /** Total number of links tracked */
  linkCount: number;

  /** Documents with the most incoming links */
  mostLinkedDocuments: Array<{
    path: string;
    incomingLinkCount: number;
  }>;

  /** Documents with the most outgoing links */
  mostLinkingDocuments: Array<{
    path: string;
    outgoingLinkCount: number;
  }>;
}

/**
 * Link extraction result from a document
 */
export interface ExtractedLink {
  /** The raw link text (e.g., "[[page]]" or "[text](url)") */
  rawLink: string;

  /** The target path extracted from the link */
  targetPath: string;

  /** Display text (if different from target) */
  displayText?: string;

  /** Type of link */
  linkType: 'wiki' | 'markdown' | 'reference';

  /** Character position in the document */
  position: {
    start: number;
    end: number;
  };

  /** Line number (1-indexed) */
  lineNumber: number;
}

/**
 * Options for link extraction
 */
export interface LinkExtractionOptions {
  /** Base path for resolving relative links */
  basePath: string;

  /** Whether to validate that link targets exist */
  validateTargets?: boolean;

  /** Include links in code blocks */
  includeCodeBlocks?: boolean;

  /** Maximum context length to extract */
  contextLength?: number;
}

/**
 * Result of link extraction from a document
 */
export interface LinkExtractionResult {
  /** Path to the source document */
  sourcePath: string;

  /** All links found in the document */
  links: ExtractedLink[];

  /** Any errors encountered during extraction */
  errors?: Array<{
    message: string;
    line?: number;
  }>;
}
