// ABOUTME: Zod schemas for runtime validation of document models
// ABOUTME: Provides type-safe parsing and validation with detailed error messages

import { z } from 'zod';
import { PARACategory, ProjectStatus } from './types';
import { isWithinContextRoot } from '../config';

/**
 * ISO 8601 date string validator
 */
const isoDateString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?$/,
    'Invalid ISO 8601 date format',
  );

/**
 * Tag validator - alphanumeric with hyphens, lowercase
 */
const tag = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Tags must be lowercase alphanumeric with hyphens');

/**
 * Document ID validator - relative path within CONTEXT_ROOT
 */
const documentId = z.string().refine((path) => {
  // Allow empty path for validation
  if (path === '') return false;
  // Must not start with /
  if (path.startsWith('/')) return false;
  // Must not contain .. path traversal
  const segments = path.split('/');
  return !segments.includes('..');
}, 'Document ID must be a relative path without ..');

/**
 * File path validator - must be within CONTEXT_ROOT
 */
const contextPath = z.string().refine((path) => {
  try {
    return isWithinContextRoot(path);
  } catch {
    return false;
  }
}, 'Path must be within CONTEXT_ROOT');

/**
 * Base frontmatter schema
 */
export const frontmatterBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  tags: z.array(tag).optional(),
  created: isoDateString.optional(),
  modified: isoDateString.optional(),
  aliases: z.array(z.string()).optional(),
});

/**
 * PARA category enum schema
 */
export const paraCategorySchema = z.nativeEnum(PARACategory);

/**
 * Project status enum schema
 */
export const projectStatusSchema = z.nativeEnum(ProjectStatus);

/**
 * PARA frontmatter schema
 */
export const paraFrontmatterSchema = frontmatterBaseSchema.extend({
  category: paraCategorySchema,
  status: projectStatusSchema.optional(),
  due_date: isoDateString.optional(),
  parent: documentId.optional(),
});

/**
 * Validate PARA frontmatter consistency
 */
export const validParaFrontmatterSchema = paraFrontmatterSchema.refine(
  (data) => {
    // Status and due_date only valid for Projects
    if (data.category !== PARACategory.Projects) {
      return !data.status && !data.due_date;
    }
    return true;
  },
  {
    message: 'Status and due_date are only valid for Projects',
    path: ['category'],
  },
);

/**
 * Link frontmatter schema
 */
export const linkFrontmatterSchema = frontmatterBaseSchema.extend({
  links_to: z.array(documentId).optional(),
  backlinks: z.array(documentId).optional(),
});

/**
 * Base combined frontmatter schema (without refinement)
 */
const documentFrontmatterBaseSchema = z
  .object({
    ...paraFrontmatterSchema.shape,
    ...linkFrontmatterSchema.shape,
  })
  .catchall(z.unknown());

/**
 * Combined document frontmatter schema (with validation)
 */
export const documentFrontmatterSchema = documentFrontmatterBaseSchema.refine(
  (data) => {
    // Status and due_date only valid for Projects
    if (data.category !== PARACategory.Projects) {
      return !data.status && !data.due_date;
    }
    return true;
  },
  {
    message: 'Status and due_date are only valid for Projects',
    path: ['category'],
  },
);

/**
 * Partial document frontmatter schema for updates
 */
export const partialDocumentFrontmatterSchema = documentFrontmatterBaseSchema.partial();

/**
 * Document stats schema
 */
export const documentStatsSchema = z.object({
  size: z.number().int().nonnegative(),
  created: z.date(),
  modified: z.date(),
});

/**
 * Core document schema
 */
export const documentSchema = z.object({
  id: documentId,
  path: contextPath,
  frontmatter: documentFrontmatterSchema,
  content: z.string(),
  raw: z.string().optional(),
  stats: documentStatsSchema.optional(),
});

/**
 * PARA document schema
 */
export const paraDocumentSchema = documentSchema.extend({
  frontmatter: validParaFrontmatterSchema.and(documentFrontmatterSchema),
});

/**
 * Create document params schema
 */
export const createDocumentParamsSchema = z.object({
  path: documentId,
  title: z.string().min(1),
  content: z.string().optional(),
  tags: z.array(tag).optional(),
  category: paraCategorySchema.optional(),
  frontmatter: partialDocumentFrontmatterSchema.optional(),
});

/**
 * Create PARA document params schema
 */
export const createParaDocumentParamsSchema = createDocumentParamsSchema
  .extend({
    category: paraCategorySchema,
    status: projectStatusSchema.optional(),
    due_date: isoDateString.optional(),
    parent: documentId.optional(),
  })
  .refine(
    (data) => {
      // Validate PARA-specific rules
      if (data.category !== PARACategory.Projects) {
        return !data.status && !data.due_date;
      }
      return true;
    },
    {
      message: 'Status and due_date are only valid for Projects',
    },
  );

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(tag).optional(),
  category: paraCategorySchema.optional(),
  status: projectStatusSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Link query schema
 */
export const linkQuerySchema = z.object({
  documentId: documentId,
  includeForward: z.boolean().default(true),
  includeBacklinks: z.boolean().default(true),
  depth: z.number().int().positive().max(5).default(1),
});

/**
 * Update document params schema
 */
export const updateDocumentParamsSchema = z
  .object({
    id: documentId,
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    addTags: z.array(tag).optional(),
    removeTags: z.array(tag).optional(),
    frontmatter: partialDocumentFrontmatterSchema.optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided
      return !!(data.title || data.content || data.addTags || data.removeTags || data.frontmatter);
    },
    {
      message: 'At least one field must be provided for update',
    },
  );
