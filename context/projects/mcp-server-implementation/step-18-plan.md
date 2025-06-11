# Step 18: Document Movement Tool (context_move)

## Overview

Implement a document movement tool that safely moves documents between PARA categories while maintaining referential integrity. All incoming links to the moved document must be updated to point to the new location.

## Requirements

1. **Tool Definition**

   - Name: `context_move`
   - Purpose: Move documents between PARA categories or within categories
   - Must update all wiki-links pointing to the moved document

2. **Core Functionality**

   - Move document from source path to destination path
   - Update the document's category in metadata if moving between PARA categories
   - Find all documents that link to the moved document
   - Update those links to point to the new location
   - Ensure atomic operation (all-or-nothing)

3. **Type Safety**

   - Full TypeScript implementation with strict mode
   - No `any` types allowed
   - Proper error types for various failure scenarios

4. **Input Schema**

   ```typescript
   {
     sourcePath: string; // Current document path
     destinationPath: string; // New document path (can be just filename)
     updateLinks: boolean; // Whether to update incoming links (default: true)
   }
   ```

5. **Security**

   - Both source and destination must be within CONTEXT_ROOT
   - Validate paths to prevent directory traversal
   - Check permissions before moving

6. **Link Updates**

   - Use BacklinkManager to find all documents linking to source
   - Parse each linking document to find wiki-links
   - Replace old path with new path in wiki-links
   - Preserve link display text if present

7. **Error Handling**
   - Source document not found
   - Destination already exists
   - Invalid PARA category
   - Link update failures
   - Filesystem errors

## Implementation Tasks

### 1. Create DocumentMover Class

```typescript
// src/mover/DocumentMover.ts
interface MoveOptions {
  updateLinks?: boolean;
  overwrite?: boolean;
}

interface MoveResult {
  oldPath: string;
  newPath: string;
  updatedLinks: Array<{
    documentPath: string;
    linksUpdated: number;
  }>;
}

class DocumentMover {
  constructor(
    private fs: IFileSystem,
    private para: PARAManager,
    private backlinks: BacklinkManager,
    private updater: DocumentUpdater,
  ) {}

  async moveDocument(
    sourcePath: string,
    destinationPath: string,
    options: MoveOptions = {},
  ): Promise<MoveResult> {
    // Implementation
  }
}
```

### 2. Path Resolution Logic

- If destination is just a filename, determine category from source
- If destination includes category, validate it's a valid PARA category
- Handle both relative and absolute paths within CONTEXT_ROOT

### 3. Link Update Algorithm

```typescript
private async updateIncomingLinks(
  oldPath: string,
  newPath: string
): Promise<UpdatedLink[]> {
  // 1. Get all backlinks to the old path
  // 2. For each backlinking document:
  //    - Read the document
  //    - Find all wiki-links matching old path
  //    - Replace with new path
  //    - Save the updated document
  // 3. Return summary of updates
}
```

### 4. Atomic Operation Pattern

```typescript
private async executeAtomicMove(
  source: string,
  destination: string,
  linkUpdates: LinkUpdate[]
): Promise<void> {
  // 1. Create backup of source document
  // 2. Try to move document
  // 3. Try to update all links
  // 4. If any step fails, rollback everything
  // 5. Clean up backup on success
}
```

### 5. MCP Tool Implementation

```typescript
// src/tools/context-move/index.ts
const moveInputSchema = z.object({
  sourcePath: z.string(),
  destinationPath: z.string(),
  updateLinks: z.boolean().default(true),
});

export const contextMoveToolDefinition = {
  name: 'context_move',
  description: 'Move a document to a new location, optionally updating all incoming links',
  inputSchema: moveInputSchema,
  handler: async (input: MoveInput): Promise<MoveResult> => {
    // Implementation using DocumentMover
  },
};
```

## Test Cases

### Unit Tests

1. **Path Validation**

   - Valid source and destination paths
   - Paths outside CONTEXT_ROOT
   - Non-existent source
   - Existing destination

2. **Category Moves**

   - Projects → Areas
   - Resources → Archives
   - Within same category
   - Invalid category names

3. **Link Updates**

   - Simple wiki-links: `[[old-path]]` → `[[new-path]]`
   - Links with display text: `[[old-path|Display]]` → `[[new-path|Display]]`
   - Multiple links in same document
   - No incoming links

4. **Error Scenarios**
   - Source not found
   - Destination exists
   - Permission denied
   - Link update failure
   - Partial failure rollback

### Integration Tests

1. **Full Move Flow**

   - Create document with links
   - Create documents linking to it
   - Move document
   - Verify all links updated
   - Verify backlink index updated

2. **Cross-Category Move**

   - Move from Projects to Archives
   - Verify metadata updated
   - Verify PARA structure maintained

3. **Atomic Operation**
   - Simulate failure during link updates
   - Verify complete rollback
   - Verify no partial state

## Implementation Order

1. Create `DocumentMover` class with basic move functionality
2. Add path validation and resolution
3. Implement link update logic
4. Add atomic operation wrapper
5. Create MCP tool handler
6. Write comprehensive tests
7. Add integration with existing systems

## Success Criteria

- [ ] Document can be moved between PARA categories
- [ ] All incoming wiki-links are updated automatically
- [ ] Operation is atomic (all-or-nothing)
- [ ] Proper TypeScript types throughout
- [ ] Comprehensive error handling
- [ ] 100% test coverage
- [ ] Integration with BacklinkManager
- [ ] Security boundaries enforced
