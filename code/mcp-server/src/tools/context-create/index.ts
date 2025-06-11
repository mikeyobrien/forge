// ABOUTME: Implementation of the context_create tool for creating new documents
// ABOUTME: Handles document creation with PARA categorization and frontmatter generation

import { z } from 'zod';
import { PARACategory, ProjectStatus, CreatePARADocumentParams } from '../../models/types.js';
import { createPARADocument } from '../../models/factories.js';
import { serializeDocument } from '../../parsers/serializer.js';
import { PARAManager } from '../../para/PARAManager.js';
import { FileSystem } from '../../filesystem/FileSystem.js';
import { BacklinkManager } from '../../backlinks/BacklinkManager.js';
import { getConfigSync } from '../../config/index.js';

/**
 * Input schema for the context_create tool
 */
export const contextCreateArgsSchema = z.object({
  path: z
    .string()
    .describe(
      'File path relative to CONTEXT_ROOT (e.g., "projects/new-website" or "areas/health/exercise-routine")',
    ),
  title: z.string().describe('Document title'),
  content: z.string().optional().describe('Initial document content'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  category: z
    .nativeEnum(PARACategory)
    .optional()
    .default(PARACategory.Resources)
    .describe('PARA category (defaults to resources)'),
  status: z.nativeEnum(ProjectStatus).optional().describe('Project status (only for projects)'),
  due_date: z.string().optional().describe('Due date in ISO format (only for projects)'),
  parent: z.string().optional().describe('Parent document path for hierarchical organization'),
});

export type ContextCreateArgs = z.infer<typeof contextCreateArgsSchema>;

/**
 * Result of creating a document
 */
export interface ContextCreateResult {
  success: boolean;
  path?: string;
  message: string;
  error?: string;
}

/**
 * Handler for the context_create tool
 * Creates a new document with proper PARA categorization and frontmatter
 */
export async function handleContextCreate(
  args: unknown,
  backlinkManager?: BacklinkManager,
): Promise<string> {
  try {
    // Validate arguments
    const validatedArgs = contextCreateArgsSchema.parse(args);

    // Get configuration
    const config = getConfigSync();

    // Initialize file system and PARA manager
    const fileSystem = new FileSystem(config.contextRoot);
    const paraManager = new PARAManager(config.contextRoot, fileSystem);

    // Ensure PARA structure exists
    await paraManager.initializeStructure();

    // Determine the full path based on category
    let fullPath: string;
    const { path: relativePath, category } = validatedArgs;

    // If path doesn't start with a category folder, prepend it
    const categoryPrefix = category + '/';
    if (!relativePath.startsWith(categoryPrefix)) {
      fullPath = categoryPrefix + relativePath;
    } else {
      fullPath = relativePath;
    }

    // Create the document object
    const documentParams: CreatePARADocumentParams = {
      path: fullPath,
      title: validatedArgs.title,
      category: validatedArgs.category,
    };

    // Add optional fields only if they exist
    if (validatedArgs.content !== undefined) {
      documentParams.content = validatedArgs.content;
    }
    if (validatedArgs.tags !== undefined) {
      documentParams.tags = validatedArgs.tags;
    }
    if (validatedArgs.status !== undefined) {
      documentParams.status = validatedArgs.status;
    }
    if (validatedArgs.due_date !== undefined) {
      documentParams.due_date = validatedArgs.due_date;
    }
    if (validatedArgs.parent !== undefined) {
      documentParams.parent = validatedArgs.parent;
    }

    const document = createPARADocument(documentParams);

    // Check if file already exists
    const normalizedPath = document.id;
    if (await fileSystem.exists(normalizedPath)) {
      return JSON.stringify({
        success: false,
        message: `Document already exists at: ${normalizedPath}`,
        error: 'FILE_EXISTS',
      });
    }

    // Ensure parent directory exists
    const parentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
    if (parentDir) {
      await fileSystem.mkdir(parentDir, true);
    }

    // Serialize document to markdown
    const markdown = serializeDocument(document);

    // Write the file
    await fileSystem.writeFile(normalizedPath, markdown);

    // Update backlinks if manager is available
    if (backlinkManager && document.content) {
      await backlinkManager.updateDocumentLinks(normalizedPath, document.content);
    }

    return JSON.stringify({
      success: true,
      path: normalizedPath,
      message: `Successfully created document at: ${normalizedPath}`,
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
      message: 'Failed to create document',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Tool definition for MCP
 */
export const contextCreateTool = {
  name: 'context_create',
  description: 'Create a new document in the knowledge base with PARA categorization',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'File path relative to CONTEXT_ROOT (e.g., "projects/new-website" or "areas/health/exercise-routine")',
      },
      title: {
        type: 'string',
        description: 'Document title',
      },
      content: {
        type: 'string',
        description: 'Initial document content',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Tags for categorization',
      },
      category: {
        type: 'string',
        enum: Object.values(PARACategory),
        description: 'PARA category (projects, areas, resources, archives)',
        default: PARACategory.Resources,
      },
      status: {
        type: 'string',
        enum: Object.values(ProjectStatus),
        description: 'Project status (only for projects)',
      },
      due_date: {
        type: 'string',
        description: 'Due date in ISO format (only for projects)',
      },
      parent: {
        type: 'string',
        description: 'Parent document path for hierarchical organization',
      },
    },
    required: ['path', 'title'],
  },
};
