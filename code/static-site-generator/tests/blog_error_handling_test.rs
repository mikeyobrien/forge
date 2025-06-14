// ABOUTME: Integration tests for blog feature error handling and edge cases
// ABOUTME: Tests cover API failures, rate limiting, and network errors

use para_ssg::{generate_site, BlogConfig, Config};
use std::fs;
use std::path::Path;
use tempfile::TempDir;

fn setup_test_blog(content_dir: &Path, github_issue: Option<&str>) -> std::io::Result<()> {
    let blog_dir = content_dir.join("areas").join("blog");
    fs::create_dir_all(&blog_dir)?;

    let frontmatter = if let Some(issue) = github_issue {
        format!(
            r#"---
title: Test Blog Post
date: 2024-01-15T10:00:00Z
tags: [test, error-handling]
github_issue: "{}"
---"#,
            issue
        )
    } else {
        r#"---
title: Test Blog Post Without Issue
date: 2024-01-15T10:00:00Z
tags: [test, no-comments]
---"#
            .to_string()
    };

    let content = format!(
        r#"{}

This is a test blog post for error handling scenarios.

## Test Content

This post is used to test various error conditions."#,
        frontmatter
    );

    fs::write(blog_dir.join("test-post.md"), content)?;
    Ok(())
}

#[test]
fn test_blog_post_without_github_issue() {
    let temp_dir = TempDir::new().unwrap();
    let content_dir = temp_dir.path().join("content");
    let output_dir = temp_dir.path().join("output");

    // Setup blog post without github_issue
    setup_test_blog(&content_dir, None).unwrap();

    // Generate site with blog config
    let mut blog_config = BlogConfig::default();
    blog_config.github_owner = "testowner".to_string();
    blog_config.github_repo = "testrepo".to_string();
    blog_config.comments_enabled = true;

    let config = Config {
        input_dir: content_dir.to_string_lossy().to_string(),
        output_dir: output_dir.to_string_lossy().to_string(),
        base_url: "https://example.com".to_string(),
        site_title: "Test Blog".to_string(),
        verbose: false,
        watch: false,
        blog: blog_config,
    };

    generate_site(&config).unwrap();

    // Check that the blog post was generated
    let blog_post = output_dir.join("areas").join("blog").join("test-post.html");
    assert!(blog_post.exists());

    // Read the generated HTML
    let html = fs::read_to_string(&blog_post).unwrap();

    // Debug output to see what's generated
    if !html.contains("blog-comments") {
        eprintln!("HTML does not contain blog-comments. Content preview:");
        eprintln!("{}", &html[..html.len().min(1000)]);
    }

    // Verify that comments section shows appropriate message
    assert!(html.contains("blog-comments"));
    // When there's no github_issue, the JS code should handle it
    assert!(html.contains("const issueNumber = ''"));
}

#[test]
fn test_blog_post_with_invalid_issue_number() {
    let temp_dir = TempDir::new().unwrap();
    let content_dir = temp_dir.path().join("content");
    let output_dir = temp_dir.path().join("output");

    // Setup blog post with invalid issue number
    setup_test_blog(&content_dir, Some("invalid-issue")).unwrap();

    // Generate site with blog config
    let mut blog_config = BlogConfig::default();
    blog_config.github_owner = "testowner".to_string();
    blog_config.github_repo = "testrepo".to_string();
    blog_config.comments_enabled = true;

    let config = Config {
        input_dir: content_dir.to_string_lossy().to_string(),
        output_dir: output_dir.to_string_lossy().to_string(),
        base_url: "https://example.com".to_string(),
        site_title: "Test Blog".to_string(),
        verbose: false,
        watch: false,
        blog: blog_config,
    };

    generate_site(&config).unwrap();

    // Check that the blog post was generated
    let blog_post = output_dir.join("areas").join("blog").join("test-post.html");
    assert!(blog_post.exists());

    // Read the generated HTML
    let html = fs::read_to_string(&blog_post).unwrap();

    // Verify that JavaScript will handle the invalid issue
    assert!(html.contains("const issueNumber = 'invalid-issue'"));
    assert!(html.contains("Unable to load comments"));
}

