# TDD Implementation Plan for Documentation & Journaling System

## Overview
This plan breaks down the implementation of the MCP-based documentation system into small, testable increments. Each step builds on the previous one, ensuring continuous integration and avoiding orphaned code. The system uses the latest @modelcontextprotocol/sdk patterns and respects the CONTEXT_ROOT environment variable for document storage.

**Language**: TypeScript (strict mode) - all implementation MUST be in TypeScript with proper type safety.

## Architecture Decisions

### Environment Variables
- `CONTEXT_ROOT`: Base directory for all document storage (required)
- `LOG_LEVEL`: Logging verbosity (optional, defaults to 'info')
- `PORT`: Server port for HTTP transport (optional, defaults to 3000)
- `NODE_ENV`: Environment mode (optional, defaults to 'production')

### SDK Patterns (2024-2025)
- Use latest @modelcontextprotocol/sdk with ES modules
- Import paths must include .js extension
- Support both stdio and StreamableHttp transports
- Proper TypeScript configuration with module resolution

## High-Level Phases

### Phase 1: Foundation (Steps 1-6)
- TypeScript project setup with pre-commit hooks
- Environment configuration with CONTEXT_ROOT
- Document model and validation
- File system operations

### Phase 2: Core Operations (Steps 7-11)
- PARA structure management
- Create and read operations
- Frontmatter parsing and validation

### Phase 3: Search & Relationships (Steps 12-16)
- Wiki-link parsing
- Search functionality
- Relationship tracking

### Phase 4: Advanced Features (Steps 17-21)
- Update operations
- Move operations between PARA categories
- Knowledge graph export

## Detailed Step-by-Step Implementation

### Step 1: TypeScript Project Setup with Pre-commit Hooks
- Initialize TypeScript project at `code/mcp/`
- Configure strict TypeScript settings
- Set up ESLint with TypeScript plugin
- Configure Prettier for consistent formatting
- Install husky and lint-staged for pre-commit hooks
- Configure pre-commit to run: typecheck, lint, format, tests
- Ensure all code quality checks pass before commits

### Step 2: MCP SDK Integration with TypeScript
- Install @modelcontextprotocol/sdk with TypeScript types
- Configure for ES modules with .js imports
- Create basic MCP server structure with proper types
- Set up Jest with ts-jest for TypeScript testing
- Add minimal "ping" tool with full type safety
- Verify TypeScript compilation and type checking

### Step 3: Environment Configuration System
- Create typed environment configuration
- Validate CONTEXT_ROOT exists and is writable
- Support .env files for development
- Create configuration schema with TypeScript interfaces
- Add environment validation on startup
- Unit test configuration loading with type safety

### Step 4: Document Model and Types
- Define TypeScript interfaces for Document
- Create frontmatter schema types with strict typing
- Implement validation functions with proper return types
- Add type guards for optional fields
- Use Zod for runtime validation with TypeScript integration
- Unit test all type validations

### Step 5: File System Abstraction Layer
- Create FileSystem interface with TypeScript
- Implement with CONTEXT_ROOT base path
- Add typed path utilities for safe operations
- Ensure all paths are within CONTEXT_ROOT
- Create typed mock for testing
- Handle cross-platform path issues with types

### Step 6: PARA Structure Management
- Implement PARA folder creation under CONTEXT_ROOT
- Create typed path resolver for document locations
- Add category validation with TypeScript enums
- Ensure proper folder initialization
- Test edge cases for invalid paths
- Verify CONTEXT_ROOT isolation

### Step 7: Frontmatter Parser with TypeScript
- Implement YAML frontmatter extraction with types
- Create frontmatter serialization with type safety
- Handle malformed frontmatter gracefully
- Preserve document content during parsing
- Test various frontmatter formats
- Support both Windows and Unix line endings

### Step 8: Document Creation Tool (context_create)
- Implement context_create MCP tool with Zod schema
- Use CONTEXT_ROOT for storage location
- Validate required frontmatter fields with types
- Generate timestamps automatically
- Place documents in correct PARA folder
- Return typed document metadata

### Step 9: Document Reading Tool (context_read)
- Implement context_read MCP tool with types
- Resolve paths relative to CONTEXT_ROOT
- Parse frontmatter and content with type safety
- Handle missing documents gracefully
- Return structured Document objects
- Support both absolute and relative paths

