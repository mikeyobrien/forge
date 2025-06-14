// ABOUTME: Core document update logic with link preservation and metadata merging
// ABOUTME: Handles atomic updates to documents in the knowledge base

import { IFileSystem } from '../filesystem/IFileSystem.js';
import { PARAManager } from '../para/PARAManager.js';
import { parseWikiLinks } from '../parser/wiki-link.js';
import { parseFrontmatter, serializeDocument } from '../parsers/index.js';
import { partialDocumentFrontmatterSchema } from '../models/schemas.js';
import {
  Document,
  DocumentMetadata,
  UpdateDocumentParams,
  UpdateResult,
  UpdateChangeSummary,
  MetadataMergeOptions,
  DocumentUpdateError,
  DocumentUpdateErrorCode,
} from './types.js';

export class DocumentUpdater {
  constructor(
    private readonly fileSystem: IFileSystem,
    _paraManager: PARAManager, // Reserved for future use
  ) {}

  /**
   * Updates a document with new content and/or metadata
   */
  async updateDocument(params: UpdateDocumentParams): Promise<UpdateResult> {
    // Normalize the path to ensure .md extension
    let normalizedPath = params.path;
    if (!normalizedPath.endsWith('.md')) {
      normalizedPath += '.md';
    }

    // Read existing document
    let existingContent: string;
    try {
      existingContent = await this.fileSystem.readFile(normalizedPath);
    } catch (_error) {
      throw new DocumentUpdateError(
        `Document not found: ${params.path}`,
        DocumentUpdateErrorCode.DOCUMENT_NOT_FOUND,
      );
    }

    // Parse existing document
    const parsed = parseFrontmatter(existingContent);
    const existingDoc: Document = {
      ...parsed,
      path: params.path,
      metadata: parsed.metadata as DocumentMetadata,
    };

    // Validate update
    this.validateUpdate(existingDoc, params);

    // Prepare changes summary
    const changes: UpdateChangeSummary = {
      content_updated: false,
      metadata_updated: false,
      links_preserved: 0,
      updated_fields: [],
    };

    // Update content if provided
    let newContent = existingDoc.content;
    if (params.content !== undefined) {
      if (params.replace_content) {
        // Preserve links if requested
        if (params.preserve_links !== false) {
          const preservedLinks = this.preserveWikiLinks(existingDoc.content, params.content);
          newContent = preservedLinks.content;
          changes.links_preserved = preservedLinks.count;
        } else {
          newContent = params.content;
        }
      } else {
        // Append content
        newContent = existingDoc.content + '\n\n' + params.content;
      }
      changes.content_updated = true;
    }

    // Update metadata if provided
    let newMetadata = existingDoc.metadata;
    if (params.metadata) {
      const mergeResult = this.mergeMetadata(existingDoc.metadata, params.metadata);
      newMetadata = mergeResult.metadata;
      changes.updated_fields = mergeResult.updatedFields;
      changes.metadata_updated = changes.updated_fields.length > 0;
    }

    // Create updated document
    const updatedDoc: Document = {
      path: params.path,
      content: newContent,
      metadata: newMetadata,
    };

    // Serialize and write
    const serialized = serializeDocument(updatedDoc);
    try {
      await this.fileSystem.writeFile(normalizedPath, serialized);
    } catch (error) {
      throw new DocumentUpdateError(
        `Failed to write document: ${String(error)}`,
        DocumentUpdateErrorCode.WRITE_FAILED,
      );
    }

    return {
      success: true,
      document: updatedDoc,
      changes,
    };
  }

  /**
   * Preserves wiki-links from old content when replacing with new content
   */
  preserveWikiLinks(oldContent: string, newContent: string): { content: string; count: number } {
    // Extract links from old content
    const oldLinks = parseWikiLinks(oldContent);
    if (oldLinks.length === 0) {
      return { content: newContent, count: 0 };
    }

    // Extract links from new content to avoid duplicates
    const newLinks = parseWikiLinks(newContent);
    const newLinkTargets = new Set(newLinks.map((link) => link.target));

    // Find links to preserve (not already in new content)
    const linksToPreserve = oldLinks.filter((link) => !newLinkTargets.has(link.target));

    if (linksToPreserve.length === 0) {
      return { content: newContent, count: 0 };
    }

    // Append preserved links section
    const preservedSection =
      '\n\n## Preserved Links\n\n' +
      linksToPreserve
        .map((link) => {
          let linkText = link.target;
          if (link.anchor) {
            linkText += '#' + link.anchor;
          }
          if (link.displayText) {
            linkText += '|' + link.displayText;
          }
          return `- [[${linkText}]]`;
        })
        .join('\n');

    return {
      content: newContent + preservedSection,
      count: linksToPreserve.length,
    };
  }

  /**
   * Merges existing metadata with updates
   */
  mergeMetadata(
    existing: DocumentMetadata,
    updates: Partial<DocumentMetadata>,
    options: MetadataMergeOptions = {},
  ): { metadata: DocumentMetadata; updatedFields: string[] } {
    const merged = { ...existing };
    const updatedFields: string[] = [];

    // Handle each update field
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;

      // Handle null values (removal)
      if (value === null && options.allow_removal) {
        // Use type assertion to satisfy eslint
        (merged as Record<string, unknown>)[key] = undefined;
        updatedFields.push(key);
        continue;
      }

      // Handle arrays
      if (Array.isArray(value) && Array.isArray(existing[key as keyof DocumentMetadata])) {
        if (options.append_arrays) {
          // Append unique values
          const existingArray = existing[key as keyof DocumentMetadata] as unknown[];
          const safeNewValues = value as unknown[];
          const newValues = safeNewValues.filter((v) => !existingArray.includes(v));
          (merged[key as keyof DocumentMetadata] as unknown[]) = [...existingArray, ...newValues];
        } else {
          // Replace array
          merged[key as keyof DocumentMetadata] = value;
        }
        updatedFields.push(key);
        continue;
      }

      // Handle regular values
      if (existing[key as keyof DocumentMetadata] !== value) {
        merged[key as keyof DocumentMetadata] = value;
        updatedFields.push(key);
      }
    }

    // Preserve required fields that shouldn't be updated
    merged.title = existing.title; // Title should not change via update
    if (existing.created) {
      merged.created = existing.created; // Creation date is immutable
    }

    return { metadata: merged, updatedFields };
  }

  /**
   * Validates that an update is valid
   */
  private validateUpdate(_document: Document, params: UpdateDocumentParams): void {
    // Validate metadata if provided
    if (params.metadata) {
      try {
        // Validate only the update metadata, not the full merged result
        partialDocumentFrontmatterSchema.parse(params.metadata);
      } catch (error) {
        throw new DocumentUpdateError(
          `Invalid metadata format: ${String(error)}`,
          DocumentUpdateErrorCode.INVALID_METADATA,
        );
      }
    }

    // Validate content requirements
    if (params.content !== undefined && params.content.length === 0 && params.replace_content) {
      throw new DocumentUpdateError(
        'Cannot replace content with empty string',
        DocumentUpdateErrorCode.VALIDATION_FAILED,
      );
    }
  }
}
