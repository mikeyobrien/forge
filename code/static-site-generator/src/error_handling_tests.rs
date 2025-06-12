//! ABOUTME: Comprehensive tests for error handling and validation
//! ABOUTME: Ensures proper error messages and graceful handling of edge cases

#[cfg(test)]
mod tests {
    use crate::{generate_site, Config, ParaSsgError};
    use std::fs;
    use std::path::Path;
    use tempfile::TempDir;

    #[test]
    fn test_empty_input_directory() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        let config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );

        // Should complete successfully but with warning
        let result = generate_site(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_output_directory_is_file() {
        let temp_dir = TempDir::new().unwrap();
        let output_file = temp_dir.path().join("output.txt");
        fs::write(&output_file, "test").unwrap();

        let input_dir = TempDir::new().unwrap();
        // Create at least one markdown file so we get past the empty directory check
        fs::write(input_dir.path().join("test.md"), "# Test").unwrap();

        let config = Config::new(
            input_dir.path().to_string_lossy().to_string(),
            output_file.to_string_lossy().to_string(),
        );

        let result = generate_site(&config);
        assert!(result.is_err());
        match result.unwrap_err() {
            ParaSsgError::InvalidPath(msg) => {
                assert!(msg.contains("exists and is a file"));
            }
            _ => panic!("Expected InvalidPath error"),
        }
    }

    #[test]
    fn test_malformed_frontmatter_document() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        // Create a document with invalid YAML
        let bad_doc = temp_dir.path().join("bad.md");
        fs::write(
            &bad_doc,
            r#"---
title: Test
invalid: yaml: syntax:
tags:
  - missing closing bracket
---
# Content"#,
        )
        .unwrap();

        let config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );

        // Should continue building despite one document failing
        let result = generate_site(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_document_with_tabs_in_yaml() {
        let temp_dir = TempDir::new().unwrap();

        // Create a document with tabs in YAML
        let tab_doc = temp_dir.path().join("tabs.md");
        fs::write(
            &tab_doc,
            "---\ntitle: Test\ntags:\n\t- tab-indented\n---\n# Content",
        )
        .unwrap();

        let result =
            crate::parser::parse_document(&tab_doc, Path::new("tabs.md"), "root".to_string());

        assert!(result.is_err());
        match result.unwrap_err() {
            ParaSsgError::ParseError(msg) => {
                assert!(msg.contains("Tab characters are not allowed"));
            }
            _ => panic!("Expected ParseError with tab message"),
        }
    }

    #[test]
    fn test_unclosed_frontmatter() {
        let temp_dir = TempDir::new().unwrap();

        let unclosed_doc = temp_dir.path().join("unclosed.md");
        fs::write(
            &unclosed_doc,
            "---\ntitle: Test\nNo closing delimiter\n# Content",
        )
        .unwrap();

        let result = crate::parser::parse_document(
            &unclosed_doc,
            Path::new("unclosed.md"),
            "root".to_string(),
        );

        assert!(result.is_err());
        match result.unwrap_err() {
            ParaSsgError::ParseError(msg) => {
                assert!(msg.contains("no closing delimiter"));
            }
            _ => panic!("Expected ParseError for unclosed frontmatter"),
        }
    }

    #[test]
    fn test_verbose_flag_output() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        // Create test documents
        fs::write(temp_dir.path().join("doc1.md"), "# Document 1").unwrap();
        fs::write(
            temp_dir.path().join("doc2.md"),
            "---\ntitle: Document 2\n---\n# Content",
        )
        .unwrap();

        let mut config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );
        config.verbose = true;

        // Should complete with verbose output
        let result = generate_site(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_permission_denied_simulation() {
        // This test checks that we handle permission errors gracefully
        let config = Config::new("/root/nonexistent".to_string(), "/root/output".to_string());

        let result = generate_site(&config);
        assert!(result.is_err());
    }

    #[test]
    fn test_broken_wiki_links_handling() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        // Create a document with broken wiki links
        fs::write(
            temp_dir.path().join("doc.md"),
            r#"---
title: Test Document
---
# Test

This has a [[broken-link]] and another [[missing-document]].
"#,
        )
        .unwrap();

        let config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );

        // Should complete but report broken links
        let result = generate_site(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_deeply_nested_documents() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        // Create deeply nested structure
        let deep_path = temp_dir
            .path()
            .join("a")
            .join("b")
            .join("c")
            .join("d")
            .join("e")
            .join("f");
        fs::create_dir_all(&deep_path).unwrap();
        fs::write(deep_path.join("deep.md"), "# Deep Document").unwrap();

        let mut config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );
        config.verbose = true;

        let result = generate_site(&config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_no_para_structure_warning() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        // Create documents without PARA structure
        fs::write(temp_dir.path().join("doc1.md"), "# Document 1").unwrap();
        fs::write(temp_dir.path().join("doc2.md"), "# Document 2").unwrap();

        let config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );

        // Should complete with warning about missing PARA structure
        let result = generate_site(&config);
        assert!(result.is_ok());
    }
}
