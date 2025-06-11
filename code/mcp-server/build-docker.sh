#!/bin/bash

# Build and tag Docker image with git commit hash for version pinning
# Usage: ./build-docker.sh [tag-name]

set -e

# Get current git commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

# Build the image
echo "Building MCP server Docker image..."
npm run build
docker build -t mcp-server:$COMMIT_HASH .

# Tag as latest
docker tag mcp-server:$COMMIT_HASH mcp-server:latest

# If custom tag provided, also tag with that
if [ ! -z "$1" ]; then
    docker tag mcp-server:$COMMIT_HASH mcp-server:$1
    echo "Tagged as: mcp-server:$1"
fi

echo "Built and tagged as:"
echo "  mcp-server:$COMMIT_HASH"
echo "  mcp-server:latest"

# Show current images
echo ""
echo "Available MCP server images:"
docker images mcp-server