// ABOUTME: Unit tests for DocumentMover class
// ABOUTME: Tests document movement, link updates, and error handling

import { DocumentMover } from '../DocumentMover';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import { PARAManager } from '../../para/PARAManager';
import { BacklinkManager } from '../../backlinks/BacklinkManager';
import { DocumentUpdater } from '../../updater/DocumentUpdater';
import { DocumentMoveError } from '../types';
import { join } from 'path';

describe('DocumentMover', () => {
  let fs: MockFileSystem;
  let para: PARAManager;
  let backlinks: BacklinkManager;
  let updater: DocumentUpdater;
  let mover: DocumentMover;
  const contextRoot = '/test/context';

  beforeEach(async () => {
    fs = new MockFileSystem();
    para = new PARAManager(contextRoot, fs);
    backlinks = new BacklinkManager(fs, contextRoot);
    updater = new DocumentUpdater(fs, para);
    mover = new DocumentMover(fs, para, backlinks, updater, contextRoot);

    // Initialize PARA structure
    await para.initializeStructure();
    await backlinks.initialize();

    // Create test documents
    await fs.writeFile(
      join(contextRoot, 'Projects/project1.md'),
      `---
title: Project 1
tags: [project, test]
---

# Project 1

This is project 1 content.`,
    );

    await fs.writeFile(
      join(contextRoot, 'Areas/area1.md'),
      `---
title: Area 1
tags: [area]
---

# Area 1

This links to [[/Projects/project1]].`,
    );

    await fs.writeFile(
      join(contextRoot, 'Resources/resource1.md'),
      `---
title: Resource 1
tags: [resource]
---

# Resource 1

Multiple links:
- [[/Projects/project1|Project One]]
- See also [[/Projects/project1]]`,
    );

    // Update backlink index
    await backlinks.updateDocumentLinks(
      join(contextRoot, 'Areas/area1.md'),
      await fs.readFile(join(contextRoot, 'Areas/area1.md')),
    );
    await backlinks.updateDocumentLinks(
      join(contextRoot, 'Resources/resource1.md'),
      await fs.readFile(join(contextRoot, 'Resources/resource1.md')),
    );
  });

  describe('validateMove', () => {
    it('should validate a simple move within same category', async () => {
      const result = await mover.moveDocument(
        'Projects/project1.md',
        'Projects/project1-renamed.md',
      );

      expect(result.oldPath).toBe(join(contextRoot, 'Projects/project1.md'));
      expect(result.newPath).toBe(join(contextRoot, 'Projects/project1-renamed.md'));
      expect(result.oldCategory).toBeUndefined();
      expect(result.newCategory).toBeUndefined();
    });

    it('should validate a cross-category move', async () => {
      const result = await mover.moveDocument('Projects/project1.md', 'Archives/project1.md');

      expect(result.oldPath).toBe(join(contextRoot, 'Projects/project1.md'));
      expect(result.newPath).toBe(join(contextRoot, 'Archives/project1.md'));
      expect(result.oldCategory).toBe('projects');
      expect(result.newCategory).toBe('archives');
    });

    it('should throw error for non-existent source', async () => {
      await expect(
        mover.moveDocument('Projects/nonexistent.md', 'Projects/new.md'),
      ).rejects.toThrow(DocumentMoveError);
    });

    it('should throw error for existing destination without overwrite', async () => {
      await fs.writeFile(join(contextRoot, 'Projects/existing.md'), 'content');

      await expect(
        mover.moveDocument('Projects/project1.md', 'Projects/existing.md'),
      ).rejects.toThrow(DocumentMoveError);
    });

    it('should allow overwrite when specified', async () => {
      await fs.writeFile(join(contextRoot, 'Projects/existing.md'), 'old content');

      const result = await mover.moveDocument('Projects/project1.md', 'Projects/existing.md', {
        overwrite: true,
      });

      expect(result.newPath).toBe(join(contextRoot, 'Projects/existing.md'));
      const content = await fs.readFile(join(contextRoot, 'Projects/existing.md'));
      expect(content).toContain('Project 1');
    });

    it('should throw error for paths outside context root', async () => {
      await expect(mover.moveDocument('../outside.md', 'Projects/new.md')).rejects.toThrow(
        DocumentMoveError,
      );

      await expect(mover.moveDocument('Projects/project1.md', '../outside.md')).rejects.toThrow(
        DocumentMoveError,
      );
    });
  });

  describe('link updates', () => {
    it('should update simple wiki links', async () => {
      const result = await mover.moveDocument(
        'Projects/project1.md',
        'Archives/project1-archived.md',
      );

      expect(result.totalLinksUpdated).toBe(3); // 1 in area1, 2 in resource1
      expect(result.updatedLinks).toHaveLength(2);

      // Check that links were updated
      const area1Content = await fs.readFile(join(contextRoot, 'Areas/area1.md'));
      expect(area1Content).toContain('[[/Archives/project1-archived]]');
      expect(area1Content).not.toContain('[[/Projects/project1]]');

      const resource1Content = await fs.readFile(join(contextRoot, 'Resources/resource1.md'));
      expect(resource1Content).toContain('[[/Archives/project1-archived|Project One]]');
      expect(resource1Content).toContain('[[/Archives/project1-archived]]');
      expect(resource1Content).not.toContain('[[/Projects/project1');
    });

    it('should skip link updates when updateLinks is false', async () => {
      const result = await mover.moveDocument('Projects/project1.md', 'Archives/project1.md', {
        updateLinks: false,
      });

      expect(result.totalLinksUpdated).toBe(0);
      expect(result.updatedLinks).toHaveLength(0);

      // Links should remain unchanged
      const area1Content = await fs.readFile(join(contextRoot, 'Areas/area1.md'));
      expect(area1Content).toContain('[[/Projects/project1]]');
    });

    it('should handle documents with no incoming links', async () => {
      await fs.writeFile(
        join(contextRoot, 'Projects/isolated.md'),
        `---
title: Isolated
---

No links to this.`,
      );

      const result = await mover.moveDocument('Projects/isolated.md', 'Archives/isolated.md');

      expect(result.totalLinksUpdated).toBe(0);
      expect(result.updatedLinks).toHaveLength(0);
    });

    it('should preserve link display text', async () => {
      await mover.moveDocument('Projects/project1.md', 'Resources/project1-moved.md');

      const resource1Content = await fs.readFile(join(contextRoot, 'Resources/resource1.md'));
      expect(resource1Content).toContain('[[project1-moved|Project One]]');
    });
  });

  describe('atomic operations', () => {
    it('should rollback on link update failure', async () => {
      // Mock a failure during link update
      const originalWriteFile = fs.writeFile.bind(fs);
      let callCount = 0;
      jest.spyOn(fs, 'writeFile').mockImplementation(async (path, content) => {
        callCount++;
        // Fail on the second write (first link update)
        if (callCount === 2) {
          throw new Error('Simulated write failure');
        }
        return originalWriteFile(path, content);
      });

      await expect(
        mover.moveDocument('Projects/project1.md', 'Archives/project1.md'),
      ).rejects.toThrow(DocumentMoveError);

      // Original document should still exist
      expect(await fs.exists(join(contextRoot, 'Projects/project1.md'))).toBe(true);
      expect(await fs.exists(join(contextRoot, 'Archives/project1.md'))).toBe(false);

      // Links should be unchanged
      const area1Content = await fs.readFile(join(contextRoot, 'Areas/area1.md'));
      expect(area1Content).toContain('[[/Projects/project1]]');
    });

    it('should handle rollback failures gracefully', async () => {
      // Mock failures during both link update and rollback
      const originalWriteFile = fs.writeFile.bind(fs);
      let callCount = 0;
      jest.spyOn(fs, 'writeFile').mockImplementation(async (path, content) => {
        callCount++;
        // Fail on link update and rollback
        if (callCount >= 2) {
          throw new Error('Simulated write failure');
        }
        return originalWriteFile(path, content);
      });

      await expect(
        mover.moveDocument('Projects/project1.md', 'Archives/project1.md'),
      ).rejects.toThrow(DocumentMoveError);
    });
  });

  describe('category updates', () => {
    it('should update document category in frontmatter', async () => {
      await mover.moveDocument('Projects/project1.md', 'Archives/project1.md');

      const content = await fs.readFile(join(contextRoot, 'Archives/project1.md'));
      expect(content).toContain('category: archives');
    });

    it('should not update category for same-category moves', async () => {
      await mover.moveDocument('Projects/project1.md', 'Projects/project1-renamed.md');

      const content = await fs.readFile(join(contextRoot, 'Projects/project1-renamed.md'));
      expect(content).not.toContain('category:');
    });
  });

  describe('path resolution', () => {
    it('should handle paths without extensions', async () => {
      const result = await mover.moveDocument('Projects/project1', 'Archives/project1');

      expect(result.oldPath).toBe(join(contextRoot, 'Projects/project1.md'));
      expect(result.newPath).toBe(join(contextRoot, 'Archives/project1.md'));
    });

    it('should handle absolute paths within context root', async () => {
      const result = await mover.moveDocument(
        join(contextRoot, 'Projects/project1.md'),
        join(contextRoot, 'Archives/project1.md'),
      );

      expect(result.oldPath).toBe(join(contextRoot, 'Projects/project1.md'));
      expect(result.newPath).toBe(join(contextRoot, 'Archives/project1.md'));
    });

    it('should calculate correct relative links', async () => {
      // Create a document in a subdirectory
      await fs.mkdir(join(contextRoot, 'Projects/subdir'), true);
      await fs.writeFile(
        join(contextRoot, 'Projects/subdir/doc.md'),
        'Links to [[/Projects/project1]]',
      );
      await backlinks.updateDocumentLinks(
        join(contextRoot, 'Projects/subdir/doc.md'),
        await fs.readFile(join(contextRoot, 'Projects/subdir/doc.md')),
      );

      await mover.moveDocument('Projects/project1.md', 'Projects/project1-moved.md');

      const content = await fs.readFile(join(contextRoot, 'Projects/subdir/doc.md'));
      expect(content).toContain('[[/Projects/project1-moved]]');
    });
  });

  describe('backlink index updates', () => {
    it('should update backlink index after move', async () => {
      const oldBacklinks = backlinks.getBacklinksSync(join(contextRoot, 'Projects/project1.md'));
      expect(oldBacklinks.length).toBeGreaterThan(0);

      await mover.moveDocument('Projects/project1.md', 'Archives/project1.md');

      // Old path should have no backlinks
      const oldPathBacklinks = backlinks.getBacklinksSync(
        join(contextRoot, 'Projects/project1.md'),
      );
      expect(oldPathBacklinks.length).toBe(0);

      // New path should have the backlinks
      const newPathBacklinks = backlinks.getBacklinksSync(
        join(contextRoot, 'Archives/project1.md'),
      );
      expect(newPathBacklinks.length).toBe(oldBacklinks.length);
    });
  });
});
