---
title: GitHub Markdown CMS Specification v2 - Revised
category: projects
status: active
created: 2025-06-14T19:09:12.804Z
modified: 2025-06-14T19:09:12.804Z
tags:
  - cms
  - github
  - markdown
  - specification
  - revised
  - v2
---

---

title: GitHub Markdown CMS Specification v2 - Revised
category: projects
created: 2025-06-14
modified: 2025-06-14
tags: [cms, github, markdown, web-application, vim, github-pages, revised]
command_type: spec
project: github-markdown-cms
status: active
generated_by: /spec
related_docs:

- projects/github-markdown-cms/spec-github-markdown-cms.md
- projects/github-markdown-cms/report-design-review.md
- projects/github-markdown-cms/index.md
  context_source:
- projects/github-markdown-cms/report-design-review.md

---

# GitHub Markdown CMS Specification v2 - Revised

## Executive Summary

### Problem Statement

Technical bloggers using GitHub Pages need an efficient way to manage their content without leaving their keyboard-driven workflow. Current solutions either require too much context switching (GitHub.com), lack version control (traditional CMS), or have too much overhead (local development).

### Proposed Solution

A progressive web application that provides a fast, keyboard-centric interface for managing GitHub-hosted blogs, with smart defaults for beginners and power features for advanced users. The CMS adapts to the user's skill level while maintaining excellent mobile support and essential blogging features.

### Key Benefits

- **Progressive Enhancement**: Works for beginners, scales to power users
- **Mobile-First Responsive**: Full functionality on all devices
- **Media-Aware**: Native support for images and assets
- **Offline-First**: Never lose work, sync when ready
- **Zero Setup Option**: Try before you authenticate

## Requirements

### Functional Requirements

#### Core Editor

- **Progressive Keyboard Support**
  - Basic: Standard shortcuts (Ctrl+S, Ctrl+Z)
  - Advanced: Vim mode (optional, can be enabled)
  - Mobile: Touch-optimized toolbar
- **Rich Markdown Editing**
  - Syntax highlighting
  - Live preview (side-by-side or toggle)
  - Markdown shortcuts toolbar
  - Image paste from clipboard
  - Drag-and-drop file support

#### Media Management

- **Image Handling**
  - Paste from clipboard
  - Drag-and-drop upload
  - Automatic optimization (resize, compress)
  - Storage options (same repo, media branch, GitHub LFS)
  - Image gallery view
- **Asset Organization**
  - Configurable media directory
  - Automatic file naming
  - Usage tracking (which posts use which images)

#### File Navigation

- **Multi-Modal Search**
  - Command palette (Cmd+K)
  - File tree sidebar (collapsible)
  - Recent files quick access
  - Full-text search across posts
- **Smart Organization**
  - Sort by date, title, or custom
  - Filter by tags, draft status
  - Bulk operations support

#### GitHub Integration

- **Authentication Options**
  - OAuth (recommended)
  - Personal Access Token (fallback)
  - Demo mode (no auth required)
- **Repository Management**
  - Multi-repo support
  - Branch selection
  - Create branches for drafts
  - Pull request creation
- **Smart Sync**
  - Detect external changes
  - Three-way merge UI
  - Conflict resolution wizard
  - Background sync queue

#### Mobile Experience

- **Touch-First Interface**
  - Swipe gestures for navigation
  - Touch-friendly button sizes
  - Responsive layout breakpoints
  - Mobile-specific shortcuts menu
- **Progressive Web App**
  - Install to home screen
  - Work offline
  - Push notifications for sync status

### Non-Functional Requirements

#### Performance

- **Targets by Device**
  - Desktop: <50ms response for all actions
  - Mobile: <100ms response on 4G
  - Offline: Instant for cached content
- **Scalability**
  - Handle 10,000+ posts
  - Paginated file loading
  - Virtual scrolling for lists
  - Incremental search indexing

#### Security

