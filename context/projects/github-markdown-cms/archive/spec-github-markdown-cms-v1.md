---
title: GitHub Markdown CMS Specification
category: projects
status: active
created: 2025-06-14T18:43:10.774Z
modified: 2025-06-14T18:43:10.774Z
tags:
  - cms
  - github
  - markdown
  - specification
  - vim
---

---

title: GitHub Markdown CMS Specification
category: projects
created: 2025-06-14
modified: 2025-06-14
tags: [cms, github, markdown, web-application, vim, github-pages]
command_type: spec
project: github-markdown-cms
status: active
generated_by: /spec
related_docs: [projects/github-markdown-cms/index.md]
context_source: []

---

# GitHub Markdown CMS Specification

## Executive Summary

### Problem Statement

Bloggers using GitHub Pages need to manage their markdown posts through Git commands or GitHub's web interface, which creates friction in the writing workflow. Existing solutions are either too complex (full CMS systems) or too simple (basic file editors).

### Proposed Solution

A minimalist, keyboard-driven markdown CMS with vim bindings that uses GitHub as the backend storage. Features a Telescope-like fuzzy finder for rapid post navigation and seamless switching between raw markdown and rendered preview.

### Key Benefits

- Familiar vim keybindings for power users
- Fast, fuzzy post navigation
- Direct GitHub integration for version control
- Zero infrastructure costs (uses GitHub for storage)
- Instant publishing to GitHub Pages

## Requirements

### Functional Requirements

#### Core Editor

- Vim keybindings for all editing operations
- Toggle between raw markdown and rendered preview
- Syntax highlighting for markdown
- Real-time preview updates
- Clean, distraction-free interface

#### File Navigation

- Telescope-like fuzzy finder overlay
- Search by filename, title, or content
- Keyboard-only navigation
- Quick preview on selection
- Recently edited files section

#### GitHub Integration

- OAuth authentication with GitHub
- List repositories with GitHub Pages enabled
- Read/write markdown files from repository
- Commit changes with meaningful messages
- Push to trigger GitHub Pages rebuild

#### Post Management

- Create new posts with frontmatter templates
- Edit existing posts
- Delete posts (with confirmation)
- View post history (git log)
- Revert to previous versions

### Non-Functional Requirements

#### Performance

- Fuzzy finder responds within 50ms
- File switching under 100ms
- Editor latency under 10ms for typing
- Preview rendering under 200ms

#### Usability

- All actions accessible via keyboard
- Vim users should feel at home
- Minimal learning curve for vim users
- Clear visual feedback for all actions

#### Technical

- Works in modern browsers (Chrome, Firefox, Safari)
- No backend server required (static hosting possible)
- Responsive design for various screen sizes
- Offline editing with sync when online

### Acceptance Criteria

- [ ] User can authenticate with GitHub
- [ ] User can select a GitHub Pages repository
- [ ] User can create, edit, and delete posts
- [ ] Vim keybindings work as expected
- [ ] Fuzzy finder opens with configurable hotkey
- [ ] Changes are committed and pushed to GitHub
- [ ] Preview accurately renders GitHub Flavored Markdown

## Technical Considerations

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐
│                 │     │                  │
│  Static Web App │────▶│  GitHub API      │
│  (Frontend)     │     │  (Backend)       │
│                 │     │                  │
└─────────────────┘     └──────────────────┘
        │
        ▼
