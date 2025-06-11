//! ABOUTME: YAML frontmatter parsing functionality
//! ABOUTME: Extracts metadata from markdown file headers

use super::document::DocumentMetadata;
use crate::{ParaSsgError, Result};

/// Parse frontmatter and content from markdown text
///
/// Returns a tuple of (metadata, content) where content is the markdown
/// without the frontmatter section.
///
/// # Errors
///
/// Returns error if YAML parsing fails
pub fn parse_frontmatter(content: &str) -> Result<(DocumentMetadata, String)> {
    // Check if content starts with frontmatter delimiter
    if !content.starts_with("---\n") && !content.starts_with("---\r\n") {
        // No frontmatter, return default metadata and full content
        return Ok((DocumentMetadata::default(), content.to_string()));
    }

    // Find the closing delimiter
    let content_after_first = if content.starts_with("---\n") {
        &content[4..]
    } else {
        &content[5..] // ---\r\n
    };

    // Look for the closing ---
    // Also check at the start in case of empty frontmatter
    let end_pattern = "---\n";
    let end_pattern_crlf = "---\r\n";

    let (yaml_content, remaining_content) = if content_after_first.starts_with(end_pattern) {
        // Empty frontmatter
        ("", &content_after_first[end_pattern.len()..])
    } else if content_after_first.starts_with(end_pattern_crlf) {
        // Empty frontmatter with CRLF
        ("", &content_after_first[end_pattern_crlf.len()..])
    } else if let Some(end_pos) = content_after_first.find("\n---\n") {
        (
            &content_after_first[..end_pos],
            &content_after_first[end_pos + "\n---\n".len()..],
        )
    } else if let Some(end_pos) = content_after_first.find("\r\n---\r\n") {
        (
            &content_after_first[..end_pos],
            &content_after_first[end_pos + "\r\n---\r\n".len()..],
        )
    } else {
        // No closing delimiter found
        return Err(ParaSsgError::ParseError(
            "Frontmatter starting delimiter found but no closing delimiter".to_string(),
        ));
    };

    // Parse YAML content
    let metadata: DocumentMetadata = serde_yaml::from_str(yaml_content).map_err(|e| {
        ParaSsgError::ParseError(format!("Failed to parse YAML frontmatter: {}", e))
    })?;

    Ok((metadata, remaining_content.to_string()))
}

/// Extract just the frontmatter YAML string if present
pub fn extract_frontmatter(content: &str) -> Option<String> {
    if !content.starts_with("---\n") && !content.starts_with("---\r\n") {
        return None;
    }

    let content_after_first = if content.starts_with("---\n") {
        &content[4..]
    } else {
        &content[5..]
    };

    if let Some(end_pos) = content_after_first.find("\n---\n") {
        Some(content_after_first[..end_pos].to_string())
    } else if let Some(end_pos) = content_after_first.find("\r\n---\r\n") {
        Some(content_after_first[..end_pos].to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};

    #[test]
    fn test_parse_no_frontmatter() {
        let content = "# Hello World\n\nThis is content.";
        let (metadata, body) = parse_frontmatter(content).unwrap();

        assert_eq!(metadata.title, None);
        assert_eq!(body, content);
    }

    #[test]
    fn test_parse_basic_frontmatter() {
        let content =
            "---\ntitle: My Document\ntags:\n  - rust\n  - testing\n---\n# Content\n\nBody text";
        let (metadata, body) = parse_frontmatter(content).unwrap();

        assert_eq!(metadata.title, Some("My Document".to_string()));
        assert_eq!(
            metadata.tags,
            vec!["rust".to_string(), "testing".to_string()]
        );
        assert_eq!(body, "# Content\n\nBody text");
    }

    #[test]
    fn test_parse_frontmatter_with_dates() {
        let content = "---\ntitle: Test\ncreated: 2023-01-15T10:00:00Z\nmodified: 2023-01-16T15:30:00Z\n---\nContent";
        let (metadata, _) = parse_frontmatter(content).unwrap();

        assert_eq!(metadata.title, Some("Test".to_string()));
        assert_eq!(
            metadata.created,
            Some(Utc.with_ymd_and_hms(2023, 1, 15, 10, 0, 0).unwrap())
        );
        assert_eq!(
            metadata.modified,
            Some(Utc.with_ymd_and_hms(2023, 1, 16, 15, 30, 0).unwrap())
        );
    }

    #[test]
    fn test_parse_frontmatter_with_custom_fields() {
        let content = "---\ntitle: Test\ncustom_field: value\nnested:\n  field: data\n---\nContent";
        let (metadata, _) = parse_frontmatter(content).unwrap();

        assert_eq!(metadata.title, Some("Test".to_string()));
        assert!(metadata.custom.contains_key("custom_field"));
        assert!(metadata.custom.contains_key("nested"));
    }

    #[test]
    fn test_parse_empty_frontmatter() {
        let content = "---\n---\nContent";
        let (metadata, body) = parse_frontmatter(content).unwrap();

        assert_eq!(metadata.title, None);
        assert_eq!(body, "Content");
    }

    #[test]
    fn test_parse_malformed_frontmatter() {
        let content = "---\ninvalid: yaml: syntax:\n---\nContent";
        let result = parse_frontmatter(content);

        assert!(result.is_err());
    }

    #[test]
    fn test_parse_unclosed_frontmatter() {
        let content = "---\ntitle: Test\nNo closing delimiter";
        let result = parse_frontmatter(content);

        assert!(result.is_err());
    }

    #[test]
    fn test_extract_frontmatter() {
        let content = "---\ntitle: Test\n---\nContent";
        let yaml = extract_frontmatter(content).unwrap();

        assert_eq!(yaml, "title: Test");
    }

    #[test]
    fn test_parse_frontmatter_crlf() {
        let content = "---\r\ntitle: Test\r\n---\r\nContent";
        let (metadata, body) = parse_frontmatter(content).unwrap();

        assert_eq!(metadata.title, Some("Test".to_string()));
        assert_eq!(body, "Content");
    }
}
