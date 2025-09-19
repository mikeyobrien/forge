# Architecture Overview

This document summarises the moving parts that make up the Notes-on-Issues workspace and how they collaborate to publish the PARA knowledge base.

## High-Level Flow

1. Markdown knowledge lives in `context/` with PARA-friendly metadata.
2. The Rust static site generator (`code/static-site-generator`) parses the markdown, builds navigation data, and emits the static site in `build/`.
3. Helper scripts (`build.sh`, `serve.sh`, and the root `Makefile`) orchestrate the generator and local development server.
4. The MCP server (`code/forge-mcp`) exposes automation tools for keeping the PARA archive up to date directly from supporting IDEs or assistants.
5. Documentation of decisions and plans resides in `docs/` and `context/projects/notes-on-issues`, giving historical traceability for every change.

## PARA Static Site Generator (Rust)

- **Entry points**: `src/main.rs` for CLI execution and `src/lib.rs` for programmatic use.
- **Pipeline**:
  - `utils::traverse_directory_full` discovers markdown files and categorises them into Projects, Areas, Resources, Archives, or root notes.
  - `parser::parse_document` loads each file, extracts YAML frontmatter, resolves wiki links, and produces a structured `Document` model.
  - `generator::html::HtmlGenerator` renders document pages, while companion modules in `generator::backlinks`, `generator::search`, and `generator::assets` produce backlink graphs, search indexes, and bundled assets.
  - `theme/` contains templates and styling assets for the retro "70s earthy" presentation.
- **Key behaviours**:
  - Parallel parsing via `rayon` keeps large vaults responsive (`lib.rs` orchestrates the multi-threaded work queue).
  - Validation warns when PARA folders are missing or documents lack expected metadata.
  - Tests under `tests/` and `src/error_handling_tests.rs` cover regression scenarios, including malformed files and CLI behaviour.

## Local Build and Serving Tooling

- `build.sh` wraps the Rust binary, providing flags for custom input/output directories and a `--clean` mode.
- `serve.sh` runs a lightweight static file server that prints both localhost and LAN URLs for quick sharing.
- The `Makefile` combines both scripts into `make build`, `make serve`, `make dev`, and other convenience targets for development loops.

## Forge MCP Server (TypeScript)

- **Purpose**: automate PARA maintenance with Model Context Protocol tools.
- **Core modules**:
  - `src/index.ts` boots an MCP server that registers tools for creating, reading, updating, moving, and querying context documents, along with screenshot capture.
  - `filesystem/` abstracts file IO, normalising paths and ensuring metadata consistency.
  - `para/PARAManager.ts` enforces PARA placement rules and metadata validation when documents move between categories.
  - `search/AdvancedSearchEngine.ts` builds an in-memory index to support the `context_search` tool, including relevance scoring and snippet extraction.
  - `backlinks/BacklinkManager.ts` maintains cross-reference graphs that power both the MCP responses and the static site generator's backlink views.
  - `updater/DocumentUpdater.ts` applies content edits while preserving frontmatter and wiki link structure.
- **Execution**: build with `pnpm build` to emit `dist/index.js`, then launch via `node dist/index.js` or the helper script `start-mcp.sh`. Docker and docker-compose configurations allow containerised deployments.
- **Testing**: run `pnpm test` inside `code/forge-mcp` to execute the Jest suite covering tool handlers and parsers.

## Knowledge Base Structure (`context/`)

- Organised using the PARA method: `projects/`, `areas/`, `resources/`, and (when necessary) `archives/`.
- Every markdown file includes YAML frontmatter with tags (all docs are tagged `codex`), timestamps, and metadata that drive both PARA navigation and MCP automation.
- Project folders such as `context/projects/notes-on-issues/` collect plans, reports, and todos describing ongoing work on this repository.
- `.index/backlinks.json` is generated to speed up wiki-link resolution for both the static site and MCP server.

## Supporting Tooling

- `tools/self-check.sh` is invoked by `pnpm test` at the repository root. It verifies `pnpm` availability, then runs the Vitest suite and the Rust static site generator tests to guarantee end-to-end health across languages.
- `docs/GOAL.md` captures the overarching objectives for the workspace, providing context when evaluating new features or automation ideas.

## Deployment Considerations

- Regenerate the static site (`make build`) after any change to `context/` or the generator code to keep the published artefacts up to date.
- When updating the MCP server, confirm compatibility by running `npx -y @modelcontextprotocol/inspector --cli ./code/forge-mcp/start-mcp.sh --method tools/list` as noted in `CLAUDE.md`.
- Maintain documentation parity: every commit should include an entry in `context/` that records what changed, why, and any follow-up actions.
