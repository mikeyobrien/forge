#!/bin/bash

# Start MCP server in Docker container with proper cleanup
# This script ensures containers are cleaned up after use

set -e

# Use latest tagged image or specific commit hash if provided
IMAGE_TAG=${1:-latest}
CONTAINER_NAME="mcp-server-$(date +%s)"

# Function to cleanup container on exit
cleanup() {
    echo "Stopping and removing container..."
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Run the container with auto-remove and volume mount
docker run \
    --name "$CONTAINER_NAME" \
    --rm \
    -v "$(dirname "$(dirname "$(pwd)")")/context:/context" \
    -e CONTEXT_ROOT=/context \
    -e LOG_LEVEL=info \
    --entrypoint=node \
    -i \
    "mcp-server:$IMAGE_TAG" \
    dist/index.js