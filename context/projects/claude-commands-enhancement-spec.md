---
title: Claude Commands Enhancement - Technical Specification
category: projects
created: 2025-01-15T00:00:00.000Z
modified: 2025-01-15T00:00:00.000Z
tags:
  - specification
  - technical-design
  - claude-commands
status: active
project: claude-commands-enhancement
command_type: spec
generated_by: /plan
refines: /Users/mobrienv/Code/why/spec.md
---

# Claude Commands Enhancement - Technical Specification

## Architecture Overview

The enhancement consists of four main components working together to organize command outputs:

```
┌─────────────────────────────────────────────────────────┐
│                   Claude Commands                        │
│  (/plan, /build, /spec, /code, /review)                 │
└────────────────────┬────────────────────────────────────┘
                     │ generates
                     ▼
┌─────────────────────────────────────────────────────────┐
│            CommandDocumentOrganizer                      │
│  • Determines path based on type & project              │
│  • Resolves naming conflicts                            │
│  • Enriches metadata                                    │
└────────────────────┬────────────────────────────────────┘
                     │ creates
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Organized Documents                         │
│  context/                                               │
│    projects/[project-name]/[type]-[description].md     │
│    areas/[topic]/[type]-[description].md               │
│    resources/[type]-[description].md                    │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DocumentMigrator                            │
│  • Analyzes existing documents                          │
│  • Creates migration plan                               │
│  • Preserves git history                                │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CommandDocumentOrganizer

**Purpose**: Intelligent document placement and naming engine

**Key Methods**:
```typescript
class CommandDocumentOrganizer {
  async organizeDocument(
    type: CommandDocumentType,
    baseName: string,
    title: string,
    content: string,
    metadata?: Partial<CommandMetadata>
  ): Promise<OrganizeResult>
  
  private determinePath(
    type: CommandDocumentType,
    project?: string,
    category?: PARACategory
  ): string
  
  private async resolveNamingConflict(
    basePath: string,
    type: CommandDocumentType,
    baseName: string
  ): Promise<string>
  
  private enrichMetadata(
    metadata: Partial<CommandMetadata>,
    type: CommandDocumentType
  ): CommandMetadata
}
```

**Naming Conflict Resolution Algorithm**:
1. Check if `[type]-[baseName].md` exists
2. If conflict, analyze existing content
3. Generate more specific name based on:
   - Content differences
   - Timestamp precision
   - Feature specificity
   - Scope qualifiers

### 2. Document Types and Metadata

**CommandDocumentType Enum**:
```typescript
enum CommandDocumentType {
  Design = 'design',
  Todo = 'todo',
  Report = 'report',
  Spec = 'spec',
  Review = 'review'
}
```

**CommandMetadata Interface**:
```typescript
interface CommandMetadata {
  // Required fields
  command_type: CommandDocumentType;
  project?: string;
  status: 'active' | 'completed' | 'superseded';
  generated_by: string;
  
  // Relationship tracking
  implements?: string;
  supersedes?: string;
  related_docs?: string[];
  context_source?: string[];
  
  // Standard PARA fields
  title: string;
  category: PARACategory;
  created: string;
  modified: string;
  tags: string[];
}
```

### 3. Path Generation Logic

**Project-Based Organization**:
```typescript
function determinePath(type: CommandDocumentType, project?: string, category?: PARACategory): string {
  const baseCategory = category || 'projects';
  
  if (project) {
    // Project-specific document
    return `${baseCategory}/${project}`;
  } else if (type === CommandDocumentType.Report && !project) {
    // General reports go to resources
    return 'resources/reports';
  } else {
    // Default to category root
    return baseCategory;
  }
}
```

### 4. DocumentMigrator

**Purpose**: Reorganize existing documents to new structure

**Key Features**:
- Analyzes frontmatter to determine new location
- Removes dates from filenames
- Adds missing metadata fields
- Creates git-friendly migrations

**Migration Plan Structure**:
```typescript
interface MigrationPlan {
  operations: MigrationOperation[];
  summary: {
    total: number;
    byCategory: Record<PARACategory, number>;
    byType: Record<CommandDocumentType, number>;
  };
}

interface MigrationOperation {
  source: string;
  destination: string;
  metadata: Partial<CommandMetadata>;
  reason: string;
}
```

## Integration Points

### Command Integration Pattern

Each command follows this pattern:

```typescript
// In /plan command
import { createCommandOrganizer, createCommandDocument } from '@mcp-server/commands';

async function savePlanDocument(content: string, projectName: string) {
  const organizer = createCommandOrganizer(fileSystem, paraManager, contextRoot);
  
  const result = await createCommandDocument(
    organizer,
    CommandDocumentType.Spec,
    projectName,
    `${projectName} Implementation Plan`,
    content,
    {
      project: projectName,
      generated_by: '/plan',
      status: 'active'
    }
  );
  
  return result.path;
}
```

### Migration CLI

```bash
# Preview migration without changes
npm run migrate:dry

# Execute migration
npm run migrate

# Migration with custom context root
npm run migrate -- --context-root /path/to/context
```

## Data Flow

### Document Creation Flow

1. **Command executes** (e.g., /plan)
2. **Generates content** (spec, todo, report)
3. **Calls organizer** with type and metadata
4. **Organizer determines**:
   - Appropriate PARA category
   - Project folder (if applicable)
   - Unique filename
5. **Creates document** with enriched metadata
6. **Returns path** for command feedback

### Migration Flow

1. **Scan context directory** for all .md files
2. **Parse frontmatter** of each document
3. **Determine new location** based on:
   - Document type (from title/content)
   - Project association
   - PARA category
4. **Generate migration plan**
5. **Execute migrations** with git mv
6. **Update metadata** in place
7. **Create project indexes**

## Performance Considerations

### Caching Strategy
- Cache PARA structure on startup
- Lazy-load document metadata
- Index project folders for quick lookup

### Optimization Points
- Batch file operations during migration
- Use streaming for large documents
- Parallelize independent operations

## Error Handling

### Graceful Degradation
- If organizer fails, fall back to current behavior
- Log warnings for missing metadata
- Continue operation with partial information

### Recovery Mechanisms
- Migration creates backup before execution
- Rollback procedure for failed migrations
- Validation step before committing changes

## Testing Strategy

### Unit Tests
- Path generation logic
- Conflict resolution algorithms
- Metadata enrichment
- Migration planning

### Integration Tests
- Full document creation flow
- Migration with real file system
- Command integration scenarios
- Git operations

### End-to-End Tests
- Complete workflow from command to organized output
- Migration of sample context directory
- Performance benchmarks

## Security Considerations

- Validate all file paths to prevent directory traversal
- Sanitize user input in filenames
- Preserve file permissions during migration
- Audit trail for all operations

## Future Extensibility

### Plugin Architecture
- Allow custom document types
- Pluggable naming strategies
- External metadata sources

### API Design
- RESTful endpoints for document management
- WebSocket for real-time updates
- GraphQL for complex queries

### Advanced Features
- Machine learning for categorization
- Automatic relationship detection
- Smart archival policies