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

A fully self-hosted progressive web application that provides a fast, keyboard-centric interface for managing GitHub-hosted blogs. Designed for easy deployment via Docker and Kubernetes with zero external dependencies.

## Project Status

- Status: Planning Complete (v3 - Self-Hosted)
- Created: 2025-06-14
- Type: Self-Hosted Progressive Web Application / CMS

## Key Documents

### Current Specifications (v3 - Self-Hosted)

- [[spec-github-markdown-cms-v3-selfhosted]] - Self-hosted specification (CURRENT)
- [[plan-implementation-roadmap-v3-selfhosted]] - Container & K8s focused roadmap
- [[todo-implementation-v3-selfhosted]] - Comprehensive task breakdown

### Analysis & Reviews

- [[report-design-review]] - Critical design analysis that led to v2

### Archived Documents

#### v2 (SaaS-dependent)

- `spec-github-markdown-cms-v2.md` - Edge functions & SaaS specification
- `design-technical-architecture-v2.md` - Next.js/Vercel architecture
- `plan-implementation-roadmap-v2.md` - SaaS-focused roadmap
- `todo-implementation-v2.md` - v2 tasks

#### v1 (Original)

- `archive/spec-github-markdown-cms-v1.md` - Original specification
- `archive/plan-implementation-roadmap-v1.md` - Original roadmap
- `archive/todo-implementation-v1.md` - Original tasks
- `archive/design-technical-architecture-v1.md` - Original architecture

## Major Revisions (v3)

### Self-Hosting Philosophy

1. **Zero External Dependencies** - No SaaS, no vendor lock-in
2. **Container-First** - Docker image <100MB
3. **Kubernetes-Native** - Helm charts for easy deployment
4. **User Data Sovereignty** - All data stays with the user
5. **Simple Deployment** - One command to run

### Key Architecture Changes

- Vanilla JS + Web Components (no framework dependencies)
- Minimal Node.js server (no edge functions)
- Direct GitHub OAuth (no Auth.js)
- Pure CSS (no Tailwind)
- Native browser APIs (minimal libraries)

## Project Goals

- Create the best self-hosted GitHub Pages editor
- Progressive interface that grows with user skill
- Single command deployment via Docker/Helm
- Never lose work with offline-first design
- Support real blogging needs (images, drafts, search)
- Zero external service dependencies

## Technology Stack (v3)

- **Frontend**: Vanilla JS + Web Components
- **Editor**: Custom ContentEditable implementation
- **State**: Browser APIs (LocalStorage + IndexedDB)
- **Server**: Minimal Node.js (no frameworks)
- **Styling**: Pure CSS with CSS Variables
- **PWA**: Service Worker (hand-rolled)
- **Container**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Helm 3

## Key Features

- Progressive vim mode (off → basic → advanced)
- Touch-first mobile interface with gestures
- Client-side media optimization
- Offline sync queue with conflict resolution
- Multi-repository support
- Branch and PR workflows
- Demo mode for instant trial
- Three-way merge conflict UI
- One-command deployment

## Implementation Phases (v3)

1. **Container Foundation** (Week 1-2): Docker setup, basic UI, OAuth
2. **Kubernetes Deployment** (Week 3-4): Helm charts, GitHub integration
3. **Progressive Enhancement** (Week 5-6): Vim mode, search, mobile
4. **Production Hardening** (Week 7-8): Security, docs, launch

## Success Metrics

- Docker image <50MB
- Helm install <1 minute
- Support 100+ concurrent users
- Works on Raspberry Pi
- 100 self-hosted deployments
- 1000 GitHub stars

## Competitive Advantages

- Only CMS with progressive vim support
- Truly self-hosted (no SaaS dependencies)
- Kubernetes-native design
- Minimal resource requirements
- User owns all data and infrastructure

## Next Steps

1. ✅ Create v3 self-hosted specification
2. ✅ Develop Kubernetes-focused roadmap
3. ✅ Build comprehensive task list for v3
4. Create GitHub repository
5. Setup Docker build pipeline
6. Develop base Helm chart
7. Begin Phase 1 implementation

## Team

- Sir Aldric (Percival) - Development Lead

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

## Preserved Links

- [[spec-github-markdown-cms]]
- [[design-technical-architecture]]
- [[plan-implementation-roadmap]]
- [[todo-implementation]]