┌─────────────────┐
│                 │
│  User's Browser │
│  - LocalStorage │
│  - IndexedDB    │
│                 │
└─────────────────┘
```

### Technology Choices

- **Frontend Framework**: Vanilla JS or lightweight framework (TBD)
- **Editor**: CodeMirror or Monaco with vim mode
- **Fuzzy Search**: Fuse.js or similar
- **Markdown Rendering**: Marked.js or markdown-it
- **GitHub Integration**: Octokit.js
- **Styling**: Minimal CSS, dark theme default

### Integration Points

- GitHub OAuth for authentication
- GitHub REST API for repository operations
- GitHub Pages for hosting the blog
- Browser LocalStorage for preferences
- IndexedDB for offline drafts

## Constraints & Risks

### Known Limitations

- GitHub API rate limits (5000 requests/hour authenticated)
- File size limits (100MB per file)
- No real-time collaboration
- Limited to public repositories (unless user has GitHub Pro)

### Potential Challenges

- Handling merge conflicts if edited elsewhere
- OAuth token management and refresh
- Cross-origin requests to GitHub API
- Vim mode completeness vs. implementation effort

### Mitigation Strategies

- Implement request caching and batching
- Check for conflicts before saving
- Use GitHub's OAuth app flow properly
- Focus on essential vim commands first

## Success Metrics

### Measurable Outcomes

- Time from idea to published post < 5 minutes
- All common actions achievable without mouse
- Page load time < 2 seconds
- 90% of vim commands work as expected

### Performance Targets

- Fuzzy search through 1000 posts < 100ms
- Markdown preview render < 200ms
- API response caching reduces requests by 80%

### Quality Indicators

- Zero data loss incidents
- Successful GitHub sync rate > 99%
- User can work offline and sync later
- Vim users report familiar experience

## Next Steps

1. Finalize technology stack decisions
2. Create detailed UI mockups
3. Set up GitHub OAuth application
4. Implement MVP with core features
5. Test with real GitHub Pages blogs
6. Iterate based on user feedback

## Open Questions

- Should we support multiple repositories?
- Custom frontmatter fields needed?
- Support for draft posts (separate branch)?
- Custom keyboard shortcut configuration?

## Security Architecture Decision

### OAuth Implementation: Proxy Auth Server

For maximum public trust, we'll implement a proxy auth server:

**Rationale:**

- GitHub access tokens never touch the browser
- Clear separation of concerns
- Industry standard practice (like Netlify CMS)
- Users can inspect network traffic and see no tokens
- Allows for token rotation without user intervention

**Architecture:**

```
Browser ←→ Auth Proxy Server ←→ GitHub API
         (encrypted session)   (access token)
```

**Security Benefits:**

- Access tokens stored only on secure backend
- Session cookies with httpOnly, secure, sameSite
- Automatic token refresh handling
- Rate limiting at proxy level
- Audit logging capability

### Repository Management

**Approach:** SSG-agnostic

- Users configure their own static site generator
- CMS only manages markdown files
- No assumptions about blog structure
- Respects existing Jekyll/Hugo/Eleventy setups

This gives users full control and builds trust through transparency.

## Save & Publish Workflow

### Local-First Approach

**Auto-save Behavior:**

- Save to IndexedDB on every pause (debounced 1s)
- Visual indicator for unsaved changes
- Diff tracking between local and remote versions
- Keyboard shortcut for manual save (`:w` in vim mode)

### LLM-Powered Commit Messages

**Conventional Commit Generation:**

```
Input: Diff of changes
Output: Semantic commit message

Examples:
- "feat(blog): add post about vim productivity tips"
- "fix(content): correct typos in react hooks article"
- "refactor(posts): reorganize golang series structure"
- "docs: update about page with new bio"
```

**Implementation:**

- Analyze diff to understand changes
- Follow conventional commit format
- Include post title in scope when relevant
- User can edit before confirming

### Publish Flow

**Keyboard-Driven Publishing:**

1. `:publish` or `<Leader>p` triggers publish flow
2. Show diff preview
3. Display generated commit message
4. Allow edit/confirm
5. Push to GitHub
6. Show success/failure state

**Sync Status Indicators:**

- Green: Synced with remote
- Yellow: Local changes pending
- Red: Sync conflict detected
- Gray: Offline mode

### Conflict Resolution

**Smart Conflict Handling:**

- Detect conflicts before publish
- Show three-way diff (local/remote/base)
- Vim-style conflict markers
- Option to force push or merge

## Configuration & Setup

### First-Time Setup Wizard

**Guided Flow:**

1. Welcome screen with app overview
2. GitHub OAuth authorization
3. LLM provider selection (via LiteLLM)
   - Enter API key for chosen provider
   - Test connection with sample commit message
4. Repository selection/creation
5. Blog preferences configuration
6. Quick vim tutorial (optional)

### LiteLLM Integration

**Provider Flexibility:**

```javascript
// User provides:
{
  "llm_provider": "anthropic|openai|cohere|local",
  "llm_api_key": "sk-...",
  "llm_model": "claude-3-sonnet|gpt-4|etc"  // optional, defaults to recommended
}
```

**Default Commit Prompt Template:**

```
Given the following git diff, generate a conventional commit message.
Use feat: for new features, fix: for bug fixes, docs: for documentation.
Include the post title in parentheses when relevant.
Keep it concise and descriptive.

