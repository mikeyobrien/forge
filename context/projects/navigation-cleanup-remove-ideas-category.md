---
title: Remove Ideas Category from Navigation
category: projects
status: completed
created: 2025-06-13T00:00:00Z
modified: 2025-06-13T00:00:00Z
tags:
  - static-site-generator
  - cleanup
  - para
---

# Remove Ideas Category from Navigation

## Summary

The navigation previously included an **Ideas** link that did not align with the PARA structure. The base template also displayed the tagline "A PARA-style knowledge forge." Both items were removed to keep the site focused on the four official PARA categories.

## Process Steps

1. Deleted the Ideas link from the header navigation in `templates.rs`.
2. Removed the tagline markup and its CSS rules from `styles.rs`.
3. Verified the remaining navigation highlights active categories correctly.

These changes simplify the UI and avoid confusion about unsupported categories.
