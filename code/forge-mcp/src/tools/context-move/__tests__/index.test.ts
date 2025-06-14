// ABOUTME: Unit tests for context_move MCP tool
// ABOUTME: Tests tool interface, input validation, and response formatting

import { createContextMoveTool } from '../index';
import { MockFileSystem } from '../../../filesystem/MockFileSystem';
import { PARAManager } from '../../../para/PARAManager';
import { BacklinkManager } from '../../../backlinks/BacklinkManager';
import { DocumentUpdater } from '../../../updater/DocumentUpdater';
import { join } from 'path';

// Mock the config module
jest.mock('../../../config/index', () => ({
  getConfig: (): { contextRoot: string } => ({ contextRoot: '/test/context' }),
}));

describe('context_move tool', () => {
  let fs: MockFileSystem;
  let para: PARAManager;
  let backlinks: BacklinkManager;
  let updater: DocumentUpdater;
  let tool: ReturnType<typeof createContextMoveTool>;
  const contextRoot = '/test/context';

  beforeEach(async () => {
    fs = new MockFileSystem();
    para = new PARAManager(contextRoot, fs);
    backlinks = new BacklinkManager(fs, contextRoot);
    updater = new DocumentUpdater(fs, para);
    tool = createContextMoveTool(fs, para, backlinks, updater, contextRoot);

    // Initialize PARA structure
    await para.initializeStructure();
    await backlinks.initialize();

    // Create test documents
    await fs.writeFile(
      join(contextRoot, 'Projects/test-doc.md'),
      `---
title: Test Document
tags: [test]
---

# Test Document

Content here.`,
    );

    await fs.writeFile(
      join(contextRoot, 'Areas/linking-doc.md'),
      `---
title: Linking Document
---

This links to [[/Projects/test-doc]].`,
    );

    // Update backlink index
    await backlinks.updateDocumentLinks(
      join(contextRoot, 'Areas/linking-doc.md'),
      await fs.readFile(join(contextRoot, 'Areas/linking-doc.md')),
    );
  });

  describe('tool definition', () => {
    it('should have correct metadata', () => {
      expect(tool.name).toBe('context_move');
      expect(tool.description).toContain('Move a document');
      expect(tool.inputSchema).toBeDefined();
    });

    it('should validate input schema', () => {
      const schema = tool.inputSchema;

      // Valid input
      const validResult = schema.safeParse({
        sourcePath: 'Projects/doc.md',
        destinationPath: 'Archives/doc.md',
      });
      expect(validResult.success).toBe(true);

      // Invalid input - missing required fields
      const invalidResult = schema.safeParse({
        sourcePath: '',
      });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('successful moves', () => {
    it('should move document within same category', async () => {
      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Projects/test-doc-renamed.md',
        updateLinks: true,
        overwrite: false,
      });

      expect(result.content[0]?.type).toBe('text');
      const text = result.content[0]?.text || '';
      expect(text).toContain('Successfully moved document');
      expect(text).toContain('Projects/test-doc.md');
      expect(text).toContain('Projects/test-doc-renamed.md');
      expect(text).not.toContain('Category Change');
    });

    it('should move document across categories', async () => {
      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Archives/test-doc.md',
        updateLinks: true,
        overwrite: false,
      });

      expect(result.content[0]?.type).toBe('text');
      const text = result.content[0]?.text || '';
      expect(text).toContain('Successfully moved document');
      expect(text).toMatch(/Category Change:.*projects.*archives/);
    });

    it('should report link updates', async () => {
      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Archives/test-doc.md',
        updateLinks: true,
        overwrite: false,
      });

      const text = result.content[0]?.text || '';
      expect(text).toContain('Link Updates');
      expect(text).toContain('Updated 1 link');
      expect(text).toContain('Areas/linking-doc.md');
    });

    it('should skip link updates when requested', async () => {
      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Archives/test-doc.md',
        updateLinks: false,
        overwrite: false,
      });

      const text = result.content[0]?.text || '';
      expect(text).toContain('No Link Updates Required');
      expect(text).not.toContain('Updated');
    });

    it('should handle documents with no incoming links', async () => {
      await fs.writeFile(join(contextRoot, 'Resources/isolated.md'), '# Isolated');

      const result = await tool.handler({
        sourcePath: 'Resources/isolated.md',
        destinationPath: 'Archives/isolated.md',
        updateLinks: true,
        overwrite: false,
      });

      const text = result.content[0]?.text || '';
      expect(text).toContain('No Link Updates Required');
      expect(text).toContain('No documents were linking to the moved file');
    });
  });

  describe('error handling', () => {
    it('should handle non-existent source', async () => {
      const result = await tool.handler({
        sourcePath: 'Projects/nonexistent.md',
        destinationPath: 'Archives/new.md',
        updateLinks: true,
        overwrite: false,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Failed to move document');
      expect(result.content[0]?.text).toContain('not found');
    });

    it('should handle existing destination', async () => {
      await fs.writeFile(join(contextRoot, 'Archives/existing.md'), 'content');

      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Archives/existing.md',
        updateLinks: true,
        overwrite: false,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('already exists');
    });

    it('should allow overwrite when specified', async () => {
      await fs.writeFile(join(contextRoot, 'Archives/existing.md'), 'old content');

      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Archives/existing.md',
        updateLinks: true,
        overwrite: true,
      });

      expect(result.isError).not.toBe(true);
      expect(result.content[0]?.text).toContain('Successfully moved document');
    });

    it('should handle invalid paths', async () => {
      const result = await tool.handler({
        sourcePath: '../outside/doc.md',
        destinationPath: 'Projects/new.md',
        updateLinks: true,
        overwrite: false,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('outside context root');
    });

    it('should validate input', async () => {
      const result = await tool.handler({
        sourcePath: '',
        destinationPath: 'Projects/new.md',
        updateLinks: true,
        overwrite: false,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Failed to move document');
    });
  });

  describe('output formatting', () => {
    it('should format successful move with multiple link updates', async () => {
      // Create another linking document
      await fs.writeFile(
        join(contextRoot, 'Resources/another-link.md'),
        `
See [[/Projects/test-doc|Test]] and [[/Projects/test-doc]].`,
      );

      await backlinks.updateDocumentLinks(
        join(contextRoot, 'Resources/another-link.md'),
        await fs.readFile(join(contextRoot, 'Resources/another-link.md')),
      );

      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Archives/archived-doc.md',
        updateLinks: true,
        overwrite: false,
      });

      const text = result.content[0]?.text || '';
      expect(text).toMatch(/# Document Move Result/);
      expect(text).toMatch(/✅ Successfully moved document/);
      expect(text).toMatch(/\*\*From:\*\* `.*Projects\/test-doc.md`/);
      expect(text).toMatch(/\*\*To:\*\* `.*Archives\/archived-doc.md`/);
      expect(text).toMatch(/Updated 3 links across 2 documents/);
      expect(text).toMatch(/- `.*Areas\/linking-doc.md`: 1 link updated/);
      expect(text).toMatch(/- `.*Resources\/another-link.md`: 2 links updated/);
    });

    it('should use singular forms for single updates', async () => {
      const result = await tool.handler({
        sourcePath: 'Projects/test-doc.md',
        destinationPath: 'Projects/renamed.md',
        updateLinks: true,
        overwrite: false,
      });

      const text = result.content[0]?.text || '';
      expect(text).toMatch(/Updated 1 link across 1 document:/);
      expect(text).toMatch(/1 link updated/);
    });
  });
});
