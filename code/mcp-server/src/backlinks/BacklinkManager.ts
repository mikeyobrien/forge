// ABOUTME: Core backlink tracking and management functionality
// ABOUTME: Handles indexing, querying, and persistence of document relationships

import { IFileSystem } from '../filesystem/IFileSystem';
import { parseWikiLinks } from '../parser/wiki-link';
import { logger } from '../utils/logger';
import {
  BacklinkEntry,
  BacklinkIndex,
  BacklinkQueryOptions,
  BacklinkQueryResult,
  BacklinkStats,
  LinkExtractionOptions,
  LinkExtractionResult,
  PersistedBacklinkIndex,
} from './types';
import path from 'path';

/**
 * Manages backlink tracking for documents in the knowledge base
 */
export class BacklinkManager {
  private index: BacklinkIndex = {};
  private indexPath: string;
  private isDirty = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private readonly SAVE_DEBOUNCE_MS = 1000;
  private readonly INDEX_VERSION = '1.0.0';

  constructor(
    private fileSystem: IFileSystem,
    private contextRoot: string,
  ) {
    this.indexPath = path.join(contextRoot, '.index', 'backlinks.json');
  }

  /**
   * Initialize the backlink manager and load existing index
   */
  async initialize(): Promise<void> {
    logger.debug('Initializing BacklinkManager');

    // Ensure index directory exists
    const indexDir = path.dirname(this.indexPath);
    if (!(await this.fileSystem.exists(indexDir))) {
      await this.fileSystem.mkdir(indexDir, true);
    }

    // Load existing index if available
    await this.loadIndex();
  }

  /**
   * Extract links from a document
   */
  async extractLinks(
    documentPath: string,
    content: string,
    options?: Partial<LinkExtractionOptions>,
  ): Promise<LinkExtractionResult> {
    const opts: LinkExtractionOptions = {
      basePath: path.dirname(documentPath),
      validateTargets: false,
      includeCodeBlocks: false,
      contextLength: 50,
      ...options,
    };

    const result: LinkExtractionResult = {
      sourcePath: documentPath,
      links: [],
      errors: [],
    };

    try {
      // Extract wiki links
      const wikiLinks = parseWikiLinks(content);
      const lines = content.split('\n');

      for (const wikiLink of wikiLinks) {
        // Find line number
        let charCount = 0;
        let lineNumber = 1;
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i]?.length ?? 0;
          if (charCount + lineLength >= wikiLink.position.start) {
            lineNumber = i + 1;
            break;
          }
          charCount += lineLength + 1; // +1 for newline
        }

        // Resolve target path
        const targetPath = this.resolveTargetPath(wikiLink.target, opts.basePath);

        if (wikiLink.displayText) {
          result.links.push({
            rawLink: wikiLink.raw,
            targetPath,
            displayText: wikiLink.displayText,
            linkType: 'wiki',
            position: wikiLink.position,
            lineNumber,
          });
        } else {
          result.links.push({
            rawLink: wikiLink.raw,
            targetPath,
            linkType: 'wiki',
            position: wikiLink.position,
            lineNumber,
          });
        }
      }

