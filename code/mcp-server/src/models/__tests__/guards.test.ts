// ABOUTME: Tests for type guard functions
// ABOUTME: Ensures runtime type checking works correctly

import {
  isDocument,
  isPARADocument,
  isDocumentPARA,
  isValidFrontmatter,
  isPARAFrontmatter,
  isDocumentFrontmatter,
  isInPARACategory,
  isProject,
  isArea,
  isResource,
  isArchived,
  isISODateString,
  isValidTag,
  isValidDocumentId,
  assertDocument,
  assertPARADocument,
  extractValidFrontmatter,
} from '../guards';
import { Document, PARACategory, ProjectStatus, Frontmatter } from '../types';

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

describe('Type Guards', () => {
  describe('isDocument', () => {
    it('should return true for valid document', () => {
      const doc = {
        id: 'test.md',
        path: '/test/context/test.md',
        frontmatter: {
          title: 'Test Document',
          category: PARACategory.Resources,
        },
        content: 'Content',
      };
      expect(isDocument(doc)).toBe(true);
    });

    it('should return false for invalid document', () => {
      expect(isDocument({})).toBe(false);
      expect(isDocument(null)).toBe(false);
      expect(isDocument(undefined)).toBe(false);
      expect(isDocument('not a document')).toBe(false);
      expect(isDocument({ id: 'test.md' })).toBe(false); // Missing required fields
    });

    it('should return false for document with invalid path', () => {
      const doc = {
        id: 'test.md',
        path: '/outside/context/test.md',
        frontmatter: { title: 'Test', category: PARACategory.Resources },
        content: 'Content',
      };
      expect(isDocument(doc)).toBe(false);
    });
  });

  describe('isPARADocument', () => {
    it('should return true for valid PARA document', () => {
      const doc = {
        id: 'project.md',
        path: '/test/context/projects/project.md',
        frontmatter: {
          title: 'Test Project',
          category: PARACategory.Projects,
          status: ProjectStatus.Active,
        },
        content: 'Content',
      };
      expect(isPARADocument(doc)).toBe(true);
    });

    it('should return false for non-PARA document', () => {
      const doc = {
        id: 'test.md',
        path: '/test/context/test.md',
        frontmatter: {
          title: 'Test',
          // Missing category
        },
        content: 'Content',
      };
      expect(isPARADocument(doc)).toBe(false);
    });

    it('should return false for invalid project status placement', () => {
      const doc = {
        id: 'area.md',
        path: '/test/context/areas/area.md',
        frontmatter: {
          title: 'Test Area',
          category: PARACategory.Areas,
          status: ProjectStatus.Active, // Invalid for Areas
        },
        content: 'Content',
      };
      expect(isPARADocument(doc)).toBe(false);
    });
  });

  describe('isDocumentPARA', () => {
    it('should narrow Document to PARADocument', () => {
      const doc: Document = {
        id: 'project.md',
        path: '/test/context/projects/project.md',
        frontmatter: {
          title: 'Test Project',
          category: PARACategory.Projects,
          status: ProjectStatus.Active,
        },
        content: 'Content',
      };

      if (isDocumentPARA(doc)) {
        // TypeScript should know this is a PARADocument
        expect(doc.frontmatter.category).toBe(PARACategory.Projects);
      } else {
        throw new Error('Should have been identified as PARA document');
      }
    });
  });

  describe('Frontmatter Guards', () => {
    it('should validate base frontmatter', () => {
      expect(isValidFrontmatter({ title: 'Test' })).toBe(true);
      expect(
        isValidFrontmatter({
          title: 'Test',
          tags: ['test'],
          created: '2024-01-01T00:00:00Z',
        }),
      ).toBe(true);

      expect(isValidFrontmatter({})).toBe(false);
      expect(isValidFrontmatter({ title: '' })).toBe(false);
      expect(isValidFrontmatter({ title: 'Test', tags: ['Invalid Tag'] })).toBe(false);
    });

    it('should validate PARA frontmatter', () => {
      expect(
        isPARAFrontmatter({
          title: 'Test',
          category: PARACategory.Projects,
        }),
      ).toBe(true);

      expect(
        isPARAFrontmatter({
          title: 'Test',
          category: 'invalid',
        }),
      ).toBe(false);
    });

    it('should validate document frontmatter', () => {
      expect(
        isDocumentFrontmatter({
          title: 'Test',
          category: PARACategory.Resources,
          links_to: ['other.md'],
          customField: 'allowed',
        }),
      ).toBe(true);
    });
  });

  describe('Category Guards', () => {
    const projectDoc: Document = {
      id: 'project.md',
      path: '/test/context/projects/project.md',
      frontmatter: {
        title: 'Test Project',
        category: PARACategory.Projects,
      },
      content: 'Content',
    };

    const areaDoc: Document = {
      id: 'area.md',
      path: '/test/context/areas/area.md',
      frontmatter: {
        title: 'Test Area',
        category: PARACategory.Areas,
      },
      content: 'Content',
    };

    const resourceDoc: Document = {
      id: 'resource.md',
      path: '/test/context/resources/resource.md',
      frontmatter: {
        title: 'Test Resource',
        category: PARACategory.Resources,
      },
      content: 'Content',
    };

    const archiveDoc: Document = {
      id: 'archive.md',
      path: '/test/context/archives/archive.md',
      frontmatter: {
        title: 'Test Archive',
        category: PARACategory.Archives,
      },
      content: 'Content',
    };

    it('should identify correct PARA categories', () => {
      expect(isInPARACategory(projectDoc, PARACategory.Projects)).toBe(true);
      expect(isInPARACategory(projectDoc, PARACategory.Areas)).toBe(false);

      expect(isProject(projectDoc)).toBe(true);
      expect(isArea(areaDoc)).toBe(true);
      expect(isResource(resourceDoc)).toBe(true);
      expect(isArchived(archiveDoc)).toBe(true);
    });

    it('should return false for non-PARA documents', () => {
      const nonParaDoc: Document = {
        id: 'test.md',
        path: '/test/context/test.md',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        frontmatter: { title: 'Test' } as any,
        content: 'Content',
      };

      expect(isProject(nonParaDoc)).toBe(false);
      expect(isArea(nonParaDoc)).toBe(false);
      expect(isResource(nonParaDoc)).toBe(false);
      expect(isArchived(nonParaDoc)).toBe(false);
    });
  });

  describe('Utility Guards', () => {
    describe('isISODateString', () => {
      it('should validate ISO date strings', () => {
        expect(isISODateString('2024-01-01')).toBe(true);
        expect(isISODateString('2024-01-01T00:00:00Z')).toBe(true);
        expect(isISODateString('2024-01-01T12:34:56.789Z')).toBe(true);

        expect(isISODateString('2024/01/01')).toBe(false);
        expect(isISODateString('01-01-2024')).toBe(false);
        expect(isISODateString('not a date')).toBe(false);
        expect(isISODateString(123)).toBe(false);
        expect(isISODateString(null)).toBe(false);
      });

      it('should reject invalid dates', () => {
        expect(isISODateString('2024-13-01')).toBe(false); // Invalid month
        expect(isISODateString('2024-01-32')).toBe(false); // Invalid day
      });
    });

    describe('isValidTag', () => {
      it('should validate tags', () => {
        expect(isValidTag('test')).toBe(true);
        expect(isValidTag('test-tag')).toBe(true);
        expect(isValidTag('test-multiple-parts')).toBe(true);
        expect(isValidTag('123')).toBe(true);
        expect(isValidTag('test123')).toBe(true);

        expect(isValidTag('Test')).toBe(false); // Uppercase
        expect(isValidTag('test tag')).toBe(false); // Space
        expect(isValidTag('test_tag')).toBe(false); // Underscore
        expect(isValidTag('test-')).toBe(false); // Trailing hyphen
        expect(isValidTag('-test')).toBe(false); // Leading hyphen
        expect(isValidTag(123)).toBe(false);
        expect(isValidTag(null)).toBe(false);
      });
    });

    describe('isValidDocumentId', () => {
      it('should validate document IDs', () => {
        expect(isValidDocumentId('test.md')).toBe(true);
        expect(isValidDocumentId('folder/test.md')).toBe(true);
        expect(isValidDocumentId('deep/folder/structure/test.md')).toBe(true);

        expect(isValidDocumentId('/absolute/path.md')).toBe(false);
        expect(isValidDocumentId('../parent/path.md')).toBe(false);
        expect(isValidDocumentId('path/../other.md')).toBe(false);
        expect(isValidDocumentId(123)).toBe(false);
        expect(isValidDocumentId(null)).toBe(false);
      });
    });
  });

  describe('Assertions', () => {
    describe('assertDocument', () => {
      it('should not throw for valid document', () => {
        const doc = {
          id: 'test.md',
          path: '/test/context/test.md',
          frontmatter: {
            title: 'Test',
            category: PARACategory.Resources,
          },
          content: 'Content',
        };

        expect(() => assertDocument(doc)).not.toThrow();
      });

      it('should throw for invalid document', () => {
        expect(() => assertDocument({})).toThrow('Invalid document');
        expect(() => assertDocument({ id: 'test' })).toThrow('Invalid document');
      });
    });

    describe('assertPARADocument', () => {
      it('should not throw for valid PARA document', () => {
        const doc = {
          id: 'project.md',
          path: '/test/context/projects/project.md',
          frontmatter: {
            title: 'Test Project',
            category: PARACategory.Projects,
            status: ProjectStatus.Active,
          },
          content: 'Content',
        };

        expect(() => assertPARADocument(doc)).not.toThrow();
      });

      it('should throw for invalid PARA document', () => {
        const doc = {
          id: 'area.md',
          path: '/test/context/areas/area.md',
          frontmatter: {
            title: 'Test Area',
            category: PARACategory.Areas,
            status: ProjectStatus.Active, // Invalid
          },
          content: 'Content',
        };

        expect(() => assertPARADocument(doc)).toThrow('Invalid PARA document');
      });
    });
  });

  describe('extractValidFrontmatter', () => {
    it('should extract valid frontmatter', () => {
      const doc: Document = {
        id: 'test.md',
        path: '/test/context/test.md',
        frontmatter: {
          title: 'Test',
          category: PARACategory.Resources,
          tags: ['test'],
          customField: 'value',
        },
        content: 'Content',
      };

      const frontmatter = extractValidFrontmatter(doc);
      expect(frontmatter).not.toBeNull();
      expect(frontmatter?.title).toBe('Test');
      expect(frontmatter?.['customField']).toBe('value');
    });

    it('should return null for invalid frontmatter', () => {
      const doc: Document = {
        id: 'test.md',
        path: '/test/context/test.md',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        frontmatter: {
          // Missing required title - this makes it invalid
          category: PARACategory.Resources,
        } as unknown as Frontmatter,
        content: 'Content',
      };

      const frontmatter = extractValidFrontmatter(doc);
      expect(frontmatter).toBeNull();
    });
  });
});
