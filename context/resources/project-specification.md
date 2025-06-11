# Project Documentation & Journaling System Specification

## Overview

A comprehensive documentation and journaling system designed to capture all aspects of project development, using markdown files with frontmatter for metadata and wiki-style links to create a knowledge graph.

## Core Concept

The system enables thorough project documentation through structured markdown files organized using the PARA method (Projects, Areas, Resources, Archives), with automatic linking and relationship tracking to build a searchable knowledge base.

## Technical Architecture

### Storage & Organization

- **Format**: Markdown files with YAML frontmatter
- **Organization**: PARA methodology using folder structure
  - `/Projects/` - Active development features and sprints
  - `/Areas/` - Ongoing concerns (security, performance, architecture)
  - `/Resources/` - Reference materials, templates, design patterns
  - `/Archives/` - Completed features, deprecated decisions, old notes
- **Linking**: Wiki-style `[[double bracket]]` links for cross-referencing
- **Naming Convention**: Descriptive names for topic-based files, ISO dates for journal entries

### Frontmatter Schema

#### Required Fields

```yaml
created_date: 2024-01-15T10:30:00Z # ISO timestamp
tags: [authentication, security] # Array for topic clustering
summary: Brief one-line description # For quick context scanning
```

#### Optional Fields

```yaml
context: Background information about why this document exists
decisions:
  - Key architectural choice made
  - Another important decision
status: active|resolved|deprecated
stakeholders: [alice, bob] # People mentioned/involved
related: ['[[API Design]]', '[[Auth Flow]]'] # Explicit connections
priority: high|medium|low # For attention routing
next_actions:
  - Review security implications
  - Update integration tests
```

### MCP Server Interface

The system will be accessed through an MCP (Model Context Protocol) server built using the official TypeScript SDK (@modelcontextprotocol/sdk) that Claude Code can interact with on behalf of the user. This MCP server will be located at `code/mcp/` and will contain ALL tools created for this project, serving as the central interface for all capabilities.

#### Core Capabilities (Phase 1 - MVP)

1. **Create Operations**

   - New journal entries with validated frontmatter
   - Auto-generate daily journal entries
   - Create documents from templates

2. **Read Operations**

   - Search by tags and content
   - Parse and follow wiki-style links
   - Retrieve documents with full context

3. **Basic PARA Structure**
   - Proper folder organization
   - Path validation for PARA categories

#### Enhanced Capabilities (Phase 2)

1. **Update Operations**

   - Modify documents while preserving structure
   - Update frontmatter fields
   - Maintain link integrity

2. **Relationship Management**
   - Backlink detection and indexing
   - Query relationships between documents
   - Find all documents linking to a specific topic

#### Advanced Capabilities (Phase 3)

1. **Workflow Automation**

   - Move items between PARA categories
   - Archive completed projects
   - Bulk tag management

2. **Knowledge Graph Features**

   - Export graph data (JSON/GraphML format)
   - Visualize document relationships
   - Generate connection reports

3. **Smart Features**
   - Template system for different document types
   - Auto-suggest related documents
   - Intelligent search with context awareness

## Implementation Details

### Document Types

- **Daily Journals**: Time-based entries for progress tracking
- **Decision Records**: Architectural and technical decisions with rationale
- **Meeting Notes**: Discussions and outcomes
- **Feature Specs**: Detailed feature documentation
- **Problem Reports**: Issues encountered and solutions
- **Reference Docs**: Reusable patterns and guidelines

### Search & Discovery

- Full-text search across all documents
- Tag-based filtering
- Date range queries
- Link traversal for related content
- Status-based filtering (active, deprecated, etc.)

### Data Model

```typescript
interface Document {
  path: string; // File path within PARA structure
  frontmatter: {
    created_date: string;
    tags: string[];
    summary: string;
    [key: string]: any; // Optional fields
  };
  content: string; // Markdown body
  links: string[]; // Extracted [[wiki-links]]
  backlinks: string[]; // Documents linking to this one
}
```

### MCP Server Implementation

The server will be implemented in TypeScript at `code/mcp/` using @modelcontextprotocol/sdk with the following tools:

#### MCP Tools

- `context_create` - Create new documents with validated frontmatter
- `context_read` - Read document content and metadata
- `context_update` - Update documents while preserving structure
- `context_search` - Search by tags, content, or relationships
- `context_query_links` - Get related documents and backlinks
- `context_move` - Move documents between PARA categories
- `context_graph` - Export knowledge graph data

All future tools for the forge project will be added to this same MCP server, making it the unified interface for all project capabilities.

### Self-Verification Testing

The MCP server will include automated self-verification using Claude Code's headless mode:

#### Headless Testing Approach

1. **Test Scripts**: Each MCP tool will have corresponding test scripts that invoke Claude using `claude -p` commands
2. **Verification Flow**:
   - Start MCP server in test mode
   - Execute headless Claude commands that use the MCP tools
   - Verify tool outputs and side effects
   - Assert expected behaviors and error handling

#### Example Test Pattern

```bash
# Test context_create tool
claide -p "Use the context_create MCP tool to create a new document in Projects with title 'Test Doc', tags ['test', 'verification'], and summary 'Self-verification test document'"

# Verify document was created
claide -p "Use the context_read MCP tool to read the document at Projects/test-doc.md and confirm it exists with correct metadata"

# Test error handling
claide -p "Use the context_create MCP tool with invalid input and verify it returns appropriate error messages"
```

#### Verification Criteria

- All tools respond correctly to valid inputs
- Error messages are clear and actionable
- Tool permissions are properly enforced
- CONTEXT_ROOT boundaries are maintained
- Performance meets specified thresholds

## Benefits

1. **Comprehensive History**: Every decision, discussion, and development step is captured
2. **Contextual Intelligence**: LLMs can quickly understand project state and history
3. **Knowledge Preservation**: Institutional knowledge is maintained even as team members change
4. **Efficient Onboarding**: New team members can self-serve historical context
5. **Decision Traceability**: Understand not just what was built, but why

## Success Metrics

- All project activities have corresponding documentation
- Average document retrieval time < 100ms
- Cross-reference accuracy > 95%
- LLM context retrieval relevance > 90%
- Zero documentation loss through system operations

## Future Considerations

- Integration with version control for automatic commit documentation
- Real-time collaboration features
- Export to other knowledge management systems
- AI-powered summarization and insight generation
- Mobile access for on-the-go documentation
