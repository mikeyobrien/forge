# Step 10: Wiki-Link Parser Implementation Plan

## Overview

Implement a TypeScript parser for wiki-style `[[double bracket]]` links that will extract links from markdown content, support various link formats, and provide utilities for link manipulation.

## Requirements

1. **Parse wiki-style links**: Extract `[[Document Name]]` patterns from markdown
2. **Support link variations**:
   - Basic: `[[Document Name]]`
   - With display text: `[[Document Name|display text]]`
   - With anchors: `[[Document Name#section]]`
   - Combined: `[[Document Name#section|display text]]`
3. **TypeScript strict mode**: No `any` types, full type safety
4. **Performance**: Efficient parsing for large documents
5. **Edge cases**: Handle nested brackets, escaped brackets, code blocks

## Technical Design

### Module Structure

```
code/mcp-server/src/parser/
├── __tests__/
│   └── wiki-link.test.ts
├── wiki-link.ts         # Main parser implementation
└── index.ts            # Module exports
```

### Type Definitions

```typescript
interface WikiLink {
  raw: string; // Full raw link text including brackets
  target: string; // The document being linked to
  anchor?: string; // Optional section anchor
  displayText?: string; // Optional display text
  position: {
    start: number; // Start position in source
    end: number; // End position in source
  };
}

interface WikiLinkParserOptions {
  excludeCodeBlocks?: boolean; // Skip links in code blocks
  excludeInlineCode?: boolean; // Skip links in inline code
}
```

### Core Functions

1. **parseWikiLinks(content: string, options?: WikiLinkParserOptions): WikiLink[]**

   - Main parsing function
   - Returns array of all wiki links found

2. **extractLinkTarget(rawLink: string): { target: string; anchor?: string; displayText?: string }**

   - Parses individual link components
   - Handles all link format variations

3. **replaceWikiLink(content: string, oldLink: string, newLink: string): string**

   - Utility for updating links
   - Preserves formatting and position

4. **normalizeTarget(target: string): string**
   - Normalizes link targets for comparison
   - Handles case sensitivity and special characters

## Implementation Steps

1. **Create parser module structure**

   - Set up directory structure
   - Create index exports

2. **Implement core parser logic**

   - Regular expression for link detection
   - Handle nested and escaped brackets
   - Extract link components

3. **Add code block detection**

   - Skip links in fenced code blocks
   - Skip links in inline code

4. **Implement utility functions**

   - Link replacement
   - Target normalization
   - Link validation

5. **Write comprehensive tests**
   - Basic link parsing
   - All format variations
   - Edge cases and errors
   - Performance tests

## Test Cases

### Basic Parsing

- Single link: `[[Document]]`
- Multiple links in content
- Links with special characters

### Format Variations

- Display text: `[[Document|shown text]]`
- Anchors: `[[Document#section]]`
- Combined: `[[Document#section|text]]`

### Edge Cases

- Nested brackets: `[[Doc with ] bracket]]`
- Escaped brackets: `\[[Not a link]]`
- Links in code blocks
- Links in inline code
- Adjacent links: `[[Link1]][[Link2]]`
- Malformed links: `[[Unclosed link`

### Performance

- Large documents (1000+ links)
- Memory efficiency
- Parse time benchmarks

## Integration Points

1. **Document Model**: Links will be stored in Document.links array
2. **Search Tool**: Enable searching by linked documents
3. **Update Tool**: Maintain link integrity during updates
4. **Graph Builder**: Use parsed links for relationship mapping

## Success Criteria

1. All test cases pass
2. Zero TypeScript errors with strict mode
3. Performance: Parse 1000 links in < 100ms
4. 100% test coverage
5. Clean lint checks

## Dependencies

- No external dependencies (pure TypeScript implementation)
- Uses only Node.js built-in modules if needed
