---
title: Blog Feature Implementation Roadmap
category: projects
status: active
created: 2025-06-14T00:51:27.876Z
modified: 2025-06-14T00:51:27.876Z
tags:
  - blog
  - implementation
  - roadmap
  - rust
  - ssg
---
# Blog Feature Implementation Roadmap

## Overview

This roadmap provides a step-by-step implementation guide for adding blog functionality to the Forge static site generator. The implementation is divided into three phases, with each phase delivering functional value.

## Implementation Phases

### Phase 1: Core Blog Functionality (Foundation)

**Goal**: Enable blog posts in `areas/blog/` with dedicated navigation and listing

#### Step 1: Add Blog Detection Utility
**File**: `code/static-site-generator/src/utils/blog.rs` (new file)
**Implementation**:
```rust
use std::path::Path;

pub fn is_blog_post(path: &Path) -> bool {
    path.to_str()
        .map(|s| s.starts_with("areas/blog/"))
        .unwrap_or(false)
}

pub fn get_blog_posts(documents: &[Document]) -> Vec<&Document> {
    documents
        .iter()
        .filter(|doc| is_blog_post(&doc.relative_path))
        .collect()
}
```
**Tests**: Unit tests for path detection logic

#### Step 2: Update Navigation Template
**File**: `code/static-site-generator/src/theme/templates.rs`
**Changes**:
- Add Blog link after Archives in `BASE_TEMPLATE` (line ~26)
- Update `render_base` to handle `blog_active` placeholder
- Ensure mobile menu includes Blog

**Implementation**:
```rust
// In BASE_TEMPLATE constant
<a href="{base_url}blog/" class="nav-item {blog_active}">Blog</a>

// In render_base method
.replace("{blog_active}", if current_page == "blog" { "active" } else { "" })
```

#### Step 3: Create Blog Listing Generator
**File**: `code/static-site-generator/src/generator/html.rs`
**New Method**: `generate_blog_listing_page`
**Implementation**:
- Filter documents from `areas/blog/`
- Sort by date (newest first)
- Reuse existing card layout
- Generate at `blog/index.html`

#### Step 4: Integrate Blog Generation
**File**: `code/static-site-generator/src/lib.rs`
**Location**: After category page generation (line ~467)
**Implementation**:
```rust
// Generate blog listing page
let blog_posts = blog::get_blog_posts(&documents);
if !blog_posts.is_empty() {
    let blog_html = generator.generate_blog_listing_page(&blog_posts)?;
    let blog_path = output_dir.join("blog/index.html");
    fs::create_dir_all(blog_path.parent().unwrap())?;
    fs::write(blog_path, blog_html)?;
}
```

#### Step 5: Update Module Exports
**Files**: 
- `src/utils/mod.rs` - Add `pub mod blog;`
- `src/generator/mod.rs` - Export new blog methods

### Phase 2: Comments Integration

**Goal**: Add GitHub Issues-based commenting system to blog posts

#### Step 6: Create Comments Widget Module
**File**: `code/static-site-generator/src/theme/comments.rs` (new file)
**Implementation**:
```rust
pub const COMMENTS_SCRIPT: &str = r#"
<div id="blog-comments" class="comments-section">
    <h2>Comments</h2>
    <div id="comments-list">
        <div class="loading">Loading comments...</div>
    </div>
    <a id="add-comment-btn" href="#" class="btn-primary">Add Comment on GitHub</a>
</div>
<script>
(function() {
    const owner = '{repo_owner}';
    const repo = '{repo_name}';
    const issueNumber = '{issue_number}';
    
    if (!issueNumber) {
        document.getElementById('blog-comments').innerHTML = 
            '<p>Comments are not yet enabled for this post.</p>';
        return;
    }
    
    async function loadComments() {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`
            );
            const comments = await response.json();
            displayComments(comments);
        } catch (error) {
            document.getElementById('comments-list').innerHTML = 
                '<p>Unable to load comments.</p>';
        }
    }
    
    function displayComments(comments) {
        const container = document.getElementById('comments-list');
        if (comments.length === 0) {
            container.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <img src="${comment.user.avatar_url}" alt="${comment.user.login}" class="avatar">
                    <a href="${comment.user.html_url}" class="author">${comment.user.login}</a>
                    <time class="date">${new Date(comment.created_at).toLocaleDateString()}</time>
                </div>
                <div class="comment-body">${marked.parse(comment.body)}</div>
            </div>
        `).join('');
    }
    
    // Update Add Comment button
    document.getElementById('add-comment-btn').href = 
        `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
    
    loadComments();
})();
</script>
"#;

