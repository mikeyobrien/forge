// ABOUTME: Core class for moving documents between locations with link updates
// ABOUTME: Handles atomic moves with rollback support and referential integrity

import { IFileSystem } from '../filesystem/index.js';
import { PARAManager } from '../para/index.js';
import { BacklinkManager } from '../backlinks/index.js';
import { DocumentUpdater } from '../updater/index.js';
import { parseWikiLinks, WikiLink } from '../parser/index.js';
import { FrontmatterParser } from '../parsers/index.js';
import { 
  MoveOptions, 
  MoveResult, 
  LinkUpdate, 
  MoveValidation,
  DocumentMoveError,
  RollbackState 
} from './types.js';
import { join, dirname, basename, extname } from 'path';

export class DocumentMover {
  private readonly frontmatterParser: FrontmatterParser;

  constructor(
    private readonly fs: IFileSystem,
    private readonly para: PARAManager,
    private readonly backlinks: BacklinkManager,
    _updater: DocumentUpdater, // Reserved for future use
    private readonly contextRoot: string
  ) {
    this.frontmatterParser = new FrontmatterParser();
  }


  /**
   * Move a document from source to destination with automatic link updates
   */
  async moveDocument(
    sourcePath: string,
    destinationPath: string,
    options: MoveOptions = {}
  ): Promise<MoveResult> {
    const { updateLinks = true, overwrite = false } = options;

    // Validate the move operation
    const validation = await this.validateMove(sourcePath, destinationPath, overwrite);
    if (!validation.isValid) {
      throw new DocumentMoveError(
        validation.error || 'Invalid move operation',
        'INVALID_PATH'
      );
    }

    const resolvedSource = validation.resolvedSource!;
    const resolvedDest = validation.resolvedDestination!;

    // Initialize rollback state
    const rollbackState: RollbackState = {
      originalPath: resolvedSource,
      originalContent: '',
      modifiedDocuments: []
    };

    try {
      // Read the source document
      rollbackState.originalContent = await this.fs.readFile(resolvedSource);

      // Prepare the result
      const result: MoveResult = {
        oldPath: resolvedSource,
        newPath: resolvedDest,
        updatedLinks: [],
        totalLinksUpdated: 0
      };

      // Check if this is a cross-category move
      const oldCategory = this.para.getDocumentCategory(resolvedSource);
      const newCategory = this.para.getDocumentCategory(resolvedDest);
      
      // Debug: console.log('Categories:', { oldCategory, newCategory, resolvedSource, resolvedDest });
      
      if (oldCategory && newCategory) {
        if (oldCategory !== newCategory) {
          result.oldCategory = oldCategory;
          result.newCategory = newCategory;
        }
      }

      // Update links if requested
      if (updateLinks) {
        const linkUpdates = await this.updateIncomingLinks(
          resolvedSource, 
          resolvedDest,
          rollbackState
        );
        result.updatedLinks = linkUpdates;
        result.totalLinksUpdated = linkUpdates.reduce(
          (sum, update) => sum + update.linksUpdated, 
          0
        );
      }

      // Perform the actual file move
      await this.performFileMove(resolvedSource, resolvedDest);

      // Update the document's metadata if it's a cross-category move
      if (result.oldCategory && result.newCategory && result.oldCategory !== result.newCategory) {
        await this.updateDocumentCategory(resolvedDest, result.newCategory);
      }

      // Update backlink indexes
      await this.backlinks.handleDocumentMove(resolvedSource, resolvedDest);

      return result;

    } catch (error) {
      // Attempt rollback on failure
      await this.rollbackMove(rollbackState);
      
      if (error instanceof DocumentMoveError) {
        throw error;
      }
      
      throw new DocumentMoveError(
        `Failed to move document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LINK_UPDATE_FAILED',
        error
      );
    }
  }

  /**
   * Validate that a move operation is allowed
   */
  private async validateMove(
    sourcePath: string,
    destinationPath: string,
    overwrite: boolean
  ): Promise<MoveValidation> {
    // Resolve paths relative to context root
    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedDest = this.resolvePath(destinationPath);

    // Security check - ensure paths are within context root
    if (!resolvedSource.startsWith(this.contextRoot)) {
      return {
        isValid: false,
        error: `Source path is outside context root: ${sourcePath}`
      };
    }

    if (!resolvedDest.startsWith(this.contextRoot)) {
      return {
        isValid: false,
        error: `Destination path is outside context root: ${destinationPath}`
      };
    }

    // Check if source exists
    if (!await this.fs.exists(resolvedSource)) {
      return {
        isValid: false,
        error: `Source document not found: ${sourcePath}`
      };
    }

    // Check if destination exists
    if (!overwrite && await this.fs.exists(resolvedDest)) {
      return {
        isValid: false,
        error: `Destination already exists: ${destinationPath}`
      };
    }

    // Ensure destination directory exists
    const destDir = dirname(resolvedDest);
    if (!await this.fs.exists(destDir)) {
      await this.fs.mkdir(destDir, true);
    }

    return {
      isValid: true,
      resolvedSource,
      resolvedDestination: resolvedDest,
      isCrossCategory: this.para.getDocumentCategory(resolvedSource) !== 
                       this.para.getDocumentCategory(resolvedDest)
    };
  }

  /**
   * Update all documents that link to the moved document
   */
  private async updateIncomingLinks(
    oldPath: string,
    newPath: string,
    rollbackState: RollbackState
  ): Promise<LinkUpdate[]> {
    const updates: LinkUpdate[] = [];
    
    // Get all documents that link to the old path
    const backlinks = await this.backlinks.getBacklinks(oldPath);
    
    for (const linkingDocPath of backlinks) {
      try {
        // Read the linking document
        const content = await this.fs.readFile(linkingDocPath);
        
        // Store original content for rollback
        rollbackState.modifiedDocuments.push({
          path: linkingDocPath,
          originalContent: content
        });

        // Extract wiki links
        const links = parseWikiLinks(content);
        
        // Find links that point to the old path
        const relevantLinks = links.filter((link: WikiLink) => {
          const resolvedTarget = this.resolveWikiLink(link.target, dirname(linkingDocPath));
          // Debug: console.log('Checking link:', link.target, 'resolved to:', resolvedTarget, 'against:', oldPath);
          return resolvedTarget === oldPath;
        });

        if (relevantLinks.length === 0) {
          continue;
        }

        // Calculate the new link target
        const newLinkTarget = this.calculateNewLinkTarget(oldPath, newPath, linkingDocPath);
        
        // Replace links in content
        let updatedContent = content;
        const oldLinks: string[] = [];
        const newLinks: string[] = [];
        
        for (const link of relevantLinks) {
          const oldLinkText = link.raw;
          const newLinkText = link.displayText 
            ? `[[${newLinkTarget}|${link.displayText}]]`
            : `[[${newLinkTarget}]]`;
          
          updatedContent = updatedContent.replace(oldLinkText, newLinkText);
          oldLinks.push(oldLinkText);
          newLinks.push(newLinkText);
        }

        // Save the updated document
        await this.fs.writeFile(linkingDocPath, updatedContent);

        updates.push({
          documentPath: linkingDocPath,
          linksUpdated: relevantLinks.length,
          oldLinks,
          newLinks
        });

      } catch (error) {
        throw new DocumentMoveError(
          `Failed to update links in ${linkingDocPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'LINK_UPDATE_FAILED',
          error
        );
      }
    }

    return updates;
  }

