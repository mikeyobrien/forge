---
title: GitHub Markdown CMS Technical Architecture
category: projects
status: active
created: 2025-06-14T19:02:01.411Z
modified: 2025-06-14T19:02:01.411Z
tags:
  - architecture
  - technical-design
  - system-design
---

---

title: GitHub Markdown CMS Technical Architecture
category: projects
created: 2025-06-14
modified: 2025-06-14
tags: [cms, github, markdown, architecture, design]
command_type: design
project: github-markdown-cms
status: active
generated_by: /plan
implements: projects/github-markdown-cms/spec-github-markdown-cms.md
related_docs:

- projects/github-markdown-cms/spec-github-markdown-cms.md
- projects/github-markdown-cms/plan-implementation-roadmap.md
- projects/github-markdown-cms/todo-implementation.md
  context_source:
- projects/github-markdown-cms/spec-github-markdown-cms.md

---

# GitHub Markdown CMS Technical Architecture

## System Overview

The GitHub Markdown CMS is designed as a lightweight, security-focused web application that provides a vim-like editing experience for GitHub-hosted markdown files. The architecture prioritizes security, performance, and developer experience.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   Vite Dev  │  │  CodeMirror  │  │  State Manager     │    │
│  │   Server    │  │  Editor + Vim │  │  (Local Storage)   │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Fuse.js    │  │  IndexedDB   │  │  Service Worker    │    │
│  │  Search     │  │  Storage     │  │  (Offline)         │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Auth Proxy Server                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   Express   │  │ Iron Session │  │  Rate Limiter      │    │
│  │   Server    │  │  Management  │  │  (Redis)           │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   OAuth     │  │  API Proxy   │  │  Logging           │    │
│  │   Handler   │  │  Layer       │  │  (Structured)      │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  GitHub     │  │   LiteLLM    │  │  GitHub Pages      │    │
│  │  API        │  │   Providers  │  │  (User Blogs)      │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```typescript
// Component hierarchy
App
├── AuthProvider
│   └── GithubOAuth
├── EditorContainer
│   ├── CodeMirrorEditor
│   │   ├── VimMode
│   │   └── MarkdownSyntax
│   └── PreviewPane
├── FuzzyFinder
│   ├── SearchInput
│   ├── ResultsList
│   └── PreviewPanel
├── StatusBar
│   ├── SyncIndicator
│   └── VimModeDisplay
└── ConfigProvider
    └── UserPreferences
```

### Data Flow

```
User Action → UI Component → State Manager → API Client → Auth Proxy → GitHub API
     ↑                              ↓
     └──────── UI Update ←─────────┘
```

## Security Architecture

### Authentication Flow

```
1. User clicks "Login with GitHub"
2. Frontend redirects to: /auth/login
3. Auth proxy redirects to: github.com/login/oauth/authorize
4. User authorizes app on GitHub
5. GitHub redirects to: /auth/callback?code=xxx
6. Auth proxy exchanges code for access token
7. Auth proxy creates encrypted session
8. Frontend receives session cookie
9. All API requests include session cookie
10. Auth proxy validates session and proxies requests
```

### Security Layers

1. **Frontend Security**

   - Content Security Policy (CSP)
   - No token storage in browser
   - HTTPS-only communication
   - Input sanitization

2. **Auth Proxy Security**

   - Encrypted sessions (iron-session)
   - HTTP-only, Secure, SameSite cookies
   - Rate limiting per IP/session
   - Request validation
   - Audit logging

3. **API Security**
   - Token scope limitations
   - Request signing
   - Timeout handling
   - Error sanitization

## State Management

### Client State Architecture

```typescript
interface AppState {
  auth: {
    isAuthenticated: boolean;
    user: GitHubUser | null;
    session: SessionInfo;
  };

  editor: {
    activeFile: FileInfo | null;
    content: string;
    isDirty: boolean;
    vimMode: 'normal' | 'insert' | 'visual';
  };

  repository: {
    current: Repository | null;
    files: FileTree;
    lastSync: Date;
  };

  ui: {
    fuzzyFinderOpen: boolean;
    previewVisible: boolean;
    theme: 'rose-pine';
  };
}
```

