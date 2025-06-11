// ABOUTME: Concrete implementation of IFileSystem using Node.js fs module
// ABOUTME: Enforces security constraints and normalizes all paths relative to CONTEXT_ROOT

import * as fs from 'fs/promises';
import * as path from 'path';
import { IFileSystem, FileStats } from './IFileSystem.js';
import { validatePath, validateFilename, isPathSafe, SecurityError } from './security.js';

interface NodeError extends Error {
  code?: string;
}

export class FileSystem implements IFileSystem {
  constructor(private readonly contextRoot: string) {
    // Ensure context root is absolute
    this.contextRoot = path.resolve(contextRoot);
  }

  async readFile(inputPath: string): Promise<string> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const fullPath = path.join(this.contextRoot, safePath);

    try {
      // Check for symlink escapes only if file exists
      try {
        await fs.access(fullPath);
        if (!(await isPathSafe(fullPath, this.contextRoot, fs.realpath))) {
          throw new SecurityError(`Symbolic link escape detected: ${inputPath}`);
        }
      } catch (error) {
        if ((error as NodeError).code === 'ENOENT') {
          throw new Error(`File not found: ${inputPath}`);
        }
        throw error;
      }

      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        throw new Error(`File not found: ${inputPath}`);
      }
      throw error;
    }
  }

  async writeFile(inputPath: string, content: string): Promise<void> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const fullPath = path.join(this.contextRoot, safePath);

    // Validate filename
    const filename = path.basename(safePath);
    validateFilename(filename);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async exists(inputPath: string): Promise<boolean> {
    try {
      const safePath = validatePath(inputPath, this.contextRoot);
      const fullPath = path.join(this.contextRoot, safePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(inputPath: string, recursive: boolean = false): Promise<void> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const fullPath = path.join(this.contextRoot, safePath);

    await fs.mkdir(fullPath, { recursive });
  }

  async readdir(inputPath: string): Promise<string[]> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const fullPath = path.join(this.contextRoot, safePath);

    try {
      // Check if directory exists first
      await fs.access(fullPath);

      // Check for symlink escapes
      if (!(await isPathSafe(fullPath, this.contextRoot, fs.realpath))) {
        throw new SecurityError(`Symbolic link escape detected: ${inputPath}`);
      }

      return await fs.readdir(fullPath);
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        throw new Error(`Directory not found: ${inputPath}`);
      }
      throw error;
    }
  }

  async stat(inputPath: string): Promise<FileStats> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const fullPath = path.join(this.contextRoot, safePath);

    try {
      // First get stats to check if path exists
      const stats = await fs.stat(fullPath);

      // Check for symlink escapes
      if (!(await isPathSafe(fullPath, this.contextRoot, fs.realpath))) {
        throw new SecurityError(`Symbolic link escape detected: ${inputPath}`);
      }

      return {
        isFile: () => stats.isFile(),
        isDirectory: () => stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime,
        birthtime: stats.birthtime,
      };
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        throw new Error(`Path not found: ${inputPath}`);
      }
      throw error;
    }
  }

  async unlink(inputPath: string): Promise<void> {
    const safePath = validatePath(inputPath, this.contextRoot);
    const fullPath = path.join(this.contextRoot, safePath);

    try {
      // Check if file exists first
      await fs.access(fullPath);

      // Check for symlink escapes
      if (!(await isPathSafe(fullPath, this.contextRoot, fs.realpath))) {
        throw new SecurityError(`Symbolic link escape detected: ${inputPath}`);
      }

      await fs.unlink(fullPath);
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        throw new Error(`File not found: ${inputPath}`);
      }
      throw error;
    }
  }

  async rename(oldInputPath: string, newInputPath: string): Promise<void> {
    const oldSafePath = validatePath(oldInputPath, this.contextRoot);
    const newSafePath = validatePath(newInputPath, this.contextRoot);

    const oldFullPath = path.join(this.contextRoot, oldSafePath);
    const newFullPath = path.join(this.contextRoot, newSafePath);

    // Validate new filename
    const newFilename = path.basename(newSafePath);
    validateFilename(newFilename);

    try {
      // Check if source exists
      await fs.access(oldFullPath);

      // Check for symlink escapes on source
      if (!(await isPathSafe(oldFullPath, this.contextRoot, fs.realpath))) {
        throw new SecurityError(`Symbolic link escape detected: ${oldInputPath}`);
      }

      // Ensure destination directory exists
      const newDir = path.dirname(newFullPath);
      await fs.mkdir(newDir, { recursive: true });

      await fs.rename(oldFullPath, newFullPath);
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        throw new Error(`Source file not found: ${oldInputPath}`);
      }
      throw error;
    }
  }

  resolvePath(inputPath: string): string {
    const safePath = validatePath(inputPath, this.contextRoot);
    return path.join(this.contextRoot, safePath);
  }
}
