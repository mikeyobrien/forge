# /spec - Interactive Specification Builder (v2)

I'll help you develop a thorough specification through interactive conversation, using the enhanced document organization system for better structure and tracking.

## Process Overview

I'll ask you one question at a time to systematically explore and refine your idea. Each question builds on your previous answers, ensuring we capture all important details. My questions will cover:

- Core functionality and user needs
- Technical requirements and constraints
- Success criteria and measurable outcomes
- Potential challenges and edge cases
- Integration points and dependencies
- Performance and scalability considerations
- Security and error handling needs

## Enhanced Document Organization

Before we begin, I'll set up proper project structure:

1. **Project Folder**: Create `context/projects/[project-name]/` if needed
2. **Specification Document**: Save to `context/projects/[project-name]/spec-[project-name].md`
3. **Metadata Tracking**: Include comprehensive frontmatter for relationships
4. **No Date Suffixes**: Use descriptive names instead of timestamps

### Document Structure

**Path**: `context/projects/[project-name]/spec-[project-name].md`

**Metadata**:

```yaml
---
title: [Project Name] Specification
category: projects
created: [timestamp]
modified: [timestamp]
tags: [domain-specific tags]
command_type: spec
project: [project-name]
status: active
generated_by: /spec
related_docs: []  # Will be updated as we create more documents
context_source: []  # Source materials referenced
---
```

### Naming Strategy

If specification already exists:

- First attempt: `spec-[project-name]-v2.md`
- More specific: `spec-[project-name]-[key-feature].md`
- Even more specific: `spec-[project-name]-[feature]-[aspect].md`

## Deliverables

At the end of our specification session, you'll have:

- **Comprehensive Specification**: Developer-ready document with all details
- **Clear Structure**: Problem, solution, requirements, and constraints
- **Rich Metadata**: Proper categorization and relationships
- **Project Setup**: Folder structure ready for implementation
- **Clean Organization**: No date clutter, clear naming

### Specification Sections

1. **Executive Summary**

   - Problem statement
   - Proposed solution
   - Key benefits

2. **Requirements**

   - Functional requirements
   - Non-functional requirements
   - Acceptance criteria

3. **Technical Considerations**

   - Architecture overview
   - Technology choices
   - Integration points

4. **Constraints & Risks**

   - Known limitations
   - Potential challenges
   - Mitigation strategies

5. **Success Metrics**
   - Measurable outcomes
   - Performance targets
   - Quality indicators

## Interactive Process

### Question Flow

1. Start with the problem/opportunity
2. Explore user needs and context
3. Define success criteria
4. Identify technical requirements
5. Consider edge cases and risks
6. Establish constraints and scope
7. Plan for integration and deployment

### Conversation Tracking

- I'll document our entire conversation
- Key decisions will be highlighted
- Alternatives considered will be noted
- Rationale for choices will be captured

## Project Tracking

As we develop the specification, I'll also:

1. **Create Project Index**: `context/projects/[project-name]/index.md`
2. **Link Related Resources**: Connect to existing documentation
3. **Prepare for Next Steps**: Set up for /plan command

## Getting Started

Let's begin with understanding the core of your idea.

**What problem are you trying to solve, or what opportunity are you looking to capture?**

Please describe it in your own words - don't worry about being too technical or perfectly organized yet. I'll help structure and refine it through our conversation.

Once we're done, I'll save the specification with proper organization and ask if you'd like to:

1. Create a GitHub repository
2. Generate an implementation plan
3. Set up initial project structure

Your specification will be saved in an organized, findable location with rich metadata for future reference.
