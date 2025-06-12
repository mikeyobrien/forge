---
title: 'Claude Command Options for Enhanced Workflow'
category: resources
tags:
  - claude
  - commands
  - workflow
  - options
  - reference
---

# Claude Command Options for Enhanced Workflow

## Option 1: Comprehensive Four-Stage Workflow

_Full journey from idea to implementation with PARA integration_

### Commands:

1. `/brainstorm` - Interactive idea development with Q&A
2. `/design` - Technical architecture and detailed design
3. `/prompt-plan` - Create implementation roadmap with specific prompts
4. `/implement` - Execute steps with TDD approach

### Pros:

- Clear separation of concerns
- Thorough documentation at each stage
- Natural progression from abstract to concrete
- Excellent for complex projects

### Cons:

- May be overkill for simple tasks
- Requires multiple command invocations
- More time investment upfront

---

## Option 2: Dual-Mode Workflow

_Two primary workflows based on task complexity_

### Commands:

1. `/explore-plan-code` - All-in-one for well-defined tasks
   - Explores codebase
   - Creates implementation plan
   - Executes with TDD
   - Commits changes
2. `/ideate` - Comprehensive workflow starter

   - Combines brainstorm + design
   - Outputs spec.md and prompt_plan.md
   - Prepares for implementation

3. `/execute` - Implementation helper
   - Reads prompt_plan.md
   - Implements with TDD
   - Updates progress

### Pros:

- Flexible for different task sizes
- Fewer commands to remember
- Efficient for common use cases

### Cons:

- Less granular control
- May miss nuances of complex projects

---

## Option 3: Harper-Inspired with Claude Enhancements

_Direct adaptation of Harper's workflow with Claude 4 optimizations_

### Commands:

1. `/spec` - Interactive specification builder

   - One question at a time approach
   - Builds comprehensive spec
   - Saves to context/projects/

2. `/plan` - Strategic planning with multiple outputs

   - Generates spec.md
   - Creates prompt_plan.md
   - Produces todo.md
   - Offers TDD or standard approach

3. `/build` - Intelligent implementation

   - Reads all planning documents
   - Uses parallel tool execution
   - Implements incrementally
   - Self-documents progress

4. `/review` - Code review and refactoring
   - Analyzes recent changes
   - Suggests improvements
   - Updates documentation

### Pros:

- Familiar to Harper workflow users
- Clear command purposes
- Comprehensive outputs

### Cons:

- Still requires multiple commands
- May have overlap between spec and plan

---

## Option 4: Context-Aware Progressive Workflow

_Smart commands that adapt based on project state_

### Commands:

1. `/project` - Intelligent project assistant

   - Detects project stage automatically
   - If no context: starts brainstorming
   - If spec exists: creates design
   - If design exists: generates plan
   - If plan exists: begins implementation

2. `/work` - Focused implementation helper

   - Reads current project state
   - Executes next logical step
   - Updates all documentation
   - Maintains PARA structure

3. `/think` - Deep analysis mode
   - For complex problem solving
   - Researches and documents findings
   - Creates decision records
   - Updates resources/

### Pros:

- Minimal commands to remember
- Intelligent context awareness
- Adaptive to project needs
- Reduces cognitive load

### Cons:

- Less explicit control
- May make assumptions
- Harder to skip stages

---

## Option 5: Hybrid Specialist Approach

_Specialized commands for different aspects_

### Commands:

1. `/discover` - Research and exploration

   - Investigates codebase
   - Documents findings in PARA
   - Creates initial project outline

2. `/architect` - Design and planning

   - Creates technical designs
   - Generates implementation strategies
   - Produces all planning artifacts

3. `/tdd` - Test-driven implementation

   - Writes tests first
   - Implements to pass tests
   - Refactors for quality
   - Documents progress

4. `/iterate` - Rapid prototyping

   - Quick implementation cycles
   - Visual feedback integration
   - Fast experimentation

5. `/ship` - Finalization and deployment
   - Final testing
   - Documentation updates
   - Commit preparation
   - Archive completed work

### Pros:

- Specialized tools for each need
- Can mix and match approaches
- Clear command intent
- Supports various workflows

### Cons:

- More commands to learn
- Potential overlap in functionality

---

## Recommendation Factors to Consider:

1. **Your typical project complexity**

   - Simple tasks → Option 2 or 4
   - Complex projects → Option 1 or 3
   - Mixed workload → Option 5

2. **Preference for control vs. automation**

   - High control → Option 1 or 5
   - More automation → Option 4
   - Balance → Option 2 or 3

3. **Team collaboration needs**

   - Solo work → Any option
   - Team work → Option 1 or 3 (more documentation)

4. **Learning curve tolerance**
   - Low → Option 2 or 4
   - High → Option 1 or 5

## Additional Features for All Options:

### Common Enhancements:

- **PARA Integration**: All commands maintain context/ structure
- **Progress Tracking**: Automatic todo.md updates
- **Claude 4 Optimizations**:
  - Parallel tool usage
  - Deep thinking steps
  - Explicit success criteria
- **Visual Integration**: Screenshot analysis and iteration
- **Commit Helpers**: Smart commit message generation

### Shared Utilities:

- `/context` - View current project state
- `/archive` - Move completed projects to archives
- `/resources` - Access and update reference materials

Which option resonates most with your workflow, Sir Hugh? I can also create a custom hybrid based on your specific preferences.
