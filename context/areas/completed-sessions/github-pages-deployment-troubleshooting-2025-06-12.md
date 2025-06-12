---
title: GitHub Pages Deployment Troubleshooting Session
category: areas
created: 2025-06-12T17:44:06.802Z
modified: 2025-06-12T17:44:06.802Z
tags:
  - deployment
  - troubleshooting
  - github-pages
  - completed
---

# GitHub Pages Deployment Troubleshooting Session

## Session Date: 2025-06-12

### Initial Problem

After setting up GitHub Pages deployment with GitHub Actions, the site was experiencing redirect issues and broken navigation links when deployed to the subpath `https://mikeyobrien.github.io/forge/`.

### Issues Identified

1. **Custom Domain Redirect**

   - The repository was redirecting to `blog.mobrienv.dev` due to a blanket custom domain configured at the user level
   - Solution: Removed custom domain from user site repository

2. **Broken Navigation Links**
   - All links were using absolute paths starting with `/`
   - When deployed to `/forge/`, links pointed to root domain instead of subpath
   - Example: `/projects/` linked to `mikeyobrien.github.io/projects/` instead of `mikeyobrien.github.io/forge/projects/`

### Solution Process

1. **Environment Variable Support**

   - Added `PARA_SSG_BASE_URL` environment variable support to the static site generator
   - Modified `Config::new()` to read and use the base URL

2. **Template Updates**

   - Updated all hardcoded URLs in templates to use `{base_url}` placeholder
   - Modified template engine to accept and replace base URL in all templates

3. **URL Generation Fixes**

   - Document URLs: Fixed to include base URL prefix
   - Breadcrumb URLs: Updated to use base URL for all navigation
   - Backlink URLs: Modified to include base URL
   - Home page links: Updated PARA category links

4. **GitHub Actions Configuration**
   - Set `PARA_SSG_BASE_URL="/forge/"` in the workflow
   - Ensured consistent URL generation during builds

### Key Code Changes

```rust
// Before
let url = format!("/{}", doc.output_path.display());

// After
let url = format!("{}{}", self.base_url, doc.output_path.display());
```

### Verification Steps

1. Built locally with base URL to test
2. Checked generated HTML for correct URLs
3. Deployed and verified all navigation works
4. Tested document links, breadcrumbs, and backlinks

### Lessons Learned

1. **Always consider deployment context** - Static sites need to be aware of their deployment path
2. **Use environment variables** - Makes the solution flexible for different deployment scenarios
3. **Test URL generation thoroughly** - Check all types of links (navigation, content, breadcrumbs)
4. **CDN caching** - GitHub Pages CDN can delay visibility of fixes

### Final Result

The site now works correctly at https://mikeyobrien.github.io/forge/ with all navigation and links functioning properly. The solution is flexible enough to support deployment to any subpath by setting the appropriate environment variable.

### Related Documentation

- [[github-pages-deployment-setup]] - Initial setup guide
- [[github-pages-subpath-deployment-fix]] - Detailed fix documentation
