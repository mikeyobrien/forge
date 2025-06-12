---
title: 'Prompt Plan: Context Update Tool Enhancement'
category: projects
status: active
created: 2025-06-12T00:53:12.258Z
modified: 2025-06-12T00:53:12.258Z
tags:
  - prompt-plan
  - systematic
  - development
  - mcp
  - context-manager
---

# Prompt Plan: Context Update Tool Enhancement

## Created: 2025-06-11 22:00:00

## Project Overview

### Objective

Enhance the MCP context-manager's update tool to support intelligent, pattern-based updates that can modify specific parts of documents without affecting others, solving issues like duplicate content and enabling precise in-place updates.

### Technical Context

- **Language**: TypeScript/JavaScript
- **Framework**: MCP (Model Context Protocol) SDK
- **Testing**: Jest/Mocha with comprehensive unit and integration tests
- **Integration**: Existing context-manager MCP server
- **Constraints**: Must maintain backward compatibility with existing API

### Success Definition

A fully enhanced context update tool that can perform pattern-based updates, section-aware modifications, structured field updates, and smart merging while maintaining 100% backward compatibility with the existing API.

## Prompt Sequence

### Phase 1: Core Pattern Matching Engine

**Goal**: Establish the foundation for pattern-based find/replace functionality

#### Prompt 1.1: Pattern Matching Infrastructure

**Status**: ⏳ Not Started
**Objective**: Create core pattern matching engine with regex support
**Deliverables**:

- [ ] Pattern matching module with TypeScript interfaces
- [ ] Regex and string pattern support
- [ ] Occurrence control (first/last/all)
- [ ] Case sensitivity options
- [ ] Unit tests for pattern matching

**Prompt**:

```
Create a pattern matching engine for the context-manager MCP tool. Implement in TypeScript:
1. Define interfaces for PatternUpdate with pattern (string|RegExp), replacement, occurrence control
2. Create PatternMatcher class with findMatches() and applyReplacements() methods
3. Support first/last/all occurrence modes and case sensitivity
4. Handle edge cases: multiline patterns, special characters, overlapping matches
5. Write comprehensive unit tests covering all pattern types and edge cases
6. Ensure the module is reusable and well-documented
```

**Success Criteria**:

- [ ] PatternMatcher class handles string and regex patterns
- [ ] Occurrence modes work correctly (first/last/all)
- [ ] Case sensitivity toggle functions properly
- [ ] All unit tests pass with 100% coverage
- [ ] Module exports clean TypeScript interfaces
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 1.2: Pattern Replacement Engine

**Status**: ⏳ Not Started
**Objective**: Implement safe pattern replacement with rollback capability
**Dependencies**: [Requires Prompt 1.1]
**Deliverables**:

- [ ] Replacement engine with validation
- [ ] Rollback/undo functionality
- [ ] Preview mode for replacements
- [ ] Performance optimization for large documents
- [ ] Integration tests with real content

**Prompt**:

```
Extend the pattern matching engine with safe replacement functionality:
1. Create ReplacementEngine class that uses PatternMatcher
2. Implement applyPatternUpdates() with atomic operations
3. Add validation to ensure replacements don't break document structure
4. Create preview mode that shows changes without applying them
5. Optimize for performance with large documents (>10MB)
6. Write integration tests using sample markdown documents
7. Add proper error handling and descriptive error messages
```

**Success Criteria**:

- [ ] Replacements are atomic (all or nothing)
- [ ] Preview mode accurately shows changes
- [ ] Performance: <100ms for typical documents
- [ ] Validation prevents invalid markdown
- [ ] Integration tests pass with various document types
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

### Phase 2: Section-Aware Document Parsing

**Goal**: Enable updates within specific markdown sections and subsections

#### Prompt 2.1: Markdown Section Parser

**Status**: ⏳ Not Started
**Objective**: Parse markdown documents into hierarchical section structure
**Dependencies**: [Requires Prompt 1.2]
**Deliverables**:

- [ ] Section parser for markdown headers
- [ ] Hierarchical section tree structure
- [ ] Section content extraction
- [ ] Support for nested sections
- [ ] Unit tests for various markdown formats

**Prompt**:

```
Create a markdown section parser for the context update tool:
1. Implement MarkdownSectionParser class that parses headers (# to ######)
2. Build hierarchical SectionNode tree with title, level, content, children
3. Support section extraction by path (e.g., "Phase 1/Prompt 1.1")
4. Handle edge cases: sections without content, duplicate names, special characters
5. Create getSectionContent() and setSectionContent() methods
6. Write unit tests covering various markdown structures and edge cases
```

