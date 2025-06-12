---
title: GitHub Pages Deployment Setup
category: resources
created: 2025-06-12T15:59:39.532Z
modified: 2025-06-12T15:59:39.532Z
tags:
  - deployment
  - github-actions
  - ci-cd
  - static-site
---

# GitHub Pages Deployment Setup

This document describes the GitHub Pages deployment setup for the para-ssg static site generator.

## Overview

Two GitHub Actions workflows have been created to automatically deploy the static site to GitHub Pages whenever changes are pushed to the main branch:

1. **deploy-gh-pages.yml** (Default - Active)
2. **deploy.yml** (Alternative - Disabled by default)

## Primary Workflow: deploy-gh-pages.yml

This workflow uses the traditional gh-pages branch approach and is active by default.

### Features

- Triggers on every push to main branch
- Can be manually triggered via workflow_dispatch
- Uses Rust toolchain with caching for faster builds
- Deploys to gh-pages branch using peaceiris/actions-gh-pages
- Force orphan commits to keep gh-pages branch clean

### Setup Instructions

1. The workflow is already active and will run on next push to main
2. After first deployment, go to repository Settings → Pages
3. Under "Source", select "Deploy from a branch"
4. Choose "gh-pages" branch and "/ (root)" folder
5. Click Save

## Alternative Workflow: deploy.yml

This workflow uses GitHub's newer Pages deployment method with artifacts.

### When to Use

- If you prefer the newer GitHub Pages deployment method
- If you want deployment environments and URLs in PR checks
- If you need more control over the deployment process

### Activation Steps

1. Edit `.github/workflows/deploy.yml`
2. Uncomment the push trigger (lines 11-12)
3. Edit `.github/workflows/deploy-gh-pages.yml`
4. Comment out or remove the push trigger
5. In repository Settings → Pages, change source to "GitHub Actions"

## Build Process

Both workflows follow the same build process:

1. Checkout repository
2. Install Rust toolchain (stable)
3. Cache Cargo dependencies
4. Build static site generator in release mode
5. Generate static site from context/ to build/
6. Deploy the build/ directory to GitHub Pages

## Manual Deployment

Both workflows support manual triggering:

1. Go to Actions tab in GitHub
2. Select the workflow
3. Click "Run workflow"
4. Select branch and run

## Monitoring Deployments

- Check Actions tab for workflow runs
- View deployment status in repository homepage sidebar
- Access deployed site at: https://[username].github.io/[repository]/

## Troubleshooting

### Build Failures

- Check Rust compilation errors in workflow logs
- Ensure all Cargo dependencies are available
- Verify context/ directory contains valid content

### Deployment Failures

- Ensure GitHub Pages is enabled in repository settings
- Check permissions for GITHUB_TOKEN
- Verify gh-pages branch protection rules

### Cache Issues

- Workflows use Cargo caching to speed up builds
- If encountering stale cache issues, increment cache key version

## Performance Optimization

The workflows include several optimizations:

- Cargo dependency caching reduces build time
- Release builds for optimal site generation speed
- Force orphan commits prevent gh-pages branch bloat

## Security Considerations

- Workflows have minimal required permissions
- gh-pages workflow uses GITHUB_TOKEN (no PAT needed)
- Deployment happens in isolated GitHub-hosted runners