### Step 10: Wiki-Link Parser with TypeScript
- Extract [[wiki-links]] with typed results
- Handle nested and escaped brackets
- Create link normalization rules with types
- Build typed link index data structure
- Support [[Link|Display]] format
- Unit test link extraction edge cases

### Step 11: Basic Search Tool (context_search)
- Implement tag-based search with typed queries
- Add content search within CONTEXT_ROOT
- Create typed search result ranking
- Handle empty/invalid queries with types
- Limit search to CONTEXT_ROOT
- Test search performance

### Step 12: Integration Testing Phase 1
- Set up test CONTEXT_ROOT directory
- Test complete create->read->search flow
- Verify PARA structure maintained
- Ensure CONTEXT_ROOT isolation
- Create typed test fixtures
- Benchmark performance baseline

### Step 13: Backlink Tracking System
- Build reverse link index with TypeScript types
- Update index on document operations
- Handle link updates efficiently
- Store backlinks per document with types
- Test circular link scenarios
- Ensure index consistency

### Step 14: Link Queries Tool (context_query_links)
- Implement context_query_links with typed inputs
- Find documents linking to target
- Get all links from document with types
- Build link graph traversal
- Respect CONTEXT_ROOT boundaries
- Test deep link chains

### Step 15: Document Updates Tool (context_update)
- Implement context_update with typed operations
- Preserve frontmatter structure with types
- Update link indexes on change
- Validate within CONTEXT_ROOT
- Handle concurrent updates with type safety
- Test partial updates

### Step 16: Advanced Search Features
- Add date range filtering with types
- Implement status-based search with enums
- Create compound queries with typed operators
- Add search result pagination with types
- Keep searches within CONTEXT_ROOT
- Performance test with large datasets

### Step 17: Integration Testing Phase 2
- Test update->search->query flow
- Verify link integrity after updates
- Stress test with many documents
- Ensure index consistency
- Verify CONTEXT_ROOT isolation
- Profile memory usage

### Step 18: Document Movement Tool (context_move)
- Implement context_move with typed parameters
- Update all link references with type safety
- Keep within CONTEXT_ROOT
- Handle cross-category moves with types
- Test invalid move operations
- Ensure atomic operations

### Step 19: Knowledge Graph Builder
- Create typed graph data structure
- Build from link indexes with TypeScript
- Add typed node/edge metadata
- Implement graph algorithms with types
- Scope to CONTEXT_ROOT documents
- Test cyclic graph handling

### Step 20: Graph Export Tool (context_graph)
- Implement context_graph with typed formats
- Export to JSON with TypeScript interfaces
- Add GraphML support with types
- Include typed relationship metadata
- Filter by CONTEXT_ROOT scope
- Test large graph exports

### Step 21: Template System with TypeScript
- Create typed document templates
- Store in CONTEXT_ROOT/templates
- Add typed template variables
- Implement template selection with types
- Build default templates with TypeScript
- Test template inheritance

### Step 22: Final Integration and Polish
- Complete MCP server with all tools typed
- Validate CONTEXT_ROOT on startup
- Add StreamableHttp transport with types
- Implement graceful shutdown
- Create deployment documentation
- Full system integration tests

## Testing Strategy

### Unit Tests
- Written in TypeScript with full type coverage
- Each function tested with typed inputs/outputs
- Mock file system with typed CONTEXT_ROOT
- Test edge cases with proper types
- Maintain >90% coverage

### Integration Tests
- TypeScript tests with typed assertions
- Use temporary CONTEXT_ROOT directories
- Test tool interactions with types
- Verify file system changes
- Check data consistency with types

### End-to-End Tests
- Full workflow scenarios in TypeScript
- Performance benchmarks with typed metrics
- Stress testing with typed thresholds
- CONTEXT_ROOT isolation verification

## TypeScript Configuration

### tsconfig.json Requirements
- `"strict": true` - enable all strict type checking
- `"noImplicitAny": true` - no implicit any types
- `"strictNullChecks": true` - explicit null handling
- `"esModuleInterop": true` - proper module interop
- `"target": "ES2022"` - modern JavaScript features
- `"module": "ESNext"` - ES modules
- `"moduleResolution": "node"` - Node resolution

