#!/bin/bash

# Build and tag Docker image with git commit hash for version pinning
# Usage: ./build-docker.sh [tag-name]

set -e

# Get current git commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

# Build the image
echo "Building MCP server Docker image..."
npm run build
docker build -t forge-mcp:$COMMIT_HASH .

# Tag as latest
docker tag forge-mcp:$COMMIT_HASH forge-mcp:latest

# If custom tag provided, also tag with that
if [ ! -z "$1" ]; then
    docker tag forge-mcp:$COMMIT_HASH forge-mcp:$1
    echo "Tagged as: forge-mcp:$1"
fi

echo "Built and tagged as:"
echo "  forge-mcp:$COMMIT_HASH"
echo "  forge-mcp:latest"

# Show current images
echo ""
echo "Available MCP server images:"
docker images forge-mcp