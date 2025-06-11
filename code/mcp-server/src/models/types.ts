// ABOUTME: Defines TypeScript interfaces for document models and metadata
// ABOUTME: Core data structures for the knowledge management system

/**
 * Base frontmatter fields common to all documents
 */
export interface FrontmatterBase {
  /** Document title (required) */
  title: string;

  /** Tags for categorization and search */
  tags?: string[];

  /** ISO 8601 date string when document was created */
  created?: string;

  /** ISO 8601 date string when document was last modified */
  modified?: string;

  /** Alternative names/aliases for this document */
  aliases?: string[];
}

/**
 * PARA method categories
 */
export enum PARACategory {
  Projects = 'projects',
  Areas = 'areas',
  Resources = 'resources',
  Archives = 'archives',
}

/**
 * Status values for project documents
 */
export enum ProjectStatus {
  Active = 'active',
  Completed = 'completed',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
}

/**
 * PARA-specific frontmatter fields
 */
export interface PARAFrontmatter extends FrontmatterBase {
  /** PARA category this document belongs to */
  category: PARACategory;

  /** Status (only for Projects) */
  status?: ProjectStatus;

  /** Due date (only for Projects) - ISO 8601 date string */
  due_date?: string;

  /** Parent document path for nested structures */
  parent?: string;
}

/**
 * Link-related frontmatter fields
 */
export interface LinkFrontmatter extends FrontmatterBase {
  /** Documents this document links to (forward links) */
  links_to?: string[];

  /** Documents that link to this document (computed, not stored) */
  backlinks?: string[];
}

/**
 * Combined frontmatter type
 */
export interface DocumentFrontmatter extends PARAFrontmatter, LinkFrontmatter {
  /** Allow additional custom fields */
  [key: string]: unknown;
}

/**
 * Core document interface
 */
export interface Document {
  /** Unique identifier (file path relative to CONTEXT_ROOT) */
  id: string;

  /** Absolute file path */
  path: string;

  /** Parsed frontmatter metadata */
  frontmatter: DocumentFrontmatter;

  /** Document content (excluding frontmatter) */
  content: string;

  /** Raw content including frontmatter */
  raw?: string;

  /** File stats */
  stats?: {
    size: number;
    created: Date;
    modified: Date;
  };
}

/**
 * Document with PARA metadata
 */
export interface PARADocument extends Document {
  frontmatter: PARAFrontmatter & DocumentFrontmatter;
}

/**
 * Parameters for creating a new document
 */
export interface CreateDocumentParams {
  /** File path relative to CONTEXT_ROOT */
  path: string;

  /** Document title */
  title: string;

  /** Initial content (excluding frontmatter) */
  content?: string;

  /** Tags for categorization */
  tags?: string[];

  /** PARA category */
  category?: PARACategory;

  /** Additional frontmatter fields */
  frontmatter?: Partial<DocumentFrontmatter>;
}

/**
 * Parameters for creating a PARA document
 */
export interface CreatePARADocumentParams extends CreateDocumentParams {
  /** PARA category (required) */
  category: PARACategory;

  /** Project status (for Projects only) */
  status?: ProjectStatus;

  /** Due date (for Projects only) */
  due_date?: string;

  /** Parent document path */
  parent?: string;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** Search in document titles */
  title?: string;

  /** Search in document content */
  content?: string;

  /** Filter by tags (AND operation) */
  tags?: string[];

  /** Filter by PARA category */
  category?: PARACategory;

  /** Filter by project status */
  status?: ProjectStatus;

  /** Maximum number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Link query parameters
 */
export interface LinkQuery {
  /** Document ID to query links for */
  documentId: string;

  /** Include forward links */
  includeForward?: boolean;

  /** Include backlinks */
  includeBacklinks?: boolean;

  /** Maximum depth for transitive links */
  depth?: number;
}

/**
 * Document update parameters
 */
export interface UpdateDocumentParams {
  /** Document ID to update */
  id: string;

  /** New title */
  title?: string;

  /** New content */
  content?: string;

  /** Tags to add */
  addTags?: string[];

  /** Tags to remove */
  removeTags?: string[];

  /** Frontmatter fields to update */
  frontmatter?: Partial<DocumentFrontmatter>;
}
