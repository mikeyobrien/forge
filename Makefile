# ABOUTME: Makefile for para-ssg static site generator
# ABOUTME: Provides simple commands to build and serve the website

.PHONY: help build serve clean rebuild all

# Default target
help:
	@echo "para-ssg - Static Site Generator"
	@echo ""
	@echo "Available commands:"
	@echo "  make build    - Build the static site"
	@echo "  make serve    - Serve the website locally"
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