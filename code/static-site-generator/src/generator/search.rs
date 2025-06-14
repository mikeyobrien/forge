//! ABOUTME: Search index generation functionality
//! ABOUTME: Creates JSON search indexes for client-side search

use crate::parser::Document;
use crate::Result;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Search index entry for a single document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchEntry {
    /// Document title
    pub title: String,

    /// Path to the HTML file (relative to site root)
    pub path: String,

    /// PARA category
    pub category: String,

    /// Document tags
    pub tags: Vec<String>,

    /// Content excerpt for search preview
    pub excerpt: String,

    /// Full text content for searching (lowercased for case-insensitive search)
    pub content: String,
}

/// Complete search index for the site
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchIndex {
    /// Version of the search index format
    pub version: String,

    /// All searchable documents
    pub documents: Vec<SearchEntry>,

    /// Statistics about the index
    pub stats: IndexStats,
}

/// Statistics about the search index
#[derive(Debug, Serialize, Deserialize)]
pub struct IndexStats {
    /// Total number of documents
    pub total_documents: usize,

    /// Number of documents by category
    pub documents_by_category: std::collections::HashMap<String, usize>,

    /// Total size of content (characters)
    pub total_content_size: usize,

    /// Average excerpt length
    pub avg_excerpt_length: usize,
}

/// Maximum excerpt length in characters
const MAX_EXCERPT_LENGTH: usize = 200;

/// Maximum content length per document (to keep index size reasonable)
const MAX_CONTENT_LENGTH: usize = 5000;

impl SearchEntry {
    /// Create a search entry from a document
    pub fn from_document(doc: &Document) -> Self {
        let title = doc.title().to_string();
        let path = doc.output_path.to_string_lossy().to_string();
        let category = doc.effective_category().to_string();
        let tags = doc.metadata.tags.clone();

        // Extract plain text from HTML content
        let plain_text = extract_plain_text(&doc.html_content);

        // Generate excerpt
        let excerpt = generate_excerpt(&plain_text, MAX_EXCERPT_LENGTH);

        // Process content for searching
        let content = process_content_for_search(&plain_text, MAX_CONTENT_LENGTH);

        Self {
            title,
            path,
            category,
            tags,
            excerpt,
            content,
        }
    }
}

impl SearchIndex {
    /// Create a new search index from documents
    pub fn from_documents(documents: &[Document]) -> Self {
        let mut entries = Vec::new();
        let mut documents_by_category = std::collections::HashMap::new();
        let mut total_content_size = 0;
        let mut total_excerpt_length = 0;

        // Filter out draft documents
        let published_docs: Vec<&Document> =
            documents.iter().filter(|doc| !doc.is_draft()).collect();

        for doc in &published_docs {
            let entry = SearchEntry::from_document(doc);

            // Update statistics
            *documents_by_category
                .entry(entry.category.clone())
                .or_insert(0) += 1;
            total_content_size += entry.content.len();
            total_excerpt_length += entry.excerpt.len();

            entries.push(entry);
        }

        let avg_excerpt_length = if entries.is_empty() {
            0
        } else {
            total_excerpt_length / entries.len()
        };

        let stats = IndexStats {
            total_documents: entries.len(),
            documents_by_category,
            total_content_size,
            avg_excerpt_length,
        };

        Self {
            version: "1.0".to_string(),
            documents: entries,
            stats,
        }
    }
}

/// Extract plain text from HTML content
fn extract_plain_text(html: &str) -> String {
    // Simple HTML tag removal - could be enhanced with a proper HTML parser
    let mut text = html.to_string();

    // Remove script and style content
    text = regex::Regex::new(r"<script[^>]*>.*?</script>")
        .unwrap()
        .replace_all(&text, " ")
        .to_string();
    text = regex::Regex::new(r"<style[^>]*>.*?</style>")
        .unwrap()
        .replace_all(&text, " ")
        .to_string();

    // Remove HTML tags
    text = regex::Regex::new(r"<[^>]+>")
        .unwrap()
        .replace_all(&text, " ")
        .to_string();

    // Decode HTML entities
    text = html_escape::decode_html_entities(&text).to_string();

    // Normalize whitespace
    text = regex::Regex::new(r"\s+")
        .unwrap()
        .replace_all(&text, " ")
        .trim()
        .to_string();

    text
}

/// Generate an excerpt from content
fn generate_excerpt(content: &str, max_length: usize) -> String {
    if content.len() <= max_length {
        return content.to_string();
    }

    // Find a safe UTF-8 boundary by iterating through char indices
    let mut boundary = max_length;
    if !content.is_char_boundary(boundary) {
        // Find the nearest char boundary before max_length
        while boundary > 0 && !content.is_char_boundary(boundary) {
            boundary -= 1;
        }
    }

    // Try to break at a word boundary
    let mut excerpt = &content[..boundary];
    if let Some(last_space) = excerpt.rfind(' ') {
        excerpt = &excerpt[..last_space];
    }

    format!("{}...", excerpt.trim())
}

