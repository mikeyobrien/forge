//! ABOUTME: HTML generation and templating functionality
//! ABOUTME: Creates static HTML pages from parsed documents

use crate::config::BlogConfig;
use crate::parser::Document;
use crate::theme::comments::render_comments_widget;
use crate::theme::styles::get_default_styles;
use crate::theme::templates::{
    BreadcrumbItem, DocumentMetadata as TemplateMetadata, DocumentSummary, TemplateEngine,
};
use crate::utils::blog::is_blog_post;
use crate::{ParaSsgError, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// HTML generator that creates static pages from documents
pub struct HtmlGenerator {
    template_engine: TemplateEngine,
    output_dir: PathBuf,
    styles: String,
    site_title: String,
    base_url: String,
    blog_config: BlogConfig,
}

impl HtmlGenerator {
    /// Create a new HTML generator
    pub fn new(
        output_dir: PathBuf,
        site_title: String,
        base_url: String,
        blog_config: BlogConfig,
    ) -> Self {
        Self {
            template_engine: TemplateEngine::new(),
            output_dir,
            styles: get_default_styles(),
            site_title,
            base_url,
            blog_config,
        }
    }

    /// Generate a single document page
    pub fn generate_document_page(&self, doc: &Document) -> Result<String> {
        // Convert document metadata to template metadata
        let template_meta = TemplateMetadata {
            author: doc.metadata.author.clone(),
            date: doc
                .metadata
                .date
                .as_ref()
                .or(doc.metadata.modified.as_ref())
                .or(doc.metadata.created.as_ref())
                .map(|d| d.format("%Y-%m-%d").to_string()),
            status: doc.metadata.status.clone(),
            tags: doc.metadata.tags.clone(),
        };

        // Convert backlinks to HTML format
        let backlinks_html = if !doc.backlinks.is_empty() {
            let mut backlinks_list = String::from("<ul class=\"backlinks-list\">");
            for bl in &doc.backlinks {
                let url = format!(
                    "{}{}",
                    self.base_url,
                    bl.source_path.with_extension("html").display()
                );
                backlinks_list.push_str(&format!(
                    r#"<li><a href="{}">{}</a></li>"#,
                    url,
                    html_escape(&bl.source_title)
                ));
            }
            backlinks_list.push_str("</ul>");
            Some(backlinks_list)
        } else {
            None
        };

        // Generate document HTML
        let mut doc_content = self.template_engine.render_document(
            doc.title(),
            &doc.html_content,
            &template_meta,
            backlinks_html.as_deref(),
        )?;

        // If this is a blog post and comments are configured, inject comments widget
        if is_blog_post(&doc.relative_path) && self.blog_config.is_valid_for_comments() {
            // Extract github_issue from metadata
            let github_issue = doc
                .metadata
                .custom
                .get("github_issue")
                .and_then(|v| v.as_str());

            let comments_html = render_comments_widget(
                &self.blog_config.github_owner,
                &self.blog_config.github_repo,
                github_issue,
            );

            // Inject comments before closing </article> tag
            if let Some(pos) = doc_content.rfind("</article>") {
                doc_content.insert_str(pos, &comments_html);
            }
        }

        // Generate breadcrumbs
        let breadcrumbs = self.generate_breadcrumbs_for_document(doc);
        let breadcrumb_html = self.template_engine.render_breadcrumbs(&breadcrumbs)?;

        // Determine active category
        let active_category = if doc.relative_path.starts_with("projects") {
            Some("projects")
        } else if doc.relative_path.starts_with("areas") {
            Some("areas")
        } else if doc.relative_path.starts_with("resources") {
            Some("resources")
        } else if doc.relative_path.starts_with("archives") {
            Some("archives")
        } else {
            None
        };

        // Generate full page
        self.template_engine.render_base(
            doc.title(),
            &doc_content,
            active_category,
            Some(&breadcrumb_html),
            &self.styles,
            &self.site_title,
            &self.base_url,
        )
    }

    /// Generate a category index page
    pub fn generate_category_page(&self, category: &str, documents: &[Document]) -> Result<String> {
        // Convert documents to summaries
        let mut summaries: Vec<DocumentSummary> = documents.iter()
            .filter(|doc| !doc.is_draft()) // Exclude drafts from listings
            .map(|doc| {
                let url = format!("{}{}", self.base_url, doc.output_path.display());
                let summary = crate::parser::extract_summary(&doc.raw_content, 200);

                DocumentSummary {
                    url,
                    title: doc.title().to_string(),
                    date: doc.date().map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()),
                    tags: doc.metadata.tags.clone(),
                    summary: Some(summary),
                }
            })
            .collect();

        // Sort by date (newest first) or title if no date
        summaries.sort_by(|a, b| match (&b.date, &a.date) {
            (Some(d1), Some(d2)) => d1.cmp(d2),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => a.title.cmp(&b.title),
        });

        // Generate category page content
        let category_content = self
            .template_engine
            .render_category_index(category, &summaries)?;

        // Generate breadcrumbs
        let breadcrumbs = vec![
            BreadcrumbItem {
                title: "Home".to_string(),
                url: Some(self.base_url.clone()),
            },
            BreadcrumbItem {
                title: category_title(category).to_string(),
                url: None,
            },
        ];
        let breadcrumb_html = self.template_engine.render_breadcrumbs(&breadcrumbs)?;

        // Generate full page
        self.template_engine.render_base(
            category_title(category),
            &category_content,
            Some(category),
            Some(&breadcrumb_html),
            &self.styles,
            &self.site_title,
            &self.base_url,
        )
    }

    /// Generate a subdirectory index page
    pub fn generate_subdirectory_page(
        &self,
        subdir_path: &Path,
        documents: &[Document],
    ) -> Result<String> {
        // Convert documents to summaries
        let mut summaries: Vec<DocumentSummary> = documents.iter()
            .filter(|doc| !doc.is_draft()) // Exclude drafts from listings
            .map(|doc| {
                let url = format!("{}{}", self.base_url, doc.output_path.display());
                let summary = crate::parser::extract_summary(&doc.raw_content, 200);

                DocumentSummary {
                    url,
                    title: doc.title().to_string(),
                    date: doc.date().map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()),
                    tags: doc.metadata.tags.clone(),
                    summary: Some(summary),
                }
            })
            .collect();

        // Sort by date (newest first) or title if no date
        summaries.sort_by(|a, b| match (&b.date, &a.date) {
            (Some(d1), Some(d2)) => d1.cmp(d2),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => a.title.cmp(&b.title),
        });

        // Generate breadcrumbs
        let mut breadcrumbs = vec![BreadcrumbItem {
            title: "Home".to_string(),
            url: Some(self.base_url.clone()),
        }];

        let mut current_path = PathBuf::new();
        for component in subdir_path.components() {
            if let std::path::Component::Normal(name) = component {
                let name_str = name.to_string_lossy();
                current_path.push(name_str.as_ref());

                // Check if it's a PARA category
                let title = if matches!(
                    name_str.as_ref(),
                    "projects" | "areas" | "resources" | "archives"
                ) {
                    category_title(&name_str).to_string()
                } else {
                    humanize_filename(&name_str)
                };

                let url = if current_path == subdir_path {
                    None // Current directory, no link
                } else {
                    Some(format!("{}{}/", self.base_url, current_path.display()))
                };

                breadcrumbs.push(BreadcrumbItem { title, url });
            }
        }

        let breadcrumb_html = self.template_engine.render_breadcrumbs(&breadcrumbs)?;

        // Get the category from the first path component
        let category = subdir_path
            .components()
            .next()
            .and_then(|c| {
                if let std::path::Component::Normal(name) = c {
                    Some(name.to_string_lossy().to_string())
                } else {
                    None
                }
            })
            .filter(|c| matches!(c.as_str(), "projects" | "areas" | "resources" | "archives"));

        // Get the subdirectory name for the title
        let subdir_name = subdir_path
            .file_name()
            .and_then(|n| n.to_str())
            .map(humanize_filename)
            .unwrap_or_else(|| "Subdirectory".to_string());

        // Generate subdirectory page content
        let content = self
            .template_engine
            .render_subdirectory_index(&subdir_name, &summaries)?;

        // Generate full page
        self.template_engine.render_base(
            &subdir_name,
            &content,
            category.as_deref(),
            Some(&breadcrumb_html),
            &self.styles,
            &self.site_title,
            &self.base_url,
        )
    }

    /// Generate a subdirectory index page with directory cards
    pub fn generate_subdirectory_page_with_dirs(
        &self,
        subdir_path: &Path,
        documents: &[Document],
        subdirectories: &[&crate::utils::DirectoryInfo],
    ) -> Result<String> {
        // Convert documents to summaries
        let mut summaries: Vec<DocumentSummary> = documents.iter()
            .filter(|doc| !doc.is_draft()) // Exclude drafts from listings
            .map(|doc| {
                let url = format!("{}{}", self.base_url, doc.output_path.display());
                let summary = crate::parser::extract_summary(&doc.raw_content, 200);

                DocumentSummary {
                    url,
                    title: doc.title().to_string(),
                    date: doc.date().map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()),
                    tags: doc.metadata.tags.clone(),
                    summary: Some(summary),
                }
            })
            .collect();

        // Sort by date (newest first) or title if no date
        summaries.sort_by(|a, b| match (&b.date, &a.date) {
            (Some(d1), Some(d2)) => d1.cmp(d2),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => a.title.cmp(&b.title),
        });

        // Generate breadcrumbs
        let mut breadcrumbs = vec![BreadcrumbItem {
            title: "Home".to_string(),
            url: Some(self.base_url.clone()),
        }];

        let mut current_path = PathBuf::new();
        for component in subdir_path.components() {
            if let std::path::Component::Normal(name) = component {
                let name_str = name.to_string_lossy();
                current_path.push(name_str.as_ref());

                // Check if it's a PARA category
                let title = if matches!(
                    name_str.as_ref(),
                    "projects" | "areas" | "resources" | "archives"
                ) {
                    category_title(&name_str).to_string()
                } else {
                    humanize_filename(&name_str)
                };

                let url = if current_path == subdir_path {
                    None // Current directory, no link
                } else {
                    Some(format!("{}{}/", self.base_url, current_path.display()))
                };

                breadcrumbs.push(BreadcrumbItem { title, url });
            }
        }

        let breadcrumb_html = self.template_engine.render_breadcrumbs(&breadcrumbs)?;

        // Get the category from the first path component
        let category = subdir_path
            .components()
            .next()
            .and_then(|c| {
                if let std::path::Component::Normal(name) = c {
                    Some(name.to_string_lossy().to_string())
                } else {
                    None
                }
            })
            .filter(|c| matches!(c.as_str(), "projects" | "areas" | "resources" | "archives"));

        // Get the subdirectory name for the title
        let subdir_name = subdir_path
            .file_name()
            .and_then(|n| n.to_str())
            .map(humanize_filename)
            .unwrap_or_else(|| "Subdirectory".to_string());

        // Generate subdirectory page content with directory cards
        let content = self.template_engine.render_subdirectory_index_with_dirs(
            &subdir_name,
            &summaries,
            subdirectories,
            &self.base_url,
        )?;

        // Generate full page
        self.template_engine.render_base(
            &subdir_name,
            &content,
            category.as_deref(),
            Some(&breadcrumb_html),
            &self.styles,
            &self.site_title,
            &self.base_url,
        )
    }

    /// Generate the home page with recently modified files
    pub fn generate_home_page(&self, documents: &[Document]) -> Result<String> {
        // Convert documents to summaries and sort by modification date
        let mut summaries: Vec<DocumentSummary> = documents.iter()
            .filter(|doc| !doc.is_draft()) // Exclude drafts
            .map(|doc| {
                let url = format!("{}{}", self.base_url, doc.output_path.display());

                DocumentSummary {
                    url,
                    title: doc.title().to_string(),
                    date: doc.date().map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()),
                    tags: doc.metadata.tags.clone(),
                    summary: None, // Don't need summary for home page
                }
            })
            .collect();

        // Sort by date (newest first), then by title
        summaries.sort_by(|a, b| match (&b.date, &a.date) {
            (Some(d1), Some(d2)) => d1.cmp(d2),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => a.title.cmp(&b.title),
        });

        // Generate home page content
        let content = self
            .template_engine
            .render_home_page(&summaries, &self.base_url)?;

        // Generate full page
        self.template_engine.render_base(
            "", // Empty title for home page
            &content,
            None,
            None,
            &self.styles,
            &self.site_title,
            &self.base_url,
        )
    }

    /// Generate a blog listing page
    pub fn generate_blog_listing_page(&self, blog_posts: &[Document]) -> Result<String> {
        // Convert blog posts to summaries
        let mut summaries: Vec<DocumentSummary> = blog_posts.iter()
            .filter(|doc| !doc.is_draft()) // Exclude drafts from listings
            .map(|doc| {
                let url = format!("{}{}", self.base_url, doc.output_path.display());
                let summary = crate::parser::extract_summary(&doc.raw_content, 200);

                DocumentSummary {
                    url,
                    title: doc.title().to_string(),
                    date: doc.date().map(|d| d.format("%Y-%m-%d").to_string()),
                    tags: doc.metadata.tags.clone(),
                    summary: Some(summary),
                }
            })
            .collect();

        // Sort by date (newest first) or title if no date
        summaries.sort_by(|a, b| match (&b.date, &a.date) {
            (Some(d1), Some(d2)) => d1.cmp(d2),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => a.title.cmp(&b.title),
        });

        // Generate blog listing content using category template
        let blog_content = self
            .template_engine
            .render_category_index("blog", &summaries)?;

        // Generate breadcrumbs
        let breadcrumbs = vec![
            BreadcrumbItem {
                title: "Home".to_string(),
                url: Some(self.base_url.clone()),
            },
            BreadcrumbItem {
                title: "Blog".to_string(),
                url: None,
            },
        ];
        let breadcrumb_html = self.template_engine.render_breadcrumbs(&breadcrumbs)?;

        // Generate full page
        self.template_engine.render_base(
            "Blog",
            &blog_content,
            Some("blog"),
            Some(&breadcrumb_html),
            &self.styles,
            &self.site_title,
            &self.base_url,
        )
    }

    /// Write an HTML page to disk
    pub fn write_page(&self, relative_path: &Path, content: &str) -> Result<()> {
        let output_path = self.output_dir.join(relative_path);

        // Create parent directory if needed
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Write file
        fs::write(&output_path, content).map_err(|e| {
            ParaSsgError::Io(std::io::Error::new(
                e.kind(),
                format!(
                    "Failed to write HTML file '{}': {}",
                    output_path.display(),
                    e
                ),
            ))
        })?;

        Ok(())
    }

    /// Generate breadcrumbs for a document
    pub fn generate_breadcrumbs_for_document(&self, doc: &Document) -> Vec<BreadcrumbItem> {
        let mut breadcrumbs = vec![BreadcrumbItem {
            title: "Home".to_string(),
            url: Some(self.base_url.clone()),
        }];

        let mut current_path = PathBuf::new();
        let components: Vec<_> = doc.relative_path.components().collect();

        for (i, component) in components.iter().enumerate() {
            if let std::path::Component::Normal(name) = component {
                let name_str = name.to_string_lossy();
                current_path.push(name_str.as_ref());

                // Skip the filename for the last component
                let is_last = i == components.len() - 1;

                if is_last {
                    // For the document itself, use the actual title
                    breadcrumbs.push(BreadcrumbItem {
                        title: doc.title().to_string(),
                        url: None,
                    });
                } else {
                    // For directories, add with link
                    let url = format!("{}{}/", self.base_url, current_path.display());
                    // Check if it's a PARA category, otherwise humanize the directory name
                    let title = if matches!(
                        name_str.as_ref(),
                        "projects" | "areas" | "resources" | "archives"
                    ) {
                        category_title(&name_str).to_string()
                    } else {
                        humanize_filename(&name_str)
                    };
                    breadcrumbs.push(BreadcrumbItem {
                        title,
                        url: Some(url),
                    });
                }
            }
        }

        breadcrumbs
    }
}

