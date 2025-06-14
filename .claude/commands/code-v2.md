# /code - Explore, Plan, Code, and Commit (v2)

I'll help you complete a well-defined task using a streamlined workflow with enhanced document organization for better tracking and findability.

## Workflow Overview

This command is perfect for:

- Bug fixes with clear reproduction steps
- Small feature additions to existing code
- Refactoring specific components
- Adding tests to existing functionality
- Performance optimizations with clear targets

## Process Steps

### 1. Explore

I'll thoroughly understand the task by:

- Analyzing the codebase structure
- Locating relevant files and components
- Understanding existing patterns and conventions
- Identifying dependencies and integration points

**Documentation**: Create exploration findings in:

- `context/projects/[project-name]/report-exploration-[feature].md` (for project work)
- `context/resources/report-analysis-[topic].md` (for general research)

### 2. Plan

I'll create a focused implementation strategy:

- Break down the task into atomic steps
- Identify test requirements
- Consider edge cases and error handling

**Documentation**: Create mini plans as:

- `context/projects/[project-name]/plan-[feature]-implementation.md`
- Include metadata linking to related specs and designs

### 3. Code with TDD

I'll implement the solution systematically:

- Write failing tests first (red phase)
- Implement minimal code to pass (green phase)
- Refactor for quality (refactor phase)
- Ensure no regressions in existing tests
- Follow project conventions and style

### 4. Verify

I'll ensure quality through:

- Running all test suites
- Checking for linting issues
- Verifying performance impact
- Testing edge cases manually
- Updating documentation as needed

### 5. Commit

I'll prepare professional commits:

- Stage relevant changes
- Write clear, descriptive commit messages
- Include context about why, not just what
- Reference any related issues
- Prepare for clean Git history

### 6. Document with Enhanced Organization

I'll create a comprehensive session summary:

**Path**: `context/projects/[project-name]/report-code-session-[feature].md`

**Metadata**:

```yaml
---
title: Code Session Report - [Feature Name]
category: projects
created: [timestamp]
modified: [timestamp]
tags: [relevant tags]
command_type: report
project: [project-name]
status: completed
generated_by: /code
implements: [related plan/spec if any]
related_docs:
  - [exploration report]
  - [mini plan]
  - [test files created]
context_source:
  - [files analyzed]
---
```

**Content**:

- Summary of changes made
- Key decisions and rationale
- Test coverage added
- Performance considerations
- Total conversation turns
- Efficiency insights
- Possible improvements

## Enhanced Organization Benefits

### Consistent Naming

- No dates in filenames
- Descriptive names that indicate content
- Type prefixes for easy identification

### Smart Conflict Resolution

If documents exist:

- `report-code-session-auth.md` exists?
- Create: `report-code-session-auth-oauth-integration.md`

### Rich Metadata

- Track which plan/spec was implemented
- Link to all related documents
- Record source files analyzed
- Maintain project context

### Project Grouping

All documents for a feature stay together:

```
projects/auth-system/
  ├── spec-oauth-integration.md
  ├── plan-oauth-implementation.md
  ├── report-exploration-oauth-providers.md
  ├── design-oauth-flow.md
  └── report-code-session-oauth.md
```

## Task Execution

To use this command effectively, please provide:

1. **Clear task description** - What needs to be done
2. **Success criteria** - How we'll know it's complete
3. **Any constraints** - Performance, compatibility, etc.
4. **Context** - Related issues, previous attempts, etc.

## Claude 4 Optimizations

This workflow leverages:

- **Parallel exploration** - Simultaneous file analysis
- **Efficient planning** - Minimal but sufficient documentation
- **Smart implementation** - Following existing patterns
- **Comprehensive testing** - Appropriate to task complexity
- **Clean commits** - Professional Git practices
- **Enhanced tracking** - Better document organization

## Example Usage

"Fix the user authentication timeout issue where sessions expire after 15 minutes instead of the configured 60 minutes"

"Add keyboard shortcuts for the markdown editor: Ctrl+B for bold, Ctrl+I for italic"

"Refactor the payment processing module to use the new Stripe API while maintaining backward compatibility"

Ready to help you explore, plan, code, and commit your task with enhanced organization. What would you like to work on?
