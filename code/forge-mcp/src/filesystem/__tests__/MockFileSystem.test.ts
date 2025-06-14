import { MockFileSystem } from '../MockFileSystem';
import { SecurityError } from '../security';

describe('MockFileSystem', () => {
  let mockFs: MockFileSystem;
  const contextRoot = '/mock/root';

  beforeEach(() => {
    mockFs = new MockFileSystem(contextRoot);
  });

  describe('preset', () => {
    it('should preset file structure', async () => {
      mockFs.preset({
        'file1.txt': 'content1',
        'dir1/file2.txt': 'content2',
        'dir2/': null, // directory
        'dir2/subdir/file3.txt': 'content3',
      });

      await expect(mockFs.exists('file1.txt')).resolves.toBe(true);
      await expect(mockFs.exists('dir1/file2.txt')).resolves.toBe(true);
      await expect(mockFs.exists('dir2')).resolves.toBe(true);
      await expect(mockFs.exists('dir2/subdir/file3.txt')).resolves.toBe(true);
    });
  });

  describe('readFile', () => {
    beforeEach(() => {
      mockFs.preset({
        'test.txt': 'Hello, Mock!',
        'dir/nested.txt': 'Nested content',
      });
    });

    it('should read existing files', async () => {
      const content = await mockFs.readFile('test.txt');
      expect(content).toBe('Hello, Mock!');
    });

    it('should read nested files', async () => {
      const content = await mockFs.readFile('dir/nested.txt');
      expect(content).toBe('Nested content');
    });

    it('should throw error for non-existent files', async () => {
      await expect(mockFs.readFile('nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should reject path traversal', async () => {
      await expect(mockFs.readFile('../outside.txt')).rejects.toThrow(SecurityError);
    });
  });

  describe('writeFile', () => {
    it('should write new files', async () => {
      await mockFs.writeFile('new.txt', 'New content');

      const content = await mockFs.readFile('new.txt');
      expect(content).toBe('New content');
    });

    it('should overwrite existing files', async () => {
      await mockFs.writeFile('file.txt', 'Original');
      await mockFs.writeFile('file.txt', 'Updated');

      const content = await mockFs.readFile('file.txt');
      expect(content).toBe('Updated');
    });

    it('should create parent directories automatically', async () => {
      await mockFs.writeFile('deep/nested/file.txt', 'Content');

      expect(await mockFs.exists('deep')).toBe(true);
      expect(await mockFs.exists('deep/nested')).toBe(true);
      expect(await mockFs.readFile('deep/nested/file.txt')).toBe('Content');
    });

    it('should update mtime on write', async () => {
      await mockFs.writeFile('file.txt', 'Content');
      const stats1 = await mockFs.stat('file.txt');

      await new Promise((resolve) => global.setTimeout(resolve, 10));

      await mockFs.writeFile('file.txt', 'Updated');
      const stats2 = await mockFs.stat('file.txt');

      expect(stats2.mtime.getTime()).toBeGreaterThan(stats1.mtime.getTime());
      expect(stats2.birthtime).toEqual(stats1.birthtime);
    });
  });

  describe('exists', () => {
    beforeEach(() => {
      mockFs.preset({
        'file.txt': 'content',
        'dir/': null,
      });
    });

    it('should return true for existing files', async () => {
      expect(await mockFs.exists('file.txt')).toBe(true);
    });

    it('should return true for existing directories', async () => {
      expect(await mockFs.exists('dir')).toBe(true);
    });

    it('should return false for non-existent paths', async () => {
      expect(await mockFs.exists('nonexistent')).toBe(false);
    });

    it('should return false for invalid paths', async () => {
      expect(await mockFs.exists('../outside')).toBe(false);
    });
  });

  describe('mkdir', () => {
    it('should create directories', async () => {
      await mockFs.mkdir('newdir');

      expect(await mockFs.exists('newdir')).toBe(true);
      const stats = await mockFs.stat('newdir');
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await mockFs.mkdir('dir');
      await mockFs.mkdir('dir'); // Should not throw

      expect(await mockFs.exists('dir')).toBe(true);
    });

    it('should create nested directories with recursive', async () => {
      await mockFs.mkdir('parent/child/grandchild', true);

      expect(await mockFs.exists('parent')).toBe(true);
      expect(await mockFs.exists('parent/child')).toBe(true);
      expect(await mockFs.exists('parent/child/grandchild')).toBe(true);
    });

    it('should fail without recursive for nested paths', async () => {
      await expect(mockFs.mkdir('parent/child')).rejects.toThrow('Parent directory does not exist');
    });

    it('should fail if path exists as file', async () => {
      await mockFs.writeFile('file.txt', 'content');

      await expect(mockFs.mkdir('file.txt')).rejects.toThrow('Path exists as a file');
    });
  });

  describe('readdir', () => {
    beforeEach(() => {
      mockFs.preset({
        'file1.txt': 'content',
        'file2.txt': 'content',
        'dir1/': null,
        'dir1/nested.txt': 'content',
        'dir2/': null,
        'dir2/deep/file.txt': 'content',
      });
    });

    it('should list root directory contents', async () => {
      const entries = await mockFs.readdir('.');

      expect(entries).toEqual(['dir1', 'dir2', 'file1.txt', 'file2.txt']);
    });

    it('should list subdirectory contents', async () => {
      const entries = await mockFs.readdir('dir1');

      expect(entries).toEqual(['nested.txt']);
    });

    it('should not include nested subdirectories', async () => {
      const entries = await mockFs.readdir('dir2');

      expect(entries).toEqual(['deep']);
    });

    it('should return empty array for empty directories', async () => {
      await mockFs.mkdir('empty');

      const entries = await mockFs.readdir('empty');
      expect(entries).toEqual([]);
    });

    it('should throw error for non-existent directories', async () => {
      await expect(mockFs.readdir('nonexistent')).rejects.toThrow('Directory not found');
    });
  });

  describe('stat', () => {
    beforeEach(() => {
      mockFs.preset({
        'file.txt': 'Hello, World!',
        'dir/': null,
      });
    });

    it('should return file statistics', async () => {
      const stats = await mockFs.stat('file.txt');

      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
      expect(stats.size).toBe(13); // "Hello, World!" is 13 bytes
      expect(stats.mtime).toBeInstanceOf(Date);
      expect(stats.birthtime).toBeInstanceOf(Date);
    });

    it('should return directory statistics', async () => {
      const stats = await mockFs.stat('dir');

      expect(stats.isFile()).toBe(false);
      expect(stats.isDirectory()).toBe(true);
      expect(stats.size).toBe(0);
    });

    it('should throw error for non-existent paths', async () => {
      await expect(mockFs.stat('nonexistent')).rejects.toThrow('Path not found');
    });
  });

  describe('unlink', () => {
    beforeEach(() => {
      mockFs.preset({
        'delete-me.txt': 'content',
        'dir/file.txt': 'content',
      });
    });

    it('should delete files', async () => {
      await mockFs.unlink('delete-me.txt');

      expect(await mockFs.exists('delete-me.txt')).toBe(false);
    });

    it('should delete nested files', async () => {
      await mockFs.unlink('dir/file.txt');

      expect(await mockFs.exists('dir/file.txt')).toBe(false);
      expect(await mockFs.exists('dir')).toBe(true); // Directory should remain
    });

    it('should throw error for non-existent files', async () => {
      await expect(mockFs.unlink('nonexistent.txt')).rejects.toThrow('File not found');
    });
  });

  describe('rename', () => {
    beforeEach(() => {
      mockFs.preset({
        'file.txt': 'content',
        'dir1/': null,
        'dir1/nested.txt': 'nested content',
        'dir2/': null,
      });
    });

    it('should rename files', async () => {
      await mockFs.rename('file.txt', 'renamed.txt');

      expect(await mockFs.exists('file.txt')).toBe(false);
      expect(await mockFs.exists('renamed.txt')).toBe(true);
      expect(await mockFs.readFile('renamed.txt')).toBe('content');
    });

    it('should move files between directories', async () => {
      await mockFs.rename('file.txt', 'dir2/moved.txt');

      expect(await mockFs.exists('file.txt')).toBe(false);
      expect(await mockFs.exists('dir2/moved.txt')).toBe(true);
    });

    it('should rename directories and contents', async () => {
      await mockFs.rename('dir1', 'renamed-dir');

      expect(await mockFs.exists('dir1')).toBe(false);
      expect(await mockFs.exists('renamed-dir')).toBe(true);
      expect(await mockFs.exists('renamed-dir/nested.txt')).toBe(true);
      expect(await mockFs.readFile('renamed-dir/nested.txt')).toBe('nested content');
    });

    it('should create parent directories for destination', async () => {
      await mockFs.rename('file.txt', 'new/path/file.txt');

      expect(await mockFs.exists('new')).toBe(true);
      expect(await mockFs.exists('new/path')).toBe(true);
      expect(await mockFs.exists('new/path/file.txt')).toBe(true);
    });

    it('should update mtime on rename', async () => {
      const statsBefore = await mockFs.stat('file.txt');

      await new Promise((resolve) => global.setTimeout(resolve, 10));
      await mockFs.rename('file.txt', 'renamed.txt');

      const statsAfter = await mockFs.stat('renamed.txt');
      expect(statsAfter.mtime.getTime()).toBeGreaterThan(statsBefore.mtime.getTime());
    });

    it('should throw error for non-existent source', async () => {
      await expect(mockFs.rename('nonexistent.txt', 'new.txt')).rejects.toThrow('Source not found');
    });
  });

  describe('resolvePath', () => {
    it('should resolve paths correctly', () => {
      expect(mockFs.resolvePath('file.txt')).toBe('/mock/root/file.txt');
      expect(mockFs.resolvePath('dir/file.txt')).toBe('/mock/root/dir/file.txt');
      expect(mockFs.resolvePath('.')).toBe('/mock/root');
    });
  });
});
