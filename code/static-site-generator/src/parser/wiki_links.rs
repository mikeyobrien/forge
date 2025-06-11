//! ABOUTME: Wiki link parsing and resolution functionality
//! ABOUTME: Handles [[document-name]] style links from Obsidian

use crate::{ParaSsgError, Result};
use lazy_static::lazy_static;
use regex::Regex;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

lazy_static! {
    /// Regex pattern for matching wiki links: [[link]] or [[link|display]]
    static ref WIKI_LINK_RE: Regex = Regex::new(r"\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]").unwrap();
}

/// Represents a parsed wiki link
#[derive(Debug, Clone, PartialEq)]
pub struct WikiLink {
    /// The full matched text including brackets
    pub full_match: String,
    /// The link target (before the pipe)
    pub target: String,
    /// The display text (after the pipe, if present)
    pub display: Option<String>,
    /// Starting position in the source text
    pub start: usize,
    /// Ending position in the source text
    pub end: usize,
}

/// Result of link resolution
#[derive(Debug, Clone)]
pub struct ResolvedLink {
    /// The original wiki link
    pub wiki_link: WikiLink,
    /// The resolved path to the target document (if found)
    pub resolved_path: Option<PathBuf>,
    /// Whether the link is broken
    pub is_broken: bool,
}

/// Parse wiki links from content
///
/// Returns all wiki links found in the content with their positions
pub fn parse_wiki_links(content: &str) -> Vec<WikiLink> {
    WIKI_LINK_RE
        .captures_iter(content)
        .map(|cap| {
            let full_match = cap.get(0).unwrap();
            let target = cap.get(1).unwrap().as_str().trim().to_string();
            let display = cap.get(2).map(|m| m.as_str().trim().to_string());

            WikiLink {
                full_match: full_match.as_str().to_string(),
                target,
                display,
                start: full_match.start(),
                end: full_match.end(),
            }
        })
        .collect()
}

/// Build a lookup map for document resolution
///
/// Maps normalized titles/filenames to their paths
pub fn build_document_lookup(documents: &[(PathBuf, String)]) -> HashMap<String, PathBuf> {
    let mut lookup = HashMap::new();

    for (path, title) in documents {
        // Add by title (normalized)
        let normalized_title = normalize_for_lookup(title);
        lookup.insert(normalized_title, path.clone());

        // Add by filename without extension (normalized)
        if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
            let normalized_stem = normalize_for_lookup(stem);
            // Only insert if not already present (title takes precedence)
            lookup
                .entry(normalized_stem)
                .or_insert_with(|| path.clone());
        }

        // Add by relative path without extension (normalized)
        let mut path_without_ext = path.clone();
        path_without_ext.set_extension("");
        if let Some(path_str) = path_without_ext.to_str() {
            let normalized_path = normalize_for_lookup(path_str);
            lookup
                .entry(normalized_path)
                .or_insert_with(|| path.clone());
        }
    }

    lookup
}

