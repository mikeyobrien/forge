# Changelog

All notable changes to para-ssg will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Additional deployment examples
- Comprehensive documentation
- Example directory with sample content

### Changed

- Improved error messages and validation

### Fixed

- Minor performance optimizations

## [0.1.0] - 2025-01-15

### Added

- Initial release of para-ssg
- PARA structure detection and organization
- Markdown parsing with YAML frontmatter support
- Obsidian-compatible wiki link system (`[[document-name]]` and `[[document-name|display]]`)
- Automatic backlink generation and display
- Client-side search functionality with JSON index
- 70s earthy theme with mobile-responsive design
- Performance optimization with parallel processing
- Comprehensive error handling and validation
- Command-line interface with verbose mode
- Build statistics and link analysis
- Integration test suite
- Make-based development workflow

### Technical Features

- **Parser Module**: Document parsing, frontmatter extraction, wiki link resolution
- **Generator Module**: HTML generation, search indexing, backlink system
- **Theme Module**: Templates, styling, client-side JavaScript
- **Utils Module**: File system operations, PARA structure detection

### Performance

- Parallel document processing using Rayon
- 5000+ documents/second processing speed
- Memory-efficient handling of large document sets
- Real-time progress reporting

### Dependencies

- `clap` 4.4 - Command line argument parsing
- `serde` 1.0 - Serialization framework
- `pulldown-cmark` 0.9 - Markdown parsing
- `serde_yaml` 0.9 - YAML frontmatter parsing
- `serde_json` 1.0 - JSON search index generation
- `thiserror` 1.0 - Error handling
- `rayon` 1.8 - Parallel processing
- `tempfile` 3.8 - Testing utilities (dev dependency)

### Browser Support

- Modern browsers with ES6+ support
- Mobile Safari and Chrome
- Firefox, Edge, Safari desktop
- No Internet Explorer support

### Known Limitations

- Images and assets must be referenced with external URLs
- Theme customization requires code modification
- No plugin system (planned for future releases)
- Large document sets (10,000+) may require significant RAM

## [0.0.1] - 2025-01-06

### Added

- Initial project structure
- Basic CLI and module organization
- Preliminary testing framework

---

## Version Numbering

para-ssg follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.