- **Defense in Depth**
  - CSP headers for all content
  - Sandboxed preview iframe
  - Encrypted token storage
  - Optional 2FA support
- **Privacy First**
  - Local-only analytics
  - No tracking without consent
  - Data export capability
  - GDPR compliant

### Acceptance Criteria

- [ ] New user can start editing in <30 seconds
- [ ] Power user can access all features via keyboard
- [ ] Mobile user can create and publish posts
- [ ] Works offline with full functionality
- [ ] Handles 1000+ posts without degradation
- [ ] Zero data loss in all scenarios

## Technical Considerations

### Progressive Architecture

```
┌─────────────────────────────────────────────────┐
│                   User Devices                   │
├─────────────────────────────────────────────────┤
│  Desktop Browser    Mobile Browser    PWA App   │
└─────────────────────────────────────────────────┘
                          │
                  ┌───────┴────────┐
                  │                │
            ┌─────▼──────┐  ┌─────▼──────┐
            │  Demo Mode │  │ Auth Mode  │
            │  (Local)   │  │ (GitHub)   │
            └────────────┘  └─────┬──────┘
                                  │
                          ┌───────▼────────┐
                          │  Edge Function │
                          │  (Serverless)  │
                          └───────┬────────┘
                                  │
                          ┌───────▼────────┐
                          │   GitHub API   │
                          └────────────────┘
```

### Technology Choices

- **Framework**: Next.js 14 (App Router)
  - Server components for performance
  - Edge runtime for auth
  - Built-in image optimization
