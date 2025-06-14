// ABOUTME: Tests for wiki-link preservation during document updates
// ABOUTME: Ensures links are properly maintained when content is replaced

import { DocumentUpdater } from '../DocumentUpdater';
import { MockFileSystem } from '../../filesystem/MockFileSystem';
import { PARAManager } from '../../para/PARAManager';

describe('Link Preservation', () => {
  let updater: DocumentUpdater;

  beforeEach(() => {
    const fileSystem = new MockFileSystem();
    const paraManager = new PARAManager('/test', fileSystem);
    updater = new DocumentUpdater(fileSystem, paraManager);
  });

  describe('complex link scenarios', () => {
    it('should preserve links with anchors', () => {
      const oldContent = 'Text with [[page#section]] and [[other#heading|Display Text]].';
      const newContent = 'New text.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[page#section]]');
      expect(result.content).toContain('[[other#heading|Display Text]]');
      expect(result.count).toBe(2);
    });

    it('should handle multiple links to same target', () => {
      const oldContent = 'First [[target]], second [[target|different display]], third [[target]].';
      const newContent = 'New content with [[target]].';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      // Should not preserve any since target already exists in new content
      expect(result.count).toBe(0);
      expect(result.content).toBe('New content with [[target]].');
    });

    it('should preserve links with special characters', () => {
      const oldContent = 'Links: [[file-name.md]], [[path/to/file]], [[name (with parens)]].';
      const newContent = 'New content.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[file-name.md]]');
      expect(result.content).toContain('[[path/to/file]]');
      expect(result.content).toContain('[[name (with parens)]]');
      expect(result.count).toBe(3);
    });

    it('should handle links at document boundaries', () => {
      const oldContent = '[[start-link]] Middle text [[end-link]]';
      const newContent = 'Replaced.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[start-link]]');
      expect(result.content).toContain('[[end-link]]');
      expect(result.count).toBe(2);
    });

    it('should handle adjacent links', () => {
      const oldContent = 'Text [[link1]][[link2]] more [[link3]].';
      const newContent = 'New text.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[link1]]');
      expect(result.content).toContain('[[link2]]');
      expect(result.content).toContain('[[link3]]');
      expect(result.count).toBe(3);
    });

    it('should preserve link order', () => {
      const oldContent = 'First [[alpha]], then [[beta]], finally [[gamma]].';
      const newContent = 'New content.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      const preservedSection = result.content.split('## Preserved Links')[1];
      expect(preservedSection).toBeDefined();
      const alphaIndex = preservedSection?.indexOf('[[alpha]]') ?? -1;
      const betaIndex = preservedSection?.indexOf('[[beta]]') ?? -1;
      const gammaIndex = preservedSection?.indexOf('[[gamma]]') ?? -1;

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(gammaIndex);
    });

    it('should handle nested brackets correctly', () => {
      const oldContent = 'Text with [[link]] and `[[not-a-link]]` and ```\n[[also-not]]\n```.';
      const newContent = 'New content.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[link]]');
      expect(result.content).not.toContain('[[not-a-link]]');
      expect(result.content).not.toContain('[[also-not]]');
      expect(result.count).toBe(1);
    });

    it('should handle empty old content', () => {
      const oldContent = '';
      const newContent = 'New content.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toBe('New content.');
      expect(result.count).toBe(0);
    });

    it('should handle empty new content', () => {
      const oldContent = 'Old with [[link]].';
      const newContent = '';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toContain('[[link]]');
      expect(result.count).toBe(1);
    });

    it('should deduplicate display text variations', () => {
      const oldContent = 'Link [[target|Display 1]] and [[target|Display 2]].';
      const newContent = 'New with [[target]].';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      // Should not preserve any since target exists
      expect(result.count).toBe(0);
    });
  });

  describe('preserved links section formatting', () => {
    it('should create properly formatted preserved section', () => {
      const oldContent = 'Text with [[link1]] and [[link2|display]].';
      const newContent = 'New content.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toBe(
        'New content.\n\n## Preserved Links\n\n- [[link1]]\n- [[link2|display]]',
      );
    });

    it('should handle single preserved link', () => {
      const oldContent = 'Text with [[only-link]].';
      const newContent = 'New content.';

      const result = updater.preserveWikiLinks(oldContent, newContent);

      expect(result.content).toBe('New content.\n\n## Preserved Links\n\n- [[only-link]]');
    });
  });
});
