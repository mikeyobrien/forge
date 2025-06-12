// ABOUTME: Integration tests for para-ssg static site generator
// ABOUTME: Tests complete build process and validates generated output

use std::fs;
use std::path::Path;
use tempfile::TempDir;
use walkdir::WalkDir;

mod test_documents;
mod validation;

use test_documents::*;
use validation::*;

/// Helper to run para-ssg and capture results
fn run_para_ssg(
    input_dir: &Path,
    output_dir: &Path,
    verbose: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut cmd = std::process::Command::new("cargo");
    cmd.arg("run");
    cmd.arg("--");
    cmd.arg(input_dir.to_str().unwrap());
    cmd.arg(output_dir.to_str().unwrap());

    if verbose {
        cmd.arg("--verbose");
    }

    let output = cmd.output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!("para-ssg failed:\nstdout: {}\nstderr: {}", stdout, stderr).into());
    }

    Ok(())
}

#[test]
fn test_empty_directory() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    fs::create_dir_all(&input_dir).unwrap();

    // Should handle empty directory gracefully (currently para-ssg exits early with no documents)
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    // Current behavior: no output is generated for empty directories
    // This is expected behavior - para-ssg warns and exits when no .md files are found
    assert!(
        !output_dir.exists(),
        "Output directory should not be created for empty input"
    );
}

#[test]
fn test_basic_para_structure() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create basic PARA structure with test documents
    create_basic_para_structure(&input_dir);

    // Run build
    match run_para_ssg(&input_dir, &output_dir, true) {
        Ok(_) => println!("Build completed successfully"),
        Err(e) => panic!("Build failed: {}", e),
    }

    // List output directory contents
    if output_dir.exists() {
        println!("Output directory exists. Contents:");
        if let Ok(entries) = fs::read_dir(&output_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    println!("  - {:?}", entry.path());
                }
            }
        }
    } else {
        println!("Output directory does not exist!");
    }

    // Validate output structure
    assert!(
        output_dir.join("projects").exists(),
        "projects directory not found"
    );
    assert!(output_dir.join("areas").exists());
    assert!(output_dir.join("resources").exists());
    assert!(output_dir.join("archives").exists());

    // Check category index pages
    assert!(output_dir.join("projects.html").exists());
    assert!(output_dir.join("areas.html").exists());
    assert!(output_dir.join("resources.html").exists());
    assert!(output_dir.join("archives.html").exists());

    // Validate specific documents were generated
    assert!(output_dir.join("projects/website-redesign.html").exists());
    assert!(output_dir
        .join("areas/health/exercise-routine.html")
        .exists());
    assert!(output_dir.join("resources/rust-programming.html").exists());
    assert!(output_dir.join("archives/old-project.html").exists());
}

