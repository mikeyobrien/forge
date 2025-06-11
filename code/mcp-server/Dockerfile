FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY start-mcp-container.sh ./

# Make script executable
RUN chmod +x start-mcp-container.sh

# Run the MCP server
CMD ["./start-mcp-container.sh"]