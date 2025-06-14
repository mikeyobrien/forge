---
title: Implementation Plan - Puppeteer to Playwright Migration
category: projects
status: active
created: 2025-06-13T15:05:17.677Z
modified: 2025-06-13T15:05:17.677Z
tags:
  - migration
  - puppeteer
  - playwright
  - screenshot
  - mcp-server
  - implementation
---

---

title: Implementation Plan - Puppeteer to Playwright Migration
category: projects
created: 2025-01-13T00:00:00Z
modified: 2025-01-13T00:00:00Z
tags: ["migration", "puppeteer", "playwright", "screenshot", "mcp-server", "implementation"]
command_type: plan
project: why
status: active
generated_by: /code
implements: report-exploration-puppeteer-to-playwright
related_docs:

- projects/why/report-exploration-puppeteer-to-playwright.md

---

# Implementation Plan - Puppeteer to Playwright Migration

## Migration Steps

### 1. Update Dependencies

- Remove `puppeteer` from package.json
- Add `playwright` as a dependency
- Run npm install to update package-lock.json

### 2. Update Screenshot Implementation (index.ts)

#### Import Changes

```typescript
// OLD: import puppeteer from 'puppeteer';
// NEW: import { chromium } from 'playwright';
```

#### Browser Launch

```typescript
// OLD: const browser = await puppeteer.launch({ headless: true });
// NEW: const browser = await chromium.launch({ headless: true });
```

#### Viewport Setting

```typescript
// OLD: await page.setViewport(viewport);
// NEW: await page.setViewportSize(viewport);
```

#### Navigation Wait Option

```typescript
// OLD: await page.goto(url, { waitUntil: 'networkidle2' });
// NEW: await page.goto(url, { waitUntil: 'networkidle' });
```

### 3. Update Test Mocks (screenshot.test.ts)

#### Mock Import Changes

```typescript
// OLD: jest.mock('puppeteer', () => ({ launch: jest.fn() }));
// NEW: jest.mock('playwright', () => ({ chromium: { launch: jest.fn() } }));
```

#### Test Import Changes

```typescript
// OLD: import puppeteer from 'puppeteer';
// NEW: import { chromium } from 'playwright';
```

#### Mock References

```typescript
// OLD: const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;
// NEW: const mockChromium = chromium as jest.Mocked<typeof chromium>;
```

### 4. Verification Steps

1. Run `npm test` to ensure all tests pass
2. Run `npm run typecheck` to verify TypeScript compilation
3. Run the MCP inspector to verify the tool still works:
   ```bash
   npx -y @modelcontextprotocol/inspector --cli ./code/mcp-server/start-mcp.sh --method tools/list
   ```
4. Test the screenshot tool with actual usage

### 5. Documentation Updates

- Update any references to Puppeteer in documentation
- Add a note about the migration in the changelog if one exists

## API Mapping Reference

| Operation      | Puppeteer            | Playwright               |
| -------------- | -------------------- | ------------------------ |
| Browser Launch | `puppeteer.launch()` | `chromium.launch()`      |
| New Page       | `browser.newPage()`  | `browser.newPage()`      |
| Set Viewport   | `page.setViewport()` | `page.setViewportSize()` |
| Navigate       | `page.goto()`        | `page.goto()`            |
| Evaluate JS    | `page.evaluate()`    | `page.evaluate()`        |
| Screenshot     | `page.screenshot()`  | `page.screenshot()`      |
| Close Browser  | `browser.close()`    | `browser.close()`        |

## Expected Outcomes

- Screenshot functionality remains identical
- All tests continue to pass
- TypeScript compilation succeeds
- MCP tool registration works correctly
- Performance may improve slightly

## Rollback Plan

If issues arise:

1. Revert the package.json changes
2. Revert the code changes in index.ts and screenshot.test.ts
3. Run `npm install` to restore Puppeteer
4. Verify functionality is restored
