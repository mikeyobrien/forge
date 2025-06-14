// ABOUTME: Configuration module for para-ssg with blog-specific settings
// ABOUTME: Handles site-wide configuration including GitHub integration for comments

use crate::Result;
use std::path::Path;

/// Blog-specific configuration
#[derive(Debug, Clone)]
pub struct BlogConfig {
    /// GitHub repository owner for comments integration
    pub github_owner: String,
    /// GitHub repository name for comments integration
    pub github_repo: String,
    /// Whether comments are enabled globally
    pub comments_enabled: bool,
}

impl BlogConfig {
    /// Create a new blog configuration with default values
    pub fn new() -> Self {
        Self {
            github_owner: String::new(),
            github_repo: String::new(),
            comments_enabled: true,
        }
    }

    /// Create blog configuration from environment variables
    pub fn from_env() -> Self {
        Self {
            github_owner: std::env::var("PARA_SSG_GITHUB_OWNER").unwrap_or_default(),
            github_repo: std::env::var("PARA_SSG_GITHUB_REPO").unwrap_or_default(),
            comments_enabled: std::env::var("PARA_SSG_COMMENTS_ENABLED")
                .map(|v| v.to_lowercase() != "false")
                .unwrap_or(true),
        }
    }

    /// Check if the blog configuration is valid for comments
    pub fn is_valid_for_comments(&self) -> bool {
        !self.github_owner.is_empty() && !self.github_repo.is_empty() && self.comments_enabled
    }
}

impl Default for BlogConfig {
    fn default() -> Self {
        Self::new()
    }
}

/// Extended configuration for site generation with blog support
#[derive(Debug, Clone)]
pub struct Config {
    pub input_dir: String,
    pub output_dir: String,
    pub base_url: String,
    pub site_title: String,
    pub verbose: bool,
    pub watch: bool,
    pub blog: BlogConfig,
}

impl Config {
    /// Create new configuration with input and output directories
    pub fn new(input_dir: String, output_dir: String) -> Self {
        // Check for base URL from environment variable
        let base_url = std::env::var("PARA_SSG_BASE_URL").unwrap_or_else(|_| "/".to_string());

        Self {
            input_dir,
            output_dir,
            base_url,
            site_title: "forge".to_string(),
            verbose: false,
            watch: false,
            blog: BlogConfig::from_env(),
        }
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<()> {
        if !Path::new(&self.input_dir).exists() {
            return Err(crate::ParaSsgError::DirectoryNotFound(
                self.input_dir.clone(),
            ));
        }

        if !Path::new(&self.input_dir).is_dir() {
            return Err(crate::ParaSsgError::InvalidPath(format!(
                "Input path '{}' is not a directory",
                self.input_dir
            )));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_blog_config_new() {
        let config = BlogConfig::new();
        assert_eq!(config.github_owner, "");
        assert_eq!(config.github_repo, "");
        assert!(config.comments_enabled);
    }

    #[test]
    fn test_blog_config_from_env() {
        // Save current env vars
        let saved_owner = env::var("PARA_SSG_GITHUB_OWNER").ok();
        let saved_repo = env::var("PARA_SSG_GITHUB_REPO").ok();
        let saved_enabled = env::var("PARA_SSG_COMMENTS_ENABLED").ok();

        // Set test env vars
        env::set_var("PARA_SSG_GITHUB_OWNER", "testowner");
        env::set_var("PARA_SSG_GITHUB_REPO", "testrepo");
        env::set_var("PARA_SSG_COMMENTS_ENABLED", "true");

        let config = BlogConfig::from_env();
        assert_eq!(config.github_owner, "testowner");
        assert_eq!(config.github_repo, "testrepo");
        assert!(config.comments_enabled);

        // Test disabled comments
        env::set_var("PARA_SSG_COMMENTS_ENABLED", "false");
        let config = BlogConfig::from_env();
        assert!(!config.comments_enabled);

        // Restore env vars
        match saved_owner {
            Some(v) => env::set_var("PARA_SSG_GITHUB_OWNER", v),
            None => env::remove_var("PARA_SSG_GITHUB_OWNER"),
        }
        match saved_repo {
            Some(v) => env::set_var("PARA_SSG_GITHUB_REPO", v),
            None => env::remove_var("PARA_SSG_GITHUB_REPO"),
        }
        match saved_enabled {
            Some(v) => env::set_var("PARA_SSG_COMMENTS_ENABLED", v),
            None => env::remove_var("PARA_SSG_COMMENTS_ENABLED"),
        }
    }

    #[test]
    fn test_blog_config_is_valid_for_comments() {
        let mut config = BlogConfig::new();
        assert!(!config.is_valid_for_comments());

        config.github_owner = "owner".to_string();
        assert!(!config.is_valid_for_comments());

        config.github_repo = "repo".to_string();
        assert!(config.is_valid_for_comments());

        config.comments_enabled = false;
        assert!(!config.is_valid_for_comments());
    }

    #[test]
    fn test_config_with_blog() {
        let temp_dir = tempfile::tempdir().unwrap();
        let input_path = temp_dir.path().to_str().unwrap().to_string();

        let config = Config::new(input_path.clone(), "output".to_string());
        assert_eq!(config.input_dir, input_path);
        assert_eq!(config.output_dir, "output");
        assert!(config.blog.comments_enabled);
    }
}
