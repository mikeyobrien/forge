---
title: GitHub Markdown CMS Implementation Roadmap v2
category: projects
status: active
created: 2025-06-14T19:28:21.735Z
modified: 2025-06-14T19:28:21.735Z
tags:
  - implementation
  - roadmap
  - planning
  - tdd
  - nextjs
  - pwa
---

---

title: GitHub Markdown CMS Implementation Roadmap v2
category: projects
created: 2025-06-14
modified: 2025-06-14
tags: [cms, github, markdown, implementation, roadmap, nextjs, pwa]
command_type: plan
project: github-markdown-cms
status: active
generated_by: /plan
implements: projects/github-markdown-cms/spec-github-markdown-cms-v2.md
related_docs:

- projects/github-markdown-cms/spec-github-markdown-cms-v2.md
- projects/github-markdown-cms/report-design-review.md
- projects/github-markdown-cms/index.md
  context_source:
- projects/github-markdown-cms/spec-github-markdown-cms-v2.md

---

# GitHub Markdown CMS Implementation Roadmap v2

## Executive Summary

This roadmap provides a detailed implementation plan for the GitHub Markdown CMS v2, focusing on progressive enhancement, mobile-first design, and rapid user value delivery. The plan emphasizes Test-Driven Development (TDD) with a strong focus on user experience across all devices.

## Implementation Strategy

### Core Principles

1. **Mobile-First Development**: Every feature designed for touch first
2. **Progressive Enhancement**: Core features work everywhere, enhanced features detected
3. **Demo-First Approach**: Users can try before they authenticate
4. **Offline-First Architecture**: Local functionality with smart sync
5. **Incremental Delivery**: Ship value every sprint

### Technology Stack (Finalized)

```yaml
Frontend:
  Framework: Next.js 14.2+ (App Router)
  Editor: Lexical 0.12+
  State: Zustand 4.4+ & TanStack Query 5.0+
  Storage: Dexie.js 3.2+
  UI: Tailwind CSS 3.4+ & Radix UI

Backend:
  Runtime: Edge Functions (Vercel/Netlify)
  Auth: NextAuth.js 5.0 (Auth.js)
  API: GitHub REST & GraphQL via Octokit

Testing:
  Unit: Vitest 1.0+
  Integration: Testing Library
  E2E: Playwright 1.40+

Development:
  Language: TypeScript 5.3+
  Package Manager: pnpm 8.0+
  Bundler: Turbo (via Next.js)
```

## Phase 1: Foundation & Demo Mode (Week 1-2)

### Sprint 1.1: Project Setup & Core Infrastructure

**Goal**: Establish development environment and core architecture

**Implementation Steps**:

```bash
# 1. Initialize monorepo
pnpm create next-app@latest github-markdown-cms --typescript --tailwind --app
cd github-markdown-cms

# 2. Setup project structure
mkdir -p src/{components,features,lib,hooks,stores,types}
mkdir -p src/app/{(auth),api,demo}

# 3. Configure development tools
pnpm add -D @types/node vitest @vitejs/plugin-react
pnpm add -D prettier eslint-config-prettier husky lint-staged
```

**Core Files to Create**:

```typescript
// src/lib/config.ts
export const config = {
  app: {
    name: 'GitHub Markdown CMS',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    scope: 'repo,user',
  },
  editor: {
    defaultVimMode: 'off' as const,
    themes: ['rose-pine'] as const,
  },
};

// src/types/index.ts
export interface User {
  id: string;
  login: string;
  avatar: string;
  repos?: Repository[];
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
  private: boolean;
}

export interface Post {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  sha?: string;
  isDirty: boolean;
}
```

**Tests First**:

```typescript
// src/__tests__/setup.test.ts
describe('Application Setup', () => {
  test('loads configuration correctly');
  test('initializes in demo mode when configured');
  test('requires auth in production mode');
});
```

### Sprint 1.2: Demo Mode Implementation

**Goal**: Zero-friction first experience

**Key Components**:

```typescript
// src/app/demo/page.tsx
export default function DemoPage() {
  return (
    <DemoProvider>
      <Editor
        initialContent={DEMO_CONTENT}
        readOnly={false}
        showAuthPrompt={true}
      />
    </DemoProvider>
  );
}

// src/features/demo/DemoProvider.tsx
export function DemoProvider({ children }: Props) {
  // Mock GitHub-like API for demo
  const mockAPI = {
    getFiles: () => DEMO_FILES,
    saveFile: (content: string) => localStorage.setItem('demo', content),
    getFile: () => localStorage.getItem('demo'),
  };

  return (
    <GitHubContext.Provider value={mockAPI}>
      {children}
    </GitHubContext.Provider>
  );
}
```