**Success Criteria**:

- [ ] Parser correctly identifies all header levels
- [ ] Section hierarchy accurately represents document structure
- [ ] Section extraction works with nested paths
- [ ] Content boundaries correctly identified
- [ ] Unit tests cover all markdown variations
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 2.2: Section-Based Update Engine

**Status**: ⏳ Not Started
**Objective**: Implement section-aware content updates
**Dependencies**: [Requires Prompt 2.1]
**Deliverables**:

- [ ] Section update functionality
- [ ] Subsection support
- [ ] Section operations (replace/append/prepend)
- [ ] Section creation if missing
- [ ] Integration with pattern engine

**Prompt**:

```
Build section-based update functionality:
1. Create SectionUpdateEngine using MarkdownSectionParser
2. Implement updateSection() with operation modes (replace/append/prepend)
3. Support subsection updates with path notation
4. Add createSectionIfMissing option for new sections
5. Integrate with PatternMatcher for section-scoped pattern updates
6. Write integration tests simulating real update scenarios
7. Ensure updates preserve document formatting and structure
```

**Success Criteria**:

- [ ] Section updates work for all header levels
- [ ] Operations correctly replace/append/prepend content
- [ ] Missing sections can be created automatically
- [ ] Pattern updates can be scoped to sections
- [ ] Document structure preserved after updates
- [ ] Integration tests pass
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

### Phase 3: Structured Field Updates

**Goal**: Support updates to YAML frontmatter, checkboxes, and structured content

#### Prompt 3.1: YAML Frontmatter Updates

**Status**: ⏳ Not Started
**Objective**: Enable precise updates to YAML frontmatter fields
**Dependencies**: [Requires Prompt 2.2]
**Deliverables**:

- [ ] YAML frontmatter parser and updater
- [ ] Field-level update support
- [ ] Type preservation (string/number/boolean/array)
- [ ] Nested field updates
- [ ] Frontmatter validation

**Prompt**:

```
Implement YAML frontmatter field updates:
1. Create FrontmatterUpdater class using existing YAML parser
2. Support field updates preserving types and structure
3. Handle nested fields with dot notation (e.g., "metadata.tags")
4. Preserve formatting and comments in YAML
5. Add validation for field types and required fields
6. Support array operations (add/remove/replace items)
7. Write comprehensive tests for various frontmatter structures
```

**Success Criteria**:

- [ ] Individual fields can be updated without affecting others
- [ ] Field types are preserved correctly
- [ ] Nested fields accessible via dot notation
- [ ] YAML formatting and comments preserved
- [ ] Array operations work correctly
- [ ] All tests pass
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 3.2: Checkbox and List Updates

**Status**: ⏳ Not Started
**Objective**: Support toggling checkboxes and updating list items
**Dependencies**: [Requires Prompt 3.1]
**Deliverables**:

- [ ] Checkbox state parser and toggler
- [ ] List item updates by content or index
- [ ] Ordered/unordered list support
- [ ] Nested list handling
- [ ] Batch checkbox operations

**Prompt**:

```
Create checkbox and list update functionality:
1. Implement CheckboxUpdater for markdown task lists
2. Support finding checkboxes by content pattern or index
3. Toggle checkbox states (checked/unchecked)
4. Create ListItemUpdater for ordered/unordered lists
5. Support updating list items by content match or position
6. Handle nested lists correctly
7. Add batch operations for multiple checkboxes
8. Write tests covering various list formats
```

**Success Criteria**:

- [ ] Checkboxes can be toggled by content or index
- [ ] List items can be updated precisely
- [ ] Nested lists handled correctly
- [ ] Batch operations work efficiently
- [ ] Original formatting preserved
- [ ] Tests cover all list variations
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

### Phase 4: Smart Merge Engine

**Goal**: Implement intelligent content merging with conflict resolution

#### Prompt 4.1: Diff and Merge Algorithms

**Status**: ⏳ Not Started
**Objective**: Create core diff/merge functionality
**Dependencies**: [Requires Prompt 3.2]
**Deliverables**:

- [ ] Line-based diff algorithm
- [ ] Three-way merge implementation
- [ ] Conflict detection
- [ ] Merge strategies (ours/theirs/manual)
- [ ] Diff visualization for previews

**Prompt**:

