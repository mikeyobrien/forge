// ABOUTME: HTML and output validation utilities for integration tests
// ABOUTME: Provides functions to validate generated HTML structure and content

use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Find all HTML files in a directory
pub fn find_html_files(dir: &Path) -> Vec<PathBuf> {
    WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "html"))
        .map(|e| e.path().to_path_buf())
        .collect()
}

/// Validate HTML structure
pub fn validate_html_structure(content: &str, file_path: &Path) {
    // Basic HTML structure validation
    assert!(
        content.contains("<!DOCTYPE html>"),
        "Missing DOCTYPE in {:?}",
        file_path
    );
    assert!(
        content.contains("<html"),
        "Missing html tag in {:?}",
        file_path
    );
    assert!(
        content.contains("<head>"),
        "Missing head tag in {:?}",
        file_path
    );
    assert!(
        content.contains("<body>"),
        "Missing body tag in {:?}",
        file_path
    );
    assert!(
        content.contains("</html>"),
        "Missing closing html tag in {:?}",
        file_path
    );

    // Required meta tags
    assert!(
        content.contains(r#"<meta charset="UTF-8">"#),
        "Missing charset meta in {:?}",
        file_path
    );
    assert!(
        content.contains(r#"<meta name="viewport""#),
        "Missing viewport meta in {:?}",
        file_path
    );

    // Navigation structure
    assert!(
        content.contains(r#"<nav"#),
        "Missing navigation in {:?}",
        file_path
    );
    assert!(
        content.contains(r#"class="nav-link""#),
        "Missing nav links in {:?}",
        file_path
    );

    // Main content area
    assert!(
        content.contains(r#"<main"#),
        "Missing main element in {:?}",
        file_path
    );

    // Footer
    assert!(
        content.contains(r#"<footer"#),
        "Missing footer in {:?}",
        file_path
    );

    // Check for unclosed tags (basic check)
    let open_divs = content.matches("<div").count();
    let close_divs = content.matches("</div>").count();
    assert_eq!(
        open_divs, close_divs,
        "Mismatched div tags in {:?}",
        file_path
    );

    // Check for styles
    assert!(
        content.contains("<style>") || content.contains(r#"<link rel="stylesheet""#),
        "No styles found in {:?}",
        file_path
    );

    // Check for search functionality (except search.js itself)
    if !file_path.to_str().unwrap().contains("search.js") {
        assert!(
            content.contains("searchBox") || content.contains("search-container"),
            "No search functionality in {:?}",
            file_path
        );
    }
}

/// Validate search index JSON structure
pub fn validate_search_index(search_index: &serde_json::Value) {
    // Check top-level structure
    assert!(search_index.is_object(), "Search index should be an object");
    assert!(search_index["version"].is_string(), "Missing version field");
    assert!(
        search_index["generated"].is_string(),
        "Missing generated timestamp"
    );
    assert!(
        search_index["documents"].is_array(),
        "Missing documents array"
    );
    assert!(search_index["stats"].is_object(), "Missing stats object");

    // Validate stats
    let stats = &search_index["stats"];
    assert!(
        stats["total_documents"].is_number(),
        "Missing total_documents in stats"
    );
    assert!(
        stats["total_size"].is_number(),
        "Missing total_size in stats"
    );
    assert!(
        stats["by_category"].is_object(),
        "Missing by_category in stats"
    );

    // Validate each document
    let documents = search_index["documents"].as_array().unwrap();
    for (i, doc) in documents.iter().enumerate() {
        assert!(doc["title"].is_string(), "Missing title in document {}", i);
        assert!(doc["path"].is_string(), "Missing path in document {}", i);
        assert!(
            doc["content"].is_string(),
            "Missing content in document {}",
            i
        );
        assert!(
            doc["excerpt"].is_string(),
            "Missing excerpt in document {}",
            i
        );
        assert!(
            doc["category"].is_string(),
            "Missing category in document {}",
            i
        );

        // Optional fields
        if doc.get("tags").is_some() {
            assert!(
                doc["tags"].is_array(),
                "Tags should be an array in document {}",
                i
            );
        }
    }
}

/// Validate wiki link conversion in HTML
pub fn validate_wiki_links(content: &str) {
    // Should not contain raw wiki link syntax
    assert!(
        !content.contains("[[") || !content.contains("]]"),
        "Found unconverted wiki links in HTML"
    );

    // Should contain converted links
    if content.contains("wiki-link") {
        assert!(
            content.contains(r#"<a href=""#),
            "Wiki links not converted to HTML links"
        );
    }
}

/// Validate backlinks section
pub fn validate_backlinks(content: &str, expected_backlinks: &[&str]) {
    if !expected_backlinks.is_empty() {
        assert!(content.contains("Backlinks"), "Missing backlinks section");
        assert!(
            content.contains(r#"class="backlinks""#),
            "Missing backlinks class"
        );

        for backlink in expected_backlinks {
            assert!(
                content.contains(backlink),
                "Missing expected backlink: {}",
                backlink
            );
        }
    }
}

/// Validate breadcrumb navigation
pub fn validate_breadcrumbs(content: &str, expected_path: &[&str]) {
    assert!(
        content.contains(r#"class="breadcrumbs""#),
        "Missing breadcrumbs"
    );

    for segment in expected_path {
        assert!(
            content.contains(segment),
            "Missing breadcrumb segment: {}",
            segment
        );
    }
}

/// Validate category page structure
pub fn validate_category_page(content: &str, category: &str) {
    assert!(
        content.contains(&format!("<h1>{}", category)),
        "Missing category heading"
    );
    assert!(
        content.contains(r#"class="document-list""#),
        "Missing document list"
    );
    assert!(
        content.contains(r#"class="document-item""#),
        "Missing document items"
    );
}

/// Check for common HTML errors
pub fn check_common_errors(content: &str, file_path: &Path) {
    // Check for empty links
    assert!(
        !content.contains(r#"href="""#),
        "Empty href found in {:?}",
        file_path
    );

    // Check for empty image sources (if any images)
    if content.contains("<img") {
        assert!(
            !content.contains(r#"src="""#),
            "Empty img src found in {:?}",
            file_path
        );
    }

    // Check for unescaped HTML entities in content (basic check)
    let text_only = strip_html_tags(content);
    assert!(
        !text_only.contains("&amp;amp;"),
        "Double-escaped ampersand in {:?}",
        file_path
    );

    // Check for JavaScript errors (basic)
    if content.contains("<script>") {
        assert!(
            !content.contains("undefined"),
            "Potential JavaScript error in {:?}",
            file_path
        );
    }
}

/// Strip HTML tags for content validation
fn strip_html_tags(html: &str) -> String {
    let re = regex::Regex::new(r"<[^>]+>").unwrap();
    re.replace_all(html, "").to_string()
}

/// Validate that search functionality is properly embedded
pub fn validate_search_embedding(content: &str) {
    // Check for search script
    assert!(content.contains("search.js"), "Missing search.js script");

    // Check for search UI elements
    assert!(
        content.contains("searchBox") || content.contains("search-input"),
        "Missing search input element"
    );

    // Check for keyboard shortcut hint
    assert!(
        content.contains("Ctrl+K") || content.contains("⌘K") || content.contains("/"),
        "Missing search keyboard shortcut hint"
    );
}

/// Validate mobile responsiveness meta tags and styles
pub fn validate_mobile_responsiveness(content: &str) {
    // Viewport meta tag
    assert!(
        content.contains(r#"content="width=device-width, initial-scale=1.0""#),
        "Missing proper viewport meta tag"
    );

    // Check for mobile menu elements
    assert!(
        content.contains("mobile-menu") || content.contains("hamburger"),
        "Missing mobile menu elements"
    );

    // Check for responsive CSS
    assert!(
        content.contains("@media") || content.contains("max-width:"),
        "Missing responsive CSS"
    );
}
