// ABOUTME: Type definitions for document movement operations
// ABOUTME: Provides interfaces for move options, results, and errors

export interface MoveOptions {
  /**
   * Whether to update all incoming wiki-links to the moved document
   * @default true
   */
  updateLinks?: boolean;

  /**
   * Whether to overwrite the destination if it already exists
   * @default false
   */
  overwrite?: boolean;

  /**
   * Whether to preserve the original file's timestamps
   * @default true
   */
  preserveTimestamps?: boolean;
}

export interface LinkUpdate {
  /** Path of the document that was updated */
  documentPath: string;

  /** Number of links that were updated in this document */
  linksUpdated: number;

  /** The old link text that was replaced */
  oldLinks: string[];

  /** The new link text that replaced the old */
  newLinks: string[];
}

export interface MoveResult {
  /** Original path of the moved document */
  oldPath: string;

  /** New path where the document was moved to */
  newPath: string;

  /** Old PARA category (if changed) */
  oldCategory?: string;

  /** New PARA category (if changed) */
  newCategory?: string;

  /** List of documents that had their links updated */
  updatedLinks: LinkUpdate[];

  /** Total number of links updated across all documents */
  totalLinksUpdated: number;
}

export interface MoveValidation {
  /** Whether the move operation is valid */
  isValid: boolean;

  /** Validation error message if not valid */
  error?: string;

  /** Resolved source path */
  resolvedSource?: string;

  /** Resolved destination path */
  resolvedDestination?: string;

  /** Whether this is a cross-category move */
  isCrossCategory?: boolean;
}

export class DocumentMoveError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'SOURCE_NOT_FOUND'
      | 'DESTINATION_EXISTS'
      | 'INVALID_PATH'
      | 'PERMISSION_DENIED'
      | 'LINK_UPDATE_FAILED'
      | 'ROLLBACK_FAILED',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DocumentMoveError';
  }
}

export interface RollbackState {
  /** Original document content before move */
  originalContent: string;

  /** Original document path */
  originalPath: string;

  /** Documents that were modified during link updates */
  modifiedDocuments: Array<{
    path: string;
    originalContent: string;
  }>;
}
