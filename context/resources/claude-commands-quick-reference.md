---
title: Claude Commands Quick Reference
category: resources
created: 2025-06-12T04:03:03.633Z
modified: 2025-06-12T04:03:03.633Z
tags:
  - claude
  - commands
  - quick-reference
  - cheatsheet
---

# Claude Commands Quick Reference

## Command Overview

| Command         | Purpose                            | When to Use                        |
| --------------- | ---------------------------------- | ---------------------------------- |
| `/spec`         | Build specifications interactively | Starting new projects or features  |
| `/plan`         | Create implementation roadmaps     | After specification, before coding |
| `/build`        | Execute prompt plans with TDD      | When you have an existing plan     |
| `/code`         | All-in-one task completion         | Bug fixes, small features          |
| `/review`       | Code review and refactoring        | After implementation, before merge |
| `/validate-mcp` | Test MCP server tools              | After MCP changes or setup         |

## Quick Command Syntax

```bash
# Start a new project
/spec
# Follow interactive prompts to define requirements

# Plan implementation
/plan
# Creates spec.md, prompt_plan.md, and todo.md

# Execute the plan
/build
# Implements with TDD following prompt_plan.md

# Quick task execution
/code "Fix authentication timeout bug"
# Explores, plans, codes, tests, and commits

# Review recent changes
/review
# Analyzes code quality and suggests improvements

# Validate MCP tools
/validate-mcp
# Runs all MCP tool validation tests
```

## Workflow Patterns

### New Project

```
/spec → /plan → /build → /review
```

### Bug Fix

```
/code → (optional) /review
```

### Feature Addition

```
/spec → /plan → /build → /review
```

or for small features:

```
/code → /review
```

### Refactoring

```
/review → /code
```

## Key Benefits

- **Efficiency**: Commands handle multiple steps automatically
- **Quality**: Built-in TDD and review processes
- **Organization**: Automatic PARA integration
- **Documentation**: Progress tracked in context/
- **Best Practices**: Claude 4 optimizations built-in

## Tips

1. Use `/spec` when requirements are unclear
2. Use `/code` for well-defined, small tasks
3. Always `/review` before important merges
4. Run `/validate-mcp` after context system changes
5. Commands update PARA structure automatically
