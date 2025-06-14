// ABOUTME: Integration tests for blog configuration functionality
// ABOUTME: Tests environment variable configuration and comments integration

use para_ssg::{generate_site, Config};
use std::env;
use std::fs;
use tempfile::TempDir;

// Note: These tests modify environment variables and should be run with --test-threads=1

#[test]
fn test_blog_config_from_env() {
    // Create temporary directories
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    // Set up test environment
    env::set_var("PARA_SSG_GITHUB_OWNER", "testuser");
    env::set_var("PARA_SSG_GITHUB_REPO", "testrepo");
    env::set_var("PARA_SSG_COMMENTS_ENABLED", "true");

    // Create test blog post with github_issue
    let blog_dir = input_dir.path().join("areas").join("blog");
    fs::create_dir_all(&blog_dir).unwrap();

    let blog_post = r#"---
title: Test Blog Post
date: 2024-01-15T10:00:00Z
github_issue: "123"
---

# Test Blog Post

This is a test blog post with comments enabled."#;

    fs::write(blog_dir.join("test-post.md"), blog_post).unwrap();

    // Create configuration
    let config = Config::new(
        input_dir.path().to_str().unwrap().to_string(),
        output_dir.path().to_str().unwrap().to_string(),
    );

    // Verify config loaded from environment
    assert_eq!(config.blog.github_owner, "testuser");
    assert_eq!(config.blog.github_repo, "testrepo");
    assert!(config.blog.comments_enabled);

    // Generate site
    generate_site(&config).unwrap();

    // Verify output
    let blog_output = output_dir
        .path()
        .join("areas")
        .join("blog")
        .join("test-post.html");
    assert!(blog_output.exists());

    let content = fs::read_to_string(&blog_output).unwrap();
    assert!(content.contains("const owner = 'testuser'"));
    assert!(content.contains("const repo = 'testrepo'"));
    assert!(content.contains("const issueNumber = '123'"));
    assert!(content.contains("blog-comments"));

    // Clean up environment
    env::remove_var("PARA_SSG_GITHUB_OWNER");
    env::remove_var("PARA_SSG_GITHUB_REPO");
    env::remove_var("PARA_SSG_COMMENTS_ENABLED");
}

#[test]
fn test_blog_config_disabled() {
    // Create temporary directories
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    // Set up test environment with comments disabled
    env::set_var("PARA_SSG_GITHUB_OWNER", "testuser");
    env::set_var("PARA_SSG_GITHUB_REPO", "testrepo");
    env::set_var("PARA_SSG_COMMENTS_ENABLED", "false");

    // Create test blog post
    let blog_dir = input_dir.path().join("areas").join("blog");
    fs::create_dir_all(&blog_dir).unwrap();

    let blog_post = r#"---
title: Test Blog Post
date: 2024-01-15T10:00:00Z
github_issue: "123"
---

# Test Blog Post

This is a test blog post with comments disabled."#;

    fs::write(blog_dir.join("test-post.md"), blog_post).unwrap();

    // Create configuration
    let config = Config::new(
        input_dir.path().to_str().unwrap().to_string(),
        output_dir.path().to_str().unwrap().to_string(),
    );

    // Verify comments are disabled
    assert!(!config.blog.comments_enabled);

    // Generate site
    generate_site(&config).unwrap();

    // Verify output doesn't contain comments
    let blog_output = output_dir
        .path()
        .join("areas")
        .join("blog")
        .join("test-post.html");
    let content = fs::read_to_string(&blog_output).unwrap();
    assert!(!content.contains("blog-comments"));
    assert!(!content.contains("const owner"));

    // Clean up environment
    env::remove_var("PARA_SSG_GITHUB_OWNER");
    env::remove_var("PARA_SSG_GITHUB_REPO");
    env::remove_var("PARA_SSG_COMMENTS_ENABLED");
}

#[test]
fn test_blog_config_missing_github_config() {
    // Create temporary directories
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    // Clear any existing environment variables
    env::remove_var("PARA_SSG_GITHUB_OWNER");
    env::remove_var("PARA_SSG_GITHUB_REPO");

    // Create test blog post
    let blog_dir = input_dir.path().join("areas").join("blog");
    fs::create_dir_all(&blog_dir).unwrap();

    let blog_post = r#"---
title: Test Blog Post
date: 2024-01-15T10:00:00Z
github_issue: "123"
---

# Test Blog Post

No GitHub config means no comments."#;

    fs::write(blog_dir.join("test-post.md"), blog_post).unwrap();

    // Clear environment variables
    std::env::remove_var("PARA_SSG_GITHUB_OWNER");
    std::env::remove_var("PARA_SSG_GITHUB_REPO");
    std::env::remove_var("PARA_SSG_COMMENTS_ENABLED");

    // Create configuration
    let config = Config::new(
        input_dir.path().to_str().unwrap().to_string(),
        output_dir.path().to_str().unwrap().to_string(),
    );

    // Verify config is empty
    assert!(config.blog.github_owner.is_empty());
    assert!(config.blog.github_repo.is_empty());

    // Generate site
    generate_site(&config).unwrap();

    // Verify output doesn't contain comments
    let blog_output = output_dir
        .path()
        .join("areas")
        .join("blog")
        .join("test-post.html");
    let content = fs::read_to_string(&blog_output).unwrap();
    assert!(!content.contains("blog-comments"));
}
