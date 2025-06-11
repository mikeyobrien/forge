import { validatePath, validateFilename, isPathSafe, SecurityError } from '../security';

describe('Security Module', () => {
  const contextRoot = '/test/root';

  describe('validatePath', () => {
    it('should accept valid relative paths', () => {
      expect(validatePath('file.txt', contextRoot)).toBe('file.txt');
      expect(validatePath('dir/file.txt', contextRoot)).toBe('dir/file.txt');
      expect(validatePath('./file.txt', contextRoot)).toBe('file.txt');
    });

    it('should normalize paths', () => {
      expect(validatePath('dir//file.txt', contextRoot)).toBe('dir/file.txt');
      expect(validatePath('dir/./file.txt', contextRoot)).toBe('dir/file.txt');
    });

    it('should reject path traversal attempts', () => {
      expect(() => validatePath('../file.txt', contextRoot)).toThrow(SecurityError);
      expect(() => validatePath('dir/../../../etc/passwd', contextRoot)).toThrow(SecurityError);
      expect(() => validatePath('..', contextRoot)).toThrow(SecurityError);
    });

    it('should reject paths escaping context root', () => {
      expect(() => validatePath('/etc/passwd', contextRoot)).toThrow(SecurityError);
      expect(() => validatePath('/test/other/file.txt', contextRoot)).toThrow(SecurityError);
    });

    it('should handle edge cases', () => {
      expect(validatePath('', contextRoot)).toBe('.');
      expect(validatePath('.', contextRoot)).toBe('.');
      expect(validatePath('/', contextRoot)).toBe('.');
    });
  });

  describe('validateFilename', () => {
    it('should accept valid filenames', () => {
      expect(validateFilename('file.txt')).toBe('file.txt');
      expect(validateFilename('my-file_123.md')).toBe('my-file_123.md');
      expect(validateFilename('document')).toBe('document');
    });

    it('should reject empty filenames', () => {
      expect(() => validateFilename('')).toThrow(SecurityError);
      expect(() => validateFilename('   ')).toThrow(SecurityError);
    });

    it('should reject Windows reserved names', () => {
      expect(() => validateFilename('CON')).toThrow(SecurityError);
      expect(() => validateFilename('con')).toThrow(SecurityError);
      expect(() => validateFilename('PRN')).toThrow(SecurityError);
      expect(() => validateFilename('AUX')).toThrow(SecurityError);
      expect(() => validateFilename('NUL')).toThrow(SecurityError);
      expect(() => validateFilename('COM1')).toThrow(SecurityError);
      expect(() => validateFilename('LPT1')).toThrow(SecurityError);
    });

    it('should reject invalid characters', () => {
      expect(() => validateFilename('file<name')).toThrow(SecurityError);
      expect(() => validateFilename('file>name')).toThrow(SecurityError);
      expect(() => validateFilename('file:name')).toThrow(SecurityError);
      expect(() => validateFilename('file"name')).toThrow(SecurityError);
      expect(() => validateFilename('file|name')).toThrow(SecurityError);
      expect(() => validateFilename('file?name')).toThrow(SecurityError);
      expect(() => validateFilename('file*name')).toThrow(SecurityError);
      expect(() => validateFilename('file\x00name')).toThrow(SecurityError);
    });

    it('should reject trailing dots and spaces', () => {
      expect(() => validateFilename('file.')).toThrow(SecurityError);
      expect(() => validateFilename('file ')).toThrow(SecurityError);
      expect(() => validateFilename('file...')).toThrow(SecurityError);
    });
  });

  describe('isPathSafe', () => {
    it('should return true for paths within context root', async () => {
      const mockRealpath = jest.fn().mockResolvedValue('/test/root/file.txt');
      const result = await isPathSafe('/test/root/file.txt', contextRoot, mockRealpath);
      expect(result).toBe(true);
    });

    it('should return false for paths outside context root', async () => {
      const mockRealpath = jest
        .fn()
        .mockResolvedValueOnce('/etc/passwd')
        .mockResolvedValueOnce('/test/root');
      const result = await isPathSafe('/test/root/symlink', contextRoot, mockRealpath);
      expect(result).toBe(false);
    });

    it('should return false when realpath fails', async () => {
      const mockRealpath = jest.fn().mockRejectedValue(new Error('ENOENT'));
      const result = await isPathSafe('/test/root/nonexistent', contextRoot, mockRealpath);
      expect(result).toBe(false);
    });
  });
});