```
Implement smart merge engine core:
1. Create DiffEngine with line-based diff algorithm
2. Implement three-way merge for content conflicts
3. Add conflict detection with clear markers
4. Support merge strategies: ours, theirs, manual
5. Create diff visualization for preview mode
6. Handle special cases: YAML frontmatter, sections, lists
7. Write comprehensive tests with conflict scenarios
```

**Success Criteria**:

- [ ] Diff algorithm correctly identifies changes
- [ ] Three-way merge handles common scenarios
- [ ] Conflicts clearly marked and reported
- [ ] Merge strategies work as expected
- [ ] Preview shows accurate diff visualization
- [ ] Tests cover various merge scenarios
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 4.2: Content-Aware Merging

**Status**: ⏳ Not Started
**Objective**: Implement smart merging for specific content types
**Dependencies**: [Requires Prompt 4.1]
**Deliverables**:

- [ ] YAML-aware merging
- [ ] Section-aware merging
- [ ] List merging with order preservation
- [ ] Wiki link resolution during merge
- [ ] Merge validation and cleanup

**Prompt**:

```
Extend merge engine with content awareness:
1. Create YAMLMerger for intelligent frontmatter merging
2. Implement SectionMerger preserving document structure
3. Add ListMerger handling order and duplicates
4. Create WikiLinkResolver for link conflicts
5. Add post-merge validation and cleanup
6. Support custom merge rules per content type
7. Write integration tests with real document merges
```

**Success Criteria**:

- [ ] YAML merging preserves structure and types
- [ ] Section merging maintains hierarchy
- [ ] Lists merge intelligently without duplicates
- [ ] Wiki links resolved correctly
- [ ] Validation ensures valid output
- [ ] Integration tests pass
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

### Phase 5: API Integration

**Goal**: Integrate all functionality into the MCP context-manager API

#### Prompt 5.1: API Design and Implementation

**Status**: ⏳ Not Started
**Objective**: Create new API endpoints maintaining backward compatibility
**Dependencies**: [Requires Prompt 4.2]
**Deliverables**:

- [ ] Extended context_update API
- [ ] New parameter validation
- [ ] Backward compatibility layer
- [ ] API documentation
- [ ] Type definitions

**Prompt**:

```
Integrate enhanced functionality into MCP API:
1. Extend context_update tool with new parameters
2. Add update_mode enum (replace/append/patch/merge/in_place)
3. Implement parameter validation for all update types
4. Create backward compatibility mapping for existing params
5. Update TypeScript type definitions
6. Write comprehensive API documentation
7. Add API integration tests
```

**Success Criteria**:

- [ ] New API accepts all update modes
- [ ] Parameter validation prevents invalid requests
- [ ] Existing API calls continue working
- [ ] Type definitions accurate and complete
- [ ] Documentation clear with examples
- [ ] Integration tests verify all modes
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 5.2: Error Handling and Responses

**Status**: ⏳ Not Started
**Objective**: Implement comprehensive error handling and response formatting
**Dependencies**: [Requires Prompt 5.1]
**Deliverables**:

- [ ] Detailed error messages
- [ ] Update result reporting
- [ ] Rollback on failures
- [ ] Warning system for non-critical issues
- [ ] Response formatting

**Prompt**:

```
Implement robust error handling and responses:
1. Create detailed error types for each failure mode
2. Add descriptive error messages with fix suggestions
3. Implement transaction rollback on failures
4. Create warning system for non-critical issues
5. Design comprehensive response format with changes summary
6. Add dry-run mode for testing updates
7. Write tests for all error scenarios
```

**Success Criteria**:

- [ ] Error messages clearly explain issues
- [ ] Rollback works correctly on failures
- [ ] Warnings don't stop valid updates
- [ ] Response includes detailed change summary
- [ ] Dry-run mode accurately predicts results
- [ ] Error handling tests comprehensive
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

### Phase 6: Testing and Optimization

**Goal**: Ensure reliability, performance, and production readiness

#### Prompt 6.1: Comprehensive Test Suite

**Status**: ⏳ Not Started
**Objective**: Create exhaustive test coverage for all functionality
**Dependencies**: [Requires Prompt 5.2]
**Deliverables**:

- [ ] Unit tests for all modules
- [ ] Integration tests for workflows
- [ ] Performance benchmarks
- [ ] Edge case coverage
- [ ] Test documentation

**Prompt**:

```
Build comprehensive test suite:
1. Achieve 95%+ code coverage with unit tests
2. Create integration tests for common workflows
3. Add performance benchmarks for large documents
4. Test edge cases: empty docs, huge files, special characters
5. Create test fixtures representing real documents
6. Add stress tests for concurrent updates
7. Document test scenarios and coverage
```

