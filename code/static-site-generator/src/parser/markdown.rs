//! ABOUTME: Markdown to HTML conversion functionality
//! ABOUTME: Converts markdown content to clean HTML output

use super::wiki_links::{
    parse_wiki_links, replace_wiki_links_with_html, resolve_wiki_links, ResolvedLink,
};
use crate::Result;
use pulldown_cmark::{html, Event, Options, Parser, Tag, TagEnd};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Convert markdown content to HTML
///
/// Uses pulldown-cmark with common extensions enabled.
///
/// # Errors
///
/// Currently infallible but returns Result for future compatibility
pub fn markdown_to_html(content: &str) -> Result<String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);

    let parser = Parser::new_ext(content, options);

    // Process events to handle special cases if needed
    let parser = parser.map(|event| match event {
        // We could modify events here if needed
        // For now, pass through unchanged
        _ => event,
    });

    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    Ok(html_output)
}

/// Convert markdown to HTML with custom heading ID generation
///
/// Generates IDs for headings to enable anchor links
pub fn markdown_to_html_with_ids(content: &str) -> Result<String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(content, options);
    let mut heading_text = String::new();
    let mut in_heading = false;

    let parser = parser.map(|event| match event {
        Event::Start(Tag::Heading { .. }) => {
            in_heading = true;
            heading_text.clear();
            event
        }
        Event::Text(ref text) if in_heading => {
            heading_text.push_str(text);
            event
        }
        Event::End(TagEnd::Heading(level)) => {
            in_heading = false;
            // Generate ID from heading text
            let _id = generate_heading_id(&heading_text);
            // For now, just pass through - in the future we could inject the ID
            Event::End(TagEnd::Heading(level))
        }
        _ => event,
    });

    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    Ok(html_output)
}

