---
title: Blog Feature Implementation Tasks
category: projects
status: active
created: 2025-06-14T00:52:21.959Z
modified: 2025-06-14T08:25:00Z
tags:
  - blog
  - tasks
  - implementation
  - checklist
---
# Blog Feature Implementation Tasks

## Overview

Actionable task list for implementing blog functionality in the Forge static site generator. Tasks are organized by phase with clear dependencies and priorities.

## Phase 1: Core Blog Functionality

### Foundation Setup
- [x] **Create blog utility module** [Priority: High]
  - Create `src/utils/blog.rs` with detection functions
  - Add unit tests for `is_blog_post` and `get_blog_posts`
  - Export module in `src/utils/mod.rs`

- [x] **Update navigation template** [Priority: High]
  - Add Blog link to `BASE_TEMPLATE` in `templates.rs`
  - Update `render_base` method for active state handling
  - Test navigation on mobile and desktop

### Blog Listing Implementation
- [x] **Create blog listing generator** [Priority: High]
  - Add `generate_blog_listing_page` to `generator/html.rs`
  - Implement chronological sorting (newest first)
  - Reuse existing card template for consistency

- [x] **Integrate blog generation** [Priority: High]
  - Add blog generation logic to `lib.rs`
  - Create `blog/` output directory
  - Generate `blog/index.html` during build

### Testing Phase 1
- [x] **Test blog detection** [Priority: Medium]
  - Create test blog posts in `context/areas/blog/`
  - Verify posts are correctly identified
  - Check listing page generation

- [x] **Verify navigation** [Priority: Medium]
  - Ensure Blog link appears in header
  - Test active state on blog pages
  - Validate mobile menu functionality

## Phase 2: Comments Integration

### Comments Widget Development
- [x] **Create comments module** [Priority: High]
  - Create `src/theme/comments.rs` with widget template
  - Implement GitHub API integration JavaScript
  - Add error handling and loading states

- [x] **Style comments section** [Priority: Medium]
  - Add CSS to `styles.rs` for comments UI
  - Style comment cards and avatars
  - Ensure responsive design

### Integration Tasks
- [x] **Add Marked.js dependency** [Priority: High]
  - Include CDN link in base template
  - Add fallback for offline scenarios

- [x] **Inject comments into blog posts** [Priority: High]
  - Modify `generate_document_page` in `html.rs`
  - Check for `github_issue` in frontmatter
  - Inject widget only for blog posts

### Configuration
- [x] **Add blog configuration** [Priority: Medium]
  - Define `BlogConfig` struct
  - Add GitHub repo settings
  - Make configuration accessible to templates

### Testing Phase 2
- [x] **Test comments rendering** [Priority: High]
  - Add test post with `github_issue` frontmatter
  - Verify widget appears on blog posts only
  - Test GitHub API integration

- [x] **Test error scenarios** [Priority: Medium]
  - Missing issue number handling
  - API rate limit response
  - Network failure graceful degradation

## Phase 3: Automation & Polish

### Comment Counts
- [ ] **Add comment count to listings** [Priority: Medium]
  - Update card template with count placeholder
  - Implement batch API fetching
  - Cache results to respect rate limits

### GitHub Automation
- [ ] **Create issue automation workflow** [Priority: Low]
  - Write GitHub Action for new posts
  - Auto-create issues with correct labels
  - Update post frontmatter with issue number

### Performance Optimization
- [ ] **Implement caching strategy** [Priority: Medium]
  - Add localStorage caching for comments
  - Set appropriate cache expiration
  - Reduce API calls on repeat visits

### Final Polish
- [ ] **Add loading animations** [Priority: Low]
  - Smooth transitions for comment loading
  - Skeleton screens while fetching
  - Progress indicators for long operations

## Validation Checklist

### Before Phase 1 Completion
- [x] Blog posts render at correct URLs
- [x] Navigation includes Blog link
- [x] Blog listing shows all posts chronologically
- [x] No regression in existing functionality

### Before Phase 2 Completion
- [x] Comments load successfully from GitHub
- [x] Add Comment button links correctly
- [x] Styling matches site theme
- [x] Graceful degradation without JS

### Before Phase 3 Completion
- [ ] Comment counts display in listing
- [ ] Automation reduces manual work
- [ ] Performance meets targets (<2s load)
- [ ] All tests pass

## Quick Start Commands

```bash
# Build and test locally
cd code/static-site-generator
cargo build
cargo test

# Create test blog post
mkdir -p ../../context/areas/blog
echo "---
title: Test Blog Post
date: 2024-01-15
tags: [test]
---

This is a test blog post." > ../../context/areas/blog/test-post.md

# Run site generation
cargo run -- ../../context ../../build

# Serve locally to test
cd ../../build && python -m http.server 8000
```

## Dependencies

### Phase Dependencies
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Comments testing requires GitHub repo setup

### Technical Dependencies
- Rust toolchain (existing)
- Marked.js (CDN, no installation)
- GitHub API (no authentication for public repos)

## Success Metrics

- [ ] All blog posts accessible via /blog URLs
- [ ] Comments load within 2 seconds
- [ ] Zero JavaScript errors in console
- [ ] Build time increase <10%
- [ ] All existing tests still pass

## Notes

- Keep changes minimal and focused
- Reuse existing components where possible
- Test each phase thoroughly before proceeding
- Document any deviations from plan