### Storage Strategy

1. **IndexedDB**: File content, drafts, large data
2. **LocalStorage**: User preferences, small config
3. **SessionStorage**: Temporary UI state
4. **Memory**: Active editing state

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**

   ```typescript
   // Lazy load heavy components
   const FuzzyFinder = lazy(() => import('./FuzzyFinder'));
   const GitHistory = lazy(() => import('./GitHistory'));
   ```

2. **Virtual Scrolling**

   - File lists > 100 items
   - Search results
   - Git history

3. **Web Workers**
   - Markdown rendering
   - Diff computation
   - Search indexing

### API Optimizations

1. **Request Batching**

   ```typescript
   // Batch multiple file reads
   GET /api/github/repos/:owner/:repo/contents?paths=file1,file2,file3
   ```

2. **Caching Strategy**

   - Repository structure: 5 minutes
   - File content: Until modified
   - User data: Session lifetime

3. **Compression**
   - Gzip all responses
   - Brotli for static assets

## Error Handling

### Error Categories

1. **Network Errors**

   - Retry with exponential backoff
   - Queue for offline sync
   - User notification

2. **Auth Errors**

   - Automatic token refresh
   - Re-authentication prompt
   - Session cleanup

3. **Data Errors**
   - Validation at boundaries
   - Graceful degradation
   - Error reporting

### Error Flow

```typescript
try {
  await saveFile(content);
} catch (error) {
  if (isNetworkError(error)) {
    await queueForSync(content);
    showToast('Saved locally, will sync when online');
  } else if (isAuthError(error)) {
    await refreshAuth();
    retry();
  } else {
    logError(error);
    showError('Failed to save. Please try again.');
  }
}
```

## Testing Architecture

### Test Pyramid

```
         E2E Tests (10%)
        /            \
    Integration (30%)
   /                  \
Unit Tests (60%)
```

### Test Infrastructure

1. **Unit Tests**: Vitest

   - Component logic
   - Utilities
   - State management

2. **Integration Tests**: Vitest + MSW

   - API interactions
   - Component integration
   - Auth flows

3. **E2E Tests**: Playwright
   - Critical user paths
   - Cross-browser testing
   - Performance validation

## Deployment Architecture

### Infrastructure

```yaml
Production:
  Frontend:
    Provider: Vercel
    Regions: Global Edge Network
    Cache: Aggressive (1 year for assets)

  Auth Proxy:
    Provider: Railway
    Instances: 2-5 (auto-scale)
    Memory: 512MB per instance

  Monitoring:
    Errors: Sentry
    Analytics: Plausible (privacy-focused)
    Uptime: BetterStack
```

### CI/CD Pipeline

```
1. Push to main
2. Run tests (parallel)
   - Unit tests
   - Integration tests
   - Type checking
   - Linting
3. Build artifacts
4. Deploy to staging
5. Run E2E tests
6. Deploy to production
7. Run smoke tests
8. Monitor error rates
```

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: CDN handles scaling automatically
- **Auth Proxy**: Auto-scale based on CPU/memory
- **Sessions**: Redis for shared session store

### Performance Targets

- Initial load: < 2s on 3G
- Time to interactive: < 3s
- Fuzzy search: < 50ms for 1000 files
- API response: < 200ms p95

### Growth Handling

1. **10x Users**: Current architecture handles
2. **100x Users**: Add caching layer (Cloudflare)
3. **1000x Users**: Consider edge functions

## Future Architecture Considerations

### Potential Enhancements

1. **Real-time Collaboration**

   - WebRTC for peer-to-peer
   - CRDT for conflict resolution

2. **Plugin System**

   - Sandboxed iframe execution
   - Well-defined API surface

3. **Mobile Support**
   - React Native wrapper
   - Touch-optimized UI

### Technical Debt Management

1. **Regular Refactoring**

   - Monthly debt review
   - 20% time for improvements

2. **Dependency Updates**

   - Automated PRs (Renovate)
   - Security scanning

3. **Performance Budget**
   - Bundle size limits
   - Lighthouse CI checks
