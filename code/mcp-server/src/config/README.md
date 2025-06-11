# Environment Configuration System

This module provides a type-safe environment configuration system for the MCP server with validation and security features.

## Overview

The configuration system ensures that:

- All required environment variables are present and valid
- The CONTEXT_ROOT directory exists and is writable
- Path operations are secure and prevent directory traversal
- Type safety is maintained throughout the application

## Required Environment Variables

- `CONTEXT_ROOT` (required): Base directory for all document storage
  - Must be an existing, writable directory
  - Will be converted to an absolute path

## Optional Environment Variables

- `LOG_LEVEL`: Logging verbosity level

  - Values: `debug`, `info`, `warn`, `error`
  - Default: `info`

- `PORT`: Server port for HTTP transport

  - Must be a positive integer between 1 and 65535
  - Default: `3000`

- `NODE_ENV`: Node environment
  - Values: `development`, `production`, `test`
  - Default: `production`

## Usage

```typescript
import { configuration, ConfigurationError } from './config';

async function startServer() {
  try {
    const config = await configuration.load();
    console.log(`Context root: ${config.contextRoot}`);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`Configuration error: ${error.field} - ${error.reason}`);
    }
  }
}
```

## Security Features

### Path Validation

The system includes comprehensive path validation to prevent security issues:

```typescript
import { validatePathSecurity, isWithinRoot } from './config';

// Validate path doesn't contain dangerous patterns
validatePathSecurity('../../etc/passwd'); // Throws error

// Check if path is within root directory
const isValid = isWithinRoot('/root/sub/file.txt', '/root'); // true
```

### Directory Validation

CONTEXT_ROOT is validated on startup to ensure:

- The directory exists
- It is actually a directory (not a file)
- The process has write permissions

## Type Safety

All configuration values are strongly typed:

```typescript
interface EnvironmentConfig {
  contextRoot: string; // Absolute path
  logLevel: LogLevel; // 'debug' | 'info' | 'warn' | 'error'
  port: number; // Positive integer
  nodeEnv: NodeEnvironment; // 'development' | 'production' | 'test'
}
```

## Development

In development mode (NODE_ENV !== 'production'), the system will load variables from a `.env` file if present.

Create a `.env` file based on `.env.example`:

```bash
CONTEXT_ROOT=/path/to/documents
LOG_LEVEL=debug
PORT=3000
NODE_ENV=development
```

## Testing

The configuration system includes comprehensive unit tests covering:

- Environment variable parsing
- Directory validation
- Path security checks
- Type guards and validation
- Error handling

Run tests with: `npm test`
