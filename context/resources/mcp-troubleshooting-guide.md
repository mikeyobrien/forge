---
title: MCP Server Troubleshooting Guide for Claude CLI
tags: [mcp, troubleshooting, claude-cli, debugging, stdio]
created: 2025-06-11T16:00:00Z
modified: 2025-06-11T16:00:00Z
---

# MCP Server Troubleshooting Guide for Claude CLI

This comprehensive guide covers common issues and solutions when developing and debugging MCP (Model Context Protocol) servers with Claude CLI.

## Common Issues and Solutions

### 1. Timeout Errors

#### Symptoms

- Claude CLI hangs or times out after 30-60 seconds
- Error: "Command timed out after Xs"
- MCP tools don't appear in Claude's tool list

#### Root Causes

- Console output interfering with stdio communication
- Server not starting properly
- Missing or incorrect configuration

#### Solutions

**Remove ALL Console Output**

```javascript
// BAD - This will break stdio MCP servers
console.log('Server started');
console.error('Debug info');

// GOOD - Use a proper logger that writes to stderr only
class Logger {
  debug(msg) {
    if (process.env.MCP_ENABLE_LOGGING === 'true') {
      process.stderr.write(`[DEBUG] ${msg}\n`);
    }
  }
}
```

**Test Server Directly**

```bash
# Test with direct JSON-RPC input
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0.0"},"capabilities":{}},"id":1}' | node dist/index.js
```

### 2. Configuration Issues

#### File Locations

Claude CLI looks for configuration in multiple places:

- `.mcp.json` in current directory
- `.claude_project` in project root
- Local config via `claude mcp add`

#### Proper Configuration Format

**.mcp.json Example**

```json
{
  "mcpServers": {
    "your-server-name": {
      "type": "stdio",
      "command": "node",
      "args": ["-r", "dotenv/config", "/absolute/path/to/dist/index.js"],
      "env": {
        "CONTEXT_ROOT": "/absolute/path/to/context",
        "LOG_LEVEL": "error",
        "MCP_ENABLE_LOGGING": "false"
      }
    }
  }
}
```

**Important Configuration Tips**

- Always use absolute paths
- Set `MCP_ENABLE_LOGGING` to "false" for production
- Use a wrapper script if needed for complex startup

### 3. Permission Issues

#### Symptoms

- "I need permission to use this tool"
- Tools appear but Claude won't execute them

#### Solutions

**Bypass Permissions (Development Only)**

```bash
claude --dangerously-skip-permissions -p "Your prompt here"
```

**Grant Permanent Permissions**

- Click "Allow always" when prompted in Claude Desktop
- Use `/permissions` command to add trusted domains

### 4. Tool Registration Problems

#### Symptoms

- Tools don't appear in Claude's tool list
- Tools appear with wrong names (e.g., `mcp__servername__toolname`)

#### Debugging Steps

1. **List Available Tools**

```bash
claude -p "List all available tools including MCP tools"
```

2. **Check Server Registration**

```bash
claude mcp list
```

3. **Verify Tool Schema**
   Ensure your tool returns proper JSON Schema:

```javascript
{
  name: 'your_tool',
  description: 'What it does',
  inputSchema: {
    type: 'object',
    properties: {
      // Your parameters
    },
    required: ['param1']
  }
}
```

### 5. Debugging Techniques

#### Enable Debug Logging (Carefully)

```bash
# Only for debugging - disable for production
export MCP_ENABLE_LOGGING=true
export LOG_LEVEL=debug
```

#### Monitor Server Startup

```bash
# Create a debug wrapper
#!/bin/bash
echo "Starting MCP server..." >&2
cd /path/to/server
exec node -r dotenv/config dist/index.js
```

#### Test JSON-RPC Communication

```javascript
// test-mcp.js
const { spawn } = require('child_process');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

// Send initialize request
server.stdin.write(
  JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'test', version: '1.0' },
      capabilities: {},
    },
    id: 1,
  }) + '\n',
);

// Read response
server.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});
```

### 6. Common Mistakes to Avoid

#### Don't Use Console for Debugging

```javascript
// WRONG - Breaks stdio
console.log('Debug:', data);

// RIGHT - Use stderr
process.stderr.write(`Debug: ${JSON.stringify(data)}\n`);
```

#### Don't Forget Error Handling

```javascript
// Always wrap tool execution
async execute(params) {
  try {
    // Your tool logic
    return { success: true, result: data };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

#### Don't Use Relative Paths

```javascript
// WRONG
const config = require('./config.json');

// RIGHT
const config = require(path.resolve(__dirname, 'config.json'));
```

### 7. Testing Checklist

Before deploying your MCP server:

- [ ] Remove ALL console.log/error/warn statements
- [ ] Test with direct JSON-RPC input
- [ ] Verify tool schemas are valid
- [ ] Check all paths are absolute
- [ ] Test with `claude --dangerously-skip-permissions`
- [ ] Ensure error handling returns proper JSON
- [ ] Verify server exits cleanly on errors

### 8. Advanced Debugging

#### Use MCP Inspector

For complex debugging, consider using the MCP Inspector tool to monitor protocol messages.

#### Create Test Harness

```bash
#!/bin/bash
# test-harness.sh
TEST_INPUT='{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
echo "$TEST_INPUT" | node dist/index.js | jq .
```

#### Monitor File Descriptors

```bash
# Check if server is reading from stdin
lsof -p $(pgrep -f "node.*index.js") | grep -E "0r|1w|2w"
```

## Quick Fixes Reference

| Problem           | Quick Fix                            |
| ----------------- | ------------------------------------ |
| Timeout           | Remove all console output            |
| No tools          | Check `claude mcp list`              |
| Permission denied | Use `--dangerously-skip-permissions` |
| Tools not working | Verify JSON schema                   |
| Can't debug       | Write to stderr only                 |

## Example Working Setup

1. **Server Code (index.js)**

```javascript
// No console output!
const server = new Server({
  name: 'my-server',
  version: '1.0.0',
});

// Tools, handlers, etc.
server.connect(new StdioServerTransport());
```

2. **Configuration (.mcp.json)**

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/index.js"]
    }
  }
}
```

3. **Test Command**

```bash
claude --dangerously-skip-permissions -p "Use my_tool to do something"
```

Remember: The key to MCP server success is **silent operation** - no output to stdout except valid JSON-RPC responses!
