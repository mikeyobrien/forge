---
title: 'Brainstorm: Static Website Generator in Rust for PARA Documents'
category: projects
status: active
created: 2025-06-11T21:17:47.568Z
modified: 2025-06-11T21:17:47.568Z
tags:
  - brainstorm
  - planning
  - rust
  - static-site-generator
  - para
---

# Brainstorm: Static Website Generator in Rust for PARA Documents

## Created: 2025-06-11

## Problem Statement

Want to share all documents from this project publicly while making the knowledge base more accessible and browsable. Currently, the PARA-organized markdown files in `context/` are only accessible locally and lack discoverability.

## Target Audience

Other developers interested in the uber-goal of this project/repo - exploring and pushing the boundaries of what LLMs can achieve in software development through self-sufficient framework creation.

## Success Criteria

- Locally viewable website that is easy to host
- Search functionality across all documents
- Preserved PARA structure (Projects/Areas/Resources/Archives sections)
- Wiki-style linking between documents maintained
- Hot reloading not needed for P0 (Phase 0/MVP)

## Constraints & Challenges

- **PARA Structure**: Need to understand and preserve the hierarchical organization
- **Wiki Links**: Parse and convert `[[document-name]]` style links to proper web links
- **Search Implementation**: Client-side search (no server) vs pre-built search index
- **Rust Ecosystem**: Limited to foundational packages per project guidelines - no high-level static site generators
- **Markdown Parsing**: Handle frontmatter, various markdown extensions
- **Asset Management**: CSS, JavaScript for the web interface
- **Cross-platform**: Easy hosting means it should work across different environments

## Existing Solutions & Differentiation

Focus is on learning and extracting maximum value rather than competing. Quartz (https://quartz.jzhao.xyz/) is most similar but doesn't meet project guidelines for foundational-only packages.

## MVP Scope

- Single Rust binary that reads `context/` directory
- Multi-page static HTML generation with clean/minimalist 70s earthy color palette
- Basic markdown-to-HTML conversion (using basic markdown parser - acceptable per guidelines)
- Frontmatter parsing for document metadata
- Obsidian-compatible wiki link conversion (`[[document-name]]` → proper HTML links)
- PARA structure navigation (Projects/Areas/Resources/Archives as main sections)
- Client-side search with JSON index (title, path, content excerpts)
- One HTML file per markdown document with shared navigation

## Resources & Dependencies

**Allowed under foundational constraint:**

- Rust standard library (fs, path, collections, etc.)
- Basic markdown parser crate (acceptable as foundational parsing tool)
- Serde for JSON serialization (allowed for type systems & validation)
- Manual HTML templating using string building

**Assets:**

- Embedded CSS with 70s earthy color palette
- Minimal JavaScript for client-side search
- Generated JSON search index

## Open Questions

- Should search index include full content or just excerpts?
- How to handle document cross-references and backlinks?
- Should we generate a sitemap or table of contents?
- How to handle images or other assets referenced in markdown?

## Initial Ideas

- Use directory structure to build navigation hierarchy
- Generate search index during build process
- Implement simple template system for consistent page layout
- Create responsive design that works on mobile and desktop

## Next Steps

- [ ] Research acceptable markdown parsing crates
- [ ] Design HTML template structure
- [ ] Plan directory traversal and file processing logic
- [ ] Create 70s earthy color palette
- [ ] Implement wiki link parsing algorithm
- [ ] Design search index structure

## References

- Quartz: https://quartz.jzhao.xyz/
- Obsidian wiki link format documentation

---

_Brainstorming session conducted on 2025-06-11_