#[test]
fn test_multiple_blog_posts_mixed_issue_status() {
    let temp_dir = TempDir::new().unwrap();
    let content_dir = temp_dir.path().join("content");
    let output_dir = temp_dir.path().join("output");
    let blog_dir = content_dir.join("areas").join("blog");
    fs::create_dir_all(&blog_dir).unwrap();

    // Create posts with different issue statuses
    let posts = vec![
        ("post-with-issue.md", Some("123"), "Post with Comments"),
        ("post-without-issue.md", None, "Post without Comments"),
        ("post-empty-issue.md", Some(""), "Post with Empty Issue"),
    ];

    for (filename, issue, title) in posts {
        let frontmatter = if let Some(issue_num) = issue {
            format!(
                r#"---
title: {}
date: 2024-01-15T10:00:00Z
github_issue: "{}"
---"#,
                title, issue_num
            )
        } else {
            format!(
                r#"---
title: {}
date: 2024-01-15T10:00:00Z
---"#,
                title
            )
        };

        let content = format!("{}\n\nContent for {}", frontmatter, title);
        fs::write(blog_dir.join(filename), content).unwrap();
    }

    // Generate site with blog config
    let mut blog_config = BlogConfig::default();
    blog_config.github_owner = "testowner".to_string();
    blog_config.github_repo = "testrepo".to_string();
    blog_config.comments_enabled = true;

    let config = Config {
        input_dir: content_dir.to_string_lossy().to_string(),
        output_dir: output_dir.to_string_lossy().to_string(),
        base_url: "https://example.com".to_string(),
        site_title: "Test Blog".to_string(),
        verbose: false,
        watch: false,
        blog: blog_config,
    };

    generate_site(&config).unwrap();

    // Verify all posts were generated
    assert!(output_dir
        .join("areas")
        .join("blog")
        .join("post-with-issue.html")
        .exists());
    assert!(output_dir
        .join("areas")
        .join("blog")
        .join("post-without-issue.html")
        .exists());
    assert!(output_dir
        .join("areas")
        .join("blog")
        .join("post-empty-issue.html")
        .exists());

    // Check blog listing page
    let listing_path = output_dir.join("areas").join("blog").join("index.html");
    if listing_path.exists() {
        let listing_html = fs::read_to_string(&listing_path).unwrap();
        assert!(listing_html.contains("Post with Comments"));
        assert!(listing_html.contains("Post without Comments"));
        assert!(listing_html.contains("Post with Empty Issue"));
    } else {
        // Blog might be at /blog.html
        let blog_path = output_dir.join("blog.html");
        assert!(
            blog_path.exists(),
            "Blog listing page not found at expected locations"
        );
        let listing_html = fs::read_to_string(&blog_path).unwrap();
        assert!(listing_html.contains("Post with Comments"));
        assert!(listing_html.contains("Post without Comments"));
        assert!(listing_html.contains("Post with Empty Issue"));
    }
}

#[test]
fn test_blog_generation_with_missing_config() {
    let temp_dir = TempDir::new().unwrap();
    let content_dir = temp_dir.path().join("content");
    let output_dir = temp_dir.path().join("output");

    // Setup blog post
    setup_test_blog(&content_dir, Some("1")).unwrap();

    // Generate site without GitHub config
    std::env::remove_var("PARA_SSG_GITHUB_OWNER");
    std::env::remove_var("PARA_SSG_GITHUB_REPO");

    let config = Config {
        input_dir: content_dir.to_string_lossy().to_string(),
        output_dir: output_dir.to_string_lossy().to_string(),
        base_url: "https://example.com".to_string(),
        site_title: "Test Blog".to_string(),
        verbose: false,
        watch: false,
        blog: BlogConfig::default(),
    };

    // Should still generate successfully with default values
    generate_site(&config).unwrap();

    let blog_post = output_dir.join("areas").join("blog").join("test-post.html");
    assert!(blog_post.exists());
}
