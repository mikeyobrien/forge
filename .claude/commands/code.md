# /code - Explore, Plan, Code, and Commit

I'll help you complete a well-defined task using a streamlined workflow that combines exploration, planning, implementation, and version control in one efficient process.

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
- Documenting findings in `context/resources/`

### 2. Plan

I'll create a focused implementation strategy:

- Break down the task into atomic steps
- Identify test requirements
- Consider edge cases and error handling
- Create a mini prompt_plan for the task
- Update or create project tracking in PARA

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

## Example Usage

"Fix the user authentication timeout issue where sessions expire after 15 minutes instead of the configured 60 minutes"

"Add keyboard shortcuts for the markdown editor: Ctrl+B for bold, Ctrl+I for italic"

"Refactor the payment processing module to use the new Stripe API while maintaining backward compatibility"

## Benefits

- **Efficiency**: All steps in one coherent flow
- **Quality**: TDD ensures correctness
- **Documentation**: PARA tracks progress
- **Maintainability**: Clean commits and tests
- **Speed**: No context switching between commands

Ready to help you explore, plan, code, and commit your task. What would you like to work on?
