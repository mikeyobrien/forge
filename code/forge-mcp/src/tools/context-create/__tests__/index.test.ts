// ABOUTME: Unit tests for the context_create tool
// ABOUTME: Tests document creation, validation, and error handling

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handleContextCreate, ContextCreateArgs, ContextCreateResult } from '../index';
import { PARACategory, ProjectStatus } from '../../../models/types';
import * as config from '../../../config/index';
import { FileSystem } from '../../../filesystem/FileSystem';
import { PARAManager } from '../../../para/PARAManager';

// Mock dependencies
jest.mock('../../../config/index');
jest.mock('../../../filesystem/FileSystem');
jest.mock('../../../para/PARAManager');

const mockConfig = config as jest.Mocked<typeof config>;
const MockFileSystem = FileSystem as jest.MockedClass<typeof FileSystem>;
const MockPARAManager = PARAManager as jest.MockedClass<typeof PARAManager>;

describe('context_create tool', () => {
  let mockFileSystemInstance: jest.Mocked<FileSystem>;
  let mockPARAManagerInstance: jest.Mocked<PARAManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup config mock
    mockConfig.getConfigSync.mockReturnValue({
      contextRoot: '/test/context',
      logLevel: 'info',
      nodeEnv: 'test',
      port: 3000,
    });

    // Setup FileSystem mock
    mockFileSystemInstance = {
      exists: jest.fn(),
      mkdir: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn(),
      readdir: jest.fn(),
      stat: jest.fn(),
      unlink: jest.fn(),
      rename: jest.fn(),
      resolvePath: jest.fn(),
      createDirectory: jest.fn(),
      readDirectory: jest.fn(),
      move: jest.fn(),
    } as unknown as jest.Mocked<FileSystem>;
    mockFileSystemInstance.exists.mockResolvedValue(false);
    mockFileSystemInstance.mkdir.mockResolvedValue(undefined);
    mockFileSystemInstance.writeFile.mockResolvedValue(undefined);
    MockFileSystem.mockImplementation(() => mockFileSystemInstance);

    // Setup PARAManager mock
    mockPARAManagerInstance = {
      initializeStructure: jest.fn(),
      getCategoryPath: jest.fn(),
      resolveDocumentPath: jest.fn(),
      moveDocument: jest.fn(),
      getDocumentCategory: jest.fn(),
      validateCategory: jest.fn(),
      listDocuments: jest.fn(),
      getAllDocuments: jest.fn(),
      getContextRoot: jest.fn(),
      getStructure: jest.fn(),
    } as unknown as jest.Mocked<PARAManager>;
    mockPARAManagerInstance.initializeStructure.mockResolvedValue(undefined);
    MockPARAManager.mockImplementation(() => mockPARAManagerInstance);
  });

  describe('handleContextCreate', () => {
    it('should create a simple resource document', async () => {
      const args = {
        path: 'my-note',
        title: 'My Note',
        content: 'This is my note content',
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(true);
      expect(parsed.path).toBe('resources/my-note.md');
      expect(parsed.message).toContain('Successfully created document');

      expect(mockFileSystemInstance.writeFile).toHaveBeenCalledWith(
        'resources/my-note.md',
        expect.stringContaining('title: My Note'),
      );
    });

    it('should create a project document with all fields', async () => {
      const args: ContextCreateArgs = {
        path: 'website-redesign',
        title: 'Website Redesign Project',
        content: '## Goals\n\n- Improve user experience\n- Modernize design',
        tags: ['web', 'design', 'q1-2024'],
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        due_date: '2024-03-31T00:00:00Z',
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(true);
      expect(parsed.path).toBe('projects/website-redesign.md');

      const writeCall = mockFileSystemInstance.writeFile.mock.calls[0];
      expect(writeCall?.[0]).toBe('projects/website-redesign.md');

      const content = writeCall?.[1];
      expect(content).toContain('title: Website Redesign Project');
      expect(content).toContain('category: projects');
      expect(content).toContain('status: active');
      expect(content).toContain('due_date: 2024-03-31T00:00:00Z');
      expect(content).toContain('tags:');
      expect(content).toContain('  - web');
      expect(content).toContain('  - design');
      expect(content).toContain('  - q1-2024');
      expect(content).toContain('## Goals');
    });

    it('should handle nested paths', async () => {
      const args = {
        path: 'health/nutrition/meal-planning',
        title: 'Meal Planning Guide',
        category: PARACategory.Areas,
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(true);
      expect(parsed.path).toBe('areas/health/nutrition/meal-planning.md');

      expect(mockFileSystemInstance.mkdir).toHaveBeenCalledWith('areas/health/nutrition', true);
    });

    it('should handle paths that already include category', async () => {
      const args: ContextCreateArgs = {
        path: 'projects/mobile-app',
        title: 'Mobile App Development',
        category: PARACategory.Projects,
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(true);
      expect(parsed.path).toBe('projects/mobile-app.md');
    });

    it('should error if file already exists', async () => {
      mockFileSystemInstance.exists.mockResolvedValue(true);

      const args = {
        path: 'existing-doc',
        title: 'Existing Document',
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('FILE_EXISTS');
      expect(parsed.message).toContain('already exists');

      expect(mockFileSystemInstance.writeFile).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const result = await handleContextCreate({
        path: 'test',
        // missing title
      });
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Invalid arguments provided');
      expect(parsed.error).toContain('title');
    });

    it('should validate category enum', async () => {
      const result = await handleContextCreate({
        path: 'test',
        title: 'Test',
        category: 'invalid-category' as unknown as PARACategory,
      });
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Invalid arguments provided');
    });

    it('should reject status for non-project categories', async () => {
      const args: ContextCreateArgs = {
        path: 'test-area',
        title: 'Test Area',
        category: PARACategory.Areas,
        status: ProjectStatus.Active, // Should be rejected for non-projects
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      // Expect validation to fail
      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Invalid arguments provided');
      expect(parsed.error).toContain('Status and due_date are only valid for Projects');

      // Verify no file was written
      expect(mockFileSystemInstance.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', async () => {
      mockFileSystemInstance.writeFile.mockRejectedValue(new Error('Permission denied'));

      const args = {
        path: 'test-doc',
        title: 'Test Document',
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Failed to create document');
      expect(parsed.error).toBe('Permission denied');
    });

    it('should ensure .md extension is added', async () => {
      const args = {
        path: 'my-document',
        title: 'My Document',
      };

      await handleContextCreate(args);

      expect(mockFileSystemInstance.writeFile).toHaveBeenCalledWith(
        'resources/my-document.md',
        expect.any(String),
      );
    });

    it('should handle documents with parent references', async () => {
      const args: ContextCreateArgs = {
        path: 'sub-project',
        title: 'Sub Project',
        category: PARACategory.Projects,
        parent: 'projects/main-project',
      };

      const result = await handleContextCreate(args);
      const parsed = JSON.parse(result) as ContextCreateResult;

      expect(parsed.success).toBe(true);

      const content = mockFileSystemInstance.writeFile.mock.calls[0]?.[1] as string;
      expect(content).toContain('parent: projects/main-project');
    });
  });
});
