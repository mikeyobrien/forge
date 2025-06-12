---
title: Context Update Tool Enhancement Plan
category: areas
created: 2025-06-12T00:35:35.833Z
modified: 2025-06-12T00:35:35.833Z
tags:
  - mcp
  - context-manager
  - enhancement
  - design
---

# Context Update Tool Enhancement Plan

## Problem Statement

The current `context_update` tool has significant limitations:

- `replace_content=false` blindly appends, causing duplicates
- `replace_content=true` replaces everything, losing granular control
- No ability to update specific sections or fields in-place
- Cannot intelligently merge changes with existing content

This is particularly problematic for structured documents like prompt plans where we need to update specific fields (status, completion time) without affecting the rest of the document.

## Design Goals

1. **Intelligent Updates**: Update specific parts of documents without affecting others
2. **Pattern Matching**: Find and replace based on patterns/regex
3. **Section Awareness**: Update content within specific sections/headers
4. **Structured Updates**: Support common document patterns (status fields, checkboxes, etc.)
5. **Backward Compatibility**: Maintain existing API for simple use cases

## Proposed Implementation

### 1. Enhanced Update Modes

Add an `update_mode` parameter with the following options:

```typescript
enum UpdateMode {
  Replace = 'replace', // Current behavior with replace_content=true
  Append = 'append', // Current behavior with replace_content=false
  Patch = 'patch', // New: Apply specific changes
  Merge = 'merge', // New: Intelligently merge content
  InPlace = 'in_place', // New: Update specific patterns
}
```

### 2. Pattern-Based Updates

Add support for finding and updating specific patterns:

```typescript
interface PatternUpdate {
  pattern: string | RegExp; // Pattern to find
  replacement: string; // Replacement text
  occurrence?: 'first' | 'last' | 'all'; // Which occurrences to replace
  caseInsensitive?: boolean;
}
```

Example usage:

```javascript
context_update({
  path: 'projects/prompt-plan',
  update_mode: 'in_place',
  updates: [
    {
      pattern: '**Status**: ⏳ Not Started',
      replacement: '**Status**: ✅ Complete',
      occurrence: 'first',
    },
  ],
});
```

### 3. Section-Based Updates

Add ability to update content within specific sections:

```typescript
interface SectionUpdate {
  section: string; // Section header to find
  level?: number; // Header level (1-6)
  content?: string; // New content for the section
  subsection?: string; // Optional subsection within the section
  operation?: 'replace' | 'append' | 'prepend';
}
```

Example usage:

```javascript
context_update({
  path: 'projects/prompt-plan',
  update_mode: 'patch',
  sections: [
    {
      section: 'Prompt 4.3: Integration Testing & End-to-End Validation',
      subsection: 'Status',
      content: '✅ Complete',
    },
  ],
});
```

### 4. Structured Field Updates

Support for common document patterns:

```typescript
interface FieldUpdate {
  field: string; // Field name
  value: string | boolean | number; // New value
  format?: 'yaml' | 'markdown' | 'checkbox'; // Field format
}
```

Example usage:

```javascript
context_update({
  path: 'projects/prompt-plan',
  update_mode: 'patch',
  fields: [
    { field: 'status', value: 'completed', format: 'yaml' },
    { field: 'modified', value: new Date().toISOString(), format: 'yaml' },
    { field: '- [ ] All tests pass', value: true, format: 'checkbox' },
  ],
});
```

### 5. Smart Merge Capabilities

Implement intelligent merging for common scenarios:

```typescript
interface MergeOptions {
  strategy: 'yaml' | 'sections' | 'lines';
  conflict_resolution: 'ours' | 'theirs' | 'prompt';
  preserve_formatting: boolean;
}
```

### 6. Update Transactions

Support atomic updates with rollback:

```typescript
interface UpdateTransaction {
  operations: UpdateOperation[];
  atomic: boolean; // All succeed or all fail
  validate?: (content: string) => boolean; // Validation function
}
```

## Implementation Plan

### Phase 1: Core Pattern Matching (Week 1)

- [ ] Implement pattern-based find/replace engine
- [ ] Add regex support with proper escaping
- [ ] Create unit tests for pattern matching
- [ ] Handle edge cases (multiline patterns, special characters)

