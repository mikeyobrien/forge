---
title: Static Site Generator Landing Page Category Fix
category: resources
created: 2025-06-12T20:32:00.314Z
modified: 2025-06-12T20:32:00.314Z
tags:
  - static-site-generator
  - bug-fix
  - para-categories
  - base-url
---

# Static Site Generator Landing Page Category Fix

## Problem

After adding base URL support for GitHub Pages deployment, the landing page was displaying all documents with category "other" instead of their correct PARA categories (projects, areas, resources, archives).

## Root Cause

The issue occurred because the category detection logic in `render_home_page` was checking if URLs started with "/projects/", "/areas/", etc. However, with the base URL feature, URLs now include the base URL prefix (e.g., "/static-site-generator/projects/test.html"), which broke the category detection.

## Solution

Updated the category detection logic in `src/theme/templates.rs` to:

1. Strip the base URL prefix from document URLs before checking categories
2. Handle both root base URL ("/") and subpath base URLs correctly
3. Check relative paths instead of absolute URLs

## Key Changes

### File: `src/theme/templates.rs`

```rust
// Strip base URL to get the relative path for category detection
let relative_url = if !base_url.is_empty() && base_url != "/" && doc.url.starts_with(base_url) {
    &doc.url[base_url.len()..]
} else if doc.url.starts_with('/') {
    &doc.url[1..]
} else {
    &doc.url
};

let category_str = if relative_url.starts_with("projects/") {
    "projects"
} else if relative_url.starts_with("areas/") {
    "areas"
} else if relative_url.starts_with("resources/") {
    "resources"
} else if relative_url.starts_with("archives/") {
    "archives"
} else {
    "other"
};
```

## Tests Added

- `test_render_home_page_with_base_url`: Tests category detection with subpath base URL
- `test_render_home_page_with_root_base_url`: Tests category detection with root base URL

## Process Summary

- **Total steps**: 5
- **Key actions**:
  1. Debugged the issue by analyzing recent commits
  2. Identified that base URL changes broke category detection
  3. Fixed the logic to strip base URL before category checking
  4. Added comprehensive tests
  5. Built and verified the fix

## Efficiency Insights

- Quickly identified the root cause by checking recent commits
- Used targeted grep searches to find relevant code
- Added tests before implementing the fix (TDD approach)
- Minimal code changes for maximum impact

## Total Conversation Turns

2 turns (initial request + continue prompt)
