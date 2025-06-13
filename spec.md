# Claude Commands Output Organization Enhancement Specification

## Problem Statement

The current organization of documentation produced by custom Claude commands (designs, todo tracking, summary reports, etc.) in the `context/` directory is disorganized and difficult to navigate. While the commands themselves work well, their outputs need better structure, naming conventions, and metadata to improve findability and usability.

## Requirements

### 1. File Naming Conventions

**Current State**: Files use inconsistent naming with dates in filenames (e.g., `prompt-execution-static-website-generator-20250106.md`)

**New Approach**:
- Remove dates from filenames (redundant with frontmatter)
- Use pattern: `[document-type]-[descriptive-name].md`
- When naming conflicts occur, make new names more explicit/specific rather than adding version numbers
- Examples:
  - `design-authentication-api.md`
  - `todo-payment-integration.md`
  - `report-performance-analysis.md`

### 2. Directory Structure

**Approach**: Organize by project/topic first, then by document type

```
context/
  projects/
    auth-system/
      design-api-structure.md
      design-user-flow.md
      todo-implementation.md
      report-progress.md
    payment-integration/
      design-stripe-integration.md
      todo-api-endpoints.md
      report-testing-results.md
  areas/
    development-workflow/
      design-ci-pipeline.md
      todo-automation-tasks.md
  resources/
    command-outputs/
      report-command-usage-stats.md
      design-command-enhancement.md
```

**Benefits**:
- All materials for a project/topic are co-located
- Easy to see the complete story (designs → todos → reports)
- Simple to archive completed projects
- Intuitive navigation for both humans and AI

### 3. Metadata Standards

**Required Frontmatter Fields**:

```yaml
---
title: [Descriptive title]
category: [projects/areas/resources/archives]
created: [ISO timestamp]
modified: [ISO timestamp]
tags: [relevant tags]
# New required fields:
command_type: [design/todo/report/spec/review]
project: [parent project name]
status: [active/completed/superseded]
generated_by: [command that created this, e.g., "/plan"]
# Optional but recommended:
implements: [path to spec/plan being implemented]
supersedes: [path to document this replaces]
related_docs: [array of related document paths]
context_source: [what context files were loaded]
---
```

### 4. Document Organization Rules

**File Placement Logic**:
1. Determine the PARA category based on content purpose
2. Create/use project folder if document belongs to a specific project
3. Place document with descriptive name following naming convention
4. If name conflicts, create more specific variant

**Conflict Resolution Examples**:
- First: `auth-system/design-api.md`
- Conflict: `auth-system/design-api-graphql-schema.md` (more specific)
- Another: `auth-system/design-api-rest-endpoints.md` (different aspect)

### 5. Content Structure

**Flexible Templates**: Document structure should adapt based on context and task requirements rather than rigid templates.

**Design Documents** (adapt based on scope):
- Minimal: Problem & Solution
- Medium: + Technical Approach, Key Decisions
- Comprehensive: + Alternatives, Risks, Implementation Plan

**Todo Documents** (scale with project size):
- Simple: Checklist with priorities
- Complex: Grouped by phase, with dependencies and estimates

**Report Documents** (match analysis depth):
- Quick: Summary & Key Points
- Detailed: + Metrics, Analysis, Recommendations

### 6. Command Enhancements

Each command should be updated to:

1. **Determine Placement**: Analyze context to decide appropriate PARA category and project folder
2. **Generate Metadata**: Populate all required frontmatter fields
3. **Check Conflicts**: Before writing, check for existing files and create specific names if needed
4. **Link Documents**: Automatically populate `related_docs` based on context
5. **Update Indexes**: Maintain an index file per project listing all documents

### 7. Migration Strategy

For existing documents:
1. Create a migration script to reorganize existing files
2. Parse frontmatter to determine correct placement
3. Update filenames to remove dates
4. Add missing metadata fields where possible
5. Create project folders and move documents
6. Generate index files for each project

### 8. Implementation Priority

1. **Phase 1**: Update commands to use new naming and metadata (no breaking changes)
2. **Phase 2**: Implement directory structure for new documents
3. **Phase 3**: Create migration script for existing documents
4. **Phase 4**: Add indexing and cross-referencing features

## Success Criteria

- All command-generated documents follow consistent naming patterns
- Documents are organized in intuitive project-based folders
- Metadata enables easy discovery and relationship tracking
- Both humans and AI can quickly find relevant documents
- Migration preserves all existing content while improving organization

## Technical Considerations

- Commands should gracefully handle file conflicts
- Preserve git history during migration
- Ensure backward compatibility during transition
- Consider creating a `.claude-commands/` config for customization
- Implement validation for required metadata fields

## Future Enhancements

- Auto-generate project index pages
- Create visual maps of document relationships
- Add search functionality across command outputs
- Implement document lifecycle automation (auto-archive completed items)
- Generate summary reports across projects