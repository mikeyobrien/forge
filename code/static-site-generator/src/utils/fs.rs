//! ABOUTME: File system utility functions for directory traversal
//! ABOUTME: Handles reading, writing, and organizing files and directories

use crate::{ParaSsgError, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Document metadata collected during traversal
#[derive(Debug, Clone, PartialEq)]
pub struct DocumentInfo {
    /// Full path to the document
    pub path: PathBuf,
    /// Relative path from root directory
    pub relative_path: PathBuf,
    /// File name without extension
    pub stem: String,
    /// PARA category (projects, areas, resources, archives, or root)
    pub category: String,
}

/// Directory metadata collected during traversal
#[derive(Debug, Clone, PartialEq)]
pub struct DirectoryInfo {
    /// Relative path from root directory
    pub relative_path: PathBuf,
    /// PARA category (projects, areas, resources, archives, or subdirectory)
    pub category: String,
    /// Direct subdirectories within this directory
    pub subdirectories: Vec<String>,
    /// Number of documents directly in this directory
    pub document_count: usize,
}

/// Recursively traverse directory and collect markdown files
///
/// # Errors
///
/// Returns error if directory cannot be read or permission denied
pub fn traverse_directory(path: &Path) -> Result<Vec<DocumentInfo>> {
    let mut documents = Vec::new();
    traverse_recursive(path, path, &mut documents)?;
    Ok(documents)
}

/// Recursively traverse directory and collect both documents and directories
///
/// # Errors
///
/// Returns error if directory cannot be read or permission denied
pub fn traverse_directory_full(path: &Path) -> Result<(Vec<DocumentInfo>, Vec<DirectoryInfo>)> {
    let mut documents = Vec::new();
    let mut directories = Vec::new();
    traverse_recursive_full(path, path, &mut documents, &mut directories)?;
    Ok((documents, directories))
}

fn traverse_recursive(
    root: &Path,
    current: &Path,
    documents: &mut Vec<DocumentInfo>,
) -> Result<()> {
    let entries = fs::read_dir(current).map_err(|e| {
        ParaSsgError::Io(std::io::Error::new(
            e.kind(),
            format!("Failed to read directory '{}': {}", current.display(), e),
        ))
    })?;

    for entry in entries {
        let entry = entry.map_err(|e| {
            ParaSsgError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to read directory entry: {}", e),
            ))
        })?;

        let path = entry.path();
        let file_type = entry.file_type().map_err(|e| {
            ParaSsgError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to get file type for '{}': {}", path.display(), e),
            ))
        })?;

        if file_type.is_dir() {
            // Skip hidden directories (starting with .)
            if let Some(name) = path.file_name() {
                if name.to_string_lossy().starts_with('.') {
                    continue;
                }
            }
            // Recursively traverse subdirectories
            traverse_recursive(root, &path, documents)?;
        } else if file_type.is_file() {
            // Check if it's a markdown file
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    // Get relative path from root
                    let relative_path = path
                        .strip_prefix(root)
                        .map_err(|_| {
                            ParaSsgError::InvalidPath(format!(
                                "Failed to get relative path for '{}'",
                                path.display()
                            ))
                        })?
                        .to_path_buf();

                    // Get file stem (name without extension)
                    let stem = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .ok_or_else(|| {
                            ParaSsgError::InvalidPath(format!(
                                "Invalid file name: '{}'",
                                path.display()
                            ))
                        })?
                        .to_string();

                    // Detect PARA category
                    let category = crate::utils::detect_para_category(&relative_path)?;

                    documents.push(DocumentInfo {
                        path: path.clone(),
                        relative_path,
                        stem,
                        category,
                    });
                }
            }
        }
    }

    Ok(())
}

