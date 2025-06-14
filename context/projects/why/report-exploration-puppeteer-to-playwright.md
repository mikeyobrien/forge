---
title: Exploration Report - Puppeteer to Playwright Migration
category: projects
status: active
created: 2025-06-13T15:04:30.929Z
modified: 2025-06-13T15:04:30.929Z
tags:
  - migration
  - puppeteer
  - playwright
  - screenshot
  - mcp-server
---

---

title: Exploration Report - Puppeteer to Playwright Migration
category: projects
created: 2025-01-13T00:00:00Z
modified: 2025-01-13T00:00:00Z
tags: ["migration", "puppeteer", "playwright", "screenshot", "mcp-server"]
command_type: report
project: why
status: active
generated_by: /code
context_source:

- code/mcp-server/package.json
- code/mcp-server/src/tools/screenshot/index.ts
- code/mcp-server/src/tools/screenshot/screenshot.test.ts

---

# Exploration Report - Puppeteer to Playwright Migration

## Current State Analysis

### Puppeteer Usage Overview

The codebase currently uses Puppeteer exclusively in the MCP server's screenshot tool:

1. **Package Dependencies**

   - Location: `code/mcp-server/package.json`
   - Current version: `puppeteer: ^22.0.0`
   - Used as a production dependency

2. **Implementation Files**
   - Main implementation: `code/mcp-server/src/tools/screenshot/index.ts`
   - Test file: `code/mcp-server/src/tools/screenshot/screenshot.test.ts`

### Screenshot Tool Functionality

The screenshot tool provides the following capabilities:

1. **Core Features**

   - Takes desktop (1200x800) and mobile (375x667) screenshots
   - Supports custom URLs or auto-serves static files
   - Handles size constraints (pixel limits and file size limits)
   - Progressive JPEG compression when PNG files are too large
   - Temporary file management with optional persistence

2. **API Surface**

   - Main export: `handleScreenshot(args: ScreenshotOptions)`
   - Tool definition: `screenshotTool` for MCP integration
   - Options include: url, permanent, outputDir, skipServer, maxSizeKB, quality, maxPixels

3. **Puppeteer-Specific Code**
   - Browser launch: `puppeteer.launch({ headless: true })`
   - Page creation: `browser.newPage()`
   - Viewport setting: `page.setViewport(viewport)`
   - Navigation: `page.goto(url, { waitUntil: 'networkidle2' })`
   - JS evaluation: `page.evaluate()` for getting page dimensions
   - Screenshot capture: `page.screenshot()` with various options
   - Browser cleanup: `browser.close()`

### Test Coverage

The test file comprehensively tests:

- Pixel constraint handling (clipping large pages)
- File size constraint handling (PNG to JPEG conversion)
- Progressive JPEG quality reduction
- Combined constraints
- Error handling
- Default value behavior

## Migration Considerations

### API Compatibility

Playwright has a very similar API to Puppeteer, which makes migration straightforward:

| Puppeteer            | Playwright               |
| -------------------- | ------------------------ |
| `puppeteer.launch()` | `chromium.launch()`      |
| `browser.newPage()`  | `browser.newPage()`      |
| `page.setViewport()` | `page.setViewportSize()` |
| `page.goto()`        | `page.goto()`            |
| `page.evaluate()`    | `page.evaluate()`        |
| `page.screenshot()`  | `page.screenshot()`      |
| `browser.close()`    | `browser.close()`        |

### Key Differences

1. **Import Pattern**

   - Puppeteer: `import puppeteer from 'puppeteer'`
   - Playwright: `import { chromium } from 'playwright'`

2. **Viewport Method**

   - Puppeteer: `setViewport()`
   - Playwright: `setViewportSize()`

3. **Wait Options**

   - Both support `networkidle` but Playwright uses `networkidle` instead of `networkidle2`

4. **Screenshot Options**
   - Both have identical screenshot options (fullPage, clip, type, quality, path)

### Benefits of Migration

1. **Better Performance**: Playwright is generally faster and more reliable
2. **Multi-Browser Support**: Can easily test with Firefox and WebKit if needed
3. **Better Testing Tools**: Built-in test runner and better debugging
4. **Active Development**: More frequent updates and better maintenance
5. **Better TypeScript Support**: First-class TypeScript support

## Migration Risk Assessment

**Low Risk**: The migration is low risk because:

- Limited scope (only one tool uses Puppeteer)
- Similar APIs make code changes minimal
- Comprehensive test coverage ensures functionality is preserved
- No breaking changes to the tool's public API
