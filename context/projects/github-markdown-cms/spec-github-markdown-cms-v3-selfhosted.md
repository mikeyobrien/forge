---
title: GitHub Markdown CMS Specification v3 - Self-Hosted
category: projects
status: active
created: 2025-06-14T20:15:00.000Z
modified: 2025-06-14T20:15:00.000Z
tags:
  - cms
  - github
  - markdown
  - specification
  - self-hosted
  - kubernetes
  - v3
---

# GitHub Markdown CMS Specification v3 - Self-Hosted

## Executive Summary

### Problem Statement

Technical bloggers using GitHub Pages need an efficient way to manage their content without leaving their keyboard-driven workflow. Current solutions either require too much context switching (GitHub.com), lack version control (traditional CMS), depend on expensive SaaS providers, or have too much overhead (local development).

### Proposed Solution

A fully self-hosted progressive web application that provides a fast, keyboard-centric interface for managing GitHub-hosted blogs. The CMS is designed for easy deployment via Docker and Kubernetes, with zero external dependencies beyond GitHub's API. It adapts to the user's skill level while maintaining excellent mobile support and essential blogging features.

### Key Benefits

- **Zero SaaS Dependencies**: Completely self-hosted, no vendor lock-in
- **Easy Deployment**: One-command setup via Docker or Helm
- **Progressive Enhancement**: Works for beginners, scales to power users
- **Mobile-First Responsive**: Full functionality on all devices
- **Media-Aware**: Native support for images and assets
- **Offline-First**: Never lose work, sync when ready
- **Zero Setup Option**: Try before you authenticate

## Requirements

### Functional Requirements

#### Self-Hosting Infrastructure

- **Container-Based Deployment**

  - Docker image with all dependencies included
  - Kubernetes-ready with Helm charts
  - Support for docker-compose local deployment
  - Built-in health checks and monitoring endpoints

- **Configuration Management**
  - Environment-based configuration
  - Support for ConfigMaps and Secrets
  - Runtime configuration updates
  - Multi-instance deployment support

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
  - Client-side optimization (resize, compress)
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
  - Client-side full-text search
- **Smart Organization**
  - Sort by date, title, or custom
  - Filter by tags, draft status
  - Bulk operations support

#### GitHub Integration

- **Authentication Options**
  - Direct GitHub OAuth (self-hosted flow)
  - Personal Access Token (simple option)
  - Demo mode (no auth required)
- **Repository Management**
  - Multi-repo support
  - Branch selection
  - Create branches for drafts
  - Pull request creation via GitHub API
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
  - Local notifications for sync status

### Non-Functional Requirements

#### Deployment

- **Container Requirements**
  - Single container image <100MB
  - Stateless application design
  - Horizontal scaling support
  - Resource limits: 256MB RAM, 0.5 CPU
- **Kubernetes Support**
  - Helm chart with sensible defaults
  - Support for Ingress controllers
  - ConfigMap for runtime config
  - Optional persistent volume for cache

#### Performance

- **Targets by Deployment**
  - Self-hosted: <50ms response for all actions
  - Mobile: <100ms response on 4G
  - Offline: Instant for cached content
- **Scalability**
  - Handle 10,000+ posts per user
  - Support 100+ concurrent users per instance
  - Horizontal scaling via Kubernetes
  - Client-side processing for heavy operations

#### Security

- **Defense in Depth**
  - CSP headers enforced by application
  - Sandboxed preview iframe
  - Encrypted token storage (client-side)
  - No server-side token storage
- **Privacy First**
  - No telemetry or analytics
  - All data stays in user's browser/GitHub
  - No cookies beyond session
  - GDPR compliant by design

### Acceptance Criteria

- [ ] Deploy with single docker/helm command
- [ ] New user can start editing in <30 seconds
- [ ] Power user can access all features via keyboard
- [ ] Mobile user can create and publish posts
- [ ] Works offline with full functionality
- [ ] Handles 1000+ posts without degradation
- [ ] Zero data loss in all scenarios
- [ ] No external service dependencies

## Technical Considerations

### Self-Hosted Architecture

