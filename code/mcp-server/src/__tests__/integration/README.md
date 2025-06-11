# Integration Tests

This directory contains comprehensive integration tests for the MCP Context Manager, validating that all components work correctly together.

## Test Organization

### Phase 2 Tests (`phase2/`)

These tests validate the integration of features implemented in Phase 3 of the project:

1. **document-lifecycle.test.ts** - Complete document workflow testing
   - Document creation, reading, updating, and deletion
   - Link preservation during updates
   - Search index consistency
   - Backlink tracking

2. **link-graph-integrity.test.ts** - Link relationship validation
   - Complex link networks
   - Circular reference handling
   - Broken link detection
   - Link updates during document moves

3. **search-relationships.test.ts** - Search and link integration
   - Combined search and link queries
   - Faceted search capabilities
   - Similar document detection
   - Complex query performance

4. **concurrent-operations.test.ts** - Concurrent operation safety
   - Parallel document updates
   - Atomic operations
   - Race condition prevention
   - Index consistency

5. **error-recovery.test.ts** - Error handling and recovery
   - Corrupted document handling
   - Missing file recovery
   - Circular reference safety
   - Large document handling

6. **performance-scale.test.ts** - Performance at scale
   - 1000+ document handling
   - Deep hierarchy traversal
   - High-frequency updates
   - Complex query scaling

### Test Infrastructure (`helpers/`)

Reusable test utilities:

- **IntegrationTestHarness** - Main test execution framework
- **IntegrationAssertions** - Specialized assertion helpers
- **TestDataGenerator** - Realistic test data generation

## Running Integration Tests

```bash
# Run all integration tests
npm test -- src/__tests__/integration/

# Run specific test suite
npm test -- src/__tests__/integration/phase2/document-lifecycle.test.ts

# Run with coverage
npm test -- --coverage src/__tests__/integration/

# Run performance tests only (longer timeout)
npm test -- --testTimeout=120000 performance-scale.test.ts
```

## Test Scenarios

Each test file contains multiple scenarios testing different aspects:

### Document Lifecycle
- Complete workflow with link preservation
- Document deletion and broken link handling
- Concurrent update consistency
- Large network performance

### Link Graph
- Hub-and-spoke networks
- Circular references
- Broken link detection
- Document movement

### Search Integration
- Link-aware searching
- Faceted results
- Similar documents
- Complex queries

### Concurrent Operations
- Parallel updates
- Atomic operations
- Search index updates
- Race condition prevention

### Error Recovery
- Corrupted frontmatter
- Missing documents
- File system errors
- Large documents

### Performance
- 1000+ documents
- Deep hierarchies
- Burst updates
- Query complexity

## Performance Targets

The tests validate these performance benchmarks:

- Document create: < 50ms
- Document update: < 100ms
- Document read: < 20ms
- Simple search: < 100ms (1000 docs)
- Complex search: < 200ms (1000 docs)
- Link query: < 50ms
- Memory usage: < 200MB (1000 docs)

## Test Data Generation

The TestDataGenerator creates realistic document networks:

```typescript
// Generate 100 documents with 30% link density
const docs = generator.generateDocumentNetwork(100, 0.3);

// Generate specific link patterns
const patterns = generator.generateLinkPatterns();

// Generate searchable content
const content = generator.generateSearchableContent(['keyword1', 'keyword2']);
```

## Writing New Integration Tests

1. Create a new test file in the appropriate phase directory
2. Use IntegrationTestHarness for test setup/teardown
3. Define scenarios with setup, execute, and verify phases
4. Use IntegrationAssertions for validation
5. Include performance measurements where relevant

Example:

```typescript
const result = await harness.executeScenario({
  name: 'Test Scenario Name',
  
  setup: async () => {
    // Create test documents
    return generator.generateDocumentNetwork(10, 0.3);
  },
  
  execute: async (context) => {
    // Perform operations
    await context.searchEngine.search({ content: 'test' });
  },
  
  verify: async (context) => {
    // Assert results
    expect(context.documents.size).toBe(10);
  }
});
```

## CI/CD Integration

These tests are designed to run in CI pipelines:

- Isolated test environments (no shared state)
- Automatic cleanup after each test
- Performance metrics collection
- Detailed failure reporting

## Debugging

Enable debug logging:

```bash
DEBUG=mcp:* npm test -- src/__tests__/integration/
```

Run a single test with verbose output:

```bash
npm test -- --verbose document-lifecycle.test.ts
```