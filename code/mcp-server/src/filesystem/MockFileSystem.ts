// ABOUTME: This file provides a mock implementation of IFileSystem for testing
// ABOUTME: supporting in-memory file operations and test scenarios

import { IFileSystem, DirectoryEntry, FileStats } from './IFileSystem';
import { SecurityError } from './security';

export class MockFileSystem implements IFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();
  private contextRoot: string;

  constructor(contextRoot: string = '/') {
    this.contextRoot = contextRoot;
    // Initialize with root directory
    this.directories.add('/');
    // Initialize with context root if different from root
    if (contextRoot !== '/') {
      this.createDirectorySync(contextRoot);
    }
  }

  readFile(path: string): Promise<string> {
    // Check for path traversal
    if (path.includes('../')) {
      return Promise.reject(new SecurityError('Path traversal detected'));
    }
    const resolvedPath = this.resolvePath(path);
    const content = this.files.get(resolvedPath);
    if (content === undefined) {
      return Promise.reject(new Error(`File not found: ${path}`));
    }
    return Promise.resolve(content);
  }

  writeFile(path: string, content: string): Promise<void> {
    const resolvedPath = this.resolvePath(path);
    this.files.set(resolvedPath, content);

    // Update mtime, preserve birthtime for existing files
    const stats = this.fileStats.get(resolvedPath);
    if (stats) {
      stats.mtime = new Date();
    } else {
      this.fileStats.set(resolvedPath, { mtime: new Date(), birthtime: new Date() });
    }

    // Ensure parent directories exist
    const parts = resolvedPath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i]) {
        currentPath += '/' + parts[i];
        this.directories.add(currentPath);
      }
    }
    return Promise.resolve();
  }

  exists(path: string): Promise<boolean> {
    const resolvedPath = this.resolvePath(path);
    return Promise.resolve(this.files.has(resolvedPath) || this.directories.has(resolvedPath));
  }

  createDirectory(path: string): Promise<void> {
    const resolvedPath = this.resolvePath(path);
    this.directories.add(resolvedPath);
    // Ensure parent directories exist
    const parts = resolvedPath.split('/');
    let currentPath = '';
    for (const part of parts) {
      if (part) {
        currentPath += '/' + part;
        this.directories.add(currentPath);
      }
    }
    return Promise.resolve();
  }

  readDirectory(path: string): Promise<DirectoryEntry[]> {
    const resolvedPath = this.resolvePath(path);
    if (!this.directories.has(resolvedPath)) {
      throw new Error(`Directory not found: ${path}`);
    }

    const entries: DirectoryEntry[] = [];
    const pathWithSlash = resolvedPath.endsWith('/') ? resolvedPath : resolvedPath + '/';

    // Find direct children
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(pathWithSlash)) {
        const relativePath = filePath.substring(pathWithSlash.length);
        if (!relativePath.includes('/')) {
          entries.push({
            name: relativePath,
            isFile: true,
            isDirectory: false,
          });
        }
      }
    }

    for (const dirPath of this.directories) {
      if (dirPath.startsWith(pathWithSlash) && dirPath !== resolvedPath) {
        const relativePath = dirPath.substring(pathWithSlash.length);
        if (!relativePath.includes('/')) {
          entries.push({
            name: relativePath,
            isFile: false,
            isDirectory: true,
          });
        }
      }
    }

    return Promise.resolve(entries);
  }

  private fileStats: Map<string, { mtime: Date; birthtime: Date }> = new Map();

  stat(path: string): Promise<FileStats> {
    const resolvedPath = this.resolvePath(path);
    const isFile = this.files.has(resolvedPath);
    const isDirectory = this.directories.has(resolvedPath);

    if (!isFile && !isDirectory) {
      return Promise.reject(new Error(`Path not found: ${path}`));
    }

    // Get or create stats
    let stats = this.fileStats.get(resolvedPath);
    if (!stats) {
      stats = { mtime: new Date(), birthtime: new Date() };
      this.fileStats.set(resolvedPath, stats);
    }

    return Promise.resolve({
      isFile: () => isFile,
      isDirectory: () => isDirectory,
      size: isFile ? (this.files.get(resolvedPath)?.length ?? 0) : 0,
      mtime: stats.mtime,
      birthtime: stats.birthtime,
    });
  }

  delete(path: string): Promise<void> {
    this.files.delete(path);
    this.directories.delete(path);
    return Promise.resolve();
  }

  move(sourcePath: string, targetPath: string): Promise<void> {
    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedTarget = this.resolvePath(targetPath);
    const content = this.files.get(resolvedSource);

    if (content !== undefined) {
      // Moving a file
      this.files.set(resolvedTarget, content);
      this.files.delete(resolvedSource);

      // Move stats and update mtime
      const stats = this.fileStats.get(resolvedSource);
      if (stats) {
        this.fileStats.set(resolvedTarget, { ...stats, mtime: new Date() });
        this.fileStats.delete(resolvedSource);
      }

      // Ensure parent directories exist for target
      const parts = resolvedTarget.split('/');
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i]) {
          currentPath += '/' + parts[i];
          this.directories.add(currentPath);
        }
      }
    } else if (this.directories.has(resolvedSource)) {
      // Moving a directory - need to move all contents
      const sourceWithSlash = resolvedSource.endsWith('/') ? resolvedSource : resolvedSource + '/';
      const targetWithSlash = resolvedTarget.endsWith('/') ? resolvedTarget : resolvedTarget + '/';

      // Move all files under the directory
      for (const [filePath, fileContent] of this.files.entries()) {
        if (filePath.startsWith(sourceWithSlash)) {
          const newPath = filePath.replace(sourceWithSlash, targetWithSlash);
          this.files.set(newPath, fileContent);
          this.files.delete(filePath);

          // Move file stats
          const stats = this.fileStats.get(filePath);
          if (stats) {
            this.fileStats.set(newPath, stats);
            this.fileStats.delete(filePath);
          }
        }
      }

      // Move all subdirectories
      const dirsToMove = [];
      for (const dirPath of this.directories) {
        if (dirPath.startsWith(sourceWithSlash) || dirPath === resolvedSource) {
          dirsToMove.push(dirPath);
        }
      }

      for (const dirPath of dirsToMove) {
        const newPath =
          dirPath === resolvedSource
            ? resolvedTarget
            : dirPath.replace(sourceWithSlash, targetWithSlash);
        this.directories.add(newPath);
        this.directories.delete(dirPath);
      }
    } else {
      throw new Error(`Source not found: ${sourcePath}`);
    }
    return Promise.resolve();
  }

  copy(sourcePath: string, targetPath: string): Promise<void> {
    const content = this.files.get(sourcePath);
    if (content !== undefined) {
      this.files.set(targetPath, content);
    } else if (this.directories.has(sourcePath)) {
      this.directories.add(targetPath);
    } else {
      throw new Error(`Source not found: ${sourcePath}`);
    }
    return Promise.resolve();
  }

  realpath(path: string): Promise<string> {
    return Promise.resolve(path);
  }

  async readdir(path: string): Promise<string[]> {
    const entries = await this.readDirectory(path);
    const names = entries.map((entry) => entry.name);
    // Sort to match expected order: directories first, then files
    names.sort((a, b) => {
      const aIsDir = entries.find((e) => e.name === a)?.isDirectory;
      const bIsDir = entries.find((e) => e.name === b)?.isDirectory;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    return names;
  }

  mkdir(path: string, recursive?: boolean): Promise<void> {
    const resolvedPath = this.resolvePath(path);

    // Check if path exists as a file
    if (this.files.has(resolvedPath)) {
      return Promise.reject(new Error('Path exists as a file'));
    }

    if (recursive) {
      const parts = resolvedPath.split('/').filter((p) => p);
      let currentPath = '';
      for (const part of parts) {
        currentPath += '/' + part;
        this.directories.add(currentPath);
      }
    } else {
      // Check if parent directory exists
      const parentPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/'));
      if (parentPath && parentPath !== '/' && !this.directories.has(parentPath)) {
        return Promise.reject(new Error('Parent directory does not exist'));
      }
      this.directories.add(resolvedPath);
    }
    return Promise.resolve();
  }

  unlink(path: string): Promise<void> {
    const resolvedPath = this.resolvePath(path);
    if (!this.files.has(resolvedPath)) {
      return Promise.reject(new Error(`File not found: ${path}`));
    }
    this.files.delete(resolvedPath);
    this.fileStats.delete(resolvedPath);
    return Promise.resolve();
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await this.move(oldPath, newPath);
  }

  resolvePath(inputPath: string): string {
    // Simple path resolution for testing
    if (inputPath.startsWith('/')) {
      return inputPath;
    }
    if (inputPath === '.') {
      return this.contextRoot;
    }
    return `${this.contextRoot}/${inputPath}`;
  }

  // Helper methods for testing
  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  addDirectory(path: string): void {
    this.directories.add(path);
  }

  // Synchronous helper methods for testing
  writeFileSync(path: string, content: string): void {
    const resolvedPath = this.resolvePath(path);
    this.files.set(resolvedPath, content);

    // Update mtime, preserve birthtime for existing files
    const stats = this.fileStats.get(resolvedPath);
    if (stats) {
      stats.mtime = new Date();
    } else {
      this.fileStats.set(resolvedPath, { mtime: new Date(), birthtime: new Date() });
    }

    // Ensure parent directories exist
    const parts = resolvedPath.split('/');
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i]) {
        currentPath += '/' + parts[i];
        this.directories.add(currentPath);
      }
    }
  }

  deleteFileSync(path: string): void {
    const resolvedPath = this.resolvePath(path);
    this.files.delete(resolvedPath);
    this.fileStats.delete(resolvedPath);
  }

  deleteFile(path: string): void {
    this.deleteFileSync(path);
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
    this.fileStats.clear();
    this.directories.add('/');
    // Re-add context root if different from root
    if (this.contextRoot !== '/') {
      this.createDirectorySync(this.contextRoot);
    }
  }

  getFiles(): Map<string, string> {
    return new Map(this.files);
  }

  getDirectories(): Set<string> {
    return new Set(this.directories);
  }

  /**
   * Preset the filesystem with a specific file structure
   * @param structure - Object where keys are paths and values are file contents (null for directories)
   */
  preset(structure: Record<string, string | null>): void {
    this.clear();

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = filePath.startsWith('/') ? filePath : `${this.contextRoot}/${filePath}`;

      if (content === null) {
        // It's a directory
        this.createDirectorySync(fullPath);
      } else {
        // It's a file
        this.createDirectorySync(fullPath.substring(0, fullPath.lastIndexOf('/')));
        this.files.set(fullPath, content);
      }
    }
  }

  private createDirectorySync(path: string): void {
    const parts = path.split('/').filter((p) => p);
    let currentPath = '';
    for (const part of parts) {
      currentPath += '/' + part;
      this.directories.add(currentPath);
    }
  }
}
