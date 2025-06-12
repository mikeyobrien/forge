//! ABOUTME: Document parsing module for markdown and frontmatter processing
//! ABOUTME: Handles conversion of markdown files to structured document objects

pub mod document;
pub mod frontmatter;
pub mod markdown;
pub mod wiki_links;

pub use document::*;
pub use frontmatter::*;
pub use markdown::*;
pub use wiki_links::*;

use crate::{ParaSsgError, Result};
use chrono::DateTime;
use std::fs;
use std::path::Path;

/// Parse a markdown file into a Document
///
/// Reads the file, extracts frontmatter, converts markdown to HTML,
/// and creates a complete Document structure.
///
/// # Errors
///
/// Returns error if file cannot be read or parsing fails
pub fn parse_document(
    source_path: &Path,
    relative_path: &Path,
    category: String,
) -> Result<Document> {
    // Read file content
    let content = fs::read_to_string(source_path).map_err(|e| {
        ParaSsgError::Io(std::io::Error::new(
            e.kind(),
            format!("Failed to read file '{}': {}", source_path.display(), e),
        ))
    })?;

    // Parse frontmatter and extract content
    let (mut metadata, raw_content) = parse_frontmatter(&content)?;

    // If no dates in frontmatter, use file modification time
    if metadata.date.is_none() && metadata.modified.is_none() && metadata.created.is_none() {
        if let Ok(file_metadata) = fs::metadata(source_path) {
            if let Ok(modified_time) = file_metadata.modified() {
                metadata.modified = Some(DateTime::from(modified_time));
            }
        }
    }

    // Convert markdown to HTML
    let html_content = markdown_to_html(&raw_content)?;

    // Create document
    let mut doc = Document::new(
        source_path.to_path_buf(),
        relative_path.to_path_buf(),
        category,
    );

    doc.metadata = metadata;
    doc.raw_content = raw_content;
    doc.html_content = html_content;

    Ok(doc)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_parse_document_complete() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.md");

        let content = r#"---
title: Test Document
tags:
  - rust
  - testing
created: 2023-01-15T10:00:00Z
---
# Test Document

This is a test document with **markdown**.

- Item 1
- Item 2
"#;

        fs::write(&file_path, content).unwrap();

        let doc = parse_document(&file_path, Path::new("test.md"), "root".to_string()).unwrap();

        assert_eq!(doc.metadata.title, Some("Test Document".to_string()));
        assert_eq!(doc.metadata.tags, vec!["rust", "testing"]);
        assert!(doc.raw_content.contains("# Test Document"));
        assert!(doc.html_content.contains("<h1>Test Document</h1>"));
        assert!(doc.html_content.contains("<strong>markdown</strong>"));
        assert_eq!(doc.category, "root");
        assert_eq!(doc.output_path, Path::new("test.html"));
    }

    #[test]
    fn test_parse_document_no_frontmatter() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("simple.md");

        let content = "# Simple Document\n\nNo frontmatter here.";
        fs::write(&file_path, content).unwrap();

        let doc = parse_document(&file_path, Path::new("simple.md"), "root".to_string()).unwrap();

        assert_eq!(doc.metadata.title, None);
        assert_eq!(doc.title(), "simple");
        assert!(doc.raw_content.contains("# Simple Document"));
        assert!(doc.html_content.contains("<h1>Simple Document</h1>"));
    }
}
