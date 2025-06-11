# para-ssg

A static site generator for PARA-organized markdown documents.

## Features

- Convert PARA-structured markdown to clean, browsable websites
- Obsidian-compatible wiki link support (`[[document-name]]`)
- Client-side search functionality
- 70s earthy design theme
- Mobile-responsive layout

## Installation

```bash
# Install from source
cargo install --path .

# Or build locally
make build
```

## Usage

```bash
# Generate site from context directory
para-ssg input_dir output_dir

# Example
para-ssg ../context ./dist
```

## Development

```bash
# Setup development environment
make setup-dev

# Run development checks
make check

# Format and lint
make fmt lint

# Run tests
make test

# Build and test example
make example
```

## Project Structure

```
src/
├── main.rs              # CLI entry point
├── lib.rs               # Library exports
├── parser/              # Markdown and frontmatter parsing
├── generator/           # HTML generation and search indexing
├── theme/               # Templates and styling
└── utils/               # Utilities and PARA structure detection
```

## Contributing

1. Run `make check` before committing
2. Follow conventional commit messages
3. Add tests for new features
4. Update documentation as needed

## License

MIT
