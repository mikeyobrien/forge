# Step 8: Document Creation Tool (context_create) - Implementation Plan

## Overview

Implement the `context_create` tool for the MCP server that allows creation of markdown documents with structured frontmatter within the CONTEXT_ROOT directory structure. This tool will leverage the existing PARA structure management and frontmatter parsing capabilities.

## Requirements

### Functional Requirements

1. **Tool Definition**

   - Name: `context_create`
   - Description: "Create a new document in the context root"
   - Required parameters:
     - `path`: Relative path within CONTEXT_ROOT
     - `title`: Document title
     - `content`: Main content (optional, defaults to empty)
   - Optional parameters:
     - `tags`: Array of tags
     - `category`: PARA category (project/area/resource/archive)
     - `frontmatter`: Additional frontmatter fields

2. **Document Creation Logic**

   - Validate path is within CONTEXT_ROOT
   - Auto-determine PARA category from path if not specified
   - Generate frontmatter with:
     - `id`: Auto-generated UUID
     - `title`: From parameter
     - `created`: Current timestamp
     - `updated`: Current timestamp
     - `tags`: From parameter or empty array
     - Additional fields from frontmatter parameter
   - Create parent directories if needed
   - Write document with frontmatter and content

3. **Security & Validation**

   - Path must be within CONTEXT_ROOT
   - No path traversal allowed
   - File must not already exist
   - Valid PARA category if specified
   - Valid frontmatter structure

4. **Response Format**
   - Success: Return created document metadata
   - Failure: Return appropriate error message

### Technical Requirements

1. **TypeScript Implementation**

   - Strict mode, no `any` types
   - Full type safety for parameters and responses
   - Leverage existing types from Document model

2. **Integration Points**

   - Use `FileSystem` abstraction for file operations
   - Use `PARAManager` for structure management
   - Use `FrontmatterParser` for generating frontmatter
   - Follow MCP SDK patterns from ping tool

3. **Error Handling**
   - Graceful handling of file system errors
   - Clear error messages for validation failures
   - Atomic operations (no partial writes)

## Implementation Steps

### 1. Create Tool Module Structure

```
code/mcp-server/src/tools/context-create/
├── index.ts              # Main tool implementation
├── types.ts              # Tool-specific types
├── validator.ts          # Parameter validation
└── __tests__/
    ├── index.test.ts     # Integration tests
    └── validator.test.ts # Validation tests
```

### 2. Define Types (types.ts)

```typescript
interface ContextCreateParams {
  path: string;
  title: string;
  content?: string;
  tags?: string[];
  category?: PARACategory;
  frontmatter?: Record<string, unknown>;
}

interface ContextCreateResponse {
  id: string;
  path: string;
  title: string;
  created: string;
  category: PARACategory;
}
```

### 3. Implement Validator (validator.ts)

- Validate required parameters
- Check path safety
- Validate PARA category
- Validate frontmatter structure

### 4. Implement Tool Logic (index.ts)

- Parse and validate parameters
- Determine PARA category from path
- Generate document ID and timestamps
- Build frontmatter object
- Create document using FileSystem
- Return success response

### 5. Write Comprehensive Tests

- Unit tests for validation logic
- Integration tests for full tool flow
- Edge cases:
  - Path traversal attempts
  - Existing file conflicts
  - Invalid frontmatter
  - File system errors
  - Unicode in paths/content

### 6. Update Server Registration

- Add tool to MCP server configuration
- Update tool list in server startup

## Testing Strategy

### Unit Tests

1. Parameter validation
   - Required fields
   - Path safety
   - Category validation
2. Frontmatter generation
   - Required fields present
   - Custom fields merged
   - Valid YAML structure

### Integration Tests

1. Full document creation flow
2. PARA category inference
3. Directory creation
4. Error scenarios
5. Security boundaries

### Self-Verification Tests

Create `tests/claude/test-context-create.sh`:

```bash
#!/bin/bash
# Test basic document creation
claude -p "Use context_create to create a test document"

# Test with tags and category
claude -p "Create a document in projects with tags"

# Test security boundaries
claude -p "Try to create a document outside CONTEXT_ROOT"
```

## Success Criteria

1. Tool successfully creates documents with proper frontmatter
2. All tests pass with 100% coverage
3. Proper error handling for all edge cases
4. Seamless integration with existing components
5. Claude can use the tool via headless execution
6. No security vulnerabilities

## Dependencies

- Existing components:
  - Document model and types
  - FileSystem abstraction
  - PARAManager
  - FrontmatterParser
  - Environment configuration

## Timeline

- Type definitions: 30 minutes
- Validation logic: 45 minutes
- Main implementation: 1 hour
- Test writing: 1.5 hours
- Integration and debugging: 1 hour
- Total estimate: 4.75 hours
