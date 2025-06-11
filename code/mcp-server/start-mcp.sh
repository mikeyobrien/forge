#!/bin/bash
# MCP Server startup wrapper
cd /Users/mobrienv/Code/why/code/mcp-server
exec node -r dotenv/config dist/index.js