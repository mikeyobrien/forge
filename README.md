# Notes-on-Issues Monorepo

This repository hosts the tooling, documentation, and knowledge base that power the **Notes-on-Issues** initiative. The project explores how far large language models can go when building and maintaining their own frameworks with minimal external dependencies. Everything required to generate the public site, operate MCP tooling, and track progress lives in this monorepo.

## Repository Layout

| Path                               | Description                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code/`                            | Source for project tooling. It currently includes the Rust-based PARA static site generator and the TypeScript MCP server that manages PARA documents.            |
| `context/`                         | PARA knowledge base organised into `projects/`, `areas/`, and `resources/`. Every contribution must add an entry here so the history of work remains transparent. |
| `docs/`                            | High-level vision and design notes for the overall endeavour.                                                                                                     |
| `tools/`                           | Utility scripts such as `self-check.sh` for quick validation.                                                                                                     |
| `build.sh`, `serve.sh`, `Makefile` | Conveniences for building and serving the generated site locally.                                                                                                 |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a deeper breakdown of the components and their interactions.

## Getting Started

1. **Install prerequisites**
   - Node.js 20+ with `pnpm`
   - Rust toolchain (the static site generator is written in Rust)
   - Bash-compatible shell (for the helper scripts)
2. **Install JavaScript dependencies**
   ```bash
   pnpm install
   ```
3. **Verify the toolchain**
   ```bash
   pnpm test
   ```
   The validation script fan-outs into the Vitest unit suite and the Rust static site generator tests so a single command
   exercises the Node and Rust toolchains together.

## Building and Serving the PARA Site

The PARA static site generator lives in `code/static-site-generator` and transforms the markdown documents from `context/` into a standalone website.

```bash
# Build the latest site into ./build
make build

# Serve the generated site locally (defaults to http://localhost:8080)
make serve

# Watch the context directory and rebuild on change while serving
make dev
```

The helper scripts accept additional arguments:

- `./build.sh --input <dir> --output <dir>` to customise the build paths
- `./build.sh --clean` to remove previous output before building
- `./serve.sh --port <port>` to serve on an alternative port

Refer to [SITE_README.md](SITE_README.md) for a detailed command reference.

## Model Context Protocol Server

`code/forge-mcp` implements the MCP server that automates PARA knowledge base maintenance. Key capabilities include:

- Creating, reading, and updating PARA documents with backlink awareness
- Querying cross-document links and executing advanced content searches
- Capturing context-aware screenshots that can be attached to documentation

To run the server in a local shell session:

```bash
cd code/forge-mcp
pnpm install
pnpm build
node dist/index.js
```

`code/forge-mcp/start-mcp.sh` contains an example launcher script; update the working directory it references before using it directly. Docker workflows are documented alongside `code/forge-mcp/docker-compose.yml` and `build-docker.sh`.

## Development Workflow

1. Capture plans, reports, and todos inside `context/` using the PARA structure and metadata frontmatter.
2. Implement code or documentation changes within the appropriate package under `code/`.
3. Update or add supporting documentation under `docs/` when architecture or process decisions evolve.
4. Run validation with `pnpm test`, which orchestrates the Vitest suite and the Rust tests in one go.
5. Build the site (`make build`) to confirm the knowledge base renders correctly before publishing.

## Additional Resources

- [docs/GOAL.md](docs/GOAL.md) – project vision and guiding principles
- [context/projects/notes-on-issues](context/projects/notes-on-issues) – active plans, milestones, and reports for this monorepo
- [code/static-site-generator/README.md](code/static-site-generator/README.md) – in-depth guide to the PARA SSG

For more operational notes, explore the `context/` folder. Every document there includes metadata, historical decisions, and next actions that inform ongoing development.