/// Normalize a string for case-insensitive lookup
fn normalize_for_lookup(s: &str) -> String {
    s.to_lowercase()
        .replace('-', " ")
        .replace('_', " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Resolve wiki links to document paths
///
/// Takes parsed wiki links and a document lookup map, returns resolved links
pub fn resolve_wiki_links(
    wiki_links: Vec<WikiLink>,
    document_lookup: &HashMap<String, PathBuf>,
) -> Vec<ResolvedLink> {
    wiki_links
        .into_iter()
        .map(|wiki_link| {
            let normalized_target = normalize_for_lookup(&wiki_link.target);
            let resolved_path = document_lookup.get(&normalized_target).cloned();
            let is_broken = resolved_path.is_none();

            ResolvedLink {
                wiki_link,
                resolved_path,
                is_broken,
            }
        })
        .collect()
}

/// Replace wiki links in content with HTML links
///
/// Takes the original content and resolved links, returns content with HTML links
pub fn replace_wiki_links_with_html(
    content: &str,
    resolved_links: &[ResolvedLink],
    current_doc_path: &Path,
) -> Result<String> {
    let mut result = content.to_string();

    // Sort by position (descending) to replace from end to start
    let mut sorted_links = resolved_links.to_vec();
    sorted_links.sort_by_key(|link| std::cmp::Reverse(link.wiki_link.start));

    for resolved_link in sorted_links {
        let wiki_link = &resolved_link.wiki_link;

        let replacement = if let Some(target_path) = &resolved_link.resolved_path {
            // Calculate relative path from current document to target
            let relative_path = calculate_relative_path(current_doc_path, target_path)?;

            // Use display text if provided, otherwise use the target
            let display_text = wiki_link.display.as_ref().unwrap_or(&wiki_link.target);

            format!(
                r#"<a href="{}" class="wiki-link">{}</a>"#,
                html_escape(&relative_path),
                html_escape(display_text)
            )
        } else {
            // Broken link - render as span with special class
            let display_text = wiki_link.display.as_ref().unwrap_or(&wiki_link.target);

            format!(
                r#"<span class="wiki-link broken" title="Link target not found: {}">{}</span>"#,
                html_escape(&wiki_link.target),
                html_escape(display_text)
            )
        };

        // Replace in the string
        result.replace_range(wiki_link.start..wiki_link.end, &replacement);
    }

    Ok(result)
}

/// Calculate relative path between two document paths
fn calculate_relative_path(from: &Path, to: &Path) -> Result<String> {
    // Convert to HTML paths (always use forward slashes)
    let from_dir = from.parent().unwrap_or_else(|| Path::new(""));

    // Simple relative path calculation
    // In a real implementation, this would be more sophisticated
    let mut from_components: Vec<_> = from_dir.components().collect();
    let mut to_components: Vec<_> = to.components().collect();

    // Find common prefix
    let common_prefix_len = from_components
        .iter()
        .zip(to_components.iter())
        .take_while(|(a, b)| a == b)
        .count();

    // Remove common prefix
    from_components.drain(..common_prefix_len);
    to_components.drain(..common_prefix_len);

    // Build relative path
    let mut result = PathBuf::new();

    // Add ../ for each remaining component in 'from'
    for _ in from_components {
        result.push("..");
    }

    // Add remaining components from 'to'
    for component in to_components {
        result.push(component);
    }

    // Convert to string with forward slashes
    Ok(result
        .to_str()
        .ok_or_else(|| ParaSsgError::ParseError("Invalid path".to_string()))?
        .replace('\\', "/"))
}

/// HTML escape a string
fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Extract broken links from resolved links
pub fn get_broken_links(resolved_links: &[ResolvedLink]) -> Vec<&WikiLink> {
    resolved_links
        .iter()
        .filter(|link| link.is_broken)
        .map(|link| &link.wiki_link)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_wiki_link() {
        let content = "This is a [[test link]] in text.";
        let links = parse_wiki_links(content);

        assert_eq!(links.len(), 1);
        assert_eq!(links[0].target, "test link");
        assert_eq!(links[0].display, None);
        assert_eq!(links[0].full_match, "[[test link]]");
    }

    #[test]
    fn test_parse_wiki_link_with_display() {
        let content = "This is a [[target|display text]] link.";
        let links = parse_wiki_links(content);

        assert_eq!(links.len(), 1);
        assert_eq!(links[0].target, "target");
        assert_eq!(links[0].display, Some("display text".to_string()));
    }

    #[test]
    fn test_parse_multiple_wiki_links() {
        let content = "First [[link1]], second [[link2|text]], and [[link3]].";
        let links = parse_wiki_links(content);

        assert_eq!(links.len(), 3);
        assert_eq!(links[0].target, "link1");
        assert_eq!(links[1].target, "link2");
        assert_eq!(links[2].target, "link3");
    }

    #[test]
    fn test_normalize_for_lookup() {
        assert_eq!(normalize_for_lookup("Test Document"), "test document");
        assert_eq!(normalize_for_lookup("test-document"), "test document");
        assert_eq!(normalize_for_lookup("test_document"), "test document");
        assert_eq!(normalize_for_lookup("Test  Document"), "test document");
    }

    #[test]
    fn test_build_document_lookup() {
        let documents = vec![
            (
                PathBuf::from("projects/test.md"),
                "Test Document".to_string(),
            ),
            (
                PathBuf::from("areas/my-file.md"),
                "My File Title".to_string(),
            ),
        ];

        let lookup = build_document_lookup(&documents);

        // Should find by title
        assert!(lookup.contains_key("test document"));
        assert!(lookup.contains_key("my file title"));

        // Should find by filename
        assert!(lookup.contains_key("test"));
        assert!(lookup.contains_key("my file"));

        // Should find by path
        assert!(lookup.contains_key("projects/test"));
        assert!(lookup.contains_key("areas/my file"));
    }

    #[test]
    fn test_resolve_wiki_links() {
        let wiki_links = vec![
            WikiLink {
                full_match: "[[Test Document]]".to_string(),
                target: "Test Document".to_string(),
                display: None,
                start: 0,
                end: 16,
            },
            WikiLink {
                full_match: "[[nonexistent]]".to_string(),
                target: "nonexistent".to_string(),
                display: None,
                start: 20,
                end: 35,
            },
        ];

        let mut lookup = HashMap::new();
        lookup.insert("test document".to_string(), PathBuf::from("test.md"));

        let resolved = resolve_wiki_links(wiki_links, &lookup);

        assert_eq!(resolved.len(), 2);
        assert!(!resolved[0].is_broken);
        assert_eq!(resolved[0].resolved_path, Some(PathBuf::from("test.md")));
        assert!(resolved[1].is_broken);
        assert_eq!(resolved[1].resolved_path, None);
    }

    #[test]
    fn test_calculate_relative_path() {
        // Same directory
        let from = Path::new("projects/doc1.html");
        let to = Path::new("projects/doc2.html");
        assert_eq!(calculate_relative_path(from, to).unwrap(), "doc2.html");

        // Different directories
        let from = Path::new("projects/sub/doc1.html");
        let to = Path::new("areas/doc2.html");
        assert_eq!(
            calculate_relative_path(from, to).unwrap(),
            "../../areas/doc2.html"
        );

        // To subdirectory
        let from = Path::new("index.html");
        let to = Path::new("projects/doc.html");
        assert_eq!(
            calculate_relative_path(from, to).unwrap(),
            "projects/doc.html"
        );
    }

    #[test]
    fn test_html_escape() {
        assert_eq!(html_escape("Test & <tag>"), "Test &amp; &lt;tag&gt;");
        assert_eq!(
            html_escape("\"quotes\" 'apostrophe'"),
            "&quot;quotes&quot; &#39;apostrophe&#39;"
        );
    }

    #[test]
    fn test_replace_wiki_links_with_html() {
        let content = "Start [[test]] middle [[broken|display]] end.";
        let resolved_links = vec![
            ResolvedLink {
                wiki_link: WikiLink {
                    full_match: "[[test]]".to_string(),
                    target: "test".to_string(),
                    display: None,
                    start: 6,
                    end: 14,
                },
                resolved_path: Some(PathBuf::from("test.html")),
                is_broken: false,
            },
            ResolvedLink {
                wiki_link: WikiLink {
                    full_match: "[[broken|display]]".to_string(),
                    target: "broken".to_string(),
                    display: Some("display".to_string()),
                    start: 22,
                    end: 40,
                },
                resolved_path: None,
                is_broken: true,
            },
        ];

        let result =
            replace_wiki_links_with_html(content, &resolved_links, Path::new("index.html"))
                .unwrap();

        assert!(result.contains(r#"<a href="test.html" class="wiki-link">test</a>"#));
        assert!(result.contains(
            r#"<span class="wiki-link broken" title="Link target not found: broken">display</span>"#
        ));
    }
}
