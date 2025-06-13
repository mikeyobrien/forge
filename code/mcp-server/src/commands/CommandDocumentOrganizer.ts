// ABOUTME: Core implementation of Claude command output organization enhancement
// ABOUTME: Handles document placement, naming, metadata, and conflict resolution

import * as path from 'path';
import { IFileSystem } from '../filesystem/IFileSystem.js';
import { PARAManager } from '../para/PARAManager.js';
import { PARACategory, Document, DocumentFrontmatter } from '../models/types.js';
import { serializeDocument } from '../parsers/serializer.js';
import {
  CommandDocumentType,
  CreateCommandDocumentParams,
  OrganizeDocumentResult,
  CommandOrganizationConfig,
  CommandDocumentFrontmatter,
} from './types.js';

/**
 * Organizes command-generated documents according to the enhanced specification
 */
export class CommandDocumentOrganizer {
  constructor(
    private fileSystem: IFileSystem,
    _paraManager: PARAManager,
    private config: CommandOrganizationConfig,
  ) {
    // PARAManager is passed for consistency but not used directly
  }

  /**
   * Creates and organizes a command-generated document
   */
  async createDocument(params: CreateCommandDocumentParams): Promise<OrganizeDocumentResult> {
    // Determine category and project path
    const { category, projectPath } = await this.determineLocation(params);

    // Generate the document name
    const documentName = this.generateDocumentName(params);

    // Check for conflicts and resolve
    const { finalPath, conflictResolved, originalName } = await this.resolveNamingConflict(
      category,
      projectPath || undefined,
      documentName,
      params,
    );

    // Create the document with enhanced metadata
    await this.writeDocument(finalPath, params, category);

    // Update project index if configured
    if (this.config.updateIndexes && projectPath) {
      await this.updateProjectIndex(category, projectPath);
    }

    return {
      path: finalPath,
      conflictResolved,
      originalName: originalName || undefined,
      message: conflictResolved
        ? `Document created with more specific name: ${finalPath}`
        : `Document created: ${finalPath}`,
    };
  }

  /**
   * Determines the appropriate location for a document
   */
  private async determineLocation(
    params: CreateCommandDocumentParams,
  ): Promise<{ category: PARACategory; projectPath?: string }> {
    // If category is explicitly provided, use it
    if (params.category) {
      const result: { category: PARACategory; projectPath?: string } = {
        category: params.category,
      };
      if (params.project) {
        result.projectPath = params.project;
      }
      return result;
    }

    // Infer category based on document type and project
    if (params.project) {
      // Most project documents go in projects category
      return {
        category: PARACategory.Projects,
        projectPath: params.project,
      };
    }

    // Default categorization by document type
    let category: PARACategory;
    switch (params.documentType) {
      case CommandDocumentType.Design:
      case CommandDocumentType.Spec:
      case CommandDocumentType.Plan:
        category = PARACategory.Projects;
        break;

      case CommandDocumentType.Todo:
        category = PARACategory.Areas;
        break;

      case CommandDocumentType.Report:
      case CommandDocumentType.Review:
      case CommandDocumentType.Summary:
      default:
        category = PARACategory.Resources;
        break;
    }
    return { category };
  }

  /**
   * Generates a document name following the naming convention
   */
  private generateDocumentName(params: CreateCommandDocumentParams): string {
    const { documentType, baseName } = params;

    // Check for custom naming pattern
    const customPattern = this.config.namingPatterns?.[documentType];
    if (customPattern) {
      return customPattern.replace('{name}', baseName);
    }

    // Default pattern: [document-type]-[descriptive-name].md
    return `${documentType}-${this.sanitizeName(baseName)}.md`;
  }

  /**
   * Sanitizes a name for use in filenames
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Resolves naming conflicts by making names more specific
   */
  private async resolveNamingConflict(
    category: PARACategory,
    projectPath: string | undefined,
    documentName: string,
    params: CreateCommandDocumentParams,
  ): Promise<{ finalPath: string; conflictResolved: boolean; originalName?: string }> {
    // Build the initial path
    const pathComponents: string[] = [category];
    if (projectPath) {
      pathComponents.push(projectPath);
    }
    pathComponents.push(documentName);
    const initialPath = path.join(...pathComponents);

    // Check if file exists
    const absolutePath = path.join(this.config.contextRoot, initialPath);
    const exists = await this.fileSystem.exists(absolutePath);

    if (!exists) {
      return {
        finalPath: initialPath,
        conflictResolved: false,
      };
    }

    // File exists, make name more specific
    const baseName = documentName.replace('.md', '');
    const specificName = await this.makeNameMoreSpecific(baseName, params);
    const newParams = { ...params };

    // Recursively check the new name
    return {
      ...(await this.resolveNamingConflict(category, projectPath, specificName, newParams)),
      originalName: documentName,
    };
  }