  /**
   * Perform the actual file move operation
   */
  private async performFileMove(source: string, destination: string): Promise<void> {
    const content = await this.fs.readFile(source);
    await this.fs.writeFile(destination, content);
    await this.fs.unlink(source);
  }

  /**
   * Update document's category in frontmatter after cross-category move
   */
  private async updateDocumentCategory(path: string, newCategory: string): Promise<void> {
    const content = await this.fs.readFile(path);
    const parsed = this.frontmatterParser.parse(content);
    
    // Update category in frontmatter
    const updatedFrontmatter = {
      ...parsed.frontmatter,
      category: newCategory
    };

    // Serialize back to content
    const { serializeDocument } = await import('../parsers/index.js');
    const updatedContent = serializeDocument({
      path: path,
      content: parsed.content,
      metadata: updatedFrontmatter
    });
    await this.fs.writeFile(path, updatedContent);
  }

  /**
   * Rollback a failed move operation
   */
  private async rollbackMove(state: RollbackState): Promise<void> {
    try {
      // Restore modified documents
      for (const doc of state.modifiedDocuments) {
        await this.fs.writeFile(doc.path, doc.originalContent);
      }

      // If the original file was moved/deleted, restore it
      if (state.originalContent && !await this.fs.exists(state.originalPath)) {
        await this.fs.writeFile(state.originalPath, state.originalContent);
      }
    } catch (error) {
      throw new DocumentMoveError(
        `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ROLLBACK_FAILED',
        error
      );
    }
  }

  /**
   * Resolve a path relative to context root
   */
  private resolvePath(path: string): string {
    // If path doesn't have an extension, assume .md
    if (!extname(path)) {
      path = `${path}.md`;
    }

    // If path is already absolute and within context root, use it
    if (path.startsWith(this.contextRoot)) {
      return path;
    }

    // Otherwise, resolve relative to context root
    return join(this.contextRoot, path);
  }

  /**
   * Resolve a wiki link target to an absolute path
   */
  private resolveWikiLink(target: string, fromDir: string): string {
    // Add .md extension if not present
    if (!extname(target)) {
      target = `${target}.md`;
    }

    // If target is absolute, return it
    if (target.startsWith('/')) {
      return join(this.contextRoot, target.slice(1));
    }

    // Otherwise resolve relative to the linking document's directory
    return join(fromDir, target);
  }

  /**
   * Calculate the new link target for updating wiki links
   */
  private calculateNewLinkTarget(
    _oldPath: string, 
    newPath: string, 
    linkingDocPath: string
  ): string {
    // Get relative paths from context root
    const newRelative = newPath.replace(this.contextRoot + '/', '');
    const linkingRelative = linkingDocPath.replace(this.contextRoot + '/', '');

    // Remove .md extension for wiki links
    const newTarget = newRelative.replace(/\.md$/, '');

    // If the linking document is in the same directory as the new location,
    // we can use just the filename
    if (dirname(newRelative) === dirname(linkingRelative)) {
      return basename(newTarget);
    }

    // Otherwise, use the full path from root
    return '/' + newTarget;
  }
}