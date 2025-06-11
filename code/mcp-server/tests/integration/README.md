# MCP Server Integration Tests

This directory contains integration tests for the MCP server using multiple approaches.

## Overview

We provide three types of integration tests:

1. **JSON-RPC Tests** - Direct protocol-level testing
2. **Claude CLI Tests** - Testing through actual Claude interactions
3. **Manual Verification** - Interactive testing for development

## Test Types

### 1. JSON-RPC Tests (`test-jsonrpc.sh`)

Tests the MCP server directly using JSON-RPC protocol:

- Direct stdio communication
- No external dependencies
- Fast and reliable
- Good for CI/CD

```bash
npm run test:integration
```

### 2. Claude CLI Tests (`test-claude.sh`)

Tests the MCP server through Claude's headless mode:

- Uses `claude -p` commands
- Tests real user interactions
- Requires Claude CLI installed
- Most realistic testing

```bash
npm run test:integration:claude
```

### 3. Manual Verification (`verify-mcp.sh`)

Interactive test script for development:

- Step-by-step testing
- See actual Claude responses
- Good for debugging

```bash
npm run test:verify
```

## Prerequisites

### For JSON-RPC Tests

- Node.js installed
- Built server (`npm run build`)

### For Claude Tests

- Claude CLI installed (`claude --version`)
- MCP server configured in Claude:
  ```bash
  claude mcp add context-mcp-server "node /path/to/dist/index.js"
  ```

## Running Tests

### Run all tests (unit + integration):

```bash
npm run test:all
```

### Run only integration tests:

```bash
npm run test:integration
```

### Run Claude-based tests:

```bash
npm run test:integration:claude
```

### Manual verification:

```bash
npm run test:verify
```

## Test Structure

### JSON-RPC Tests

- Direct protocol communication
- Tests all MCP tools
- Validates responses
- Error handling

### Claude Tests

- Realistic user prompts
- Natural language interactions
- End-to-end workflows
- Integration validation

## Adding New Tests

### For JSON-RPC tests:

```bash
# Add to test-jsonrpc.sh
run_test "Your test description"
output=$(call_tool "tool_name" '{"arg": "value"}')
assert_contains "$output" "expected" "Success message"
```

### For Claude tests:

```bash
# Add to test-claude.sh
run_test "Your test description"
output=$(run_claude "Your natural language prompt to Claude")
assert_contains "$output" "expected" "Success message"
```

## CI/CD Integration

The JSON-RPC tests are designed for CI environments:

- Exit with code 0 on success, 1 on failure
- Clear output formatting
- No interactive prompts
- Clean up temporary files

## Debugging

### Debug JSON-RPC tests:

```bash
bash -x ./test-jsonrpc.sh
```

### Debug Claude interaction:

```bash
CONTEXT_ROOT=/tmp/test claude -p "Your test prompt"
```

### Check server logs:

```bash
MCP_ENABLE_LOGGING=true node dist/index.js
```

## Known Issues

1. MCP Inspector CLI has compatibility issues - use JSON-RPC tests instead
2. Claude tests require Claude CLI with MCP support
3. Some tests may need adjustment based on Claude's response format
