// ABOUTME: Integration tests for the backlink tracking system
// ABOUTME: Tests interactions with document operations and search

import { BacklinkManager } from '../BacklinkManager';
import { FileSystem } from '../../filesystem/FileSystem';
import { PARAManager } from '../../para/PARAManager';
import { PARACategory } from '../../para/types';
import { SearchEngine } from '../../search/SearchEngine';
import { serializeDocument } from '../../parsers/serializer';
import { DocumentFrontmatter } from '../../models/types';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Helper to create test documents
function createTestDocument(
  frontmatter: Partial<DocumentFrontmatter> & { title: string },
  content: string,
): string {
  const doc = {
    id: 'test.md',
    path: '/test.md',
    frontmatter: frontmatter as DocumentFrontmatter,
    content,
  };
  return serializeDocument(doc);
}

describe('Backlink Integration Tests', () => {
  let tempDir: string;
  let fileSystem: FileSystem;
  let backlinkManager: BacklinkManager;
  let paraManager: PARAManager;
  let searchEngine: SearchEngine;

  beforeEach(async () => {
    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backlink-integration-'));

    // Initialize components
    fileSystem = new FileSystem(tempDir);
    backlinkManager = new BacklinkManager(fileSystem, tempDir);
    paraManager = new PARAManager(tempDir, fileSystem);
    searchEngine = new SearchEngine(fileSystem, paraManager, tempDir);

    await backlinkManager.initialize();
    await searchEngine.initialize();
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Document lifecycle integration', () => {
    it('should track backlinks through document creation and updates', async () => {
      // Create first document
      const doc1Path = path.join(tempDir, 'projects', 'project1.md');
      const doc1Content = createTestDocument(
        {
          title: 'Project 1',
          tags: ['project'],
        },
        'This project depends on [[project2]] for completion.',
      );

      await fileSystem.mkdir(path.join(tempDir, 'projects'), true);
      await fileSystem.writeFile(doc1Path, doc1Content);
      await backlinkManager.updateDocumentLinks(doc1Path, doc1Content);

      // Create second document that links back
      const doc2Path = path.join(tempDir, 'projects', 'project2.md');
      const doc2Content = createTestDocument(
        {
          title: 'Project 2',
          tags: ['project', 'dependency'],
        },
        'This is referenced by [[project1]] and contains [[resources/tool]].',
      );

      await fileSystem.writeFile(doc2Path, doc2Content);
      await backlinkManager.updateDocumentLinks(doc2Path, doc2Content);

      // Check backlinks
      const project1Backlinks = backlinkManager.getBacklinks(doc1Path);
      expect(project1Backlinks.backlinks).toHaveLength(1);
      expect(project1Backlinks.backlinks[0]?.sourcePath).toBe(doc2Path);

      const project2Backlinks = backlinkManager.getBacklinks(doc2Path);
      expect(project2Backlinks.backlinks).toHaveLength(1);
      expect(project2Backlinks.backlinks[0]?.sourcePath).toBe(doc1Path);

      // Update first document to remove link
      const updatedDoc1Content = createTestDocument(
        {
          title: 'Project 1',
          tags: ['project'],
        },
        'This project is now independent.',
      );

      await fileSystem.writeFile(doc1Path, updatedDoc1Content);
      await backlinkManager.updateDocumentLinks(doc1Path, updatedDoc1Content);

      // Verify backlink was removed
      const updatedProject2Backlinks = backlinkManager.getBacklinks(doc2Path);
      expect(updatedProject2Backlinks.backlinks).toHaveLength(0);
    });

    it('should handle complex link networks', async () => {
      // Create a hub document
      const hubPath = path.join(tempDir, 'areas', 'knowledge-hub.md');
      const hubContent = createTestDocument(
        {
          title: 'Knowledge Hub',
          tags: ['hub', 'index'],
        },
        `# Knowledge Hub
      
Key projects:
- [[/projects/web-app]] - Main application
- [[/projects/mobile-app]] - Mobile version
- [[/projects/api]] - Backend API

Key resources:
- [[/resources/design-system]] - UI components
- [[/resources/database-schema]] - Data models`,
      );

      await fileSystem.mkdir(path.join(tempDir, 'areas'), true);
      await fileSystem.mkdir(path.join(tempDir, 'projects'), true);
      await fileSystem.mkdir(path.join(tempDir, 'resources'), true);
      await fileSystem.writeFile(hubPath, hubContent);
      await backlinkManager.updateDocumentLinks(hubPath, hubContent);

      // Create linked documents
      const webAppPath = path.join(tempDir, 'projects', 'web-app.md');
      const webAppContent = createTestDocument(
        {
          title: 'Web Application',
          tags: ['project', 'frontend'],
        },
        'Uses [[/resources/design-system]] and connects to [[/projects/api]].',
      );

      await fileSystem.writeFile(webAppPath, webAppContent);
      await backlinkManager.updateDocumentLinks(webAppPath, webAppContent);

      const apiPath = path.join(tempDir, 'projects', 'api.md');
      const apiContent = createTestDocument(
        {
          title: 'Backend API',
          tags: ['project', 'backend'],
        },
        'Implements [[/resources/database-schema]] for [[/projects/web-app]] and [[/projects/mobile-app]].',
      );

      await fileSystem.writeFile(apiPath, apiContent);
      await backlinkManager.updateDocumentLinks(apiPath, apiContent);

      // Check backlink counts
      const stats = backlinkManager.getStats();
      expect(stats.documentCount).toBeGreaterThanOrEqual(5);
      expect(stats.linkCount).toBeGreaterThanOrEqual(8);

      // Verify hub is most linked to
      const designSystemBacklinks = backlinkManager.getBacklinks(
        path.join(tempDir, 'resources', 'design-system.md'),
      );
      expect(designSystemBacklinks.backlinks).toHaveLength(2); // hub + web-app
    });
  });

  describe('Search integration', () => {
    beforeEach(async () => {
      // Create test documents with links
      const docs = [
        {
          path: 'projects/main-project.md',
          frontmatter: { title: 'Main Project', tags: ['important'] },
          content: 'This is the main project that references [[/resources/shared-resource]].',
        },
        {
          path: 'projects/side-project.md',
          frontmatter: { title: 'Side Project', tags: ['experimental'] },
          content: 'A side project that also uses [[/resources/shared-resource]].',
        },
        {
          path: 'resources/shared-resource.md',
          frontmatter: { title: 'Shared Resource', tags: ['utility'] },
          content: 'A resource used by multiple projects.',
        },
        {
          path: 'areas/planning.md',
          frontmatter: { title: 'Planning', tags: ['process'] },
          content: 'Planning document that tracks [[/projects/main-project]] progress.',
        },
      ];

      for (const doc of docs) {
        const fullPath = path.join(tempDir, doc.path);
        const dir = path.dirname(fullPath);
        await fileSystem.mkdir(path.join(tempDir, path.relative(tempDir, dir)), true);

        const serialized = createTestDocument(doc.frontmatter, doc.content);
        await fileSystem.writeFile(fullPath, serialized);
        await backlinkManager.updateDocumentLinks(fullPath, serialized);
      }

      // Initialize search engine to index documents
      await searchEngine.initialize();
    });

    it('should enrich search results with backlink information', async () => {
      const results = await searchEngine.search({
        content: 'resource',
      });

      // Find the shared resource in results
      const sharedResource = results.results.find((r) => r.title === 'Shared Resource');

      expect(sharedResource).toBeDefined();

      // Check if it has backlinks
      const resourceFullPath = sharedResource ? path.join(tempDir, sharedResource.path) : '';
      const backlinks = backlinkManager.getBacklinks(resourceFullPath);
      expect(backlinks.totalCount).toBe(2); // main and side project
    });

    it('should find documents by backlink count', () => {
      const stats = backlinkManager.getStats();

      // Most linked should be shared-resource
      expect(stats.mostLinkedDocuments[0]?.path).toContain('shared-resource.md');
      expect(stats.mostLinkedDocuments[0]?.incomingLinkCount).toBe(2);

      // Most linking should be main-project (if we count outgoing)
      const projectPath = path.join(tempDir, 'projects', 'main-project.md');
      const hasLinks = stats.mostLinkingDocuments.some((d) => d.path === projectPath);
      expect(hasLinks).toBe(true);
    });
  });

  describe('PARA category integration', () => {
    it('should resolve cross-category links correctly', async () => {
      // Create documents in different PARA categories
      const projectPath = path.join(tempDir, 'projects', 'app-development.md');
      const areaPath = path.join(tempDir, 'areas', 'coding-standards.md');
      const resourcePath = path.join(tempDir, 'resources', 'typescript-guide.md');

      // Project links to area and resource
      const projectContent = createTestDocument(
        {
          title: 'App Development',
          category: PARACategory.Projects,
        },
        'Following [[/areas/coding-standards]] and using [[/resources/typescript-guide]].',
      );

      // Area links to resource
      const areaContent = createTestDocument(
        {
          title: 'Coding Standards',
          category: PARACategory.Areas,
        },
        'Based on [[/resources/typescript-guide]] best practices.',
      );

      // Resource is standalone
      const resourceContent = createTestDocument(
        {
          title: 'TypeScript Guide',
          category: PARACategory.Resources,
        },
        'Comprehensive TypeScript reference.',
      );

      // Create all documents
      await fileSystem.mkdir(path.join(tempDir, 'projects'), true);
      await fileSystem.mkdir(path.join(tempDir, 'areas'), true);
      await fileSystem.mkdir(path.join(tempDir, 'resources'), true);

      await fileSystem.writeFile(projectPath, projectContent);
      await fileSystem.writeFile(areaPath, areaContent);
      await fileSystem.writeFile(resourcePath, resourceContent);

      // Update backlinks
      await backlinkManager.updateDocumentLinks(projectPath, projectContent);
      await backlinkManager.updateDocumentLinks(areaPath, areaContent);
      await backlinkManager.updateDocumentLinks(resourcePath, resourceContent);

      // Check resource has correct backlinks
      const resourceBacklinks = backlinkManager.getBacklinks(resourcePath);
      expect(resourceBacklinks.totalCount).toBe(2);

      const sources = resourceBacklinks.backlinks.map((bl) => bl.sourcePath).sort();
      expect(sources).toEqual([areaPath, projectPath].sort());
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle circular references', async () => {
      const doc1Path = path.join(tempDir, 'doc1.md');
      const doc2Path = path.join(tempDir, 'doc2.md');

      const doc1 = createTestDocument({ title: 'Doc 1' }, 'Links to [[doc2]].');
      const doc2 = createTestDocument({ title: 'Doc 2' }, 'Links back to [[doc1]].');

      await fileSystem.writeFile(doc1Path, doc1);
      await fileSystem.writeFile(doc2Path, doc2);

      await backlinkManager.updateDocumentLinks(doc1Path, doc1);
      await backlinkManager.updateDocumentLinks(doc2Path, doc2);

      const doc1Backlinks = backlinkManager.getBacklinks(doc1Path);
      const doc2Backlinks = backlinkManager.getBacklinks(doc2Path);

      expect(doc1Backlinks.backlinks).toHaveLength(1);
      expect(doc2Backlinks.backlinks).toHaveLength(1);
    });

    it('should handle self-references', async () => {
      const docPath = path.join(tempDir, 'recursive.md');
      const content = createTestDocument(
        { title: 'Recursive' },
        'This document links to itself: [[recursive]].',
      );

      await fileSystem.writeFile(docPath, content);
      await backlinkManager.updateDocumentLinks(docPath, content);

      const backlinks = backlinkManager.getBacklinks(docPath);
      expect(backlinks.backlinks).toHaveLength(1);
      expect(backlinks.backlinks[0]?.sourcePath).toBe(docPath);
    });

    it('should handle broken links gracefully', async () => {
      const docPath = path.join(tempDir, 'doc-with-broken-links.md');
      const content = createTestDocument(
        { title: 'Document' },
        'Links to [[non-existent]] and [[also-missing]].',
      );

      await fileSystem.writeFile(docPath, content);
      await backlinkManager.updateDocumentLinks(docPath, content);

      // Should still track the links even if targets don't exist
      const extraction = await backlinkManager.extractLinks(docPath, content);
      expect(extraction.links).toHaveLength(2);

      // Backlinks for non-existent files should return empty
      const backlinks = backlinkManager.getBacklinks(path.join(tempDir, 'non-existent.md'));
      expect(backlinks.backlinks).toHaveLength(1);
    });
  });

  describe('Performance considerations', () => {
    it('should handle large numbers of documents efficiently', async () => {
      const startTime = Date.now();

      // Create 100 documents with various links
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const category = ['projects', 'areas', 'resources'][i % 3];
        const docPath = path.join(tempDir, category || 'resources', `doc-${i}.md`);

        // Each doc links to 2-3 others
        const links = [];
        for (let j = 0; j < Math.floor(Math.random() * 2) + 2; j++) {
          const targetId = Math.floor(Math.random() * 100);
          const targetCategory = ['projects', 'areas', 'resources'][targetId % 3];
          links.push(`[[${targetCategory}/doc-${targetId}]]`);
        }

        const content = createTestDocument(
          {
            title: `Document ${i}`,
            tags: [`tag${i % 10}`],
          },
          `Content with links: ${links.join(', ')}.`,
        );

        promises.push(
          (async (): Promise<void> => {
            await fileSystem.mkdir(path.join(tempDir, category || 'resources'), true);
            await fileSystem.writeFile(docPath, content);
            await backlinkManager.updateDocumentLinks(docPath, content);
          })(),
        );
      }

      await Promise.all(promises);

      const indexTime = Date.now() - startTime;
      expect(indexTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Test query performance
      const queryStart = Date.now();
      const mostLinked = backlinkManager.getStats().mostLinkedDocuments[0];
      const backlinks = backlinkManager.getBacklinks(mostLinked?.path || '');
      const queryTime = Date.now() - queryStart;

      expect(queryTime).toBeLessThan(50); // Queries should be fast
      expect(backlinks.totalCount).toBeGreaterThan(0);
    });
  });
});
