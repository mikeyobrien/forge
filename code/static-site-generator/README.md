# para-ssg

A high-performance static site generator designed specifically for PARA-organized markdown documents. Convert your knowledge base into a beautiful, searchable website with wiki-style linking and 70s-inspired design.

## Features

- ✅ **PARA Structure Support** - Automatic detection and organization of Projects, Areas, Resources, and Archives
- 🔗 **Obsidian-Compatible Wiki Links** - Full support for `[[document-name]]` and `[[document-name|display text]]` syntax
- 🔍 **Client-Side Search** - Fast, offline search with keyword highlighting and fuzzy matching
- 🎨 **70s Earthy Theme** - Beautiful retro design that's modern and responsive
- 📱 **Mobile-First Design** - Fully responsive layout that works on all devices
- 🔄 **Backlinks System** - Automatic reverse link discovery with context
- ⚡ **High Performance** - Parallel processing with progress reporting for large document sets
- 📊 **Comprehensive Analytics** - Build statistics, link analysis, and validation warnings
- 👁️ **Hot Reload** - Watch mode for automatic rebuilds on file changes

## Quick Start

### Installation

```bash
# Install from source
git clone <repository>
cd para-ssg
cargo install --path .

# Or build locally
make build
```

### Basic Usage

```bash
# Generate website from your PARA context directory
para-ssg /path/to/context ./output

# With verbose output
para-ssg --verbose /path/to/context ./output

# With hot reload (watch mode)
para-ssg --watch /path/to/context ./output

# Get help
para-ssg --help
```

### Example PARA Structure

```
context/
├── projects/
│   ├── website-redesign.md
│   └── mobile-app.md
├── areas/
│   ├── health/
│   │   └── nutrition.md
│   └── finance/
│       └── budgeting.md
├── resources/
│   └── web-development/
│       └── css-grid.md
└── archives/
    └── old-project.md
```

## Documentation

### Core Concepts

#### PARA Methodology

para-ssg automatically detects and organizes content using the PARA methodology:

- **Projects** - Things with deadlines and outcomes
- **Areas** - Ongoing responsibilities to maintain
- **Resources** - Topics of ongoing interest
- **Archives** - Inactive items from the other three categories

#### Wiki Links

Use Obsidian-compatible wiki link syntax to connect documents:

```markdown
# Basic links

Link to [[document-name]]

# Custom display text

Link to [[document-name|Custom Display Text]]

# Case-insensitive matching

[[Document Name]] → matches "document-name.md"
```

#### Frontmatter Support

Add YAML frontmatter to enhance your documents:

```yaml
---
title: 'Document Title'
tags: ['web', 'development', 'tutorial']
author: 'Your Name'
date: '2025-01-15'
status: 'published' # or "draft" to exclude from search
description: 'Brief description for search results'
---
```

### Command Line Interface

#### Arguments

- `<input_dir>` - Path to your PARA-organized markdown directory
- `<output_dir>` - Path where the static website will be generated

#### Options

- `--verbose`, `-v` - Enable detailed build information and statistics
- `--watch`, `-w` - Watch for file changes and rebuild automatically
- `--help`, `-h` - Display help information

#### Examples

```bash
# Basic site generation
para-ssg ~/Documents/notes ./website

# Verbose mode with detailed progress
para-ssg --verbose ~/knowledge-base ./public

# Watch mode for development
para-ssg --watch ~/Documents/notes ./website

# Generate for deployment
para-ssg /path/to/docs /var/www/html
```

### Build Process

#### What Gets Generated

- **index.html** - Home page with site overview and navigation
- **Category pages** - Index pages for Projects, Areas, Resources, Archives
- **Document pages** - Individual HTML pages for each markdown file
- **search-index.json** - Search data for client-side functionality
- **Embedded CSS/JS** - All styling and functionality embedded for offline use

#### Build Statistics

para-ssg provides comprehensive build reporting:

- Documents processed by category
- Wiki link analysis (valid, broken, orphaned)
- Build performance metrics
- Validation warnings for potential issues

#### Performance Features

- **Parallel Processing** - Uses all CPU cores for fast builds
- **Progress Reporting** - Real-time updates during generation
- **Memory Optimization** - Efficient handling of large document sets
- **Incremental Builds** - Fast rebuilds with minimal changes

### Watch Mode (Hot Reload)

#### Overview

The `--watch` flag enables automatic rebuilding when markdown files change:

```bash
para-ssg --watch /path/to/content ./output
```

#### Features

- **Automatic Detection** - Monitors all markdown files in the input directory
- **Smart Debouncing** - Waits 500ms after changes stop to avoid rapid rebuilds
- **Error Recovery** - Continues watching even if a build fails
- **Clear Feedback** - Shows when changes are detected and builds complete

