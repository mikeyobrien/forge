// ABOUTME: Security utilities for validating and sanitizing file system paths
// ABOUTME: Prevents path traversal attacks and ensures operations stay within CONTEXT_ROOT

import * as path from 'path';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Validates that a path is safe and within the allowed directory
 * @param inputPath - The path to validate
 * @param contextRoot - The root directory to enforce
 * @returns The normalized, safe path
 * @throws SecurityError if the path is invalid or escapes the context root
 */
export function validatePath(inputPath: string, contextRoot: string): string {
  // Handle empty input
  if (!inputPath || inputPath === '/' || inputPath === '.') {
    return '.';
  }

  // Normalize the input path
  const normalizedInput = path.normalize(inputPath);

  // Check for path traversal attempts
  if (normalizedInput.includes('..')) {
    throw new SecurityError('Path traversal detected: ".." not allowed');
  }

  // Resolve the full path
  const resolvedPath = path.resolve(contextRoot, normalizedInput);
  const normalizedRoot = path.resolve(contextRoot);

  // Ensure the resolved path is within the context root
  if (!resolvedPath.startsWith(normalizedRoot)) {
    throw new SecurityError(`Path escapes context root: ${inputPath}`);
  }

  // Return the relative path from context root
  const relativePath = path.relative(normalizedRoot, resolvedPath);
  return relativePath === '' ? '.' : relativePath;
}

/**
 * Validates a filename to ensure it's safe
 * @param filename - The filename to validate
 * @returns The sanitized filename
 * @throws SecurityError if the filename is invalid
 */
export function validateFilename(filename: string): string {
  // Check for empty filename
  if (!filename || filename.trim().length === 0) {
    throw new SecurityError('Filename cannot be empty');
  }

  // Check for reserved names on Windows
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ];

  const upperFilename = filename.toUpperCase();
  if (reservedNames.includes(upperFilename)) {
    throw new SecurityError(`Reserved filename not allowed: ${filename}`);
  }

  // Check for invalid characters
  // eslint-disable-next-line no-control-regex
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) {
    throw new SecurityError(`Invalid characters in filename: ${filename}`);
  }

  // Check for trailing dots or spaces (Windows issue)
  if (filename.endsWith('.') || filename.endsWith(' ')) {
    throw new SecurityError('Filename cannot end with dot or space');
  }

  return filename;
}

/**
 * Checks if a path contains symbolic links that might escape the context
 * @param fullPath - The full path to check
 * @param contextRoot - The root directory to enforce
 * @returns True if the path is safe
 */
export async function isPathSafe(
  fullPath: string,
  contextRoot: string,
  fsRealpath: (path: string) => Promise<string>,
): Promise<boolean> {
  try {
    const realPath = await fsRealpath(fullPath);
    // Also resolve the context root in case it contains symlinks
    const realRoot = await fsRealpath(contextRoot);
    return realPath.startsWith(realRoot);
  } catch {
    // If we can't resolve the path, it's likely not safe
    return false;
  }
}