fn traverse_recursive_full(
    root: &Path,
    current: &Path,
    documents: &mut Vec<DocumentInfo>,
    directories: &mut Vec<DirectoryInfo>,
) -> Result<()> {
    let entries = fs::read_dir(current).map_err(|e| {
        ParaSsgError::Io(std::io::Error::new(
            e.kind(),
            format!("Failed to read directory '{}': {}", current.display(), e),
        ))
    })?;

    let mut subdirs = Vec::new();
    let mut doc_count = 0;

    for entry in entries {
        let entry = entry.map_err(|e| {
            ParaSsgError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to read directory entry: {}", e),
            ))
        })?;

        let path = entry.path();
        let file_type = entry.file_type().map_err(|e| {
            ParaSsgError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to get file type for '{}': {}", path.display(), e),
            ))
        })?;

        if file_type.is_dir() {
            // Skip hidden directories (starting with .)
            if let Some(name) = path.file_name() {
                let name_str = name.to_string_lossy();
                if name_str.starts_with('.') {
                    continue;
                }
                subdirs.push(name_str.to_string());
            }
            // Recursively traverse subdirectories
            traverse_recursive_full(root, &path, documents, directories)?;
        } else if file_type.is_file() {
            // Check if it's a markdown file
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    doc_count += 1;

                    // Get relative path from root
                    let relative_path = path
                        .strip_prefix(root)
                        .map_err(|_| {
                            ParaSsgError::InvalidPath(format!(
                                "Failed to get relative path for '{}'",
                                path.display()
                            ))
                        })?
                        .to_path_buf();

                    // Get file stem (name without extension)
                    let stem = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .ok_or_else(|| {
                            ParaSsgError::InvalidPath(format!(
                                "Invalid file name: '{}'",
                                path.display()
                            ))
                        })?
                        .to_string();

                    // Detect PARA category
                    let category = crate::utils::detect_para_category(&relative_path)?;

                    documents.push(DocumentInfo {
                        path: path.clone(),
                        relative_path,
                        stem,
                        category,
                    });
                }
            }
        }
    }

    // Add directory info if this is not the root directory
    if current != root {
        let relative_path = current
            .strip_prefix(root)
            .map_err(|_| {
                ParaSsgError::InvalidPath(format!(
                    "Failed to get relative path for '{}'",
                    current.display()
                ))
            })?
            .to_path_buf();

        let category = crate::utils::detect_para_category(&relative_path)?;

        directories.push(DirectoryInfo {
            relative_path,
            category,
            subdirectories: subdirs,
            document_count: doc_count,
        });
    }

    Ok(())
}

/// Create output directory structure
///
/// # Errors
///
/// Returns error if directory cannot be created or lacks write permissions
pub fn create_output_directory(path: &Path) -> Result<()> {
    // Check if path exists and is a file
    if path.exists() && path.is_file() {
        return Err(ParaSsgError::InvalidPath(format!(
            "Output path '{}' exists and is a file, not a directory",
            path.display()
        )));
    }

    // Create directory
    fs::create_dir_all(path).map_err(|e| {
        let error_msg = match e.kind() {
            std::io::ErrorKind::PermissionDenied => {
                format!(
                    "Permission denied: Cannot create output directory '{}'. Check your permissions.",
                    path.display()
                )
            }
            std::io::ErrorKind::Other => {
                format!(
                    "Failed to create output directory '{}': {}. The path may be invalid or the parent directory may not exist.",
                    path.display(),
                    e
                )
            }
            _ => format!(
                "Failed to create output directory '{}': {}",
                path.display(),
                e
            ),
        };
        ParaSsgError::Io(std::io::Error::new(e.kind(), error_msg))
    })?;

    // Test write permissions by creating and removing a test file
    let test_file = path.join(".para-ssg-test");
    if let Err(e) = fs::write(&test_file, "") {
        return Err(ParaSsgError::Io(std::io::Error::new(
            e.kind(),
            format!(
                "Output directory '{}' exists but is not writable: {}",
                path.display(),
                e
            ),
        )));
    }

    // Clean up test file
    let _ = fs::remove_file(test_file);

    Ok(())
}