#### Use Cases

- **Development** - See changes immediately while writing documentation
- **Live Editing** - Preview content changes in real-time
- **Content Review** - Quickly iterate on documentation structure

#### Example Workflow

```bash
# Start watch mode in one terminal
para-ssg --watch ./content ./build

# In another terminal, serve the output
python -m http.server --directory ./build 8000

# Edit markdown files and see changes automatically rebuild
```

### Search Functionality

#### Features

- **Real-time Search** - Results appear as you type
- **Keyboard Shortcuts** - Ctrl+K or '/' to open search
- **Fuzzy Matching** - Find documents even with typos
- **Category Filtering** - Search within specific PARA categories
- **Result Highlighting** - Matching terms highlighted in results

#### Search Index

The search index includes:

- Document titles and content excerpts
- Tags and categories
- Full-text content (with size limits)
- Document metadata

#### Draft Documents

Documents with `status: draft` in frontmatter are excluded from the search index but still generate HTML pages.

### Backlinks System

#### Automatic Discovery

para-ssg automatically finds and displays:

- All documents that link to the current document
- Context around each backlink (50 characters before/after)
- Source document titles and paths

#### Link Analysis

- **Valid Links** - Successfully resolved wiki links
- **Broken Links** - Links that don't match any documents
- **Orphaned Documents** - Documents with no incoming links

### Theming and Design

#### 70s Earthy Theme

The default theme features:

- Warm earth tones (Saddle Brown, Peru, Goldenrod, Beige)
- Georgia serif typography for readability
- Subtle textures and gradients
- Mobile-responsive design
- Print-friendly styles

#### Responsive Design

- Mobile hamburger navigation
- Flexible grid layouts
- Touch-friendly interface elements
- Optimized for all screen sizes

### Advanced Usage

#### Configuration

para-ssg uses smart defaults but supports customization through code:

```rust
// Example configuration options
Config {
    base_url: Some("https://mysite.com".to_string()),
    site_title: "My Knowledge Base".to_string(),
    verbose: true,
}
```

#### Performance Tuning

For large document sets (1000+ files):

- Use `--verbose` to monitor build progress
- Ensure adequate RAM (4GB+ recommended for very large sets)
- Consider organizing content hierarchically

#### CI/CD Integration

para-ssg works well in automated environments:

- Returns appropriate exit codes
- Provides machine-readable progress information
- Handles missing dependencies gracefully

### Error Handling

#### Common Issues and Solutions

**Permission Errors**

```bash
# Ensure write permissions for output directory
chmod 755 /path/to/output
```

**Large Memory Usage**

```bash
# For very large document sets, consider splitting into smaller builds
para-ssg --verbose large-docs/ output/
```

**Broken Links**

- Use `--verbose` mode to see detailed broken link reports
- Check for typos in wiki link syntax
- Verify target documents exist and have proper titles

#### Validation Warnings

para-ssg warns about potential issues:

- Very long document titles (>100 characters)
- Deep directory nesting (>5 levels)
- Missing frontmatter fields
- Malformed YAML frontmatter

## Development

### Building from Source

```bash
# Clone repository
git clone <repository>
cd para-ssg

# Install dependencies and build
cargo build --release

# Run tests
cargo test

# Run with sample data
cargo run -- examples/sample-context output/
```

### Development Workflow

```bash
# Setup development environment
make setup-dev

# Run all checks (test, lint, format)
make check

# Format code
make fmt

# Run linter
make lint

# Run tests with coverage
make test

# Build optimized release
make build

# Clean build artifacts
make clean
```

### Testing

#### Test Categories

- **Unit Tests** - Test individual functions and modules
- **Integration Tests** - Test complete build workflows
- **Performance Tests** - Benchmark large document sets
- **Edge Case Tests** - Handle malformed input gracefully

#### Running Tests

```bash
# All tests
cargo test

# Specific test module
cargo test wiki_links

# Integration tests only
cargo test --test integration

# With detailed output
cargo test -- --nocapture
```

### Project Structure

```
src/
├── main.rs              # CLI entry point and argument parsing
├── lib.rs               # Library exports and public API
├── parser/              # Document parsing and frontmatter
│   ├── mod.rs
│   ├── document.rs      # Document and metadata structures
│   ├── frontmatter.rs   # YAML frontmatter parsing
│   ├── markdown.rs      # Markdown to HTML conversion
│   └── wiki_links.rs    # Wiki link parsing and resolution
├── generator/           # HTML generation and site building
│   ├── mod.rs
│   ├── html.rs          # HTML page generation
│   ├── search.rs        # Search index creation
│   └── backlinks.rs     # Backlink system
├── theme/               # Templates, styles, and JavaScript
│   ├── mod.rs
│   ├── templates.rs     # HTML templates
│   ├── styles.rs        # CSS styling
│   └── search.rs        # Client-side search JavaScript
└── utils/               # Utilities and helper functions
    ├── mod.rs
    ├── fs.rs            # File system operations
    └── para.rs          # PARA structure detection
```

