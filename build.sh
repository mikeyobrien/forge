#!/bin/bash
# ABOUTME: Build script for para-ssg static site generator
# ABOUTME: Generates the static website from the context directory

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
INPUT_DIR="context"
OUTPUT_DIR="build"
CARGO_PATH="/Users/mobrienv/.cargo/bin/cargo"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--input)
            INPUT_DIR="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -i, --input DIR    Input directory (default: context)"
            echo "  -o, --output DIR   Output directory (default: build)"
            echo "  --clean            Clean output directory before building"
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

# Clean build directory if requested
if [ "$CLEAN_BUILD" = true ] && [ -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}Cleaning output directory...${NC}"
    rm -rf "$OUTPUT_DIR"
fi

# Check if cargo is available
if [ ! -f "$CARGO_PATH" ]; then
    echo -e "${RED}Error: Cargo not found at $CARGO_PATH${NC}"
    echo "Please install Rust and Cargo first."
    exit 1
fi

# Check if input directory exists
if [ ! -d "$INPUT_DIR" ]; then
    echo -e "${RED}Error: Input directory '$INPUT_DIR' not found${NC}"
    exit 1
fi

# Change to the static-site-generator directory
cd code/static-site-generator || {
    echo -e "${RED}Error: Could not find code/static-site-generator directory${NC}"
    exit 1
}

# Build the site
echo -e "${GREEN}Building static site...${NC}"
echo -e "Input: ${YELLOW}$INPUT_DIR${NC}"
echo -e "Output: ${YELLOW}$OUTPUT_DIR${NC}"
echo ""

# Run the generator
if $CARGO_PATH run -- "../../$INPUT_DIR" "../../$OUTPUT_DIR"; then
    cd ../..
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "Site generated at: ${YELLOW}$OUTPUT_DIR/${NC}"
    echo ""
    echo -e "To view the site, run: ${YELLOW}./serve.sh${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi