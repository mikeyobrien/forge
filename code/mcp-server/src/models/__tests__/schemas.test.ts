// ABOUTME: Tests for Zod schema validation
// ABOUTME: Ensures runtime validation works correctly with proper error messages

import { ZodError } from 'zod';
import {
  frontmatterBaseSchema,
  paraCategorySchema,
  projectStatusSchema,
  paraFrontmatterSchema,
  validParaFrontmatterSchema,
  linkFrontmatterSchema,
  documentSchema,
  createDocumentParamsSchema,
  createParaDocumentParamsSchema,
  searchQuerySchema,
  linkQuerySchema,
  updateDocumentParamsSchema,
} from '../schemas';
import { PARACategory, ProjectStatus } from '../types';

// Mock the config module
jest.mock('../../config', () => ({
  getConfig: (): unknown => ({
    contextRoot: '/test/context',
    debug: false,
  }),
  isWithinContextRoot: (path: string): boolean => {
    return path.startsWith('/test/context');
  },
}));

describe('Schema Validation', () => {
  describe('frontmatterBaseSchema', () => {
    it('should validate minimal frontmatter', () => {
      const valid = frontmatterBaseSchema.parse({
        title: 'Test Document',
      });
      expect(valid.title).toBe('Test Document');
    });

    it('should validate complete frontmatter', () => {
      const valid = frontmatterBaseSchema.parse({
        title: 'Test Document',
        tags: ['test', 'example'],
        created: '2024-01-01T00:00:00Z',
        modified: '2024-01-01T12:00:00Z',
        aliases: ['test-doc', 'example'],
      });
      expect(valid.tags).toHaveLength(2);
    });

    it('should reject empty title', () => {
      expect(() => {
        frontmatterBaseSchema.parse({ title: '' });
      }).toThrow('Title is required');
    });

    it('should reject invalid tags', () => {
      expect(() => {
        frontmatterBaseSchema.parse({
          title: 'Test',
          tags: ['Valid-Tag', 'Invalid Tag'],
        });
      }).toThrow('Tags must be lowercase alphanumeric with hyphens');
    });

    it('should reject invalid date format', () => {
      expect(() => {
        frontmatterBaseSchema.parse({
          title: 'Test',
          created: '2024/01/01',
        });
      }).toThrow('Invalid ISO 8601 date format');
    });
  });

  describe('PARA schemas', () => {
    it('should validate PARA category enum', () => {
      expect(paraCategorySchema.parse('projects')).toBe('projects');
      expect(paraCategorySchema.parse('areas')).toBe('areas');
      expect(paraCategorySchema.parse('resources')).toBe('resources');
      expect(paraCategorySchema.parse('archives')).toBe('archives');
    });

    it('should reject invalid PARA category', () => {
      expect(() => {
        paraCategorySchema.parse('invalid');
      }).toThrow();
    });

    it('should validate project status enum', () => {
      expect(projectStatusSchema.parse('active')).toBe('active');
      expect(projectStatusSchema.parse('completed')).toBe('completed');
      expect(projectStatusSchema.parse('on-hold')).toBe('on-hold');
      expect(projectStatusSchema.parse('cancelled')).toBe('cancelled');
    });

    it('should validate basic PARA frontmatter', () => {
      const valid = paraFrontmatterSchema.parse({
        title: 'Test Project',
        category: PARACategory.Projects,
      });
      expect(valid.category).toBe(PARACategory.Projects);
    });

    it('should validate complete PARA frontmatter', () => {
      const valid = paraFrontmatterSchema.parse({
        title: 'Test Project',
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        due_date: '2024-12-31T00:00:00Z',
        parent: 'parent-project.md',
      });
      expect(valid.status).toBe(ProjectStatus.Active);
    });

    it('should reject status for non-project categories', () => {
      expect(() => {
        validParaFrontmatterSchema.parse({
          title: 'Test Area',
          category: PARACategory.Areas,
          status: ProjectStatus.Active,
        });
      }).toThrow('Status and due_date are only valid for Projects');
    });

    it('should reject due_date for non-project categories', () => {
      expect(() => {
        validParaFrontmatterSchema.parse({
          title: 'Test Resource',
          category: PARACategory.Resources,
          due_date: '2024-12-31T00:00:00Z',
        });
      }).toThrow('Status and due_date are only valid for Projects');
    });
  });

  describe('linkFrontmatterSchema', () => {
    it('should validate link frontmatter', () => {
      const valid = linkFrontmatterSchema.parse({
        title: 'Linked Document',
        links_to: ['doc1.md', 'folder/doc2.md'],
        backlinks: ['doc3.md'],
      });
      expect(valid.links_to).toHaveLength(2);
    });

    it('should reject invalid document IDs', () => {
      expect(() => {
        linkFrontmatterSchema.parse({
          title: 'Test',
          links_to: ['/absolute/path.md'],
        });
      }).toThrow('Document ID must be a relative path');
    });

    it('should reject paths with ..', () => {
      expect(() => {
        linkFrontmatterSchema.parse({
          title: 'Test',
          links_to: ['../outside/context.md'],
        });
      }).toThrow('Document ID must be a relative path without ..');
    });
  });

  describe('documentSchema', () => {
    it('should validate minimal document', () => {
      const valid = documentSchema.parse({
        id: 'test.md',
        path: '/test/context/test.md',
        frontmatter: {
          title: 'Test Document',
          category: PARACategory.Resources,
        },
        content: 'Document content',
      });
      expect(valid.id).toBe('test.md');
    });

    it('should validate complete document', () => {
      const valid = documentSchema.parse({
        id: 'test.md',
        path: '/test/context/test.md',
        frontmatter: {
          title: 'Test Document',
          category: PARACategory.Resources,
          tags: ['test'],
          links_to: ['other.md'],
          customField: 'allowed',
        },
        content: 'Document content',
        raw: '---\ntitle: Test Document\n---\nDocument content',
        stats: {
          size: 100,
          created: new Date('2024-01-01'),
          modified: new Date('2024-01-01'),
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((valid.frontmatter as any)['customField']).toBe('allowed');
    });

    it('should reject path outside CONTEXT_ROOT', () => {
      expect(() => {
        documentSchema.parse({
          id: 'test.md',
          path: '/outside/context/test.md',
          frontmatter: {
            title: 'Test',
            category: PARACategory.Resources,
          },
          content: '',
        });
      }).toThrow('Path must be within CONTEXT_ROOT');
    });
  });

  describe('createDocumentParamsSchema', () => {
    it('should validate minimal params', () => {
      const valid = createDocumentParamsSchema.parse({
        path: 'new-doc.md',
        title: 'New Document',
      });
      expect(valid.path).toBe('new-doc.md');
    });

    it('should validate complete params', () => {
      const valid = createDocumentParamsSchema.parse({
        path: 'folder/new-doc.md',
        title: 'New Document',
        content: 'Initial content',
        tags: ['new', 'test'],
        category: PARACategory.Resources,
        frontmatter: {
          aliases: ['new-doc'],
        },
      });
      expect(valid.tags).toHaveLength(2);
    });

    it('should reject empty title', () => {
      expect(() => {
        createDocumentParamsSchema.parse({
          path: 'test.md',
          title: '',
        });
      }).toThrow();
    });
  });

  describe('createParaDocumentParamsSchema', () => {
    it('should validate project params', () => {
      const valid = createParaDocumentParamsSchema.parse({
        path: 'projects/new-project.md',
        title: 'New Project',
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        due_date: '2024-12-31T00:00:00Z',
      });
      expect(valid.status).toBe(ProjectStatus.Active);
    });

    it('should validate area params', () => {
      const valid = createParaDocumentParamsSchema.parse({
        path: 'areas/new-area.md',
        title: 'New Area',
        category: PARACategory.Areas,
        parent: 'parent-area.md',
      });
      expect(valid.parent).toBe('parent-area.md');
    });

    it('should reject status for non-projects', () => {
      expect(() => {
        createParaDocumentParamsSchema.parse({
          path: 'areas/test.md',
          title: 'Test',
          category: PARACategory.Areas,
          status: ProjectStatus.Active,
        });
      }).toThrow('Status and due_date are only valid for Projects');
    });
  });

  describe('searchQuerySchema', () => {
    it('should validate empty query with defaults', () => {
      const valid = searchQuerySchema.parse({});
      expect(valid.limit).toBe(20);
      expect(valid.offset).toBe(0);
    });

    it('should validate complete query', () => {
      const valid = searchQuerySchema.parse({
        title: 'search term',
        content: 'content search',
        tags: ['tag1', 'tag2'],
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        limit: 50,
        offset: 10,
      });
      expect(valid.limit).toBe(50);
    });

    it('should reject limit over 100', () => {
      expect(() => {
        searchQuerySchema.parse({ limit: 101 });
      }).toThrow();
    });

    it('should reject negative offset', () => {
      expect(() => {
        searchQuerySchema.parse({ offset: -1 });
      }).toThrow();
    });
  });

  describe('linkQuerySchema', () => {
    it('should validate with defaults', () => {
      const valid = linkQuerySchema.parse({
        documentId: 'doc.md',
      });
      expect(valid.includeForward).toBe(true);
      expect(valid.includeBacklinks).toBe(true);
      expect(valid.depth).toBe(1);
    });

    it('should validate custom values', () => {
      const valid = linkQuerySchema.parse({
        documentId: 'doc.md',
        includeForward: false,
        includeBacklinks: true,
        depth: 3,
      });
      expect(valid.depth).toBe(3);
    });

    it('should reject depth over 5', () => {
      expect(() => {
        linkQuerySchema.parse({
          documentId: 'doc.md',
          depth: 6,
        });
      }).toThrow();
    });
  });

  describe('updateDocumentParamsSchema', () => {
    it('should validate single field update', () => {
      const valid = updateDocumentParamsSchema.parse({
        id: 'doc.md',
        title: 'Updated Title',
      });
      expect(valid.title).toBe('Updated Title');
    });

    it('should validate multiple field updates', () => {
      const valid = updateDocumentParamsSchema.parse({
        id: 'doc.md',
        title: 'Updated Title',
        content: 'Updated content',
        addTags: ['new-tag'],
        removeTags: ['old-tag'],
        frontmatter: {
          status: ProjectStatus.Completed,
        },
      });
      expect(valid.addTags).toHaveLength(1);
    });

    it('should reject empty update', () => {
      expect(() => {
        updateDocumentParamsSchema.parse({
          id: 'doc.md',
        });
      }).toThrow('At least one field must be provided for update');
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error messages', () => {
      try {
        documentSchema.parse({
          id: 123,
          path: true,
          frontmatter: 'not an object',
          content: null,
        });
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.errors).toHaveLength(4);
        expect(zodError.errors[0]?.path).toEqual(['id']);
        expect(zodError.errors[1]?.path).toEqual(['path']);
        expect(zodError.errors[2]?.path).toEqual(['frontmatter']);
        expect(zodError.errors[3]?.path).toEqual(['content']);
      }
    });
  });
});
