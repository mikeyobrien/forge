// ABOUTME: Test document generation utilities for integration tests
// ABOUTME: Creates various document structures for testing different scenarios

use std::fs;
use std::path::Path;

/// Create a basic PARA structure with sample documents
pub fn create_basic_para_structure(base_path: &Path) {
    // Create PARA directories
    let dirs = ["projects", "areas", "resources", "archives"];
    for dir in &dirs {
        fs::create_dir_all(base_path.join(dir)).unwrap();
    }

    // Create subdirectories
    fs::create_dir_all(base_path.join("areas/health")).unwrap();

    // Projects
    create_document(
        &base_path.join("projects/website-redesign.md"),
        r#"---
title: Website Redesign Project
tags: [web, design, active]
status: active
category: projects
---

# Website Redesign Project

This is a project to redesign our company website with modern features.

## Goals
- Improve user experience
- Add mobile responsiveness
- Implement new branding"#,
    );

    // Areas
    create_document(
        &base_path.join("areas/health/exercise-routine.md"),
        r#"---
title: Exercise Routine
tags: [health, fitness, daily]
category: areas
---

# Exercise Routine

My daily exercise routine for maintaining health.

## Morning Routine
- 20 pushups
- 30 situps
- 5 minute plank"#,
    );

    // Resources
    create_document(
        &base_path.join("resources/rust-programming.md"),
        r#"---
title: Rust Programming Resources
tags: [rust, programming, learning]
category: resources
---

# Rust Programming Resources

Collection of useful Rust programming resources.

## Books
- The Rust Programming Language
- Programming Rust
- Rust in Action"#,
    );

    // Archives
    create_document(
        &base_path.join("archives/old-project.md"),
        r#"---
title: Old Project Archive
tags: [archive, completed]
category: archives
status: completed
---

# Old Project Archive

This project was completed in 2020 and is now archived."#,
    );
}

/// Create documents with wiki links for testing
pub fn create_wiki_link_test_documents(base_path: &Path) {
    fs::create_dir_all(base_path.join("projects")).unwrap();
    fs::create_dir_all(base_path.join("resources")).unwrap();

    // Document A links to Document B
    create_document(
        &base_path.join("projects/document-a.md"),
        r#"---
title: Document A
tags: [test, links]
---

# Document A

This document links to [[Document B]] and [[document-c|Document C]].

Also trying a [[Non-Existent Document]] to test broken links."#,
    );

    // Document B (target of link from A)
    create_document(
        &base_path.join("projects/document-b.md"),
        r#"---
title: Document B
tags: [test, target]
---

# Document B

This is the target document. It also links back to [[Document A]]."#,
    );

    // Document C with broken link
    create_document(
        &base_path.join("resources/document-c.md"),
        r#"---
title: Document C
tags: [test, broken]
---

# Document C

This document has a broken link to [[Missing Document]]."#,
    );
}

/// Create documents for search testing
pub fn create_search_test_documents(base_path: &Path) {
    fs::create_dir_all(base_path.join("projects")).unwrap();
    fs::create_dir_all(base_path.join("resources")).unwrap();

    create_document(
        &base_path.join("projects/search-test-1.md"),
        r#"---
title: Unique Search Term Alpha
tags: [searchable, test, alpha]
---

# Unique Search Term Alpha

This document contains a unique searchable term: **quixotic**. 
It should be easily findable in search results."#,
    );

    create_document(
        &base_path.join("resources/search-test-2.md"),
        r#"---
title: Another Searchable Document
tags: [searchable, test, beta]
---

# Another Searchable Document

This document talks about **quantum computing** and **machine learning**.
These are popular search terms that should be indexed."#,
    );

    // Draft document (should not appear in search)
    create_document(
        &base_path.join("projects/draft-document.md"),
        r#"---
title: Draft Document
status: draft
tags: [draft, unpublished]
---

# Draft Document

This is a draft and should not appear in search results."#,
    );
}

