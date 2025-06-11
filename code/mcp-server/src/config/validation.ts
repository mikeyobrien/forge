// ABOUTME: Additional validation utilities for configuration
// ABOUTME: Provides reusable validation functions with proper error handling

import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurationError } from './environment';

// Check if a path is within a given root directory
export function isWithinRoot(targetPath: string, rootPath: string): boolean {
  const normalizedTarget = path.resolve(targetPath);
  const normalizedRoot = path.resolve(rootPath);

  return (
    normalizedTarget.startsWith(normalizedRoot + path.sep) || normalizedTarget === normalizedRoot
  );
}

// Validate that a path doesn't contain dangerous patterns
export function validatePathSecurity(pathStr: string): void {
  // Check for path traversal attempts
  if (pathStr.includes('..')) {
    throw new ConfigurationError('path', 'Path traversal attempt detected');
  }

  // Check for absolute paths on Windows
  if (process.platform === 'win32' && /^[a-zA-Z]:/.test(pathStr)) {
    throw new ConfigurationError('path', 'Absolute Windows paths are not allowed');
  }

  // Check for absolute paths on Unix
  if (process.platform !== 'win32' && pathStr.startsWith('/')) {
    throw new ConfigurationError('path', 'Absolute paths are not allowed');
  }
}

// Create directory if it doesn't exist
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new ConfigurationError(
      'directory',
      `Failed to create directory ${dirPath}: ${(error as Error).message}`,
    );
  }
}

// Check if file exists
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Validate port number
export function validatePort(port: number): void {
  if (!Number.isInteger(port)) {
    throw new ConfigurationError('port', 'Port must be an integer');
  }

  if (port < 1 || port > 65535) {
    throw new ConfigurationError('port', 'Port must be between 1 and 65535');
  }

  // Note: Port is privileged but we can't warn in stdio mode
  if (port < 1024) {
    // Port ${port} is a privileged port and may require elevated permissions
  }
}

// Validate environment variable name
export function validateEnvVarName(name: string): void {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
    throw new ConfigurationError(
      'environment variable',
      `Invalid environment variable name: ${name}. Must start with uppercase letter and contain only uppercase letters, numbers, and underscores.`,
    );
  }
}

// Type-safe environment variable getter
export function getEnvVar<T extends string = string>(
  name: string,
  validator?: (value: string) => value is T,
): string | undefined {
  validateEnvVarName(name);
  const value = process.env[name];

  if (value !== undefined && validator && !validator(value)) {
    throw new ConfigurationError(name, `Environment variable ${name} has invalid value: ${value}`);
  }

  return value;
}

// Type-safe required environment variable getter
export function requireEnvVar<T extends string = string>(
  name: string,
  validator?: (value: string) => value is T,
): string {
  const value = getEnvVar(name, validator);

  if (value === undefined) {
    throw new ConfigurationError(name, `Required environment variable ${name} is not set`);
  }

  return value;
}
