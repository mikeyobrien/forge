# Step 6: PARA Structure Management - Implementation Plan

## Overview

Implement a robust PARA (Projects, Areas, Resources, Archives) structure management system with TypeScript. This system will handle the organization and categorization of documents within the knowledge base.

## Components to Implement

### 1. PARACategory Enum

- Define enum with Projects, Areas, Resources, Archives values
- Include utility functions for string/enum conversion
- Add validation helpers

### 2. PARAManager Class

Core responsibilities:

- Manage PARA directory structure
- Resolve paths for different categories
- Create and verify directory structure
- Handle document categorization
- Enforce security boundaries (CONTEXT_ROOT)

### 3. Core Methods

- `initializeStructure()`: Create PARA directories if they don't exist
- `getCategoryPath(category: PARACategory)`: Get absolute path for a category
- `resolveDocumentPath(category: PARACategory, documentName: string)`: Build full path
- `moveDocument(from: string, toCategory: PARACategory)`: Move docs between categories
- `getDocumentCategory(path: string)`: Determine which category a document belongs to
- `validateCategory(category: string)`: Check if string is valid PARA category

### 4. Security Features

- Path traversal prevention
- CONTEXT_ROOT boundary enforcement
- Sanitize document names
- Validate all operations stay within allowed directories

### 5. Testing Strategy

- Unit tests for all methods
- Security validation tests
- Mock filesystem for testing
- Integration tests with FileSystem abstraction
- Edge case handling (invalid paths, missing directories)

## Implementation Order

1. Create `src/para/` directory
2. Implement PARACategory enum and utilities
3. Create PARAManager class with constructor
4. Implement path resolution methods
5. Add directory initialization logic
6. Write comprehensive tests
7. Integrate with existing FileSystem abstraction

## Success Criteria

- All PARA categories properly defined
- Path resolution works correctly
- Security boundaries enforced
- 100% test coverage
- Integration with FileSystem abstraction
- Type-safe throughout (no `any` types)
