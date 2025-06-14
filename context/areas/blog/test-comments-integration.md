---
title: Testing Comments Integration
date: 2025-01-15T14:00:00Z
tags: [testing, comments, phase2]
status: published
github_issue: "1"
---

# Testing Comments Integration

This is a test blog post to verify that the GitHub Issues-based commenting system is working correctly.

## Phase 2 Implementation

We've just completed implementing:

1. **Comments Widget Module** - A JavaScript-based widget that loads comments from GitHub Issues
2. **Marked.js Integration** - For rendering markdown in comments
3. **CSS Styling** - Professional styling for the comments section
4. **Automatic Injection** - Comments are automatically injected into blog posts when a `github_issue` is specified

## How It Works

When you add a `github_issue` field to your blog post's frontmatter (like this post has `github_issue: "1"`), the system will:

1. Detect that this is a blog post in the `areas/blog/` directory
2. Extract the issue number from the frontmatter
3. Inject the comments widget at the end of the article
4. Load comments from the GitHub API when the page loads

## Testing

To test this functionality:

1. Build the site with `make build`
2. Serve it locally with `./serve.sh`
3. Navigate to this blog post
4. You should see a comments section at the bottom

The comments will load from GitHub Issue #1 in the mikeyobrien/forge repository.

## Next Steps

With Phase 2 complete, we can move on to Phase 3 which includes:

- Adding comment counts to the blog listing page
- Creating automation to generate GitHub issues for new posts
- Adding configuration options for the GitHub repository

This implementation follows the TDD approach and maintains backward compatibility with the existing static site generator.