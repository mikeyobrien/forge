# Step 15: Document Updates Tool (context_update) - Implementation Plan

## Overview

Implement a tool that allows updating existing documents in the knowledge base while preserving their relationships, metadata, and link integrity. This tool is crucial for maintaining and evolving the knowledge base over time.

## Requirements

### Core Functionality

1. **Update document content** - Replace or modify the body text
2. **Update frontmatter metadata** - Modify tags, status, due dates, etc.
3. **Preserve wiki-links** - Maintain all existing [[wiki-links]] during updates
4. **Atomic operations** - Ensure updates either fully succeed or fully fail
5. **Validation** - Verify document exists and update is valid before applying

### Input Parameters

- `path` (required): The document path relative to CONTEXT_ROOT
- `content` (optional): New content for the document body
- `metadata` (optional): Object containing frontmatter updates to merge
- `replace_content` (optional, default: false): Whether to replace or append content
- `preserve_links` (optional, default: true): Whether to preserve existing wiki-links

### Security Considerations

- Verify path stays within CONTEXT_ROOT
- Prevent directory traversal attacks
- Validate metadata types match expected schemas
- Ensure atomic file operations

## Implementation Steps

### 1. Create Update Interfaces

```typescript
interface UpdateDocumentParams {
  path: string;
  content?: string;
  metadata?: Partial<DocumentMetadata>;
  replace_content?: boolean;
  preserve_links?: boolean;
}

interface UpdateResult {
  success: boolean;
  document: Document;
  changes: {
    content_updated: boolean;
    metadata_updated: boolean;
    links_preserved: number;
  };
}
```

### 2. Implement Document Updater Class

- Create `DocumentUpdater` class that handles update logic
- Methods:
  - `updateDocument(params: UpdateDocumentParams): Promise<UpdateResult>`
  - `preserveWikiLinks(oldContent: string, newContent: string): string`
  - `mergeMetadata(existing: DocumentMetadata, updates: Partial<DocumentMetadata>): DocumentMetadata`
  - `validateUpdate(document: Document, params: UpdateDocumentParams): void`

### 3. Link Preservation Logic

- Extract all wiki-links from existing content
- If replacing content, optionally append preserved links at the end
- If appending content, ensure no duplicate links
- Track number of links preserved for reporting

### 4. Metadata Merging Strategy

- Deep merge for nested objects
- Array handling: replace or append based on field semantics
- Preserve required fields (title, created_at)
- Validate updated metadata against schemas

### 5. Create MCP Tool Handler

- Implement `context_update` tool with proper schema
- Add to server tool registry
- Handle errors gracefully with meaningful messages
- Return comprehensive update results

### 6. Testing Strategy

#### Unit Tests

- Test metadata merging with various scenarios
- Test link preservation logic
- Test content replacement vs appending
- Test validation for invalid updates
- Test atomic operation handling

#### Integration Tests

- Test updating documents across PARA categories
- Test concurrent update handling
- Test large document updates
- Test error recovery scenarios

#### Edge Cases

- Updating non-existent documents
- Empty updates (no content or metadata)
- Invalid metadata types
- Circular link references
- File system errors during update

### 7. Error Handling

- Document not found
- Invalid path (outside CONTEXT_ROOT)
- Invalid metadata structure
- File system write failures
- Concurrent modification detection

## Expected Outcomes

1. **Functional Tool**: A working `context_update` tool integrated with MCP server
2. **Preserved Integrity**: All wiki-links and relationships maintained
3. **Atomic Updates**: No partial updates or corrupted documents
4. **Comprehensive Tests**: >90% code coverage with edge cases
5. **Type Safety**: Full TypeScript strict mode compliance

## File Structure

```
src/
├── tools/
│   └── context-update/
│       ├── index.ts          # Tool handler
│       └── __tests__/
│           └── index.test.ts
├── updater/
│   ├── DocumentUpdater.ts    # Core update logic
│   ├── index.ts
│   ├── types.ts              # Update-specific types
│   └── __tests__/
│       ├── DocumentUpdater.test.ts
│       └── link-preservation.test.ts
```

## Success Criteria

- [ ] Tool successfully updates document content
- [ ] Tool successfully updates metadata
- [ ] Wiki-links are preserved during updates
- [ ] Atomic operations prevent partial updates
- [ ] All tests pass with >90% coverage
- [ ] TypeScript strict mode compliance
- [ ] Pre-commit hooks pass
- [ ] Tool is registered and callable via MCP

## Dependencies

- Existing: FileSystem, PARAManager, frontmatter parser, wiki-link parser
- New: DocumentUpdater class, update validation logic

## Timeline

Estimated: 3-4 hours

- 30 min: Create interfaces and types
- 1 hour: Implement DocumentUpdater class
- 1 hour: Create MCP tool handler
- 1.5 hours: Write comprehensive tests
- 30 min: Integration and verification
