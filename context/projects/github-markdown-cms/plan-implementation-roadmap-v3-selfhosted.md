---
title: GitHub Markdown CMS Implementation Roadmap v3 - Self-Hosted
category: projects
status: active
created: 2025-06-14T20:20:00.000Z
modified: 2025-06-14T20:20:00.000Z
tags:
  - implementation
  - roadmap
  - planning
  - self-hosted
  - kubernetes
  - docker
  - v3
---

# GitHub Markdown CMS Implementation Roadmap v3 - Self-Hosted

## Executive Summary

This roadmap provides a detailed implementation plan for the GitHub Markdown CMS v3, focusing on self-hosted deployment, zero external dependencies, and Kubernetes-native architecture. The plan emphasizes simplicity, portability, and user control.

## Implementation Strategy

### Core Principles

1. **Zero External Dependencies**: No SaaS, no third-party services
2. **Container-First Development**: Everything runs in Docker
3. **Kubernetes-Native**: Designed for K8s from day one
4. **Static-First Architecture**: Minimize server-side logic
5. **User Data Sovereignty**: All data stays with the user

### Technology Stack (Revised for Self-Hosting)

```yaml
Frontend:
  Core: TypeScript + Web Components
  Editor: Custom ContentEditable with Marked for parsing
  State: Browser APIs (LocalStorage + IndexedDB)
  Styling: UnoCSS for atomic CSS generation
  Build: Esbuild for ultra-fast bundling

Backend:
  Runtime: Node.js 20 LTS
  Framework: Fastify (high performance, low overhead)
  Database: better-sqlite3 (embedded cache)
  Security: Helmet.js for headers
  Logging: Pino for structured logs
  Auth: Oslo for OAuth flows
  Validation: Zod for runtime type safety

Infrastructure:
  Container: Docker with multi-stage builds
  Orchestration: Kubernetes 1.28+
  Package: Helm 3.0+
  Registry: Any OCI-compliant registry

Development:
  Language: TypeScript
  Testing: Vitest for fast unit tests
  Linting: Biome for formatting and linting
  CI/CD: GitHub Actions (self-hosted runners)
```

## Phase 1: Container Foundation (Week 1-2)

### Sprint 1.1: Docker Setup & Basic Structure

**Goal**: Create deployable container with minimal functionality

**Implementation Steps**:

```bash
# Project structure
github-markdown-cms/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── uno.config.ts
├── src/
│   ├── server/
│   │   ├── index.ts
│   │   ├── auth/
│   │   │   ├── github.ts (Oslo OAuth)
│   │   │   └── session.ts
│   │   ├── cache/
│   │   │   └── sqlite.ts (better-sqlite3)
│   │   ├── routes/
│   │   │   ├── api.ts
│   │   │   └── health.ts
│   │   └── plugins/
│   │       ├── helmet.ts
│   │       ├── logger.ts (Pino)
│   │       └── validation.ts (Zod)
│   ├── client/
│   │   ├── index.html
│   │   ├── app.ts
│   │   ├── components/
│   │   │   ├── editor.ts
│   │   │   └── navigation.ts
│   │   ├── lib/
│   │   │   ├── markdown.ts (Marked)
│   │   │   └── sync.ts
│   │   └── styles/
│   │       └── main.css (UnoCSS)
│   └── shared/
│       ├── types.ts
│       └── schemas.ts (Zod schemas)
├── helm/
│   └── github-cms/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── tests/
│   ├── unit/
│   └── e2e/
└── scripts/
    ├── build.sh
    └── test.sh
```

**Dockerfile (Multi-stage)**:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build with esbuild and UnoCSS
RUN npm run build

# Runtime stage
FROM node:20-alpine
RUN apk add --no-cache tini

WORKDIR /app

# Copy built files and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server/index.js"]
```

**Day 1-3: Server Foundation (Fastify)**

- Fastify server with static file serving
- Health/readiness endpoints with proper schemas
- Helmet.js security headers
- Pino structured logging
- Zod-validated environment configuration
- Graceful shutdown handling

**Day 4-5: Basic UI Structure**

- TypeScript Web Components architecture
- UnoCSS atomic styling with presets
- Responsive layout (mobile-first)
- CSS variables for theming
- Esbuild for fast development builds

**Day 6-7: GitHub OAuth Flow**

- Oslo OAuth2 implementation for GitHub
- Secure cookie-based session handling
- Zod-validated OAuth responses
- CORS configuration with Fastify
- Token encryption in browser storage

### Sprint 1.2: Demo Mode & Editor Core

**Goal**: Working editor with local storage

**Day 8-9: ContentEditable Editor**

- TypeScript markdown editor component
- Marked for real-time preview
- Syntax highlighting with Prism.js
- Keyboard shortcuts system
- Mobile touch support

**Day 10-11: Local Storage**

- IndexedDB wrapper for documents
- Auto-save functionality
- Demo content pre-loaded
- Import/export capability

**Day 12-14: Container Optimization**

- Minimize image size (<50MB goal) with esbuild
- Security scanning with Trivy
- Performance profiling with Pino metrics
- Biome for code quality checks
- Documentation generation

## Phase 2: Kubernetes Deployment (Week 3-4)

### Sprint 2.1: Helm Chart Development

**Goal**: Production-ready Kubernetes deployment

**Helm Chart Structure**:

```yaml
# Chart.yaml
apiVersion: v2
name: github-markdown-cms
description: Self-hosted GitHub Markdown CMS
type: application
version: 1.0.0
appVersion: '1.0.0'

# values.yaml
replicaCount: 1

