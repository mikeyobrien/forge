//! ABOUTME: PARA structure detection and organization utilities
//! ABOUTME: Identifies Projects, Areas, Resources, and Archives categories

use crate::Result;
use std::path::Path;

/// PARA categories as constants
pub const PARA_PROJECTS: &str = "projects";
pub const PARA_AREAS: &str = "areas";
pub const PARA_RESOURCES: &str = "resources";
pub const PARA_ARCHIVES: &str = "archives";
pub const PARA_ROOT: &str = "root";

/// All valid PARA categories
pub const PARA_CATEGORIES: &[&str] = &[PARA_PROJECTS, PARA_AREAS, PARA_RESOURCES, PARA_ARCHIVES];

/// Detect PARA category from file path
///
/// Returns the PARA category based on the first directory component.
/// Files in the root directory return "root".
///
/// # Errors
///
/// Returns error if path is invalid
pub fn detect_para_category(path: &Path) -> Result<String> {
    // Get the first component of the path
    if let Some(first_component) = path.components().next() {
        let component_str = first_component.as_os_str().to_string_lossy();

        // Check if it's a known PARA category
        if PARA_CATEGORIES.contains(&component_str.as_ref()) {
            Ok(component_str.to_string())
        } else {
            // File is in root or a non-PARA directory
            Ok(PARA_ROOT.to_string())
        }
    } else {
        // Path has no components (shouldn't happen with valid paths)
        Ok(PARA_ROOT.to_string())
    }
}

/// Get all PARA categories present in directory
///
/// Scans the directory for PARA category subdirectories and returns
/// a list of categories that exist.
///
/// # Errors
///
/// Returns error if directory cannot be read
pub fn get_para_categories(path: &Path) -> Result<Vec<String>> {
    let mut categories = Vec::new();

    // Check for each PARA category directory
    for category in PARA_CATEGORIES {
        let category_path = path.join(category);
        if category_path.exists() && category_path.is_dir() {
            categories.push(category.to_string());
        }
    }

    Ok(categories)
}

/// Organize documents by PARA category
///
/// Groups a list of document paths by their PARA categories
pub fn organize_by_category<P: AsRef<Path>>(
    paths: &[P],
) -> Result<std::collections::HashMap<String, Vec<&P>>> {
    use std::collections::HashMap;

    let mut organized: HashMap<String, Vec<&P>> = HashMap::new();

    for path in paths {
        let category = detect_para_category(path.as_ref())?;
        organized.entry(category).or_default().push(path);
    }

    Ok(organized)
}

/// Check if a directory has a valid PARA structure
///
/// A valid PARA structure has at least one of the PARA category directories
pub fn has_para_structure(path: &Path) -> bool {
    PARA_CATEGORIES.iter().any(|category| {
        let category_path = path.join(category);
        category_path.exists() && category_path.is_dir()
    })
}

/// Get statistics about documents in PARA structure
#[derive(Debug, Clone, Default)]
pub struct ParaStatistics {
    pub projects_count: usize,
    pub areas_count: usize,
    pub resources_count: usize,
    pub archives_count: usize,
    pub root_count: usize,
    pub total_count: usize,
}

impl ParaStatistics {
    /// Create statistics from document list
    pub fn from_documents(documents: &[crate::utils::DocumentInfo]) -> Self {
        let mut stats = Self::default();

        for doc in documents {
            stats.total_count += 1;
            match doc.category.as_str() {
                PARA_PROJECTS => stats.projects_count += 1,
                PARA_AREAS => stats.areas_count += 1,
                PARA_RESOURCES => stats.resources_count += 1,
                PARA_ARCHIVES => stats.archives_count += 1,
                _ => stats.root_count += 1,
            }
        }

        stats
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use tempfile::TempDir;

    #[test]
    fn test_detect_para_category() {
        assert_eq!(
            detect_para_category(Path::new("projects/my-project.md")).unwrap(),
            "projects"
        );
        assert_eq!(
            detect_para_category(Path::new("areas/health/exercise.md")).unwrap(),
            "areas"
        );
        assert_eq!(
            detect_para_category(Path::new("resources/guide.md")).unwrap(),
            "resources"
        );
        assert_eq!(
            detect_para_category(Path::new("archives/old.md")).unwrap(),
            "archives"
        );
        assert_eq!(detect_para_category(Path::new("index.md")).unwrap(), "root");
        assert_eq!(
            detect_para_category(Path::new("other/file.md")).unwrap(),
            "root"
        );
    }

    #[test]
    fn test_get_para_categories() {
        let temp_dir = TempDir::new().unwrap();
        let root = temp_dir.path();

        // Create some PARA directories
        fs::create_dir(root.join("projects")).unwrap();
        fs::create_dir(root.join("areas")).unwrap();
        fs::create_dir(root.join("other")).unwrap(); // Non-PARA directory

        let categories = get_para_categories(root).unwrap();
        assert_eq!(categories.len(), 2);
        assert!(categories.contains(&"projects".to_string()));
        assert!(categories.contains(&"areas".to_string()));
        assert!(!categories.contains(&"resources".to_string()));
        assert!(!categories.contains(&"other".to_string()));
    }

    #[test]
    fn test_organize_by_category() {
        let paths = vec![
            PathBuf::from("projects/p1.md"),
            PathBuf::from("projects/p2.md"),
            PathBuf::from("areas/a1.md"),
            PathBuf::from("index.md"),
            PathBuf::from("resources/r1.md"),
        ];

        let organized = organize_by_category(&paths).unwrap();

        assert_eq!(organized.get("projects").unwrap().len(), 2);
        assert_eq!(organized.get("areas").unwrap().len(), 1);
        assert_eq!(organized.get("resources").unwrap().len(), 1);
        assert_eq!(organized.get("root").unwrap().len(), 1);
    }

    #[test]
    fn test_has_para_structure() {
        let temp_dir = TempDir::new().unwrap();
        let root = temp_dir.path();

        assert!(!has_para_structure(root));

        fs::create_dir(root.join("projects")).unwrap();
        assert!(has_para_structure(root));
    }

    #[test]
    fn test_para_statistics() {
        use crate::utils::DocumentInfo;

        let documents = vec![
            DocumentInfo {
                path: PathBuf::from("projects/p1.md"),
                relative_path: PathBuf::from("projects/p1.md"),
                stem: "p1".to_string(),
                category: "projects".to_string(),
            },
            DocumentInfo {
                path: PathBuf::from("projects/p2.md"),
                relative_path: PathBuf::from("projects/p2.md"),
                stem: "p2".to_string(),
                category: "projects".to_string(),
            },
            DocumentInfo {
                path: PathBuf::from("areas/a1.md"),
                relative_path: PathBuf::from("areas/a1.md"),
                stem: "a1".to_string(),
                category: "areas".to_string(),
            },
            DocumentInfo {
                path: PathBuf::from("index.md"),
                relative_path: PathBuf::from("index.md"),
                stem: "index".to_string(),
                category: "root".to_string(),
            },
        ];

        let stats = ParaStatistics::from_documents(&documents);
        assert_eq!(stats.total_count, 4);
        assert_eq!(stats.projects_count, 2);
        assert_eq!(stats.areas_count, 1);
        assert_eq!(stats.resources_count, 0);
        assert_eq!(stats.archives_count, 0);
        assert_eq!(stats.root_count, 1);
    }
}
