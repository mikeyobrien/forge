// ABOUTME: Comprehensive test suite for the frontmatter parser
// ABOUTME: Tests parsing, validation, error handling, and edge cases

import { z } from 'zod';
import {
  FrontmatterParser,
  FrontmatterParseError,
  FrontmatterValidationError,
} from '../frontmatter';

describe('FrontmatterParser', () => {
  let parser: FrontmatterParser;

  beforeEach(() => {
    parser = new FrontmatterParser();
  });

  describe('Basic parsing', () => {
    it('should parse valid frontmatter with string values', () => {
      const content = `---
title: Test Document
author: John Doe
---
# Content starts here`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        title: 'Test Document',
        author: 'John Doe',
      });
      expect(result.content).toBe('# Content starts here');
      expect(result.raw.startLine).toBe(1);
      expect(result.raw.endLine).toBe(4);
    });

    it('should parse frontmatter with various data types', () => {
      const content = `---
title: Test
count: 42
price: 19.99
published: true
draft: false
tags: [typescript, testing, parser]
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        title: 'Test',
        count: 42,
        price: 19.99,
        published: true,
        draft: false,
        tags: ['typescript', 'testing', 'parser'],
      });
    });

    it('should parse nested objects', () => {
      const content = `---
title: Test
author:
  name: John Doe
  email: john@example.com
metadata:
  version: 1.0.0
  created: 2024-01-01
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        title: 'Test',
        author: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        metadata: {
          version: '1.0.0',
          created: '2024-01-01',
        },
      });
    });

    it('should parse arrays in different formats', () => {
      const content = `---
inline: [a, b, c]
multiline:
  - item1
  - item2
  - item3
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        inline: ['a', 'b', 'c'],
        multiline: ['item1', 'item2', 'item3'],
      });
    });

    it('should handle quoted strings', () => {
      const content = `---
single: 'Single quotes'
double: "Double quotes"
unquoted: No quotes
number_string: "123"
bool_string: "true"
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        single: 'Single quotes',
        double: 'Double quotes',
        unquoted: 'No quotes',
        number_string: '123',
        bool_string: 'true',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle documents without frontmatter', () => {
      const content = '# Just a regular markdown file\n\nWith some content.';

      const result = parser.parse(content);

      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe(content);
      expect(result.raw.frontmatterText).toBeNull();
      expect(result.raw.startLine).toBe(0);
      expect(result.raw.endLine).toBe(0);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('Content');
    });

    it('should handle frontmatter with no content after', () => {
      const content = `---
title: Only Frontmatter
---`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({ title: 'Only Frontmatter' });
      expect(result.content).toBe('');
    });

    it('should handle multiple consecutive delimiters', () => {
      const content = `---
title: Test
---
---
Not frontmatter
---`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({ title: 'Test' });
      expect(result.content).toBe('---\nNot frontmatter\n---');
    });

    it('should normalize different line endings', () => {
      const contentCRLF = '---\r\ntitle: Test\r\n---\r\nContent';
      const contentLF = '---\ntitle: Test\n---\nContent';
      const contentCR = '---\rtitle: Test\r---\rContent';

      const resultCRLF = parser.parse(contentCRLF);
      const resultLF = parser.parse(contentLF);
      const resultCR = parser.parse(contentCR);

      expect(resultCRLF.frontmatter).toEqual({ title: 'Test' });
      expect(resultLF.frontmatter).toEqual({ title: 'Test' });
      expect(resultCR.frontmatter).toEqual({ title: 'Test' });
    });

    it('should ignore comments in frontmatter', () => {
      const content = `---
# This is a comment
title: Test
# Another comment
active: true
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        title: 'Test',
        active: true,
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unclosed frontmatter in non-strict mode', () => {
      const content = `---
title: Unclosed
author: Test`;

      const result = parser.parse(content);

      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe(content);
    });

    it('should throw error for unclosed frontmatter in strict mode', () => {
      const strictParser = new FrontmatterParser({ strict: true });
      const content = `---
title: Unclosed`;

      expect(() => strictParser.parse(content)).toThrow(FrontmatterParseError);
      expect(() => strictParser.parse(content)).toThrow('Unclosed frontmatter block');
    });

    it('should handle invalid YAML in non-strict mode', () => {
      const content = `---
title: Test
invalid: [unclosed array
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe('Content');
    });

    it('should throw error for invalid YAML in strict mode', () => {
      const strictParser = new FrontmatterParser({ strict: true });
      const content = `---
title: Test
invalid syntax here
---
Content`;

      expect(() => strictParser.parse(content)).toThrow(FrontmatterParseError);
    });

    it('should enforce size limit', () => {
      const smallParser = new FrontmatterParser({ maxSize: 50 });
      const content = `---
title: This is a very long title that exceeds the size limit
description: And this makes it even longer
---
Content`;

      expect(() => smallParser.parse(content)).toThrow(FrontmatterParseError);
      expect(() => smallParser.parse(content)).toThrow('exceeds maximum size');
    });
  });

  describe('Custom options', () => {
    it('should use custom delimiter', () => {
      const customParser = new FrontmatterParser({ delimiter: '~~~' });
      const content = `~~~
title: Custom Delimiter
~~~
Content`;

      const result = customParser.parse(content);

      expect(result.frontmatter).toEqual({ title: 'Custom Delimiter' });
      expect(result.content).toBe('Content');
    });

    it('should not parse standard delimiter with custom delimiter set', () => {
      const customParser = new FrontmatterParser({ delimiter: '~~~' });
      const content = `---
title: Standard Delimiter
---
Content`;

      const result = customParser.parse(content);

      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe(content);
    });
  });

  describe('Schema validation', () => {
    const DocumentSchema = z.object({
      title: z.string(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      published: z.boolean().default(false),
    });

    it('should parse and validate with schema', () => {
      const content = `---
title: Valid Document
author: John Doe
tags: [test, valid]
published: true
---
Content`;

      const result = parser.parseWithSchema(content, DocumentSchema);

      expect(result.frontmatter).toEqual({
        title: 'Valid Document',
        author: 'John Doe',
        tags: ['test', 'valid'],
        published: true,
      });

      // Type checking - this should compile
      if (result.frontmatter) {
        const title: string = result.frontmatter.title;
        const published: boolean = result.frontmatter.published || false;
        expect(title).toBe('Valid Document');
        expect(published).toBe(true);
      }
    });

    it('should throw validation error for invalid schema', () => {
      const content = `---
author: Missing required title
published: not-a-boolean
---
Content`;

      expect(() => parser.parseWithSchema(content, DocumentSchema)).toThrow(
        FrontmatterValidationError,
      );
    });

    it('should return null frontmatter for documents without frontmatter', () => {
      const content = 'No frontmatter here';

      const result = parser.parseWithSchema(content, DocumentSchema);

      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe(content);
    });

    it('should apply schema defaults', () => {
      const content = `---
title: Minimal Document
---
Content`;

      const result = parser.parseWithSchema(content, DocumentSchema);

      expect(result.frontmatter).toEqual({
        title: 'Minimal Document',
        published: false, // Default value
      });
    });
  });

  describe('Complex YAML structures', () => {
    it('should parse deeply nested objects', () => {
      const content = `---
root:
  level1:
    level2:
      level3:
        value: deep
      another: value
  sibling: test
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        root: {
          level1: {
            level2: {
              level3: {
                value: 'deep',
              },
              another: 'value',
            },
          },
          sibling: 'test',
        },
      });
    });

    it('should parse mixed arrays and objects', () => {
      const content = `---
items:
  - name: Item 1
    value: 100
  - name: Item 2
    value: 200
config:
  enabled: true
  options: [fast, secure, reliable]
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        items: [
          { name: 'Item 1', value: 100 },
          { name: 'Item 2', value: 200 },
        ],
        config: {
          enabled: true,
          options: ['fast', 'secure', 'reliable'],
        },
      });
    });

    it('should handle special values', () => {
      const content = `---
null_value: null
tilde_null: ~
empty_string: ""
space_string: " "
---
Content`;

      const result = parser.parse(content);

      expect(result.frontmatter).toEqual({
        null_value: null,
        tilde_null: null,
        empty_string: '',
        space_string: ' ',
      });
    });
  });

  describe('Performance', () => {
    it('should handle large documents efficiently', () => {
      // Generate a large frontmatter
      const entries = Array.from({ length: 1000 }, (_, i) => `key${i}: value${i}`).join('\n');
      const content = `---
${entries}
---
${'Content '.repeat(10000)}`;

      const start = Date.now();
      const result = parser.parse(content);
      const duration = Date.now() - start;

      expect(result.frontmatter).toBeDefined();
      if (result.frontmatter) {
        expect(Object.keys(result.frontmatter).length).toBe(1000);
      }
      expect(duration).toBeLessThan(100); // Should parse in under 100ms
    });
  });
});
