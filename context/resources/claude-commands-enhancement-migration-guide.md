---
title: Claude Commands Enhancement Migration Guide
category: resources
created: 2025-01-15T00:00:00.000Z
modified: 2025-01-15T00:00:00.000Z
tags:
  - claude-commands
  - migration
  - documentation
  - enhancement
command_type: summary
project: claude-commands-enhancement
status: active
generated_by: manual
---

# Claude Commands Enhancement Migration Guide

This guide explains how to migrate to the enhanced Claude command document organization system.

## Overview

We've implemented an enhanced document organization system for Claude commands that provides:

- Better file organization with project folders
- Consistent naming without date suffixes
- Rich metadata for tracking relationships
- Smart conflict resolution
- Improved findability

## What's Changed

### 1. Document Organization

**Before**:

```
context/
  projects/
    prompt-execution-static-website-generator-20250106.md
    github-pages-deployment-implementation-2025-06-12.md
  resources/
    design-auth-system-20250111.md
```

**After**:

```
context/
  projects/
    static-website-generator/
      spec-static-website-generator.md
      plan-implementation-roadmap.md
      todo-implementation.md
      report-prompt-execution.md
    github-pages-deployment/
      plan-implementation.md
      report-deployment-fixes.md
```

### 2. Naming Conventions

- **No more dates** in filenames (dates are in metadata)
- **Type prefixes**: `spec-`, `plan-`, `todo-`, `design-`, `report-`, `review-`
- **Descriptive names** that indicate content
- **Smart conflict resolution** with specific naming

### 3. Enhanced Metadata

All documents now include:

```yaml
command_type: [spec/plan/todo/design/report/review]
project: [project-name]
status: [active/completed/superseded]
generated_by: [/plan, /build, etc.]
implements: [path to source spec/plan]
related_docs: [array of related documents]
context_source: [source files analyzed]
```

## Migration Steps

### Phase 1: Start Using Enhanced Commands (Immediate)

1. **Use v2 Commands**: The enhanced commands are available as:

   - `/plan` → Use enhanced organization automatically
   - `/build` → Use enhanced organization automatically
   - `/spec` → Use enhanced organization automatically
   - `/code` → Use enhanced organization automatically

2. **Benefits**: New documents will be properly organized with rich metadata

### Phase 2: Migrate Existing Documents (Optional)

1. **Run Migration Analysis**:

   ```bash
   cd code/mcp-server
   npm run migrate:dry
   ```

2. **Review Migration Plan**: Check what will be moved and renamed

3. **Execute Migration**:

   ```bash
   npm run migrate
   ```

4. **Verify Results**: All documents moved to new structure with updated metadata

## Using Enhanced Commands

### Creating New Projects

When using `/spec` or `/plan`:

- Documents automatically go to `context/projects/[project-name]/`
- Project folders are created as needed
- Metadata links related documents

### Example: Starting a New Feature

1. **Specification**: `/spec new-authentication-system`

   - Creates: `projects/new-authentication-system/spec-new-authentication-system.md`

2. **Planning**: `/plan` (reads the spec)

   - Creates: `projects/new-authentication-system/plan-implementation-roadmap.md`
   - Creates: `projects/new-authentication-system/todo-implementation.md`

3. **Building**: `/build` (follows the plan)
   - Updates: `todo-implementation.md`
   - Creates: `projects/new-authentication-system/report-build-session.md`

### Handling Conflicts

If a document already exists, the system makes names more specific:

- First: `design-api.md`
- Conflict: `design-api-graphql-schema.md`
- Another: `design-api-rest-endpoints.md`

## Best Practices

### 1. Use Project Names Consistently

- Choose clear, descriptive project names
- Use the same name across all commands
- Avoid special characters (use hyphens)

### 2. Let Commands Handle Organization

- Don't manually create files in the old structure
- Trust the enhanced naming system
- Let metadata track relationships

### 3. Review Generated Metadata

- Check that `related_docs` links are correct
- Ensure `implements` points to source specs
- Verify project assignment

## Troubleshooting

### Can't Find a Document?

- Check under `projects/[project-name]/`
- Look for type prefix (spec-, plan-, etc.)
- Search by project name, not date

### Document in Wrong Place?

- Check if project was specified in command
- Verify PARA category is correct
- Run migration if it's an old document

### Naming Conflicts?

- System handles automatically
- Creates more specific names
- Check for existing similar documents

## Future Enhancements

Coming soon:

- Project index pages with all documents
- Cross-project search
- Document relationship visualization
- Automatic archival of completed projects

## Need Help?

- Review enhanced command documentation
- Check example projects in context/
- Run migration in dry-run mode first
- Ask Claude to explain the new structure