  /**
   * Makes a document name more specific to avoid conflicts
   */
  private async makeNameMoreSpecific(
    baseName: string,
    params: CreateCommandDocumentParams,
  ): Promise<string> {
    const { documentType, title, tags } = params;

    // Extract key terms from title
    const titleTerms = title
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 3 && !['the', 'and', 'for', 'with'].includes(term))
      .slice(0, 2);

    // Try different specificity strategies
    const strategies = [
      // Add first significant tag
      (): string | null => {
        if (tags && tags.length > 0 && tags[0]) {
          return `${baseName}-${this.sanitizeName(tags[0])}`;
        }
        return null;
      },

      // Add key terms from title
      (): string | null => (titleTerms.length > 0 ? `${baseName}-${titleTerms.join('-')}` : null),

      // Add document type modifier
      (): string | null => {
        const modifiers: Record<CommandDocumentType, string[]> = {
          [CommandDocumentType.Design]: ['architecture', 'structure', 'schema'],
          [CommandDocumentType.Todo]: ['tasks', 'implementation', 'checklist'],
          [CommandDocumentType.Report]: ['analysis', 'results', 'findings'],
          [CommandDocumentType.Spec]: ['requirements', 'definition', 'details'],
          [CommandDocumentType.Review]: ['feedback', 'assessment', 'evaluation'],
          [CommandDocumentType.Plan]: ['roadmap', 'strategy', 'approach'],
          [CommandDocumentType.Summary]: ['overview', 'recap', 'highlights'],
        };
        const modifierList = modifiers[documentType];
        const modifier = modifierList ? modifierList[0] : null;
        return modifier ? `${baseName}-${modifier}` : null;
      },

      // Last resort: add timestamp component
      (): string => {
        const datePart = new Date().toISOString().split('T')[0];
        if (datePart) {
          const timestamp = datePart.replace(/-/g, '');
          return `${baseName}-${timestamp}`;
        }
        return `${baseName}-variant`;
      },
    ];

    // Try each strategy until we get a valid name
    for (const strategy of strategies) {
      const specificName = strategy();
      if (specificName) {
        return `${specificName}.md`;
      }
    }

    // Fallback (should never reach here)
    return `${baseName}-variant.md`;
  }

  /**
   * Writes the document with enhanced metadata
   */
  private async writeDocument(
    relativePath: string,
    params: CreateCommandDocumentParams,
    category: PARACategory,
  ): Promise<void> {
    const now = new Date().toISOString();

    // Build frontmatter
    const frontmatter: CommandDocumentFrontmatter = {
      title: params.title,
      category,
      created: now,
      modified: now,
      tags: params.tags,
      command_type: params.documentType,
      status: params.metadata?.status || 'active',
      generated_by: params.generatedBy,
    };

    // Add optional fields
    if (params.project) {
      frontmatter.project = params.project;
    }
    if (params.metadata?.implements) {
      frontmatter.implements = params.metadata.implements;
    }
    if (params.metadata?.supersedes) {
      frontmatter.supersedes = params.metadata.supersedes;
    }
    if (params.metadata?.related_docs) {
      frontmatter.related_docs = params.metadata.related_docs;
    }
    if (params.metadata?.context_source) {
      frontmatter.context_source = params.metadata.context_source;
    }

    // Create document directly without using createPARADocument to avoid config dependency
    const document: Document = {
      id: relativePath,
      path: path.join(this.config.contextRoot, relativePath),
      frontmatter: frontmatter as DocumentFrontmatter,
      content: params.content,
    };

    // Serialize document
    const serialized = serializeDocument(document);

    // Write to filesystem
    const absolutePath = path.join(this.config.contextRoot, relativePath);
    await this.fileSystem.writeFile(absolutePath, serialized);
  }

  /**
   * Updates the project index file
   */
  private async updateProjectIndex(category: PARACategory, projectPath: string): Promise<void> {
    const indexPath = path.join(category, projectPath, 'index.md');
    const absoluteIndexPath = path.join(this.config.contextRoot, indexPath);

    // Check if index exists
    const exists = await this.fileSystem.exists(absoluteIndexPath);

    if (!exists) {
      // Create new index
      const indexContent = this.generateProjectIndex(projectPath);
      await this.fileSystem.writeFile(absoluteIndexPath, indexContent);
    } else {
      // Update existing index (future enhancement)
      // For now, we'll skip updating to avoid complexity
    }
  }

  /**
   * Generates a project index file
   */
  private generateProjectIndex(projectName: string): string {
    const now = new Date().toISOString();
    return `---
title: ${this.titleCase(projectName)} Project Index
category: projects
created: ${now}
modified: ${now}
tags:
  - project-index
  - ${projectName}
---

# ${this.titleCase(projectName)} Project Index

This index provides an overview of all documents related to the ${projectName} project.

## Documents

_This index is automatically maintained by the command document organizer._

<!-- Document links will be automatically added here -->
`;
  }

  /**
   * Converts a string to title case
   */
  private titleCase(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
