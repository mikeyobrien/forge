// ABOUTME: Migration script for reorganizing existing command-generated documents
// ABOUTME: Handles moving documents to new structure and updating metadata

import * as path from 'path';
import { IFileSystem } from '../filesystem/IFileSystem.js';
import { PARAManager } from '../para/PARAManager.js';
import { parseFrontmatter } from '../parsers/index.js';
import { serializeDocument } from '../parsers/serializer.js';
import { Document, PARACategory, DocumentFrontmatter } from '../models/types.js';
import { CommandDocumentType, CommandDocumentFrontmatter } from './types.js';
import { BacklinkManager } from '../backlinks/BacklinkManager.js';

/**
 * Migration result for a single document
 */
export interface MigrationResult {
  originalPath: string;
  newPath: string;
  success: boolean;
  error?: string;
  metadataUpdated: boolean;
  linksUpdated: number;
}

/**
 * Overall migration summary
 */
export interface MigrationSummary {
  totalDocuments: number;
  successful: number;
  failed: number;
  results: MigrationResult[];
  projectIndexesCreated: string[];
}

/**
 * Migrates existing documents to the new organization structure
 */
export class DocumentMigrator {
  private results: MigrationResult[] = [];
  private projectIndexes = new Set<string>();

  constructor(
    private fileSystem: IFileSystem,
    _paraManager: PARAManager,
    private contextRoot: string,
    private backlinkManager?: BacklinkManager,
  ) {
    // PARAManager is passed for consistency but not used directly
  }

  /**
   * Migrates all documents in the context directory
   */
  async migrateAll(dryRun = false): Promise<MigrationSummary> {
    console.log(`Starting migration${dryRun ? ' (DRY RUN)' : ''}...`);

    // Find all markdown files
    const documents = await this.findAllDocuments();
    console.log(`Found ${documents.length} documents to process`);

    // Process each document
    for (const docPath of documents) {
      await this.migrateDocument(docPath, dryRun);
    }

    // Create project indexes
    if (!dryRun) {
      await this.createProjectIndexes();
    }

    // Generate summary
    const successful = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    return {
      totalDocuments: documents.length,
      successful,
      failed,
      results: this.results,
      projectIndexesCreated: Array.from(this.projectIndexes),
    };
  }

  /**
   * Finds all markdown documents in the context directory
   */
  private async findAllDocuments(): Promise<string[]> {
    const documents: string[] = [];

    const scanDirectory = async (dir: string): Promise<void> => {
      const entries = await this.fileSystem.readDirectory(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory) {
          await scanDirectory(fullPath);
        } else if (entry.name.endsWith('.md') && !entry.name.startsWith('.')) {
          const relativePath = path.relative(this.contextRoot, fullPath);
          documents.push(relativePath);
        }
      }
    };

