# Step 11: Basic Search Tool (context_search) Implementation Plan

## Objective
Implement a search tool that allows searching documents by tags, content, and metadata within the context management system.

## Key Requirements
1. Search by tags (exact match and partial match)
2. Search by content (case-insensitive substring search)
3. Search by document metadata (title, created date, etc.)
4. Support for compound queries (AND/OR operations)
5. Return results with relevance scoring
6. Strict TypeScript typing with no `any` types
7. Comprehensive error handling
8. Security validation (CONTEXT_ROOT boundaries)

## Implementation Components

### 1. Search Types and Interfaces
```typescript
interface SearchQuery {
  tags?: string[];          // Tags to match
  content?: string;         // Content substring search
  title?: string;           // Title search
  category?: PARACategory;  // Filter by PARA category
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  operator?: 'AND' | 'OR';  // How to combine criteria (default: AND)
}

interface SearchResult {
  path: string;             // Document path relative to CONTEXT_ROOT
  title: string;
  relevanceScore: number;   // 0-100 score
  snippet?: string;         // Content snippet with search term highlighted
  tags: string[];
  category: PARACategory;
  metadata: {
    created?: Date;
    modified?: Date;
  };
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: SearchQuery;
}
```

### 2. Search Engine Implementation
- Create `SearchEngine` class that:
  - Indexes documents on startup (in-memory for now)
  - Implements search algorithms
  - Calculates relevance scores
  - Handles query parsing and validation

### 3. Search Algorithm
- Tag matching: Exact and prefix matching
- Content search: Boyer-Moore or simple substring for now
- Relevance scoring:
  - Tag matches: +30 points per exact match, +15 per partial
  - Title matches: +25 points
  - Content matches: +10 points per occurrence (max 50)
  - Recent documents: slight boost based on modified date

### 4. MCP Tool Handler
- Create `context_search` tool handler that:
  - Accepts search parameters
  - Validates input
  - Executes search via SearchEngine
  - Returns formatted results

### 5. Testing Strategy
- Unit tests for:
  - Query parsing and validation
  - Individual search criteria (tags, content, etc.)
  - Relevance scoring algorithm
  - Security boundary checks
- Integration tests for:
  - Full search workflow
  - Multiple document scenarios
  - Edge cases (empty results, invalid queries)

## File Structure
```
code/mcp-server/src/
├── search/
│   ├── __tests__/
│   │   ├── SearchEngine.test.ts
│   │   ├── relevance.test.ts
│   │   └── query.test.ts
│   ├── SearchEngine.ts
│   ├── types.ts
│   ├── relevance.ts
│   └── index.ts
└── tools/
    ├── __tests__/
    │   └── context_search.test.ts
    └── context_search.ts
```

## Implementation Steps
1. Create search type definitions
2. Implement basic SearchEngine class structure
3. Add document indexing capability
4. Implement tag search functionality
5. Add content search capability
6. Implement relevance scoring
7. Create MCP tool handler
8. Write comprehensive tests
9. Add debug logging
10. Integrate with main server

## Success Criteria
- All tests pass
- No TypeScript errors or warnings
- Search returns relevant results quickly
- Proper error handling for edge cases
- Security boundaries enforced
- Clear debug logging for troubleshooting