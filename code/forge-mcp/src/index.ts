// ABOUTME: MCP server implementation for context management
// ABOUTME: Provides tools for managing documents in a PARA structure

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { handlePing, PingArgs } from './tools/ping';
import { handleContextCreate, contextCreateTool } from './tools/context-create/index';
import { handleContextRead, contextReadTool } from './tools/context-read/index';
import { createAdvancedSearchTool } from './tools/context_advanced_search';
import { queryLinks, contextQueryLinksToolDefinition } from './tools/context-query-links/index';
import { createContextUpdateTool, handleContextUpdate } from './tools/context-update/index';
import { createContextMoveTool } from './tools/context-move/index';
import { screenshotTool, handleScreenshot } from './tools/screenshot/index';
import { AdvancedSearchEngine } from './search/AdvancedSearchEngine';
import { FileSystem } from './filesystem/FileSystem';
import { PARAManager } from './para/PARAManager';
import { BacklinkManager } from './backlinks/BacklinkManager';
import { DocumentUpdater } from './updater/DocumentUpdater';
import { configuration, ConfigurationError } from './config/index';

// Create server instance
const server = new Server(
  {
    name: 'context-forge-mcp',
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
    contextQueryLinksToolDefinition,
    screenshotTool,
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

  // Add update tool if initialized
  if (contextUpdateTool) {
    tools.push({
      name: contextUpdateTool.name,
      description: contextUpdateTool.description || 'Update document content and metadata',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      inputSchema: contextUpdateTool.inputSchema as any,
    });
  }

  // Add move tool if initialized
  if (contextMoveTool) {
    tools.push({
      name: contextMoveTool.name,
      description: contextMoveTool.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      inputSchema: contextMoveTool.inputSchema as any,
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
      const result = await handleContextCreate(args, backlinkManager);
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
      const result = await handleContextRead(args, backlinkManager);
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

    case 'context_query_links': {
      const result = await queryLinks(args, fileSystem);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'context_update': {
      const result = await handleContextUpdate(args, fileSystem, paraManager);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'context_move': {
      if (!contextMoveTool) {
        throw new Error('Move tool not initialized');
      }
      if (!args) {
        throw new Error('Missing arguments');
      }
      return await contextMoveTool.handler({
        sourcePath: args['sourcePath'] as string,
        destinationPath: args['destinationPath'] as string,
        updateLinks: args['updateLinks'] as boolean,
        overwrite: args['overwrite'] as boolean,
      });
    }

    case 'screenshot_page': {
      console.error('Screenshot args received:', JSON.stringify(args));
      return await handleScreenshot(args || {});
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Initialize components
let fileSystem: FileSystem;
let paraManager: PARAManager;
let searchEngine: AdvancedSearchEngine;
let searchTool: ReturnType<typeof createAdvancedSearchTool> | undefined;
let backlinkManager: BacklinkManager;
let contextUpdateTool: ReturnType<typeof createContextUpdateTool> | undefined;
let contextMoveTool: ReturnType<typeof createContextMoveTool> | undefined;
let documentUpdater: DocumentUpdater;

// Start the server
async function main(): Promise<void> {
  try {
    // Load and validate configuration
    const config = await configuration.load();
    // Configuration loaded successfully - no output for stdio server

    // Initialize components
    fileSystem = new FileSystem(config.contextRoot);
    paraManager = new PARAManager(config.contextRoot, fileSystem);
    searchEngine = new AdvancedSearchEngine(fileSystem, paraManager, config.contextRoot);
    backlinkManager = new BacklinkManager(fileSystem, config.contextRoot);
    documentUpdater = new DocumentUpdater(fileSystem, paraManager);

    // Initialize search engine and backlink manager
    await searchEngine.initialize();
    await backlinkManager.initialize();
    // Search engine and backlink manager initialized

    // Create tools
    searchTool = createAdvancedSearchTool(searchEngine);
    contextUpdateTool = createContextUpdateTool(fileSystem, paraManager);
    contextMoveTool = createContextMoveTool(
      fileSystem,
      paraManager,
      backlinkManager,
      documentUpdater,
      config.contextRoot,
    );

    // Start the transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // MCP server started successfully
  } catch (error) {
    if (error instanceof ConfigurationError) {
      // Configuration error - exit silently for stdio server
      // Error details: ${error.message}
    } else {
      // Failed to start server - exit silently
    }
    process.exit(1);
  }
}

main().catch(() => {
  // Server error - exit silently for stdio server
  process.exit(1);
});
