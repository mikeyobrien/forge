#!/bin/bash
# MCP Server startup wrapper
cd /Users/mobrienv/Code/why/code/forge-mcp
exec node -r dotenv/config dist/index.js