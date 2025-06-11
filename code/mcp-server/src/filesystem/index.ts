// ABOUTME: Main export file for the filesystem abstraction layer
// ABOUTME: Provides a single entry point for all filesystem-related functionality

export { IFileSystem, FileStats } from './IFileSystem.js';
export { FileSystem } from './FileSystem.js';
export { MockFileSystem } from './MockFileSystem.js';
export { SecurityError, validatePath, validateFilename } from './security.js';
