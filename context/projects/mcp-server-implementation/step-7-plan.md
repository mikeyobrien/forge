# Step 7: Frontmatter Parser with TypeScript - Implementation Plan

## Overview

Implement a robust TypeScript-based frontmatter parser that can extract and parse YAML frontmatter from markdown documents. This parser will be a core component for document metadata management in our MCP server.

## Requirements

### Functional Requirements

1. Parse YAML frontmatter from markdown documents
2. Support standard frontmatter delimiters (---)
3. Handle various YAML data types (strings, numbers, booleans, arrays, objects)
4. Provide type-safe parsing with Zod schemas
5. Return both parsed frontmatter and remaining content
6. Handle documents without frontmatter gracefully

### Non-Functional Requirements

1. Zero `any` types - full TypeScript type safety
2. Comprehensive error handling with descriptive messages
3. High performance for large documents
4. 100% test coverage
5. Support for custom validation schemas

## Architecture

### File Structure

```
code/mcp-server/src/
├── parsers/
│   ├── __tests__/
│   │   └── frontmatter.test.ts
│   ├── frontmatter.ts         # Main parser implementation
│   └── index.ts              # Export barrel
```

### Key Components

1. **FrontmatterParser Class**

   - `parse(content: string): ParseResult`
   - `parseWithSchema<T>(content: string, schema: ZodSchema<T>): TypedParseResult<T>`
   - Private methods for delimiter detection and YAML parsing

2. **Types and Interfaces**

   ```typescript
   interface ParseResult {
     frontmatter: Record<string, unknown> | null;
     content: string;
     raw: {
       frontmatterText: string | null;
       startLine: number;
       endLine: number;
     };
   }

   interface TypedParseResult<T> extends Omit<ParseResult, 'frontmatter'> {
     frontmatter: T | null;
   }

   interface ParserOptions {
     strict?: boolean; // Fail on invalid YAML vs return null
     delimiter?: string; // Custom delimiter (default: '---')
   }
   ```

3. **Error Handling**
   - Custom error classes: `FrontmatterParseError`, `FrontmatterValidationError`
   - Detailed error messages with line numbers
   - Recovery strategies for malformed YAML

## Implementation Steps

### Phase 1: Core Parser

1. Create parser class structure with options
2. Implement delimiter detection logic
3. Add YAML extraction and parsing
4. Handle edge cases (no frontmatter, empty docs, etc.)

### Phase 2: Type Safety

1. Integrate with existing Document types from Step 4
2. Add Zod schema validation support
3. Create type guards for common frontmatter fields
4. Implement generic typed parsing method

### Phase 3: Error Handling

1. Create custom error classes
2. Add line number tracking for errors
3. Implement graceful degradation for invalid YAML
4. Add detailed error messages

### Phase 4: Testing

1. Unit tests for core parsing functionality
2. Edge case tests (malformed YAML, missing delimiters)
3. Type validation tests with Zod schemas
4. Performance tests with large documents
5. Integration tests with Document model

## Test Cases

### Core Functionality

- Parse valid frontmatter with various data types
- Handle documents without frontmatter
- Parse frontmatter with custom delimiters
- Extract correct content after frontmatter

### Edge Cases

- Empty documents
- Only frontmatter, no content
- Malformed YAML syntax
- Unclosed frontmatter blocks
- Multiple frontmatter blocks (should only parse first)
- Non-standard line endings (CRLF vs LF)

### Type Safety

- Validate against Document schema
- Custom schema validation
- Type inference for parsed data
- Handle validation errors gracefully

### Performance

- Large documents (>10MB)
- Documents with complex nested YAML
- Benchmark against common alternatives

## Integration Points

1. **Document Model** - Parser output should match Document interface
2. **File System Layer** - Parser will be used when reading documents
3. **Search Tool** - Frontmatter fields used for filtering
4. **Create/Update Tools** - Validate frontmatter on write operations

## Success Criteria

1. All tests pass with 100% coverage
2. No TypeScript errors or warnings
3. Performance: Parse 1MB document in <50ms
4. Clear, actionable error messages
5. Seamless integration with existing types
6. Pre-commit hooks pass (ESLint, Prettier)

## Dependencies

- No external YAML libraries (implement from scratch per project rules)
- Use existing Zod schemas from Step 4
- Leverage TypeScript's built-in type system

## Security Considerations

1. Prevent YAML bombs (excessive nesting/expansion)
2. Sanitize parsed values to prevent injection
3. Limit maximum frontmatter size
4. Validate all parsed data against schemas