/// Get human-readable category title
fn category_title(category: &str) -> &str {
    match category {
        "projects" => "Projects",
        "areas" => "Areas",
        "resources" => "Resources",
        "archives" => "Archives",
        _ => category,
    }
}

/// Get category description
#[allow(dead_code)]
fn category_description(category: &str) -> &str {
    match category {
        "projects" => "Active projects with specific outcomes and deadlines",
        "areas" => "Ongoing responsibilities and areas of focus",
        "resources" => "Reference materials and information for future use",
        "archives" => "Inactive items from the other categories",
        _ => "",
    }
}

/// Convert filename to human-readable title
pub fn humanize_filename(filename: &str) -> String {
    filename
        .replace('-', " ")
        .replace('_', " ")
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// HTML escape special characters
fn html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::BlogConfig;
    use crate::parser::{Document, DocumentMetadata};
    use std::path::PathBuf;
    use tempfile::TempDir;

    #[test]
    fn test_humanize_filename() {
        assert_eq!(humanize_filename("hello-world"), "Hello World");
        assert_eq!(humanize_filename("test_document"), "Test Document");
        assert_eq!(humanize_filename("my-test_file"), "My Test File");
    }

    #[test]
    fn test_generate_document_page() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            BlogConfig::new(),
        );

        let mut doc = Document::new(
            PathBuf::from("/input/projects/test.md"),
            PathBuf::from("projects/test.md"),
            "projects".to_string(),
        );
        doc.metadata = DocumentMetadata {
            title: Some("Test Project".to_string()),
            tags: vec!["rust".to_string()],
            ..Default::default()
        };
        doc.html_content = "<p>Test content</p>".to_string();

        let html = generator.generate_document_page(&doc).unwrap();

        assert!(html.contains("<title>Test Project | Test Site</title>"));
        assert!(html.contains("<p>Test content</p>"));
        assert!(html.contains(r#"class="nav-item active">Projects</a>"#));
        assert!(html.contains("Test Site"));
    }

    #[test]
    fn test_generate_category_page() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            BlogConfig::new(),
        );

        let mut doc = Document::new(
            PathBuf::from("/input/projects/test.md"),
            PathBuf::from("projects/test.md"),
            "projects".to_string(),
        );
        doc.metadata.title = Some("Test Project".to_string());
        doc.raw_content = "This is a test project with some content.".to_string();

        let html = generator
            .generate_category_page("projects", &[doc])
            .unwrap();

        assert!(html.contains("<h1>Projects</h1>"));
        assert!(html.contains("Active projects with specific outcomes"));
        assert!(html.contains("Test Project"));
        assert!(html.contains("This is a test project"));
    }

    #[test]
    fn test_generate_home_page() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            BlogConfig::new(),
        );

        let mut doc = Document::new(
            PathBuf::from("/input/projects/test.md"),
            PathBuf::from("projects/test.md"),
            "projects".to_string(),
        );
        doc.metadata.title = Some("Test Project".to_string());
        doc.metadata.tags = vec!["rust".to_string()];

        let html = generator.generate_home_page(&[doc]).unwrap();

        assert!(html.contains("Test Site"));
        assert!(html.contains(r#"<div class="file-cards""#));
        assert!(html.contains("Test Project"));
        assert!(html.contains("projects"));
    }

    #[test]
    fn test_write_page() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            BlogConfig::new(),
        );

        let content = "<html><body>Test</body></html>";
        generator
            .write_page(Path::new("test.html"), content)
            .unwrap();

        let written = fs::read_to_string(temp_dir.path().join("test.html")).unwrap();
        assert_eq!(written, content);
    }

    #[test]
    fn test_breadcrumb_generation_for_document() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            BlogConfig::new(),
        );

        let mut doc = Document::new(
            PathBuf::from("/input/projects/rust/test.md"),
            PathBuf::from("projects/rust/test.md"),
            "projects".to_string(),
        );
        doc.metadata.title = Some("My Rust Project".to_string());

        let breadcrumbs = generator.generate_breadcrumbs_for_document(&doc);

        assert_eq!(breadcrumbs.len(), 4);
        assert_eq!(breadcrumbs[0].title, "Home");
        assert_eq!(breadcrumbs[1].title, "Projects");
        assert_eq!(breadcrumbs[2].title, "Rust");
        assert_eq!(breadcrumbs[3].title, "My Rust Project"); // Uses document title
        assert!(breadcrumbs[3].url.is_none());
    }

    #[test]
    fn test_blog_comments_with_config() {
        let temp_dir = TempDir::new().unwrap();
        let mut blog_config = BlogConfig::new();
        blog_config.github_owner = "testowner".to_string();
        blog_config.github_repo = "testrepo".to_string();

        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            blog_config,
        );

        let mut doc = Document {
            source_path: PathBuf::from("/input/areas/blog/test-post.md"),
            relative_path: PathBuf::from("areas/blog/test-post.md"),
            output_path: PathBuf::from("areas/blog/test-post.html"),
            category: "areas".to_string(),
            metadata: DocumentMetadata::default(),
            raw_content: "Test blog post".to_string(),
            html_content: "<article><p>Test blog post</p></article>".to_string(),
            wiki_links: vec![],
            backlinks: vec![],
        };

        // Add github_issue to metadata
        doc.metadata.custom.insert(
            "github_issue".to_string(),
            serde_yaml::Value::String("42".to_string()),
        );

        let html = generator.generate_document_page(&doc).unwrap();
        assert!(html.contains("const owner = 'testowner'"));
        assert!(html.contains("const repo = 'testrepo'"));
        assert!(html.contains("const issueNumber = '42'"));
        assert!(html.contains("blog-comments"));
    }

    #[test]
    fn test_blog_comments_disabled() {
        let temp_dir = TempDir::new().unwrap();
        let mut blog_config = BlogConfig::new();
        blog_config.comments_enabled = false;
        blog_config.github_owner = "testowner".to_string();
        blog_config.github_repo = "testrepo".to_string();

        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            blog_config,
        );

        let doc = Document {
            source_path: PathBuf::from("/input/areas/blog/test-post.md"),
            relative_path: PathBuf::from("areas/blog/test-post.md"),
            output_path: PathBuf::from("areas/blog/test-post.html"),
            category: "areas".to_string(),
            metadata: DocumentMetadata::default(),
            raw_content: "Test blog post".to_string(),
            html_content: "<article><p>Test blog post</p></article>".to_string(),
            wiki_links: vec![],
            backlinks: vec![],
        };

        let html = generator.generate_document_page(&doc).unwrap();
        assert!(!html.contains("blog-comments"));
        assert!(!html.contains("const owner"));
    }

    #[test]
    fn test_blog_comments_no_config() {
        let temp_dir = TempDir::new().unwrap();
        let blog_config = BlogConfig::new(); // Empty config

        let generator = HtmlGenerator::new(
            temp_dir.path().to_path_buf(),
            "Test Site".to_string(),
            "/".to_string(),
            blog_config,
        );

        let doc = Document {
            source_path: PathBuf::from("/input/areas/blog/test-post.md"),
            relative_path: PathBuf::from("areas/blog/test-post.md"),
            output_path: PathBuf::from("areas/blog/test-post.html"),
            category: "areas".to_string(),
            metadata: DocumentMetadata::default(),
            raw_content: "Test blog post".to_string(),
            html_content: "<article><p>Test blog post</p></article>".to_string(),
            wiki_links: vec![],
            backlinks: vec![],
        };

        let html = generator.generate_document_page(&doc).unwrap();
        // Should not include comments when config is not set
        assert!(!html.contains("blog-comments"));
    }
}
