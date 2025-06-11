// ABOUTME: Type guard functions for runtime type checking of document models
// ABOUTME: Provides safe type narrowing with proper error handling

import {
  Document,
  DocumentFrontmatter,
  FrontmatterBase,
  PARADocument,
  PARAFrontmatter,
  PARACategory,
} from './types';
import {
  documentSchema,
  documentFrontmatterSchema,
  frontmatterBaseSchema,
  paraDocumentSchema,
  paraFrontmatterSchema,
} from './schemas';

/**
 * Check if a value is a valid Document
 */
export function isDocument(value: unknown): value is Document {
  try {
    documentSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a valid PARADocument
 */
export function isPARADocument(value: unknown): value is PARADocument {
  try {
    paraDocumentSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a Document is a PARADocument
 */
export function isDocumentPARA(doc: Document): doc is PARADocument {
  return isPARADocument(doc);
}

/**
 * Check if a value is valid base frontmatter
 */
export function isValidFrontmatter(value: unknown): value is FrontmatterBase {
  try {
    frontmatterBaseSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is valid PARA frontmatter
 */
export function isPARAFrontmatter(value: unknown): value is PARAFrontmatter {
  try {
    paraFrontmatterSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is valid document frontmatter
 */
export function isDocumentFrontmatter(value: unknown): value is DocumentFrontmatter {
  try {
    documentFrontmatterSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a document belongs to a specific PARA category
 */
export function isInPARACategory(doc: Document, category: PARACategory): boolean {
  return isPARADocument(doc) && doc.frontmatter.category === category;
}

/**
 * Check if a document is a Project
 */
export function isProject(doc: Document): boolean {
  return isInPARACategory(doc, PARACategory.Projects);
}

/**
 * Check if a document is an Area
 */
export function isArea(doc: Document): boolean {
  return isInPARACategory(doc, PARACategory.Areas);
}

/**
 * Check if a document is a Resource
 */
export function isResource(doc: Document): boolean {
  return isInPARACategory(doc, PARACategory.Resources);
}

/**
 * Check if a document is in Archives
 */
export function isArchived(doc: Document): boolean {
  return isInPARACategory(doc, PARACategory.Archives);
}

/**
 * Check if a value is a valid ISO date string
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const isoRegex = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?$/;
  if (!isoRegex.test(value)) return false;

  // Also check if it's a valid date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Check if a value is a valid tag
 */
export function isValidTag(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const tagRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return tagRegex.test(value);
}

/**
 * Check if a value is a valid document ID (relative path)
 */
export function isValidDocumentId(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  // Must not start with / or contain ..
  return !value.startsWith('/') && !value.includes('..');
}

/**
 * Type assertion function that throws if invalid
 */
export function assertDocument(value: unknown): asserts value is Document {
  const result = documentSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid document: ${result.error.message}`);
  }
}

/**
 * Type assertion function for PARA documents
 */
export function assertPARADocument(value: unknown): asserts value is PARADocument {
  const result = paraDocumentSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid PARA document: ${result.error.message}`);
  }
}

/**
 * Extract and validate frontmatter from a document
 */
export function extractValidFrontmatter(doc: Document): DocumentFrontmatter | null {
  try {
    documentFrontmatterSchema.parse(doc.frontmatter);
    return doc.frontmatter;
  } catch {
    return null;
  }
}
