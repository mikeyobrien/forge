// ABOUTME: MCP server implementation for context management
// ABOUTME: Provides tools for managing documents in a PARA structure

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { handlePing, PingArgs } from './tools/ping';
import { handleContextCreate, contextCreateTool } from './tools/context-create/index';
import { handleContextRead, contextReadTool } from './tools/context-read/index';
import { createSearchTool } from './tools/context_search';
import { SearchEngine } from './search/index';
import { FileSystem } from './filesystem/FileSystem';
import { PARAManager } from './para/PARAManager';
import { configuration, ConfigurationError } from './config/index';

// Create server instance
const server = new Server(
  {
    name: 'context-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, () => {
  const tools = [
    {
      name: 'ping',
      description: 'Test the MCP server connection',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Optional message to echo back',
          },
        },
      },
    },
    contextCreateTool,
    contextReadTool,
  ];

  // Add search tool if initialized
  if (searchTool) {
    tools.push({
      name: searchTool.name,
      description: searchTool.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      inputSchema: searchTool.inputSchema as any,
    });
  }

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'ping': {
      const result = handlePing(args as PingArgs);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    }

    case 'context_create': {
      const result = await handleContextCreate(args);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    }

    case 'context_read': {
      const result = await handleContextRead(args);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    }

    case 'context_search': {
      if (!searchTool) {
        throw new Error('Search tool not initialized');
      }
      const result = await searchTool.execute(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Initialize search engine
let searchEngine: SearchEngine;
let searchTool: ReturnType<typeof createSearchTool> | undefined;

// Start the server
async function main(): Promise<void> {
  try {
    // Load and validate configuration
    const config = await configuration.load();
    console.error(`Configuration loaded successfully:`);
    console.error(`  CONTEXT_ROOT: ${config.contextRoot}`);
    console.error(`  Log level: ${config.logLevel}`);
    console.error(`  Environment: ${config.nodeEnv}`);

    // Initialize components
    const fileSystem = new FileSystem(config.contextRoot);
    const paraManager = new PARAManager(config.contextRoot, fileSystem);
    searchEngine = new SearchEngine(fileSystem, paraManager, config.contextRoot);

    // Initialize search engine
    await searchEngine.initialize();
    console.error('Search engine initialized');

    // Create search tool
    searchTool = createSearchTool(searchEngine);

    // Start the transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP server started successfully');
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`Configuration error: ${error.message}`);
      console.error(`Please check your environment variables and try again.`);
    } else {
      console.error('Failed to start server:', error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