#[test]
fn test_wiki_links_and_backlinks() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create documents with wiki links
    create_wiki_link_test_documents(&input_dir);

    // Run build with verbose to check for broken links
    run_para_ssg(&input_dir, &output_dir, true).unwrap();

    // Validate wiki links are converted to HTML links
    let doc_a = fs::read_to_string(output_dir.join("projects/document-a.html")).unwrap();
    assert!(doc_a.contains(r#"<a href="../projects/document-b.html">"#));
    assert!(doc_a.contains("Document B"));

    // Validate backlinks are generated
    let doc_b = fs::read_to_string(output_dir.join("projects/document-b.html")).unwrap();
    assert!(doc_b.contains("Backlinks"));
    assert!(doc_b.contains("Document A"));

    // Check broken link handling
    let doc_c = fs::read_to_string(output_dir.join("resources/document-c.html")).unwrap();
    assert!(doc_c.contains(r#"class="wiki-link broken""#));
}

#[test]
fn test_search_functionality() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create documents with searchable content
    create_search_test_documents(&input_dir);

    // Run build
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    // Load and parse search index
    let search_index_path = output_dir.join("search-index.json");
    assert!(search_index_path.exists());

    let search_index_content = fs::read_to_string(&search_index_path).unwrap();
    let search_index: serde_json::Value = serde_json::from_str(&search_index_content).unwrap();

    // Validate search index structure
    assert!(search_index["documents"].is_array());
    assert!(search_index["stats"].is_object());

    let documents = search_index["documents"].as_array().unwrap();
    assert!(documents.len() > 0);

    // Check that documents have required fields
    for doc in documents {
        assert!(doc["title"].is_string());
        assert!(doc["path"].is_string());
        assert!(doc["content"].is_string());
        assert!(doc["excerpt"].is_string());
        assert!(doc["category"].is_string());
    }

    // Verify search.js is embedded in HTML
    let index_html = fs::read_to_string(output_dir.join("index.html")).unwrap();
    assert!(index_html.contains("search.js"));
    assert!(index_html.contains("searchBox"));
}

#[test]
fn test_frontmatter_handling() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create documents with various frontmatter formats
    create_frontmatter_test_documents(&input_dir);

    // Run build
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    // Check documents with frontmatter
    let with_fm = fs::read_to_string(output_dir.join("projects/with-frontmatter.html")).unwrap();
    assert!(with_fm.contains("Document With Frontmatter"));
    assert!(with_fm.contains("tag1"));
    assert!(with_fm.contains("tag2"));

    // Check documents without frontmatter
    let without_fm = fs::read_to_string(output_dir.join("areas/without-frontmatter.html")).unwrap();
    assert!(without_fm.contains("without-frontmatter"));

    // Verify draft documents are excluded from search
    let search_index = fs::read_to_string(output_dir.join("search-index.json")).unwrap();
    assert!(!search_index.contains("Draft Document"));
}

#[test]
fn test_html_validation() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create basic test structure
    create_basic_para_structure(&input_dir);

    // Run build
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    // Validate HTML structure
    let html_files = find_html_files(&output_dir);
    assert!(html_files.len() > 0);

    for html_file in html_files {
        let content = fs::read_to_string(&html_file).unwrap();
        validate_html_structure(&content, &html_file);
    }
}

#[test]
fn test_navigation_and_breadcrumbs() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create nested document structure
    create_nested_document_structure(&input_dir);

    // Run build
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    // Check breadcrumbs in nested document
    let nested_doc =
        fs::read_to_string(output_dir.join("projects/subproject/nested-doc.html")).unwrap();
    assert!(nested_doc.contains(r#"class="breadcrumbs""#));
    assert!(nested_doc.contains("Home"));
    assert!(nested_doc.contains("Projects"));
    assert!(nested_doc.contains("subproject"));

    // Check navigation highlighting
    assert!(nested_doc.contains(r#"class="nav-link active""#));
}

#[test]
fn test_edge_cases() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create documents with edge cases
    create_edge_case_documents(&input_dir);

    // Run build - should handle all edge cases gracefully
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    // Verify special characters in filenames
    assert!(output_dir.join("projects/special-chars-test.html").exists());

    // Verify long content is handled
    let long_doc =
        fs::read_to_string(output_dir.join("resources/very-long-document.html")).unwrap();
    assert!(long_doc.len() > 1000);

    // Verify empty document handling
    assert!(output_dir.join("areas/empty-document.html").exists());
}

#[test]
fn test_performance_with_many_documents() {
    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("input");
    let output_dir = temp_dir.path().join("output");

    // Create many documents to test performance
    create_many_documents(&input_dir, 100);

    let start = std::time::Instant::now();

    // Run build
    run_para_ssg(&input_dir, &output_dir, false).unwrap();

    let duration = start.elapsed();

    // Should complete in reasonable time (adjust as needed)
    assert!(
        duration.as_secs() < 30,
        "Build took too long: {:?}",
        duration
    );

    // Verify all documents were generated
    let generated_files: Vec<_> = walkdir::WalkDir::new(&output_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "html"))
        .collect();

    // Should have 100 documents + index + 4 category pages = 105
    assert!(generated_files.len() >= 105);
}

#[test]
fn test_ci_cd_compatibility() {
    // This test ensures the build works in a CI/CD environment
    // by using only standard paths and avoiding any user-specific configurations

    let temp_dir = TempDir::new().unwrap();
    let input_dir = temp_dir.path().join("ci_input");
    let output_dir = temp_dir.path().join("ci_output");

    // Create minimal test structure
    create_minimal_test_structure(&input_dir);

    // Set CI environment variable (many CI systems set this)
    std::env::set_var("CI", "true");

    // Run build
    let result = run_para_ssg(&input_dir, &output_dir, false);

    // Clean up
    std::env::remove_var("CI");

    // Should succeed
    assert!(result.is_ok());

    // Basic validation
    assert!(output_dir.join("index.html").exists());
}