**Success Criteria**:

- Landing page loads in <2s
- Demo editor functional without auth
- Mobile responsive layout works
- Basic markdown editing operational

### Sprint 1.3: Basic Editor with Lexical

**Goal**: Solid editing foundation

**Implementation**:

```typescript
// src/components/Editor/LexicalEditor.tsx
import { $getRoot, $createParagraphNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

export function LexicalEditor({
  initialContent,
  onChange,
  isMobile
}: Props) {
  const initialConfig = {
    namespace: 'GitHubCMS',
    theme: EditorTheme,
    onError: (error: Error) => console.error(error),
    nodes: [HeadingNode, CodeNode, LinkNode, ImageNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MarkdownShortcutPlugin />
        {isMobile && <MobileToolbar />}
      </div>
    </LexicalComposer>
  );
}
```

## Phase 2: GitHub Integration & Mobile (Week 3-4)

### Sprint 2.1: Authentication System

**Goal**: Secure GitHub authentication with edge functions

**Edge Function Implementation**:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export const { auth, handlers } = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'repo user',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});
```

**Personal Access Token Support**:

```typescript
// src/features/auth/PatAuthForm.tsx
export function PatAuthForm() {
  const [token, setToken] = useState('');

  const validateToken = async () => {
    const octokit = new Octokit({ auth: token });
    try {
      const { data } = await octokit.users.getAuthenticated();
      // Store encrypted token
      await secureStorage.setToken(token);
      router.push('/editor');
    } catch (error) {
      showError('Invalid token');
    }
  };
}
```

### Sprint 2.2: Repository Management

**Goal**: Browse and select repositories

**Implementation**:

```typescript
// src/features/repos/useRepositories.ts
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const octokit = await getOctokit();
      const { data } = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: 'updated',
      });

      // Filter for GitHub Pages repos
      return data.filter((repo) => repo.has_pages || repo.name.includes('.github.io'));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Sprint 2.3: Mobile-First UI

**Goal**: Touch-optimized interface

**Mobile Components**:

````typescript
// src/components/Mobile/MobileNav.tsx
export function MobileNav() {
  const { swipeHandlers } = useSwipeGesture({
    onSwipeRight: () => openFileDrawer(),
    onSwipeLeft: () => openPreview(),
  });

  return (
    <nav {...swipeHandlers} className="md:hidden">
      <MobileToolbar />
      <BottomSheet />
    </nav>
  );
}