### Phase 2: Section Awareness (Week 2)

- [ ] Implement markdown section parser
- [ ] Add section-based content extraction
- [ ] Create section update logic
- [ ] Support nested sections and subsections

### Phase 3: Structured Updates (Week 3)

- [ ] Implement YAML frontmatter field updates
- [ ] Add checkbox state toggling
- [ ] Support common markdown list patterns
- [ ] Create field validation logic

### Phase 4: Smart Merge Engine (Week 4)

- [ ] Implement diff/merge algorithms
- [ ] Add conflict detection and resolution
- [ ] Create merge strategies for different content types
- [ ] Build merge preview functionality

### Phase 5: API Integration (Week 5)

- [ ] Update MCP protocol definitions
- [ ] Maintain backward compatibility
- [ ] Create comprehensive API documentation
- [ ] Build migration guide for existing users

### Phase 6: Testing & Optimization (Week 6)

- [ ] Create comprehensive test suite
- [ ] Performance optimization for large documents
- [ ] Edge case handling and error recovery
- [ ] Integration tests with real-world documents

## Example Use Cases

### 1. Updating Prompt Plan Status

```javascript
// Update a specific prompt's status
context_update({
  path: 'projects/static-website-generator-prompt-plan',
  update_mode: 'in_place',
  updates: [
    {
      pattern: /#### Prompt 4\.3:.*?\n\*\*Status\*\*: ⏳ Not Started/s,
      replacement: (match) => match.replace('⏳ Not Started', '✅ Complete'),
    },
  ],
});
```

### 2. Updating Progress Counts

```javascript
// Smart update of progress counts
context_update({
  path: 'projects/prompt-plan',
  update_mode: 'patch',
  sections: [
    {
      section: 'Overall Progress',
      operation: 'replace',
      content: generateProgressSection(completedCount, totalCount),
    },
  ],
});
```

### 3. Adding Completion Notes

```javascript
// Add completion notes to a specific prompt
context_update({
  path: 'projects/prompt-plan',
  update_mode: 'patch',
  sections: [
    {
      section: 'Prompt 4.3: Integration Testing',
      subsection: 'Completion',
      content: '2025-06-11 15:30:00',
    },
    {
      section: 'Prompt 4.3: Integration Testing',
      subsection: 'Notes',
      content: 'Successfully implemented with 95% test coverage',
    },
  ],
});
```

### 4. Batch Status Updates

```javascript
// Update multiple checkboxes at once
context_update({
  path: 'projects/prompt-plan',
  update_mode: 'patch',
  fields: [
    {
      field: '- [ ] Integration tests cover all major functionality',
      value: true,
      format: 'checkbox',
    },
    {
      field: '- [ ] Test document sets comprehensive and realistic',
      value: true,
      format: 'checkbox',
    },
    {
      field: '- [ ] End-to-end tests validate complete build process',
      value: true,
      format: 'checkbox',
    },
  ],
});
```

## Benefits

1. **Precise Updates**: No more full document replacements for small changes
2. **Reduced Errors**: Pattern matching prevents accidental content corruption
3. **Better Performance**: Only update what needs changing
4. **Improved UX**: More intuitive API for common operations
5. **Automation Friendly**: Easier to build tools that update documents

## Backward Compatibility

The existing API remains unchanged:

- `replace_content=true` maps to `update_mode="replace"`
- `replace_content=false` maps to `update_mode="append"`
- New functionality requires explicit use of new parameters

## Success Metrics

1. **Accuracy**: 99%+ success rate for pattern-based updates
2. **Performance**: <100ms for typical document updates
3. **Adoption**: 50%+ of update operations use new modes within 3 months
4. **Error Reduction**: 90% fewer duplicate content issues

## Open Questions

1. Should we support update previews/dry-runs?
2. How to handle updates that would create invalid markdown?
3. Should we add undo/redo functionality?
4. What level of regex support is needed?
5. How to handle concurrent updates to the same document?

## Next Steps

1. Review and refine API design
2. Create detailed technical specification
3. Build prototype for pattern matching
4. Gather feedback from early users
5. Implement in phases with continuous testing
