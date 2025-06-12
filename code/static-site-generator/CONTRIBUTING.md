# Contributing to para-ssg

Thank you for your interest in contributing to para-ssg! This document provides guidelines for contributing to the project.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use a clear, descriptive title**
3. **Provide detailed reproduction steps**
4. **Include system information** (OS, Rust version, etc.)
5. **Add relevant labels** to categorize the issue

#### Bug Reports

Include:

- Steps to reproduce the issue
- Expected vs. actual behavior
- Error messages (with `--verbose` flag output)
- Sample input files (if applicable)
- System environment details

#### Feature Requests

Include:

- Clear description of the proposed feature
- Use cases and motivation
- Possible implementation approach
- Impact on existing functionality

### Development Setup

#### Prerequisites

- Rust 1.70+ (latest stable recommended)
- Git
- Make (for development workflows)

#### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd para-ssg

# Setup development environment
make setup-dev

# Run tests to ensure everything works
make test

# Build the project
make build
```

#### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit code ...

# Run all checks before committing
make check

# Commit your changes
git commit -m "feat: add your feature description"

# Push and create a pull request
git push origin feature/your-feature-name
```

### Code Style and Standards

#### Rust Conventions

- Follow standard Rust naming conventions
- Use `cargo fmt` for code formatting
- Address all `cargo clippy` warnings
- Write comprehensive documentation comments
- Include unit tests for new functionality

#### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(parser): add support for custom frontmatter fields
fix(wiki-links): resolve case-sensitivity issue in link resolution
docs: update README with deployment examples
test(integration): add tests for large document sets
```

#### Code Organization

- **Add ABOUTME comments** to new files:

  ```rust
  // ABOUTME: This module handles wiki link parsing and resolution
  // ABOUTME: It provides functions to extract links and match them to documents
  ```

- **Follow module structure**:

  ```
  src/
  ├── parser/     # Document parsing and content extraction
  ├── generator/  # HTML and site generation
  ├── theme/      # Templates, styles, and JavaScript
  └── utils/      # Utilities and helper functions
  ```

- **Error handling**: Use `thiserror` for custom error types
- **Testing**: Place unit tests in the same file, integration tests in `tests/`

### Testing Guidelines

#### Running Tests

```bash
# All tests
cargo test

# Specific module
cargo test wiki_links

# Integration tests only
cargo test --test integration

# With output
cargo test -- --nocapture

# Run with Makefile
make test
```

#### Writing Tests

- **Unit tests** for individual functions
- **Integration tests** for complete workflows
- **Property-based tests** for complex logic
- **Performance tests** for optimization validation

#### Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_descriptive_name() {
        // Arrange
        let input = "test input";

        // Act
        let result = function_under_test(input);

        // Assert
        assert_eq!(result, expected_output);
    }
}
```

### Pull Request Process

#### Before Submitting

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features or bug fixes
3. **Run all checks**: `make check`
4. **Update CHANGELOG.md** if appropriate
5. **Rebase on latest main** to ensure clean history

#### Pull Request Template

When creating a pull request, include:

- **Clear title** describing the change
- **Description** of what the PR does and why
- **Testing notes** - how you tested the changes
- **Breaking changes** - any backwards incompatible changes
- **Related issues** - link to relevant issues

#### Review Process

1. **Automated checks** must pass (tests, linting, formatting)
2. **Code review** by maintainers
3. **Documentation review** for user-facing changes
4. **Testing validation** on different platforms
5. **Final approval** and merge

### Documentation

#### Types of Documentation

- **Code comments** - Inline documentation for complex logic
- **API documentation** - Rust doc comments for public APIs
- **User documentation** - README, guides, examples
- **Developer documentation** - Architecture decisions, design docs

#### Writing Guidelines

- **Clear and concise** - Avoid unnecessary complexity
- **Example-driven** - Show practical usage
- **Up-to-date** - Keep documentation synchronized with code
- **Accessible** - Consider different skill levels

#### API Documentation

````rust
/// Parses wiki links from markdown content.
///
/// This function extracts all wiki links in the format `[[link]]` or
/// `[[link|display]]` from the provided markdown text.
///
/// # Arguments
///
/// * `content` - The markdown content to parse
///
/// # Returns
///
/// A vector of `WikiLink` structs representing the found links.
///
/// # Examples
///
/// ```rust
/// let content = "See [[other-document]] for more info.";
/// let links = parse_wiki_links(content);
/// assert_eq!(links.len(), 1);
/// assert_eq!(links[0].target, "other-document");
/// ```
pub fn parse_wiki_links(content: &str) -> Vec<WikiLink> {
    // Implementation...
}
````

### Performance Considerations

#### Guidelines

- **Profile before optimizing** - Use data to guide decisions
- **Maintain readability** - Don't sacrifice clarity for minor gains
- **Test performance** - Include benchmarks for critical paths
- **Document trade-offs** - Explain performance decisions

#### Benchmarking

```rust
#[cfg(test)]
mod benchmarks {
    use super::*;
    use std::time::Instant;

    #[test]
    fn bench_large_document_set() {
        let start = Instant::now();
        // ... benchmark code ...
        let duration = start.elapsed();
        println!("Processing took: {:?}", duration);
    }
}
```

### Architecture Decisions

#### Adding New Features

Consider:

- **Backwards compatibility** - Don't break existing functionality
- **Configuration** - Should the feature be configurable?
- **Performance impact** - How does it affect build times?
- **Testing strategy** - How will you verify it works?
- **Documentation needs** - What docs need updating?

#### Design Principles

- **Simplicity** - Prefer simple solutions over complex ones
- **Modularity** - Keep components loosely coupled
- **Testability** - Design for easy testing
- **Performance** - Consider performance implications
- **Maintainability** - Code should be easy to maintain

### Release Process

#### Version Planning

- **Patch releases** - Bug fixes and small improvements
- **Minor releases** - New features, backwards compatible
- **Major releases** - Breaking changes, architecture updates

#### Release Checklist

1. Update version numbers in `Cargo.toml`
2. Update `CHANGELOG.md` with release notes
3. Run full test suite on multiple platforms
4. Update documentation
5. Create release tag
6. Publish to crates.io (if applicable)
7. Update deployment examples

### Getting Help

#### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Email** - For security issues or private matters

#### Learning Resources

- **Rust Documentation** - https://doc.rust-lang.org/
- **Rust Book** - https://doc.rust-lang.org/book/
- **para-ssg Examples** - See `examples/` directory
- **Integration Tests** - See `tests/` directory

### Recognition

Contributors will be recognized in:

- `CONTRIBUTORS.md` file
- Release notes for significant contributions
- GitHub contributors list

Thank you for helping make para-ssg better!
