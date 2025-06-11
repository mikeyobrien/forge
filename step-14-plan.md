# Step 14: Link Queries Tool (context_query_links) Implementation Plan

## Overview

Implement a tool that allows querying for forward links (documents this document links to) and backlinks (documents that link to this document). This builds on the wiki-link parser from Step 10 and the backlink tracking system from Step 13.

## Objectives

1. Create a link indexing system that tracks all document relationships
2. Implement efficient bidirectional link queries
3. Support multiple query types (forward links, backlinks, orphaned documents, etc.)
4. Integrate with the MCP server as `context_query_links` tool

## Technical Approach

### 1. Link Index Architecture

```typescript
interface LinkIndex {
  // Map from document path to its outgoing links
  forwardLinks: Map<string, Set<string>>;

  // Map from document path to documents linking to it
  backlinks: Map<string, Set<string>>;

  // Cache of parsed documents to avoid re-parsing
  documentCache: Map<string, ParsedDocument>;
}
```

### 2. Link Query Types

```typescript
enum LinkQueryType {
  FORWARD = 'forward', // Links from a document
  BACKLINKS = 'backlinks', // Links to a document
  ORPHANED = 'orphaned', // Documents with no backlinks
  BROKEN = 'broken', // Links to non-existent documents
  ALL = 'all', // All link information
}

interface LinkQueryResult {
  document: string;
  forward_links: string[];
  backlinks: string[];
  broken_links?: string[];
  metadata?: DocumentMetadata;
}
```

### 3. Implementation Components

#### A. LinkIndexer Class

- Scan all documents in CONTEXT_ROOT
- Parse wiki-links from document content
- Build bidirectional link graph
- Handle document updates/deletions
- Cache parsed results for performance

#### B. LinkResolver Class

- Resolve relative links to absolute paths
- Handle different link formats (with/without extensions)
- Validate link targets exist
- Support anchor links (#heading)

#### C. Tool Handler

- Accept query parameters (path, type, include_metadata)
- Validate permissions and paths
- Return structured link information
- Support batch queries for efficiency

### 4. Performance Considerations

- Lazy indexing: Build index on first query
- Incremental updates: Update only affected links on document changes
- Memory-efficient storage using Sets
- Parallel document parsing for initial index build

### 5. Testing Strategy

#### Unit Tests

- LinkIndexer: Index building, updates, deletions
- LinkResolver: Path resolution, validation
- Wiki-link parsing edge cases
- Cache invalidation logic

#### Integration Tests

- Full document graph traversal
- Orphaned document detection
- Broken link identification
- Performance with large document sets

#### MCP Integration Tests

- Tool registration and schema validation
- Permission handling
- Error scenarios
- Response format compliance

## Implementation Steps

1. **Create Link Index Infrastructure**

   - Define interfaces and types
   - Implement LinkIndex class with storage
   - Add document parsing and caching

2. **Implement Link Resolution**

   - Create LinkResolver for path normalization
   - Handle relative and absolute paths
   - Support wiki-link formats

3. **Build Link Indexer**

   - Scan documents and extract links
   - Build forward and backward link maps
   - Implement incremental updates

4. **Create Tool Handler**

   - Define tool schema for MCP
   - Implement query parameter validation
   - Format responses according to spec

5. **Add Advanced Features**

   - Orphaned document detection
   - Broken link identification
   - Link statistics and metrics

6. **Optimize Performance**
   - Implement caching strategy
   - Add parallel processing
   - Memory usage optimization

## Expected Outcomes

- Efficient bidirectional link queries
- Support for complex link analysis
- Integration with existing MCP server
- Comprehensive test coverage
- Performance suitable for large document collections

## Dependencies

- Wiki-link parser from Step 10
- FileSystem abstraction from Step 5
- PARAManager for document categorization
- SearchEngine for document metadata

## Success Criteria

1. All link queries return accurate results
2. Performance: <100ms for typical queries
3. Memory usage scales linearly with document count
4. 100% test coverage for core functionality
5. Seamless MCP integration
