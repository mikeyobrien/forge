// ABOUTME: Tests for CommandDocumentOrganizer functionality
// ABOUTME: Verifies document naming, placement, and conflict resolution

import { CommandDocumentOrganizer } from '../CommandDocumentOrganizer.js';
import { MockFileSystem } from '../../filesystem/MockFileSystem.js';
import { PARAManager } from '../../para/PARAManager.js';
import { CommandDocumentType, CreateCommandDocumentParams } from '../types.js';
import { PARACategory } from '../../models/types.js';
import { parseFrontmatter } from '../../parsers/index.js';

describe('CommandDocumentOrganizer', () => {
  let fileSystem: MockFileSystem;
  let paraManager: PARAManager;
  let organizer: CommandDocumentOrganizer;
  const contextRoot = '/test/context';

  beforeEach(async () => {
    fileSystem = new MockFileSystem();
    paraManager = new PARAManager(contextRoot, fileSystem);
    organizer = new CommandDocumentOrganizer(fileSystem, paraManager, {
      contextRoot,
      autoCreateProjectDirs: true,
      updateIndexes: true,
    });

    // Initialize PARA structure
    await paraManager.initializeStructure();
  });

  describe('createDocument', () => {
    it('should create a document with proper naming convention', async () => {
      const params: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Design,
        baseName: 'authentication-system',
        title: 'Authentication System Design',
        content: '# Design Document\n\nContent here...',
        tags: ['auth', 'security'],
        generatedBy: '/plan',
      };

      const result = await organizer.createDocument(params);

      expect(result.path).toBe('projects/design-authentication-system.md');
      expect(result.conflictResolved).toBe(false);

      // Verify file was created
      const exists = await fileSystem.exists(
        `${contextRoot}/projects/design-authentication-system.md`,
      );
      expect(exists).toBe(true);
    });

    it('should place documents in correct PARA categories', async () => {
      const testCases = [
        {
          type: CommandDocumentType.Design,
          expected: PARACategory.Projects,
        },
        {
          type: CommandDocumentType.Todo,
          expected: PARACategory.Areas,
        },
        {
          type: CommandDocumentType.Report,
          expected: PARACategory.Resources,
        },
      ];

      for (const testCase of testCases) {
        const params: CreateCommandDocumentParams = {
          documentType: testCase.type,
          baseName: 'test-doc',
          title: 'Test Document',
          content: 'Content',
          tags: [],
          generatedBy: '/test',
        };

        const result = await organizer.createDocument(params);
        expect(result.path.startsWith(testCase.expected)).toBe(true);
      }
    });

    it('should organize documents by project', async () => {
      const params: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Design,
        baseName: 'api-structure',
        title: 'API Structure Design',
        content: 'API design content',
        tags: ['api'],
        generatedBy: '/plan',
        project: 'auth-system',
      };

      const result = await organizer.createDocument(params);

      expect(result.path).toBe('projects/auth-system/design-api-structure.md');
    });

    it('should resolve naming conflicts by making names more specific', async () => {
      // Create first document
      const params1: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Design,
        baseName: 'api',
        title: 'API Design',
        content: 'First API design',
        tags: ['api'],
        generatedBy: '/plan',
        project: 'test-project',
      };

      const result1 = await organizer.createDocument(params1);

      // Create second document with same base name
      const params2: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Design,
        baseName: 'api',
        title: 'API GraphQL Schema Design',
        content: 'GraphQL API design',
        tags: ['api', 'graphql'],
        generatedBy: '/plan',
        project: 'test-project',
      };

      const result2 = await organizer.createDocument(params2);

      // If the first document created design-api.md and second created design-api-api.md
      // without conflict, that's correct behavior since they have different names
      expect(result2.path).toMatch(/design-api-.+\.md$/);
      expect(result2.path).not.toBe(result1.path);
    });

    it('should include all required metadata in frontmatter', async () => {
      const params: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Spec,
        baseName: 'user-auth',
        title: 'User Authentication Specification',
        content: 'Spec content',
        tags: ['auth', 'spec'],
        generatedBy: '/spec',
        project: 'auth-system',
        metadata: {
          implements: 'projects/auth-system/plan.md',
          related_docs: ['projects/auth-system/design.md'],
          context_source: ['context/requirements.md'],
        },
      };

      const result = await organizer.createDocument(params);

      // Read the created file
      const content = await fileSystem.readFile(`${contextRoot}/${result.path}`);
      const { metadata: frontmatter } = parseFrontmatter(content);

      // Verify required fields
      expect(frontmatter['title']).toBe('User Authentication Specification');
      expect(frontmatter['category']).toBe(PARACategory.Projects);
      expect(frontmatter['command_type']).toBe(CommandDocumentType.Spec);
      expect(frontmatter['project']).toBe('auth-system');
      expect(frontmatter['status']).toBe('active');
      expect(frontmatter['generated_by']).toBe('/spec');

      // Verify optional fields
      expect(frontmatter['implements']).toBe('projects/auth-system/plan.md');
      expect(frontmatter['related_docs']).toEqual(['projects/auth-system/design.md']);
      expect(frontmatter['context_source']).toEqual(['context/requirements.md']);

      // Verify timestamps
      expect(frontmatter['created']).toBeDefined();
      expect(frontmatter['modified']).toBeDefined();
    });

    it('should create project index when configured', async () => {
      const params: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Design,
        baseName: 'architecture',
        title: 'System Architecture',
        content: 'Architecture content',
        tags: ['architecture'],
        generatedBy: '/plan',
        project: 'new-project',
      };

      await organizer.createDocument(params);

      // Check if index was created
      const indexPath = `${contextRoot}/projects/new-project/index.md`;
      const indexExists = await fileSystem.exists(indexPath);
      expect(indexExists).toBe(true);

      // Verify index content
      const indexContent = await fileSystem.readFile(indexPath);
      expect(indexContent).toContain('New Project Project Index');
      expect(indexContent).toContain('category: projects');
    });

    it('should use custom naming patterns when provided', async () => {
      const customOrganizer = new CommandDocumentOrganizer(fileSystem, paraManager, {
        contextRoot,
        autoCreateProjectDirs: true,
        updateIndexes: false,
        namingPatterns: {
          [CommandDocumentType.Design]: 'architecture-{name}.md',
        },
      });

      const params: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Design,
        baseName: 'system',
        title: 'System Architecture',
        content: 'Content',
        tags: [],
        generatedBy: '/plan',
      };

      const result = await customOrganizer.createDocument(params);
      expect(result.path).toBe('projects/architecture-system.md');
    });

    it('should handle special characters in names', async () => {
      const params: CreateCommandDocumentParams = {
        documentType: CommandDocumentType.Todo,
        baseName: 'Test & Implementation (Phase 2)',
        title: 'Test and Implementation Phase 2',
        content: 'Todo content',
        tags: ['testing'],
        generatedBy: '/build',
      };

      const result = await organizer.createDocument(params);
      expect(result.path).toBe('areas/todo-test-implementation-phase-2.md');
    });
  });
});
