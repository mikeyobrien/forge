# Static Site Generation & Serving

This directory includes scripts to easily build and serve the para-ssg static website.

## Quick Start

### Build and serve the site:

```bash
make all
```

### Just build:

```bash
make build
# or
./build.sh
```

### Just serve:

```bash
make serve
# or
./serve.sh
```

## Available Commands

### Using Make

- `make build` - Build the static site from context/ to build/
- `make serve` - Start a local web server (default port: 8080)
- `make clean` - Remove the build directory
- `make rebuild` - Clean and rebuild the site
- `make all` - Build and serve the site

### Using Scripts Directly

#### build.sh

```bash
./build.sh [options]
  -i, --input DIR    Input directory (default: context)
  -o, --output DIR   Output directory (default: build)
  --clean            Clean output directory before building
  -h, --help         Show help message
```

#### serve.sh

```bash
./serve.sh [options]
  -p, --port PORT    Port to serve on (default: 8080)
  -d, --dir DIR      Directory to serve (default: build)
  -h, --help         Show help message
```

## Examples

### Build with custom directories:

```bash
./build.sh --input my-docs --output dist
```

### Serve on a different port:

```bash
./serve.sh --port 3000
# or with make:
make serve PORT=3000
```

### Clean build:

```bash
./build.sh --clean
# or
make rebuild
```

## Requirements

- Rust and Cargo (for building)
- Python 3 or Node.js (for serving)
- macOS or Linux (scripts use bash)

## Features

The generated site includes:

- 70s earthy theme with Saddle Brown, Peru, and Goldenrod colors
- PARA-organized navigation (Projects, Areas, Resources, Archives)
- Wiki-style links between documents
- Client-side search (Ctrl+K or /)
- Mobile responsive design
- No external dependencies (all CSS/JS embedded)

## Viewing the Site

After running `make serve` or `./serve.sh`, open your browser to:

- http://localhost:8080

The server will show both local and network addresses if you want to view from other devices on your network.
