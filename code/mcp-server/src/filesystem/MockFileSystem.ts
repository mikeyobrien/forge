// ABOUTME: In-memory mock implementation of IFileSystem for testing
// ABOUTME: Provides a fully functional filesystem that exists only in memory

import * as path from 'path';
import { IFileSystem, FileStats } from './IFileSystem.js';
import { validatePath, validateFilename } from './security.js';

interface MockFile {
  content: string;
  mtime: Date;
  birthtime: Date;
}

interface MockDirectory {
  mtime: Date;
  birthtime: Date;
}

export class MockFileSystem implements IFileSystem {
  private files: Map<string, MockFile> = new Map();
  private directories: Map<string, MockDirectory> = new Map();

  constructor(private readonly contextRoot: string) {
    // Ensure context root is absolute
    this.contextRoot = path.resolve(contextRoot);
    // Root directory always exists
    this.directories.set('', { mtime: new Date(), birthtime: new Date() });
  }

  readFile(inputPath: string): Promise<string> {
    try {
      const safePath = validatePath(inputPath, this.contextRoot);
      const normalizedPath = this.normalizePath(safePath);

      const file = this.files.get(normalizedPath);
      if (!file) {
        return Promise.reject(new Error(`File not found: ${inputPath}`));
      }

      return Promise.resolve(file.content);
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async writeFile(inputPath: string, content: string): Promise<void> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const normalizedPath = this.normalizePath(safePath);

    // Validate filename
    const filename = path.basename(safePath);
    validateFilename(filename);

    // Ensure parent directory exists
    const dir = path.dirname(normalizedPath);
    if (dir && dir !== '.' && !this.directories.has(dir)) {
      await this.mkdir(dir, true);
    }

    const now = new Date();
    this.files.set(normalizedPath, {
      content,
      mtime: now,
      birthtime: this.files.get(normalizedPath)?.birthtime || now,
    });
  }

  exists(inputPath: string): Promise<boolean> {
    try {
      const safePath = validatePath(inputPath, this.contextRoot);
      const normalizedPath = this.normalizePath(safePath);
      return Promise.resolve(
        this.files.has(normalizedPath) || this.directories.has(normalizedPath),
      );
    } catch {
      return Promise.resolve(false);
    }
  }

  async mkdir(inputPath: string, recursive: boolean = false): Promise<void> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const normalizedPath = this.normalizePath(safePath);

    if (this.directories.has(normalizedPath)) {
      return; // Directory already exists
    }

    if (this.files.has(normalizedPath)) {
      throw new Error(`Path exists as a file: ${inputPath}`);
    }

    // Check parent directory
    const parent = path.dirname(normalizedPath);
    if (parent && parent !== '.' && !this.directories.has(parent)) {
      if (!recursive) {
        throw new Error(`Parent directory does not exist: ${parent}`);
      }
      await this.mkdir(parent, true);
    }

    const now = new Date();
    this.directories.set(normalizedPath, { mtime: now, birthtime: now });
  }