**Success Criteria**:

- [ ] Code coverage exceeds 95%
- [ ] All integration tests pass
- [ ] Performance meets <100ms target
- [ ] Edge cases handled gracefully
- [ ] Stress tests show no race conditions
- [ ] Test documentation complete
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 6.2: Performance Optimization

**Status**: ⏳ Not Started
**Objective**: Optimize performance for production use
**Dependencies**: [Requires Prompt 6.1]
**Deliverables**:

- [ ] Performance profiling results
- [ ] Optimized algorithms
- [ ] Caching implementation
- [ ] Memory usage optimization
- [ ] Production deployment guide

**Prompt**:

```
Optimize for production performance:
1. Profile all operations identifying bottlenecks
2. Optimize pattern matching with better algorithms
3. Implement caching for parsed document structures
4. Reduce memory usage for large documents
5. Add streaming support for huge files
6. Create performance monitoring hooks
7. Write production deployment guide
8. Document performance characteristics
```

**Success Criteria**:

- [ ] All operations complete in <100ms
- [ ] Memory usage stays under 100MB
- [ ] Large files (>10MB) handled efficiently
- [ ] Caching improves repeat operations by 50%+
- [ ] Production guide comprehensive
- [ ] Performance documented
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

#### Prompt 6.3: Documentation and Release

**Status**: ⏳ Not Started
**Objective**: Complete documentation and prepare for release
**Dependencies**: [Requires Prompt 6.2]
**Deliverables**:

- [ ] User documentation
- [ ] Migration guide
- [ ] API reference
- [ ] Example collection
- [ ] Release notes

**Prompt**:

```
Finalize documentation and release preparation:
1. Write comprehensive user documentation with examples
2. Create migration guide from old to new API
3. Generate complete API reference documentation
4. Build example collection for common use cases
5. Write detailed release notes with breaking changes
6. Create quick start guide for new users
7. Add troubleshooting section
8. Prepare version tags and changelog
```

**Success Criteria**:

- [ ] User docs cover all features with examples
- [ ] Migration guide helps existing users upgrade
- [ ] API reference complete and accurate
- [ ] 20+ examples covering common scenarios
- [ ] Release notes detail all changes
- [ ] Documentation reviewed and polished
- [ ] Ready for release
- [ ] Changes committed to git

**Completion**: _[Timestamp when completed]_
**Notes**: _[Any notes from implementation]_

---

## Execution Instructions

When using this plan with Claude Code, use this exact prompt for each session:

```
1. Open @projects/context-update-tool-enhancement-prompt-plan.md and identify the next unfinished prompt (Status: ⏳ Not Started)
2. For the next incomplete prompt:
   - Verify if truly unfinished by checking the Success Criteria
   - Implement exactly as described in the prompt section
   - Ensure all deliverables are completed
   - Ensure all success criteria are met
   - Run tests and verify they pass
   - Run linting and formatting checks
   - Commit changes to repository with descriptive commit message (no --no-verify)
   - Update the prompt plan to mark as completed (Status: ✅ Complete) with timestamp and notes
3. Pause after completing the prompt for user review
4. Ask if ready to proceed with next unfinished prompt
```

## Progress Tracking

### Overall Progress

- **Total Prompts**: 15
- **Completed**: 0 ✅
- **In Progress**: 0 🔄
- **Not Started**: 15 ⏳

### Status Legend

- ⏳ **Not Started**: Ready to be implemented
- 🔄 **In Progress**: Currently being worked on
- ✅ **Complete**: Fully implemented and verified
- ❌ **Blocked**: Cannot proceed due to dependency
- ⚠️ **Needs Review**: Implemented but needs verification

## Quality Gates

Each prompt must pass these gates before marking complete:

- [ ] All deliverables achieved
- [ ] All success criteria met
- [ ] Tests written and passing
- [ ] Code follows TypeScript/MCP conventions
- [ ] Changes committed to git (no --no-verify)
- [ ] Documentation updated where needed
- [ ] Performance targets met

## Completion Criteria

The entire prompt plan is complete when:

- [ ] All 15 prompts marked as ✅ Complete
- [ ] Final integration testing passed
- [ ] API maintains 100% backward compatibility
- [ ] Performance meets all targets
- [ ] Documentation is comprehensive
- [ ] Ready for production deployment

---

_Use this systematic plan to enhance the context update tool incrementally with full testing and validation at each step_
