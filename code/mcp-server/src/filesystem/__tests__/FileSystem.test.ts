import { FileSystem } from '../FileSystem';
import { SecurityError } from '../security';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileSystem', () => {
  let tempDir: string;
  let fileSystem: FileSystem;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
    fileSystem = new FileSystem(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read existing files', async () => {
      const content = 'Hello, World!';
      await fs.writeFile(path.join(tempDir, 'test.txt'), content);

      const result = await fileSystem.readFile('test.txt');
      expect(result).toBe(content);
    });

    it('should throw error for non-existent files', async () => {
      await expect(fileSystem.readFile('nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should reject path traversal attempts', async () => {
      await expect(fileSystem.readFile('../outside.txt')).rejects.toThrow(SecurityError);
    });
  });

  describe('writeFile', () => {
    it('should write files', async () => {
      const content = 'Test content';
      await fileSystem.writeFile('output.txt', content);

      const written = await fs.readFile(path.join(tempDir, 'output.txt'), 'utf-8');
      expect(written).toBe(content);
    });

    it('should create parent directories', async () => {
      await fileSystem.writeFile('dir/subdir/file.txt', 'content');

      const exists = await fs
        .access(path.join(tempDir, 'dir/subdir/file.txt'))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should reject invalid filenames', async () => {
      await expect(fileSystem.writeFile('con', 'content')).rejects.toThrow(SecurityError);
    });
  });

  describe('exists', () => {
    it('should return true for existing files', async () => {
      await fs.writeFile(path.join(tempDir, 'exists.txt'), 'content');

      const result = await fileSystem.exists('exists.txt');
      expect(result).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const result = await fileSystem.exists('nonexistent.txt');
      expect(result).toBe(false);
    });

    it('should return false for invalid paths', async () => {
      const result = await fileSystem.exists('../outside.txt');
      expect(result).toBe(false);
    });
  });

  describe('mkdir', () => {
    it('should create directories', async () => {
      await fileSystem.mkdir('newdir');

      const stats = await fs.stat(path.join(tempDir, 'newdir'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested directories with recursive option', async () => {
      await fileSystem.mkdir('parent/child/grandchild', true);

      const stats = await fs.stat(path.join(tempDir, 'parent/child/grandchild'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should fail without recursive for nested directories', async () => {
      await expect(fileSystem.mkdir('parent/child')).rejects.toThrow();
    });
  });

  describe('readdir', () => {
    it('should list directory contents', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(tempDir, 'file2.txt'), 'content2');
      await fs.mkdir(path.join(tempDir, 'subdir'));

      const entries = await fileSystem.readdir('.');
      expect(entries).toContain('file1.txt');
      expect(entries).toContain('file2.txt');
      expect(entries).toContain('subdir');
    });

    it('should throw error for non-existent directories', async () => {
      await expect(fileSystem.readdir('nonexistent')).rejects.toThrow('Directory not found');
    });
  });

  describe('stat', () => {
    it('should return file statistics', async () => {
      const content = 'File content';
      await fs.writeFile(path.join(tempDir, 'statfile.txt'), content);

      const stats = await fileSystem.stat('statfile.txt');
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBe(Buffer.byteLength(content));
    });

    it('should return directory statistics', async () => {
      await fs.mkdir(path.join(tempDir, 'statdir'));

      const stats = await fileSystem.stat('statdir');
      expect(stats.isFile()).toBe(false);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should throw error for non-existent paths', async () => {
      await expect(fileSystem.stat('nonexistent')).rejects.toThrow('Path not found');
    });
  });

  describe('unlink', () => {
    it('should delete files', async () => {
      await fs.writeFile(path.join(tempDir, 'delete.txt'), 'content');

      await fileSystem.unlink('delete.txt');

      const exists = await fs
        .access(path.join(tempDir, 'delete.txt'))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it('should throw error for non-existent files', async () => {
      await expect(fileSystem.unlink('nonexistent.txt')).rejects.toThrow('File not found');
    });
  });

  describe('rename', () => {
    it('should rename files', async () => {
      await fs.writeFile(path.join(tempDir, 'original.txt'), 'content');

      await fileSystem.rename('original.txt', 'renamed.txt');

      const oldExists = await fs
        .access(path.join(tempDir, 'original.txt'))
        .then(() => true)
        .catch(() => false);
      const newExists = await fs
        .access(path.join(tempDir, 'renamed.txt'))
        .then(() => true)
        .catch(() => false);

      expect(oldExists).toBe(false);
      expect(newExists).toBe(true);
    });

    it('should create destination directories', async () => {
      await fs.writeFile(path.join(tempDir, 'file.txt'), 'content');

      await fileSystem.rename('file.txt', 'newdir/file.txt');

      const exists = await fs
        .access(path.join(tempDir, 'newdir/file.txt'))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should throw error for non-existent source', async () => {
      await expect(fileSystem.rename('nonexistent.txt', 'new.txt')).rejects.toThrow(
        'Source file not found',
      );
    });
  });

  describe('resolvePath', () => {
    it('should resolve relative paths to absolute paths', () => {
      const resolved = fileSystem.resolvePath('file.txt');
      expect(resolved).toBe(path.join(tempDir, 'file.txt'));
    });

    it('should handle nested paths', () => {
      const resolved = fileSystem.resolvePath('dir/subdir/file.txt');
      expect(resolved).toBe(path.join(tempDir, 'dir/subdir/file.txt'));
    });
  });
});
