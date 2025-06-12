---
title: Claude Commands Reference
category: resources
created: 2025-06-12T04:02:45.197Z
modified: 2025-06-12T04:02:45.197Z
tags:
  - claude
  - commands
  - reference
  - documentation
  - workflow
---

# Claude Commands Reference

This document provides a comprehensive reference for all Claude commands available in the `/why` project. Each command is designed to streamline specific development workflows using Claude 4 best practices.

## Available Commands

### /build - Intelligent Implementation with TDD

**Purpose**: Implement your project following the prompt plan, using test-driven development and Claude 4 best practices.

**Key Features**:

- Context loading from PARA structure
- Test-first development approach
- Incremental implementation with continuous testing
- Progress tracking via todo.md
- Parallel tool usage for efficiency

**Use Cases**:

- Continuing implementation from a prompt plan
- Executing the next step in your project
- Debugging and fixing failing tests
- Implementing specific features with TDD

**Process**:

1. Loads project context and current state
2. Writes comprehensive tests before implementation
3. Implements minimal code to pass tests
4. Refactors for quality and maintainability
5. Updates progress tracking

### /code - Explore, Plan, Code, and Commit

**Purpose**: Complete well-defined tasks using a streamlined workflow combining exploration, planning, implementation, and version control.

**Key Features**:

- All-in-one workflow for small to medium tasks
- Thorough codebase exploration
- Mini prompt planning for focused tasks
- TDD implementation
- Professional commit preparation

**Use Cases**:

- Bug fixes with clear reproduction steps
- Small feature additions
- Component refactoring
- Adding tests to existing functionality
- Performance optimizations

**Process**:

1. Explore - Analyze codebase and understand context
2. Plan - Create focused implementation strategy
3. Code - Implement with TDD approach
4. Verify - Run tests and quality checks
5. Commit - Prepare professional Git commits

### /plan - Strategic Planning with Implementation Roadmap

**Purpose**: Create comprehensive implementation plans from specifications, breaking work into manageable, testable chunks.

**Key Features**:

- Technical architecture design
- Ordered implementation sequence
- Testing strategy with TDD approach
- Measurable success criteria
- Multiple planning artifacts generation

**Use Cases**:

- New project planning from specification
- Complex feature implementation planning
- Architectural design decisions
- Breaking down large tasks

**Deliverables**:

- `spec.md` - Refined specification with technical details
- `prompt_plan.md` - Step-by-step implementation prompts
- `todo.md` - Actionable task list
- Updated project files with milestones

**Execution Modes**:

1. Test-Driven Development - For critical systems
2. Rapid Prototyping - For MVPs
3. Learning Project - For new technologies

### /review - Code Review and Refactoring

**Purpose**: Perform thorough code reviews of recent changes, identifying improvements and ensuring best practices.

**Key Features**:

- Comprehensive change analysis
- Code quality assessment
- Testing coverage review
- Documentation verification
- Security and performance checks

**Review Categories**:

- Architecture & Design
- Code Quality (SOLID, DRY, KISS, YAGNI)
- Security considerations
- Performance optimization opportunities

**Deliverables**:

- Review summary with findings
- Detailed line-by-line feedback
- Prioritized refactoring plan
- Updated documentation

**Refactoring Options**:

1. Quick fixes for immediate issues
2. Code improvements for clarity
3. Architectural change suggestions
4. Test enhancements

### /spec - Interactive Specification Builder

**Purpose**: Develop thorough specifications through interactive conversation, following Harper Reed's approach to idea honing.

**Key Features**:

- One question at a time approach
- Systematic exploration of requirements
- PARA method integration
- Comprehensive documentation
- Risk identification and mitigation

**Topics Covered**:

- Core functionality and user needs
- Technical requirements and constraints
- Success criteria and outcomes
- Edge cases and challenges
- Integration points
- Performance and security

**Deliverables**:

- Developer-ready specification document
- Clear problem statement and solution
- Detailed requirements with acceptance criteria
- Technical considerations
- Risk analysis and mitigation strategies

### /validate-mcp - Validate MCP Server

**Purpose**: Run validation tests for all MCP tools to ensure proper functionality.

**Tests Performed**:

1. `ping` - Basic connectivity test
2. `context_create` - Document creation with PARA categories
3. `context_read` - Document reading with options
4. `context_query_links` - Link relationship queries
5. `context_search` - Advanced search functionality
6. `context_update` - Document and metadata updates
7. `context_move` - Document movement with link updates

## Best Practices

### When to Use Each Command

- **Starting a new project**: Begin with `/spec` to define requirements, then `/plan` to create implementation roadmap
- **Implementing features**: Use `/build` when following an existing plan, or `/code` for standalone tasks
- **Quality assurance**: Run `/review` after completing features or before merging
- **MCP integration**: Use `/validate-mcp` to ensure all context management tools work correctly

### Workflow Examples

#### New Feature Development

1. `/spec` - Define the feature requirements
2. `/plan` - Create implementation strategy
3. `/build` - Execute the plan with TDD
4. `/review` - Ensure quality and best practices

#### Bug Fix Workflow

1. `/code` - Single command for explore, fix, test, and commit
2. `/review` - Optional quality check

#### Refactoring Workflow

1. `/review` - Identify improvement opportunities
2. `/code` - Implement refactoring with tests
3. `/validate-mcp` - If changes affect context management

## Claude 4 Optimizations

All commands leverage Claude 4's advanced capabilities:

- **Parallel Tool Usage**: Execute multiple operations simultaneously
- **Deep Analysis**: Use reflection for complex problem solving
- **Contextual Awareness**: Maintain understanding of entire codebase
- **Efficient Planning**: Minimal but comprehensive documentation
- **Smart Implementation**: Follow existing patterns automatically

## Command Integration with PARA

Commands automatically integrate with the PARA method:

- Projects are tracked in `context/projects/`
- Resources are stored in `context/resources/`
- Areas maintain ongoing concerns
- Archives preserve completed work

Each command updates the appropriate PARA locations to maintain project organization and enable effective knowledge management.
