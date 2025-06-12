---
title: GitHub Pages Subpath Deployment Fix
category: resources
created: 2025-06-12T17:43:17.518Z
modified: 2025-06-12T17:43:17.518Z
tags:
  - deployment
  - github-pages
  - troubleshooting
  - static-site-generator
---

# GitHub Pages Subpath Deployment Fix

## Problem Summary

When deploying the para-ssg static site to GitHub Pages under a project path (e.g., `username.github.io/project/`), all internal links were broken because they used absolute paths starting with `/` instead of including the project subpath.

## Root Cause

The static site generator was generating all URLs with absolute paths:

- Navigation links: `/projects/`, `/areas/`, etc.
- Document links: `/projects/document.html`
- Breadcrumb links: `/`, `/projects/`
- Backlinks between documents: `/resources/other-doc.html`

When deployed to `https://mikeyobrien.github.io/forge/`, these links would resolve to `https://mikeyobrien.github.io/projects/` instead of `https://mikeyobrien.github.io/forge/projects/`.

## Solution Implementation

### 1. Added Base URL Support to Static Site Generator

Modified `src/lib.rs` to read base URL from environment variable:

```rust
// In Config::new()
let base_url = std::env::var("PARA_SSG_BASE_URL")
    .unwrap_or_else(|_| "/".to_string());
```

### 2. Updated GitHub Actions Workflow

Modified `.github/workflows/deploy-gh-pages.yml` to set the base URL:

```yaml
- name: Generate static site
  run: |
    cd code/static-site-generator
    RUSTFLAGS="" PARA_SSG_BASE_URL="/forge/" cargo run --release -- ../../context ../../build
```

### 3. Propagated Base URL Through Templates

#### Updated HtmlGenerator

- Modified constructor to accept `base_url` parameter
- Passed base_url to all template rendering methods

#### Updated Template Engine

- Modified `render_base()` to accept base_url parameter
- Updated all hardcoded URLs in templates to use `{base_url}` placeholder

#### Fixed Document URLs

Changed all document URL generation from:

```rust
let url = format!("/{}", doc.output_path.display());
```

To:

```rust
let url = format!("{}{}", self.base_url, doc.output_path.display());
```

#### Fixed Breadcrumb URLs

Updated breadcrumb generation to include base URL:

```rust
// Home link
url: Some(self.base_url.clone()),

// Category links
Some(format!("{}{}/", self.base_url, current_path.display()))
```

#### Fixed Backlink URLs

```rust
let url = format!("{}{}", self.base_url, bl.source_path.with_extension("html").display());
```

## Files Modified

1. **code/static-site-generator/src/lib.rs**

   - Added environment variable reading for PARA_SSG_BASE_URL

2. **code/static-site-generator/src/generator/html.rs**

   - Updated HtmlGenerator to store and use base_url
   - Fixed all URL generation to include base_url

3. **code/static-site-generator/src/theme/templates.rs**

   - Updated template strings to use {base_url} placeholder
   - Modified render methods to accept base_url parameter

4. **.github/workflows/deploy-gh-pages.yml**
   - Added PARA_SSG_BASE_URL environment variable

## Testing

Local testing with base URL:

```bash
cd code/static-site-generator
PARA_SSG_BASE_URL="/forge/" cargo run -- ../../context ../../build-test
```

Verify generated URLs:

```bash
grep -o 'href="[^"]*"' ../../build-test/index.html
```

## Deployment Notes

1. The base URL must end with a slash (e.g., `/forge/`)
2. Document paths should not start with a slash
3. GitHub Pages CDN can take 5-10 minutes to update
4. Use cache-busting headers to verify changes: `curl -H "Cache-Control: no-cache"`

## Environment Variables

- `PARA_SSG_BASE_URL`: Base URL path for deployment (default: "/")
  - For root deployment: "/" or unset
  - For subpath deployment: "/project-name/"

## Common Issues

1. **Redirect to custom domain**: Check if a blanket custom domain is configured at the user/organization level
2. **CDN caching**: GitHub Pages CDN can serve stale content for several minutes
3. **Missing trailing slash**: Ensure base URL ends with `/` to avoid double slashes

## Verification Steps

After deployment:

1. Check workflow succeeded in Actions tab
2. Verify gh-pages branch updated
3. Test navigation links work
4. Test document links work
5. Test breadcrumb navigation
6. Test backlinks between documents