  readdir(inputPath: string): Promise<string[]> {
    try {
      const safePath = validatePath(inputPath, this.contextRoot);
      const normalizedPath = this.normalizePath(safePath);

      // Root directory (.) always exists
      if (normalizedPath !== '.' && !this.directories.has(normalizedPath)) {
        return Promise.reject(new Error(`Directory not found: ${inputPath}`));
      }

      const entries = new Set<string>();
      const isRoot = normalizedPath === '.' || normalizedPath === '';
      const prefix = isRoot ? '' : normalizedPath + '/';

      // Find all entries that are direct children
      for (const filePath of this.files.keys()) {
        if (isRoot) {
          // For root, include files that don't have a '/'
          const firstSlash = filePath.indexOf('/');
          if (firstSlash === -1) {
            entries.add(filePath);
          } else {
            // Add the first directory component
            entries.add(filePath.substring(0, firstSlash));
          }
        } else if (filePath.startsWith(prefix)) {
          const relative = filePath.substring(prefix.length);
          const firstSlash = relative.indexOf('/');
          if (firstSlash === -1) {
            entries.add(relative);
          }
        }
      }

      for (const dirPath of this.directories.keys()) {
        if (dirPath === '' || dirPath === '.') continue; // Skip root itself

        if (isRoot) {
          // For root, include directories that don't have a '/'
          const firstSlash = dirPath.indexOf('/');
          if (firstSlash === -1) {
            entries.add(dirPath);
          } else {
            // Add the first directory component
            entries.add(dirPath.substring(0, firstSlash));
          }
        } else if (dirPath.startsWith(prefix) && dirPath !== normalizedPath) {
          const relative = dirPath.substring(prefix.length);
          const firstSlash = relative.indexOf('/');
          if (firstSlash === -1) {
            entries.add(relative);
          }
        }
      }

      return Promise.resolve(Array.from(entries).sort());
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  stat(inputPath: string): Promise<FileStats> {
    try {
      const safePath = validatePath(inputPath, this.contextRoot);
      const normalizedPath = this.normalizePath(safePath);

      const file = this.files.get(normalizedPath);
      if (file) {
        return Promise.resolve({
          isFile: () => true,
          isDirectory: () => false,
          size: Buffer.byteLength(file.content, 'utf-8'),
          mtime: file.mtime,
          birthtime: file.birthtime,
        });
      }

      const dir = this.directories.get(normalizedPath);
      if (dir) {
        return Promise.resolve({
          isFile: () => false,
          isDirectory: () => true,
          size: 0,
          mtime: dir.mtime,
          birthtime: dir.birthtime,
        });
      }

      return Promise.reject(new Error(`Path not found: ${inputPath}`));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  unlink(inputPath: string): Promise<void> {
    try {
      const safePath = validatePath(inputPath, this.contextRoot);
      const normalizedPath = this.normalizePath(safePath);

      if (!this.files.has(normalizedPath)) {
        return Promise.reject(new Error(`File not found: ${inputPath}`));
      }

      this.files.delete(normalizedPath);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async rename(oldInputPath: string, newInputPath: string): Promise<void> {
    const oldSafePath = validatePath(oldInputPath, this.contextRoot);
    const newSafePath = validatePath(newInputPath, this.contextRoot);

    const oldNormalized = this.normalizePath(oldSafePath);
    const newNormalized = this.normalizePath(newSafePath);

    // Validate new filename
    const newFilename = path.basename(newSafePath);
    validateFilename(newFilename);

    // Handle file rename
    const file = this.files.get(oldNormalized);
    if (file) {
      // Ensure destination directory exists
      const newDir = path.dirname(newNormalized);
      if (newDir && newDir !== '.' && !this.directories.has(newDir)) {
        await this.mkdir(newDir, true);
      }

      this.files.set(newNormalized, { ...file, mtime: new Date() });
      this.files.delete(oldNormalized);
      return;
    }

    // Handle directory rename
    const dir = this.directories.get(oldNormalized);
    if (dir) {
      // Move the directory
      this.directories.set(newNormalized, { ...dir, mtime: new Date() });
      this.directories.delete(oldNormalized);

      // Move all contents
      const oldPrefix = oldNormalized ? oldNormalized + '/' : '';
      const newPrefix = newNormalized ? newNormalized + '/' : '';

      // Move files
      for (const [filePath, fileData] of this.files.entries()) {
        if (filePath.startsWith(oldPrefix)) {
          const newPath = newPrefix + filePath.substring(oldPrefix.length);
          this.files.set(newPath, fileData);
          this.files.delete(filePath);
        }
      }

      // Move subdirectories
      for (const [dirPath, dirData] of this.directories.entries()) {
        if (dirPath.startsWith(oldPrefix)) {
          const newPath = newPrefix + dirPath.substring(oldPrefix.length);
          this.directories.set(newPath, dirData);
          this.directories.delete(dirPath);
        }
      }

      return;
    }

    throw new Error(`Source not found: ${oldInputPath}`);
  }

  resolvePath(inputPath: string): string {
    const safePath = validatePath(inputPath, this.contextRoot);
    return path.join(this.contextRoot, safePath);
  }

  // Helper method to normalize paths for consistent storage
  private normalizePath(inputPath: string): string {
    // Remove leading/trailing slashes and normalize
    return inputPath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
  }

  // Test helper: preset file structure
  preset(structure: Record<string, string | null>): void {
    for (const [filepath, content] of Object.entries(structure)) {
      if (content === null) {
        // Create directory
        const safePath = validatePath(filepath, this.contextRoot);
        const normalizedPath = this.normalizePath(safePath);
        const now = new Date();
        this.directories.set(normalizedPath, { mtime: now, birthtime: now });
      } else {
        // Create file with content
        const safePath = validatePath(filepath, this.contextRoot);
        const normalizedPath = this.normalizePath(safePath);

        // Ensure parent directories exist
        const parts = normalizedPath.split('/');
        for (let i = 1; i < parts.length; i++) {
          const dirPath = parts.slice(0, i).join('/');
          if (!this.directories.has(dirPath)) {
            const now = new Date();
            this.directories.set(dirPath, { mtime: now, birthtime: now });
          }
        }

        const now = new Date();
        this.files.set(normalizedPath, {
          content,
          mtime: now,
          birthtime: now,
        });
      }
    }
  }
}