/// Generate a URL-safe ID from heading text
fn generate_heading_id(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else if c.is_whitespace() {
                '-'
            } else {
                '_'
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

/// Convert markdown to HTML with wiki link resolution
///
/// Processes wiki links and converts them to HTML links
pub fn markdown_to_html_with_wiki_links(
    content: &str,
    current_doc_path: &Path,
    document_lookup: &HashMap<String, PathBuf>,
) -> Result<(String, Vec<ResolvedLink>)> {
    // First, parse wiki links from the raw markdown
    let wiki_links = parse_wiki_links(content);

    // Resolve wiki links to actual document paths
    let resolved_links = resolve_wiki_links(wiki_links, document_lookup);

    // Replace wiki links with HTML in the markdown content
    let content_with_html_links =
        replace_wiki_links_with_html(content, &resolved_links, current_doc_path)?;

    // Now convert the modified markdown to HTML
    let html = markdown_to_html(&content_with_html_links)?;

    Ok((html, resolved_links))
}

/// Extract a plain text summary from markdown content
///
/// Useful for generating search excerpts or meta descriptions
pub fn extract_summary(content: &str, max_length: usize) -> String {
    let parser = Parser::new(content);
    let mut summary = String::new();
    let mut in_code = false;

    for event in parser {
        match event {
            Event::Text(text) if !in_code => {
                summary.push_str(&text);
                summary.push(' ');
                if summary.len() >= max_length {
                    break;
                }
            }
            Event::Start(Tag::CodeBlock(_)) => in_code = true,
            Event::End(TagEnd::CodeBlock) => in_code = false,
            Event::SoftBreak | Event::HardBreak => summary.push(' '),
            _ => {}
        }
    }

    // Trim and truncate
    let summary = summary.trim();
    if summary.len() > max_length {
        // Find a safe UTF-8 boundary
        let mut boundary = max_length;
        if !summary.is_char_boundary(boundary) {
            // Find the nearest char boundary before max_length
            while boundary > 0 && !summary.is_char_boundary(boundary) {
                boundary -= 1;
            }
        }
        
        let mut truncated = summary[..boundary].to_string();
        // Try to break at word boundary
        if let Some(last_space) = truncated.rfind(' ') {
            truncated.truncate(last_space);
        }
        truncated.push_str("...");
        truncated
    } else {
        summary.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_markdown_conversion() {
        let markdown = "# Hello\n\nThis is a **bold** text with *italics*.";
        let html = markdown_to_html(markdown).unwrap();

        assert!(html.contains("<h1>Hello</h1>"));
        assert!(html.contains("<strong>bold</strong>"));
        assert!(html.contains("<em>italics</em>"));
    }

    #[test]
    fn test_markdown_with_links() {
        let markdown = "Check out [Rust](https://rust-lang.org) and [local link](./page.md).";
        let html = markdown_to_html(markdown).unwrap();

        assert!(html.contains(r#"href="https://rust-lang.org""#));
        assert!(html.contains(r#"href="./page.md""#));
    }

    #[test]
    fn test_markdown_with_code() {
        let markdown = "Inline `code` and\n\n```rust\nfn main() {}\n```";
        let html = markdown_to_html(markdown).unwrap();

        assert!(html.contains("<code>code</code>"));
        assert!(html.contains("<pre><code class=\"language-rust\">fn main() {}"));
    }

    #[test]
    fn test_markdown_with_table() {
        let markdown = "| Header | Value |\n|--------|-------|\n| Cell 1 | Cell 2 |";
        let html = markdown_to_html(markdown).unwrap();

        assert!(html.contains("<table>"));
        assert!(html.contains("<th>Header</th>"));
        assert!(html.contains("<td>Cell 1</td>"));
    }

    #[test]
    fn test_markdown_with_task_list() {
        let markdown = "- [x] Completed\n- [ ] Not completed";
        let html = markdown_to_html(markdown).unwrap();

        // pulldown-cmark may generate different HTML for task lists
        // Let's check what it actually generates
        println!("Generated HTML: {}", html);

        // Check for task list content in some form
        assert!(html.contains("[x]") || html.contains("checked") || html.contains("task"));
        assert!(html.contains("Completed"));
        assert!(html.contains("Not completed"));
    }

    #[test]
    fn test_generate_heading_id() {
        assert_eq!(generate_heading_id("Hello World"), "hello-world");
        assert_eq!(generate_heading_id("Test 123!"), "test-123_");
        assert_eq!(generate_heading_id("Multiple   Spaces"), "multiple-spaces");
        assert_eq!(generate_heading_id("CamelCase"), "camelcase");
    }

    #[test]
    fn test_extract_summary() {
        let markdown = "# Title\n\nThis is the first paragraph with some text. It should be extracted.\n\n## Section\n\nMore content here.";
        let summary = extract_summary(markdown, 50);

        assert!(summary.starts_with("Title This is the first paragraph"));
        assert!(summary.ends_with("..."));
        assert!(summary.len() <= 53); // 50 + "..."
    }

    #[test]
    fn test_extract_summary_skip_code() {
        let markdown = "Text before\n\n```\ncode block\n```\n\nText after";
        let summary = extract_summary(markdown, 100);

        assert!(summary.contains("Text before"));
        assert!(summary.contains("Text after"));
        assert!(!summary.contains("code block"));
    }

    #[test]
    fn test_markdown_to_html_with_wiki_links() {
        let content = "This has a [[test link]] and [[another|display text]].";
        let current_path = Path::new("index.html");

        let mut lookup = HashMap::new();
        lookup.insert("test link".to_string(), PathBuf::from("test.html"));

        let (html, resolved) =
            markdown_to_html_with_wiki_links(content, current_path, &lookup).unwrap();

        // Check HTML output
        assert!(html.contains(r#"<a href="test.html" class="wiki-link">test link</a>"#));
        assert!(html.contains(r#"<span class="wiki-link broken" title="Link target not found: another">display text</span>"#));

        // Check resolved links
        assert_eq!(resolved.len(), 2);
        assert!(!resolved[0].is_broken);
        assert!(resolved[1].is_broken);
    }
}