    await scanDirectory(this.contextRoot);
    return documents;
  }

  /**
   * Migrates a single document
   */
  private async migrateDocument(relativePath: string, dryRun: boolean): Promise<void> {
    console.log(`Processing: ${relativePath}`);

    try {
      // Read the document
      const absolutePath = path.join(this.contextRoot, relativePath);
      const content = await this.fileSystem.readFile(absolutePath);
      const parsed = parseFrontmatter(content);
      const frontmatter = parsed.metadata;
      const body = parsed.content;

      // Determine if this is a command-generated document
      const commandType = this.detectCommandType(relativePath, frontmatter);
      if (!commandType) {
        console.log(`  Skipping: Not a command-generated document`);
        return;
      }

      // Generate new path
      const newPath = await this.generateNewPath(relativePath, frontmatter, commandType);

      // Check if migration is needed
      if (newPath === relativePath && !this.needsMetadataUpdate(frontmatter)) {
        console.log(`  No changes needed`);
        return;
      }

      // Update metadata
      const updatedFrontmatter = this.updateMetadata(frontmatter, commandType, relativePath);

      // Create the document object
      const document: Document = {
        id: relativePath,
        path: absolutePath,
        frontmatter: updatedFrontmatter as DocumentFrontmatter,
        content: body,
      };

      if (!dryRun) {
        // Write to new location
        const newAbsolutePath = path.join(this.contextRoot, newPath);
        const serialized = serializeDocument(document);
        // Ensure directory exists
        const dir = path.dirname(newAbsolutePath);
        try {
          await this.fileSystem.createDirectory(dir);
        } catch {
          // Directory might already exist
        }
        await this.fileSystem.writeFile(newAbsolutePath, serialized);

        // Update backlinks if path changed
        let linksUpdated = 0;
        if (newPath !== relativePath) {
          linksUpdated = this.updateIncomingLinks(relativePath, newPath);

          // Delete old file - using writeFile with empty content as workaround
          // TODO: Add deleteFile to IFileSystem interface
          await this.fileSystem.writeFile(absolutePath, '');
        }

        // Track project for index creation
        const projectPath = this.extractProjectPath(newPath);
        if (projectPath) {
          this.projectIndexes.add(projectPath);
        }

        this.results.push({
          originalPath: relativePath,
          newPath,
          success: true,
          metadataUpdated: true,
          linksUpdated,
        });

        console.log(`  ✓ Migrated to: ${newPath}`);
      } else {
        console.log(`  Would migrate to: ${newPath}`);
      }
    } catch (error) {
      this.results.push({
        originalPath: relativePath,
        newPath: relativePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadataUpdated: false,
        linksUpdated: 0,
      });
      console.error(`  ✗ Error: ${String(error)}`);
    }
  }

  /**
   * Detects the command type from filename and frontmatter
   */
  private detectCommandType(filePath: string, frontmatter: Record<string, unknown>): CommandDocumentType | null {
    const filename = filePath.split('/').pop()?.toLowerCase() || '';

    // Check frontmatter first
    if (frontmatter['command_type']) {
      return frontmatter['command_type'] as CommandDocumentType;
    }

    // Detect from filename patterns
    const patterns: [RegExp, CommandDocumentType][] = [
      [/design[-_]/, CommandDocumentType.Design],
      [/todo[-_]/, CommandDocumentType.Todo],
      [/report[-_]/, CommandDocumentType.Report],
      [/spec[-_]/, CommandDocumentType.Spec],
      [/review[-_]/, CommandDocumentType.Review],
      [/plan[-_]/, CommandDocumentType.Plan],
      [/summary[-_]/, CommandDocumentType.Summary],
    ];

    for (const [pattern, type] of patterns) {
      if (pattern.test(filename)) {
        return type;
      }
    }

    // Check for prompt-execution files
    if (filename.includes('prompt-execution')) {
      return CommandDocumentType.Report;
    }

    return null;
  }

  /**
   * Generates new path for document
   */
  private async generateNewPath(
    originalPath: string,
    frontmatter: Record<string, unknown>,
    _commandType: CommandDocumentType,
  ): Promise<string> {
    const filename = path.basename(originalPath);

    // Remove date from filename
    const newFilename = this.removeDateFromFilename(filename);

    // Determine category and project
    const category = (frontmatter['category'] as PARACategory) || PARACategory.Resources;
    const project = this.extractProjectFromDocument(originalPath, frontmatter);

    // Build new path
    const pathComponents: string[] = [category];
    if (project !== null) {
      pathComponents.push(project);
    }
    pathComponents.push(newFilename);

    return Promise.resolve(path.join(...pathComponents));
  }

  /**
   * Removes date patterns from filename
   */
  private removeDateFromFilename(filename: string): string {
    // Remove various date patterns
    return filename
      .replace(/-\d{8}\.md$/, '.md') // -20250106.md
      .replace(/-\d{4}-\d{2}-\d{2}\.md$/, '.md') // -2025-06-11.md
      .replace(/_\d{8}\.md$/, '.md') // _20250106.md
      .replace(/_\d{4}-\d{2}-\d{2}\.md$/, '.md'); // _2025-06-11.md
  }

  /**
   * Extracts project name from document path or frontmatter
   */
  private extractProjectFromDocument(path: string, frontmatter: Record<string, unknown>): string | null {
    // Check frontmatter
    if (frontmatter['project']) {
      return frontmatter['project'] as string;
    }

    // Extract from path if in projects folder
    const parts = path.split('/');
    if (parts[0] === 'projects' && parts.length > 2 && parts[1]) {
      return parts[1];
    }

    // Try to infer from filename
    const filename = path.split('/').pop() || '';
    const projectPatterns = [/^(.+?)-design/, /^(.+?)-todo/, /^(.+?)-plan/, /^(.+?)-spec/];

    for (const pattern of projectPatterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Checks if metadata needs updating
   */
  private needsMetadataUpdate(frontmatter: Record<string, unknown>): boolean {
    const requiredFields = ['command_type', 'status', 'generated_by'];
    return requiredFields.some((field) => !(field in frontmatter));
  }

  /**
   * Updates document metadata
   */
  private updateMetadata(frontmatter: Record<string, unknown>, commandType: CommandDocumentType, originalPath: string): CommandDocumentFrontmatter {
    const now = new Date().toISOString();

    const enhanced: CommandDocumentFrontmatter = {
      ...frontmatter,
      modified: now,
      command_type: commandType,
      status: (frontmatter['status'] as 'active' | 'completed' | 'superseded') || 'active',
      generated_by: (frontmatter['generated_by'] as string) || this.inferGeneratedBy(commandType),
    } as CommandDocumentFrontmatter;

    const project =
      (frontmatter['project'] as string | undefined) ||
      this.extractProjectFromDocument(originalPath, frontmatter) ||
      undefined;
    if (project) {
      enhanced.project = project;
    }

    return enhanced;
  }

  /**
   * Infers which command generated the document
   */
  private inferGeneratedBy(commandType: CommandDocumentType): string {
    const commandMap: Record<CommandDocumentType, string> = {
      [CommandDocumentType.Design]: '/plan',
      [CommandDocumentType.Todo]: '/build',
      [CommandDocumentType.Report]: '/review',
      [CommandDocumentType.Spec]: '/spec',
      [CommandDocumentType.Review]: '/review',
      [CommandDocumentType.Plan]: '/plan',
      [CommandDocumentType.Summary]: '/code',
    };

    return commandMap[commandType] || '/unknown';
  }

  /**
   * Updates incoming links to point to new location
   */
  private updateIncomingLinks(_oldPath: string, _newPath: string): number {
    if (!this.backlinkManager) {
      return 0;
    }

    // This would use the backlink manager to find and update all incoming links
    // For now, returning 0 as this requires integration with the link update system
    return 0;
  }

  /**
   * Extracts project path from document path
   */
  private extractProjectPath(docPath: string): string | null {
    const parts = docPath.split('/');
    if (parts[0] === PARACategory.Projects && parts.length > 2 && parts[1]) {
      return path.join(parts[0], parts[1]);
    }
    return null;
  }

  /**
   * Creates index files for all projects
   */
  private async createProjectIndexes(): Promise<void> {
    for (const projectPath of this.projectIndexes) {
      if (!projectPath) continue;
      const indexPath = path.join(projectPath, 'index.md');
      const absolutePath = path.join(this.contextRoot, indexPath);

      if (!(await this.fileSystem.exists(absolutePath))) {
        const projectName = path.basename(projectPath);
        const indexContent = this.generateProjectIndex(projectName);
        await this.fileSystem.writeFile(absolutePath, indexContent);
        console.log(`Created project index: ${indexPath}`);
      }
    }
  }

  /**
   * Generates a project index file
   */
  private generateProjectIndex(projectName: string): string {
    const now = new Date().toISOString();
    return `---
title: ${this.titleCase(projectName)} Project
category: projects
created: ${now}
modified: ${now}
tags:
  - project-index
  - ${projectName}
---

# ${this.titleCase(projectName)} Project

This is the main index for the ${this.titleCase(projectName)} project.

## Documents

_Documents in this project will be listed here._
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
