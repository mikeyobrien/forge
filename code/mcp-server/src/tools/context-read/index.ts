// ABOUTME: Implementation of the context_read tool for reading documents
// ABOUTME: Handles document retrieval with frontmatter parsing and content extraction

import { z } from 'zod';
import { PARACategory, DocumentFrontmatter } from '../../models/types.js';
import { FrontmatterParser } from '../../parsers/frontmatter.js';
import { documentFrontmatterSchema } from '../../models/schemas.js';
import { FileSystem } from '../../filesystem/FileSystem.js';
import { BacklinkManager } from '../../backlinks/BacklinkManager.js';
import { getConfigSync } from '../../config/index.js';

/**
 * Input schema for the context_read tool
 */
export const contextReadArgsSchema = z.object({
  path: z.string().describe('File path relative to CONTEXT_ROOT (e.g., "projects/website.md")'),
  include_content: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include document content (default: true)'),
  include_metadata: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include parsed frontmatter metadata (default: true)'),
  include_backlinks: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include backlink information (default: false)'),
});

export type ContextReadArgs = z.infer<typeof contextReadArgsSchema>;

/**
 * Document data returned by the read operation
 */
export interface ReadDocument {
  id: string;
  title: string;
  content?: string;
  frontmatter?: DocumentFrontmatter;
  category: PARACategory;
  exists: boolean;
  backlinks?: {
    count: number;
    sources: Array<{
      path: string;
      linkText?: string;
      context?: string;
    }>;
  };
}

/**
 * Result of reading a document
 */
export interface ContextReadResult {
  success: boolean;
  document?: ReadDocument;
  message: string;
  error?: string;
}

/**
 * Handler for the context_read tool
 * Reads a document from the knowledge base and returns its content and metadata
 */
export async function handleContextRead(
  args: unknown,
  backlinkManager?: BacklinkManager,
): Promise<string> {
  try {
    // Validate arguments
    const validatedArgs = contextReadArgsSchema.parse(args);

    // Get configuration
    const config = getConfigSync();

    // Initialize file system
    const fileSystem = new FileSystem(config.contextRoot);

    // Normalize the path to ensure .md extension
    let normalizedPath = validatedArgs.path;
    if (!normalizedPath.endsWith('.md')) {
      normalizedPath += '.md';
    }

    // Check if file exists
    const exists = await fileSystem.exists(normalizedPath);
    if (!exists) {
      return JSON.stringify({
        success: false,
        message: `Document not found at: ${normalizedPath}`,
        error: 'FILE_NOT_FOUND',
      });
    }

    // Read the file content
    const rawContent = await fileSystem.readFile(normalizedPath);

    // Initialize the result document
    const document: ReadDocument = {
      id: normalizedPath,
      title: '',
      exists: true,
      category: PARACategory.Resources, // Default, will be updated
    };

    // Parse frontmatter if requested
    if (validatedArgs.include_metadata) {
      const parser = new FrontmatterParser();
      const parseResult = parser.parse(rawContent);

      if (parseResult.frontmatter) {
        // Validate and use the frontmatter
        const validationResult = documentFrontmatterSchema.safeParse(parseResult.frontmatter);
        if (validationResult.success) {
          // Clean up undefined optional fields to match the interface
          const cleanedFrontmatter: DocumentFrontmatter = Object.entries(
            validationResult.data,
          ).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          }, {} as DocumentFrontmatter);

          document.frontmatter = cleanedFrontmatter;
          document.title = validationResult.data.title;

          // Update category from frontmatter if available
          if (validationResult.data.category) {
            document.category = validationResult.data.category as PARACategory;
          }
        } else {
          // If validation fails, include raw frontmatter and add warning
          document.frontmatter = parseResult.frontmatter as DocumentFrontmatter;
          const titleValue = parseResult.frontmatter['title'];
          if (titleValue && typeof titleValue === 'string') {
            document.title = titleValue;
          }
        }
      }

      // Include content if requested
      if (validatedArgs.include_content) {
        document.content = parseResult.content;
      }
    } else if (validatedArgs.include_content) {
      // If metadata not requested but content is, return full raw content
      document.content = rawContent;
    }

    // Detect category from path if not already set from frontmatter
    if (!document.frontmatter?.category) {
      const pathParts = normalizedPath.split('/');
      if (pathParts.length > 0 && pathParts[0]) {
        const firstPart = pathParts[0].toLowerCase();
        if (Object.values(PARACategory).includes(firstPart as PARACategory)) {
          document.category = firstPart as PARACategory;
        }
      }
    }

    // If we still don't have a title, derive it from the filename
    if (!document.title) {
      const filename = normalizedPath.split('/').pop() || normalizedPath;
      document.title = filename.replace('.md', '').replace(/-/g, ' ');
    }

    // Include backlinks if requested and manager is available
    if (validatedArgs.include_backlinks && backlinkManager) {
      const fullPath = fileSystem.resolvePath(normalizedPath);
      const backlinksResult = backlinkManager.getBacklinks(fullPath, {
        includeContext: true,
        limit: 10,
      });

      document.backlinks = {
        count: backlinksResult.totalCount,
        sources: backlinksResult.backlinks.map((bl) => {
          const source: { path: string; linkText?: string; context?: string } = {
            path: bl.sourcePath,
          };
          if (bl.linkText !== undefined) {
            source.linkText = bl.linkText;
          }
          if (bl.context !== undefined) {
            source.context = bl.context;
          }
          return source;
        }),
      };
    }

    return JSON.stringify({
      success: true,
      document,
      message: `Successfully read document: ${normalizedPath}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return JSON.stringify({
        success: false,
        message: 'Invalid arguments provided',
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }

    return JSON.stringify({
      success: false,
      message: 'Failed to read document',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Tool definition for MCP
 */
export const contextReadTool = {
  name: 'context_read',
  description: 'Read a document from the knowledge base, including its content and metadata',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to CONTEXT_ROOT (e.g., "projects/website.md")',
      },
      include_content: {
        type: 'boolean',
        description: 'Whether to include document content (default: true)',
        default: true,
      },
      include_metadata: {
        type: 'boolean',
        description: 'Whether to include parsed frontmatter metadata (default: true)',
        default: true,
      },
      include_backlinks: {
        type: 'boolean',
        description: 'Whether to include backlink information (default: false)',
        default: false,
      },
    },
    required: ['path'],
  },
};
