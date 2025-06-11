// ABOUTME: Unit tests for the document serializer
// ABOUTME: Tests YAML frontmatter generation and markdown assembly

import { describe, it, expect } from '@jest/globals';
import { serializeDocument, serializeFrontmatter } from '../serializer';
import { Document, DocumentFrontmatter, PARACategory, ProjectStatus } from '../../models/types';

describe('serializer', () => {
  describe('serializeDocument', () => {
    it('should serialize a simple document', () => {
      const doc: Document = {
        id: 'test.md',
        path: '/test/test.md',
        frontmatter: {
          title: 'Test Document',
          category: PARACategory.Resources,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
        },
        content: '# Test\n\nThis is test content.',
      };

      const result = serializeDocument(doc);

      expect(result).toContain('---\ntitle: Test Document');
      expect(result).toContain('category: resources');
      expect(result).toContain('created: 2024-01-01T00:00:00Z');
      expect(result).toContain('modified: 2024-01-01T00:00:00Z');
      expect(result).toContain('---\n# Test\n\nThis is test content.');
    });

    it('should handle document with no frontmatter', () => {
      const doc: Document = {
        id: 'test.md',
        path: '/test/test.md',
        frontmatter: {} as DocumentFrontmatter,
        content: 'Just content',
      };

      const result = serializeDocument(doc);

      expect(result).toBe('Just content');
    });

    it('should serialize project with all fields', () => {
      const doc: Document = {
        id: 'project.md',
        path: '/test/project.md',
        frontmatter: {
          title: 'Website Redesign',
          category: PARACategory.Projects,
          status: ProjectStatus.Active,
          due_date: '2024-03-31T00:00:00Z',
          tags: ['web', 'design', 'urgent'],
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-15T00:00:00Z',
        },
        content: '## Project Goals',
      };

      const result = serializeDocument(doc);
      const lines = result.split('\n');

      expect(lines).toContain('title: Website Redesign');
      expect(lines).toContain('category: projects');
      expect(lines).toContain('status: active');
      expect(lines).toContain('due_date: 2024-03-31T00:00:00Z');
      expect(lines).toContain('tags:');
      expect(lines).toContain('  - web');
      expect(lines).toContain('  - design');
      expect(lines).toContain('  - urgent');
    });

    it('should handle arrays properly', () => {
      const doc: Document = {
        id: 'test.md',
        path: '/test/test.md',
        frontmatter: {
          title: 'Test',
          category: PARACategory.Resources,
          tags: ['tag1', 'tag2'],
          aliases: ['alias1', 'alias2'],
          links_to: ['doc1.md', 'doc2.md'],
        },
        content: '',
      };

      const result = serializeDocument(doc);

      expect(result).toContain('tags:\n  - tag1\n  - tag2');
      expect(result).toContain('aliases:\n  - alias1\n  - alias2');
      expect(result).toContain('links_to:\n  - doc1.md\n  - doc2.md');
    });

    it('should handle custom fields', () => {
      const doc: Document = {
        id: 'test.md',
        path: '/test/test.md',
        frontmatter: {
          title: 'Test',
          category: PARACategory.Resources,
          customField: 'custom value',
          customNumber: 42,
          customBool: true,
        },
        content: '',
      };

      const result = serializeDocument(doc);

      expect(result).toContain('customField: custom value');
      expect(result).toContain('customNumber: 42');
      expect(result).toContain('customBool: true');
    });
  });

  describe('serializeFrontmatter', () => {
    it('should quote strings that need escaping', () => {
      const frontmatter = {
        title: 'Title: With Colon',
        category: PARACategory.Resources,
        description: 'Line with #hashtag',
        number: '123',
        bool: 'true',
        null_str: 'null',
        multiline: 'Line 1\nLine 2',
        withSpaces: '  spaces  ',
      };

      const result = serializeFrontmatter(frontmatter);

      expect(result).toContain('title: "Title: With Colon"');
      expect(result).toContain('description: "Line with #hashtag"');
      expect(result).toContain('number: "123"');
      expect(result).toContain('bool: "true"');
      expect(result).toContain('null_str: "null"');
      expect(result).toContain('multiline: "Line 1\\nLine 2"');
      expect(result).toContain('withSpaces: "  spaces  "');
    });

    it('should not quote simple strings', () => {
      const frontmatter = {
        title: 'Simple Title',
        category: PARACategory.Resources,
        description: 'A simple description without special chars',
      };

      const result = serializeFrontmatter(frontmatter);

      expect(result).toContain('title: Simple Title');
      expect(result).toContain('description: A simple description without special chars');
    });

    it('should handle null and undefined values', () => {
      const frontmatter = {
        title: 'Test',
        category: PARACategory.Resources,
        nullValue: null,
        undefinedValue: undefined,
      };

      const result = serializeFrontmatter(frontmatter);

      expect(result).toContain('nullValue: null');
      // undefined values are skipped
      expect(result).not.toContain('undefinedValue');
    });

    it('should handle boolean values', () => {
      const frontmatter = {
        title: 'Test',
        category: PARACategory.Resources,
        isActive: true,
        isArchived: false,
      };

      const result = serializeFrontmatter(frontmatter);

      expect(result).toContain('isActive: true');
      expect(result).toContain('isArchived: false');
    });

    it('should handle number values', () => {
      const frontmatter = {
        title: 'Test',
        category: PARACategory.Resources,
        count: 42,
        pi: 3.14159,
        negative: -17,
      };

      const result = serializeFrontmatter(frontmatter);

      expect(result).toContain('count: 42');
      expect(result).toContain('pi: 3.14159');
      expect(result).toContain('negative: -17');
    });

    it('should serialize complex objects as JSON', () => {
      const frontmatter = {
        title: 'Test',
        category: PARACategory.Resources,
        metadata: {
          author: 'John Doe',
          version: 1.0,
          nested: {
            deep: true,
          },
        },
      };

      const result = serializeFrontmatter(frontmatter);

      expect(result).toContain(
        'metadata: {"author":"John Doe","version":1,"nested":{"deep":true}}',
      );
    });

    it('should handle empty arrays', () => {
      const frontmatter = {
        title: 'Test',
        category: PARACategory.Resources,
        tags: [],
        aliases: [],
      };

      const result = serializeFrontmatter(frontmatter);

      // Empty arrays should not be included
      expect(result).not.toContain('tags:');
      expect(result).not.toContain('aliases:');
    });

    it('should escape quotes in strings', () => {
      const frontmatter = {
        title: 'He said "Hello"',
        category: PARACategory.Resources,
      };

      const result = serializeFrontmatter(frontmatter);

      // The title has quotes so it will be quoted
      expect(result).toContain('title: "He said \\"Hello\\""');
    });

    it('should maintain field order with standard fields first', () => {
      const frontmatter = {
        customFirst: 'value',
        title: 'Test Document',
        tags: ['test'],
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        created: '2024-01-01T00:00:00Z',
        customLast: 'value',
      };

      const result = serializeFrontmatter(frontmatter);
      const lines = result.trim().split('\n');

      // Check that standard fields come before custom fields
      const titleIndex = lines.findIndex((l) => l.startsWith('title:'));
      const categoryIndex = lines.findIndex((l) => l.startsWith('category:'));
      const customFirstIndex = lines.findIndex((l) => l.startsWith('customFirst:'));
      const customLastIndex = lines.findIndex((l) => l.startsWith('customLast:'));

      expect(titleIndex).toBeLessThan(customFirstIndex);
      expect(categoryIndex).toBeLessThan(customFirstIndex);
      expect(titleIndex).toBeLessThan(customLastIndex);
      expect(categoryIndex).toBeLessThan(customLastIndex);
    });
  });
});
