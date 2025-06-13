// ABOUTME: Integration helpers for using command document organizer with existing tools
// ABOUTME: Provides wrapper functions for enhanced document creation

import { IFileSystem } from '../filesystem/IFileSystem.js';
import { PARAManager } from '../para/PARAManager.js';
import { CommandDocumentOrganizer } from './CommandDocumentOrganizer.js';
import { DocumentMigrator } from './DocumentMigrator.js';
import { BacklinkManager } from '../backlinks/BacklinkManager.js';
import {
  CommandDocumentType,
  CreateCommandDocumentParams,
  OrganizeDocumentResult,
  CommandOrganizationConfig,
} from './types.js';

/**
 * Creates a command document organizer instance
 */
export function createCommandOrganizer(
  fileSystem: IFileSystem,
  paraManager: PARAManager,
  contextRoot: string,
  options?: Partial<CommandOrganizationConfig>,
): CommandDocumentOrganizer {
  const config: CommandOrganizationConfig = {
    contextRoot,
    autoCreateProjectDirs: true,
    updateIndexes: true,
    ...options,
  };

  return new CommandDocumentOrganizer(fileSystem, paraManager, config);
}

/**
 * Creates a document migrator instance
 */
export function createDocumentMigrator(
  fileSystem: IFileSystem,
  paraManager: PARAManager,
  contextRoot: string,
  backlinkManager?: BacklinkManager,
): DocumentMigrator {
  return new DocumentMigrator(fileSystem, paraManager, contextRoot, backlinkManager);
}

/**
 * Helper to create a command document with minimal parameters
 */
export async function createCommandDocument(
  organizer: CommandDocumentOrganizer,
  type: CommandDocumentType,
  name: string,
  title: string,
  content: string,
  options?: {
    project?: string;
    tags?: string[];
    generatedBy?: string;
    metadata?: Partial<CreateCommandDocumentParams['metadata']>;
  },
): Promise<OrganizeDocumentResult> {
  const params: CreateCommandDocumentParams = {
    documentType: type,
    baseName: name,
    title,
    content,
    tags: options?.tags || [],
    generatedBy: options?.generatedBy || 'manual',
    ...(options?.project && { project: options.project }),
    ...(options?.metadata && { metadata: options.metadata }),
  };

  return organizer.createDocument(params);
}

/**
 * Maps legacy document types to new command document types
 */
export function mapLegacyDocumentType(filename: string): CommandDocumentType | null {
  const mappings: Record<string, CommandDocumentType> = {
    'prompt-execution': CommandDocumentType.Report,
    'implementation-plan': CommandDocumentType.Plan,
    brainstorm: CommandDocumentType.Design,
    tracker: CommandDocumentType.Todo,
    reference: CommandDocumentType.Summary,
  };

  for (const [pattern, type] of Object.entries(mappings)) {
    if (filename.includes(pattern)) {
      return type;
    }
  }

  return null;
}

/**
 * Extracts command metadata from existing frontmatter
 */
export function extractCommandMetadata(
  frontmatter: Record<string, unknown>,
): Partial<CreateCommandDocumentParams['metadata']> {
  const metadata: Partial<CreateCommandDocumentParams['metadata']> = {};

  if (frontmatter.command_type) {
    // Already has command metadata
    if (frontmatter.implements) metadata.implements = frontmatter.implements as string;
    if (frontmatter.supersedes) metadata.supersedes = frontmatter.supersedes as string;
    if (frontmatter.related_docs) metadata.related_docs = frontmatter.related_docs as string[];
    if (frontmatter.context_source)
      metadata.context_source = frontmatter.context_source as string[];
  }

  return metadata;
}

/**
 * Determines project from various sources
 */
export function determineProject(
  path: string,
  frontmatter: Record<string, unknown>,
  explicitProject?: string,
): string | undefined {
  // Explicit project takes precedence
  if (explicitProject) {
    return explicitProject;
  }

  // Check frontmatter
  if (frontmatter.project && typeof frontmatter.project === 'string') {
    return frontmatter.project;
  }

  // Extract from path if in projects folder
  const parts = path.split('/');
  if (parts[0] === 'projects' && parts.length > 1) {
    return parts[1];
  }

  return undefined;
}
