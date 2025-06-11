// ABOUTME: Type definitions for document update operations
// ABOUTME: Provides interfaces for update parameters and results

import { DocumentFrontmatter } from '../models/types.js';
import { ParsedDocument } from '../parsers/index.js';

// Document type for updates (extends ParsedDocument)
export interface Document extends ParsedDocument {
  metadata: DocumentMetadata;
}

// DocumentMetadata is an alias for DocumentFrontmatter
export type DocumentMetadata = DocumentFrontmatter;

/**
 * Parameters for updating a document
 */
export interface UpdateDocumentParams {
  /** Document path relative to CONTEXT_ROOT */
  path: string;

  /** New content for the document body (optional) */
  content?: string;

  /** Metadata fields to update (partial update) */
  metadata?: Partial<DocumentMetadata>;

  /** Whether to replace content entirely or append (default: false) */
  replace_content?: boolean;

  /** Whether to preserve existing wiki-links (default: true) */
  preserve_links?: boolean;
}

/**
 * Result of a document update operation
 */
export interface UpdateResult {
  /** Whether the update succeeded */
  success: boolean;

  /** The updated document */
  document: Document;

  /** Summary of changes made */
  changes: UpdateChangeSummary;
}

/**
 * Summary of changes made during an update
 */
export interface UpdateChangeSummary {
  /** Whether content was updated */
  content_updated: boolean;

  /** Whether metadata was updated */
  metadata_updated: boolean;

  /** Number of wiki-links preserved */
  links_preserved: number;

  /** List of metadata fields that were updated */
  updated_fields: string[];
}

/**
 * Options for merging metadata
 */
export interface MetadataMergeOptions {
  /** Whether to append arrays or replace them (default: replace) */
  append_arrays?: boolean;

  /** Whether to allow removing fields by setting to null (default: false) */
  allow_removal?: boolean;
}

/**
 * Error thrown when document update fails
 */
export class DocumentUpdateError extends Error {
  constructor(
    message: string,
    public readonly code: DocumentUpdateErrorCode,
  ) {
    super(message);
    this.name = 'DocumentUpdateError';
  }
}

/**
 * Error codes for document update failures
 */
export enum DocumentUpdateErrorCode {
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_METADATA = 'INVALID_METADATA',
  WRITE_FAILED = 'WRITE_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
}