### Code Quality Tools
- ESLint with @typescript-eslint plugin
- Prettier for consistent formatting
- ts-prune for unused exports
- TypeScript compiler for type checking

## Implementation Prompts

### Prompt 1: TypeScript Project with Pre-commit Hooks

```text
Create a new TypeScript MCP server project at code/mcp/ with strict typing and pre-commit hooks.

Requirements:
1. Initialize TypeScript project with package.json:
   - "type": "module" for ES modules
   - Scripts: build, test, lint, typecheck, format
   - Node 18+ requirement
2. Configure TypeScript (tsconfig.json):
   - strict: true (enables all strict checks)
   - target: ES2022, module: ESNext
   - esModuleInterop: true
   - resolveJsonModule: true
   - outDir: ./dist, rootDir: ./src
3. Set up ESLint (.eslintrc.json):
   - extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended']
   - TypeScript parser and plugin
   - Rules for code quality and type safety
4. Configure Prettier (.prettierrc):
   - Semi-colons, single quotes
   - 2 space indentation
   - Trailing commas
5. Install and configure husky + lint-staged:
   - Pre-commit hook running:
     * npm run typecheck
     * npm run lint
     * npm run test -- --findRelatedTests
     * prettier --write
   - Commit-msg hook for conventional commits
6. Create initial structure:
   - src/index.ts - entry point
   - src/types/ - TypeScript interfaces
   - src/tools/ - MCP tools
   - tests/ - Jest tests
7. Verify setup:
   - All hooks run on commit
   - TypeScript compiles without errors
   - Tests pass

This ensures code quality from the start.
```

### Prompt 2: MCP SDK Integration with TypeScript Types

```text
Set up MCP SDK with full TypeScript type safety and create a typed ping tool.

Requirements:
1. Install dependencies:
   - @modelcontextprotocol/sdk (latest)
   - zod for runtime validation
   - dotenv for environment variables
2. Create src/server.ts with typed MCP server:
   ```typescript
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   ```
   - Define server with proper types
   - Set up transport with TypeScript
3. Create src/tools/ping.ts:
   - Define input schema with Zod
   - Implement tool with full type safety
   - Return typed response
   ```typescript
   const pingSchema = z.object({
     message: z.string().optional()
   });
   type PingInput = z.infer<typeof pingSchema>;
   ```
4. Set up Jest with TypeScript:
   - Configure ts-jest
   - Test the ping tool with types
   - Mock MCP server for testing
5. Create npm scripts:
   - build: tsc
   - dev: tsx watch src/index.ts
   - test: jest
   - typecheck: tsc --noEmit
6. Write tests:
   - Ping tool with various inputs
   - Type safety verification
   - Error handling

All code must be strongly typed TypeScript.
```

### Prompt 3: Typed Environment Configuration

```text
Create a fully typed environment configuration system with CONTEXT_ROOT validation.

Requirements:
1. Create src/config/environment.ts:
   ```typescript
   interface EnvironmentConfig {
     contextRoot: string;
     logLevel: 'debug' | 'info' | 'warn' | 'error';
     port: number;
     nodeEnv: 'development' | 'production' | 'test';
   }
   ```
2. Implementation requirements:
   - Load from process.env with type coercion
   - Validate CONTEXT_ROOT exists and is writable
   - Support .env file in development
   - Throw typed errors for invalid config
3. Create src/config/validation.ts:
   - validateDirectory(path: string): Promise<void>
   - Type-safe validation functions
   - Custom error types
4. Error handling:
   ```typescript
   class ConfigurationError extends Error {
     constructor(public field: string, public reason: string) {
       super(`Configuration error: ${field} - ${reason}`);
     }
   }
   ```
5. Tests with TypeScript:
   - Valid configuration loading
   - Missing CONTEXT_ROOT handling
   - Invalid directory handling
   - Type coercion testing
6. Export typed config object:
   - Singleton pattern
   - Lazy validation
   - Type-safe access

No any types allowed - everything must be properly typed.
```

### Prompt 4: Document Model with Full TypeScript Types

