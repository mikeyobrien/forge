// ABOUTME: Environment configuration system with CONTEXT_ROOT validation
// ABOUTME: Provides type-safe access to environment variables with validation

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env file if in development
if (process.env['NODE_ENV'] !== 'production') {
  dotenv.config();
}

// Define log levels as a const array for type safety
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

// Define node environments
const NODE_ENVIRONMENTS = ['development', 'production', 'test'] as const;
type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

// TypeScript interface for our configuration
export interface EnvironmentConfig {
  contextRoot: string;
  logLevel: LogLevel;
  port: number;
  nodeEnv: NodeEnvironment;
}

// Zod schema for runtime validation
const environmentSchema = z.object({
  contextRoot: z.string().min(1, 'CONTEXT_ROOT is required'),
  logLevel: z.enum(LOG_LEVELS).default('info'),
  port: z.number().int().positive().default(3000),
  nodeEnv: z.enum(NODE_ENVIRONMENTS).default('production'),
});

// Custom error class for configuration errors
export class ConfigurationError extends Error {
  constructor(
    public readonly field: string,
    public readonly reason: string,
  ) {
    super(`Configuration error: ${field} - ${reason}`);
    this.name = 'ConfigurationError';
  }
}

// Validate that a directory exists and is writable
export async function validateDirectory(dirPath: string): Promise<void> {
  try {
    // Check if path exists
    const stats = await fs.stat(dirPath);

    if (!stats.isDirectory()) {
      throw new ConfigurationError(
        'CONTEXT_ROOT',
        `Path exists but is not a directory: ${dirPath}`,
      );
    }

    // Check if directory is writable by trying to write a temp file
    const tempFile = path.join(dirPath, `.mcp-test-${Date.now()}`);
    try {
      await fs.writeFile(tempFile, 'test');
      await fs.unlink(tempFile);
    } catch {
      throw new ConfigurationError('CONTEXT_ROOT', `Directory is not writable: ${dirPath}`);
    }
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }

    const err = error as Error & { code?: string };
    if (err.code === 'ENOENT') {
      throw new ConfigurationError('CONTEXT_ROOT', `Directory does not exist: ${dirPath}`);
    }

    throw new ConfigurationError(
      'CONTEXT_ROOT',
      `Failed to validate directory: ${(error as Error).message}`,
    );
  }
}

// Parse and validate environment variables
function parseEnvironment(): z.infer<typeof environmentSchema> {
  const raw = {
    contextRoot: process.env['CONTEXT_ROOT'],
    logLevel: process.env['LOG_LEVEL'],
    port: process.env['PORT'] ? parseInt(process.env['PORT'], 10) : undefined,
    nodeEnv: process.env['NODE_ENV'],
  };

  try {
    return environmentSchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      if (firstError) {
        throw new ConfigurationError(firstError.path.join('.'), firstError.message);
      }
    }
    throw error;
  }
}

// Singleton configuration class
class Configuration {
  private config: EnvironmentConfig | null = null;
  private validated = false;

  async load(): Promise<EnvironmentConfig> {
    if (this.config && this.validated) {
      return this.config;
    }

    // Parse environment variables
    const parsed = parseEnvironment();

    // Validate CONTEXT_ROOT directory
    await validateDirectory(parsed.contextRoot);

    // Convert to absolute path
    const absoluteContextRoot = path.resolve(parsed.contextRoot);

    this.config = {
      ...parsed,
      contextRoot: absoluteContextRoot,
    };

    this.validated = true;
    return this.config;
  }

  // Get config without validation (for testing)
  getUnsafe(): EnvironmentConfig | null {
    return this.config;
  }

  // Reset configuration (for testing)
  reset(): void {
    this.config = null;
    this.validated = false;
  }
}

// Export singleton instance
export const configuration = new Configuration();

// Type guard for log level
export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && LOG_LEVELS.includes(value as LogLevel);
}

// Type guard for node environment
export function isNodeEnvironment(value: unknown): value is NodeEnvironment {
  return typeof value === 'string' && NODE_ENVIRONMENTS.includes(value as NodeEnvironment);
}
