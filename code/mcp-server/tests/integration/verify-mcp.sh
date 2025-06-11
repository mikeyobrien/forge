#!/bin/bash
# ABOUTME: Simple verification script to test MCP server with Claude
# ABOUTME: Quick manual test to ensure MCP tools are working

echo "=== MCP Server Verification Test ==="
echo
echo "This script will test the MCP server integration with Claude."
echo "Make sure you have:"
echo "1. Built the server (npm run build)"
echo "2. Added the MCP server to Claude"
echo
echo "Press Enter to continue..."
read

# Test 1: Ping
echo
echo "Test 1: Testing ping tool..."
claude -p "Use the ping MCP tool with message 'test123' and show the result"

echo
echo "Press Enter for next test..."
read

# Test 2: Create
echo
echo "Test 2: Creating a document..."
claude -p "Create a document called 'verify-test' with title 'Verification Test' and content 'This is a verification test document.'"

echo
echo "Press Enter for next test..."
read

# Test 3: Read
echo
echo "Test 3: Reading the document..."
claude -p "Read the document at path 'resources/verify-test.md'"

echo
echo "Press Enter for next test..."
read

# Test 4: Search
echo
echo "Test 4: Searching documents..."
claude -p "Search for all documents and show the results"

echo
echo "=== Verification Complete ==="
echo "If all tests showed proper responses, the MCP server is working correctly!"