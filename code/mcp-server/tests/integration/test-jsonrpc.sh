#!/bin/bash
# ABOUTME: Integration tests using direct JSON-RPC communication
# ABOUTME: Tests MCP server without relying on the inspector CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test context directory
TEST_CONTEXT_ROOT=""

# Create a test context directory
create_test_context() {
    TEST_CONTEXT_ROOT=$(mktemp -d -t mcp-test-XXXXXX)
    mkdir -p "$TEST_CONTEXT_ROOT"/{projects,areas,resources,archives}
    echo "Created test context: $TEST_CONTEXT_ROOT"
}

# Clean up test context
cleanup_test_context() {
    if [ -n "$TEST_CONTEXT_ROOT" ] && [ -d "$TEST_CONTEXT_ROOT" ]; then
        rm -rf "$TEST_CONTEXT_ROOT"
        echo "Cleaned up test context"
    fi
}

# Send JSON-RPC request to server
send_jsonrpc() {
    local requests="$1"
    echo "$requests" | CONTEXT_ROOT="$TEST_CONTEXT_ROOT" node "$(dirname "$0")/../../dist/index.js" 2>/dev/null
}

# Initialize server and call a tool
call_tool() {
    local tool_name="$1"
    local args="$2"
    
    local requests=$(cat <<EOF
{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"0.1.0","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"$tool_name","arguments":$args},"id":2}
EOF
)
    
    send_jsonrpc "$requests" | grep '"id":2'
}

# Check if a command succeeded
assert_success() {
    local exit_code=$?
    local message="$1"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ $message${NC}"
    else
        echo -e "${RED}✗ $message${NC}"
        exit 1
    fi
}

# Check if output contains expected string
assert_contains() {
    local output="$1"
    local expected="$2"
    local message="$3"
    
    if echo "$output" | grep -q "$expected"; then
        echo -e "${GREEN}✓ $message${NC}"
    else
        echo -e "${RED}✗ $message${NC}"
        echo "Expected to find: $expected"
        echo "Actual output: $output"
        exit 1
    fi
}

# Run a test with description
run_test() {
    local description="$1"
    echo -e "\n${YELLOW}Test: $description${NC}"
}

# Print test summary
print_summary() {
    echo -e "\n${GREEN}All tests passed!${NC}"
}

# Build the server first
echo "Building MCP server..."
cd "$(dirname "$0")/../.."
npm run build
assert_success "Server build completed"

# Start tests
echo -e "\n${YELLOW}=== MCP Server Integration Tests (JSON-RPC) ===${NC}"

# Create test context
create_test_context

# Test 1: List tools
run_test "List available tools"
output=$(send_jsonrpc '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"0.1.0","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}
{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' | grep '"id":2')
assert_success "Tools listed"
assert_contains "$output" "ping" "Found ping tool"
assert_contains "$output" "context_create" "Found context_create tool"
assert_contains "$output" "context_read" "Found context_read tool"
assert_contains "$output" "context_search" "Found context_search tool"

# Test 2: Ping
run_test "Ping tool"
output=$(call_tool "ping" '{"message":"hello-test"}')
assert_success "Ping successful"
assert_contains "$output" "hello-test" "Message echoed correctly"
assert_contains "$output" "timestamp" "Timestamp included"
assert_contains "$output" "$TEST_CONTEXT_ROOT" "Context root included"

# Test 3: Create document
run_test "Create document"
output=$(call_tool "context_create" '{"path":"test-project","title":"Test Project","content":"This is a test project.","tags":["test","integration"]}')
assert_success "Document created"
assert_contains "$output" 'success' "Creation successful"
assert_contains "$output" "resources/test-project.md" "Default category used"

# Test 4: Read document
run_test "Read created document"
output=$(call_tool "context_read" '{"path":"resources/test-project.md"}')
assert_success "Document read"
assert_contains "$output" "Test Project" "Title found"
assert_contains "$output" "This is a test project" "Content found"
assert_contains "$output" "test" "Tags found"

# Test 5: Create with specific category
run_test "Create project in projects category"
output=$(call_tool "context_create" '{"path":"web-app","title":"Web Application","category":"projects","status":"active"}')
assert_success "Project created"
assert_contains "$output" "projects/web-app.md" "Correct category used"

# Test 6: Search
run_test "Search for documents"
output=$(call_tool "context_search" '{"tags":["test"]}')
assert_success "Search completed"
assert_contains "$output" "total" "Total count included"
assert_contains "$output" "Test Project" "Found test document"

# Test 7: Search by category
run_test "Search by category"
output=$(call_tool "context_search" '{"category":"projects"}')
assert_success "Category search completed"
assert_contains "$output" "Web Application" "Found project"

# Test 8: Error handling - missing required fields
run_test "Handle missing required fields"
output=$(call_tool "context_create" '{"path":"invalid-doc"}' || echo '{"error":"failed"}')
assert_contains "$output" "error" "Error for missing title"

# Test 9: Error handling - read non-existent
run_test "Handle reading non-existent document"
output=$(call_tool "context_read" '{"path":"does-not-exist.md"}' || echo '{"error":"failed"}')
assert_contains "$output" "error" "Error for non-existent document"

# Clean up
cleanup_test_context

# Summary
print_summary