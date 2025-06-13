# Claude Commands Output Organization Enhancement

This module implements the enhanced document organization system for Claude command outputs as specified in `/spec.md`.

## Overview

The command enhancement module provides:

1. **Consistent File Naming** - Removes dates from filenames and uses pattern: `[document-type]-[descriptive-name].md`
2. **Project-Based Organization** - Groups related documents by project/topic
3. **Enhanced Metadata** - Adds command-specific frontmatter fields
4. **Conflict Resolution** - Makes names more specific when conflicts occur
5. **Migration Support** - Reorganizes existing documents to new structure

## Usage

### Creating Command Documents

```typescript
import { createCommandOrganizer, createCommandDocument, CommandDocumentType } from './commands/index.js';

// Initialize organizer
const organizer = createCommandOrganizer(fileSystem, paraManager, contextRoot);

// Create a design document
const result = await createCommandDocument(
  organizer,
  CommandDocumentType.Design,
  'authentication-api',
  'Authentication API Design',
  '# API Design\n\nContent here...',
  {
    project: 'auth-system',
    tags: ['api', 'authentication'],
    generatedBy: '/plan',
    metadata: {
      implements: 'projects/auth-system/spec.md',
      related_docs: ['projects/auth-system/requirements.md'],
    }
  }
);

console.log(`Document created at: ${result.path}`);
```

### Migrating Existing Documents

Run the migration script to reorganize existing documents:

```bash
# Preview changes (dry run)
npm run migrate:dry

# Apply migration
npm run migrate

# With custom context root
npm run migrate -- --context-root /path/to/context
```

## Document Types

- `design` - Architecture and design documents
- `todo` - Task lists and implementation tracking
- `report` - Analysis and progress reports
- `spec` - Specifications and requirements
- `review` - Code reviews and assessments
- `plan` - Implementation plans and roadmaps
- `summary` - Summaries and overviews

## Directory Structure

Documents are organized as:

```
context/
  projects/
    [project-name]/
      index.md                    # Auto-generated project index
      design-[name].md
      todo-[name].md
      report-[name].md
  areas/
    [area-name]/
      todo-[name].md
  resources/
    report-[name].md
    summary-[name].md
```

## Required Metadata

All command-generated documents include:

```yaml
---
title: [Descriptive title]
category: [projects/areas/resources/archives]
created: [ISO timestamp]
modified: [ISO timestamp]
tags: [relevant tags]
command_type: [design/todo/report/spec/review/plan/summary]
project: [parent project name]
status: [active/completed/superseded]
generated_by: [command that created this]
# Optional:
implements: [path to spec/plan being implemented]
supersedes: [path to document this replaces]
related_docs: [array of related document paths]
context_source: [what context files were loaded]
---
```

## Conflict Resolution

When naming conflicts occur, the system makes names more specific by:

1. Adding significant tags (e.g., `design-api.md` → `design-api-graphql.md`)
2. Extracting key terms from title
3. Adding type-specific modifiers
4. As last resort, adding timestamp component

## Integration with Existing Tools

The enhancement is designed to work seamlessly with existing MCP tools:

- Compatible with `context_create` tool
- Works with `context_update` for metadata updates
- Supports `context_move` for document relocation
- Integrates with backlink management

## Testing

Run tests with:

```bash
npm test -- commands
```

Tests cover:
- Document naming and placement
- Conflict resolution
- Metadata generation
- Migration functionality
- Error handling