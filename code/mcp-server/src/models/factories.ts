// ABOUTME: Factory functions for creating valid document instances
// ABOUTME: Ensures all documents have proper defaults and validation

import { join, normalize } from 'path';
import {
  Document,
  PARADocument,
  CreateDocumentParams,
  CreatePARADocumentParams,
  DocumentFrontmatter,
  PARACategory,
  ProjectStatus,
} from './types';
import { createDocumentParamsSchema, createParaDocumentParamsSchema } from './schemas';
import { getConfigSync } from '../config';

/**
 * Generate ISO date string for current time
 */
function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Normalize a document path relative to CONTEXT_ROOT
 */
function normalizeDocumentPath(path: string): { id: string; absolutePath: string } {
  const config = getConfigSync();

  // Handle empty path
  if (!path || path.trim() === '') {
    throw new Error('Path cannot be empty');
  }

  // Clean the path: remove leading ./ and handle leading /
  let cleanPath = path;
  if (cleanPath.startsWith('./')) {
    cleanPath = cleanPath.slice(2);
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  // Normalize to resolve .. and .
  const normalizedPath = normalize(cleanPath);

  // Ensure .md extension
  const idWithExt = normalizedPath.endsWith('.md') ? normalizedPath : `${normalizedPath}.md`;

  const absolutePath = join(config.contextRoot, idWithExt);

  return { id: idWithExt, absolutePath };
}

/**
 * Create a new document with defaults
 */
export function createDocument(params: CreateDocumentParams): Document {
  // First normalize the path
  const { id, absolutePath } = normalizeDocumentPath(params.path);

  // Then validate parameters with normalized path
  createDocumentParamsSchema.parse({
    ...params,
    path: id.replace(/\.md$/, ''), // Remove .md for validation
  });

  const now = getCurrentISODate();

  // Build frontmatter with defaults
  const frontmatter: DocumentFrontmatter = {
    title: params.title,
    created: now,
    modified: now,
    category: params.category || PARACategory.Resources,
    ...(params.frontmatter || {}),
  };

  // Add tags if provided
  if (params.tags && params.tags.length > 0) {
    frontmatter.tags = params.tags;
  }

  // Build the document
  const document: Document = {
    id,
    path: absolutePath,
    frontmatter,
    content: params.content || '',
  };

  return document;
}

/**
 * Create a new PARA document with category-specific defaults
 */
export function createPARADocument(params: CreatePARADocumentParams): PARADocument {
  // First normalize the path
  const { id, absolutePath } = normalizeDocumentPath(params.path);

  // Then validate parameters with normalized path
  createParaDocumentParamsSchema.parse({
    ...params,
    path: id.replace(/\.md$/, ''), // Remove .md for validation
  });

  const now = getCurrentISODate();

  // Build PARA-specific frontmatter
  const frontmatter: DocumentFrontmatter = {
    title: params.title,
    created: now,
    modified: now,
    category: params.category,
    ...(params.frontmatter || {}),
  };

  // Add project-specific fields
  if (params.category === PARACategory.Projects) {
    if (params.status) {
      frontmatter.status = params.status;
    } else {
      // Default status for new projects
      frontmatter.status = ProjectStatus.Active;
    }

    if (params.due_date) {
      frontmatter.due_date = params.due_date;
    }
  }

  // Add parent if provided
  if (params.parent) {
    frontmatter.parent = params.parent;
  }

  // Add tags if provided
  if (params.tags && params.tags.length > 0) {
    frontmatter.tags = params.tags;
  }

  // Build the PARA document
  const document: PARADocument = {
    id,
    path: absolutePath,
    frontmatter,
    content: params.content || '',
  };

  return document;
}

/**
 * Create a project document
 */
export function createProject(
  path: string,
  title: string,
  options?: {
    content?: string;
    tags?: string[];
    status?: ProjectStatus;
    due_date?: string;
    parent?: string;
  },
): PARADocument {
  return createPARADocument({
    path,
    title,
    category: PARACategory.Projects,
    ...options,
  });
}

/**
 * Create an area document
 */
export function createArea(
  path: string,
  title: string,
  options?: {
    content?: string;
    tags?: string[];
    parent?: string;
  },
): PARADocument {
  return createPARADocument({
    path,
    title,
    category: PARACategory.Areas,
    ...options,
  });
}

/**
 * Create a resource document
 */
export function createResource(
  path: string,
  title: string,
  options?: {
    content?: string;
    tags?: string[];
    parent?: string;
  },
): PARADocument {
  return createPARADocument({
    path,
    title,
    category: PARACategory.Resources,
    ...options,
  });
}

/**
 * Create an archive document
 */
export function createArchive(
  path: string,
  title: string,
  options?: {
    content?: string;
    tags?: string[];
    parent?: string;
  },
): PARADocument {
  return createPARADocument({
    path,
    title,
    category: PARACategory.Archives,
    ...options,
  });
}

/**
 * Clone a document with a new path
 */
export function cloneDocument(doc: Document, newPath: string): Document {
  const { id, absolutePath } = normalizeDocumentPath(newPath);

  return {
    ...doc,
    id,
    path: absolutePath,
    frontmatter: {
      ...doc.frontmatter,
      modified: getCurrentISODate(),
    },
  };
}

/**
 * Update document modified timestamp
 */
export function touchDocument(doc: Document): Document {
  return {
    ...doc,
    frontmatter: {
      ...doc.frontmatter,
      modified: getCurrentISODate(),
    },
  };
}
