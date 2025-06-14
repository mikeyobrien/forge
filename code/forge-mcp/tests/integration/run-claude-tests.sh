#!/bin/bash
# ABOUTME: Main test runner for Claude-based MCP integration tests
# ABOUTME: Executes integration tests using Claude CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to script directory
cd "$(dirname "$0")"

echo -e "\n${BLUE}=== Running MCP Server Integration Tests with Claude ===${NC}"
echo "Starting at: $(date)"
echo

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude CLI not found. Please install it first.${NC}"
    echo "Visit: https://claude.ai/download"
    exit 1
fi

# Check if MCP server is configured
if ! claude mcp list | grep -q "context-forge-mcp"; then
    echo -e "${YELLOW}Warning: MCP server 'context-forge-mcp' not found in Claude configuration${NC}"
    echo "You may need to add it using:"
    echo "  claude mcp add context-mcp-server \"node $(pwd)/../../dist/index.js\""
    echo
fi

# Run the Claude integration tests
./test-claude.sh

echo
echo "Completed at: $(date)"