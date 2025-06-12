#!/bin/bash
# ABOUTME: Simple script to serve the generated static website
# ABOUTME: Provides easy access to view the para-ssg output

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PORT=8080
BUILD_DIR="build"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -d|--dir)
            BUILD_DIR="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -p, --port PORT    Port to serve on (default: 8080)"
            echo "  -d, --dir DIR      Directory to serve (default: build)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}Build directory not found at '$BUILD_DIR'${NC}"
    echo -e "${YELLOW}Running site generation first...${NC}"
    
    # Run the static site generator
    cd code/static-site-generator
    /Users/mobrienv/.cargo/bin/cargo run -- ../../context ../../build
    cd ../..
fi

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}Starting web server...${NC}"
    echo -e "${BLUE}➜ Local:${NC} http://localhost:${PORT}"
    echo -e "${BLUE}➜ Network:${NC} http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):${PORT}"
    echo -e "\n${YELLOW}Press Ctrl+C to stop the server${NC}\n"
    
    # Start the server
    cd "$BUILD_DIR" && python3 -m http.server "$PORT"
else
    echo -e "${YELLOW}Python 3 not found. Trying alternative methods...${NC}"
    
    # Try Node.js http-server
    if command -v npx &> /dev/null; then
        echo -e "${GREEN}Starting web server with Node.js...${NC}"
        cd "$BUILD_DIR" && npx -y http-server -p "$PORT" -o
    else
        # Fallback to just opening the file
        echo -e "${YELLOW}No suitable web server found. Opening index.html directly...${NC}"
        open "$BUILD_DIR/index.html"
    fi
fi