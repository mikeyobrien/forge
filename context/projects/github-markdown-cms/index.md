---
title: GitHub Markdown CMS Project
category: projects
status: active
created: 2025-06-14T18:02:05.037Z
modified: 2025-06-14T18:02:05.037Z
tags:
  - cms
  - github
  - markdown
  - web-application
---

# GitHub Markdown CMS Project

## Overview

A progressive web application that provides a fast, keyboard-centric interface for managing GitHub-hosted blogs, with smart defaults for beginners and power features for advanced users.

## Project Status

- Status: Planning Complete (v2)
- Created: 2025-06-14
- Type: Progressive Web Application / CMS

## Key Documents

### Current Specifications (v2)

- [[spec-github-markdown-cms-v2]] - Revised specification (CURRENT)
- [[design-technical-architecture-v2]] - Next.js architecture & design
- [[plan-implementation-roadmap-v2]] - 8-week implementation roadmap
- [[todo-implementation-v2]] - Comprehensive task breakdown

### Analysis & Reviews

- [[report-design-review]] - Critical design analysis that led to v2

### Archived Documents (v1)

- `archive/spec-github-markdown-cms-v1.md` - Original specification
- `archive/plan-implementation-roadmap-v1.md` - Original roadmap
- `archive/todo-implementation-v1.md` - Original tasks
- `archive/design-technical-architecture-v1.md` - Original architecture

## Major Revisions (v2)

### Addressed Critical Gaps

1. **Mobile-First Design** - Full touch support and responsive UI
2. **Media Management** - Image paste, drag-drop, optimization
3. **Progressive Enhancement** - Works for beginners to vim experts
4. **Demo Mode** - Try without authentication
5. **Offline-First** - Complete functionality without connection

### Key Architecture Changes

- Next.js 14 with App Router (better DX, hiring)
- Edge functions instead of proxy (simpler ops)
- Lexical editor (superior mobile support)
- Progressive vim mode (optional, not required)
- Service Worker with Workbox (true offline)

## Project Goals

- Create the best mobile GitHub Pages editor
- Progressive interface that grows with user skill
- Zero setup with demo mode
- Never lose work with offline-first design
- Support real blogging needs (images, drafts, search)

## Technology Stack (v2)

- **Framework**: Next.js 14 with App Router
- **Editor**: Lexical (Meta's framework)
- **State**: Zustand + TanStack Query
- **Auth**: NextAuth.js (Auth.js)
- **Storage**: IndexedDB via Dexie
- **Styling**: Tailwind CSS + Radix UI
- **PWA**: Service Worker with Workbox
- **Testing**: Vitest + Playwright

## Key Features

- Progressive vim mode (off → basic → advanced)
- Touch-first mobile interface with gestures
- Smart media handling with optimization
- Offline sync queue with conflict resolution
- Multi-repository support
- Branch and PR workflows
- Demo mode for instant trial
- Three-way merge conflict UI

## Implementation Phases (v2)

1. **Foundation** (Week 1-2): Demo mode, Lexical editor, project setup
2. **GitHub & Mobile** (Week 3-4): Auth, repos, mobile UI
3. **Media & Offline** (Week 5-6): Images, service worker, vim
4. **Advanced & Polish** (Week 7-8): Conflicts, PWA, performance

## Success Metrics

- 100 demo users in week 1
- 10% conversion to authenticated
- 50% mobile usage
- <2s load time on 3G
- Lighthouse score >95
- 90% test coverage

## Competitive Advantages

- Only CMS with progressive vim support
- Best-in-class mobile GitHub editing
- True offline-first architecture
- Zero-setup demo mode
- Smart conflict resolution

## Next Steps

1. ✅ Review and approve v2 specification
2. ✅ Create technical architecture v2
3. ✅ Develop implementation roadmap v2
4. ✅ Build comprehensive task list v2
5. Set up GitHub repository
6. Initialize Next.js project
7. Begin Phase 1 implementation

## Team

- Sir Aldric (Percival) - Development Lead

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Lexical Editor](https://lexical.dev/)
- [Auth.js](https://authjs.dev/)
- [Workbox](https://developer.chrome.com/docs/workbox/)

## Preserved Links

- [[spec-github-markdown-cms]]
- [[design-technical-architecture]]
- [[plan-implementation-roadmap]]
- [[todo-implementation]]