```text
Create comprehensive TypeScript types for the document system.

Requirements:
1. Create src/types/document.ts:
   ```typescript
   interface FrontmatterRequired {
     created_date: string; // ISO 8601
     tags: string[];
     summary: string;
   }
   
   interface FrontmatterOptional {
     context?: string;
     decisions?: string[];
     status?: 'active' | 'resolved' | 'deprecated';
     stakeholders?: string[];
     related?: string[];
     priority?: 'high' | 'medium' | 'low';
     next_actions?: string[];
   }
   
   interface Document {
     path: string; // Relative to CONTEXT_ROOT
     frontmatter: FrontmatterRequired & Partial<FrontmatterOptional>;
     content: string;
     links: string[];
     backlinks: string[];
   }
   ```
2. Create src/types/para.ts:
   ```typescript
   enum PARACategory {
     Projects = 'Projects',
     Areas = 'Areas', 
     Resources = 'Resources',
     Archives = 'Archives'
   }
   ```
3. Zod schemas for validation:
   - Match TypeScript interfaces exactly
   - Runtime validation aligned with types
   - Type inference from schemas
4. Type guards:
   ```typescript
   function isValidDocument(obj: unknown): obj is Document
   function hasRequiredFrontmatter(fm: unknown): fm is FrontmatterRequired
   ```
5. Path types:
   ```typescript
   type RelativePath = string & { __brand: 'RelativePath' };
   type AbsolutePath = string & { __brand: 'AbsolutePath' };
   ```
6. Tests:
   - Type guard functionality
   - Zod schema validation
   - Type inference verification

Use branded types for path safety.
```

### Prompt 5: Typed File System Abstraction

```text
Create a type-safe file system abstraction enforcing CONTEXT_ROOT boundaries.

Requirements:
1. Create src/utils/filesystem.ts:
   ```typescript
   interface IFileSystem {
     readFile(path: RelativePath): Promise<string>;
     writeFile(path: RelativePath, content: string): Promise<void>;
     exists(path: RelativePath): Promise<boolean>;
     mkdir(path: RelativePath, recursive?: boolean): Promise<void>;
     listFiles(path: RelativePath, pattern?: string): Promise<RelativePath[]>;
   }
   
   class FileSystem implements IFileSystem {
     constructor(private contextRoot: AbsolutePath) {}
   }
   ```
2. Path utilities with types:
   ```typescript
   function toRelativePath(path: string): RelativePath
   function toAbsolutePath(path: string, base: AbsolutePath): AbsolutePath
   function isWithinContextRoot(path: AbsolutePath, root: AbsolutePath): boolean
   ```
3. Security with TypeScript:
   - Path validation at type level
   - Runtime checks for safety
   - Custom typed errors
4. Error types:
   ```typescript
   class SecurityError extends Error {
     constructor(public attemptedPath: string, public contextRoot: string) {}
   }
   ```
5. Mock implementation:
   ```typescript
   class MockFileSystem implements IFileSystem
   ```
6. Tests with full type coverage:
   - Path traversal prevention
   - Type safety verification
   - Mock behavior validation

Use TypeScript's type system to prevent security issues.
```

### Prompt 6: PARA Structure with TypeScript

```text
Implement PARA methodology with full TypeScript type safety.

Requirements:
1. Create src/utils/para.ts:
   ```typescript
   interface PARAStructure {
     initializeStructure(): Promise<void>;
     validateCategory(category: string): category is PARACategory;
     resolvePath(category: PARACategory, filename: string): RelativePath;
     getCategoryFromPath(path: RelativePath): PARACategory | null;
   }
   
   class PARAManager implements PARAStructure {
     constructor(private fs: IFileSystem) {}
   }
   ```
2. Type-safe operations:
   - Use enum for categories
   - Typed path resolution
   - Validation with type predicates
3. Constants with types:
   ```typescript
   const PARA_PATHS: Record<PARACategory, RelativePath> = {
     [PARACategory.Projects]: 'Projects' as RelativePath,
     // etc...
   };
   ```
4. Integration types:
   ```typescript
   interface PARADocument extends Document {
     category: PARACategory;
   }
   ```
5. Tests with TypeScript:
   - Category validation
   - Path resolution accuracy
   - Type predicate testing
6. Startup integration:
   - Type-safe initialization
   - Error handling with types

Leverage TypeScript enums and type predicates.
```