pub fn render_comments_widget(repo_owner: &str, repo_name: &str, issue_number: Option<&str>) -> String {
    COMMENTS_SCRIPT
        .replace("{repo_owner}", repo_owner)
        .replace("{repo_name}", repo_name)
        .replace("{issue_number}", issue_number.unwrap_or(""))
}
```

#### Step 7: Add Comments Styles
**File**: `code/static-site-generator/src/theme/styles.rs`
**Addition**: CSS for comments section
```css
.comments-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
}

.comment {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--card-bg);
    border-radius: 8px;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
}
```

#### Step 8: Inject Comments into Blog Posts
**File**: `code/static-site-generator/src/generator/html.rs`
**Method**: `generate_document_page`
**Changes**:
- Check if document is a blog post using `blog::is_blog_post`
- Extract `github_issue` from frontmatter
- Inject comments widget before closing `</article>` tag

#### Step 9: Add Marked.js for Comment Rendering
**File**: `code/static-site-generator/src/theme/templates.rs`
**Addition**: Include marked.js CDN in BASE_TEMPLATE
```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

### Phase 3: Automation & Polish

**Goal**: Streamline blog workflow with automation and enhanced UI

#### Step 10: Add Comment Count to Blog Listing
**File**: `code/static-site-generator/src/theme/templates.rs`
**Enhancement**: Add placeholder for comment count in card template
```html
<span class="comment-count" data-issue="{issue_number}">
    <span class="count-loading">...</span> comments
</span>
```

**JavaScript**: Batch fetch comment counts on blog listing page

#### Step 11: Create GitHub Action for Issue Creation
**File**: `.github/workflows/create-blog-issues.yml` (new file)
**Purpose**: Automatically create GitHub issues for new blog posts
```yaml
name: Create Blog Issues

on:
  push:
    paths:
      - 'context/areas/blog/**/*.md'

jobs:
  create-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Create issues for new blog posts
        uses: actions/github-script@v6
        with:
          script: |
            // Script to create issues for blog posts without github_issue
```

#### Step 12: Add Blog Configuration
**File**: `code/static-site-generator/src/config.rs` (enhance existing or create new)
**Configuration Options**:
```rust
pub struct BlogConfig {
    pub github_repo_owner: String,
    pub github_repo_name: String,
    pub comments_enabled: bool,
}
```

## Testing Strategy

### Unit Tests
- Blog detection logic (`is_blog_post`)
- Blog post filtering (`get_blog_posts`)
- Comments widget rendering
- Configuration parsing

### Integration Tests
- Blog listing page generation
- Blog post with comments rendering
- Navigation active state
- Search index includes blog posts

### End-to-End Tests
- Full site build with blog posts
- Comments widget loads (mock API)
- Navigation works correctly

## Success Criteria

### Phase 1 Complete When:
- [ ] Blog posts in `areas/blog/` are recognized
- [ ] Blog navigation item appears and is functional
- [ ] `/blog` shows chronological listing
- [ ] Blog posts render with standard template

### Phase 2 Complete When:
- [ ] Comments widget appears on blog posts
- [ ] GitHub comments load successfully
- [ ] "Add Comment" links to GitHub
- [ ] Graceful fallback for missing issues

### Phase 3 Complete When:
- [ ] Comment counts show in listing
- [ ] New blog posts get issues automatically
- [ ] Configuration is externalized
- [ ] All tests pass

## Implementation Commands

Each step can be implemented using these focused prompts:

```bash
# Phase 1
/code "Add blog detection utility module to src/utils/blog.rs with is_blog_post function"
/code "Update navigation in templates.rs to add Blog link after Archives"
/code "Create generate_blog_listing_page method in generator/html.rs"
/code "Integrate blog generation in lib.rs after category pages"

# Phase 2
/code "Create comments widget module in src/theme/comments.rs"
/code "Add CSS styles for comments section to styles.rs"
/code "Inject comments widget into blog posts in generate_document_page"

# Phase 3
/code "Add comment count placeholders and JavaScript to blog listing"
/code "Create GitHub Action workflow for automatic issue creation"
```

## Risk Mitigation

1. **API Rate Limits**: Implement caching and batch requests
2. **CORS Issues**: Use JSONP or proxy if needed
3. **Missing Dependencies**: Marked.js loaded from CDN with fallback
4. **Performance**: Comments load asynchronously, don't block rendering

## Next Steps

1. Begin Phase 1 implementation
2. Test each component thoroughly
3. Deploy to staging for validation
4. Gather feedback before Phase 2
5. Document any deviations from plan