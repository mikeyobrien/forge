// ABOUTME: Tests for document factory functions
// ABOUTME: Ensures documents are created with proper defaults and validation

import {
  createDocument,
  createPARADocument,
  createProject,
  createArea,
  createResource,
  createArchive,
  cloneDocument,
  touchDocument,
} from '../factories';
import { PARACategory, ProjectStatus, Document } from '../types';

// Mock the config module
jest.mock('../../config', () => ({
  getConfig: (): unknown => ({
    contextRoot: '/test/context',
    debug: false,
  }),
}));

// Mock date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00Z');
const originalDate = Date;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  global.Date = jest.fn(() => mockDate) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (global.Date as any).prototype = originalDate.prototype;
});

afterAll(() => {
  global.Date = originalDate;
});

describe('Document Factories', () => {
  describe('createDocument', () => {
    it('should create minimal document with defaults', () => {
      const doc = createDocument({
        path: 'test-doc',
        title: 'Test Document',
      });

      expect(doc.id).toBe('test-doc.md');
      expect(doc.path).toBe('/test/context/test-doc.md');
      expect(doc.frontmatter.title).toBe('Test Document');
      expect(doc.frontmatter.category).toBe(PARACategory.Resources);
      expect(doc.frontmatter.created).toBe('2024-01-01T00:00:00.000Z');
      expect(doc.frontmatter.modified).toBe('2024-01-01T00:00:00.000Z');
      expect(doc.content).toBe('');
    });

    it('should handle path with .md extension', () => {
      const doc = createDocument({
        path: 'test-doc.md',
        title: 'Test Document',
      });

      expect(doc.id).toBe('test-doc.md');
      expect(doc.path).toBe('/test/context/test-doc.md');
    });

    it('should handle nested paths', () => {
      const doc = createDocument({
        path: 'folder/subfolder/test-doc',
        title: 'Test Document',
      });

      expect(doc.id).toBe('folder/subfolder/test-doc.md');
      expect(doc.path).toBe('/test/context/folder/subfolder/test-doc.md');
    });

    it('should normalize paths', () => {
      const doc = createDocument({
        path: './folder/../other/test-doc',
        title: 'Test Document',
      });

      expect(doc.id).toBe('other/test-doc.md');
      expect(doc.path).toBe('/test/context/other/test-doc.md');
    });

    it('should create document with all options', () => {
      const doc = createDocument({
        path: 'test-doc',
        title: 'Test Document',
        content: 'Initial content',
        tags: ['test', 'example'],
        category: PARACategory.Projects,
        frontmatter: {
          aliases: ['test-alias'],
          customField: 'custom value',
        },
      });

      expect(doc.content).toBe('Initial content');
      expect(doc.frontmatter.tags).toEqual(['test', 'example']);
      expect(doc.frontmatter.category).toBe(PARACategory.Projects);
      expect(doc.frontmatter.aliases).toEqual(['test-alias']);
      expect(doc.frontmatter['customField']).toBe('custom value');
    });

    it('should validate parameters', () => {
      expect(() => {
        createDocument({
          path: '',
          title: 'Test',
        });
      }).toThrow();

      expect(() => {
        createDocument({
          path: 'test',
          title: '',
        });
      }).toThrow();
    });

    it('should validate tags format', () => {
      expect(() => {
        createDocument({
          path: 'test',
          title: 'Test',
          tags: ['Invalid Tag'],
        });
      }).toThrow('Tags must be lowercase alphanumeric with hyphens');
    });
  });

  describe('createPARADocument', () => {
    it('should create basic PARA document', () => {
      const doc = createPARADocument({
        path: 'areas/test-area',
        title: 'Test Area',
        category: PARACategory.Areas,
      });

      expect(doc.id).toBe('areas/test-area.md');
      expect(doc.frontmatter.category).toBe(PARACategory.Areas);
      expect(doc.frontmatter.status).toBeUndefined();
    });

    it('should create project with defaults', () => {
      const doc = createPARADocument({
        path: 'projects/test-project',
        title: 'Test Project',
        category: PARACategory.Projects,
      });

      expect(doc.frontmatter.category).toBe(PARACategory.Projects);
      expect(doc.frontmatter.status).toBe(ProjectStatus.Active);
    });

    it('should create project with all fields', () => {
      const doc = createPARADocument({
        path: 'projects/test-project',
        title: 'Test Project',
        category: PARACategory.Projects,
        status: ProjectStatus.OnHold,
        due_date: '2024-12-31T00:00:00Z',
        parent: 'projects/parent-project.md',
        content: 'Project description',
        tags: ['important', 'q4'],
      });

      expect(doc.frontmatter.status).toBe(ProjectStatus.OnHold);
      expect(doc.frontmatter.due_date).toBe('2024-12-31T00:00:00Z');
      expect(doc.frontmatter.parent).toBe('projects/parent-project.md');
      expect(doc.content).toBe('Project description');
      expect(doc.frontmatter.tags).toEqual(['important', 'q4']);
    });

    it('should reject status for non-projects', () => {
      expect(() => {
        createPARADocument({
          path: 'areas/test',
          title: 'Test',
          category: PARACategory.Areas,
          status: ProjectStatus.Active,
        });
      }).toThrow('Status and due_date are only valid for Projects');
    });

    it('should reject due_date for non-projects', () => {
      expect(() => {
        createPARADocument({
          path: 'resources/test',
          title: 'Test',
          category: PARACategory.Resources,
          due_date: '2024-12-31T00:00:00Z',
        });
      }).toThrow('Status and due_date are only valid for Projects');
    });
  });

  describe('Convenience Factories', () => {
    it('should create project', () => {
      const doc = createProject('projects/new-project', 'New Project', {
        status: ProjectStatus.Active,
        due_date: '2024-12-31T00:00:00Z',
        tags: ['project'],
      });

      expect(doc.frontmatter.category).toBe(PARACategory.Projects);
      expect(doc.frontmatter.status).toBe(ProjectStatus.Active);
      expect(doc.frontmatter.due_date).toBe('2024-12-31T00:00:00Z');
    });

    it('should create area', () => {
      const doc = createArea('areas/new-area', 'New Area', {
        parent: 'areas/parent.md',
        tags: ['area'],
      });

      expect(doc.frontmatter.category).toBe(PARACategory.Areas);
      expect(doc.frontmatter.parent).toBe('areas/parent.md');
    });

    it('should create resource', () => {
      const doc = createResource('resources/new-resource', 'New Resource', {
        content: 'Resource content',
        tags: ['reference'],
      });

      expect(doc.frontmatter.category).toBe(PARACategory.Resources);
      expect(doc.content).toBe('Resource content');
    });

    it('should create archive', () => {
      const doc = createArchive('archives/old-project', 'Old Project', {
        tags: ['archived', '2023'],
      });

      expect(doc.frontmatter.category).toBe(PARACategory.Archives);
      expect(doc.frontmatter.tags).toEqual(['archived', '2023']);
    });
  });

  describe('Document Utilities', () => {
    const originalDoc: Document = {
      id: 'original.md',
      path: '/test/context/original.md',
      frontmatter: {
        title: 'Original Document',
        category: PARACategory.Resources,
        created: '2023-01-01T00:00:00Z',
        modified: '2023-06-01T00:00:00Z',
        tags: ['original'],
      },
      content: 'Original content',
    };

    describe('cloneDocument', () => {
      it('should clone document with new path', () => {
        const cloned = cloneDocument(originalDoc, 'cloned');

        expect(cloned.id).toBe('cloned.md');
        expect(cloned.path).toBe('/test/context/cloned.md');
        expect(cloned.frontmatter.title).toBe('Original Document');
        expect(cloned.frontmatter.created).toBe('2023-01-01T00:00:00Z');
        expect(cloned.frontmatter.modified).toBe('2024-01-01T00:00:00.000Z');
        expect(cloned.content).toBe('Original content');
        expect(cloned.frontmatter.tags).toEqual(['original']);
      });

      it('should handle nested clone paths', () => {
        const cloned = cloneDocument(originalDoc, 'folder/cloned');

        expect(cloned.id).toBe('folder/cloned.md');
        expect(cloned.path).toBe('/test/context/folder/cloned.md');
      });

      it('should not modify original document', () => {
        cloneDocument(originalDoc, 'cloned');

        expect(originalDoc.id).toBe('original.md');
        expect(originalDoc.frontmatter.modified).toBe('2023-06-01T00:00:00Z');
      });
    });

    describe('touchDocument', () => {
      it('should update modified timestamp', () => {
        const touched = touchDocument(originalDoc);

        expect(touched.frontmatter.modified).toBe('2024-01-01T00:00:00.000Z');
        expect(touched.frontmatter.created).toBe('2023-01-01T00:00:00Z');
        expect(touched.id).toBe('original.md');
        expect(touched.content).toBe('Original content');
      });

      it('should not modify original document', () => {
        touchDocument(originalDoc);

        expect(originalDoc.frontmatter.modified).toBe('2023-06-01T00:00:00Z');
      });

      it('should preserve all other fields', () => {
        const touched = touchDocument(originalDoc);

        expect(touched.frontmatter.title).toBe('Original Document');
        expect(touched.frontmatter.category).toBe(PARACategory.Resources);
        expect(touched.frontmatter.tags).toEqual(['original']);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags array', () => {
      const doc = createDocument({
        path: 'test',
        title: 'Test',
        tags: [],
      });

      expect(doc.frontmatter.tags).toBeUndefined();
    });

    it('should merge frontmatter properly', () => {
      const doc = createDocument({
        path: 'test',
        title: 'Test',
        frontmatter: {
          created: '2023-01-01T00:00:00Z',
          customField: 'value',
        },
      });

      expect(doc.frontmatter.created).toBe('2023-01-01T00:00:00Z');
      expect(doc.frontmatter.modified).toBe('2024-01-01T00:00:00.000Z');
      expect(doc.frontmatter['customField']).toBe('value');
    });

    it('should handle paths with leading slash', () => {
      const doc = createDocument({
        path: '/folder/test',
        title: 'Test',
      });

      expect(doc.id).toBe('folder/test.md');
    });
  });
});
