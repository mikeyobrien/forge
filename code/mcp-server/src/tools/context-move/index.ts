// ABOUTME: MCP tool for moving documents between locations with link updates
// ABOUTME: Provides atomic document movement with automatic referential integrity

import { z } from 'zod';
import { IFileSystem } from '../../filesystem/index.js';
import { PARAManager } from '../../para/index.js';
import { BacklinkManager } from '../../backlinks/index.js';
import { DocumentUpdater } from '../../updater/index.js';
import { DocumentMover } from '../../mover/index.js';
import { logger } from '../../utils/logger.js';

// Input schema for the move tool
const moveInputSchema = z.object({
  sourcePath: z.string().min(1, 'Source path is required'),
  destinationPath: z.string().min(1, 'Destination path is required'),
  updateLinks: z.boolean().default(true).describe('Whether to update incoming wiki-links'),
  overwrite: z.boolean().default(false).describe('Whether to overwrite existing destination')
});

type MoveInput = z.infer<typeof moveInputSchema>;

/**
 * Create the context_move tool handler
 */
export function createContextMoveTool(
  fs: IFileSystem,
  para: PARAManager,
  backlinks: BacklinkManager,
  updater: DocumentUpdater,
  contextRoot: string
) {
  const mover = new DocumentMover(fs, para, backlinks, updater, contextRoot);

  return {
    name: 'context_move',
    description: 'Move a document to a new location, optionally updating all incoming wiki-links',
    inputSchema: moveInputSchema,
    handler: async (input: MoveInput) => {
      logger.info('context_move tool invoked', { input });

      try {
        // Validate input
        const validatedInput = moveInputSchema.parse(input);

        // Perform the move
        const result = await mover.moveDocument(
          validatedInput.sourcePath,
          validatedInput.destinationPath,
          {
            updateLinks: validatedInput.updateLinks,
            overwrite: validatedInput.overwrite
          }
        );

        // Format the response
        const response = {
          success: true,
          oldPath: result.oldPath,
          newPath: result.newPath,
          ...(result.oldCategory && { oldCategory: result.oldCategory }),
          ...(result.newCategory && { newCategory: result.newCategory }),
          linksUpdated: result.totalLinksUpdated,
          updatedDocuments: result.updatedLinks.map(update => ({
            path: update.documentPath,
            linksUpdated: update.linksUpdated
          }))
        };

        logger.info('Document moved successfully', {
          from: result.oldPath,
          to: result.newPath,
          linksUpdated: result.totalLinksUpdated
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: formatMoveResult(response)
            }
          ]
        };

      } catch (error) {
        logger.error('Failed to move document:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to move document: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  };
}

/**
 * Format the move result for display
 */
function formatMoveResult(result: {
  success: boolean;
  oldPath: string;
  newPath: string;
  oldCategory?: string;
  newCategory?: string;
  linksUpdated: number;
  updatedDocuments: Array<{ path: string; linksUpdated: number }>;
}): string {
  const lines: string[] = [];

  lines.push('# Document Move Result\n');
  lines.push(`✅ Successfully moved document\n`);
  lines.push(`**From:** \`${result.oldPath}\``);
  lines.push(`**To:** \`${result.newPath}\`\n`);

  if (result.oldCategory && result.newCategory) {
    lines.push(`**Category Change:** ${result.oldCategory} → ${result.newCategory}\n`);
  }

  if (result.linksUpdated > 0) {
    lines.push(`## Link Updates\n`);
    lines.push(`Updated ${result.linksUpdated} link${result.linksUpdated === 1 ? '' : 's'} across ${result.updatedDocuments.length} document${result.updatedDocuments.length === 1 ? '' : 's'}:\n`);
    
    for (const doc of result.updatedDocuments) {
      lines.push(`- \`${doc.path}\`: ${doc.linksUpdated} link${doc.linksUpdated === 1 ? '' : 's'} updated`);
    }
  } else {
    lines.push(`## No Link Updates Required\n`);
    lines.push(`No documents were linking to the moved file.`);
  }

  return lines.join('\n');
}