Diff:
{diff}

Output only the commit message, no explanation.
```

### User Customization

**Config File (`.vim-cms.config.js`):**

```javascript
export default {
  // Vim configuration
  vimrc: [
    'set relativenumber',
    'set tabstop=2',
    'map <Leader>p :publish<CR>',
    // User's custom mappings
  ],

  // Blog settings
  blog: {
    frontmatterTemplate: {
      title: '',
      date: '{{date}}',
      tags: [],
      draft: false,
      // User's custom fields
    },
    fileNaming: 'slug', // or 'date-slug'
    postsDirectory: '_posts/', // default location
  },

  // LLM settings
  llm: {
    commitPrompt: '...custom prompt...',
    generateSummary: true, // for longer posts
  },

  // UI preferences (limited by design)
  ui: {
    keyboardShortcuts: {
      fuzzyFind: '<C-p>',
      togglePreview: '<Leader>m',
      save: ':w',
      publish: '<Leader>p',
    },
  },
};
```

### Design Decisions

**Visual Design:**

- Theme: Rosé Pine (dark mode only)
- Font: Iosevka (monospace)
- Minimal UI chrome
- Focus on content area

**Opinionated Defaults:**

- Smart tab completion
- Auto-pairs for markdown syntax
- Soft line wrapping for prose
- Distraction-free mode by default

### File Naming Options

**Slug Format:**

- `my-awesome-post.md`
- Clean URLs: `/my-awesome-post`

**Date-Slug Format:**

- `2024-06-14-my-awesome-post.md`
- URLs: `/2024/06/14/my-awesome-post`
- Better for chronological organization

## Implementation Priorities

### MVP Features (Phase 1)

1. GitHub OAuth with proxy server
2. Basic vim-mode editor (CodeMirror/Monaco)
3. Fuzzy file finder
4. Local auto-save to IndexedDB
5. Manual publish to GitHub
6. Markdown preview toggle
7. Rosé Pine theme + Iosevka font

### Phase 2 Enhancements

1. LiteLLM integration for commit messages
2. Config file support (.vim-cms.config.js)
3. Frontmatter templates
4. Custom vim mappings
5. Conflict detection/resolution
6. Setup wizard

### Phase 3 Polish

1. Offline mode with sync queue
2. Post search within content
3. Git history viewer
4. Performance optimizations
5. Keyboard shortcut customization
6. Export/backup functionality

## Technical Stack Recommendation

### Frontend

- **Editor**: CodeMirror 6 with vim mode
  - Better vim emulation than Monaco
  - Smaller bundle size
  - Excellent performance

### Markdown Preview

- **Renderer**: markdown-it
  - GitHub Flavored Markdown support
  - Extensible for future features
  - Fast rendering

### Fuzzy Search

- **Library**: Fuse.js
  - Lightweight
  - No dependencies
  - Configurable fuzzy matching

### State Management

- **Approach**: Vanilla JS with custom store
  - No framework overhead
  - Full control over performance
  - Easier vim integration

### Auth Proxy Server

- **Language**: Node.js or Go
  - Simple OAuth flow handler
  - Session management
  - GitHub API proxy
  - Minimal deployment footprint

## Summary

This specification defines a minimalist, keyboard-driven CMS that respects both the power user's workflow and the security concerns of managing blog content. By using GitHub as the backend and focusing on vim-style efficiency, we create a tool that feels native to developers while solving the real friction of blog post management.

The use of LiteLLM for commit messages and a proper OAuth proxy demonstrates a commitment to both user experience and security best practices. The local-first approach ensures writers never lose work, while the clean configuration system allows power users to customize their environment without overwhelming new users.

Next steps would be to create a technical implementation plan breaking down the work into specific tasks and milestones.
