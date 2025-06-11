// ABOUTME: Comprehensive test suite for the wiki-link parser module
// ABOUTME: Tests all link formats, edge cases, and utility functions

import {
  parseWikiLinks,
  extractLinkComponents,
  replaceWikiLink,
  normalizeTarget,
  createWikiLink,
  isValidTarget,
  extractUniqueTargets,
  findLinkPositions,
} from '../wiki-link';

describe('WikiLink Parser', () => {
  describe('parseWikiLinks', () => {
    it('should parse a single basic wiki link', () => {
      const content = 'This is a [[Test Document]] link.';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        raw: '[[Test Document]]',
        target: 'Test Document',
        position: { start: 10, end: 27 },
      });
    });

    it('should parse multiple wiki links', () => {
      const content = 'Link to [[Document A]] and [[Document B]].';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(2);
      expect(links[0]?.target).toBe('Document A');
      expect(links[1]?.target).toBe('Document B');
    });

    it('should parse links with display text', () => {
      const content = 'See [[API Design|our API docs]] for details.';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        raw: '[[API Design|our API docs]]',
        target: 'API Design',
        displayText: 'our API docs',
        position: { start: 4, end: 31 },
      });
    });

    it('should parse links with anchors', () => {
      const content = 'Jump to [[Document#section-2]] directly.';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        raw: '[[Document#section-2]]',
        target: 'Document',
        anchor: 'section-2',
        position: { start: 8, end: 30 },
      });
    });

    it('should parse links with anchors and display text', () => {
      const content = 'Read [[Guide#intro|the introduction]] first.';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        raw: '[[Guide#intro|the introduction]]',
        target: 'Guide',
        anchor: 'intro',
        displayText: 'the introduction',
        position: { start: 5, end: 37 },
      });
    });

    it('should exclude links in code blocks by default', () => {
      const content = `
Text with [[Real Link]].
\`\`\`
Code with [[Not A Link]]
\`\`\`
More text.`;
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]?.target).toBe('Real Link');
    });

    it('should include links in code blocks when option is false', () => {
      const content = `
\`\`\`
[[Link In Code]]
\`\`\``;
      const links = parseWikiLinks(content, { excludeCodeBlocks: false });

      expect(links).toHaveLength(1);
      expect(links[0]?.target).toBe('Link In Code');
    });

    it('should exclude links in inline code by default', () => {
      const content = 'Use `[[Not A Link]]` syntax vs [[Real Link]].';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]?.target).toBe('Real Link');
    });

    it('should handle adjacent links', () => {
      const content = '[[Link1]][[Link2]][[Link3]]';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(3);
      expect(links.map((l) => l.target)).toEqual(['Link1', 'Link2', 'Link3']);
    });

    it('should handle links with special characters', () => {
      const content = '[[File (v2.0)]] and [[Project: Alpha]]';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(2);
      expect(links[0]?.target).toBe('File (v2.0)');
      expect(links[1]?.target).toBe('Project: Alpha');
    });

    it('should not parse incomplete links', () => {
      const content = '[[Incomplete and [[Complete Link]]';
      const links = parseWikiLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]?.target).toBe('Complete Link');
    });

    it('should handle empty content', () => {
      const links = parseWikiLinks('');
      expect(links).toHaveLength(0);
    });

    it('should handle content with no links', () => {
      const content = 'This is plain text without any wiki links.';
      const links = parseWikiLinks(content);
      expect(links).toHaveLength(0);
    });
  });

  describe('extractLinkComponents', () => {
    it('should extract basic target', () => {
      const result = extractLinkComponents('Document Name');
      expect(result).toEqual({ target: 'Document Name' });
    });

    it('should extract target with display text', () => {
      const result = extractLinkComponents('Document|display text');
      expect(result).toEqual({
        target: 'Document',
        displayText: 'display text',
      });
    });

    it('should extract target with anchor', () => {
      const result = extractLinkComponents('Document#section');
      expect(result).toEqual({
        target: 'Document',
        anchor: 'section',
      });
    });

    it('should extract all components', () => {
      const result = extractLinkComponents('Document#section|display');
      expect(result).toEqual({
        target: 'Document',
        anchor: 'section',
        displayText: 'display',
      });
    });

    it('should handle extra whitespace', () => {
      const result = extractLinkComponents('  Document  |  display  ');
      expect(result).toEqual({
        target: 'Document',
        displayText: 'display',
      });
    });

    it('should handle multiple pipes (take first)', () => {
      const result = extractLinkComponents('Doc|text|more');
      expect(result).toEqual({
        target: 'Doc',
        displayText: 'text|more',
      });
    });

    it('should handle multiple hashes (take first)', () => {
      const result = extractLinkComponents('Doc#section#subsection');
      expect(result).toEqual({
        target: 'Doc',
        anchor: 'section#subsection',
      });
    });
  });

  describe('replaceWikiLink', () => {
    it('should replace a single link', () => {
      const content = 'Link to [[Old Document]] here.';
      const result = replaceWikiLink(content, '[[Old Document]]', '[[New Document]]');
      expect(result).toBe('Link to [[New Document]] here.');
    });

    it('should replace multiple occurrences', () => {
      const content = '[[Doc]] and [[Doc]] again.';
      const result = replaceWikiLink(content, '[[Doc]]', '[[Document]]');
      expect(result).toBe('[[Document]] and [[Document]] again.');
    });

    it('should handle links with special regex characters', () => {
      const content = 'Link to [[File (v1.0)]] here.';
      const result = replaceWikiLink(content, '[[File (v1.0)]]', '[[File (v2.0)]]');
      expect(result).toBe('Link to [[File (v2.0)]] here.');
    });

    it('should not replace partial matches', () => {
      const content = '[[Document]] and [[Document Name]]';
      const result = replaceWikiLink(content, '[[Document]]', '[[Doc]]');
      expect(result).toBe('[[Doc]] and [[Document Name]]');
    });
  });

  describe('normalizeTarget', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTarget('Document Name')).toBe('document-name');
    });

    it('should replace spaces with hyphens', () => {
      expect(normalizeTarget('Multi Word Document')).toBe('multi-word-document');
    });

    it('should remove special characters', () => {
      expect(normalizeTarget('File (v1.0)')).toBe('file-v10');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeTarget('Too   Many    Spaces')).toBe('too-many-spaces');
    });

    it('should trim whitespace', () => {
      expect(normalizeTarget('  Padded  ')).toBe('padded');
    });

    it('should preserve hyphens', () => {
      expect(normalizeTarget('already-hyphenated')).toBe('already-hyphenated');
    });
  });

  describe('createWikiLink', () => {
    it('should create basic link', () => {
      expect(createWikiLink('Document')).toBe('[[Document]]');
    });

    it('should create link with anchor', () => {
      expect(createWikiLink('Document', { anchor: 'section' })).toBe('[[Document#section]]');
    });

    it('should create link with display text', () => {
      expect(createWikiLink('Document', { displayText: 'click here' })).toBe(
        '[[Document|click here]]',
      );
    });

    it('should create link with all options', () => {
      expect(
        createWikiLink('Document', {
          anchor: 'intro',
          displayText: 'Introduction',
        }),
      ).toBe('[[Document#intro|Introduction]]');
    });
  });

  describe('isValidTarget', () => {
    it('should accept valid targets', () => {
      expect(isValidTarget('Document')).toBe(true);
      expect(isValidTarget('Document Name')).toBe(true);
      expect(isValidTarget('File-2.0')).toBe(true);
    });

    it('should reject empty targets', () => {
      expect(isValidTarget('')).toBe(false);
      expect(isValidTarget('   ')).toBe(false);
    });

    it('should reject targets with brackets', () => {
      expect(isValidTarget('Doc[ument')).toBe(false);
      expect(isValidTarget('Doc]ument')).toBe(false);
    });

    it('should reject targets with pipes', () => {
      expect(isValidTarget('Doc|ument')).toBe(false);
    });

    it('should reject targets with hashes', () => {
      expect(isValidTarget('Doc#ument')).toBe(false);
    });
  });

  describe('extractUniqueTargets', () => {
    it('should extract unique targets only', () => {
      const content = `
        Link to [[Document A]] and [[Document B]].
        Another link to [[Document A]] and [[Document C]].
      `;
      const targets = extractUniqueTargets(content);

      expect(targets).toHaveLength(3);
      expect(targets.sort()).toEqual(['Document A', 'Document B', 'Document C']);
    });

    it('should handle links with anchors as same target', () => {
      const content = '[[Doc#section1]] and [[Doc#section2]]';
      const targets = extractUniqueTargets(content);

      expect(targets).toHaveLength(1);
      expect(targets[0]).toBe('Doc');
    });

    it('should return empty array for no links', () => {
      const targets = extractUniqueTargets('No links here.');
      expect(targets).toHaveLength(0);
    });
  });

  describe('findLinkPositions', () => {
    it('should find all positions of a target', () => {
      const content = 'First [[Doc]] then [[Other]] then [[Doc]] again.';
      const positions = findLinkPositions(content, 'Doc');

      expect(positions).toHaveLength(2);
      expect(positions[0]).toEqual({ start: 6, end: 13 });
      expect(positions[1]).toEqual({ start: 34, end: 41 });
    });

    it('should match normalized targets', () => {
      const content = '[[document-name]] and [[Document Name]]';
      const positions = findLinkPositions(content, 'DOCUMENT NAME');

      expect(positions).toHaveLength(2);
    });

    it('should find links with anchors', () => {
      const content = '[[Doc]] and [[Doc#section]]';
      const positions = findLinkPositions(content, 'Doc');

      expect(positions).toHaveLength(2);
    });

    it('should return empty array if target not found', () => {
      const content = '[[Other Document]]';
      const positions = findLinkPositions(content, 'Not Found');

      expect(positions).toHaveLength(0);
    });
  });

  describe('performance', () => {
    it('should handle large documents efficiently', () => {
      // Create a document with 1000 links
      const links: string[] = [];
      for (let i = 0; i < 1000; i++) {
        links.push(`[[Document${i}]]`);
      }
      const content = links.join(' Some text between links. ');

      const startTime = Date.now();
      const parsed = parseWikiLinks(content);
      const endTime = Date.now();

      expect(parsed).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should parse in under 100ms
    });

    it('should handle deeply nested content', () => {
      const content = `
        Normal [[Link1]].
        \`\`\`
        Code with [[Not Link]].
        \`Nested \`code\` here\`
        \`\`\`
        Back to [[Link2]] normal.
        Inline \`code [[Not Link2]]\` test.
        Final [[Link3]].
      `;

      const links = parseWikiLinks(content);
      expect(links).toHaveLength(3);
      expect(links.map((l) => l.target)).toEqual(['Link1', 'Link2', 'Link3']);
    });
  });
});
