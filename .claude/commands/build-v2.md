# /build - Intelligent Implementation with TDD (v2)

I'll implement your project following the prompt plan, using test-driven development and the enhanced document organization system for better tracking.

## Implementation Process

1. **Context Loading**

   - Read current project state from `context/projects/[project-name]/`
   - Load `plan-implementation-roadmap.md` and `todo-implementation.md`
   - Identify current implementation phase
   - Check for any blocking issues or dependencies

2. **Test-First Development**

   - Write comprehensive tests before implementation
   - Include unit, integration, and e2e tests as appropriate
   - Ensure tests fail initially (red phase)
   - Document test rationale and coverage

3. **Implementation**

   - Write minimal code to pass tests (green phase)
   - Follow existing code style and conventions
   - Use appropriate design patterns
   - Implement error handling and edge cases

4. **Refactoring**

   - Improve code clarity and maintainability
   - Eliminate duplication
   - Enhance performance where needed
   - Maintain test coverage

5. **Progress Tracking with Enhanced Organization**

   ### Document Updates

   I'll maintain progress using the enhanced organization:

   - **Todo Updates**: Update `todo-implementation.md` with completed tasks
   - **Session Reports**: Create `report-build-session-[date].md` for major milestones
   - **Design Documents**: Create `design-[component].md` for architectural decisions

   ### Metadata Management

   Each document will maintain relationships:

   ```yaml
   ---
   title: Build Session Report
   category: projects
   command_type: report
   project: [project-name]
   status: active
   generated_by: /build
   implements: plan-implementation-roadmap.md
   related_docs:
     - todo-implementation.md
     - spec-[project-name].md
   ---
   ```

   ### Conflict Resolution

   If updating existing documents, I'll:

   - Preserve existing metadata
   - Update `modified` timestamp
   - Add new entries to `related_docs`
   - Update status when appropriate

## Claude 4 Optimizations

I'll leverage advanced capabilities:

- **Parallel Tool Usage**: Execute multiple file operations simultaneously
- **Deep Analysis**: Use reflection steps for complex problem solving
- **Contextual Awareness**: Maintain understanding of entire codebase
- **Incremental Progress**: Small, verified steps with continuous testing

## Document Organization

### Session Documentation

When creating session reports, I'll use descriptive names:

- `report-authentication-implementation.md` (not `report-build-20250115.md`)
- `design-api-architecture.md` (not `design-api.md` if it exists)
- `todo-phase-2-features.md` (for new todo lists)

### Linking Strategy

- Always link back to the implementing spec/plan
- Cross-reference related designs and reports
- Maintain bidirectional links where possible

## Best Practices

- **Code Quality**: Follow clean code principles and SOLID design
- **Testing**: Comprehensive coverage with meaningful assertions
- **Documentation**: Update project documents consistently
- **Version Control**: Prepare clear, atomic commits
- **Performance**: Consider efficiency from the start

## Execution Modes

Based on your prompt plan, I can:

1. **Execute Next Step** - Continue from where we left off
2. **Focus on Specific Task** - Jump to a particular implementation item
3. **Review and Continue** - Assess progress before proceeding
4. **Debug and Fix** - Address any failing tests or issues

## Safety Checks

Before implementing, I'll verify:

- All prerequisites are met
- Tests are properly defined
- No breaking changes to existing code
- Dependencies are available
- Project documents are up to date

Let me load your project context and begin implementation...