### Prompt 7: Frontmatter Parser with TypeScript Types

```text
Create a type-safe frontmatter parser for markdown documents.

Requirements:
1. Create src/utils/frontmatter.ts:
   ```typescript
   interface ParseResult<T = unknown> {
     frontmatter: T;
     body: string;
     raw: string;
   }
   
   class FrontmatterParser {
     parse<T = unknown>(content: string): ParseResult<T>;
     serialize<T>(frontmatter: T, body: string): string;
     update<T extends Record<string, unknown>>(
       content: string, 
       updates: Partial<T>
     ): string;
   }
   ```
2. Type-safe parsing:
   - Generic types for frontmatter
   - Preserve type information
   - Validation with Zod schemas
3. Specific extractors:
   ```typescript
   function extractTags(frontmatter: unknown): string[]
   function extractDate(frontmatter: unknown): Date | null
   function extractAs<T>(frontmatter: unknown, schema: ZodSchema<T>): T
   ```
4. Safe YAML options:
   - Prevent code execution
   - Type-safe loading
   - Error handling
5. Tests with types:
   - Generic parsing
   - Type preservation
   - Schema validation
   - Round-trip accuracy

Use generics for flexible yet safe parsing.
```

### Prompt 8: Create Document Tool with Full Types

```text
Implement context_create tool with comprehensive TypeScript types.

Requirements:
1. Create src/tools/context_create.ts:
   ```typescript
   const createInputSchema = z.object({
     category: z.nativeEnum(PARACategory),
     title: z.string().min(1),
     tags: z.array(z.string()),
     summary: z.string(),
     context: z.string().optional(),
     priority: z.enum(['high', 'medium', 'low']).optional()
   });
   
   type CreateInput = z.infer<typeof createInputSchema>;
   
   interface CreateResult {
     path: RelativePath;
     document: Document;
   }
   ```
2. Tool implementation:
   ```typescript
   server.tool(
     "context_create",
     createInputSchema,
     async (input: CreateInput): Promise<ToolResult<CreateResult>> => {
       // Fully typed implementation
     }
   );
   ```
3. Type-safe operations:
   - Validate with Zod schema
   - Return typed results
   - Handle errors with types
4. Filename generation:
   ```typescript
   function generateFilename(title: string, existing: Set<string>): string
   ```
5. Tests with TypeScript:
   - Input validation
   - Type inference
   - Error scenarios
   - Result types

Every function must have explicit TypeScript types.
```

### Prompt 9: Read Document Tool with TypeScript

```text
Implement context_read tool with full type safety.

Requirements:
1. Create src/tools/context_read.ts:
   ```typescript
   const readInputSchema = z.object({
     path: z.string().transform(toRelativePath)
   });
   
   type ReadInput = z.infer<typeof readInputSchema>;
   
   interface ReadResult {
     document: Document;
     metadata: {
       size: number;
       modified: Date;
       category: PARACategory;
     };
   }
   ```
2. Path resolution with types:
   ```typescript
   async function resolveDocumentPath(
     input: RelativePath,
     para: PARAManager
   ): Promise<RelativePath | null>
   ```
3. Tool response:
   ```typescript
   interface ToolResult<T> {
     content: Array<{
       type: 'text';
       text: string;
     }>;
   }
   ```
4. Error handling:
   ```typescript
   class DocumentNotFoundError extends Error {
     constructor(public path: RelativePath) {
       super(`Document not found: ${path}`);
     }
   }
   ```
5. Tests:
   - Type safety throughout
   - Path resolution types
   - Error type verification

Maintain type safety from input to output.
```

### Prompt 10: Wiki-Link Parser with TypeScript