```
┌─────────────────────────────────────────────────┐
│                   User Devices                   │
├─────────────────────────────────────────────────┤
│  Desktop Browser    Mobile Browser    PWA App   │
└─────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────┐
│              Self-Hosted Instance               │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐            │
│  │   Fastify   │  │   SQLite3   │            │
│  │  (Server)   │  │   (Cache)   │            │
│  └─────────────┘  └──────────────┘            │
│                                                 │
│  ┌─────────────────────────────────┐           │
│  │        Docker Container         │           │
│  │  - Fastify + Helmet security   │           │
│  │  - Oslo OAuth implementation   │           │
│  │  - Pino structured logging     │           │
│  │  - UnoCSS + Marked frontend    │           │
│  └─────────────────────────────────┘           │
└─────────────────────────────────────────────────┘
                          │
                          │ HTTPS (Direct)
                          ▼
                ┌─────────────────┐
                │   GitHub API    │
                └─────────────────┘
```

### Technology Choices

- **Frontend**:
  - **Core**: Vanilla JS + Web Components
  - **Markdown**: [Marked](https://marked.js.org/) - Fast, lightweight markdown parser
  - **Styling**: [UnoCSS](https://unocss.dev/) - Atomic CSS engine for minimal bundle size
  - **State**: LocalStorage + IndexedDB
  - **Build**: [Esbuild](https://esbuild.github.io/) - Extremely fast bundler and minifier
- **Backend**:
  - **Framework**: [Fastify](https://www.fastify.io/) - Fast, low-overhead web framework
  - **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - For optional caching layer
  - **Security**: [Helmet](https://helmetjs.github.io/) - Security headers middleware
  - **Logging**: [Pino](https://getpino.io/) - Fast, low-overhead logger
  - **OAuth**: [Oslo](https://oslo.js.org/) - Modern auth utilities for GitHub OAuth
  - **Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Development**:
  - **Linting**: [Biome](https://biomejs.dev/) - Fast formatter and linter
  - **Testing**: [Vitest](https://vitest.dev/) - Fast unit test framework
  - **Language**: TypeScript for type safety
- **Deployment**: Docker + Kubernetes
  - Single container image
  - Helm charts for K8s
  - Docker Compose for simple deploys

### Deployment Strategy

```yaml
# docker-compose.yml
version: '3.8'
services:
  github-cms:
    image: github-markdown-cms:latest
    ports:
      - '3000:3000'
    environment:
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - BASE_URL=${BASE_URL:-http://localhost:3000}
    volumes:
      - ./config:/app/config:ro
    restart: unless-stopped
```

```yaml
# values.yaml (Helm)
replicaCount: 2

image:
  repository: github-markdown-cms
  tag: 'latest'
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: cms.example.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## Feature Specifications

### Demo Mode

**Zero-Friction Trial**

- Landing page with embedded editor
- Pre-loaded sample content
- All features work locally
- Browser storage only
- "Sign in to sync with GitHub" prompt

### Progressive Vim Mode

```typescript
// Skill level detection - all client-side
enum VimLevel {
  Off = 'off',
  Basic = 'basic',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

const vimLevelDescriptions: Record<VimLevel, string> = {
  [VimLevel.Off]: 'No vim bindings',
  [VimLevel.Basic]: 'Common commands (:w, :q, hjkl)',
  [VimLevel.Intermediate]: '+ visual mode, searching',
  [VimLevel.Advanced]: '+ macros, registers, ex commands',
};

// Store preference locally with type safety
export function setVimLevel(level: VimLevel): void {
  localStorage.setItem('vim-level', level);
}
```

### GitHub OAuth (Self-Hosted)

```typescript
// Server-side OAuth using Oslo and Fastify
import { GitHub } from '@oslo/oauth2';
import { z } from 'zod';

// Validation schemas
const AuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// OAuth setup with Oslo
export function setupOAuth(fastify: FastifyInstance) {
  const github = new GitHub(process.env.GITHUB_CLIENT_ID!, process.env.GITHUB_CLIENT_SECRET!);

  // Initiate OAuth flow
  fastify.get('/api/auth/login', async (request, reply) => {
    const state = generateState();
    const url = await github.createAuthorizationURL(state, {
      scopes: ['repo', 'user'],
    });

    // Store state in secure session
    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    return reply.redirect(url.toString());
  });

  // Handle OAuth callback
  fastify.post('/api/auth/callback', async (request, reply) => {
    const { code, state } = AuthCallbackSchema.parse(request.body);
    const storedState = request.cookies.oauth_state;

    if (!storedState || storedState !== state) {
      throw new Error('Invalid state');
    }

    const tokens = await github.validateAuthorizationCode(code);

    // Return token to client (encrypted in production)
    return { access_token: tokens.accessToken };
  });
}
```

### Offline Sync Architecture

```typescript
import { z } from 'zod';

// Operation schema validation
const SyncOperationSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['create', 'update', 'delete']),
  path: z.string(),
  content: z.string().optional(),
  timestamp: z.number(),
});

type SyncOperation = z.infer<typeof SyncOperationSchema>;

// Browser-based sync queue with IndexedDB
export class OfflineSync {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    const request = indexedDB.open('GitHubCMS', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('queue')) {
        const queue = db.createObjectStore('queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queue.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains('cache')) {
        const cache = db.createObjectStore('cache', { keyPath: 'path' });
        cache.createIndex('modified', 'modified');
      }
    };

    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async queueOperation(operation: Omit<SyncOperation, 'id'>): Promise<void> {
    const validated = SyncOperationSchema.parse({
      ...operation,
      timestamp: Date.now(),
    });

    const tx = this.db!.transaction(['queue'], 'readwrite');
    await tx.objectStore('queue').add(validated);

    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    const tx = this.db!.transaction(['queue'], 'readonly');
    const pending = await this.getAllFromStore<SyncOperation>(tx.objectStore('queue'));

    for (const op of pending) {
      try {
        await this.executeOperation(op);
        await this.removeFromQueue(op.id!);
      } catch (error: any) {
        if (error.status === 409) {
          await this.handleConflict(op);
        }
      }
    }
  }

  private async getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromQueue(id: string | number): Promise<void> {
    const tx = this.db!.transaction(['queue'], 'readwrite');
    await tx.objectStore('queue').delete(id);
  }

  private async executeOperation(op: SyncOperation): Promise<void> {
    // Implementation depends on GitHub API client
    throw new Error('Not implemented');
  }

  private async handleConflict(op: SyncOperation): Promise<void> {
    // Show conflict resolution UI
    throw new Error('Not implemented');
  }
}

// Server-side cache with better-sqlite3 (optional)
import Database from 'better-sqlite3';

export class ServerCache {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        path TEXT PRIMARY KEY,
        content TEXT,
        etag TEXT,
        modified INTEGER,
        created INTEGER DEFAULT (unixepoch())
      );
      
      CREATE INDEX IF NOT EXISTS idx_modified ON cache(modified);
    `);
  }

  get(path: string): any {
    const stmt = this.db.prepare('SELECT * FROM cache WHERE path = ?');
    return stmt.get(path);
  }

  set(path: string, content: string, etag: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache (path, content, etag, modified)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(path, content, etag, Date.now());
  }

  clear(): void {
    this.db.exec('DELETE FROM cache');
  }
}
```

## Implementation Priorities

### Phase 1: Core Foundation (Week 1-2)

1. Docker setup with multi-stage build
2. Basic HTML/CSS/JS structure
3. GitHub OAuth implementation
4. Simple file navigation
5. Mobile responsive layout
6. Demo mode with local storage

### Phase 2: Essential Features (Week 3-4)

1. Markdown editor implementation
2. Service worker for offline
3. Client-side search
4. Basic vim mode
5. GitHub API integration
6. Conflict detection

### Phase 3: Deployment & Scaling (Week 5-6)

1. Kubernetes manifests
2. Helm chart creation
3. Health check endpoints
4. Horizontal scaling tests
5. Load balancing setup
6. Backup strategies

### Phase 4: Power Features (Week 7-8)

1. Advanced vim mode
2. Multi-file operations
3. Git history viewer
4. Pull request creation
5. Media optimization
6. Bulk operations

## Success Metrics

### Deployment

- Single command deployment time <5 minutes
- Docker image size <100MB
- Helm chart works on major K8s providers
- Zero configuration for basic usage

### Performance

- Lighthouse score >95
- First paint <1s on 3G
- Offline mode fully functional
- 100 concurrent users per instance

### Adoption

- 1000 GitHub stars in 3 months
- 50+ self-hosted instances
- Active community contributions
- Multiple language translations

## Conclusion

This specification provides a truly self-hosted GitHub Markdown CMS that aligns with the philosophy of user ownership and control. By eliminating all SaaS dependencies and providing simple deployment options, we enable users to run their own instances while maintaining all the powerful features of the original vision.

The key differentiator is that users own their infrastructure, their data, and their deployment - with no vendor lock-in or ongoing service costs beyond their own hosting.