image:
  repository: github-markdown-cms
  pullPolicy: IfNotPresent
  tag: ''

github:
  clientId: ''
  clientSecret: ''

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: ''
  annotations: {}
  hosts:
    - host: cms.local
      paths:
        - path: /
          pathType: Prefix

persistence:
  enabled: false
  size: 1Gi
  storageClass: ''

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

**Day 15-17: Kubernetes Manifests**

- Deployment with proper probes
- ConfigMap for runtime config
- Secret management
- Service and Ingress

**Day 18-19: Scaling & Reliability**

- Horizontal Pod Autoscaler
- Pod Disruption Budget
- Anti-affinity rules
- Resource quotas

**Day 20-21: Observability**

- Prometheus metrics endpoint (Fastify plugin)
- Pino structured logging with log levels
- Health dashboard with real-time metrics
- Grafana templates (optional)

### Sprint 2.2: GitHub Integration

**Goal**: Full GitHub API integration

**Day 22-23: API Client**

- TypeScript GitHub API client
- Rate limit handling with backoff
- Zod-validated API responses
- better-sqlite3 response caching

**Day 24-25: Repository Operations**

- List repos and files
- Read/write content
- Branch management
- Commit creation

**Day 26-28: Sync Engine**

- Offline queue implementation
- Conflict detection
- Three-way merge UI
- Background sync

## Phase 3: Progressive Enhancement (Week 5-6)

### Sprint 3.1: Advanced Editor Features

**Goal**: Power user features

**Day 29-31: Vim Mode**

- Progressive vim implementation
- Mode indicators
- Command palette
- Custom mappings

**Day 32-33: Search & Navigation**

- Client-side full-text search with Fuse.js
- Fuzzy file finder with scoring
- Command palette (Cmd+K)
- Tag filtering with UnoCSS badges

**Day 34-35: Media Handling**

- Drag-drop upload
- Clipboard paste
- Client-side image optimization
- Gallery view

### Sprint 3.2: Mobile Excellence

**Goal**: First-class mobile experience

**Day 36-37: Touch Optimization**

- Gesture support
- Touch-friendly UI
- Virtual keyboard handling
- Viewport management

**Day 38-39: PWA Features**

- Service worker
- Offline mode
- App manifest
- Install prompts

**Day 40-42: Performance**

- Esbuild code splitting
- Dynamic imports for lazy loading
- Resource hints with link preload
- Bundle optimization with tree-shaking

## Phase 4: Production Hardening (Week 7-8)

### Sprint 4.1: Security & Reliability

**Goal**: Production-ready security

**Day 43-45: Security Hardening**

- CSP headers via Helmet.js
- CORS policies in Fastify
- Zod input validation everywhere
- XSS prevention with DOMPurify

**Day 46-47: Backup & Recovery**

- Export functionality
- Backup strategies
- Disaster recovery docs
- Migration tools

**Day 48-49: Multi-tenancy**

- User isolation
- Resource limits
- Usage quotas
- Admin controls

### Sprint 4.2: Documentation & Launch

**Goal**: Ready for public release

**Day 50-52: Documentation**

- Installation guide
- Helm chart docs
- API documentation
- Troubleshooting guide

**Day 53-54: Testing**

- Vitest unit tests with coverage
- Load testing with autocannon
- Security scanning with npm audit
- Accessibility audit
- Browser compatibility

**Day 55-56: Launch Preparation**

- Demo instance
- GitHub repository setup
- CI/CD pipelines
- Community guidelines

## Deployment Scenarios

### Single User (Docker Compose)

```bash
# Simple deployment
docker-compose up -d

# With custom config
GITHUB_CLIENT_ID=xxx docker-compose up -d
```

### Small Team (Single Node K8s)

```bash
# Install with Helm
helm install cms ./helm/github-cms \
  --set github.clientId=$CLIENT_ID \
  --set github.clientSecret=$CLIENT_SECRET

# Expose via port-forward
kubectl port-forward svc/cms 8080:80
```

### Enterprise (Multi-node K8s)

```bash
# Production deployment
helm install cms ./helm/github-cms \
  -f values-production.yaml \
  --namespace cms \
  --create-namespace

# With monitoring
helm install cms ./helm/github-cms \
  --set metrics.enabled=true \
  --set metrics.serviceMonitor.enabled=true
```

## Success Criteria

### Technical Metrics

- Docker image <50MB
- Cold start <3 seconds
- Memory usage <256MB
- 100+ concurrent users

### Deployment Metrics

- Helm install <1 minute
- Zero-config demo mode
- Works on K3s/MicroK8s
- Runs on Raspberry Pi

### Community Metrics

- 100 deploys in first month
- 5+ community contributors
- Multiple cloud tutorials
- Kubernetes operator (stretch)

## Risk Mitigation

### Technical Risks

- **Browser Compatibility**: Test on all major browsers
- **Mobile Performance**: Optimize for low-end devices
- **Offline Complexity**: Extensive testing of sync scenarios

### Deployment Risks

- **K8s Complexity**: Provide simple alternatives
- **Configuration**: Sensible defaults, clear docs
- **Updates**: Rolling update strategy

### Adoption Risks

- **Learning Curve**: Video tutorials, examples
- **Migration Path**: Import tools from other CMSs
- **Support**: Community forum, chat channel

## Conclusion

This roadmap delivers a truly self-hosted GitHub CMS that respects user autonomy and data sovereignty. By focusing on containerization and Kubernetes-native design, we enable deployment anywhere from a Raspberry Pi to enterprise clusters, all without external dependencies.
