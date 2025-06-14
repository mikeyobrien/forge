// ABOUTME: Public API for document models, schemas, guards, and factories
// ABOUTME: Central export point for all document-related types and functions

// Export all types
export * from './types';

// Export schemas
export {
  // Base schemas
  frontmatterBaseSchema,
  paraCategorySchema,
  projectStatusSchema,

  // Frontmatter schemas
  paraFrontmatterSchema,
  validParaFrontmatterSchema,
  linkFrontmatterSchema,
  documentFrontmatterSchema,
  partialDocumentFrontmatterSchema,

  // Document schemas
  documentStatsSchema,
  documentSchema,
  paraDocumentSchema,

  // Operation schemas
  createDocumentParamsSchema,
  createParaDocumentParamsSchema,
  searchQuerySchema,
  linkQuerySchema,
  updateDocumentParamsSchema,
} from './schemas';

// Export all guards
export {
  // Document guards
  isDocument,
  isPARADocument,
  isDocumentPARA,

  // Frontmatter guards
  isValidFrontmatter,
  isPARAFrontmatter,
  isDocumentFrontmatter,

  // Category guards
  isInPARACategory,
  isProject,
  isArea,
  isResource,
  isArchived,

  // Utility guards
  isISODateString,
  isValidTag,
  isValidDocumentId,

  // Assertions
  assertDocument,
  assertPARADocument,
  extractValidFrontmatter,
} from './guards';

// Export all factories
export {
  // Core factories
  createDocument,
  createPARADocument,

  // Convenience factories
  createProject,
  createArea,
  createResource,
  createArchive,

  // Utilities
  cloneDocument,
  touchDocument,
} from './factories';
