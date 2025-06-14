#!/bin/bash
# ABOUTME: Integration tests using Claude CLI in headless mode
# ABOUTME: Tests MCP server tools through actual Claude interactions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Run Claude with a prompt
run_claude() {
    local prompt="$1"
    CONTEXT_ROOT="$TEST_CONTEXT_ROOT" claude -p "$prompt" 2>&1
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

# Check if output does not contain string
assert_not_contains() {
    local output="$1"
    local unexpected="$2"
    local message="$3"
    
    if echo "$output" | grep -q "$unexpected"; then
        echo -e "${RED}✗ $message${NC}"
        echo "Did not expect to find: $unexpected"
        echo "Actual output: $output"
        exit 1
    else
        echo -e "${GREEN}✓ $message${NC}"
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
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Server build completed${NC}"
else
    echo -e "${RED}✗ Server build failed${NC}"
    exit 1
fi

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude CLI not found. Please install it first.${NC}"
    exit 1
fi

# Start tests
echo -e "\n${BLUE}=== MCP Server Integration Tests (Claude CLI) ===${NC}"
echo "Starting at: $(date)"

# Create test context
create_test_context

# Test 1: Ping tool
run_test "Ping tool via Claude"
output=$(run_claude "Use the ping tool with message 'hello-claude' and show me the raw response")
assert_contains "$output" "hello-claude" "Ping message echoed"
assert_contains "$output" "timestamp" "Timestamp included"
assert_not_contains "$output" "error" "No errors occurred"

# Test 2: Create document
run_test "Create document via Claude"
output=$(run_claude "Create a new document called 'test-project' with title 'Integration Test Project' and content 'This is a test project created by Claude.' Add tags: test, integration")
assert_contains "$output" "success" "Document created successfully"
assert_contains "$output" "test-project.md" "Correct filename"
assert_not_contains "$output" "error" "No errors occurred"

# Test 3: Read document
run_test "Read document via Claude"
output=$(run_claude "Read the document at path 'resources/test-project.md' and show me its content and metadata")
assert_contains "$output" "Integration Test Project" "Title found"
assert_contains "$output" "This is a test project created by Claude" "Content found"
assert_contains "$output" "test" "Tags found"

# Test 4: Search documents
run_test "Search documents via Claude"
output=$(run_claude "Search for all documents with the tag 'test' and list their titles")
assert_contains "$output" "Integration Test Project" "Found test document"
assert_contains "$output" "total" "Search results returned"

# Test 5: Create project with PARA categorization
run_test "Create project in specific PARA category"
output=$(run_claude "Create a new project called 'website-redesign' with title 'Website Redesign 2025' in the projects category. Set status to active and add tags: web, design")
assert_contains "$output" "projects/website-redesign.md" "Created in projects category"
assert_contains "$output" "success" "Creation successful"

# Test 6: Complex search
run_test "Complex search with multiple criteria"
output=$(run_claude "Search for all documents in the 'projects' category that have status 'active'. Show me the results.")
assert_contains "$output" "Website Redesign 2025" "Found active project"
assert_not_contains "$output" "Integration Test Project" "Resource not in projects"

# Test 7: Create document with wiki-links
run_test "Create document with wiki-links"
output=$(run_claude "Create a document called 'knowledge-base' with content that includes wiki-links to [[test-project]] and [[website-redesign]]")
assert_contains "$output" "success" "Document created"
assert_contains "$output" "[[test-project]]" "Wiki-links preserved"

# Test 8: Error handling
run_test "Handle errors gracefully"
output=$(run_claude "Try to read a document that doesn't exist at path 'nonexistent.md' and tell me what happens")
assert_contains "$output" "not found\|does not exist\|error" "Error handled"

# Test 9: List all documents
run_test "List all documents in context"
output=$(run_claude "Search for all documents (no filters) and list them with their categories")
assert_contains "$output" "resources" "Resources category shown"
assert_contains "$output" "projects" "Projects category shown"
assert_contains "$output" "Integration Test Project" "Test project listed"
assert_contains "$output" "Website Redesign" "Website project listed"

# Clean up
cleanup_test_context

# Summary
print_summary
echo
echo "Completed at: $(date)"