      // Extract markdown links
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = markdownLinkRegex.exec(content)) !== null) {
        const [rawLink, linkDisplayText, linkTarget] = match;
        if (!linkTarget || !linkDisplayText) continue;

        const position = {
          start: match.index,
          end: match.index + rawLink.length,
        };

        // Find line number
        let lineNumber = 1;
        for (let i = 0; i < match.index; i++) {
          if (content[i] === '\n') lineNumber++;
        }

        // Only process internal links (not URLs)
        if (!linkTarget.startsWith('http://') && !linkTarget.startsWith('https://')) {
          const targetPath = this.resolveTargetPath(linkTarget, opts.basePath);

          if (linkDisplayText !== linkTarget) {
            result.links.push({
              rawLink,
              targetPath,
              displayText: linkDisplayText,
              linkType: 'markdown',
              position,
              lineNumber,
            });
          } else {
            result.links.push({
              rawLink,
              targetPath,
              linkType: 'markdown',
              position,
              lineNumber,
            });
          }
        }
      }

      // Validate targets if requested
      if (opts.validateTargets) {
        for (const link of result.links) {
          if (!(await this.fileSystem.exists(link.targetPath))) {
            result.errors?.push({
              message: `Target does not exist: ${link.targetPath}`,
              line: link.lineNumber,
            });
          }
        }
      }
    } catch (error) {
      result.errors?.push({
        message: `Link extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    return result;
  }

  /**
   * Update backlinks for a document
   */
  async updateDocumentLinks(documentPath: string, content: string): Promise<void> {
    logger.debug('Updating links for document:', documentPath);

    // Remove old outgoing links from this document
    this.removeOutgoingLinks(documentPath);

    // Extract and add new links
    const extraction = await this.extractLinks(documentPath, content);

    for (const link of extraction.links) {
      const context = this.extractContext(content, link.position, 50);

      const entry: BacklinkEntry = link.displayText
        ? {
            sourcePath: documentPath,
            targetPath: link.targetPath,
            linkText: link.displayText,
            context,
            lineNumber: link.lineNumber,
            linkType: link.linkType,
          }
        : {
            sourcePath: documentPath,
            targetPath: link.targetPath,
            context,
            lineNumber: link.lineNumber,
            linkType: link.linkType,
          };

      // Add to index
      if (!this.index[link.targetPath]) {
        this.index[link.targetPath] = [];
      }

      const targetIndex = this.index[link.targetPath];
      if (targetIndex) {
        targetIndex.push(entry);
      }
    }

    this.markDirty();
  }

  /**
   * Remove a document from the index completely (when deleted)
   */
  removeDocumentFromIndex(documentPath: string): void {
    // Remove as a source (all outgoing links)
    for (const targetPath in this.index) {
      const entries = this.index[targetPath];
      if (!entries) continue;
      this.index[targetPath] = entries.filter((entry) => entry.sourcePath !== documentPath);

      // Clean up empty arrays
      if (this.index[targetPath].length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.index[targetPath];
      }
    }

    // Remove as a target (the document itself)
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.index[documentPath];

    this.markDirty();
  }

  /**
   * Remove only outgoing links from a document (before update)
   */
  private removeOutgoingLinks(documentPath: string): void {
    // Remove only as a source (all outgoing links)
    for (const targetPath in this.index) {
      const entries = this.index[targetPath];
      if (!entries) continue;
      this.index[targetPath] = entries.filter((entry) => entry.sourcePath !== documentPath);

      // Clean up empty arrays
      if (this.index[targetPath].length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.index[targetPath];
      }
    }

    this.markDirty();
  }

  /**
   * Get detailed backlinks with all metadata for a specific document
   */
  getDetailedBacklinks(targetPath: string, options?: BacklinkQueryOptions): BacklinkQueryResult {
    const opts = {
      includeContext: true,
      linkType: 'all' as const,
      limit: 100,
      offset: 0,
      ...options,
    };

    let backlinks = this.index[targetPath] || [];

    // Filter by link type
    if (opts.linkType !== 'all') {
      backlinks = backlinks.filter((link) => link.linkType === opts.linkType);
    }

    const totalCount = backlinks.length;

    // Apply pagination
    backlinks = backlinks.slice(opts.offset, opts.offset + opts.limit);

    // Remove context if not requested
    if (!opts.includeContext) {
      backlinks = backlinks.map((link) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { context, ...rest } = link;
        return rest;
      }) as BacklinkEntry[];
    }

    return {
      targetPath,
      backlinks,
      totalCount,
    };
  }

  /**
   * Get statistics about the backlink index
   */
  getStats(): BacklinkStats {
    const documentSet = new Set<string>();
    let linkCount = 0;

    // Count incoming links per document
    const incomingCounts: Map<string, number> = new Map();
    const outgoingCounts: Map<string, number> = new Map();

    for (const [targetPath, entries] of Object.entries(this.index)) {
      documentSet.add(targetPath);
      incomingCounts.set(targetPath, entries.length);

      for (const entry of entries) {
        documentSet.add(entry.sourcePath);
        linkCount++;

        const current = outgoingCounts.get(entry.sourcePath) || 0;
        outgoingCounts.set(entry.sourcePath, current + 1);
      }
    }

    // Sort by counts
    const mostLinked = Array.from(incomingCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({
        path,
        incomingLinkCount: count,
      }));

    const mostLinking = Array.from(outgoingCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({
        path,
        outgoingLinkCount: count,
      }));

    return {
      documentCount: documentSet.size,
      linkCount,
      mostLinkedDocuments: mostLinked,
      mostLinkingDocuments: mostLinking,
    };
  }

  /**
   * Rebuild the entire index from scratch
   */
  async rebuildIndex(): Promise<void> {
    logger.info('Rebuilding backlink index');
    this.index = {};

    // Walk through all documents
    const documents = await this.findAllDocuments();

    for (const docPath of documents) {
      try {
        const content = await this.fileSystem.readFile(docPath);
        await this.updateDocumentLinks(docPath, content);
      } catch (error) {
        logger.error(`Failed to index document ${docPath}:`, error);
      }
    }

    await this.saveIndex(true); // Force immediate save
    logger.info(`Index rebuilt: ${documents.length} documents processed`);
  }

  /**
   * Check if a document has any backlinks
   */
  hasBacklinks(targetPath: string): boolean {
    return (this.index[targetPath]?.length || 0) > 0;
  }

  /**
   * Get all documents that have backlinks
   */
  getLinkedDocuments(): string[] {
    return Object.keys(this.index);
  }

  /**
   * Get the raw index for debugging
   */
  getIndex(): BacklinkIndex {
    return this.index;
  }

  /**
   * Get backlinks as simple paths array (for document move operations)
   */
  async getBacklinks(targetPath: string): Promise<string[]> {
    const backlinks = this.index[targetPath] || [];
    return [...new Set(backlinks.map(link => link.sourcePath))];
  }

  /**
   * Get all backlinks synchronously (for testing)
   */
  getBacklinksSync(targetPath: string): string[] {
    const backlinks = this.index[targetPath] || [];
    return [...new Set(backlinks.map(link => link.sourcePath))];
  }


  /**
   * Handle document move - update all references in the index
   */
  async handleDocumentMove(oldPath: string, newPath: string): Promise<void> {
    logger.debug(`Handling document move from ${oldPath} to ${newPath}`);

    // 1. Update all entries where this document is the source
    for (const targetPath in this.index) {
      const entries = this.index[targetPath];
      if (!entries) continue;
      
      for (const entry of entries) {
        if (entry.sourcePath === oldPath) {
          entry.sourcePath = newPath;
        }
      }
    }

    // 2. Move entries where this document is the target
    if (this.index[oldPath]) {
      const entries = this.index[oldPath];
      delete this.index[oldPath];
      this.index[newPath] = entries;
      
      // Update target paths in the entries
      for (const entry of entries) {
        entry.targetPath = newPath;
      }
    }

    // 3. Update any entries that link to the old path
    for (const targetPath in this.index) {
      const entries = this.index[targetPath];
      if (!entries) continue;
      
      for (const entry of entries) {
        if (entry.targetPath === oldPath) {
          entry.targetPath = newPath;
        }
      }
    }

    this.markDirty();
    await this.saveIndex(true); // Force immediate save for move operations
  }

  // Private methods

  private resolveTargetPath(target: string, basePath: string): string {
    // Remove any anchors
    const cleanTarget = target.split('#')[0] || '';

    // Add .md extension if missing
    const withExtension = cleanTarget.endsWith('.md') ? cleanTarget : `${cleanTarget}.md`;

    // Resolve relative paths
    if (withExtension.startsWith('/')) {
      // Absolute path from context root
      return path.join(this.contextRoot, withExtension.slice(1));
    } else {
      // Relative to document
      return path.resolve(basePath, withExtension);
    }
  }

  private extractContext(
    content: string,
    position: { start: number; end: number },
    contextLength: number,
  ): string {
    const halfContext = Math.floor(contextLength / 2);
    const start = Math.max(0, position.start - halfContext);
    const end = Math.min(content.length, position.end + halfContext);

    let context = content.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';

    // Replace newlines with spaces
    return context.replace(/\n/g, ' ').trim();
  }

  private async findAllDocuments(): Promise<string[]> {
    const documents: string[] = [];

    const walkDir = async (dirPath: string): Promise<void> => {
      const entries = await this.fileSystem.readdir(dirPath);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stats = await this.fileSystem.stat(fullPath);

        if (stats.isDirectory() && !entry.startsWith('.')) {
          await walkDir(fullPath);
        } else if (stats.isFile() && entry.endsWith('.md')) {
          documents.push(fullPath);
        }
      }
    };

    await walkDir(this.contextRoot);
    return documents;
  }

  private async loadIndex(): Promise<void> {
    try {
      if (await this.fileSystem.exists(this.indexPath)) {
        const data = await this.fileSystem.readFile(this.indexPath);
        const persisted = JSON.parse(data) as PersistedBacklinkIndex;

        if (persisted.version === this.INDEX_VERSION) {
          this.index = persisted.index;
          logger.debug('Loaded backlink index:', {
            documentCount: persisted.metadata?.documentCount,
            linkCount: persisted.metadata?.linkCount,
          });
        } else {
          logger.warn('Index version mismatch, rebuilding');
          await this.rebuildIndex();
        }
      }
    } catch (error) {
      logger.error('Failed to load backlink index:', error);
      this.index = {};
    }
  }

  private async saveIndex(immediate = false): Promise<void> {
    if (!this.isDirty) return;

    // Cancel any pending save
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    const doSave = async (): Promise<void> => {
      try {
        const stats = this.getStats();
        const persisted: PersistedBacklinkIndex = {
          version: this.INDEX_VERSION,
          lastUpdated: new Date().toISOString(),
          index: this.index,
          metadata: {
            documentCount: stats.documentCount,
            linkCount: stats.linkCount,
          },
        };

        await this.fileSystem.writeFile(this.indexPath, JSON.stringify(persisted, null, 2));

        this.isDirty = false;
        logger.debug('Saved backlink index');
      } catch (error) {
        logger.error('Failed to save backlink index:', error);
      }
    };

    if (immediate) {
      await doSave();
    } else {
      this.saveDebounceTimer = setTimeout(() => void doSave(), this.SAVE_DEBOUNCE_MS);
    }
  }

  private markDirty(): void {
    this.isDirty = true;
    void this.saveIndex();
  }
}
