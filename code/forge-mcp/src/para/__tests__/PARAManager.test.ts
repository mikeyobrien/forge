// ABOUTME: Tests for PARAManager class functionality
// ABOUTME: Validates directory management, path resolution, and security

import * as path from 'path';
import { PARAManager } from '../PARAManager';
import { PARACategory } from '../types';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import { SecurityError } from '../../filesystem/security';

describe('PARAManager', () => {
  let mockFs: MockFileSystem;
  let paraManager: PARAManager;
  const contextRoot = '/test/context';

  beforeEach(() => {
    mockFs = new MockFileSystem(contextRoot);
    paraManager = new PARAManager(contextRoot, mockFs);
  });

  describe('constructor', () => {
    it('should initialize with resolved context root', () => {
      expect(paraManager.getContextRoot()).toBe(path.resolve(contextRoot));
    });

    it('should create proper structure mapping', () => {
      const structure = paraManager.getStructure();
      expect(structure[PARACategory.Projects]).toBe(path.join(contextRoot, 'projects'));
      expect(structure[PARACategory.Areas]).toBe(path.join(contextRoot, 'areas'));
      expect(structure[PARACategory.Resources]).toBe(path.join(contextRoot, 'resources'));
      expect(structure[PARACategory.Archives]).toBe(path.join(contextRoot, 'archives'));
    });
  });

  describe('initializeStructure', () => {
    it('should create all PARA directories', async () => {
      await paraManager.initializeStructure();

      expect(await mockFs.exists(path.join(contextRoot, 'projects'))).toBe(true);
      expect(await mockFs.exists(path.join(contextRoot, 'areas'))).toBe(true);
      expect(await mockFs.exists(path.join(contextRoot, 'resources'))).toBe(true);
      expect(await mockFs.exists(path.join(contextRoot, 'archives'))).toBe(true);
    });

    it('should handle existing directories gracefully', async () => {
      // Pre-create some directories
      await mockFs.createDirectory(path.join(contextRoot, 'projects'));
      await mockFs.createDirectory(path.join(contextRoot, 'areas'));

      // Should not throw
      await expect(paraManager.initializeStructure()).resolves.not.toThrow();

      // All directories should exist
      expect(await mockFs.exists(path.join(contextRoot, 'projects'))).toBe(true);
      expect(await mockFs.exists(path.join(contextRoot, 'areas'))).toBe(true);
      expect(await mockFs.exists(path.join(contextRoot, 'resources'))).toBe(true);
      expect(await mockFs.exists(path.join(contextRoot, 'archives'))).toBe(true);
    });
  });

  describe('getCategoryPath', () => {
    it('should return correct path for each category', () => {
      expect(paraManager.getCategoryPath(PARACategory.Projects)).toBe(
        path.join(contextRoot, 'projects'),
      );
      expect(paraManager.getCategoryPath(PARACategory.Areas)).toBe(path.join(contextRoot, 'areas'));
      expect(paraManager.getCategoryPath(PARACategory.Resources)).toBe(
        path.join(contextRoot, 'resources'),
      );
      expect(paraManager.getCategoryPath(PARACategory.Archives)).toBe(
        path.join(contextRoot, 'archives'),
      );
    });
  });

  describe('resolveDocumentPath', () => {
    it('should resolve document path correctly', () => {
      const docPath = paraManager.resolveDocumentPath(PARACategory.Projects, 'test-doc.md');
      expect(docPath).toBe(path.join(contextRoot, 'projects', 'test-doc.md'));
    });

    it('should add .md extension if missing', () => {
      const docPath = paraManager.resolveDocumentPath(PARACategory.Areas, 'test-doc');
      expect(docPath).toBe(path.join(contextRoot, 'areas', 'test-doc.md'));
    });

    it('should sanitize document names', () => {
      const docPath = paraManager.resolveDocumentPath(PARACategory.Resources, '../../../evil.md');
      // "../../../evil.md" -> ".._.._.._evil.md" (dots replaced) -> "______evil.md" (slashes replaced)
      expect(docPath).toBe(path.join(contextRoot, 'resources', '______evil.md'));
    });

    it('should prevent path traversal attempts', () => {
      // Try to use a path that would escape context root
      const maliciousPath = '../../../../etc/passwd';
      const resolved = paraManager.resolveDocumentPath(PARACategory.Projects, maliciousPath);

      // The path should be sanitized and stay within context
      expect(resolved.startsWith(path.join(contextRoot, 'projects'))).toBe(true);
      expect(resolved).not.toContain('..');
    });
  });

  describe('moveDocument', () => {
    beforeEach(async () => {
      await paraManager.initializeStructure();
      // Create a test document
      const testDoc = path.join(contextRoot, 'projects', 'test.md');
      await mockFs.writeFile(testDoc, 'Test content');
    });

    it('should move document between categories', async () => {
      const sourcePath = path.join(contextRoot, 'projects', 'test.md');
      const newPath = await paraManager.moveDocument(sourcePath, PARACategory.Archives);

      expect(newPath).toBe(path.join(contextRoot, 'archives', 'test.md'));
      expect(await mockFs.exists(sourcePath)).toBe(false);
      expect(await mockFs.exists(newPath)).toBe(true);
      expect(await mockFs.readFile(newPath)).toBe('Test content');
    });

    it('should throw if target document already exists', async () => {
      const sourcePath = path.join(contextRoot, 'projects', 'test.md');
      const targetPath = path.join(contextRoot, 'archives', 'test.md');
      await mockFs.writeFile(targetPath, 'Existing content');

      await expect(paraManager.moveDocument(sourcePath, PARACategory.Archives)).rejects.toThrow(
        'Document already exists in archives: test.md',
      );
    });

    it('should validate source path security', async () => {
      const maliciousPath = '/etc/passwd';

      await expect(paraManager.moveDocument(maliciousPath, PARACategory.Projects)).rejects.toThrow(
        SecurityError,
      );
    });
  });

  describe('getDocumentCategory', () => {
    it('should identify correct category for documents', () => {
      expect(paraManager.getDocumentCategory(path.join(contextRoot, 'projects', 'test.md'))).toBe(
        PARACategory.Projects,
      );
      expect(paraManager.getDocumentCategory(path.join(contextRoot, 'areas', 'test.md'))).toBe(
        PARACategory.Areas,
      );
      expect(paraManager.getDocumentCategory(path.join(contextRoot, 'resources', 'test.md'))).toBe(
        PARACategory.Resources,
      );
      expect(paraManager.getDocumentCategory(path.join(contextRoot, 'archives', 'test.md'))).toBe(
        PARACategory.Archives,
      );
    });

    it('should return null for documents outside PARA structure', () => {
      expect(
        paraManager.getDocumentCategory(path.join(contextRoot, 'other', 'test.md')),
      ).toBeNull();
      expect(paraManager.getDocumentCategory(path.join(contextRoot, 'test.md'))).toBeNull();
    });

    it('should validate path security', () => {
      expect(() => paraManager.getDocumentCategory('/etc/passwd')).toThrow(SecurityError);
    });
  });

  describe('validateCategory', () => {
    it('should return true for valid categories', () => {
      expect(paraManager.validateCategory('projects')).toBe(true);
      expect(paraManager.validateCategory('areas')).toBe(true);
      expect(paraManager.validateCategory('resources')).toBe(true);
      expect(paraManager.validateCategory('archives')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(paraManager.validateCategory('invalid')).toBe(false);
      expect(paraManager.validateCategory('')).toBe(false);
    });
  });

  describe('listDocuments', () => {
    beforeEach(async () => {
      await paraManager.initializeStructure();

      // Create test documents
      await mockFs.writeFile(path.join(contextRoot, 'projects', 'project1.md'), 'content');
      await mockFs.writeFile(path.join(contextRoot, 'projects', 'project2.md'), 'content');
      await mockFs.writeFile(path.join(contextRoot, 'areas', 'area1.md'), 'content');
      await mockFs.writeFile(path.join(contextRoot, 'projects', 'not-markdown.txt'), 'content');
      await mockFs.createDirectory(path.join(contextRoot, 'projects', 'subdir'));
    });

    it('should list documents in a category', async () => {
      const documents = await paraManager.listDocuments(PARACategory.Projects);

      expect(documents).toHaveLength(2);
      expect(documents).toContainEqual({
        category: PARACategory.Projects,
        path: path.join(contextRoot, 'projects', 'project1.md'),
        name: 'project1.md',
      });
      expect(documents).toContainEqual({
        category: PARACategory.Projects,
        path: path.join(contextRoot, 'projects', 'project2.md'),
        name: 'project2.md',
      });
    });

    it('should only include markdown files', async () => {
      const documents = await paraManager.listDocuments(PARACategory.Projects);
      const names = documents.map((d) => d.name);

      expect(names).not.toContain('not-markdown.txt');
      expect(names).not.toContain('subdir');
    });

    it('should return empty array for empty categories', async () => {
      const documents = await paraManager.listDocuments(PARACategory.Resources);
      expect(documents).toEqual([]);
    });
  });

  describe('getAllDocuments', () => {
    beforeEach(async () => {
      await paraManager.initializeStructure();

      // Create documents in different categories
      await mockFs.writeFile(path.join(contextRoot, 'projects', 'project1.md'), 'content');
      await mockFs.writeFile(path.join(contextRoot, 'areas', 'area1.md'), 'content');
      await mockFs.writeFile(path.join(contextRoot, 'resources', 'resource1.md'), 'content');
      await mockFs.writeFile(path.join(contextRoot, 'archives', 'archive1.md'), 'content');
    });

    it('should list all documents across categories', async () => {
      const documents = await paraManager.getAllDocuments();

      expect(documents).toHaveLength(4);

      const categories = documents.map((d) => d.category);
      expect(categories).toContain(PARACategory.Projects);
      expect(categories).toContain(PARACategory.Areas);
      expect(categories).toContain(PARACategory.Resources);
      expect(categories).toContain(PARACategory.Archives);
    });

    it('should maintain category information', async () => {
      const documents = await paraManager.getAllDocuments();

      const projectDoc = documents.find((d) => d.name === 'project1.md');
      expect(projectDoc?.category).toBe(PARACategory.Projects);

      const areaDoc = documents.find((d) => d.name === 'area1.md');
      expect(areaDoc?.category).toBe(PARACategory.Areas);
    });
  });

  describe('security', () => {
    it('should prevent all forms of path traversal', () => {
      const attacks = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'test/../../../../../../etc/passwd',
        'test%2F..%2F..%2F..%2Fetc%2Fpasswd',
      ];

      for (const attack of attacks) {
        const sanitized = paraManager.resolveDocumentPath(PARACategory.Projects, attack);
        expect(sanitized.startsWith(path.join(contextRoot, 'projects'))).toBe(true);
      }
    });

    it('should maintain immutability of structure', () => {
      const structure1 = paraManager.getStructure();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (structure1 as any)[PARACategory.Projects] = '/malicious/path';

      const structure2 = paraManager.getStructure();
      expect(structure2[PARACategory.Projects]).toBe(path.join(contextRoot, 'projects'));
    });
  });
});
