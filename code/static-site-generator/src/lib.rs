//! ABOUTME: Library exports for para-ssg static site generator
//! ABOUTME: Provides public API for the static site generation functionality

pub mod generator;
pub mod parser;
pub mod theme;
pub mod utils;

use std::path::Path;

/// Error types for para-ssg operations
#[derive(Debug, thiserror::Error)]
pub enum ParaSsgError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Directory not found: {0}")]
    DirectoryNotFound(String),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Generation error: {0}")]
    GenerationError(String),
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
}

impl Config {
    /// Create new configuration with input and output directories
    pub fn new(input_dir: String, output_dir: String) -> Self {
        Self {
            input_dir,
            output_dir,
            base_url: "/".to_string(),
            site_title: "Knowledge Base".to_string(),
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
    config.validate()?;

    // Discover all markdown documents
    let input_path = Path::new(&config.input_dir);
    println!("📂 Discovering documents in '{}'...", config.input_dir);

    let document_infos = utils::traverse_directory(input_path)?;
    let stats = utils::ParaStatistics::from_documents(&document_infos);

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
    }

    // Create output directory
    let output_path = Path::new(&config.output_dir);
    utils::create_output_directory(output_path)?;
    println!("✅ Created output directory: {}", config.output_dir);

    // Parse all documents
    println!("📝 Parsing documents...");
    let mut documents = Vec::new();
    let mut parse_errors = 0;

    for doc_info in &document_infos {
        match parser::parse_document(
            &doc_info.path,
            &doc_info.relative_path,
            doc_info.category.clone(),
        ) {
            Ok(doc) => documents.push(doc),
            Err(e) => {
                eprintln!("⚠️  Failed to parse '{}': {}", doc_info.path.display(), e);
                parse_errors += 1;
            }
        }
    }

    if parse_errors > 0 {
        println!("⚠️  {} document(s) failed to parse", parse_errors);
    }
    println!("✅ Successfully parsed {} documents", documents.len());

    // Generate HTML pages
    println!("🔨 Generating HTML pages...");
    let generator = generator::HtmlGenerator::new(output_path.to_path_buf());

    // Group documents by category
    let mut categories: std::collections::HashMap<String, Vec<parser::Document>> =
        std::collections::HashMap::new();
    for doc in documents {
        categories
            .entry(doc.effective_category().to_string())
            .or_insert_with(Vec::new)
            .push(doc);
    }

    // Generate individual document pages
    let mut generated_count = 0;
    for (_category, docs) in &categories {
        for doc in docs {
            let html = generator.generate_document_page(doc)?;
            generator.write_page(&doc.output_path, &html)?;
            generated_count += 1;
        }
    }

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
    println!("🎉 Site generation complete! Output: {}", config.output_dir);

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
