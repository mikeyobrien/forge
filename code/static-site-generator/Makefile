# Makefile for para-ssg development

.PHONY: help build test lint fmt clean install dev check ci

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Run in development mode with file watching
	cargo watch -x 'run -- ../context dist'

build: ## Build the project
	cargo build

build-release: ## Build optimized release version
	cargo build --release

test: ## Run all tests
	cargo test

test-verbose: ## Run tests with verbose output
	cargo test -- --nocapture

# Code quality
lint: ## Run clippy lints
	cargo clippy -- -D warnings

fmt: ## Format code
	cargo fmt

fmt-check: ## Check code formatting
	cargo fmt -- --check

# Comprehensive checks
check: fmt-check lint test ## Run all checks (format, lint, test)

ci: check ## Run CI pipeline locally

# Maintenance
clean: ## Clean build artifacts
	cargo clean

install: ## Install the binary locally
	cargo install --path .

# Utility commands
deps: ## Check for dependency updates
	cargo outdated

audit: ## Security audit of dependencies
	cargo audit

deny: ## Check licenses and security with cargo-deny
	cargo deny check

# Documentation
docs: ## Generate and open documentation
	cargo doc --open

docs-build: ## Generate documentation
	cargo doc --no-deps

# Performance
bench: ## Run benchmarks (if any)
	cargo bench

profile: ## Profile the application
	cargo build --release
	@echo "Run: perf record target/release/para-ssg [args]"

# Example usage
example: build ## Run example with test data
	@echo "Building site from ../context to ./dist"
	./target/debug/para-ssg ../context dist

# Install development tools
setup-dev: ## Install development dependencies
	rustup component add rustfmt clippy
	cargo install cargo-watch cargo-outdated cargo-audit cargo-deny