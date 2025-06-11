// ABOUTME: Unit tests for DocumentUpdater class
// ABOUTME: Tests document update logic, link preservation, and metadata merging

import { DocumentUpdater, DocumentUpdateError } from '../index';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import { PARAManager } from '../../para/PARAManager';
import { Document } from '../types';
import { serializeDocument } from '../../parsers/index';
import { PARACategory, ProjectStatus } from '../../models/types';

describe('DocumentUpdater', () => {
  let fileSystem: MockFileSystem;
  let paraManager: PARAManager;
  let updater: DocumentUpdater;
  const contextRoot = '/test/context';

  beforeEach(() => {
    fileSystem = new MockFileSystem();
    paraManager = new PARAManager(contextRoot, fileSystem);
    updater = new DocumentUpdater(fileSystem, paraManager);
  });

  describe('updateDocument', () => {
    const testDoc: Document = {
      path: 'projects/test.md',
      content: 'Original content with [[link1]] and [[link2|display]].',
      metadata: {
        title: 'Test Document',
        created: '2025-01-01T00:00:00Z',
        modified: '2025-01-01T00:00:00Z',
        tags: ['test', 'original'],
        category: PARACategory.Projects,
      },
    };

    beforeEach(async () => {
      // Create test document using relative path
      await fileSystem.createDirectory('projects');
      await fileSystem.writeFile('projects/test.md', serializeDocument(testDoc));
    });

    it('should update content only', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        content: 'New content',
        replace_content: true,
      });

      expect(result.success).toBe(true);
      expect(result.document.content).toContain('New content');
      expect(result.document.metadata).toEqual(testDoc.metadata);
      expect(result.changes.content_updated).toBe(true);
      expect(result.changes.metadata_updated).toBe(false);
    });

    it('should append content by default', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        content: 'Additional content',
      });

      expect(result.document.content).toBe(
        'Original content with [[link1]] and [[link2|display]].\n\nAdditional content',
      );
    });

    it('should replace content when specified', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        content: 'Replacement content',
        replace_content: true,
      });

      expect(result.document.content).toContain('Replacement content');
      expect(result.document.content).toContain('## Preserved Links');
      expect(result.document.content).toContain('[[link1]]');
      expect(result.document.content).toContain('[[link2|display]]');
      expect(result.changes.links_preserved).toBe(2);
    });

    it('should not preserve links when disabled', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        content: 'Replacement without links',
        replace_content: true,
        preserve_links: false,
      });

      expect(result.document.content).toBe('Replacement without links');
      expect(result.changes.links_preserved).toBe(0);
    });

    it('should update metadata only', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        metadata: {
          tags: ['test', 'updated'],
          status: ProjectStatus.Completed,
        },
      });

      expect(result.success).toBe(true);
      expect(result.document.content).toBe(testDoc.content);
      expect(result.document.metadata.tags).toEqual(['test', 'updated']);
      expect(result.document.metadata.status).toBe('completed');
      expect(result.changes.metadata_updated).toBe(true);
      expect(result.changes.updated_fields).toContain('tags');
      expect(result.changes.updated_fields).toContain('status');
    });

    it('should update both content and metadata', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        content: 'New content',
        metadata: {
          tags: ['updated'],
        },
        replace_content: true,
      });

      expect(result.document.content).toContain('New content');
      expect(result.document.metadata.tags).toEqual(['updated']);
      expect(result.changes.content_updated).toBe(true);
      expect(result.changes.metadata_updated).toBe(true);
    });

    it('should throw error for non-existent document', async () => {
      await expect(
        updater.updateDocument({
          path: 'projects/nonexistent.md',
          content: 'New content',
        }),
      ).rejects.toThrow(DocumentUpdateError);
    });

    it('should throw error for invalid path', async () => {
      await expect(
        updater.updateDocument({
          path: '../outside/context.md',
          content: 'New content',
        }),
      ).rejects.toThrow(DocumentUpdateError);
    });

    it('should preserve title and created date', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
        metadata: {
          title: 'Attempted Title Change',
          created: '2025-06-11T00:00:00Z',
        },
      });

      expect(result.document.metadata.title).toBe('Test Document');
      expect(result.document.metadata.created).toBe('2025-01-01T00:00:00Z');
    });

    it('should handle empty update gracefully', async () => {
      const result = await updater.updateDocument({
        path: 'projects/test.md',
      });

      expect(result.success).toBe(true);
      expect(result.changes.content_updated).toBe(false);
      expect(result.changes.metadata_updated).toBe(false);
    });

    it('should validate metadata format', async () => {
      await expect(
        updater.updateDocument({
          path: 'projects/test.md',
          metadata: {
            // @ts-expect-error Testing invalid type
            tags: 'not-an-array',
          },
        }),
      ).rejects.toThrow(DocumentUpdateError);
    });

    it('should reject empty content replacement', async () => {
      await expect(
        updater.updateDocument({
          path: 'projects/test.md',
          content: '',
          replace_content: true,
        }),
      ).rejects.toThrow(DocumentUpdateError);
    });
  });

  describe('preserveWikiLinks', () => {
    it('should preserve unique links', () => {
      const oldContent = 'Text with [[link1]] and [[link2|display]].';
      const newContent = 'New text with [[link3]].';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[link1]]');
      expect(result.content).toContain('[[link2|display]]');
      expect(result.content).toContain('[[link3]]');
      expect(result.count).toBe(2);
    });

    it('should not duplicate existing links', () => {
      const oldContent = 'Text with [[link1]] and [[link2]].';
      const newContent = 'New text with [[link1]].';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[link2]]');
      expect(result.content.match(/\[\[link1\]\]/g)?.length).toBe(1);
      expect(result.count).toBe(1);
    });

    it('should handle no links to preserve', () => {
      const oldContent = 'Text without links.';
      const newContent = 'New text.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toBe('New text.');
      expect(result.count).toBe(0);
    });

    it('should handle links in code blocks correctly', () => {
      const oldContent = 'Text with [[real-link]].\n```\n[[not-a-link]]\n```';
      const newContent = 'New content';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[real-link]]');
      expect(result.content).not.toContain('[[not-a-link]]');
      expect(result.count).toBe(1);
    });
  });

  describe('mergeMetadata', () => {
    const existingMetadata = {
      title: 'Original Title',
      created: '2025-01-01T00:00:00Z',
      modified: '2025-01-01T00:00:00Z',
      tags: ['original', 'test'],
      category: PARACategory.Projects,
    };

    it('should merge simple fields', () => {
      const result = updater.mergeMetadata(existingMetadata, {
        status: ProjectStatus.Completed,
        due_date: '2025-12-31',
      });

      expect(result.metadata.status).toBe(ProjectStatus.Completed);
      expect(result.metadata.due_date).toBe('2025-12-31');
      expect(result.updatedFields).toEqual(['status', 'due_date']);
    });

    it('should replace arrays by default', () => {
      const result = updater.mergeMetadata(existingMetadata, {
        tags: ['new', 'tags'],
      });

      expect(result.metadata.tags).toEqual(['new', 'tags']);
      expect(result.updatedFields).toEqual(['tags']);
    });

    it('should append arrays when specified', () => {
      const result = updater.mergeMetadata(
        existingMetadata,
        { tags: ['new', 'tag'] },
        { append_arrays: true },
      );

      expect(result.metadata.tags).toEqual(['original', 'test', 'new', 'tag']);
    });

    it('should not duplicate array values when appending', () => {
      const result = updater.mergeMetadata(
        existingMetadata,
        { tags: ['test', 'new'] },
        { append_arrays: true },
      );

      expect(result.metadata.tags).toEqual(['original', 'test', 'new']);
    });

    it('should ignore undefined values', () => {
      const result = updater.mergeMetadata(existingMetadata, {
        due_date: '2025-12-31',
      });

      expect(result.metadata.status).toBeUndefined();
      expect(result.metadata.due_date).toBe('2025-12-31');
      expect(result.updatedFields).toEqual(['due_date']);
    });

    it('should handle null values with allow_removal', () => {
      const metadata = { ...existingMetadata, status: ProjectStatus.Active };
      const result = updater.mergeMetadata(
        metadata,
        { status: null as unknown as ProjectStatus },
        { allow_removal: true },
      );

      expect(result.metadata.status).toBeUndefined();
      expect(result.updatedFields).toEqual(['status']);
    });

    it('should preserve title and created date', () => {
      const result = updater.mergeMetadata(existingMetadata, {
        title: 'New Title',
        created: '2025-06-11T00:00:00Z',
      });

      expect(result.metadata.title).toBe('Original Title');
      expect(result.metadata.created).toBe('2025-01-01T00:00:00Z');
    });
  });

  describe('error handling', () => {
    it('should handle file write errors', async () => {
      const doc: Document = {
        path: 'projects/test.md',
        content: 'Content',
        metadata: {
          title: 'Test',
          created: '2025-01-01T00:00:00Z',
          modified: '2025-01-01T00:00:00Z',
          category: PARACategory.Projects,
        },
      };

      await fileSystem.createDirectory('projects');
      await fileSystem.writeFile('projects/test.md', serializeDocument(doc));

      // Simulate write error
      fileSystem.writeFile = jest.fn().mockRejectedValue(new Error('Write failed'));

      await expect(
        updater.updateDocument({
          path: 'projects/test.md',
          content: 'New content',
        }),
      ).rejects.toThrow(DocumentUpdateError);
    });
  });
});
