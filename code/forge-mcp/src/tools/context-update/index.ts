// ABOUTME: MCP tool handler for updating documents in the knowledge base
// ABOUTME: Provides context_update tool with content and metadata update capabilities

import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { IFileSystem } from '../../filesystem/IFileSystem.js';
import { PARAManager } from '../../para/PARAManager.js';
import {
  DocumentUpdater,
  DocumentUpdateError,
  DocumentUpdateErrorCode,
  DocumentMetadata,
  UpdateDocumentParams,
} from '../../updater/index.js';
import { partialDocumentFrontmatterSchema } from '../../models/schemas.js';

// Input schema for the tool
const ContextUpdateSchema = z.object({
  path: z.string().describe('File path relative to CONTEXT_ROOT'),
  content: z.string().optional().describe('New content for the document body'),
  metadata: partialDocumentFrontmatterSchema.optional().describe('Metadata fields to update'),
  replace_content: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to replace content entirely (true) or append (false)'),
  preserve_links: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to preserve existing wiki-links when replacing content'),
});

export type ContextUpdateInput = z.infer<typeof ContextUpdateSchema>;

/**
 * Creates the context_update tool handler
 */
export function createContextUpdateTool(_fileSystem: IFileSystem, _paraManager: PARAManager): Tool {
  return {
    name: 'context_update',
    description: "Update an existing document's content and/or metadata",
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to CONTEXT_ROOT',
        },
        content: {
          type: 'string',
          description: 'New content for the document body',
        },
        metadata: {
          type: 'object',
          description: 'Metadata fields to update',
          additionalProperties: true,
        },
        replace_content: {
          type: 'boolean',
          description: 'Whether to replace content entirely (true) or append (false)',
          default: false,
        },
        preserve_links: {
          type: 'boolean',
          description: 'Whether to preserve existing wiki-links when replacing content',
          default: true,
        },
      },
      required: ['path'],
    },
  };
}

/**
 * Handles the context_update tool execution
 */
export async function handleContextUpdate(
  params: unknown,
  fileSystem: IFileSystem,
  paraManager: PARAManager,
): Promise<unknown> {
  // Validate input
  const input = ContextUpdateSchema.parse(params);

  // Create updater
  const updater = new DocumentUpdater(fileSystem, paraManager);

  try {
    // Perform update
    const updateParams: UpdateDocumentParams = {
      path: input.path,
      replace_content: input.replace_content,
      preserve_links: input.preserve_links,
    };

    // Only add optional fields if they are defined
    if (input.content !== undefined) {
      updateParams.content = input.content;
    }
    if (input.metadata !== undefined) {
      updateParams.metadata = input.metadata as Partial<DocumentMetadata>;
    }

    const result = await updater.updateDocument(updateParams);

    // Return success response
    return {
      success: true,
      message: `Document updated successfully: ${input.path}`,
      document: {
        path: result.document.path,
        title: result.document.metadata.title,
        updated: result.document.metadata.modified || new Date().toISOString(),
      },
      changes: {
        content_updated: result.changes.content_updated,
        metadata_updated: result.changes.metadata_updated,
        links_preserved: result.changes.links_preserved,
        updated_fields: result.changes.updated_fields,
      },
    };
  } catch (error) {
    if (error instanceof DocumentUpdateError) {
      // Map specific error codes to user-friendly messages
      const errorMessages: Record<DocumentUpdateErrorCode, string> = {
        [DocumentUpdateErrorCode.DOCUMENT_NOT_FOUND]: 'Document does not exist',
        [DocumentUpdateErrorCode.INVALID_PATH]: 'Invalid document path',
        [DocumentUpdateErrorCode.INVALID_METADATA]: 'Invalid metadata format',
        [DocumentUpdateErrorCode.WRITE_FAILED]: 'Failed to save document',
        [DocumentUpdateErrorCode.VALIDATION_FAILED]: 'Update validation failed',
        [DocumentUpdateErrorCode.CONCURRENT_MODIFICATION]:
          'Document was modified by another process',
      };

      return {
        success: false,
        error: errorMessages[error.code] || error.message,
        code: error.code,
      };
    }

    // Generic error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
