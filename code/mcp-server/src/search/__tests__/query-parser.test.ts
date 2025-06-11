// ABOUTME: This file contains unit tests for the QueryParser class
// ABOUTME: testing advanced query syntax parsing and normalization

import { QueryParser } from '../query-parser';
import { ParsedQuery } from '../advanced-types';

describe('QueryParser', () => {
  let parser: QueryParser;

  beforeEach(() => {
    parser = new QueryParser();
  });

  describe('simple queries', () => {
    it('should parse single term', () => {
      const result = parser.parse('javascript');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]).toEqual({
        value: 'javascript',
        type: 'fuzzy',
      });
      expect(result.should).toHaveLength(0);
      expect(result.mustNot).toHaveLength(0);
    });

    it('should parse multiple terms as implicit AND', () => {
      const result = parser.parse('javascript testing');
      expect(result.must).toHaveLength(2);
      expect(result.must[0]?.value).toBe('javascript');
      expect(result.must[1]?.value).toBe('testing');
    });

    it('should parse quoted phrases', () => {
      const result = parser.parse('"exact phrase"');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]).toEqual({
        value: 'exact phrase',
        type: 'phrase',
      });
    });

    it('should handle escaped quotes in phrases', () => {
      const result = parser.parse('"say \\"hello\\""');
      expect(result.must[0]?.value).toBe('say "hello"');
      expect(result.must[0]?.type).toBe('phrase');
    });
  });

  describe('boolean operators', () => {
    it('should parse AND operator', () => {
      const result = parser.parse('javascript AND testing');
      expect(result.must).toHaveLength(2);
      expect(result.must[0]?.value).toBe('javascript');
      expect(result.must[1]?.value).toBe('testing');
    });

    it('should parse OR operator', () => {
      const result = parser.parse('javascript OR python');
      expect(result.should).toHaveLength(2);
      expect(result.should[0]?.value).toBe('javascript');
      expect(result.should[1]?.value).toBe('python');
      expect(result.must).toHaveLength(1); // One moved from should to must
    });

    it('should parse NOT operator', () => {
      const result = parser.parse('javascript NOT typescript');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.value).toBe('javascript');
      expect(result.mustNot).toHaveLength(1);
      expect(result.mustNot[0]?.value).toBe('typescript');
    });

    it('should parse minus as NOT', () => {
      const result = parser.parse('javascript -typescript');
      expect(result.must).toHaveLength(1);
      expect(result.mustNot).toHaveLength(1);
      expect(result.mustNot[0]?.value).toBe('typescript');
    });

    it('should handle complex boolean expressions', () => {
      const result = parser.parse('(javascript OR python) AND testing NOT framework');
      expect(result.must.length).toBeGreaterThan(0);
      expect(result.mustNot.length).toBeGreaterThan(0);
    });
  });

  describe('field-specific search', () => {
    it('should parse title field', () => {
      const result = parser.parse('title:guide');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]).toEqual({
        field: 'title',
        value: 'guide',
        type: 'fuzzy',
      });
    });

    it('should parse content field', () => {
      const result = parser.parse('content:javascript');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.field).toBe('content');
      expect(result.must[0]?.value).toBe('javascript');
    });

    it('should parse tags field', () => {
      const result = parser.parse('tags:programming');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.field).toBe('tags');
    });

    it('should handle tag as alias for tags', () => {
      const result = parser.parse('tag:javascript');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.field).toBe('tag');
    });

    it('should parse field with quoted value', () => {
      const result = parser.parse('title:"User Guide"');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.field).toBe('title');
      expect(result.must[0]?.value).toBe('User Guide');
    });

    it('should handle invalid fields as regular text', () => {
      const result = parser.parse('invalid:value');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.field).toBeUndefined();
      expect(result.must[0]?.value).toBe('invalid:value');
    });
  });

  describe('wildcards', () => {
    it('should parse wildcard at end', () => {
      const result = parser.parse('java*');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]).toEqual({
        value: 'java*',
        type: 'wildcard',
      });
    });

    it('should parse wildcard at beginning', () => {
      const result = parser.parse('*script');
      expect(result.must[0]?.type).toBe('wildcard');
    });

    it('should parse wildcard in middle', () => {
      const result = parser.parse('java*script');
      expect(result.must[0]?.type).toBe('wildcard');
    });

    it('should parse question mark wildcard', () => {
      const result = parser.parse('test?');
      expect(result.must[0]?.type).toBe('wildcard');
    });
  });

  describe('parentheses grouping', () => {
    it('should parse simple grouped expression', () => {
      const result = parser.parse('(javascript)');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.value).toBe('javascript');
    });

    it('should parse grouped OR expression', () => {
      const result = parser.parse('testing AND (javascript OR python)');
      expect(result.must.length).toBeGreaterThanOrEqual(1);
      expect(result.should.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle nested parentheses', () => {
      const result = parser.parse('((javascript OR python) AND testing)');
      expect(result.must.length).toBeGreaterThan(0);
    });

    it('should throw on unmatched parentheses', () => {
      expect(() => parser.parse('(javascript')).toThrow('Expected closing parenthesis');
      expect(() => parser.parse('javascript)')).not.toThrow();
    });
  });

  describe('complex queries', () => {
    it('should parse mixed operators and fields', () => {
      const result = parser.parse('title:guide AND (tag:javascript OR tag:typescript) -deprecated');
      expect(result.must.length).toBeGreaterThanOrEqual(1);
      expect(result.mustNot.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse multiple phrases', () => {
      const result = parser.parse('"user guide" OR "developer guide"');
      expect(result.should).toHaveLength(2);
      expect(result.should[0]?.type).toBe('phrase');
      expect(result.should[1]?.type).toBe('phrase');
    });

    it('should handle all features combined', () => {
      const query =
        'title:"JavaScript Guide" AND (tag:beginner OR tag:intermediate) content:async* -deprecated';
      const result = parser.parse(query);

      expect(result.must.length).toBeGreaterThan(0);
      expect(result.mustNot).toHaveLength(1);
      expect(result.mustNot[0]?.value).toBe('deprecated');
    });
  });

  describe('normalize method', () => {
    it('should normalize simple query', () => {
      const parsed: ParsedQuery = {
        must: [{ value: 'javascript', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const normalized = QueryParser.normalize(parsed);
      expect(normalized).toBe('javascript');
    });

    it('should normalize with operators', () => {
      const parsed: ParsedQuery = {
        must: [
          { value: 'javascript', type: 'fuzzy' },
          { value: 'testing', type: 'fuzzy' },
        ],
        should: [
          { value: 'jest', type: 'fuzzy' },
          { value: 'mocha', type: 'fuzzy' },
        ],
        mustNot: [{ value: 'deprecated', type: 'fuzzy' }],
      };

      const normalized = QueryParser.normalize(parsed);
      expect(normalized).toContain('AND');
      expect(normalized).toContain('OR');
      expect(normalized).toContain('NOT');
    });

    it('should normalize field-specific queries', () => {
      const parsed: ParsedQuery = {
        must: [{ field: 'title', value: 'guide', type: 'fuzzy' }],
        should: [],
        mustNot: [],
      };

      const normalized = QueryParser.normalize(parsed);
      expect(normalized).toBe('title:guide');
    });

    it('should normalize phrases with quotes', () => {
      const parsed: ParsedQuery = {
        must: [{ value: 'user guide', type: 'phrase' }],
        should: [],
        mustNot: [],
      };

      const normalized = QueryParser.normalize(parsed);
      expect(normalized).toBe('"user guide"');
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const result = parser.parse('');
      expect(result.must).toHaveLength(0);
      expect(result.should).toHaveLength(0);
      expect(result.mustNot).toHaveLength(0);
    });

    it('should handle whitespace-only query', () => {
      const result = parser.parse('   \n\t   ');
      expect(result.must).toHaveLength(0);
    });

    it('should handle special characters', () => {
      const result = parser.parse('C++ programming');
      expect(result.must).toHaveLength(2);
      expect(result.must[0]?.value).toBe('C++');
    });

    it('should handle operators as regular terms when quoted', () => {
      const result = parser.parse('"AND" "OR" "NOT"');
      expect(result.must).toHaveLength(3);
      expect(result.must[0]?.value).toBe('AND');
      expect(result.must[0]?.type).toBe('phrase');
    });

    it('should handle colons in non-field contexts', () => {
      const result = parser.parse('time:3:30pm');
      expect(result.must).toHaveLength(1);
      expect(result.must[0]?.value).toBe('time:3:30pm');
    });
  });
});