### Contributing

1. **Fork the repository** and create a feature branch
2. **Follow Rust conventions** - Use `cargo fmt` and `cargo clippy`
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Run `make check`** before committing
6. **Use conventional commit messages**

#### Commit Message Format

```
feat: add new search feature
fix: resolve wiki link resolution bug
docs: update README with examples
test: add integration tests for backlinks
```

### Performance Benchmarks

para-ssg is designed for high performance:

- **5000+ documents/second** processing speed
- **Parallel processing** using all available CPU cores
- **Memory efficient** handling of large document sets
- **Fast incremental builds** for content updates

### Dependencies

#### Runtime Dependencies

- `serde` - Serialization framework
- `pulldown-cmark` - Markdown parsing
- `serde_yaml` - YAML frontmatter parsing
- `serde_json` - JSON search index generation
- `thiserror` - Error handling
- `rayon` - Parallel processing
- `notify` - File system watching for hot reload

#### Development Dependencies

- `tempfile` - Temporary directories for testing
- Built-in Rust testing framework

## Deployment

### Static Hosting

para-ssg generates completely self-contained static websites that work with any hosting provider:

#### GitHub Pages

##### Project Sites (Subpath Deployment)

When deploying to `username.github.io/repository/`, use the `PARA_SSG_BASE_URL` environment variable:

```bash
# Generate site with base URL for GitHub Pages project site
PARA_SSG_BASE_URL="/repository/" para-ssg docs/ ./public

# Or use GitHub Actions (see .github/workflows/deploy-gh-pages.yml)
```

##### User/Organization Sites (Root Deployment)

```bash
# Generate site for root deployment
para-ssg docs/ ./public

# Deploy to GitHub Pages
cp -r public/* docs/
git add docs/
git commit -m "Update documentation site"
git push
```

##### Automated Deployment with GitHub Actions

See `.github/workflows/deploy-gh-pages.yml` for a complete example that:
- Builds the Rust binary
- Generates the site with correct base URL
- Deploys to gh-pages branch automatically

```yaml
- name: Generate static site
  run: |
    PARA_SSG_BASE_URL="/forge/" cargo run --release -- ../../context ../../build
```

#### Netlify

```bash
# Build command
para-ssg content/ dist/

# Publish directory: dist
```

#### Vercel

```bash
# Build command
para-ssg docs/ public/

# Output directory: public
```

#### Traditional Web Servers

```bash
# Generate and copy to web root
para-ssg content/ /var/www/html/

# Or use rsync for updates
para-ssg content/ ./build/
rsync -av ./build/ user@server:/var/www/html/
```

### Custom Domains

The generated site works with any domain. For custom domains:

1. Update any absolute URLs in your markdown
2. Configure your hosting provider's domain settings
3. Set up HTTPS through your hosting provider

### Performance Optimization

For production deployments:

- Enable gzip compression on your web server
- Set appropriate cache headers for static assets
- Consider using a CDN for global distribution

## Examples

See the `examples/` directory for:

- Sample PARA directory structures
- Different frontmatter configurations
- Wiki link usage patterns
- Integration with various hosting platforms

## FAQ

### Q: Can I use para-ssg with non-PARA organized content?

A: Yes! para-ssg will organize any markdown files it finds, even without PARA structure.

### Q: How do I customize the theme?

A: Currently, theming requires modifying the source code in `src/theme/styles.rs`. Future versions will support custom themes.

### Q: Can I use para-ssg with other markdown tools?

A: Yes, para-ssg is designed to work alongside Obsidian, Logseq, and other markdown-based tools.

### Q: How large can my document collection be?

A: para-ssg has been tested with thousands of documents. Very large collections (10,000+ docs) may require additional RAM.

### Q: Does para-ssg support images and other assets?

A: Currently, para-ssg focuses on markdown content. Asset support is planned for future releases.

## License

MIT License - see LICENSE file for details.

## Changelog

### Version 0.2.0 (Development)

- Added hot reload with `--watch` flag
- File system monitoring for automatic rebuilds
- Smart debouncing to prevent rapid rebuilds
- Improved developer experience

### Version 0.1.0

- Initial release with core PARA support
- Wiki links and backlinks system
- Client-side search functionality
- 70s earthy theme
- Performance optimization
- Comprehensive error handling
