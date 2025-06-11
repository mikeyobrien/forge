// ABOUTME: Interface defining the contract for all file system operations
// ABOUTME: This abstraction allows for easy mocking and testing of file operations

export interface FileStats {
  isFile(): boolean;
  isDirectory(): boolean;
  size: number;
  mtime: Date;
  birthtime: Date;
}

export interface IFileSystem {
  /**
   * Read a file's contents as a string
   * @param path - Path relative to CONTEXT_ROOT
   * @returns The file contents
   * @throws If file doesn't exist or can't be read
   */
  readFile(path: string): Promise<string>;

  /**
   * Write content to a file
   * @param path - Path relative to CONTEXT_ROOT
   * @param content - Content to write
   * @throws If file can't be written
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Check if a path exists
   * @param path - Path relative to CONTEXT_ROOT
   * @returns True if the path exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Create a directory
   * @param path - Path relative to CONTEXT_ROOT
   * @param recursive - Create parent directories if needed
   * @throws If directory can't be created
   */
  mkdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * Read directory contents
   * @param path - Path relative to CONTEXT_ROOT
   * @returns Array of file/directory names
   * @throws If directory doesn't exist or can't be read
   */
  readdir(path: string): Promise<string[]>;

  /**
   * Get file/directory statistics
   * @param path - Path relative to CONTEXT_ROOT
   * @returns File statistics
   * @throws If path doesn't exist
   */
  stat(path: string): Promise<FileStats>;

  /**
   * Delete a file
   * @param path - Path relative to CONTEXT_ROOT
   * @throws If file doesn't exist or can't be deleted
   */
  unlink(path: string): Promise<void>;

  /**
   * Rename/move a file or directory
   * @param oldPath - Current path relative to CONTEXT_ROOT
   * @param newPath - New path relative to CONTEXT_ROOT
   * @throws If operation fails
   */
  rename(oldPath: string, newPath: string): Promise<void>;

  /**
   * Get the absolute path for a relative path
   * @param path - Path relative to CONTEXT_ROOT
   * @returns Absolute path
   */
  resolvePath(path: string): string;
}
