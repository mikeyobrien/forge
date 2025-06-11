//! ABOUTME: Backlink generation and document relationship mapping
//! ABOUTME: Builds reverse index from wiki links to create backlink references

use crate::parser::document::{BacklinkReference, Document};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Build a reverse index of document relationships from wiki links
pub fn build_backlink_index(documents: &[Document]) -> HashMap<PathBuf, Vec<BacklinkReference>> {
    let mut backlink_index: HashMap<PathBuf, Vec<BacklinkReference>> = HashMap::new();

    // Process each document's outgoing links
    for doc in documents {
        for link in &doc.wiki_links {
            if !link.is_broken {
                // Create a backlink reference for the target document
                let backlink = BacklinkReference {
                    source_path: doc.relative_path.clone(),
                    source_title: doc.title().to_string(),
                    link_context: extract_link_context(
                        &doc.raw_content,
                        &link.wiki_link.full_match,
                    ),
                };

                // Add to the target document's backlinks
                backlink_index
                    .entry(link.resolved_path.clone().unwrap())
                    .or_insert_with(Vec::new)
                    .push(backlink);
            }
        }
    }

    backlink_index
}

/// Apply backlinks from the index to documents
pub fn apply_backlinks_to_documents(
    documents: &mut [Document],
    backlink_index: HashMap<PathBuf, Vec<BacklinkReference>>,
) {
    for doc in documents {
        if let Some(mut backlinks) = backlink_index.get(&doc.output_path).cloned() {
            // Sort backlinks by source title for consistent display
            backlinks.sort_by(|a, b| a.source_title.cmp(&b.source_title));
            doc.backlinks = backlinks;
        }
    }
}

/// Extract context around a wiki link in the content
fn extract_link_context(content: &str, link_text: &str) -> Option<String> {
    // Find the position of the link in the content
    if let Some(link_pos) = content.find(link_text) {
        // Extract surrounding context (50 chars before and after)
        let context_start = link_pos.saturating_sub(50);
        let context_end = (link_pos + link_text.len() + 50).min(content.len());

        // Extract the context
        let context = &content[context_start..context_end];

        // Clean up the context
        let context = context
            .lines()
            .collect::<Vec<_>>()
            .join(" ")
            .trim()
            .to_string();

        // Add ellipsis if truncated
        let mut result = String::new();
        if context_start > 0 {
            result.push_str("...");
        }
        result.push_str(&context);
        if context_end < content.len() {
            result.push_str("...");
        }

        Some(result)
    } else {
        None
    }
}

/// Generate link statistics for reporting
pub struct LinkStatistics {
    pub total_documents: usize,
    pub total_links: usize,
    pub valid_links: usize,
    pub broken_links: usize,
    pub documents_with_backlinks: usize,
    pub orphaned_documents: Vec<PathBuf>,
}

/// Calculate link statistics from documents
pub fn calculate_link_statistics(documents: &[Document]) -> LinkStatistics {
    let mut total_links = 0;
    let mut valid_links = 0;
    let mut broken_links = 0;
    let mut documents_with_backlinks = 0;
    let mut orphaned_documents = Vec::new();

    for doc in documents {
        total_links += doc.wiki_links.len();
        valid_links += doc.wiki_links.iter().filter(|l| !l.is_broken).count();
        broken_links += doc.wiki_links.iter().filter(|l| l.is_broken).count();

        if !doc.backlinks.is_empty() {
            documents_with_backlinks += 1;
        }

        // Check if document is orphaned (no backlinks and not a category index)
        if doc.backlinks.is_empty() && !is_index_page(&doc.relative_path) {
            orphaned_documents.push(doc.relative_path.clone());
        }
    }

    LinkStatistics {
        total_documents: documents.len(),
        total_links,
        valid_links,
        broken_links,
        documents_with_backlinks,
        orphaned_documents,
    }
}

