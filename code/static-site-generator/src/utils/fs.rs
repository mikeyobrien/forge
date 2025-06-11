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

/// Create output directory structure
///
/// # Errors
///
/// Returns error if directory cannot be created
pub fn create_output_directory(path: &Path) -> Result<()> {
    fs::create_dir_all(path).map_err(|e| {
        ParaSsgError::Io(std::io::Error::new(
            e.kind(),
            format!(
                "Failed to create output directory '{}': {}",
                path.display(),
                e
            ),
        ))
    })?;
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