```text
Create a type-safe wiki-link parser with TypeScript.

Requirements:
1. Create src/utils/links.ts:
   ```typescript
   interface WikiLink {
     raw: string;
     target: string;
     display?: string;
   }
   
   interface LinkExtractor {
     extractLinks(content: string): WikiLink[];
     normalizeLink(link: string): string;
     parseLink(raw: string): WikiLink | null;
   }
   ```
2. Type-safe regex patterns:
   ```typescript
   const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
   
   function isValidLink(text: string): text is WikiLinkFormat {
     return WIKI_LINK_PATTERN.test(text);
   }
   ```
3. Link index with types:
   ```typescript
   class LinkIndex {
     private forward: Map<RelativePath, Set<RelativePath>>;
     private backward: Map<RelativePath, Set<RelativePath>>;
     
     addDocument(doc: Document): void;
     getBacklinks(path: RelativePath): RelativePath[];
     getForwardLinks(path: RelativePath): RelativePath[];
   }
   ```
4. Type guards:
   ```typescript
   function isWikiLink(obj: unknown): obj is WikiLink
   ```
5. Tests with types:
   - Link extraction accuracy
   - Type guard functionality
   - Index operations

Use TypeScript interfaces for link structure.
```

### Prompt 11: Search Tool with Typed Queries

```text
Implement context_search with fully typed search queries and results.

Requirements:
1. Create src/tools/context_search.ts:
   ```typescript
   const searchInputSchema = z.object({
     tags: z.array(z.string()).optional(),
     text: z.string().optional(),
     category: z.nativeEnum(PARACategory).optional(),
     limit: z.number().default(20)
   });
   
   type SearchInput = z.infer<typeof searchInputSchema>;
   
   interface SearchResult {
     path: RelativePath;
     score: number;
     highlights: string[];
     document: Pick<Document, 'frontmatter'>;
   }
   ```
2. Search index with types:
   ```typescript
   interface SearchIndex {
     addDocument(doc: Document): void;
     search(query: SearchInput): SearchResult[];
     removeDocument(path: RelativePath): void;
   }
   ```
3. Scoring with types:
   ```typescript
   interface ScoringFactors {
     tagMatch: number;
     textMatch: number;
     titleMatch: number;
   }
   
   function calculateScore(factors: ScoringFactors): number
   ```
4. Result formatting:
   ```typescript
   function formatResults(results: SearchResult[]): ToolResult<SearchResult[]>
   ```
5. Tests:
   - Query type validation
   - Result type accuracy
   - Score calculation types

Every search operation must be type-safe.
```

### Prompt 12: Phase 1 Integration Tests with TypeScript

```text
Create comprehensive TypeScript integration tests for Phase 1.

Requirements:
1. Create tests/integration/phase1.test.ts:
   ```typescript
   describe('Phase 1 Integration', () => {
     let testContext: TestContext;
     
     interface TestContext {
       contextRoot: AbsolutePath;
       server: Server;
       fs: IFileSystem;
     }
   });
   ```
2. Typed test helpers:
   ```typescript
   async function createTestDocument(
     context: TestContext,
     params: Partial<CreateInput>
   ): Promise<Document>
   
   async function assertDocumentExists(
     context: TestContext,
     path: RelativePath
   ): Promise<void>
   ```
3. Test scenarios with types:
   - Type-safe document creation
   - Typed search queries
   - Result type verification
4. Performance types:
   ```typescript
   interface PerformanceMetrics {
     operationTime: number;
     memoryUsed: number;
   }
   
   function measurePerformance<T>(
     operation: () => Promise<T>
   ): Promise<[T, PerformanceMetrics]>
   ```
5. Cleanup with types:
   ```typescript
   async function cleanupTestContext(context: TestContext): Promise<void>
   ```

All test code must use TypeScript with proper types.
```

Continue with remaining prompts following the same TypeScript-first pattern...

## Success Criteria

Each step must:
1. Use TypeScript with strict mode enabled
2. Have zero `any` types (use `unknown` when needed)
3. Pass all pre-commit hooks before commit
4. Have comprehensive typed tests
5. Use proper TypeScript patterns (interfaces, enums, generics)
6. Document types with JSDoc when helpful
7. Export all necessary types for consumers

## TypeScript Best Practices

1. **No Any Types**: Use `unknown` and type guards instead
2. **Branded Types**: Use for paths and other string types needing validation
3. **Const Assertions**: Use `as const` for literal types
4. **Discriminated Unions**: For different document types or results
5. **Generic Constraints**: Use extends to constrain generic types
6. **Type Predicates**: For runtime type checking
7. **Strict Null Checks**: Handle null/undefined explicitly

The final system should leverage TypeScript's type system to prevent bugs at compile time while maintaining the security boundary of CONTEXT_ROOT.