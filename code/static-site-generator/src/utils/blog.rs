//! ABOUTME: Blog-specific utility functions for detecting and filtering blog posts
//! ABOUTME: Provides helpers to identify blog posts in areas/blog/ directory

use crate::parser::document::Document;
use std::path::Path;

/// Determines if a given path represents a blog post
pub fn is_blog_post(path: &Path) -> bool {
    path.to_str()
        .map(|s| s.starts_with("areas/blog/"))
        .unwrap_or(false)
}

/// Filters and returns only blog posts from a collection of documents
pub fn get_blog_posts(documents: &[Document]) -> Vec<&Document> {
    documents
        .iter()
        .filter(|doc| is_blog_post(&doc.relative_path))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::document::Document;
    use std::path::PathBuf;

    #[test]
    fn test_is_blog_post_valid_paths() {
        assert!(is_blog_post(&PathBuf::from("areas/blog/my-first-post.md")));
        assert!(is_blog_post(&PathBuf::from(
            "areas/blog/2024/january/post.md"
        )));
        assert!(is_blog_post(&PathBuf::from("areas/blog/index.md")));
    }

    #[test]
    fn test_is_blog_post_invalid_paths() {
        assert!(!is_blog_post(&PathBuf::from("projects/blog-feature.md")));
        assert!(!is_blog_post(&PathBuf::from("areas/health/exercise.md")));
        assert!(!is_blog_post(&PathBuf::from(
            "resources/blog-writing-tips.md"
        )));
        assert!(!is_blog_post(&PathBuf::from("archives/old-blog.md")));
        assert!(!is_blog_post(&PathBuf::from("blog/post.md"))); // Not under areas/
    }

    #[test]
    fn test_get_blog_posts() {
        let mut doc1 = Document::new(
            PathBuf::from("/input/areas/blog/post1.md"),
            PathBuf::from("areas/blog/post1.md"),
            "areas".to_string(),
        );
        doc1.metadata.title = Some("Blog Post 1".to_string());

        let mut doc2 = Document::new(
            PathBuf::from("/input/areas/blog/post2.md"),
            PathBuf::from("areas/blog/post2.md"),
            "areas".to_string(),
        );
        doc2.metadata.title = Some("Blog Post 2".to_string());

        let mut doc3 = Document::new(
            PathBuf::from("/input/areas/health/fitness.md"),
            PathBuf::from("areas/health/fitness.md"),
            "areas".to_string(),
        );
        doc3.metadata.title = Some("Not a Blog Post".to_string());

        let mut doc4 = Document::new(
            PathBuf::from("/input/projects/something.md"),
            PathBuf::from("projects/something.md"),
            "projects".to_string(),
        );
        doc4.metadata.title = Some("Project Doc".to_string());

        let documents = vec![doc1, doc2, doc3, doc4];

        let blog_posts = get_blog_posts(&documents);
        assert_eq!(blog_posts.len(), 2);
        assert_eq!(blog_posts[0].title(), "Blog Post 1");
        assert_eq!(blog_posts[1].title(), "Blog Post 2");
    }

    #[test]
    fn test_get_blog_posts_empty() {
        let mut doc = Document::new(
            PathBuf::from("/input/projects/test.md"),
            PathBuf::from("projects/test.md"),
            "projects".to_string(),
        );
        doc.metadata.title = Some("Not a Blog".to_string());

        let documents = vec![doc];

        let blog_posts = get_blog_posts(&documents);
        assert!(blog_posts.is_empty());
    }
}
