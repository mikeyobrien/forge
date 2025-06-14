// ABOUTME: Tests for LinkResolver class that resolves wiki-link targets
// ABOUTME: Verifies path resolution, validation, and anchor extraction

import { LinkResolver } from '../LinkResolver';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import { join } from 'path';

describe('LinkResolver', () => {
  let resolver: LinkResolver;
  let mockFs: MockFileSystem;
  const contextRoot = '/test/context';

  beforeEach(() => {
    mockFs = new MockFileSystem(contextRoot);
    resolver = new LinkResolver(contextRoot, mockFs);

    // Set up mock file system
    mockFs.writeFileSync(join(contextRoot, 'projects', 'project1.md'), 'Project 1');
    mockFs.writeFileSync(join(contextRoot, 'areas', 'area1.md'), 'Area 1');
    mockFs.writeFileSync(join(contextRoot, 'resources', 'resource1.md'), 'Resource 1');
    mockFs.writeFileSync(join(contextRoot, 'archives', 'archive1.md'), 'Archive 1');
    mockFs.writeFileSync(join(contextRoot, 'index.md'), 'Index');
    mockFs.writeFileSync(join(contextRoot, 'projects', 'nested', 'deep.md'), 'Deep');
  });

  describe('resolve', () => {
    it('should resolve absolute paths within context', async () => {
      const sourcePath = join(contextRoot, 'index.md');

      expect(await resolver.resolve('/projects/project1', sourcePath)).toBe(
        join(contextRoot, 'projects', 'project1.md'),
      );

      expect(await resolver.resolve('/areas/area1.md', sourcePath)).toBe(
        join(contextRoot, 'areas', 'area1.md'),
      );
    });

    it('should resolve relative paths from source document', async () => {
      const sourcePath = join(contextRoot, 'projects', 'project1.md');

      expect(await resolver.resolve('nested/deep', sourcePath)).toBe(
        join(contextRoot, 'projects', 'nested', 'deep.md'),
      );

      expect(await resolver.resolve('../areas/area1', sourcePath)).toBe(
        join(contextRoot, 'areas', 'area1.md'),
      );
    });

    it('should try PARA categories for bare filenames', async () => {
      const sourcePath = join(contextRoot, 'index.md');

      expect(await resolver.resolve('project1', sourcePath)).toBe(
        join(contextRoot, 'projects', 'project1.md'),
      );

      expect(await resolver.resolve('area1', sourcePath)).toBe(
        join(contextRoot, 'areas', 'area1.md'),
      );

      expect(await resolver.resolve('resource1', sourcePath)).toBe(
        join(contextRoot, 'resources', 'resource1.md'),
      );
    });

    it('should handle links with anchors', async () => {
      const sourcePath = join(contextRoot, 'index.md');

      expect(await resolver.resolve('projects/project1#section', sourcePath)).toBe(
        join(contextRoot, 'projects', 'project1.md'),
      );

      expect(await resolver.resolve('/areas/area1.md#heading', sourcePath)).toBe(
        join(contextRoot, 'areas', 'area1.md'),
      );
    });

    it('should return null for empty targets', async () => {
      const sourcePath = join(contextRoot, 'index.md');

      expect(await resolver.resolve('', sourcePath)).toBeNull();
      expect(await resolver.resolve('  ', sourcePath)).toBeNull();
      expect(await resolver.resolve('#anchor-only', sourcePath)).toBeNull();
    });

    it('should return path even for non-existent files', async () => {
      const sourcePath = join(contextRoot, 'index.md');

      // Should return the most likely path even if file doesn't exist
      const result = await resolver.resolve('non-existent', sourcePath);
      expect(result).toBeTruthy();
      expect(result).toContain('non-existent');
    });

    it('should handle paths with spaces', async () => {
      const sourcePath = join(contextRoot, 'index.md');
      mockFs.writeFileSync(join(contextRoot, 'my document.md'), 'Content');

      expect(await resolver.resolve('my document', sourcePath)).toBe(
        join(contextRoot, 'my document.md'),
      );
    });

    it('should prefer .md extension', async () => {
      const sourcePath = join(contextRoot, 'index.md');
      mockFs.writeFileSync(join(contextRoot, 'test.txt'), 'Text');
      mockFs.writeFileSync(join(contextRoot, 'test.md'), 'Markdown');

      expect(await resolver.resolve('test', sourcePath)).toBe(join(contextRoot, 'test.md'));
    });
  });

  describe('exists', () => {
    it('should check if resolved path exists', async () => {
      expect(await resolver.exists(join(contextRoot, 'projects', 'project1.md'))).toBe(true);

      expect(await resolver.exists(join(contextRoot, 'non-existent.md'))).toBe(false);
    });

    it('should validate path is within context root', async () => {
      expect(await resolver.exists('/outside/context/file.md')).toBe(false);
      expect(await resolver.exists(join(contextRoot, '..', 'outside.md'))).toBe(false);
    });
  });

  describe('extractAnchor', () => {
    it('should extract anchor from link target', () => {
      expect(resolver.extractAnchor('document#section')).toBe('section');
      expect(resolver.extractAnchor('path/to/doc#heading-1')).toBe('heading-1');
      expect(resolver.extractAnchor('doc#multiple#anchors')).toBe('multiple#anchors');
    });

    it('should return undefined for links without anchors', () => {
      expect(resolver.extractAnchor('document')).toBeUndefined();
      expect(resolver.extractAnchor('path/to/doc.md')).toBeUndefined();
    });

    it('should handle edge cases', () => {
      expect(resolver.extractAnchor('#')).toBe('');
      expect(resolver.extractAnchor('doc#')).toBe('');
    });
  });

  describe('security', () => {
    it('should prevent path traversal attacks', async () => {
      const sourcePath = join(contextRoot, 'index.md');

      expect(await resolver.resolve('../../../etc/passwd', sourcePath)).toBeNull();
      expect(await resolver.resolve('/etc/passwd', sourcePath)).not.toBe('/etc/passwd');
    });

    it('should ensure all resolved paths are within context root', async () => {
      const sourcePath = join(contextRoot, 'projects', 'project.md');
      const testCases = [
        '../../outside',
        '../../../root',
        '/absolute/path',
        'C:\\Windows\\System32',
      ];

      for (const testCase of testCases) {
        const resolved = await resolver.resolve(testCase, sourcePath);
        if (resolved) {
          expect(resolved.startsWith(contextRoot)).toBe(true);
        }
      }
    });
  });
});
