---
title: GitHub Markdown CMS Implementation Roadmap
category: projects
status: active
created: 2025-06-14T18:59:50.050Z
modified: 2025-06-14T18:59:50.050Z
tags:
  - implementation
  - roadmap
  - planning
  - tdd
---

---

title: GitHub Markdown CMS Implementation Roadmap
category: projects
created: 2025-06-14
modified: 2025-06-14
tags: [cms, github, markdown, implementation, roadmap]
command_type: plan
project: github-markdown-cms
status: active
generated_by: /plan
implements: projects/github-markdown-cms/spec-github-markdown-cms.md
related_docs:

- projects/github-markdown-cms/spec-github-markdown-cms.md
- projects/github-markdown-cms/index.md
  context_source:
- projects/github-markdown-cms/spec-github-markdown-cms.md

---

# GitHub Markdown CMS Implementation Roadmap

## Executive Summary

This roadmap provides a step-by-step implementation plan for the GitHub Markdown CMS, optimized for Test-Driven Development (TDD). Each phase builds upon the previous, delivering incremental value while maintaining a focus on security, performance, and user experience.

## Implementation Strategy

### Core Principles

1. **Test-First Development**: Write tests before implementation
2. **Incremental Delivery**: Each step produces working functionality
3. **Security by Design**: OAuth proxy from the start
4. **User-Centric**: Vim users should feel at home immediately

### Technology Stack (Finalized)

- **Frontend**: Vanilla TypeScript with minimal dependencies
- **Editor**: CodeMirror 6 with vim-mode extension
- **Build Tool**: Vite for fast development
- **Testing**: Vitest + Playwright for unit/e2e tests
- **Auth Proxy**: Node.js with Express (minimal)
- **Deployment**: Vercel/Netlify for frontend, Railway/Fly.io for proxy

## Phase 1: Foundation (Week 1-2)

### Step 1.1: Project Setup & Architecture

**Goal**: Establish project structure and development environment

```
/
├── frontend/
│   ├── src/
│   │   ├── editor/
│   │   ├── auth/
│   │   ├── github/
│   │   └── ui/
│   ├── tests/
│   └── package.json
├── auth-proxy/
│   ├── src/
│   ├── tests/
│   └── package.json
└── docs/
```

**Tests First**:

- Project structure validation
- Build configuration tests
- Environment setup verification

**Implementation**:

1. Initialize monorepo structure
2. Configure TypeScript with strict mode
3. Set up Vite with proper paths
4. Configure testing framework
5. Add pre-commit hooks for linting

**Success Criteria**:

- `npm run dev` starts development server
- `npm test` runs all tests
- TypeScript compilation with zero errors

### Step 1.2: OAuth Proxy Server

**Goal**: Secure GitHub authentication without exposing tokens

**Tests First**:

```typescript
describe('OAuth Proxy', () => {
  test('redirects to GitHub OAuth page');
  test('exchanges code for token securely');
  test('creates encrypted session');
  test('validates session on API requests');
  test('handles token refresh');
});
```

**Implementation**:

1. Express server with minimal middleware
2. GitHub OAuth app registration
3. Secure session management (iron-session)
4. Proxy endpoints for GitHub API
5. Rate limiting and request logging

**Success Criteria**:

- User can authenticate via GitHub
- Tokens never exposed to frontend
- Session persists across refreshes

### Step 1.3: Basic Editor Integration

**Goal**: CodeMirror with vim mode and markdown syntax

**Tests First**:

```typescript
describe('Editor', () => {
  test('initializes with vim mode active');
  test('responds to basic vim commands (:w, :q, i, esc)');
  test('highlights markdown syntax');
  test('handles large files efficiently');
});
```

**Implementation**:

1. CodeMirror 6 basic setup
2. Vim mode extension configuration
3. Markdown syntax highlighting
4. Rosé Pine theme implementation
5. Iosevka font integration

**Success Criteria**:

- Vim commands work as expected
- Markdown renders with syntax highlighting
- Performance meets <10ms typing latency

## Phase 2: Core Features (Week 3-4)

### Step 2.1: GitHub Repository Integration

**Goal**: List, select, and read repository files

**Tests First**:

```typescript
describe('Repository Management', () => {
  test('lists user repositories');
  test('filters GitHub Pages enabled repos');
  test('reads repository file tree');
  test('caches repository data appropriately');
});
```

**Implementation**:

1. Repository listing with Octokit.js
2. File tree traversal and caching
3. Markdown file filtering
4. Repository selection persistence

**Success Criteria**:

- User sees their GitHub repos
- Can navigate repository structure
- File list updates reflect GitHub state

### Step 2.2: Fuzzy File Finder

**Goal**: Telescope-like file navigation

**Tests First**:

```typescript
describe('Fuzzy Finder', () => {
  test('opens with Ctrl+P');
  test('searches by filename');
  test('searches by content');
  test('shows preview on hover');
  test('responds within 50ms for 1000 files');
});
```

**Implementation**:

1. Fuse.js integration
2. Overlay UI component
3. Keyboard navigation
4. File preview panel
5. Recent files tracking

**Success Criteria**:

- Fuzzy search works across filenames
- Navigation entirely keyboard-driven
- Performance meets 50ms target

