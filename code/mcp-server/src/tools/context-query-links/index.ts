// ABOUTME: MCP tool handler for querying document links and backlinks
// ABOUTME: Provides bidirectional link queries and link analysis capabilities

import { z } from 'zod';
import { join } from 'path';
import { IFileSystem } from '../../filesystem/IFileSystem';
import { LinkIndexer, LinkQueryType, LinkQueryOptions } from '../../links';
import { getConfigSync } from '../../config';
import { validatePath } from '../../filesystem/security';

const QueryLinksArgsSchema = z.object({
  path: z.string().optional().describe('Document path to query links for'),
  type: z
    .enum(['forward', 'backlinks', 'orphaned', 'broken', 'all'])
    .default('all')
    .describe('Type of link query to perform'),
  includeMetadata: z.boolean().default(false).describe('Include document metadata in results'),
  includeBroken: z
    .boolean()
    .default(false)
    .describe('Include broken links in results (for forward/all queries)'),
  limit: z.number().min(1).max(100).default(20).describe('Maximum number of results to return'),
  offset: z.number().min(0).default(0).describe('Offset for pagination'),
});

export type QueryLinksArgs = z.infer<typeof QueryLinksArgsSchema>;

// Singleton indexer instance
let indexerInstance: LinkIndexer | null = null;

function getIndexer(fileSystem: IFileSystem): LinkIndexer {
  if (!indexerInstance) {
    const config = getConfigSync();
    indexerInstance = new LinkIndexer(config.contextRoot, fileSystem);
  }
  return indexerInstance;
}

export async function queryLinks(args: unknown, fileSystem: IFileSystem): Promise<unknown> {
  // Parse and validate arguments
  const parsedArgs = QueryLinksArgsSchema.parse(args);

  const config = getConfigSync();
  const indexer = getIndexer(fileSystem);

  // Resolve and validate path if provided
  let resolvedPath: string | undefined;
  if (parsedArgs.path) {
    // Validate the path is within context root
    const validatedPath = validatePath(parsedArgs.path, config.contextRoot);
    resolvedPath = join(config.contextRoot, validatedPath);

    // Check if document exists for specific queries
    if (
      (parsedArgs.type === 'forward' ||
        parsedArgs.type === 'backlinks' ||
        parsedArgs.type === 'all') &&
      !(await fileSystem.exists(resolvedPath))
    ) {
      throw new Error(`Document not found: ${parsedArgs.path}`);
    }
  } else if (parsedArgs.type === 'forward' || parsedArgs.type === 'backlinks') {
    throw new Error(`Path is required for ${parsedArgs.type} query type`);
  }

  // Perform the query - only include path if it's defined
  const queryOptions: LinkQueryOptions = {
    type: parsedArgs.type as LinkQueryType,
    includeMetadata: parsedArgs.includeMetadata,
    includeBroken: parsedArgs.includeBroken,
    limit: parsedArgs.limit,
    offset: parsedArgs.offset,
    ...(resolvedPath && { path: resolvedPath }),
  };

  const results = await indexer.query(queryOptions);

  // Format results for MCP response
  return {
    results,
    query: {
      type: parsedArgs.type,
      path: parsedArgs.path,
      limit: parsedArgs.limit,
      offset: parsedArgs.offset,
    },
    statistics: parsedArgs.type === 'all' && !parsedArgs.path ? indexer.getStatistics() : undefined,
  };
}

export const contextQueryLinksToolDefinition = {
  name: 'context_query_links',
  description: 'Query document links, backlinks, and link relationships',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'Document path relative to CONTEXT_ROOT (required for forward/backlinks queries)',
      },
      type: {
        type: 'string',
        enum: ['forward', 'backlinks', 'orphaned', 'broken', 'all'],
        default: 'all',
        description:
          'Type of link query: forward (outgoing links), backlinks (incoming links), orphaned (no backlinks), broken (non-existent targets), all (comprehensive)',
      },
      includeMetadata: {
        type: 'boolean',
        default: false,
        description: 'Include document metadata in results',
      },
      includeBroken: {
        type: 'boolean',
        default: false,
        description: 'Include broken links in results (for forward/all queries)',
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Maximum number of results',
      },
      offset: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Offset for pagination',
      },
    },
  },
};