/// Create documents with various frontmatter formats
pub fn create_frontmatter_test_documents(base_path: &Path) {
    fs::create_dir_all(base_path.join("projects")).unwrap();
    fs::create_dir_all(base_path.join("areas")).unwrap();

    // Complete frontmatter
    create_document(
        &base_path.join("projects/with-frontmatter.md"),
        r#"---
title: Document With Frontmatter
tags: [tag1, tag2, tag3]
author: Test Author
created: 2025-01-01
modified: 2025-01-15
status: active
custom_field: custom value
---

# Document With Frontmatter

This document has complete frontmatter."#,
    );

    // No frontmatter
    create_document(
        &base_path.join("areas/without-frontmatter.md"),
        r#"# Document Without Frontmatter

This document has no frontmatter at all."#,
    );

    // Minimal frontmatter
    create_document(
        &base_path.join("projects/minimal-frontmatter.md"),
        r#"---
title: Minimal
---

Content here."#,
    );

    // Draft status
    create_document(
        &base_path.join("areas/draft-status.md"),
        r#"---
title: Draft Document
status: draft
---

This should be excluded from search."#,
    );
}

/// Create nested document structure for navigation testing
pub fn create_nested_document_structure(base_path: &Path) {
    fs::create_dir_all(base_path.join("projects/subproject")).unwrap();
    fs::create_dir_all(base_path.join("areas/work/meetings")).unwrap();

    create_document(
        &base_path.join("projects/subproject/nested-doc.md"),
        r#"---
title: Nested Document
tags: [nested, test]
---

# Nested Document

This document is nested within a subproject directory."#,
    );

    create_document(
        &base_path.join("areas/work/meetings/weekly-standup.md"),
        r#"---
title: Weekly Standup Notes
tags: [meetings, work]
---

# Weekly Standup Notes

Notes from weekly standup meetings."#,
    );
}

/// Create documents with edge cases
pub fn create_edge_case_documents(base_path: &Path) {
    fs::create_dir_all(base_path.join("projects")).unwrap();
    fs::create_dir_all(base_path.join("resources")).unwrap();
    fs::create_dir_all(base_path.join("areas")).unwrap();

    // Special characters in filename (but filesystem safe)
    create_document(
        &base_path.join("projects/special-chars-test.md"),
        r#"---
title: Special Characters & Symbols
tags: [test, "special-chars"]
---

# Special Characters & Symbols

Testing <html> tags & special characters like é, ñ, and 中文."#,
    );

    // Very long document
    let mut long_content = String::from(
        r#"---
title: Very Long Document
tags: [test, performance]
---

# Very Long Document

"#,
    );

    for i in 0..1000 {
        long_content.push_str(&format!(
            "This is paragraph {}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ",
            i
        ));
    }

    create_document(
        &base_path.join("resources/very-long-document.md"),
        &long_content,
    );

    // Empty document
    create_document(
        &base_path.join("areas/empty-document.md"),
        r#"---
title: Empty Document
---

"#,
    );

    // Document with code blocks
    create_document(
        &base_path.join("projects/code-blocks.md"),
        r#"---
title: Code Block Test
tags: [code, test]
---

# Code Block Test

Here's some code:

```rust
fn main() {
    println!("Hello, world!");
}
```

And some inline `code` as well."#,
    );
}

/// Create many documents for performance testing
pub fn create_many_documents(base_path: &Path, count: usize) {
    let categories = ["projects", "areas", "resources", "archives"];

    for category in &categories {
        fs::create_dir_all(base_path.join(category)).unwrap();
    }

    for i in 0..count {
        let category = categories[i % categories.len()];
        let path = base_path.join(format!("{}/document-{}.md", category, i));

        create_document(
            &path,
            &format!(
                r#"---
title: Test Document {}
tags: [test, performance, batch{}]
category: {}
---

# Test Document {}

This is test document number {}. It contains some content for testing performance with many documents.

## Section 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Section 2

More content here to make the document realistic. [[Document {}]] is linked from here.

## Section 3

Final section with some more text."#,
                i,
                i / 10,
                category,
                i,
                i,
                (i + 1) % count
            ),
        );
    }
}

/// Create minimal test structure for CI/CD testing
pub fn create_minimal_test_structure(base_path: &Path) {
    fs::create_dir_all(base_path.join("projects")).unwrap();

    create_document(
        &base_path.join("projects/test.md"),
        r#"---
title: CI Test Document
tags: [ci, test]
---

# CI Test Document

Minimal document for CI/CD testing."#,
    );
}

/// Helper function to create a document
fn create_document(path: &Path, content: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).unwrap();
    }
    fs::write(path, content).unwrap();
}
