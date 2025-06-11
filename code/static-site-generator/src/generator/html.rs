//! ABOUTME: HTML generation and templating functionality
//! ABOUTME: Creates static HTML pages from parsed documents

use crate::parser::Document;
use crate::theme::styles::get_default_styles;
use crate::theme::templates::{
    BreadcrumbItem, DocumentMetadata as TemplateMetadata, DocumentSummary, TemplateEngine,
};
use crate::{ParaSsgError, Result};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// HTML generator that creates static pages from documents
pub struct HtmlGenerator {
    template_engine: TemplateEngine,
    output_dir: PathBuf,
    styles: String,
}

impl HtmlGenerator {
    /// Create a new HTML generator
    pub fn new(output_dir: PathBuf) -> Self {
        Self {
            template_engine: TemplateEngine::new(),
            output_dir,
            styles: get_default_styles(),
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
                let url = format!("/{}", bl.source_path.with_extension("html").display());
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
        let doc_content = self.template_engine.render_document(
            doc.title(),
            &doc.html_content,
            &template_meta,
            backlinks_html.as_deref(),
        )?;

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
        )
    }

    /// Generate a category index page
    pub fn generate_category_page(&self, category: &str, documents: &[Document]) -> Result<String> {
        // Convert documents to summaries
        let mut summaries: Vec<DocumentSummary> = documents.iter()
            .filter(|doc| !doc.is_draft()) // Exclude drafts from listings
            .map(|doc| {
                let url = format!("/{}", doc.output_path.display());
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

        // Generate category page content
        let category_content = self
            .template_engine
            .render_category_index(category, &summaries)?;

        // Generate breadcrumbs
        let breadcrumbs = vec![
            BreadcrumbItem {
                title: "Home".to_string(),
                url: Some("/".to_string()),
            },
            BreadcrumbItem {
                title: category_title(category).to_string(),
                url: None,
            },
        ];
        let breadcrumb_html = self.template_engine.render_breadcrumbs(&breadcrumbs)?;

        // Generate full page
        self.template_engine.render_base(
            &format!("{} - PARA SSG", category_title(category)),
            &category_content,
            Some(category),
            Some(&breadcrumb_html),
            &self.styles,
        )
    }

    /// Generate the home page with overview of all categories
    pub fn generate_home_page(&self, category_counts: &HashMap<String, usize>) -> Result<String> {
        let mut content = String::from(
            r#"
        <div class="home-page">
            <h1>PARA Knowledge Base</h1>
            <p>Welcome to your personal knowledge management system organized using the PARA method.</p>
            
            <div class="search-box-container">
                <input type="text" class="search-box" placeholder="Search documentation... (Ctrl+K)" readonly onclick="openSearch()" />
            </div>
            
            <div class="category-overview">
        "#,
        );

        // Add category cards
        for category in &["projects", "areas", "resources", "archives"] {
            let count = category_counts.get(*category).unwrap_or(&0);
            let title = category_title(category);
            let description = category_description(category);

            use std::fmt::Write;
            write!(
                content,
                r#"
                <div class="category-card">
                    <h2><a href="/{}/">{}</a></h2>
                    <p>{}</p>
                    <span class="document-count">{} document{}</span>
                </div>
            "#,
                category,
                title,
                description,
                count,
                if *count == 1 { "" } else { "s" }
            )
            .unwrap();
        }

        content.push_str("</div></div>");

        // Generate full page
        self.template_engine
            .render_base("Home", &content, None, None, &self.styles)
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
            url: Some("/".to_string()),
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
                    let url = format!("/{}/", current_path.display());
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
fn humanize_filename(filename: &str) -> String {
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
    use crate::parser::document::{Document, DocumentMetadata};
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
        let generator = HtmlGenerator::new(temp_dir.path().to_path_buf());

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

        assert!(html.contains("<title>Test Project - PARA SSG</title>"));
        assert!(html.contains("<p>Test content</p>"));
        assert!(html.contains(r#"class="active">Projects</a>"#));
        assert!(html.contains("Home"));
    }

    #[test]
    fn test_generate_category_page() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(temp_dir.path().to_path_buf());

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
        let generator = HtmlGenerator::new(temp_dir.path().to_path_buf());

        let mut counts = HashMap::new();
        counts.insert("projects".to_string(), 5);
        counts.insert("areas".to_string(), 3);
        counts.insert("resources".to_string(), 10);
        counts.insert("archives".to_string(), 2);

        let html = generator.generate_home_page(&counts).unwrap();

        assert!(html.contains("<h1>PARA Knowledge Base</h1>"));
        assert!(html.contains("5 documents"));
        assert!(html.contains("3 documents"));
        assert!(html.contains(r#"href="/projects/">Projects</a>"#));
    }

    #[test]
    fn test_write_page() {
        let temp_dir = TempDir::new().unwrap();
        let generator = HtmlGenerator::new(temp_dir.path().to_path_buf());

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
        let generator = HtmlGenerator::new(temp_dir.path().to_path_buf());

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
}
