---
title: 'Implementation Plan: Static Website Generator in Rust'
category: projects
status: active
created: 2025-06-11T21:28:49.558Z
modified: 2025-06-11T21:28:49.558Z
tags:
  - implementation
  - rust
  - static-site-generator
  - para
  - planning
---

# Implementation Plan: Static Website Generator in Rust

## Project Overview

Build a static website generator in Rust that converts PARA-organized markdown documents into a clean, browsable website with search functionality and Obsidian-compatible wiki links.

## Architecture

### Core Components

1. **Document Parser** (`src/parser/`)

   - Markdown parsing with frontmatter support
   - Wiki link extraction and resolution
   - PARA structure detection

2. **Site Generator** (`src/generator/`)

   - HTML template engine
   - Static asset generation
   - Search index builder

3. **Theme System** (`src/theme/`)

   - 70s earthy color palette CSS
   - Responsive layout templates
   - JavaScript for search functionality

4. **CLI Interface** (`src/main.rs`)
   - Command-line argument parsing
   - Build orchestration
   - Error handling and logging

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal:** Basic markdown-to-HTML conversion with PARA structure

#### Tasks:

1. **Project Setup**

   - Initialize Cargo project in `code/static-site-generator/`
   - Configure allowed dependencies (serde, basic markdown parser)
   - Set up directory structure

2. **Document Discovery**

   - Recursive directory traversal of `context/`
   - PARA category detection (projects/, areas/, resources/, archives/)
   - File filtering (.md files only)

3. **Basic Markdown Processing**

   - Frontmatter parsing (title, tags, dates, etc.)
   - Markdown-to-HTML conversion
   - Document metadata extraction

4. **Simple HTML Generation**
   - Basic HTML template structure
   - Navigation generation from directory structure
   - Individual page generation

#### Deliverable:

Static HTML files that preserve PARA structure with basic styling.

### Phase 2: Wiki Links & Navigation

**Goal:** Obsidian-compatible linking and improved navigation

#### Tasks:

1. **Wiki Link Parser**

   - Regex-based `[[document-name]]` detection
   - Link resolution to actual file paths
   - Broken link detection and warnings

2. **Cross-Reference System**

   - Backlink generation
   - Document relationship mapping
   - Link validation

3. **Enhanced Navigation**
   - Breadcrumb generation
   - Category-based navigation menus
   - Document listing pages for each PARA category

#### Deliverable:

Fully linked website with working internal navigation.

### Phase 3: Search & Theme

**Goal:** Client-side search and 70s earthy design

#### Tasks:

1. **Search System**

   - JSON index generation (title, path, excerpt, tags)
   - Client-side JavaScript search implementation
   - Search results page and interface

2. **70s Earthy Theme**

   - CSS color palette design
   - Typography and layout
   - Responsive design for mobile/desktop

3. **Asset Management**
   - CSS/JS embedding or external files
   - Font selection and loading
   - Icon system (if needed)

#### Deliverable:

Fully functional static website with search and polished design.

### Phase 4: Polish & Optimization

**Goal:** Production-ready generator with extensibility

#### Tasks:

1. **Performance Optimization**

   - Build time optimization
   - Generated file size optimization
   - Search index compression

2. **Error Handling**

   - Comprehensive error messages
   - Graceful handling of malformed documents
   - Build validation and warnings

3. **Documentation**
   - README with usage instructions
   - Configuration options
   - Hosting deployment guide

#### Deliverable:

Production-ready static site generator.

## Technical Specifications

### Dependencies

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
pulldown-cmark = "0.9"  # Basic markdown parser
toml = "0.8"  # For frontmatter parsing
```

### Directory Structure

```
code/static-site-generator/
├── src/
│   ├── main.rs              # CLI entry point
│   ├── lib.rs               # Library exports
│   ├── parser/
│   │   ├── mod.rs
│   │   ├── markdown.rs      # Markdown processing
│   │   ├── frontmatter.rs   # YAML frontmatter parsing
│   │   └── wiki_links.rs    # Wiki link resolution
│   ├── generator/
│   │   ├── mod.rs
│   │   ├── html.rs          # HTML generation
│   │   ├── search.rs        # Search index building
│   │   └── assets.rs        # Static asset handling
│   ├── theme/
│   │   ├── mod.rs
│   │   ├── templates.rs     # HTML templates
│   │   └── styles.rs        # CSS generation
│   └── utils/
│       ├── mod.rs
│       ├── fs.rs            # File system utilities
│       └── para.rs          # PARA structure detection
├── assets/
│   ├── style.css            # 70s earthy theme
│   └── search.js            # Client-side search
├── templates/
│   ├── base.html            # Base HTML template
│   ├── document.html        # Document page template
│   └── index.html           # Category index template
└── Cargo.toml
```

### Configuration

```toml
# site.toml (optional configuration file)
[site]
title = "Knowledge Base"
description = "PARA-organized documentation"
base_url = "/"

[build]
input_dir = "context"
output_dir = "dist"
clean_output = true

[theme]
palette = "earthy-70s"
font_family = "system"
```

### Color Palette (70s Earthy)

```css
:root {
  --primary: #8b4513; /* Saddle Brown */
  --secondary: #cd853f; /* Peru */
  --accent: #daa520; /* Goldenrod */
  --background: #f5f5dc; /* Beige */
  --surface: #faebd7; /* Antique White */
  --text: #2f2f2f; /* Dark Gray */
  --text-muted: #8b7355; /* Dark Khaki */
  --border: #d2b48c; /* Tan */
  --success: #6b8e23; /* Olive Drab */
  --warning: #ff8c00; /* Dark Orange */
}
```

## Success Metrics

1. **Functionality**

   - [ ] All markdown files converted to HTML
   - [ ] Wiki links working correctly
   - [ ] Search finds relevant documents
   - [ ] PARA structure preserved in navigation

2. **Performance**

   - [ ] Build completes in under 10 seconds for current document set
   - [ ] Generated site loads quickly in browser
   - [ ] Search responds instantly for typical queries

3. **Usability**
   - [ ] Clean, readable design
   - [ ] Mobile-responsive layout
   - [ ] Intuitive navigation
   - [ ] Easy to deploy and host

## Getting Started

1. Create project structure: `cargo new code/static-site-generator`
2. Begin with Phase 1: Foundation
3. Test iteratively with small document subset
4. Follow TDD principles with comprehensive testing

## Next Steps

- Begin Phase 1 implementation
- Set up basic project structure
- Implement document discovery and parsing
- Create initial HTML generation pipeline