### Step 2.3: Local Storage & Auto-save

**Goal**: Never lose work with IndexedDB persistence

**Tests First**:

```typescript
describe('Local Persistence', () => {
  test('saves to IndexedDB on pause');
  test('recovers unsaved work on refresh');
  test('tracks sync status accurately');
  test('handles storage quota gracefully');
});
```

**Implementation**:

1. IndexedDB wrapper for file storage
2. Debounced auto-save (1s)
3. Sync status indicators
4. Diff tracking between local/remote
5. Storage quota management

**Success Criteria**:

- Work persists across sessions
- Clear sync status visibility
- No data loss on crashes

## Phase 3: Publishing & Advanced Features (Week 5-6)

### Step 3.1: Publish Workflow

**Goal**: Git-based publishing with LLM commits

**Tests First**:

```typescript
describe('Publishing', () => {
  test('shows diff preview before publish');
  test('generates conventional commits');
  test('handles publish conflicts');
  test('updates sync status after publish');
});
```

**Implementation**:

1. Diff generation and display
2. LiteLLM integration setup
3. Commit message generation
4. Git push via proxy
5. Conflict detection logic

**Success Criteria**:

- One-key publish workflow
- Meaningful commit messages
- Conflict handling without data loss

### Step 3.2: Configuration System

**Goal**: Customizable vim mappings and preferences

**Tests First**:

```typescript
describe('Configuration', () => {
  test('loads .vim-cms.config.js');
  test('applies custom vim mappings');
  test('validates configuration schema');
  test('falls back to defaults gracefully');
});
```

**Implementation**:

1. Config file loader
2. Vim mapping parser
3. Schema validation
4. UI for preferences
5. Config persistence

**Success Criteria**:

- Custom mappings work correctly
- Invalid configs don't break app
- Changes apply without restart

### Step 3.3: Setup Wizard

**Goal**: Smooth onboarding experience

**Tests First**:

```typescript
describe('Setup Wizard', () => {
  test('guides through OAuth setup');
  test('validates LLM API keys');
  test('creates initial configuration');
  test('handles errors gracefully');
});
```

**Implementation**:

1. Multi-step wizard UI
2. OAuth flow integration
3. LLM provider testing
4. Repository selection
5. Config generation

**Success Criteria**:

- New user fully configured in <5 minutes
- Clear error messages
- Skippable for returning users

## Phase 4: Polish & Optimization (Week 7-8)

### Step 4.1: Performance Optimization

**Goal**: Meet all performance targets

**Tasks**:

1. Code splitting for faster initial load
2. Virtual scrolling for large file lists
3. Web Worker for markdown rendering
4. Service Worker for offline support
5. Request batching for GitHub API

### Step 4.2: Enhanced Features

**Goal**: Quality of life improvements

**Tasks**:

1. Git history viewer
2. Search within files
3. Markdown preview themes
4. Export functionality
5. Backup/restore options

### Step 4.3: Testing & Documentation

**Goal**: Production readiness

**Tasks**:

1. E2E test suite completion
2. Performance benchmarks
3. Security audit
4. User documentation
5. API documentation

## Testing Strategy

### Test Categories

1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: Component interactions
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Speed and responsiveness
5. **Security Tests**: Auth and data protection

### Test Coverage Targets

- Unit: 90%
- Integration: 80%
- E2E: Critical paths 100%

## Deployment Strategy

### Infrastructure

```yaml
Frontend:
  - Provider: Vercel/Netlify
  - CDN: Automatic
  - Domain: Custom domain support

Auth Proxy:
  - Provider: Railway/Fly.io
  - Scaling: Auto-scale to 3 instances
  - Monitoring: Sentry integration

Storage:
  - User data: Browser (IndexedDB)
  - Config: LocalStorage
  - Content: GitHub repositories
```

### Release Process

1. Feature branch development
2. PR with passing tests
3. Staging deployment
4. Manual QA testing
5. Production release
6. Monitor error rates

## Risk Mitigation

### Technical Risks

1. **GitHub API Rate Limits**
   - Mitigation: Aggressive caching, request batching
2. **Browser Storage Limits**

   - Mitigation: Storage quota monitoring, cleanup strategies

3. **Vim Mode Completeness**
   - Mitigation: Focus on essential commands, clear documentation

### Security Risks

1. **Token Exposure**

   - Mitigation: Proxy-only token handling, secure sessions

2. **XSS Vulnerabilities**
   - Mitigation: Content Security Policy, input sanitization

## Success Metrics

### Phase 1 Complete When:

- OAuth login works
- Basic vim editing functional
- Tests passing

### Phase 2 Complete When:

- Fuzzy finder operational
- Auto-save working
- Repository integration complete

### Phase 3 Complete When:

- Publishing workflow smooth
- Configuration system active
- Setup wizard guides new users

### Phase 4 Complete When:

- Performance targets met
- Documentation complete
- Security audit passed

## Next Steps

1. Review and approve implementation plan
2. Set up development environment
3. Create GitHub repository
4. Begin Phase 1 implementation
5. Schedule weekly progress reviews

This roadmap provides clear, testable steps toward building a production-ready GitHub Markdown CMS that vim users will love.
