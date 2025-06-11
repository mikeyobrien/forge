# Step 9: Document Reading Tool (context_read) - Implementation Plan

## Overview

Implement a tool to read and retrieve documents from the knowledge base, including their frontmatter, content, and metadata. This tool will be the foundation for accessing documents in the PARA structure.

## Requirements

### Functional Requirements

1. Read a document by its path relative to CONTEXT_ROOT
2. Parse and return frontmatter metadata
3. Return document content
4. Support reading documents from any PARA category
5. Handle non-existent files gracefully
6. Validate paths stay within CONTEXT_ROOT

### Input Parameters

- `path` (required): File path relative to CONTEXT_ROOT
- `include_content` (optional, default: true): Whether to include document content
- `include_metadata` (optional, default: true): Whether to include parsed frontmatter

### Output Format

```json
{
  "success": true,
  "document": {
    "id": "projects/website-redesign.md",
    "title": "Website Redesign",
    "content": "Document content here...",
    "frontmatter": {
      "title": "Website Redesign",
      "tags": ["web", "design"],
      "category": "projects",
      "created": "2024-01-15T10:00:00Z",
      "modified": "2024-01-15T10:00:00Z",
      "status": "active",
      "due_date": "2024-03-01"
    },
    "category": "projects",
    "exists": true
  }
}
```

### Error Handling

1. File not found: Return success=false with appropriate message
2. Invalid path: Return error for paths outside CONTEXT_ROOT
3. Parse errors: Return partial data with error details
4. Invalid arguments: Return validation errors

## Implementation Steps

### 1. Create Tool Structure

- Create directory: `src/tools/context-read/`
- Create main file: `src/tools/context-read/index.ts`
- Create test file: `src/tools/context-read/__tests__/index.test.ts`

### 2. Define Input Schema

```typescript
const contextReadArgsSchema = z.object({
  path: z.string().describe('File path relative to CONTEXT_ROOT'),
  include_content: z.boolean().optional().default(true),
  include_metadata: z.boolean().optional().default(true),
});
```

### 3. Define Result Interface

```typescript
interface ContextReadResult {
  success: boolean;
  document?: ReadDocument;
  message: string;
  error?: string;
}

interface ReadDocument {
  id: string;
  title: string;
  content?: string;
  frontmatter?: DocumentFrontmatter;
  category: PARACategory;
  exists: boolean;
}
```

### 4. Implement Handler Function

- Validate arguments using Zod schema
- Initialize FileSystem with CONTEXT_ROOT
- Normalize and validate file path
- Check if file exists
- Read file content
- Parse frontmatter using existing parser
- Extract document properties
- Return formatted result

### 5. Tool Registration

- Export tool definition for MCP
- Add to main index.ts tool list
- Add handler to switch statement

### 6. Testing Strategy

#### Unit Tests

1. **Success Cases**

   - Read existing document with full content
   - Read document without content (include_content=false)
   - Read document without metadata (include_metadata=false)
   - Read documents from different PARA categories

2. **Error Cases**

   - File not found
   - Invalid path (outside CONTEXT_ROOT)
   - Invalid arguments
   - Malformed frontmatter

3. **Edge Cases**
   - Empty document
   - Document without frontmatter
   - Document with only frontmatter
   - Special characters in path

#### Integration Tests

- Test with real file system
- Verify PARA category detection
- Test path normalization

### 7. Dependencies

- Existing modules to use:
  - `FileSystem` for file operations
  - `FrontmatterParser` for parsing YAML frontmatter
  - `PARAManager` for category detection
  - `DocumentFrontmatterSchema` for validation
  - Configuration system for CONTEXT_ROOT

### 8. Security Considerations

- Path traversal prevention (handled by FileSystem)
- Validate all paths stay within CONTEXT_ROOT
- No arbitrary code execution
- Safe error messages (don't expose system paths)

## Success Criteria

1. Tool successfully reads documents from all PARA categories
2. Frontmatter is correctly parsed and validated
3. Content is returned accurately
4. Error handling is comprehensive and user-friendly
5. All tests pass with 100% coverage
6. TypeScript strict mode compliance (no `any` types)
7. Follows existing code patterns and conventions

## Estimated Time

- Implementation: 2 hours
- Testing: 1 hour
- Integration and verification: 30 minutes