- **Editor**: Lexical (Meta's editor framework)
  - Better mobile support than CodeMirror
  - Extensible plugin system
  - Smaller bundle size
- **State**: Zustand + React Query
  - Simple state management
  - Intelligent cache invalidation
  - Optimistic updates
- **Database**: IndexedDB via Dexie
  - Better API than raw IndexedDB
  - Supports complex queries
  - Migration support
- **Styling**: Tailwind CSS
  - Rapid development
  - Mobile-first utilities
  - Dark mode built-in

### API Strategy

```typescript
// Smart API client with fallbacks
class GitHubClient {
  async getContent(path: string) {
    // Try cache first
    const cached = await cache.get(path);
    if (cached && !this.isStale(cached)) return cached;

    // Check if we're near rate limit
    if (this.nearRateLimit()) {
      return this.useGraphQL(path); // More efficient
    }

    // Standard REST API
    return this.useREST(path);
  }
}
```

## Feature Specifications

### Demo Mode

**Zero-Friction Trial**

- Landing page with embedded editor
- Pre-loaded sample content
- All features except publish
- Local storage only
- "Sign in to save" prompt

### Progressive Vim Mode

```javascript
// Skill level detection
const vimLevels = {
  off: No vim bindings,
  basic: Common commands (:w, :q, hjkl),
  intermediate: + visual mode, searching,
  advanced: + macros, registers, ex commands
};

// Gradually introduce features
if (userTypedVimCommand && vimMode === 'off') {
  showToast('Enable Vim mode? You seem to know Vim!');
}
```

### Smart Media Handling

```typescript
interface MediaStrategy {
  // Auto-detect best approach
  async store(file: File): Promise<string> {
    if (file.size > 10MB) {
      return this.useLFS(file);
    }
    if (repo.hasMediaBranch()) {
      return this.useMediaBranch(file);
    }
    return this.useAssetsFolder(file);
  }

  // Optimize before storage
  async optimize(file: File): Promise<File> {
    if (isImage(file)) {
      return this.resizeAndCompress(file);
    }
    return file;
  }
}
```

### Conflict Resolution UI

```typescript
// Three-panel merge interface
interface ConflictResolver {
  local: string; // Your version
  remote: string; // GitHub version
  base: string; // Common ancestor

  // Smart resolution options
  suggestions: [
    'Take all local changes',
    'Take all remote changes',
    'Merge line by line',
    'Create new branch',
  ];
}
```

### Mobile Adaptations

- **Gesture Support**

  - Swipe right: File navigator
  - Swipe left: Preview
  - Pinch: Zoom preview
  - Long press: Context menu

- **Smart Keyboard**
  - Markdown shortcuts above keyboard
  - Common symbols (`, \*, \_, [, ])
  - Tab key for indentation
  - Smart quotes and brackets

### Offline Sync Queue

```typescript
interface SyncQueue {
  // Persistent queue with retry
  async addOperation(op: Operation) {
    await queue.add(op);
    if (online) {
      this.processQueue();
    } else {
      this.scheduleForLater();
    }
  }

  // Intelligent conflict detection
  async processQueue() {
    const ops = await queue.getAll();
    const conflicts = this.detectConflicts(ops);

    if (conflicts.length) {
      this.showConflictUI(conflicts);
    } else {
      this.executeBatch(ops);
    }
  }
}
```

## Implementation Priorities

### Phase 1: Core Foundation (Week 1-2)

1. Next.js setup with TypeScript
2. Basic editor with markdown preview
3. GitHub auth (OAuth + PAT)
4. Simple file navigation
5. Mobile responsive layout
6. Demo mode

### Phase 2: Essential Features (Week 3-4)

1. Image paste and upload
2. Offline support with service worker
3. Search functionality
4. Vim mode (basic level)
5. Branch support
6. Conflict detection

### Phase 3: Power Features (Week 5-6)

1. Advanced vim mode
2. Multi-file operations
3. Git history viewer
4. Pull request creation
5. Media gallery
6. Bulk operations

### Phase 4: Polish & Scale (Week 7-8)

1. Performance optimization
2. PWA features
3. Advanced search
4. Plugin system
5. Analytics dashboard
6. Export tools

## Success Metrics

### User Acquisition

- 100 demo mode users in week 1
- 10% conversion to authenticated
- 50% mobile usage

### Performance

- Lighthouse score >95
- Core Web Vitals all green
- <2s load time on 3G

### Engagement

- 80% weekly active users
- Average session >10 minutes
- <1% data loss reports

### Technical

- 90% test coverage
- <0.1% error rate
- 99.9% uptime

## Migration Path

### From v1 Spec

1. Keep vim-first philosophy
2. Add progressive enhancement
3. Expand to mobile users
4. Simplify deployment
5. Address all critical gaps

### For Existing Users

- GitHub.com users: Import settings
- VS Code users: Familiar shortcuts
- Obsidian users: Similar features
- New users: Gentle onboarding

## Competitive Advantages

1. **Only CMS with Progressive Vim** - Grows with user skill
2. **True Offline-First** - Not just cache, full functionality
3. **Mobile GitHub Editing** - First-class mobile experience
4. **Zero Setup Demo** - Try before you commit
5. **Smart Conflict Resolution** - Better than Git CLI

## Risks & Mitigation

### Technical Risks

- **API Limits**: GraphQL fallback, intelligent caching
- **Browser Storage**: Quota monitoring, cleanup strategies
- **Performance**: Progressive loading, code splitting

### User Risks

- **Learning Curve**: Progressive disclosure, interactive tutorials
- **Data Loss**: Multiple backup strategies, sync status
- **Feature Creep**: Plugin system for advanced features

### Business Risks

- **Competition**: Focus on unique vim+mobile combo
- **Adoption**: Demo mode for easy trial
- **Maintenance**: Open source community

## Conclusion

This revised specification addresses all critical gaps while maintaining the core vision of a keyboard-driven CMS. By adding progressive enhancement, mobile support, and essential blogging features like media management, we create a tool that serves both beginners and power users effectively.

The key insight is that vim support should be a progressive feature, not a barrier to entry. Combined with a true offline-first architecture and smart conflict resolution, this creates a unique product that fills a real gap in the market.
