// ABOUTME: This file contains unit tests for the AdvancedRelevanceScorer class
// ABOUTME: testing fuzzy scoring, field boosting, and document similarity

import { AdvancedRelevanceScorer } from '../advanced-relevance';
import { ParsedQuery } from '../advanced-types';
import { IndexedDocument } from '../types';
import { PARACategory } from '../../para/types';

describe('AdvancedRelevanceScorer', () => {
  let scorer: AdvancedRelevanceScorer;
  let testDocument: IndexedDocument;

  beforeEach(() => {
    scorer = new AdvancedRelevanceScorer();

    testDocument = {
      path: '/test/doc.md',
      relativePath: 'doc.md',
      title: 'JavaScript Testing Guide',
      content:
        'Learn how to test JavaScript applications with modern testing frameworks like Jest and Mocha.',
      tags: ['javascript', 'testing', 'jest', 'mocha'],
      category: PARACategory.Resources,
      created: new Date('2024-01-01'),
      modified: new Date('2024-01-15'),
    };
  });

  describe('calculateAdvancedScore', () => {
    it('should score exact matches higher than fuzzy matches', () => {
      const exactQuery: ParsedQuery = {
        must: [{ value: 'JavaScript', type: 'exact' }],
        should: [],
        mustNot: [],
      };

      const fuzzyQuery: ParsedQuery = {
        must: [{ value: 'JavaScrip', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const exactScore = scorer.calculateAdvancedScore(testDocument, exactQuery);
      const fuzzyScore = scorer.calculateAdvancedScore(testDocument, fuzzyQuery);

      expect(exactScore).toBeGreaterThan(fuzzyScore);
    });

    it('should return 0 if MUST clause does not match', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Python', type: 'exact' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBe(0);
    });

    it('should return 0 if MUST_NOT clause matches', () => {
      const query: ParsedQuery = {
        must: [{ value: 'JavaScript', type: 'fuzzy' }],
        should: [],
        mustNot: [{ value: 'testing', type: 'fuzzy' }],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBe(0);
    });

    it('should handle SHOULD clauses with lower weight', () => {
      const query: ParsedQuery = {
        must: [{ value: 'JavaScript', type: 'fuzzy' }],
        should: [
          { value: 'React', type: 'fuzzy' },
          { value: 'Jest', type: 'fuzzy' },
        ],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should apply all-terms boost when all clauses match', () => {
      const partialQuery: ParsedQuery = {
        must: [
          { value: 'JavaScript', type: 'fuzzy' },
          { value: 'Python', type: 'fuzzy' },
        ],
        should: [],
        mustNot: [],
      };

      const fullQuery: ParsedQuery = {
        must: [
          { value: 'JavaScript', type: 'fuzzy' },
          { value: 'testing', type: 'fuzzy' },
        ],
        should: [],
        mustNot: [],
      };

      const partialScore = scorer.calculateAdvancedScore(testDocument, partialQuery);
      const fullScore = scorer.calculateAdvancedScore(testDocument, fullQuery);

      expect(fullScore).toBeGreaterThan(partialScore);
    });
  });

  describe('field-specific matching', () => {
    it('should match title field', () => {
      const query: ParsedQuery = {
        must: [{ field: 'title', value: 'Guide', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should match content field', () => {
      const query: ParsedQuery = {
        must: [{ field: 'content', value: 'frameworks', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should match tags field', () => {
      const query: ParsedQuery = {
        must: [{ field: 'tags', value: 'jest', type: 'exact' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should search all fields when field is not specified', () => {
      const query: ParsedQuery = {
        must: [{ value: 'JavaScript', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should apply field boosts', () => {
      const titleQuery: ParsedQuery = {
        must: [{ field: 'title', value: 'JavaScript', type: 'exact' }],
        should: [],
        mustNot: [],
      };

      const contentQuery: ParsedQuery = {
        must: [{ field: 'content', value: 'JavaScript', type: 'exact' }],
        should: [],
        mustNot: [],
      };

      const titleScore = scorer.calculateAdvancedScore(testDocument, titleQuery);
      const contentScore = scorer.calculateAdvancedScore(testDocument, contentQuery);

      // Title matches should score higher due to field boost
      expect(titleScore).toBeGreaterThan(contentScore);
    });
  });

  describe('fuzzy matching', () => {
    it('should handle typos in fuzzy mode', () => {
      const query: ParsedQuery = {
        must: [{ value: 'JavaScrpt', type: 'fuzzy' }], // Missing 'i'
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should respect fuzzy tolerance', () => {
      const highToleranceQuery: ParsedQuery = {
        must: [{ value: 'Java', type: 'fuzzy', fuzzyTolerance: 0.5 }],
        should: [],
        mustNot: [],
      };

      const lowToleranceQuery: ParsedQuery = {
        must: [{ value: 'Java', type: 'fuzzy', fuzzyTolerance: 0.95 }],
        should: [],
        mustNot: [],
      };

      const highScore = scorer.calculateAdvancedScore(testDocument, highToleranceQuery);
      scorer.calculateAdvancedScore(testDocument, lowToleranceQuery);

      expect(highScore).toBeGreaterThan(0);
    });
  });

  describe('wildcard matching', () => {
    it('should match prefix wildcards', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Java*', type: 'wildcard' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should match suffix wildcards', () => {
      const query: ParsedQuery = {
        must: [{ value: '*Script', type: 'wildcard' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should match middle wildcards', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Java*ing', type: 'wildcard' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBe(0); // Should not match
    });

    it('should handle question mark wildcards', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Jes?', type: 'wildcard' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('phrase matching', () => {
    it('should match exact phrases', () => {
      const query: ParsedQuery = {
        must: [{ value: 'JavaScript applications', type: 'phrase' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should not match partial phrases', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Python applications', type: 'phrase' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBe(0);
    });

    it('should boost phrases at the beginning', () => {
      const beginningQuery: ParsedQuery = {
        must: [{ value: 'Learn how', type: 'phrase' }],
        should: [],
        mustNot: [],
      };

      const middleQuery: ParsedQuery = {
        must: [{ value: 'with modern', type: 'phrase' }],
        should: [],
        mustNot: [],
      };

      const doc = { ...testDocument };
      const beginScore = scorer.calculateAdvancedScore(doc, beginningQuery);
      const middleScore = scorer.calculateAdvancedScore(doc, middleQuery);

      expect(beginScore).toBeGreaterThan(middleScore);
    });
  });

  describe('regex matching', () => {
    it('should match valid regex patterns', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Java[Ss]cript', type: 'regex' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should handle invalid regex gracefully', () => {
      const query: ParsedQuery = {
        must: [{ value: '[invalid(regex', type: 'regex' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBe(0);
    });
  });

  describe('calculateDocumentSimilarity', () => {
    it('should calculate similarity between identical documents', () => {
      const similarity = scorer.calculateDocumentSimilarity(testDocument, testDocument);
      expect(similarity).toBe(1);
    });

    it('should calculate similarity based on title', () => {
      const doc2: IndexedDocument = {
        ...testDocument,
        title: 'JavaScript Development Guide',
        content: 'Different content',
        tags: [],
      };

      const similarity = scorer.calculateDocumentSimilarity(testDocument, doc2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should calculate similarity based on tags', () => {
      const doc2: IndexedDocument = {
        ...testDocument,
        title: 'Different Title',
        tags: ['javascript', 'testing'],
      };

      const similarity = scorer.calculateDocumentSimilarity(testDocument, doc2);
      expect(similarity).toBeGreaterThan(0);
    });

    it('should calculate similarity based on content keywords', () => {
      const doc2: IndexedDocument = {
        ...testDocument,
        title: 'Different Title',
        content: 'Testing JavaScript code with Jest framework',
        tags: [],
      };

      const similarity = scorer.calculateDocumentSimilarity(testDocument, doc2);
      expect(similarity).toBeGreaterThan(0);
    });

    it('should return 0 for completely different documents', () => {
      const doc2: IndexedDocument = {
        ...testDocument,
        title: 'Python Data Science',
        content: 'Machine learning with Python and NumPy',
        tags: ['python', 'data-science', 'numpy'],
      };

      const similarity = scorer.calculateDocumentSimilarity(testDocument, doc2);
      expect(similarity).toBeLessThan(0.2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const emptyDoc: IndexedDocument = {
        ...testDocument,
        content: '',
      };

      const query: ParsedQuery = {
        must: [{ field: 'content', value: 'test', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(emptyDoc, query);
      expect(score).toBe(0);
    });

    it('should handle empty tags', () => {
      const noTagsDoc: IndexedDocument = {
        ...testDocument,
        tags: [],
      };

      const query: ParsedQuery = {
        must: [{ field: 'tags', value: 'javascript', type: 'exact' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(noTagsDoc, query);
      expect(score).toBe(0);
    });

    it('should handle special characters in wildcard patterns', () => {
      const query: ParsedQuery = {
        must: [{ value: 'Java.*Script', type: 'wildcard' }],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeGreaterThan(0);
    });

    it('should cap scores at 100', () => {
      const query: ParsedQuery = {
        must: [
          { value: 'JavaScript', type: 'exact' },
          { value: 'Testing', type: 'exact' },
          { value: 'Guide', type: 'exact' },
        ],
        should: [],
        mustNot: [],
      };

      const score = scorer.calculateAdvancedScore(testDocument, query);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