/// Check if a path represents an index page
fn is_index_page(path: &Path) -> bool {
    path.file_name()
        .and_then(|f| f.to_str())
        .map(|name| name == "index.md" || name == "_index.md" || name == "README.md")
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::wiki_links::ResolvedLink;

    fn create_test_document(path: &str, title: &str) -> Document {
        let mut doc = Document::new(
            PathBuf::from(format!("/input/{}", path)),
            PathBuf::from(path),
            "test".to_string(),
        );
        doc.metadata.title = Some(title.to_string());
        doc
    }

    fn create_resolved_link(original: &str, target_path: &str, is_valid: bool) -> ResolvedLink {
        use crate::parser::wiki_links::WikiLink;

        ResolvedLink {
            wiki_link: WikiLink {
                full_match: original.to_string(),
                target: original
                    .trim_start_matches("[[")
                    .trim_end_matches("]]")
                    .to_string(),
                display: None,
                start: 0,
                end: original.len(),
            },
            resolved_path: if is_valid {
                Some(PathBuf::from(target_path))
            } else {
                None
            },
            is_broken: !is_valid,
        }
    }

    #[test]
    fn test_build_backlink_index() {
        let mut doc1 = create_test_document("doc1.md", "Document 1");
        doc1.wiki_links = vec![
            create_resolved_link("[[doc2]]", "doc2.md", true),
            create_resolved_link("[[doc3]]", "doc3.md", true),
        ];

        let mut doc2 = create_test_document("doc2.md", "Document 2");
        doc2.wiki_links = vec![create_resolved_link("[[doc3]]", "doc3.md", true)];

        let doc3 = create_test_document("doc3.md", "Document 3");

        let documents = vec![doc1, doc2, doc3];
        let index = build_backlink_index(&documents);

        // doc2 should have 1 backlink from doc1
        assert_eq!(index.get(&PathBuf::from("doc2.md")).unwrap().len(), 1);

        // doc3 should have 2 backlinks from doc1 and doc2
        assert_eq!(index.get(&PathBuf::from("doc3.md")).unwrap().len(), 2);

        // doc1 should have no backlinks
        assert!(index.get(&PathBuf::from("doc1.md")).is_none());
    }

    #[test]
    fn test_apply_backlinks_to_documents() {
        let mut documents = vec![
            create_test_document("doc1.md", "Document 1"),
            create_test_document("doc2.md", "Document 2"),
        ];

        let mut index = HashMap::new();
        index.insert(
            PathBuf::from("doc2.html"),
            vec![BacklinkReference {
                source_path: PathBuf::from("doc1.md"),
                source_title: "Document 1".to_string(),
                link_context: Some("Test context".to_string()),
            }],
        );

        apply_backlinks_to_documents(&mut documents, index);

        assert_eq!(documents[0].backlinks.len(), 0);
        assert_eq!(documents[1].backlinks.len(), 1);
        assert_eq!(documents[1].backlinks[0].source_title, "Document 1");
    }

    #[test]
    fn test_extract_link_context() {
        let content = "This is some text before the [[wiki link]] and some text after it.";
        let context = extract_link_context(content, "[[wiki link]]");

        assert!(context.is_some());
        let context_text = context.unwrap();
        assert!(context_text.contains("text before"));
        assert!(context_text.contains("[[wiki link]]"));
        assert!(context_text.contains("text after"));
    }

    #[test]
    fn test_link_statistics() {
        let mut doc1 = create_test_document("doc1.md", "Document 1");
        doc1.wiki_links = vec![
            create_resolved_link("[[doc2]]", "doc2.md", true),
            create_resolved_link("[[broken]]", "broken.md", false),
        ];

        let mut doc2 = create_test_document("doc2.md", "Document 2");
        doc2.backlinks = vec![BacklinkReference {
            source_path: PathBuf::from("doc1.md"),
            source_title: "Document 1".to_string(),
            link_context: None,
        }];

        let doc3 = create_test_document("doc3.md", "Document 3");

        let documents = vec![doc1, doc2, doc3];
        let stats = calculate_link_statistics(&documents);

        assert_eq!(stats.total_documents, 3);
        assert_eq!(stats.total_links, 2);
        assert_eq!(stats.valid_links, 1);
        assert_eq!(stats.broken_links, 1);
        assert_eq!(stats.documents_with_backlinks, 1);
        assert_eq!(stats.orphaned_documents.len(), 2);
    }
}
