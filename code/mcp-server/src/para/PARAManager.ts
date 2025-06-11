// ABOUTME: Manages PARA (Projects, Areas, Resources, Archives) directory structure
// ABOUTME: Handles path resolution, document organization, and security validation

import * as path from 'path';
import { PARACategory, isValidPARACategory, PARAStructure, PARADocument } from './types.js';
import { IFileSystem } from '../filesystem/IFileSystem.js';
import { SecurityError } from '../filesystem/security.js';

export class PARAManager {
  private readonly contextRoot: string;
  private readonly fileSystem: IFileSystem;
  private readonly structure: PARAStructure;

  constructor(contextRoot: string, fileSystem: IFileSystem) {
    this.contextRoot = path.resolve(contextRoot);
    this.fileSystem = fileSystem;
    this.structure = {
      [PARACategory.Projects]: path.join(this.contextRoot, PARACategory.Projects),
      [PARACategory.Areas]: path.join(this.contextRoot, PARACategory.Areas),
      [PARACategory.Resources]: path.join(this.contextRoot, PARACategory.Resources),
      [PARACategory.Archives]: path.join(this.contextRoot, PARACategory.Archives),
    };
  }

  async initializeStructure(): Promise<void> {
    const operations = Object.values(this.structure).map((categoryPath) =>
      this.fileSystem.createDirectory(categoryPath as string),
    );

    await Promise.all(operations);
  }

  getCategoryPath(category: PARACategory): string {
    return this.structure[category];
  }

  resolveDocumentPath(category: PARACategory, documentName: string): string {
    const sanitizedName = this.sanitizeDocumentName(documentName);
    const categoryPath = this.getCategoryPath(category);
    const fullPath = path.join(categoryPath, sanitizedName);

    this.validatePathSecurity(fullPath);
    return fullPath;
  }

  async moveDocument(sourcePath: string, targetCategory: PARACategory): Promise<string> {
    const resolvedSource = path.resolve(sourcePath);
    this.validatePathSecurity(resolvedSource);

    const documentName = path.basename(resolvedSource);
    const targetPath = this.resolveDocumentPath(targetCategory, documentName);

    if (await this.fileSystem.exists(targetPath)) {
      throw new Error(`Document already exists in ${targetCategory}: ${documentName}`);
    }

    await this.fileSystem.move(resolvedSource, targetPath);
    return targetPath;
  }

  getDocumentCategory(documentPath: string): PARACategory | null {
    const resolvedPath = path.resolve(documentPath);
    this.validatePathSecurity(resolvedPath);

    for (const [category, categoryPath] of Object.entries(this.structure)) {
      if (resolvedPath.startsWith(categoryPath + path.sep)) {
        return category as PARACategory;
      }
    }

    return null;
  }

  validateCategory(value: string): boolean {
    return isValidPARACategory(value);
  }

  async listDocuments(category: PARACategory): Promise<PARADocument[]> {
    const categoryPath = this.getCategoryPath(category);
    const entries = await this.fileSystem.readDirectory(categoryPath);

    const documents: PARADocument[] = [];

    for (const entry of entries) {
      if (entry.isFile && entry.name.endsWith('.md')) {
        documents.push({
          category,
          path: path.join(categoryPath, entry.name),
          name: entry.name,
        });
      }
    }

    return documents;
  }

  async getAllDocuments(): Promise<PARADocument[]> {
    const allDocuments: PARADocument[] = [];

    for (const category of Object.values(PARACategory)) {
      const documents = await this.listDocuments(category);
      allDocuments.push(...documents);
    }

    return allDocuments;
  }

  private sanitizeDocumentName(name: string): string {
    // Remove any path traversal attempts
    const sanitized = name.replace(/[/\\]/g, '_').replace(/\.{2,}/g, '_');

    // Ensure markdown extension
    if (!sanitized.endsWith('.md')) {
      return sanitized + '.md';
    }

    return sanitized;
  }

  private validatePathSecurity(pathToValidate: string): void {
    const resolved = path.resolve(pathToValidate);

    if (!resolved.startsWith(this.contextRoot)) {
      throw new SecurityError(
        `Path traversal attempt detected: ${pathToValidate} is outside CONTEXT_ROOT`,
      );
    }
  }

  getContextRoot(): string {
    return this.contextRoot;
  }

  getStructure(): Readonly<PARAStructure> {
    return { ...this.structure };
  }
}
