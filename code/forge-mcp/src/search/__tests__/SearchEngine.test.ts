// ABOUTME: This file contains unit tests for the SearchEngine class
// ABOUTME: testing document indexing, search functionality, and error handling

import { SearchEngine } from '../SearchEngine';
import { SearchQuery, SearchError } from '../types';
import { FileSystem } from '../../filesystem/FileSystem';
import { PARAManager } from '../../para/PARAManager';
import { PARACategory } from '../../para/types';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fs/promises
jest.mock('fs/promises');

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;
  let mockFileSystem: MockFileSystem;
  let paraManager: PARAManager;
  const contextRoot = '/test/context';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem = new MockFileSystem();
    paraManager = new PARAManager(contextRoot, mockFileSystem);
    searchEngine = new SearchEngine(
      mockFileSystem as unknown as FileSystem,
      paraManager,
      contextRoot,
    );

    // Set up default mocks - but these will be overridden per file
    (fs.stat as jest.Mock).mockResolvedValue({
      birthtime: new Date('2024-01-01'),
      mtime: new Date('2024-01-15'),
    });
  });

  describe('initialization', () => {
    it('should build index on initialization', async () => {
      // Mock file structure
      mockFileSystem.addFile('/test/context/projects/project1.md', '');
      mockFileSystem.addFile('/test/context/areas/area1.md', '');
      // Add directories
      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addDirectory('/test/context/areas');
      mockFileSystem.addDirectory('/test/context/resources');
      mockFileSystem.addDirectory('/test/context/archives');

      (fs.readFile as jest.Mock).mockResolvedValue(`---
title: Test Document
tags: [test, sample]
---
Test content`);

      await searchEngine.initialize();

      const stats = searchEngine.getIndexStats();
      expect(stats.documentCount).toBe(2);
    });

    it('should handle empty categories gracefully', async () => {
      // Don't add any files or directories
      await searchEngine.initialize();

      const stats = searchEngine.getIndexStats();
      expect(stats.documentCount).toBe(0);
    });

    it('should handle indexing errors gracefully', async () => {
      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addFile('/test/context/projects/error.md', '');
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Read error'));

      await searchEngine.initialize();

      const stats = searchEngine.getIndexStats();
      expect(stats.documentCount).toBe(0);
    });
  });

  describe('search functionality', () => {
    beforeEach(async () => {
      // Set up test documents
      const docs = [
        {
          path: '/test/context/projects/javascript-guide.md',
          content: `---
title: JavaScript Guide
tags: [javascript, programming, guide]
created: 2024-01-01T00:00:00Z
---
Learn JavaScript programming with this comprehensive guide.`,
        },
        {
          path: '/test/context/resources/typescript-intro.md',
          content: `---
title: TypeScript Introduction
tags: [typescript, javascript, programming]
created: 2024-01-05T00:00:00Z
---
Introduction to TypeScript and type safety.`,
        },
        {
          path: '/test/context/areas/testing-practices.md',
          content: `---
title: Testing Best Practices
tags: [testing, quality, practices]
created: 2024-01-10T00:00:00Z
---
Best practices for testing JavaScript applications.`,
        },
      ];

      // Set up directory structure
      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addDirectory('/test/context/areas');
      mockFileSystem.addDirectory('/test/context/resources');
      mockFileSystem.addDirectory('/test/context/archives');

      // Add files to mock file system
      docs.forEach((doc) => {
        mockFileSystem.addFile(doc.path, doc.content);
      });

      (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
        const doc = docs.find((d) => filePath.endsWith(path.basename(d.path)));
        return Promise.resolve(doc?.content || '');
      });

      // Mock different stats for each file
      (fs.stat as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('javascript-guide')) {
          return Promise.resolve({
            birthtime: new Date('2024-01-01'),
            mtime: new Date('2024-01-01'),
          });
        } else if (filePath.includes('typescript-intro')) {
          return Promise.resolve({
            birthtime: new Date('2024-01-05'),
            mtime: new Date('2024-01-05'),
          });
        } else if (filePath.includes('testing-practices')) {
          return Promise.resolve({
            birthtime: new Date('2024-01-10'),
            mtime: new Date('2024-01-10'),
          });
        }
        // Default
        return Promise.resolve({
          birthtime: new Date('2024-01-01'),
          mtime: new Date('2024-01-15'),
        });
      });

      await searchEngine.initialize();
    });

    describe('tag search', () => {
      it('should find documents by exact tag match', async () => {
        const query: SearchQuery = { tags: ['javascript'] };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(2);
        expect(response.results[0]?.tags).toContain('javascript');
      });

      it('should find documents by multiple tags with AND operator', async () => {
        const query: SearchQuery = {
          tags: ['javascript', 'programming'],
          operator: 'AND',
        };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(2);
        response.results.forEach((result) => {
          expect(result.tags).toContain('javascript');
          expect(result.tags).toContain('programming');
        });
      });

      it('should find documents by multiple tags with OR operator', async () => {
        const query: SearchQuery = {
          tags: ['testing', 'typescript'],
          operator: 'OR',
        };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(2);
      });

      it('should support partial tag matching', async () => {
        const query: SearchQuery = { tags: ['java'] };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(2); // matches javascript
      });
    });

    describe('content search', () => {
      it('should find documents by content', async () => {
        const query: SearchQuery = { content: 'TypeScript' };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(1);
        expect(response.results[0]?.title).toBe('TypeScript Introduction');
      });

      it('should be case-insensitive', async () => {
        const query: SearchQuery = { content: 'JAVASCRIPT' };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBeGreaterThan(0);
      });

      it('should include snippets when requested', async () => {
        const query: SearchQuery = { content: 'JavaScript' };
        const response = await searchEngine.search(query, { includeSnippets: true });

        expect(response.results[0]?.snippet).toBeDefined();
        expect(response.results[0]?.snippet).toContain('**JavaScript**');
      });
    });

    describe('title search', () => {
      it('should find documents by title', async () => {
        const query: SearchQuery = { title: 'Guide' };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(1);
        expect(response.results[0]?.title).toBe('JavaScript Guide');
      });

      it('should prioritize exact title matches', async () => {
        const query: SearchQuery = { title: 'TypeScript Introduction' };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(1);
        expect(response.results[0]?.relevanceScore).toBeGreaterThan(40);
      });
    });

    describe('category filter', () => {
      it('should filter by PARA category', async () => {
        const query: SearchQuery = {
          content: 'JavaScript',
          category: PARACategory.Projects,
        };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(1);
        expect(response.results[0]?.category).toBe(PARACategory.Projects);
      });
    });

    describe('date range filter', () => {
      it('should filter by date range', async () => {
        const query: SearchQuery = {
          content: 'TypeScript',
          dateRange: {
            start: new Date('2024-01-03'),
            end: new Date('2024-01-07'),
          },
        };
        const response = await searchEngine.search(query);

        // Debug removed - test should work now

        expect(response.totalCount).toBe(1);
        expect(response.results[0]?.title).toBe('TypeScript Introduction');
      });

      it('should handle only start date', async () => {
        const query: SearchQuery = {
          content: 'JavaScript',
          dateRange: { start: new Date('2024-01-05') },
        };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(1);
      });

      it('should handle only end date', async () => {
        const query: SearchQuery = {
          content: 'JavaScript',
          dateRange: { end: new Date('2024-01-05') },
        };
        const response = await searchEngine.search(query);

        expect(response.totalCount).toBe(1); // Only JavaScript Guide
      });
    });

    describe('pagination', () => {
      it('should respect limit parameter', async () => {
        const query: SearchQuery = {
          tags: ['programming'],
          limit: 1,
        };
        const response = await searchEngine.search(query);

        expect(response.results.length).toBe(1);
        expect(response.totalCount).toBe(2);
      });

      it('should respect offset parameter', async () => {
        const query: SearchQuery = {
          tags: ['programming'],
          limit: 1,
          offset: 1,
        };
        const response = await searchEngine.search(query);

        expect(response.results.length).toBe(1);
        expect(response.results[0]?.title).not.toBe('JavaScript Guide');
      });
    });

    describe('relevance scoring', () => {
      it('should sort results by relevance score', async () => {
        const query: SearchQuery = {
          content: 'JavaScript',
          tags: ['javascript'],
        };
        const response = await searchEngine.search(query);

        expect(response.results[0]?.relevanceScore).toBeGreaterThan(
          response.results[1]?.relevanceScore || 0,
        );
      });
    });
  });

  describe('validation', () => {
    it('should require at least one search criterion', async () => {
      const query: SearchQuery = {};

      await expect(searchEngine.search(query)).rejects.toThrow(SearchError);
      await expect(searchEngine.search(query)).rejects.toThrow(
        'At least one search criterion must be provided',
      );
    });

    it('should validate date range', async () => {
      const query: SearchQuery = {
        content: 'test',
        dateRange: {
          start: new Date('2024-01-10'),
          end: new Date('2024-01-05'),
        },
      };

      await expect(searchEngine.search(query)).rejects.toThrow('Invalid date range');
    });

    it('should validate limit parameter', async () => {
      const query: SearchQuery = {
        content: 'test',
        limit: 0,
      };

      await expect(searchEngine.search(query)).rejects.toThrow('Limit must be greater than 0');
    });

    it('should validate offset parameter', async () => {
      const query: SearchQuery = {
        content: 'test',
        offset: -1,
      };

      await expect(searchEngine.search(query)).rejects.toThrow('Offset must be non-negative');
    });
  });

  describe('document updates', () => {
    it('should update document in index', async () => {
      const filePath = '/test/context/projects/updated.md';

      // Initial content
      (fs.readFile as jest.Mock).mockResolvedValueOnce(`---
title: Original Title
tags: [original]
---
Original content`);

      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addDirectory('/test/context/areas');
      mockFileSystem.addDirectory('/test/context/resources');
      mockFileSystem.addDirectory('/test/context/archives');
      mockFileSystem.addFile(filePath, '');

      await searchEngine.initialize();

      // Update content
      (fs.readFile as jest.Mock).mockResolvedValueOnce(`---
title: Updated Title
tags: [updated]
---
Updated content`);

      await searchEngine.updateDocument(filePath);

      const response = await searchEngine.search({ tags: ['updated'] });
      expect(response.totalCount).toBe(1);
      expect(response.results[0]?.title).toBe('Updated Title');
    });

    it('should remove document from index', async () => {
      const filePath = '/test/context/projects/remove.md';

      (fs.readFile as jest.Mock).mockResolvedValue(`---
title: To Remove
tags: [remove]
---
Content`);

      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addDirectory('/test/context/areas');
      mockFileSystem.addDirectory('/test/context/resources');
      mockFileSystem.addDirectory('/test/context/archives');
      mockFileSystem.addFile(filePath, '');

      await searchEngine.initialize();

      searchEngine.removeDocument(filePath);

      const response = await searchEngine.search({ tags: ['remove'] });
      expect(response.totalCount).toBe(0);
    });
  });

  describe('index statistics', () => {
    it('should provide accurate index statistics', async () => {
      // Set up directory structure
      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addDirectory('/test/context/areas');
      mockFileSystem.addDirectory('/test/context/resources');
      mockFileSystem.addDirectory('/test/context/archives');

      // Add test files
      mockFileSystem.addFile('/test/context/projects/p1.md', '');
      mockFileSystem.addFile('/test/context/projects/p2.md', '');
      mockFileSystem.addFile('/test/context/areas/a1.md', '');
      mockFileSystem.addFile('/test/context/resources/r1.md', '');
      mockFileSystem.addFile('/test/context/resources/r2.md', '');
      mockFileSystem.addFile('/test/context/resources/r3.md', '');

      (fs.readFile as jest.Mock).mockResolvedValue(`---
title: Test
tags: []
---
Content`);

      await searchEngine.initialize();

      const stats = searchEngine.getIndexStats();

      expect(stats.documentCount).toBe(6);
      expect(stats.categories[PARACategory.Projects]).toBe(2);
      expect(stats.categories[PARACategory.Areas]).toBe(1);
      expect(stats.categories[PARACategory.Resources]).toBe(3);
      expect(stats.categories[PARACategory.Archives]).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle search errors gracefully', async () => {
      // Set up some test data first
      mockFileSystem.addDirectory('/test/context');
      mockFileSystem.addDirectory('/test/context/projects');
      mockFileSystem.addFile('/test/context/projects/test.md', '');

      (fs.readFile as jest.Mock).mockResolvedValue(`---
title: Test
tags: [test]
---
Test content`);

      await searchEngine.initialize();

      // Force an error during search
      const engineWithPrivate = searchEngine as unknown as {
        matchesFilters: (doc: unknown, query: unknown) => boolean;
      };
      const originalMatchesFilters = engineWithPrivate.matchesFilters;
      engineWithPrivate.matchesFilters = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(searchEngine.search({ content: 'test' })).rejects.toThrow(SearchError);

      // Restore original method
      engineWithPrivate.matchesFilters = originalMatchesFilters;
    });

    it('should include execution time in response', async () => {
      await searchEngine.initialize();

      const response = await searchEngine.search({ content: 'test' });

      expect(response.executionTime).toBeDefined();
      expect(typeof response.executionTime).toBe('number');
      expect(response.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
