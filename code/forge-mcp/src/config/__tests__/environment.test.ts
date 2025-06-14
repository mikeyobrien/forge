// Tests for environment configuration system

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  configuration,
  ConfigurationError,
  validateDirectory,
  isLogLevel,
  isNodeEnvironment,
} from '../environment';

describe('Environment Configuration', () => {
  let tempDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    // Create a temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));

    // Reset configuration before each test
    configuration.reset();

    // Clear environment
    process.env = {};
  });

  afterEach(async () => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('validateDirectory', () => {
    it('should validate an existing writable directory', async () => {
      await expect(validateDirectory(tempDir)).resolves.toBeUndefined();
    });

    it('should throw error for non-existent directory', async () => {
      const nonExistent = path.join(tempDir, 'does-not-exist');

      await expect(validateDirectory(nonExistent)).rejects.toThrow(
        new ConfigurationError('CONTEXT_ROOT', `Directory does not exist: ${nonExistent}`),
      );
    });

    it('should throw error for file instead of directory', async () => {
      const filePath = path.join(tempDir, 'file.txt');
      await fs.writeFile(filePath, 'test');

      await expect(validateDirectory(filePath)).rejects.toThrow(
        new ConfigurationError('CONTEXT_ROOT', `Path exists but is not a directory: ${filePath}`),
      );
    });

    it('should handle permission errors gracefully', async () => {
      // This test is platform-specific and may not work in all environments
      if (process.platform !== 'win32' && process.getuid && process.getuid() !== 0) {
        const restrictedDir = path.join(tempDir, 'restricted');
        await fs.mkdir(restrictedDir, { mode: 0o444 }); // Read-only

        await expect(validateDirectory(restrictedDir)).rejects.toThrow(ConfigurationError);
      }
    });
  });

  describe('configuration.load', () => {
    it('should load valid configuration', async () => {
      process.env['CONTEXT_ROOT'] = tempDir;
      process.env['LOG_LEVEL'] = 'debug';
      process.env['PORT'] = '8080';
      process.env['NODE_ENV'] = 'development';

      const config = await configuration.load();

      expect(config).toEqual({
        contextRoot: path.resolve(tempDir),
        logLevel: 'debug',
        port: 8080,
        nodeEnv: 'development',
      });
    });

    it('should use defaults for optional values', async () => {
      process.env['CONTEXT_ROOT'] = tempDir;

      const config = await configuration.load();

      expect(config).toEqual({
        contextRoot: path.resolve(tempDir),
        logLevel: 'info',
        port: 3000,
        nodeEnv: 'production',
      });
    });

    it('should throw error for missing CONTEXT_ROOT', async () => {
      await expect(configuration.load()).rejects.toThrow(
        new ConfigurationError('contextRoot', 'Required'),
      );
    });

    it('should throw error for invalid log level', async () => {
      process.env['CONTEXT_ROOT'] = tempDir;
      process.env['LOG_LEVEL'] = 'invalid';

      await expect(configuration.load()).rejects.toThrow(ConfigurationError);
    });

    it('should throw error for invalid port', async () => {
      process.env['CONTEXT_ROOT'] = tempDir;
      process.env['PORT'] = 'not-a-number';

      await expect(configuration.load()).rejects.toThrow(ConfigurationError);
    });

    it('should cache configuration after first load', async () => {
      process.env['CONTEXT_ROOT'] = tempDir;

      const config1 = await configuration.load();
      const config2 = await configuration.load();

      expect(config1).toBe(config2); // Same reference
    });

    it('should convert relative CONTEXT_ROOT to absolute path', async () => {
      const relativePath = './test-context';
      await fs.mkdir(path.join(process.cwd(), relativePath), { recursive: true });

      process.env['CONTEXT_ROOT'] = relativePath;

      try {
        const config = await configuration.load();
        expect(path.isAbsolute(config.contextRoot)).toBe(true);
        expect(config.contextRoot).toBe(path.resolve(relativePath));
      } finally {
        await fs.rm(path.join(process.cwd(), relativePath), { recursive: true, force: true });
      }
    });
  });

  describe('ConfigurationError', () => {
    it('should format error message correctly', () => {
      const error = new ConfigurationError('TEST_FIELD', 'Test reason');

      expect(error.message).toBe('Configuration error: TEST_FIELD - Test reason');
      expect(error.name).toBe('ConfigurationError');
      expect(error.field).toBe('TEST_FIELD');
      expect(error.reason).toBe('Test reason');
    });
  });

  describe('Type Guards', () => {
    describe('isLogLevel', () => {
      it('should return true for valid log levels', () => {
        expect(isLogLevel('debug')).toBe(true);
        expect(isLogLevel('info')).toBe(true);
        expect(isLogLevel('warn')).toBe(true);
        expect(isLogLevel('error')).toBe(true);
      });

      it('should return false for invalid values', () => {
        expect(isLogLevel('invalid')).toBe(false);
        expect(isLogLevel('')).toBe(false);
        expect(isLogLevel(123)).toBe(false);
        expect(isLogLevel(null)).toBe(false);
        expect(isLogLevel(undefined)).toBe(false);
      });
    });

    describe('isNodeEnvironment', () => {
      it('should return true for valid environments', () => {
        expect(isNodeEnvironment('development')).toBe(true);
        expect(isNodeEnvironment('production')).toBe(true);
        expect(isNodeEnvironment('test')).toBe(true);
      });

      it('should return false for invalid values', () => {
        expect(isNodeEnvironment('staging')).toBe(false);
        expect(isNodeEnvironment('')).toBe(false);
        expect(isNodeEnvironment(123)).toBe(false);
        expect(isNodeEnvironment(null)).toBe(false);
        expect(isNodeEnvironment(undefined)).toBe(false);
      });
    });
  });
});
