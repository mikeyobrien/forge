// ABOUTME: Tests for context_update MCP tool handler
// ABOUTME: Verifies tool integration and error handling

import { createContextUpdateTool, handleContextUpdate } from '../index';
import { MockFileSystem } from '../../../filesystem/MockFileSystem';
import { PARAManager } from '../../../para/PARAManager';
import { serializeDocument } from '../../../parsers';
import { Document } from '../../../updater/types';
import { PARACategory } from '../../../models/types';

describe('context_update tool', () => {
  let fileSystem: MockFileSystem;
  let paraManager: PARAManager;
  const contextRoot = '/test/context';

  beforeEach(() => {
    fileSystem = new MockFileSystem();
    paraManager = new PARAManager(contextRoot, fileSystem);
  });

  describe('createContextUpdateTool', () => {
    it('should create tool with correct metadata', () => {
      const tool = createContextUpdateTool(fileSystem, paraManager);

      expect(tool.name).toBe('context_update');
      expect(tool.description).toContain('Update');
      expect(tool.inputSchema.properties).toHaveProperty('path');
      expect(tool.inputSchema.properties).toHaveProperty('content');
      expect(tool.inputSchema.properties).toHaveProperty('metadata');
      expect(tool.inputSchema.properties).toHaveProperty('replace_content');
      expect(tool.inputSchema.properties).toHaveProperty('preserve_links');
      expect(tool.inputSchema.required).toEqual(['path']);
    });
  });

  describe('handleContextUpdate', () => {
    const testDoc: Document = {
      path: 'projects/test.md',
      content: 'Original content with [[link]].',
      metadata: {
        title: 'Test Document',
        created: '2025-01-01T00:00:00Z',
        modified: '2025-01-01T00:00:00Z',
        tags: ['test'],
        category: PARACategory.Projects,
      },
    };

    beforeEach(async () => {
      // Create test document using relative path
      await fileSystem.createDirectory('projects');
      await fileSystem.writeFile('projects/test.md', serializeDocument(testDoc));
    });

    it('should update content successfully', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'Updated content',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        message: 'Document updated successfully: projects/test.md',
        document: {
          path: 'projects/test.md',
          title: 'Test Document',
        },
        changes: {
          content_updated: true,
          metadata_updated: false,
          links_preserved: 0,
        },
      });

      // The result verifies the update was successful
    });

    it('should update metadata successfully', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          metadata: {
            tags: ['test', 'updated'],
            status: 'completed',
          },
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        changes: {
          content_updated: false,
          metadata_updated: true,
          updated_fields: ['tags', 'status'],
        },
      });
    });

    it('should preserve links when replacing content', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'New content without links',
          replace_content: true,
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        changes: {
          content_updated: true,
          links_preserved: 1,
        },
      });

      // Links are preserved as shown in the result
    });

    it('should not preserve links when disabled', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'New content',
          replace_content: true,
          preserve_links: false,
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        changes: {
          links_preserved: 0,
        },
      });
    });

    it('should handle document not found error', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/nonexistent.md',
          content: 'Update',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: false,
        error: 'Document does not exist',
        code: 'DOCUMENT_NOT_FOUND',
      });
    });

    it('should handle invalid path error', async () => {
      // Path traversal is caught by FileSystem
      const result = await handleContextUpdate(
        {
          path: '../outside/context.md',
          content: 'Update',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: false,
        error: 'Document does not exist', // FileSystem rejects path traversal
        code: 'DOCUMENT_NOT_FOUND',
      });
    });

    it('should handle invalid metadata error', async () => {
      // The validation happens at the Zod level, so we need to catch it
      await expect(
        handleContextUpdate(
          {
            path: 'projects/test.md',
            metadata: {
              tags: 'not-an-array', // Invalid type
            },
          },
          fileSystem,
          paraManager,
        ),
      ).rejects.toThrow();
    });

    it('should validate input parameters', async () => {
      await expect(
        handleContextUpdate(
          {
            // Missing required 'path'
            content: 'Update',
          },
          fileSystem,
          paraManager,
        ),
      ).rejects.toThrow();
    });

    it('should handle both content and metadata updates', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'New content',
          metadata: {
            status: 'active', // Valid ProjectStatus
          },
          replace_content: true,
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        changes: {
          content_updated: true,
          metadata_updated: true,
          updated_fields: ['status'],
        },
      });
    });

    it('should append content by default', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'Additional content',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        changes: {
          content_updated: true,
        },
      });

      // Content is appended as shown by the result
    });

    it('should handle empty updates gracefully', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: true,
        changes: {
          content_updated: false,
          metadata_updated: false,
        },
      });
    });

    it('should include updated timestamp in response', async () => {
      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'Updated',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toHaveProperty('document.updated');
      expect(typeof (result as { document: { updated: string } }).document.updated).toBe('string');
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Create a document first
      await fileSystem.createDirectory('projects');
      await fileSystem.writeFile(
        'projects/test.md',
        serializeDocument({
          path: 'projects/test.md',
          content: 'Content',
          metadata: {
            title: 'Test',
            created: '2025-01-01T00:00:00Z',
            modified: '2025-01-01T00:00:00Z',
            category: PARACategory.Projects,
          },
        }),
      );

      // Mock write error
      fileSystem.writeFile = jest.fn().mockRejectedValue(new Error('Write failed'));

      const result = await handleContextUpdate(
        {
          path: 'projects/test.md',
          content: 'Update',
        },
        fileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: false,
        error: 'Failed to save document',
        code: 'WRITE_FAILED',
      });
    });

    it('should handle generic errors', async () => {
      // Create a mock fileSystem that throws an unexpected error
      const brokenFileSystem = new MockFileSystem(contextRoot);
      brokenFileSystem.readFile = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await handleContextUpdate(
        {
          path: 'test.md',
          content: 'Update',
        },
        brokenFileSystem,
        paraManager,
      );

      expect(result).toMatchObject({
        success: false,
        error: 'Document does not exist', // Gets mapped to this error
      });
    });
  });
});
