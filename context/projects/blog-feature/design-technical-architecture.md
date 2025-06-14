---
title: Blog Feature Technical Architecture
category: projects
status: active
created: 2025-06-14T00:53:32.108Z
modified: 2025-06-14T00:53:32.108Z
tags:
  - blog
  - architecture
  - design
  - technical
---
# Blog Feature Technical Architecture

## System Design Overview

### Architecture Principles
1. **Minimal Intrusion**: Blog functionality integrates without disrupting PARA methodology
2. **Static First**: All blog content remains static; only comments are dynamic
3. **Progressive Enhancement**: Site works without JavaScript; comments enhance experience
4. **Reuse Over Rebuild**: Leverage existing templates, styles, and components

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Forge Static Site Generator               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Blog Module  │  │  Templates   │  │  Comment Widget       │ │
│  ├──────────────┤  ├──────────────┤  ├───────────────────────┤ │
│  │ Detection    │  │ Navigation   │  │ GitHub API Client     │ │
│  │ Filtering    │  │ Blog Listing │  │ Comment Renderer      │ │
│  │ Sorting      │  │ Post Layout  │  │ Cache Manager         │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Core SSG Engine                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Document Parser │ HTML Generator │ Search Index │ Utils  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Static Output                            │
├─────────────────────────────────────────────────────────────────┤
│  /blog/                     Blog listing page                   │
│  /blog/post-slug            Individual blog posts               │
│  /blog/assets/comments.js   Comment widget script              │
└─────────────────────────────────────────────────────────────────┘
```

## Module Specifications

### Blog Detection Module (`utils/blog.rs`)

**Purpose**: Identify and categorize blog posts within the document tree

**Interface**:
```rust
pub trait BlogDetector {
    fn is_blog_post(&self, path: &Path) -> bool;
    fn extract_blog_metadata(&self, doc: &Document) -> Option<BlogMetadata>;
}

pub struct BlogMetadata {
    pub github_issue: Option<u32>,
    pub enable_comments: bool,
    pub published: bool,
}
```

**Implementation Details**:
- Path-based detection: `areas/blog/**/*.md`
- Metadata extraction from frontmatter
- Caching for repeated queries

### Blog Generator Module (`generator/blog.rs`)

**Purpose**: Generate blog-specific pages and listings

**Key Functions**:
```rust
pub fn generate_blog_listing(
    documents: &[Document],
    config: &Config,
    theme: &Theme,
) -> Result<String, Error>

pub fn inject_comments_widget(
    content: &str,
    metadata: &BlogMetadata,
    config: &BlogConfig,
) -> String
```

**Listing Page Features**:
- Chronological ordering (newest first)
- Pagination support (future enhancement)
- Tag filtering (future enhancement)
- Card-based layout matching existing design

### Comments Widget Module (`theme/comments.rs`)

**Purpose**: Client-side GitHub Issues integration

**Architecture**:
```javascript
class CommentWidget {
    constructor(config) {
        this.repoOwner = config.owner;
        this.repoName = config.repo;
        this.issueNumber = config.issue;
        this.cache = new CommentCache();
    }
    
    async loadComments() {
        // Check cache first
        // Fetch from GitHub API
        // Render comments
        // Update cache
    }
}
```

**Features**:
- Asynchronous loading
- LocalStorage caching
- Rate limit handling
- Markdown rendering
- Error boundaries

## Data Flow

### Build Time Flow

```
1. Document Discovery
   └─> Identify blog posts in areas/blog/
   
2. Metadata Extraction
   └─> Parse frontmatter for blog-specific fields
   
3. Blog List Generation
   └─> Sort by date
   └─> Generate /blog/index.html
   
4. Individual Post Generation
   └─> Standard document rendering
   └─> Inject comment widget if github_issue present
   
5. Asset Generation
   └─> Bundle comments.js with configuration
```

### Runtime Flow (Comments)

```
1. Page Load
   └─> Blog post renders immediately (static)
   
2. Comment Widget Initialization
   └─> Check for github_issue in page data
   └─> Initialize widget if present
   
3. Comment Loading
   └─> Check localStorage cache
   └─> Fetch from GitHub API if needed
   └─> Render comments progressively
   
4. User Interaction
   └─> "Add Comment" links to GitHub issue
   └─> User authenticates with GitHub
   └─> Returns to blog post after commenting
```

## Configuration Schema

### Site Configuration Extension

```toml
[blog]
enabled = true
github_owner = "username"
github_repo = "forge-site"
comments_enabled = true
cache_duration = 3600  # seconds

[blog.api]
rate_limit_buffer = 10  # preserve N requests
use_proxy = false       # for CORS issues
```

### Post Frontmatter Schema

```yaml
---
# Standard fields
title: "My Blog Post"
date: 2024-01-15
tags: ["rust", "ssg"]

# Blog-specific fields
github_issue: 42          # Issue number for comments
enable_comments: true     # Override global setting
draft: false             # Hide from listing
---
```

## Security Considerations

### API Security
- No authentication required for public repos
- Rate limiting handled gracefully
- No sensitive data exposed
- CORS handled via public API

### Content Security
- Comments rendered in sandboxed context
- XSS prevention via proper escaping
- No user input stored locally
- GitHub handles authentication

### Privacy
- No tracking or analytics
- Comments publicly visible (GitHub policy)
- No personal data collected
- Cache is client-side only

## Performance Strategy

### Build Performance
- Blog detection is O(n) path check
- No additional parsing overhead
- Parallel document processing maintained
- Incremental builds supported

### Runtime Performance
- Static content loads immediately
- Comments load asynchronously
- Progressive enhancement approach
- Caching reduces API calls

### Optimization Techniques
1. **Lazy Loading**: Comments only load when visible
2. **Request Batching**: Multiple comment counts in one request
3. **Edge Caching**: Static assets cached at edge
4. **Local Caching**: Browser caches API responses

## Error Handling Strategy

### Build Time Errors
- Missing blog directory: Create automatically
- Invalid frontmatter: Skip post with warning
- Template errors: Fail build with clear message

### Runtime Errors
- API unavailable: Show "Comments unavailable" message
- Rate limited: Show cached data or retry message
- Network error: Graceful degradation
- Invalid issue: Show "Comments not configured" message

## Testing Architecture

### Unit Test Coverage
```
utils/blog.rs
├── is_blog_post()
│   ├── ✓ Detects blog posts correctly
│   ├── ✓ Ignores non-blog content
│   └── ✓ Handles edge cases
└── extract_blog_metadata()
    ├── ✓ Parses github_issue
    ├── ✓ Handles missing fields
    └── ✓ Validates issue numbers
```

### Integration Test Scenarios
1. **Full Build**: Blog + standard content
2. **Comments Loading**: Mock API responses
3. **Error Scenarios**: API failures, missing issues
4. **Performance**: Build time regression tests

## Future Extensibility

### Planned Enhancements
1. **RSS Feed**: Auto-generate blog RSS
2. **Newsletter**: Email subscription integration
3. **Search**: Blog-specific search filters
4. **Analytics**: Privacy-respecting view counts

### Extension Points
- Plugin system for comment providers
- Theme customization for blog layout
- Webhook support for new posts
- Social media integration

## Migration Path

### From Existing Blog
1. Move posts to `areas/blog/`
2. Update frontmatter format
3. Map existing comments to issues
4. Redirect old URLs

### To Future Versions
- Backward compatible frontmatter
- Gradual feature adoption
- Configuration migration tools
- Data export capabilities