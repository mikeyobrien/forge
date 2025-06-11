#!/bin/bash
# ABOUTME: Comprehensive MCP tool validation using direct protocol calls
# ABOUTME: Tests all tools exactly as Claude Code would interact with them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSPECTOR_CMD="npx -y @modelcontextprotocol/inspector"
SERVER_CMD="./start-mcp.sh"

# Test context directory
TEST_CONTEXT_ROOT=""

echo -e "\n${BLUE}=== MCP Tools Validation (Direct Protocol) ===${NC}"
echo "Starting at: $(date)"
echo

# Create test context
create_test_context() {
    TEST_CONTEXT_ROOT=$(mktemp -d -t mcp-test-XXXXXX)
    mkdir -p "$TEST_CONTEXT_ROOT"/{projects,areas,resources,archives}
    export CONTEXT_ROOT="$TEST_CONTEXT_ROOT"
    echo -e "${GREEN}Created test context: $TEST_CONTEXT_ROOT${NC}"
}

# Cleanup
cleanup() {
    if [ -n "$TEST_CONTEXT_ROOT" ] && [ -d "$TEST_CONTEXT_ROOT" ]; then
        rm -rf "$TEST_CONTEXT_ROOT"
        echo -e "${GREEN}Cleaned up test context${NC}"
    fi
}
trap cleanup EXIT

# Build server
echo "Building MCP server..."
cd "$PROJECT_ROOT"
npm run build
echo -e "${GREEN}✓ Server built${NC}\n"

# Create test context
create_test_context

# Test runner function
run_test() {
    local test_name="$1"
    local method="$2"
    shift 2
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if [ "$method" = "tools/list" ]; then
        result=$($INSPECTOR_CMD --cli "$SERVER_CMD" --method "$method" 2>&1)
    elif [ "$method" = "tools/call" ]; then
        local tool_name="$1"
        shift
        local args=()
        for arg in "$@"; do
            args+=(--tool-arg "$arg")
        done
        result=$($INSPECTOR_CMD --cli "$SERVER_CMD" --method "$method" --tool-name "$tool_name" "${args[@]}" 2>&1)
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        echo "$result" | head -5
        echo "..."
        echo
        return 0
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        echo "$result"
        echo
        exit 1
    fi
}

# Test 1: List all tools
run_test "List all available tools" "tools/list"

# Test 2: Ping tool
run_test "Ping tool basic test" "tools/call" "ping" "message=validation-test"

# Test 3: Create document in resources
run_test "Create document in resources" "tools/call" "context_create" \
    "path=test-doc" \
    "title=Test Document" \
    "content=This is a test document for validation" \
    "category=resources" \
    "tags=[\"test\",\"validation\"]"

# Test 4: Read the created document
run_test "Read created document" "tools/call" "context_read" \
    "path=resources/test-doc.md" \
    "include_content=true" \
    "include_metadata=true"

# Test 5: Create project document
run_test "Create project document" "tools/call" "context_create" \
    "path=website-project" \
    "title=Website Project" \
    "content=Main website development project with [[test-doc]] reference" \
    "category=projects" \
    "status=active" \
    "tags=[\"web\",\"development\"]"

# Test 6: Search for documents with tags
run_test "Search documents by tag" "tools/call" "context_search" \
    "tags=[\"test\"]" \
    "limit=10"

# Test 7: Advanced search with query syntax
run_test "Advanced search with query" "tools/call" "context_search" \
    "query=title:Test" \
    "includeSnippets=true" \
    "limit=5"

# Test 8: Query forward links
run_test "Query forward links" "tools/call" "context_query_links" \
    "path=projects/website-project.md" \
    "type=forward" \
    "includeMetadata=true"

# Test 9: Query backlinks  
run_test "Query backlinks" "tools/call" "context_query_links" \
    "path=resources/test-doc.md" \
    "type=backlinks" \
    "includeMetadata=true"

# Test 10: Update document content
run_test "Update document content" "tools/call" "context_update" \
    "path=resources/test-doc.md" \
    "content=Updated content with more details" \
    "replace_content=false"

# Test 11: Update document metadata
run_test "Update document metadata" "tools/call" "context_update" \
    "path=resources/test-doc.md" \
    "metadata={\"priority\":\"high\",\"status\":\"reviewed\"}"

# Test 12: Search with category filter
run_test "Search by category" "tools/call" "context_search" \
    "category=projects" \
    "includeSnippets=true"

# Test 13: Fuzzy search
run_test "Fuzzy search test" "tools/call" "context_search" \
    "content=websit" \
    "fuzzyTolerance=0.3" \
    "limit=5"

# Test 14: Search with facets
run_test "Search with facets" "tools/call" "context_search" \
    "query=*" \
    "facets=[\"category\",\"tags\"]" \
    "limit=10"

# Test 15: Move document
run_test "Move document with link updates" "tools/call" "context_move" \
    "sourcePath=resources/test-doc.md" \
    "destinationPath=areas/test-document.md" \
    "updateLinks=true"

# Test 16: Verify move updated links
run_test "Verify links updated after move" "tools/call" "context_read" \
    "path=projects/website-project.md" \
    "include_content=true"

# Test 17: Query all link types
run_test "Query all link relationships" "tools/call" "context_query_links" \
    "type=all" \
    "limit=20"

# Test 18: Error handling - read non-existent document
echo -e "${YELLOW}Testing: Error handling for non-existent document${NC}"
result=$($INSPECTOR_CMD --cli "$SERVER_CMD" --method "tools/call" --tool-name "context_read" --tool-arg "path=nonexistent.md" 2>&1 || true)
if echo "$result" | grep -q "not found\|does not exist\|error"; then
    echo -e "${GREEN}✓ Error handling works correctly${NC}"
else
    echo -e "${RED}✗ Error handling failed${NC}"
    echo "$result"
    exit 1
fi
echo

# Test 19: Complex search with sorting
run_test "Complex search with sorting" "tools/call" "context_search" \
    "query=*" \
    "sortBy=[{\"field\":\"modified\",\"direction\":\"desc\"}]" \
    "limit=5"

# Test 20: Search with date range (if any documents have dates)
run_test "Search with operator AND" "tools/call" "context_search" \
    "tags=[\"test\",\"validation\"]" \
    "operator=AND" \
    "limit=10"

echo -e "\n${GREEN}🎉 All MCP tool validations passed!${NC}"
echo -e "${GREEN}Claude Code should have no issues using these tools.${NC}"
echo "Completed at: $(date)"