/// Process content for searching (lowercase, remove stop words)
fn process_content_for_search(content: &str, max_length: usize) -> String {
    let content_lower = content.to_lowercase();

    // Truncate if too long, ensuring we don't cut in the middle of a UTF-8 character
    let truncated = if content_lower.len() > max_length {
        // Find a safe character boundary
        let mut boundary = max_length;
        while !content_lower.is_char_boundary(boundary) && boundary > 0 {
            boundary -= 1;
        }
        &content_lower[..boundary]
    } else {
        &content_lower
    };

    // For now, keep all words (including stop words) to allow phrase searching
    // Stop word filtering can be done on the client side if needed
    truncated.to_string()
}

/// Generate search index from documents and save to output directory
pub fn generate_search_index(documents: &[Document], output_dir: &Path) -> Result<()> {
    let index = SearchIndex::from_documents(documents);

    // Print statistics
    println!("Search index statistics:");
    println!("  Total documents: {}", index.stats.total_documents);
    println!("  Documents by category:");
    for (category, count) in &index.stats.documents_by_category {
        println!("    {}: {}", category, count);
    }
    println!(
        "  Total content size: {} KB",
        index.stats.total_content_size / 1024
    );
    println!(
        "  Average excerpt length: {} chars",
        index.stats.avg_excerpt_length
    );

    // Serialize to JSON
    let json = serde_json::to_string_pretty(&index)?;

    // Save to file
    let index_path = output_dir.join("search-index.json");
    std::fs::write(&index_path, json)?;

    println!("Generated search index: {}", index_path.display());

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn create_test_document(title: &str, content: &str, tags: Vec<String>) -> Document {
        let mut doc = Document::new(
            PathBuf::from(format!("/input/{}.md", title)),
            PathBuf::from(format!("{}.md", title)),
            "test".to_string(),
        );
        doc.metadata.title = Some(title.to_string());
        doc.metadata.tags = tags;
        doc.html_content = format!("<p>{}</p>", content);
        doc
    }

    #[test]
    fn test_extract_plain_text() {
        let html = r#"
            <h1>Hello World</h1>
            <p>This is a <strong>test</strong> document.</p>
            <script>alert('test');</script>
            <style>body { color: red; }</style>
            <div>More content &amp; entities</div>
        "#;

        let plain = extract_plain_text(html);
        assert_eq!(
            plain,
            "Hello World This is a test document. More content & entities"
        );
    }

    #[test]
    fn test_generate_excerpt() {
        let content = "This is a long piece of content that should be truncated at a reasonable point without cutting words in half.";

        let excerpt = generate_excerpt(content, 50);
        assert_eq!(excerpt, "This is a long piece of content that should be...");

        let short_content = "Short content";
        let short_excerpt = generate_excerpt(short_content, 50);
        assert_eq!(short_excerpt, "Short content");
    }

    #[test]
    fn test_search_entry_from_document() {
        let doc = create_test_document(
            "Test Document",
            "This is the content of the test document with some interesting information.",
            vec!["test".to_string(), "search".to_string()],
        );

        let entry = SearchEntry::from_document(&doc);

        assert_eq!(entry.title, "Test Document");
        assert_eq!(entry.path, "Test Document.html");
        assert_eq!(entry.category, "test");
        assert_eq!(entry.tags, vec!["test", "search"]);
        assert!(entry.excerpt.contains("content of the test document"));
        assert!(entry.content.contains("content of the test document"));
        assert_eq!(entry.content, entry.content.to_lowercase());
    }

    #[test]
    fn test_search_index_from_documents() {
        let docs = vec![
            create_test_document("Doc1", "Content for document one", vec!["tag1".to_string()]),
            create_test_document("Doc2", "Content for document two", vec!["tag2".to_string()]),
        ];

        let index = SearchIndex::from_documents(&docs);

        assert_eq!(index.version, "1.0");
        assert_eq!(index.documents.len(), 2);
        assert_eq!(index.stats.total_documents, 2);
        assert_eq!(index.stats.documents_by_category.get("test"), Some(&2));
    }

    #[test]
    fn test_search_index_excludes_drafts() {
        let mut draft_doc = create_test_document("Draft", "Draft content", vec![]);
        draft_doc.metadata.status = Some("draft".to_string());

        let published_doc = create_test_document("Published", "Published content", vec![]);

        let docs = vec![draft_doc, published_doc];
        let index = SearchIndex::from_documents(&docs);

        assert_eq!(index.documents.len(), 1);
        assert_eq!(index.documents[0].title, "Published");
    }

    #[test]
    fn test_content_truncation() {
        let long_content = "x".repeat(10000);
        let doc = create_test_document("Long", &long_content, vec![]);

        let entry = SearchEntry::from_document(&doc);
        assert!(entry.content.len() <= MAX_CONTENT_LENGTH);
    }
}
