---
title: Blog Feature Documentation
category: projects
status: active
created: 2025-01-15T14:10:00Z
tags:
  - blog
  - documentation
  - configuration
---

# Blog Feature Documentation

## Overview

The blog feature adds dedicated blogging functionality to the Forge static site generator. It integrates seamlessly with the PARA methodology while providing modern blog capabilities including GitHub Issues-based comments.

## Features

- **Dedicated Blog Section**: Blog posts live in `areas/blog/` with their own navigation
- **Chronological Listing**: Automatic blog index page with newest posts first
- **GitHub Comments**: Integration with GitHub Issues for static site commenting
- **Configurable**: Environment variable configuration for GitHub repository
- **Static-First**: All content remains static with progressive enhancement

## Usage

### Creating Blog Posts

1. Create markdown files in `context/areas/blog/`
2. Add frontmatter with required fields:

```yaml
---
title: Your Blog Post Title
date: 2024-01-15T10:00:00Z
tags: [tag1, tag2]
github_issue: "123"  # Optional: for comments
---

Your blog content here...
```

### Configuration

Set environment variables before building:

```bash
# Required for comments feature
export PARA_SSG_GITHUB_OWNER="yourusername"
export PARA_SSG_GITHUB_REPO="yourrepo"

# Optional: disable comments globally
export PARA_SSG_COMMENTS_ENABLED="false"
```

### Building with Blog

```bash
# Standard build process
cd code/static-site-generator
cargo run -- ../../context ../../build

# Or use the build script
./build.sh
```

## Comments Integration

### Setup

1. Create a GitHub repository for your site
2. Set the environment variables with your repo details
3. For each blog post with comments:
   - Create an issue in your GitHub repo
   - Add `github_issue: "ISSUE_NUMBER"` to the post's frontmatter

### How It Works

- Comments load asynchronously from GitHub Issues API
- No authentication required for public repositories
- Readers click "Add Comment" to go to GitHub
- Markdown formatting is supported via Marked.js

### Example Post with Comments

```yaml
---
title: Welcome to Our Blog
date: 2024-01-15T10:00:00Z
tags: [welcome, announcement]
github_issue: "1"
---

# Welcome to Our Blog

This post will have a comments section at the bottom.
```

## File Structure

```
context/
└── areas/
    └── blog/
        ├── first-post.md
        ├── second-post.md
        └── ...

build/
└── areas/
    └── blog/
        ├── index.html      # Blog listing page
        ├── first-post.html
        ├── second-post.html
        └── ...
```

## Styling

The blog integrates with the existing theme:
- Blog posts use the same card-based layout
- Comments section matches site styling
- Responsive design for mobile devices
- Consistent navigation with "Blog" link

## Limitations

- GitHub API rate limit: 60 requests/hour for unauthenticated requests
- Comments require JavaScript (graceful degradation without)
- No comment counts in listing yet (Phase 3 feature)
- Manual issue creation required (automation in Phase 3)

## Troubleshooting

### Comments Not Appearing

1. Check environment variables are set:
   ```bash
   echo $PARA_SSG_GITHUB_OWNER
   echo $PARA_SSG_GITHUB_REPO
   ```

2. Verify the GitHub issue exists and is public

3. Check browser console for API errors

4. Ensure `github_issue` in frontmatter is a string in quotes

### Blog Posts Not Showing

1. Verify posts are in `context/areas/blog/`
2. Check frontmatter is valid YAML
3. Ensure date format is ISO 8601: `2024-01-15T10:00:00Z`

## Future Enhancements (Phase 3)

- [ ] Comment counts on blog listing
- [ ] GitHub Action for automatic issue creation
- [ ] Caching for better performance
- [ ] Loading animations
- [ ] RSS feed generation
- [ ] Tag pages and tag clouds