/// Ensure a directory exists, creating parent directories as needed
///
/// # Errors
///
/// Returns error if directory cannot be created
pub fn ensure_directory_exists(path: &Path) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            ParaSsgError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to create directory '{}': {}", parent.display(), e),
            ))
        })?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use tempfile::TempDir;

    fn create_test_structure() -> Result<TempDir> {
        let temp_dir = TempDir::new().map_err(|e| ParaSsgError::Io(e))?;
        let root = temp_dir.path();

        // Create PARA structure
        fs::create_dir_all(root.join("projects"))?;
        fs::create_dir_all(root.join("areas"))?;
        fs::create_dir_all(root.join("resources"))?;
        fs::create_dir_all(root.join("archives"))?;
        fs::create_dir_all(root.join(".hidden"))?;

        // Create test markdown files
        let files = vec![
            "projects/project1.md",
            "projects/project2.md",
            "areas/health.md",
            "resources/rust-guide.md",
            "archives/old-project.md",
            "index.md",
            ".hidden/ignored.md",
        ];

        for file_path in files {
            let path = root.join(file_path);
            let mut file = File::create(path)?;
            writeln!(file, "# Test Document")?;
        }

        // Create non-markdown files (should be ignored)
        File::create(root.join("readme.txt"))?;
        File::create(root.join("projects/notes.txt"))?;

        Ok(temp_dir)
    }

    #[test]
    fn test_traverse_directory_finds_all_markdown_files() {
        let temp_dir = create_test_structure().unwrap();
        let documents = traverse_directory(temp_dir.path()).unwrap();

        // Should find 6 markdown files (excluding .hidden)
        assert_eq!(documents.len(), 6);

        // Verify all expected files are found
        let paths: Vec<String> = documents
            .iter()
            .map(|d| d.relative_path.to_string_lossy().to_string())
            .collect();

        assert!(paths.contains(&"projects/project1.md".to_string()));
        assert!(paths.contains(&"projects/project2.md".to_string()));
        assert!(paths.contains(&"areas/health.md".to_string()));
        assert!(paths.contains(&"resources/rust-guide.md".to_string()));
        assert!(paths.contains(&"archives/old-project.md".to_string()));
        assert!(paths.contains(&"index.md".to_string()));

        // Hidden files should be excluded
        assert!(!paths.contains(&".hidden/ignored.md".to_string()));
    }

    #[test]
    fn test_traverse_directory_extracts_correct_metadata() {
        let temp_dir = create_test_structure().unwrap();
        let documents = traverse_directory(temp_dir.path()).unwrap();

        // Find a specific document
        let project_doc = documents
            .iter()
            .find(|d| d.stem == "project1")
            .expect("Should find project1.md");

        assert_eq!(project_doc.stem, "project1");
        assert_eq!(project_doc.category, "projects");
        assert_eq!(
            project_doc.relative_path.to_string_lossy(),
            "projects/project1.md"
        );
    }

    #[test]
    fn test_traverse_directory_handles_nonexistent_path() {
        let result = traverse_directory(Path::new("/nonexistent/path"));
        assert!(result.is_err());
    }

    #[test]
    fn test_traverse_directory_full() -> Result<()> {
        let temp_dir = create_test_structure()?;
        let root = temp_dir.path();

        // Create nested directory structure
        fs::create_dir_all(root.join("areas/development"))?;
        fs::create_dir_all(root.join("areas/development/rust"))?;
        fs::create_dir_all(root.join("areas/development/python"))?;

        // Add files to nested directories
        File::create(root.join("areas/development/rust/learning.md"))?
            .write_all(b"# Rust Learning")?;
        File::create(root.join("areas/development/python/django.md"))?.write_all(b"# Django")?;

        let (documents, directories) = traverse_directory_full(root)?;

        // Verify we found all documents including nested ones
        let doc_paths: Vec<String> = documents
            .iter()
            .map(|d| d.relative_path.to_string_lossy().to_string())
            .collect();

        assert!(doc_paths.contains(&"areas/development/rust/learning.md".to_string()));
        assert!(doc_paths.contains(&"areas/development/python/django.md".to_string()));

        // Verify we found all directories including intermediate ones
        let dir_paths: Vec<String> = directories
            .iter()
            .map(|d| d.relative_path.to_string_lossy().to_string())
            .collect();

        assert!(dir_paths.contains(&"areas".to_string()));
        assert!(dir_paths.contains(&"areas/development".to_string()));
        assert!(dir_paths.contains(&"areas/development/rust".to_string()));
        assert!(dir_paths.contains(&"areas/development/python".to_string()));

        // Verify directory metadata
        let dev_dir = directories
            .iter()
            .find(|d| d.relative_path.to_str() == Some("areas/development"))
            .expect("Should find development directory");

        assert_eq!(dev_dir.subdirectories.len(), 2);
        assert!(dev_dir.subdirectories.contains(&"rust".to_string()));
        assert!(dev_dir.subdirectories.contains(&"python".to_string()));
        assert_eq!(dev_dir.document_count, 0); // No documents directly in development/

        // Verify nested directories have correct document counts
        let rust_dir = directories
            .iter()
            .find(|d| d.relative_path.to_str() == Some("areas/development/rust"))
            .expect("Should find rust directory");

        assert_eq!(rust_dir.document_count, 1);
        assert_eq!(rust_dir.subdirectories.len(), 0);

        Ok(())
    }

    #[test]
    fn test_create_output_directory() {
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("output/nested/dir");

        create_output_directory(&output_path).unwrap();
        assert!(output_path.exists());
        assert!(output_path.is_dir());
    }

    #[test]
    fn test_ensure_directory_exists() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("output/nested/file.html");

        ensure_directory_exists(&file_path).unwrap();
        assert!(file_path.parent().unwrap().exists());
    }
}
