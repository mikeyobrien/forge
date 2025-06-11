//! ABOUTME: Document structure representing parsed markdown files with metadata
//! ABOUTME: Combines frontmatter metadata with parsed content

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Complete document with metadata and content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Path to the source markdown file
    pub source_path: PathBuf,

    /// Relative path from the input directory
    pub relative_path: PathBuf,

    /// Output path for the generated HTML
    pub output_path: PathBuf,

    /// Document metadata from frontmatter
    pub metadata: DocumentMetadata,

    /// Raw markdown content (without frontmatter)
    pub raw_content: String,

    /// Parsed HTML content
    pub html_content: String,

    /// PARA category detected from path
    pub category: String,
}

/// Document metadata typically found in YAML frontmatter
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct DocumentMetadata {
    /// Document title
    pub title: Option<String>,

    /// Document description or summary
    pub description: Option<String>,

    /// Tags for categorization
    #[serde(default)]
    pub tags: Vec<String>,

    /// Creation date
    pub created: Option<DateTime<Utc>>,

    /// Last modification date
    pub modified: Option<DateTime<Utc>>,

    /// Publication date (if different from created)
    pub date: Option<DateTime<Utc>>,

    /// Document status (draft, published, etc.)
    pub status: Option<String>,

    /// PARA category override (if different from path)
    pub category: Option<String>,

    /// Author information
    pub author: Option<String>,

    /// Custom properties not captured above
    #[serde(flatten)]
    pub custom: std::collections::HashMap<String, serde_yaml::Value>,
}

impl Document {
    /// Create a new document with the given paths and category
    pub fn new(source_path: PathBuf, relative_path: PathBuf, category: String) -> Self {
        // Generate output path by replacing .md with .html
        let mut output_path = relative_path.clone();
        output_path.set_extension("html");

        Self {
            source_path,
            relative_path,
            output_path,
            metadata: DocumentMetadata::default(),
            raw_content: String::new(),
            html_content: String::new(),
            category,
        }
    }

    /// Get the document's title, falling back to filename if not specified
    pub fn title(&self) -> &str {
        self.metadata.title.as_deref().unwrap_or_else(|| {
            self.relative_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled")
        })
    }

    /// Get the document's effective category (metadata override or detected)
    pub fn effective_category(&self) -> &str {
        self.metadata.category.as_deref().unwrap_or(&self.category)
    }

    /// Check if the document is a draft
    pub fn is_draft(&self) -> bool {
        self.metadata.status.as_deref() == Some("draft")
    }

    /// Get the most relevant date (date > modified > created)
    pub fn date(&self) -> Option<&DateTime<Utc>> {
        self.metadata
            .date
            .as_ref()
            .or(self.metadata.modified.as_ref())
            .or(self.metadata.created.as_ref())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_document_new() {
        let doc = Document::new(
            PathBuf::from("/input/projects/test.md"),
            PathBuf::from("projects/test.md"),
            "projects".to_string(),
        );

        assert_eq!(doc.output_path, PathBuf::from("projects/test.html"));
        assert_eq!(doc.category, "projects");
    }

    #[test]
    fn test_document_title_fallback() {
        let mut doc = Document::new(
            PathBuf::from("/input/my-document.md"),
            PathBuf::from("my-document.md"),
            "root".to_string(),
        );

        // No title in metadata - should use filename
        assert_eq!(doc.title(), "my-document");

        // With title in metadata
        doc.metadata.title = Some("My Document Title".to_string());
        assert_eq!(doc.title(), "My Document Title");
    }

    #[test]
    fn test_document_category_override() {
        let mut doc = Document::new(
            PathBuf::from("/input/resources/test.md"),
            PathBuf::from("resources/test.md"),
            "resources".to_string(),
        );

        // No override - use detected category
        assert_eq!(doc.effective_category(), "resources");

        // With override in metadata
        doc.metadata.category = Some("projects".to_string());
        assert_eq!(doc.effective_category(), "projects");
    }

    #[test]
    fn test_document_is_draft() {
        let mut doc = Document::new(
            PathBuf::from("/input/test.md"),
            PathBuf::from("test.md"),
            "root".to_string(),
        );

        assert!(!doc.is_draft());

        doc.metadata.status = Some("draft".to_string());
        assert!(doc.is_draft());

        doc.metadata.status = Some("published".to_string());
        assert!(!doc.is_draft());
    }
}
