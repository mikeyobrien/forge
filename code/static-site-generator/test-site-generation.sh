#!/bin/bash

# Integration test script for para-ssg

set -e

echo "Testing para-ssg site generation..."

# Set up Rust path
export PATH="$HOME/.cargo/bin:$PATH"

# Build the project
echo "Building project..."
cargo build --release

# Test with actual context directory
echo ""
echo "Generating site from context directory..."
cargo run --release -- ../../context test-output

echo ""
echo "Site generation test complete!"
echo "Output directory: test-output/"
echo ""
echo "You can view the generated site by:"
echo "  cd test-output && python3 -m http.server 8000"
echo "  Then open http://localhost:8000 in your browser"