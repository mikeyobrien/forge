// ABOUTME: Tests for the context_read tool
// ABOUTME: Verifies document reading with frontmatter parsing and content extraction

import { handleContextRead, ContextReadResult } from '../index';
import { FileSystem } from '../../../filesystem/FileSystem';
import { PARAManager } from '../../../para/PARAManager';
import { getConfigSync } from '../../../config/index';
import { PARACategory } from '../../../models/types';

// Mock dependencies
jest.mock('../../../filesystem/FileSystem');
jest.mock('../../../para/PARAManager');
jest.mock('../../../config/index');

describe('context_read tool', () => {
  let mockFileSystem: jest.Mocked<FileSystem>;
  let mockPARAManager: jest.Mocked<PARAManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock config
    (getConfigSync as jest.Mock).mockReturnValue({
      contextRoot: '/test/context',
      logLevel: 'info',
      nodeEnv: 'test',
    });

    // Mock FileSystem
    mockFileSystem = new FileSystem('/test/context') as jest.Mocked<FileSystem>;
    (FileSystem as jest.MockedClass<typeof FileSystem>).mockImplementation(() => mockFileSystem);

    // Mock PARAManager
    mockPARAManager = new PARAManager('/test/context', mockFileSystem) as jest.Mocked<PARAManager>;
    (PARAManager as jest.MockedClass<typeof PARAManager>).mockImplementation(() => mockPARAManager);
  });

  describe('successful reads', () => {
    it('should read a document with frontmatter and content', async () => {
      const mockContent = `---
title: Test Document
tags: [test, example]
category: projects
created: 2024-01-15T10:00:00Z
modified: 2024-01-15T10:00:00Z
status: active
due_date: 2024-03-01
---

# Test Document

This is the document content.`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'projects/test-doc.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document).toBeDefined();
      expect(parsed.document?.title).toBe('Test Document');
      expect(parsed.document?.id).toBe('projects/test-doc.md');
      expect(parsed.document?.category).toBe(PARACategory.Projects);
      expect(parsed.document?.content).toBe('\n# Test Document\n\nThis is the document content.');
      expect(parsed.document?.frontmatter).toEqual({
        title: 'Test Document',
        tags: ['test', 'example'],
        category: 'projects',
        created: '2024-01-15T10:00:00Z',
        modified: '2024-01-15T10:00:00Z',
        status: 'active',
        due_date: '2024-03-01',
      });
    });

    it('should add .md extension if missing', async () => {
      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue('---\ntitle: Test\n---\nContent');

      await handleContextRead({
        path: 'resources/test',
      });

      expect(mockFileSystem.exists).toHaveBeenCalledWith('resources/test.md');
      expect(mockFileSystem.readFile).toHaveBeenCalledWith('resources/test.md');
    });

    it('should read document without content when include_content is false', async () => {
      const mockContent = `---
title: Test Document
tags: [test]
---

Document content here.`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/test.md',
        include_content: false,
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBeUndefined();
      expect(parsed.document?.frontmatter).toBeDefined();
    });

    it('should read document without metadata when include_metadata is false', async () => {
      const mockContent = `---
title: Test Document
tags: [test]
---

Document content here.`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/test.md',
        include_metadata: false,
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBe(mockContent);
      expect(parsed.document?.frontmatter).toBeUndefined();
    });

    it('should handle document without frontmatter', async () => {
      const mockContent = '# Just Content\n\nNo frontmatter here.';

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/test.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBe(mockContent);
      expect(parsed.document?.frontmatter).toBeUndefined();
      expect(parsed.document?.title).toBe('test');
    });

    it('should detect category from path when not in frontmatter', async () => {
      const mockContent = `---
title: Test Document
---

Content`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'areas/health/exercise.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.category).toBe(PARACategory.Areas);
    });

    it('should handle empty document', async () => {
      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue('');

      const result = await handleContextRead({
        path: 'resources/empty.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBe('');
      expect(parsed.document?.title).toBe('empty');
    });

    it('should handle document with only frontmatter', async () => {
      const mockContent = `---
title: Metadata Only
tags: [meta]
category: resources
---`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/meta.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBe('');
      expect(parsed.document?.frontmatter?.title).toBe('Metadata Only');
    });

    it('should handle invalid frontmatter gracefully', async () => {
      const mockContent = `---
title: Test
invalid_date: not-a-date
category: invalid-category
---

Content`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/test.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.title).toBe('Test');
      expect(parsed.document?.content).toBe('\nContent');
    });
  });

  describe('error handling', () => {
    it('should handle file not found', async () => {
      mockFileSystem.exists.mockResolvedValue(false);

      const result = await handleContextRead({
        path: 'nonexistent.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('FILE_NOT_FOUND');
      expect(parsed.message).toContain('Document not found');
    });

    it('should validate required path argument', async () => {
      const result = await handleContextRead({});

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('path: Required');
    });

    it('should handle invalid argument types', async () => {
      const result = await handleContextRead({
        path: 123,
        include_content: 'yes',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Invalid arguments provided');
    });

    it('should handle file system errors', async () => {
      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockRejectedValue(new Error('Permission denied'));

      const result = await handleContextRead({
        path: 'protected.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Permission denied');
    });

    it('should handle malformed YAML frontmatter', async () => {
      const mockContent = `---
title: Test
invalid: [
  unclosed array
---

Content`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/malformed.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      // Should still succeed but without proper frontmatter parsing
      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle paths with special characters', async () => {
      const mockContent = '---\ntitle: Special\n---\nContent';

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'resources/special-chars-&-symbols.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(mockFileSystem.exists).toHaveBeenCalledWith('resources/special-chars-&-symbols.md');
    });

    it('should derive title from complex filenames', async () => {
      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue('No frontmatter');

      const result = await handleContextRead({
        path: 'resources/my-complex-file-name.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.title).toBe('my complex file name');
    });

    it('should handle deeply nested paths', async () => {
      const mockContent = `---
title: Nested Document
category: projects
---

Content`;

      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue(mockContent);

      const result = await handleContextRead({
        path: 'projects/web/frontend/components/button.md',
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.category).toBe(PARACategory.Projects);
      expect(parsed.document?.id).toBe('projects/web/frontend/components/button.md');
    });

    it('should handle when both include flags are false', async () => {
      mockFileSystem.exists.mockResolvedValue(true);
      mockFileSystem.readFile.mockResolvedValue('---\ntitle: Test\n---\nContent');

      const result = await handleContextRead({
        path: 'resources/test.md',
        include_content: false,
        include_metadata: false,
      });

      const parsed = JSON.parse(result) as ContextReadResult;

      expect(parsed.success).toBe(true);
      expect(parsed.document?.content).toBeUndefined();
      expect(parsed.document?.frontmatter).toBeUndefined();
      expect(parsed.document?.exists).toBe(true);
    });
  });
});
