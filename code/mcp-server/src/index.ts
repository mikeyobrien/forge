// ABOUTME: MCP server implementation for context management
// ABOUTME: Provides tools for managing documents in a PARA structure

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';
import { handlePing, PingArgs } from './tools/ping';
import { handleContextCreate, contextCreateTool } from './tools/context-create/index';
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
  return {
    tools: [
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
    ],
  };
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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main(): Promise<void> {
  try {
    // Load and validate configuration
    const config = await configuration.load();
    console.error(`Configuration loaded successfully:`);
    console.error(`  CONTEXT_ROOT: ${config.contextRoot}`);
    console.error(`  Log level: ${config.logLevel}`);
    console.error(`  Environment: ${config.nodeEnv}`);

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
