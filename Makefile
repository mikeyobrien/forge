# ABOUTME: Makefile for para-ssg static site generator
# ABOUTME: Provides simple commands to build and serve the website

.PHONY: help build serve clean rebuild all watch dev

# Default target
help:
	@echo "para-ssg - Static Site Generator"
	@echo ""
	@echo "Available commands:"
	@echo "  make build    - Build the static site"
	@echo "  make serve    - Serve the website locally"
	@echo "  make watch    - Watch for changes and rebuild automatically"
	@echo "  make dev      - Run watch mode and serve together"
	@echo "  make clean    - Remove the build directory"
	@echo "  make rebuild  - Clean and rebuild the site"
	@echo "  make all      - Build and serve the site"
	@echo ""
	@echo "Options:"
	@echo "  PORT=8080     - Set server port (default: 8080)"
	@echo ""

# Build the static site
build:
	@./build.sh

# Serve the website
serve:
	@./serve.sh --port $(or $(PORT),8080)

# Clean build artifacts
clean:
	@echo "Cleaning build directory..."
	@rm -rf build
	@echo "✅ Clean complete"

# Clean and rebuild
rebuild: clean build

# Build and serve
all: build serve

# Watch for changes and rebuild automatically
watch:
	@echo "👁️  Starting watch mode..."
	@echo "Press Ctrl+C to stop"
	@cd code/static-site-generator && cargo run -- --watch ../../context ../../build

# Development mode: watch and serve in parallel
dev:
	@echo "🚀 Starting development mode..."
	@echo "Building initial site..."
	@./build.sh
	@echo ""
	@echo "Starting watch mode and server..."
	@echo "Site will be available at http://localhost:$(or $(PORT),8080)"
	@echo "Press Ctrl+C to stop"
	@echo ""
	@# Run watch and serve in parallel
	@trap 'kill 0' INT; \
	(cd code/static-site-generator && cargo run -- --watch ../../context ../../build) & \
	./serve.sh --port $(or $(PORT),8080) & \
	wait