// src/components/Mobile/TouchKeyboard.tsx
export function TouchKeyboard() {
  const shortcuts = ['#', '**', '_', '[]()', '```', '>', '-'];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2">
      {shortcuts.map(s => (
        <button
          key={s}
          onClick={() => insertText(s)}
          className="px-3 py-2 mr-2 bg-white rounded"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
````

## Phase 3: Media & Offline (Week 5-6)

### Sprint 3.1: Image Management System

**Goal**: Clipboard paste, drag-drop, optimization

**Image Upload Pipeline**:

```typescript
// src/features/media/ImageUploader.ts
export class ImageUploader {
  async handlePaste(e: ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        const optimized = await this.optimize(file);
        const url = await this.upload(optimized);
        return url;
      }
    }
  }

  async optimize(file: File): Promise<File> {
    // Resize if > 2048px
    // Compress if > 500KB
    // Convert to WebP if supported
    return optimizeImage(file, {
      maxWidth: 2048,
      maxSize: 500 * 1024,
      format: 'webp',
    });
  }

  async upload(file: File): Promise<string> {
    const strategy = this.selectStrategy(file);
    return strategy.upload(file);
  }
}
```

### Sprint 3.2: Offline-First Architecture

**Goal**: Complete offline functionality

**Service Worker Setup**:

```typescript
// src/service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// API caching strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/github'),
  new NetworkFirst({
    cacheName: 'github-api',
    networkTimeoutSeconds: 5,
  }),
);

// Offline queue for mutations
const queue = new Queue('github-sync', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});
```

### Sprint 3.3: Progressive Vim Mode

**Goal**: Adaptive vim experience

**Implementation**:

```typescript
// src/features/vim/ProgressiveVim.tsx
export function useProgressiveVim() {
  const [level, setLevel] = useState<VimLevel>('off');
  const [commands, setCommands] = useState<string[]>([]);

  // Track vim-like input
  useEffect(() => {
    if (level === 'off' && commands.includes(':w')) {
      showToast({
        title: 'Enable Vim Mode?',
        description: 'You seem familiar with Vim commands',
        action: () => setLevel('basic'),
      });
    }
  }, [commands]);

  // Progressive command sets
  const availableCommands = {
    off: [],
    basic: [':w', ':q', 'i', 'Esc', 'hjkl'],
    intermediate: [...basic, 'v', '/', 'n', 'p'],
    advanced: [...intermediate, 'q', '@', '"'],
  };

  return { level, setLevel, availableCommands };
}
```

## Phase 4: Advanced Features & Polish (Week 7-8)

### Sprint 4.1: Conflict Resolution & Sync

**Goal**: Smart merge conflict handling

**Three-Way Merge UI**:

```typescript
// src/features/sync/ConflictResolver.tsx
export function ConflictResolver({ conflict }: Props) {
  const [resolution, setResolution] = useState<Resolution>();

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h3>Your Version</h3>
        <DiffEditor content={conflict.local} />
      </div>
      <div>
        <h3>Current Version</h3>
        <DiffEditor content={conflict.remote} />
      </div>
      <div>
        <h3>Common Ancestor</h3>
        <DiffEditor content={conflict.base} />
      </div>

      <div className="col-span-3">
        <ResolutionOptions onSelect={setResolution} />
        <MergePreview resolution={resolution} />
      </div>
    </div>
  );
}
```

### Sprint 4.2: PWA Enhancement

**Goal**: App-like experience

**PWA Configuration**:

```typescript
// src/app/manifest.ts
export default function manifest() {
  return {
    name: 'GitHub Markdown CMS',
    short_name: 'GitCMS',
    description: 'Edit your GitHub Pages blog',
    start_url: '/',
    display: 'standalone',
    background_color: '#191724',
    theme_color: '#c4a7e7',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
```

### Sprint 4.3: Performance Optimization

**Goal**: Meet all performance targets

**Optimization Checklist**:

1. Route-based code splitting
2. Image lazy loading with blur placeholders
3. Virtual scrolling for file lists >100 items
4. Debounced search with Web Workers
5. Incremental Static Regeneration for landing

## Testing Strategy

### Test Structure

```
tests/
├── unit/           # Component logic
├── integration/    # Feature flows
├── e2e/           # User journeys
└── performance/   # Speed metrics
```

### Critical Test Scenarios

```typescript
// tests/e2e/critical-paths.spec.ts
test('New user can edit in demo mode', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Try Demo');
  await page.type('.editor', '# Hello World');
  await expect(page.locator('.preview')).toContainText('Hello World');
});

test('Mobile user can create and publish post', async ({ page, isMobile }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  // Test touch interactions
});
```

## Deployment Strategy

### Infrastructure as Code

```yaml
# vercel.json
{
  'functions': { 'app/api/auth/[...nextauth]/route.ts': { 'runtime': 'edge' } },
  'crons': [{ 'path': '/api/cron/cleanup', 'schedule': '0 0 * * *' }],
}
```

### Environment Configuration

```bash
# Production
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://gitcms.app

# Development
NEXT_PUBLIC_DEMO_MODE=true
```

## Success Metrics & Monitoring

### Key Performance Indicators

1. **Time to First Edit**: <30s for new users
2. **Mobile Performance**: Lighthouse >95
3. **Sync Success Rate**: >99.9%
4. **User Retention**: >80% weekly active

### Monitoring Setup

```typescript
// src/lib/analytics.ts
export const analytics = {
  track(event: string, properties?: any) {
    if (userConsent) {
      // Privacy-focused analytics
      plausible(event, { props: properties });
    }
  },

  // Performance monitoring
  measureWebVitals() {
    if ('web-vital' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          analytics.track('web-vital', {
            name: entry.name,
            value: Math.round(entry.value),
          });
        }
      }).observe({ entryTypes: ['web-vital'] });
    }
  },
};
```

## Risk Management

### Technical Mitigations

1. **API Rate Limits**: Implement exponential backoff and caching
2. **Storage Quotas**: Monitor usage and implement cleanup
3. **Offline Conflicts**: Queue operations with conflict detection

### Launch Strategy

1. Soft launch with invite-only beta
2. Gather feedback from 10-20 power users
3. Iterate based on real usage patterns
4. Public launch with Product Hunt campaign

## Conclusion

This implementation roadmap provides a clear path from zero to a production-ready Progressive Web App that serves both mobile and desktop users effectively. By focusing on demo mode first and progressive enhancement throughout, we ensure rapid user acquisition and high retention rates.
