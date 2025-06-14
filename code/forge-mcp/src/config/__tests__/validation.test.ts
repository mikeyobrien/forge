// Tests for validation utilities

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  isWithinRoot,
  validatePathSecurity,
  ensureDirectory,
  fileExists,
  validatePort,
  validateEnvVarName,
  getEnvVar,
  requireEnvVar,
} from '../validation';
import { ConfigurationError } from '../environment';

describe('Validation Utilities', () => {
  let tempDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-validation-test-'));
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('isWithinRoot', () => {
    it('should return true for paths within root', () => {
      expect(isWithinRoot('/root/sub/file.txt', '/root')).toBe(true);
      expect(isWithinRoot('/root/file.txt', '/root')).toBe(true);
      expect(isWithinRoot('/root', '/root')).toBe(true);
    });

    it('should return false for paths outside root', () => {
      expect(isWithinRoot('/other/file.txt', '/root')).toBe(false);
      expect(isWithinRoot('/root/../file.txt', '/root')).toBe(false);
    });

    it('should handle relative paths', () => {
      // const cwd = process.cwd();
      expect(isWithinRoot('./subdir/file.txt', '.')).toBe(true);
      expect(isWithinRoot('../file.txt', '.')).toBe(false);
    });

    it('should handle Windows paths', () => {
      if (process.platform === 'win32') {
        expect(isWithinRoot('C:\\root\\sub\\file.txt', 'C:\\root')).toBe(true);
        expect(isWithinRoot('D:\\other\\file.txt', 'C:\\root')).toBe(false);
      }
    });
  });

  describe('validatePathSecurity', () => {
    it('should accept safe relative paths', () => {
      expect(() => validatePathSecurity('file.txt')).not.toThrow();
      expect(() => validatePathSecurity('sub/file.txt')).not.toThrow();
      expect(() => validatePathSecurity('./file.txt')).not.toThrow();
    });

    it('should reject path traversal attempts', () => {
      expect(() => validatePathSecurity('../file.txt')).toThrow(
        new ConfigurationError('path', 'Path traversal attempt detected'),
      );
      expect(() => validatePathSecurity('sub/../../../file.txt')).toThrow(
        new ConfigurationError('path', 'Path traversal attempt detected'),
      );
    });

    it('should reject absolute paths', () => {
      if (process.platform === 'win32') {
        expect(() => validatePathSecurity('C:\\file.txt')).toThrow(
          new ConfigurationError('path', 'Absolute Windows paths are not allowed'),
        );
      } else {
        expect(() => validatePathSecurity('/file.txt')).toThrow(
          new ConfigurationError('path', 'Absolute paths are not allowed'),
        );
      }
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = path.join(tempDir, 'new', 'nested', 'dir');

      await ensureDirectory(newDir);

      const stats = await fs.stat(newDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      await expect(ensureDirectory(tempDir)).resolves.toBeUndefined();
    });

    it('should throw ConfigurationError on failure', async () => {
      // Try to create directory in a read-only location
      const invalidPath = path.join(tempDir, 'file.txt');
      await fs.writeFile(invalidPath, 'content');

      await expect(ensureDirectory(path.join(invalidPath, 'subdir'))).rejects.toThrow(
        ConfigurationError,
      );
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'exists.txt');
      await fs.writeFile(filePath, 'content');

      expect(await fileExists(filePath)).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = path.join(tempDir, 'does-not-exist.txt');

      expect(await fileExists(filePath)).toBe(false);
    });

    it('should return true for directories', async () => {
      expect(await fileExists(tempDir)).toBe(true);
    });
  });

  describe('validatePort', () => {
    it('should accept valid port numbers', () => {
      expect(() => validatePort(80)).not.toThrow();
      expect(() => validatePort(3000)).not.toThrow();
      expect(() => validatePort(65535)).not.toThrow();
    });

    it('should reject invalid port numbers', () => {
      expect(() => validatePort(0)).toThrow(
        new ConfigurationError('port', 'Port must be between 1 and 65535'),
      );
      expect(() => validatePort(65536)).toThrow(
        new ConfigurationError('port', 'Port must be between 1 and 65535'),
      );
      expect(() => validatePort(-1)).toThrow(
        new ConfigurationError('port', 'Port must be between 1 and 65535'),
      );
    });

    it('should reject non-integer ports', () => {
      expect(() => validatePort(3.14)).toThrow(
        new ConfigurationError('port', 'Port must be an integer'),
      );
      expect(() => validatePort(NaN)).toThrow(
        new ConfigurationError('port', 'Port must be an integer'),
      );
    });

    it('should accept privileged ports without warning', () => {
      // In stdio mode, we cannot output warnings
      expect(() => validatePort(80)).not.toThrow();
      expect(() => validatePort(443)).not.toThrow();
      expect(() => validatePort(22)).not.toThrow();
    });
  });

  describe('validateEnvVarName', () => {
    it('should accept valid environment variable names', () => {
      expect(() => validateEnvVarName('VALID_VAR')).not.toThrow();
      expect(() => validateEnvVarName('ANOTHER_VALID_123')).not.toThrow();
      expect(() => validateEnvVarName('A')).not.toThrow();
    });

    it('should reject invalid environment variable names', () => {
      expect(() => validateEnvVarName('lowercase')).toThrow(ConfigurationError);
      expect(() => validateEnvVarName('123_START')).toThrow(ConfigurationError);
      expect(() => validateEnvVarName('SPECIAL-CHARS')).toThrow(ConfigurationError);
      expect(() => validateEnvVarName('')).toThrow(ConfigurationError);
    });
  });

  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      process.env['TEST_VAR'] = 'test-value';

      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return undefined for missing variable', () => {
      expect(getEnvVar('MISSING_VAR')).toBeUndefined();
    });

    it('should validate variable name', () => {
      expect(() => getEnvVar('invalid-name')).toThrow(ConfigurationError);
    });

    it('should use validator if provided', () => {
      process.env['TEST_ENUM'] = 'valid';

      const validator = (value: string): value is 'valid' | 'invalid' => {
        return value === 'valid' || value === 'invalid';
      };

      expect(getEnvVar('TEST_ENUM', validator)).toBe('valid');

      process.env['TEST_ENUM'] = 'other';
      expect(() => getEnvVar('TEST_ENUM', validator)).toThrow(ConfigurationError);
    });
  });

  describe('requireEnvVar', () => {
    it('should return environment variable value', () => {
      process.env['REQUIRED_VAR'] = 'value';

      expect(requireEnvVar('REQUIRED_VAR')).toBe('value');
    });

    it('should throw for missing variable', () => {
      expect(() => requireEnvVar('MISSING_REQUIRED')).toThrow(
        new ConfigurationError(
          'MISSING_REQUIRED',
          'Required environment variable MISSING_REQUIRED is not set',
        ),
      );
    });

    it('should use validator if provided', () => {
      process.env['REQUIRED_ENUM'] = 'a';

      const validator = (value: string): value is 'a' | 'b' => {
        return value === 'a' || value === 'b';
      };

      expect(requireEnvVar('REQUIRED_ENUM', validator)).toBe('a');

      process.env['REQUIRED_ENUM'] = 'c';
      expect(() => requireEnvVar('REQUIRED_ENUM', validator)).toThrow(ConfigurationError);
    });
  });
});
