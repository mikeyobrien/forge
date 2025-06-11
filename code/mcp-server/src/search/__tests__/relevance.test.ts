// ABOUTME: This file contains unit tests for the relevance scoring algorithm
// ABOUTME: testing various scoring scenarios and edge cases

import { RelevanceScorer } from '../relevance';
import { IndexedDocument, SearchQuery, ScoringWeights } from '../types';
import { PARACategory } from '../../para/types';

describe('RelevanceScorer', () => {
  let scorer: RelevanceScorer;

  const createMockDocument = (overrides: Partial<IndexedDocument> = {}): IndexedDocument => ({
    path: '/test/document.md',
    relativePath: 'test/document.md',
    title: 'Test Document',
    content: 'This is test content',
    tags: ['test', 'document'],
    category: PARACategory.Resources,
    created: new Date('2024-01-01'),
    modified: new Date('2024-01-15'),
    ...overrides,
  });

  beforeEach(() => {
    scorer = new RelevanceScorer();
  });

  describe('tag matching', () => {
    it('should score exact tag matches highest', () => {
      const doc = createMockDocument({ tags: ['javascript', 'typescript', 'testing'] });
      const query: SearchQuery = { tags: ['javascript', 'testing'] };

      const score = scorer.calculateScore(doc, query);

      // 2 exact matches * 30 points each = 60
      expect(score).toBe(60);
    });

    it('should score partial tag matches', () => {
      const doc = createMockDocument({ tags: ['javascript', 'typescript'] });
      const query: SearchQuery = { tags: ['java', 'type'] };

      const score = scorer.calculateScore(doc, query);

      // 2 partial matches * 15 points each = 30
      expect(score).toBe(30);
    });

    it('should handle case-insensitive tag matching', () => {
      const doc = createMockDocument({ tags: ['JavaScript', 'TypeScript'] });
      const query: SearchQuery = { tags: ['javascript', 'typescript'] };

      const score = scorer.calculateScore(doc, query);

      expect(score).toBe(60); // 2 exact matches
    });

    it('should score zero for no tag matches', () => {
      const doc = createMockDocument({ tags: ['python', 'rust'] });
      const query: SearchQuery = { tags: ['javascript', 'typescript'] };

      const score = scorer.calculateScore(doc, query);

      expect(score).toBe(0);
    });
  });

  describe('title matching', () => {
    it('should score exact title match highest', () => {
      const doc = createMockDocument({ title: 'JavaScript Guide' });
      const query: SearchQuery = { title: 'JavaScript Guide' };

      const score = scorer.calculateScore(doc, query);

      // Exact match = 25 * 2 = 50
      expect(score).toBe(50);
    });

    it('should score title contains match', () => {
      const doc = createMockDocument({ title: 'Complete JavaScript Guide' });
      const query: SearchQuery = { title: 'JavaScript' };

      const score = scorer.calculateScore(doc, query);

      expect(score).toBe(25);
    });

    it('should score partial word matches in title', () => {
      const doc = createMockDocument({ title: 'JavaScript and TypeScript Guide' });
      const query: SearchQuery = { title: 'Guide TypeScript' };

      const score = scorer.calculateScore(doc, query);

      // Both words match, ratio = 2/2 = 1.0, score = 25
      expect(score).toBe(25);
    });

    it('should handle case-insensitive title matching', () => {
      const doc = createMockDocument({ title: 'JAVASCRIPT GUIDE' });
      const query: SearchQuery = { title: 'javascript guide' };

      const score = scorer.calculateScore(doc, query);

      expect(score).toBe(50); // Exact match
    });
  });

  describe('content matching', () => {
    it('should score content matches based on occurrences', () => {
      const doc = createMockDocument({
        content: 'JavaScript is great. JavaScript is powerful. I love JavaScript.',
      });
      const query: SearchQuery = { content: 'JavaScript' };

      const score = scorer.calculateScore(doc, query);

      // 3 occurrences * 10 points = 30
      expect(score).toBe(30);
    });

    it('should cap content score at maximum', () => {
      const content = 'test '.repeat(20); // 20 occurrences
      const doc = createMockDocument({ content });
      const query: SearchQuery = { content: 'test' };

      const score = scorer.calculateScore(doc, query);

      // Should be capped at 50
      expect(score).toBe(50);
    });

    it('should match words when exact phrase not found', () => {
      const doc = createMockDocument({
        content: 'This document covers JavaScript programming and best practices',
      });
      const query: SearchQuery = { content: 'JavaScript best' };

      const score = scorer.calculateScore(doc, query);

      // Should find individual words
      expect(score).toBeGreaterThan(0);
    });

    it('should handle case-insensitive content matching', () => {
      const doc = createMockDocument({ content: 'JAVASCRIPT programming' });
      const query: SearchQuery = { content: 'javascript' };

      const score = scorer.calculateScore(doc, query);

      expect(score).toBe(10); // 1 occurrence
    });
  });

  describe('recency boost', () => {
    it('should give maximum boost to documents modified today', () => {
      const doc = createMockDocument({ modified: new Date() });
      const query: SearchQuery = { content: 'test' };

      const score = scorer.calculateScore(doc, query);

      // Content match (10) + recency boost (1)
      expect(score).toBe(11);
    });

    it('should decay boost for older documents', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 180); // 180 days ago

      const doc = createMockDocument({
        modified: oldDate,
        content: 'test content',
      });
      const query: SearchQuery = { content: 'test' };

      const score = scorer.calculateScore(doc, query);

      // Should have some boost but less than full boost
      expect(score).toBeGreaterThan(10);
      expect(score).toBeLessThanOrEqual(11);
    });

    it('should give no boost to very old documents', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

      const doc = createMockDocument({
        modified: oldDate,
        content: 'test content',
      });
      const query: SearchQuery = { content: 'test' };

      const score = scorer.calculateScore(doc, query);

      // Should have no recency boost
      expect(score).toBe(10);
    });
  });

  describe('combined scoring', () => {
    it('should combine all scoring factors', () => {
      const doc = createMockDocument({
        title: 'JavaScript Testing Guide',
        content: 'Learn testing with JavaScript. Testing is important.',
        tags: ['javascript', 'testing', 'guide'],
        modified: new Date(),
      });

      const query: SearchQuery = {
        title: 'Testing',
        content: 'testing',
        tags: ['javascript', 'test'],
      };

      const score = scorer.calculateScore(doc, query);

      // Title match (25) + content matches (20) + exact tag (30) + partial tag (15) + recency (~1)
      expect(score).toBeGreaterThan(90);
      expect(score).toBeLessThanOrEqual(100); // Capped at 100
    });

    it('should return 0 for no matches', () => {
      const doc = createMockDocument({
        title: 'Python Guide',
        content: 'Learn Python programming',
        tags: ['python', 'programming'],
      });

      const query: SearchQuery = {
        title: 'JavaScript',
        content: 'typescript',
        tags: ['rust', 'golang'],
      };

      const score = scorer.calculateScore(doc, query);

      expect(score).toBe(0);
    });
  });

  describe('custom scoring weights', () => {
    it('should use custom weights when provided', () => {
      const customWeights: ScoringWeights = {
        exactTagMatch: 50,
        partialTagMatch: 25,
        titleMatch: 40,
        contentMatch: 5,
        maxContentScore: 30,
        recencyBoost: 0,
      };

      const customScorer = new RelevanceScorer(customWeights);
      const doc = createMockDocument({ tags: ['javascript'] });
      const query: SearchQuery = { tags: ['javascript'] };

      const score = customScorer.calculateScore(doc, query);

      expect(score).toBe(50); // Custom exact tag match weight
    });
  });

  describe('snippet generation', () => {
    it('should generate snippet with highlighted term', () => {
      const content =
        'This is a test document about JavaScript programming. JavaScript is great for web development.';
      const snippet = RelevanceScorer.generateSnippet(content, 'JavaScript', 150, 5);

      expect(snippet).toContain('**JavaScript**');
      expect(snippet.length).toBeLessThanOrEqual(200); // Some buffer for highlights
    });

    it('should add ellipsis for long content', () => {
      const content =
        'Start. ' + 'Word '.repeat(50) + 'JavaScript is here. ' + 'Word '.repeat(50) + ' End.';
      const snippet = RelevanceScorer.generateSnippet(content, 'JavaScript', 100, 5);

      expect(snippet).toContain('...');
      expect(snippet).toContain('**JavaScript**');
    });

    it('should return beginning if term not found', () => {
      const content = 'This is a long document without the search term. '.repeat(10);
      const snippet = RelevanceScorer.generateSnippet(content, 'notfound', 100, 5);

      expect(snippet).toMatch(/^This is a long/);
      expect(snippet).toContain('...');
    });

    it('should handle empty content', () => {
      const snippet = RelevanceScorer.generateSnippet('', 'test', 100, 5);

      expect(snippet).toBe('');
    });

    it('should escape regex special characters in search term', () => {
      const content = 'Using regex characters like $test or test? in content';
      const snippet = RelevanceScorer.generateSnippet(content, 'test?', 150, 5);

      expect(snippet).toContain('**test?**');
    });
  });
});
