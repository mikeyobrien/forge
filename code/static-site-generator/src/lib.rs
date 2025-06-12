//! ABOUTME: Library exports for para-ssg static site generator
//! ABOUTME: Provides public API for the static site generation functionality

pub mod generator;
pub mod parser;
pub mod theme;
pub mod utils;

#[cfg(test)]
mod error_handling_tests;

use rayon::prelude::*;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

/// Error types for para-ssg operations
#[derive(Debug, thiserror::Error)]
pub enum ParaSsgError {
    /// IO operation error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Invalid path provided
    #[error("Invalid path: {0}")]
    InvalidPath(String),

    /// Directory not found
    #[error("Directory not found: {0}")]
    DirectoryNotFound(String),

    /// Document parsing error
    #[error("Parse error: {0}")]
    ParseError(String),

    /// Site generation error
    #[error("Generation error: {0}")]
    GenerationError(String),

    /// JSON serialization error
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Result type for para-ssg operations
pub type Result<T> = std::result::Result<T, ParaSsgError>;

/// Configuration for site generation
#[derive(Debug, Clone)]
pub struct Config {
    pub input_dir: String,
    pub output_dir: String,
    pub base_url: String,
    pub site_title: String,
    pub verbose: bool,
}

impl Config {
    /// Create new configuration with input and output directories
    pub fn new(input_dir: String, output_dir: String) -> Self {
        Self {
            input_dir,
            output_dir,
            base_url: "/".to_string(),
            site_title: "Knowledge Base".to_string(),
            verbose: false,
        }
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<()> {
        if !Path::new(&self.input_dir).exists() {
            return Err(ParaSsgError::DirectoryNotFound(self.input_dir.clone()));
        }

        if !Path::new(&self.input_dir).is_dir() {
            return Err(ParaSsgError::InvalidPath(format!(
                "Input path '{}' is not a directory",
                self.input_dir
            )));
        }

        Ok(())
    }
}

/// Generate static site from configuration
pub fn generate_site(config: &Config) -> Result<()> {
    let start_time = std::time::Instant::now();
    config.validate()?;

    // Discover all markdown documents
    let input_path = Path::new(&config.input_dir);
    println!("📂 Discovering documents in '{}'...", config.input_dir);

    let document_infos = utils::traverse_directory(input_path)?;
    let stats = utils::ParaStatistics::from_documents(&document_infos);

    if stats.total_count == 0 {
        eprintln!(
            "⚠️  Warning: No markdown documents found in '{}'",
            config.input_dir
        );
        eprintln!("   Ensure your input directory contains .md files");
        return Ok(());
    }

    println!("📊 Found {} documents:", stats.total_count);
    if stats.projects_count > 0 {
        println!("   - Projects: {}", stats.projects_count);
    }
    if stats.areas_count > 0 {
        println!("   - Areas: {}", stats.areas_count);
    }
    if stats.resources_count > 0 {
        println!("   - Resources: {}", stats.resources_count);
    }
    if stats.archives_count > 0 {
        println!("   - Archives: {}", stats.archives_count);
    }
    if stats.root_count > 0 {
        println!("   - Root: {}", stats.root_count);
    }

    // Check for PARA structure
    if !utils::has_para_structure(input_path) {
        println!("⚠️  Warning: No PARA structure detected in input directory");
        println!("   Consider organizing your content into projects/, areas/, resources/, and archives/ folders");
    }

    // Create output directory
    let output_path = Path::new(&config.output_dir);
    utils::create_output_directory(output_path)?;
    println!("✅ Created output directory: {}", config.output_dir);

    // Parse all documents in parallel (first pass - basic parsing)
    println!("📝 Parsing documents...");
    let total_docs = document_infos.len();
    let processed = Arc::new(AtomicUsize::new(0));
    let processed_clone = processed.clone();

    let parse_results: Vec<_> = document_infos
        .par_iter()
        .map(|doc_info| {
            let result = parser::parse_document(
                &doc_info.path,
                &doc_info.relative_path,
                doc_info.category.clone(),
            );

            if config.verbose {
                match &result {
                    Ok(doc) => println!(
                        "   ✓ Parsed: {} ({})",
                        doc.title(),
                        doc_info.relative_path.display()
                    ),
                    Err(e) => {
                        eprintln!("   ✗ Failed: {} - {}", doc_info.relative_path.display(), e)
                    }
                }
            }

            let count = processed_clone.fetch_add(1, Ordering::SeqCst) + 1;
            if !config.verbose && (count % 10 == 0 || count == total_docs) {
                print!("\r   Progress: {}/{} documents", count, total_docs);
                use std::io::Write;
                std::io::stdout().flush().ok();
            }

            result
        })
        .collect();

    if !config.verbose {
        println!(); // New line after progress
    }

    let mut documents = Vec::new();
    let mut parse_errors = 0;
    let mut parse_warnings = Vec::new();

    for (i, result) in parse_results.into_iter().enumerate() {
        match result {
            Ok(doc) => {
                // Check for potential issues
                if doc.metadata.title.is_none() && config.verbose {
                    parse_warnings.push(format!(
                        "'{}' has no title in frontmatter",
                        document_infos[i].relative_path.display()
                    ));
                }
                if doc.metadata.tags.is_empty() && config.verbose {
                    parse_warnings.push(format!(
                        "'{}' has no tags",
                        document_infos[i].relative_path.display()
                    ));
                }
                documents.push(doc);
            }
            Err(e) => {
                eprintln!(
                    "⚠️  Failed to parse '{}': {}",
                    document_infos[i].path.display(),
                    e
                );
                parse_errors += 1;
            }
        }
    }

    if parse_errors > 0 {
        println!("⚠️  {} document(s) failed to parse", parse_errors);
    }

    if config.verbose && !parse_warnings.is_empty() {
        println!("\n📋 Parse warnings:");
        for warning in parse_warnings {
            println!("   - {}", warning);
        }
    }

    println!("✅ Successfully parsed {} documents", documents.len());

    // Build document lookup for wiki link resolution
    println!("🔗 Processing wiki links...");
    let document_lookup: Vec<(PathBuf, String)> = documents
        .iter()
        .map(|doc| (doc.output_path.clone(), doc.title().to_string()))
        .collect();
    let lookup_map = parser::build_document_lookup(&document_lookup);

    // Process wiki links in parallel (second pass)
    if config.verbose {
        println!("🔗 Processing wiki links in detail...");
    }
    let processed = Arc::new(AtomicUsize::new(0));
    let processed_clone = processed.clone();
    let total_docs = documents.len();

    let broken_links_total = Arc::new(AtomicUsize::new(0));
    let broken_links_clone = broken_links_total.clone();

    documents = documents
        .into_par_iter()
        .map(|mut doc| {
            let (html_with_links, resolved_links) = parser::markdown_to_html_with_wiki_links(
                &doc.raw_content,
                &doc.output_path,
                &lookup_map,
            )
            .expect("Wiki link processing failed");

            doc.html_content = html_with_links;
            doc.wiki_links = resolved_links.clone();

            // Count and collect broken links
            let broken_links = parser::get_broken_links(&doc.wiki_links);
            if !broken_links.is_empty() {
                broken_links_clone.fetch_add(broken_links.len(), Ordering::SeqCst);
                if config.verbose {
                    for link in &broken_links {
                        println!(
                            "   ⚠️  Broken link in '{}': [[{}]]",
                            doc.relative_path.display(),
                            link.target
                        );
                    }
                }
            }

            let count = processed_clone.fetch_add(1, Ordering::SeqCst) + 1;
            if !config.verbose && (count % 10 == 0 || count == total_docs) {
                print!("\r   Progress: {}/{} documents", count, total_docs);
                use std::io::Write;
                std::io::stdout().flush().ok();
            }

            doc
        })
        .collect();

    if !config.verbose {
        println!(); // New line after progress
    }

    let broken_links_total = broken_links_total.load(Ordering::SeqCst);

    if broken_links_total > 0 {
        println!("⚠️  Total broken wiki links: {}", broken_links_total);
        if !config.verbose {
            println!("   Run with --verbose to see details");
        }
    } else {
        println!("✅ All wiki links resolved successfully");
    }

    // Build backlink index
    println!("🔙 Building backlinks...");
    let backlink_index = generator::build_backlink_index(&documents);
    generator::apply_backlinks_to_documents(&mut documents, backlink_index);

    // Calculate and display link statistics
    let link_stats = generator::calculate_link_statistics(&documents);
    println!("📊 Link statistics:");
    println!("   - Total links: {}", link_stats.total_links);
    println!("   - Valid links: {}", link_stats.valid_links);
    println!("   - Broken links: {}", link_stats.broken_links);
    println!(
        "   - Documents with backlinks: {}",
        link_stats.documents_with_backlinks
    );
    if link_stats.orphaned_documents.len() > 0 {
        println!(
            "   - Orphaned documents: {}",
            link_stats.orphaned_documents.len()
        );
    }

    // Generate search index
    println!("🔍 Generating search index...");
    generator::generate_search_index(&documents, output_path)?;

    // Additional validation warnings
    if config.verbose {
        let mut validation_warnings = Vec::new();

        // Check for documents with very long titles
        for doc in &documents {
            if doc.title().len() > 100 {
                validation_warnings.push(format!(
                    "Document '{}' has a very long title ({} chars)",
                    doc.relative_path.display(),
                    doc.title().len()
                ));
            }
        }

        // Check for deeply nested documents
        for doc in &documents {
            let depth = doc.relative_path.components().count();
            if depth > 5 {
                validation_warnings.push(format!(
                    "Document '{}' is deeply nested ({} levels)",
                    doc.relative_path.display(),
                    depth
                ));
            }
        }

        if !validation_warnings.is_empty() {
            println!("\n📋 Validation warnings:");
            for warning in validation_warnings {
                println!("   - {}", warning);
            }
        }
    }

    // Generate HTML pages
    println!("🔨 Generating HTML pages...");
    let generator = Arc::new(generator::HtmlGenerator::new(output_path.to_path_buf()));

    // Save document count before moving documents
    let total_document_count = documents.len();

    // Group documents by category
    let mut categories: std::collections::HashMap<String, Vec<parser::Document>> =
        std::collections::HashMap::new();
    for doc in documents {
        categories
            .entry(doc.effective_category().to_string())
            .or_insert_with(Vec::new)
            .push(doc);
    }

    // Generate individual document pages in parallel
    let processed = Arc::new(AtomicUsize::new(0));
    let processed_clone = processed.clone();
    let all_docs: Vec<_> = categories.values().flatten().collect();
    let total_pages = all_docs.len();

    all_docs.par_iter().try_for_each(|doc| -> Result<()> {
        let html = generator.generate_document_page(doc)?;
        generator.write_page(&doc.output_path, &html)?;

        let count = processed_clone.fetch_add(1, Ordering::SeqCst) + 1;
        if count % 10 == 0 || count == total_pages {
            print!("\r   Progress: {}/{} pages", count, total_pages);
            use std::io::Write;
            std::io::stdout().flush().ok();
        }

        Ok(())
    })?;

    println!(); // New line after progress
    let generated_count = total_pages;

    // Generate category index pages
    for category in &["projects", "areas", "resources", "archives"] {
        if let Some(docs) = categories.get(*category) {
            let html = generator.generate_category_page(category, docs)?;
            let index_path = Path::new(category).join("index.html");
            generator.write_page(&index_path, &html)?;
        }
    }

    // Generate home page
    let mut category_counts = std::collections::HashMap::new();
    category_counts.insert("projects".to_string(), stats.projects_count);
    category_counts.insert("areas".to_string(), stats.areas_count);
    category_counts.insert("resources".to_string(), stats.resources_count);
    category_counts.insert("archives".to_string(), stats.archives_count);

    let home_html = generator.generate_home_page(&category_counts)?;
    generator.write_page(Path::new("index.html"), &home_html)?;

    println!("✅ Generated {} HTML pages", generated_count);

    let elapsed = start_time.elapsed();

    // Build summary
    println!("\n📊 Build Summary:");
    println!("   - Documents parsed: {}", total_document_count);
    println!("   - HTML pages generated: {}", generated_count + 5); // +5 for category pages and home
    println!("   - Wiki links processed: {}", link_stats.total_links);
    if link_stats.broken_links > 0 {
        println!("   - ⚠️  Broken links: {}", link_stats.broken_links);
    }
    if link_stats.orphaned_documents.len() > 0 {
        println!(
            "   - ⚠️  Orphaned documents: {}",
            link_stats.orphaned_documents.len()
        );
        if config.verbose {
            for orphan in &link_stats.orphaned_documents {
                println!("      - {}", orphan.display());
            }
        }
    }
    if parse_errors > 0 {
        println!("   - ⚠️  Parse errors: {}", parse_errors);
    }
    println!("   - Build time: {:.2}s", elapsed.as_secs_f32());
    println!("   - Output directory: {}", config.output_dir);

    if config.verbose {
        let avg_time_per_doc = elapsed.as_millis() as f32 / total_document_count as f32;
        println!("   - Average time per document: {:.2}ms", avg_time_per_doc);
    }

    println!("\n🎉 Site generation complete!");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_config_new() {
        let config = Config::new("/input".to_string(), "/output".to_string());

        assert_eq!(config.input_dir, "/input");
        assert_eq!(config.output_dir, "/output");
        assert_eq!(config.base_url, "/");
        assert_eq!(config.site_title, "Knowledge Base");
    }

    #[test]
    fn test_config_validate_existing_directory() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            "/output".to_string(),
        );

        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_config_validate_missing_directory() {
        let config = Config::new("/nonexistent/directory".to_string(), "/output".to_string());

        let result = config.validate();
        assert!(result.is_err());

        match result.unwrap_err() {
            ParaSsgError::DirectoryNotFound(path) => {
                assert_eq!(path, "/nonexistent/directory");
            }
            _ => panic!("Expected DirectoryNotFound error"),
        }
    }

    #[test]
    fn test_config_validate_file_not_directory() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("notdir.txt");
        fs::write(&file_path, "content").unwrap();

        let config = Config::new(
            file_path.to_string_lossy().to_string(),
            "/output".to_string(),
        );

        let result = config.validate();
        assert!(result.is_err());

        match result.unwrap_err() {
            ParaSsgError::InvalidPath(msg) => {
                assert!(msg.contains("is not a directory"));
            }
            _ => panic!("Expected InvalidPath error"),
        }
    }

    #[test]
    fn test_generate_site_valid_config() {
        let temp_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();

        // Create a test markdown file
        let test_file = temp_dir.path().join("test.md");
        fs::write(&test_file, "# Test Document\n\nContent here.").unwrap();

        let config = Config::new(
            temp_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );

        let result = generate_site(&config);
        assert!(result.is_ok());

        // Verify output directory was created
        assert!(output_dir.path().exists());
    }

    #[test]
    fn test_generate_site_invalid_config() {
        let config = Config::new("/nonexistent".to_string(), "/output".to_string());

        let result = generate_site(&config);
        assert!(result.is_err());
    }
}
