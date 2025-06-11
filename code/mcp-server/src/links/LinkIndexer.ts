// ABOUTME: Indexes all wiki-links in documents to build a bidirectional link graph
// ABOUTME: Provides efficient link queries and maintains cache for performance

import { join, relative } from 'path';
import { IFileSystem } from '../filesystem/IFileSystem';
import { LinkResolver } from './LinkResolver';
import { parseWikiLinks } from '../parser/wiki-link';
import { FrontmatterParser } from '../parsers/frontmatter';
import { DocumentFrontmatter } from '../models/types';
import {
  LinkIndex,
  ParsedDocument,
  LinkQueryType,
  LinkQueryOptions,
  LinkQueryResult,
  LinkStatistics,
} from './types';

export class LinkIndexer {
  private index: LinkIndex = {
    forwardLinks: new Map(),
    backlinks: new Map(),
    brokenLinks: new Map(),
    documentCache: new Map(),
    isBuilt: false,
  };

  private readonly resolver: LinkResolver;

  constructor(
    private readonly contextRoot: string,
    private readonly fileSystem: IFileSystem,
  ) {
    this.resolver = new LinkResolver(contextRoot, fileSystem);
  }

  /**
   * Build or rebuild the link index
   */
  async buildIndex(): Promise<void> {
    this.clearIndex();

    const documents = await this.findAllDocuments();

    // Parse all documents in parallel for performance
    const parsePromises = documents.map((doc) => this.parseDocument(doc));
    const parsedDocs = await Promise.all(parsePromises);

    // Build the link graph
    for (const doc of parsedDocs) {
      if (doc) {
        await this.indexDocument(doc);
      }
    }

    this.index.isBuilt = true;
    this.index.lastBuildTime = new Date();
  }

  /**
   * Query links based on options
   */
  async query(options: LinkQueryOptions): Promise<LinkQueryResult[]> {
    if (!this.index.isBuilt) {
      await this.buildIndex();
    }

    switch (options.type) {
      case LinkQueryType.FORWARD:
        return options.path ? [this.getDocumentLinks(options.path, options)] : [];

      case LinkQueryType.BACKLINKS:
        return options.path ? [this.getDocumentBacklinks(options.path, options)] : [];

      case LinkQueryType.ORPHANED:
        return this.getOrphanedDocuments(options);

      case LinkQueryType.BROKEN:
        return this.getDocumentsWithBrokenLinks(options);

      case LinkQueryType.ALL:
        return options.path
          ? [this.getAllDocumentLinks(options.path, options)]
          : this.getAllDocumentsLinks(options);

      default:
        throw new Error(`Unknown query type: ${String(options.type)}`);
    }
  }

  /**
   * Get link statistics
   */
  getStatistics(): LinkStatistics {
    if (!this.index.isBuilt) {
      throw new Error('Index not built');
    }

    const orphaned = this.findOrphanedDocuments();
    const mostLinked = this.findMostLinkedDocuments();
    const withBroken = this.findDocumentsWithBrokenLinks();

    return {
      totalDocuments: this.index.documentCache.size,
      totalLinks: this.countTotalLinks(),
      totalBrokenLinks: this.countTotalBrokenLinks(),
      orphanedDocuments: orphaned,
      mostLinkedDocuments: mostLinked,
      documentsWithBrokenLinks: withBroken,
    };
  }

  /**
   * Update index for a single document
   */
  async updateDocument(path: string): Promise<void> {
    if (!this.index.isBuilt) {
      await this.buildIndex();
      return;
    }

    // Remove old data
    this.removeDocumentFromIndex(path);

    // Re-parse and index if document still exists
    if (await this.fileSystem.exists(path)) {
      const parsed = await this.parseDocument(path);
      if (parsed) {
        await this.indexDocument(parsed);
      }
    }
  }

  /**
   * Remove a document from the index
   */
  removeDocument(path: string): void {
    this.removeDocumentFromIndex(path);
  }

  private clearIndex(): void {
    this.index = {
      forwardLinks: new Map(),
      backlinks: new Map(),
      brokenLinks: new Map(),
      documentCache: new Map(),
      isBuilt: false,
    };
  }

  private async findAllDocuments(): Promise<string[]> {
    const documents: string[] = [];
    const extensions = ['.md', '.markdown', '.txt', '.org'];

    const scanDirectory = async (dir: string): Promise<void> => {
      const entries = await this.fileSystem.readDirectory(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory && !entry.name.startsWith('.')) {
          await scanDirectory(fullPath);
        } else if (entry.isFile && extensions.some((ext) => entry.name.endsWith(ext))) {
          documents.push(fullPath);
        }
      }
    };

    await scanDirectory(this.contextRoot);
    return documents;
  }

  private async parseDocument(path: string): Promise<ParsedDocument | null> {
    try {
      const content = await this.fileSystem.readFile(path);
      const parser = new FrontmatterParser();
      const { frontmatter } = parser.parse(content);
      const parsedLinks = parseWikiLinks(content);
      const stat = await this.fileSystem.stat(path);

      // Convert parser WikiLinks to our WikiLink type
      const links = parsedLinks.map((link) => ({
        ...link,
        position: {
          ...link.position,
          line: 0, // Line calculation would require more parsing
          column: 0, // Column calculation would require more parsing
        },
      }));

      const parsedDoc: ParsedDocument = {
        path,
        content,
        links,
        lastModified: stat.mtime,
      };

      if (frontmatter) {
        parsedDoc.metadata = frontmatter as DocumentFrontmatter;
      }

      return parsedDoc;
    } catch (_error) {
      // Log error but continue indexing other documents
      return null;
    }
  }

  private async indexDocument(doc: ParsedDocument): Promise<void> {
    const relativePath = this.getRelativePath(doc.path);

    // Cache the document
    this.index.documentCache.set(relativePath, doc);

    // Initialize sets if needed
    if (!this.index.forwardLinks.has(relativePath)) {
      this.index.forwardLinks.set(relativePath, new Set());
    }
    if (!this.index.brokenLinks.has(relativePath)) {
      this.index.brokenLinks.set(relativePath, new Set());
    }

    // Process each link
    const forwardSet = this.index.forwardLinks.get(relativePath);
    const brokenSet = this.index.brokenLinks.get(relativePath);

    if (!forwardSet || !brokenSet) {
      return;
    }

    for (const link of doc.links) {
      const resolved = await this.resolver.resolve(link.target, doc.path);

      if (resolved) {
        const targetRelative = this.getRelativePath(resolved);

        if (await this.resolver.exists(resolved)) {
          // Valid link
          forwardSet.add(targetRelative);

          // Update backlinks
          if (!this.index.backlinks.has(targetRelative)) {
            this.index.backlinks.set(targetRelative, new Set());
          }
          const targetBacklinks = this.index.backlinks.get(targetRelative);
          if (targetBacklinks) {
            targetBacklinks.add(relativePath);
          }
        } else {
          // Broken link
          brokenSet.add(targetRelative);
        }
      }
    }
  }

  private removeDocumentFromIndex(path: string): void {
    const relativePath = this.getRelativePath(path);

    // Remove from cache
    this.index.documentCache.delete(relativePath);

    // Remove forward links and update backlinks
    const forwardLinks = this.index.forwardLinks.get(relativePath);
    if (forwardLinks) {
      for (const target of forwardLinks) {
        const backlinks = this.index.backlinks.get(target);
        if (backlinks) {
          backlinks.delete(relativePath);
          if (backlinks.size === 0) {
            this.index.backlinks.delete(target);
          }
        }
      }
      this.index.forwardLinks.delete(relativePath);
    }

    // Remove broken links
    this.index.brokenLinks.delete(relativePath);

    // Remove as backlink target
    this.index.backlinks.delete(relativePath);
  }

  private getDocumentLinks(path: string, options: LinkQueryOptions): LinkQueryResult {
    const relativePath = this.getRelativePath(path);
    const forwardLinks = Array.from(this.index.forwardLinks.get(relativePath) || []);
    const backlinks = Array.from(this.index.backlinks.get(relativePath) || []);
    const brokenLinks = options.includeBroken
      ? Array.from(this.index.brokenLinks.get(relativePath) || [])
      : undefined;

    const result: LinkQueryResult = {
      document: relativePath,
      forward_links: forwardLinks,
      backlinks: backlinks,
    };

    if (brokenLinks) {
      result.broken_links = brokenLinks;
    }

    if (options.includeMetadata) {
      const cached = this.index.documentCache.get(relativePath);
      if (cached?.metadata) {
        result.metadata = cached.metadata;
      }
    }

    result.stats = {
      total_forward: forwardLinks.length,
      total_backlinks: backlinks.length,
      total_broken: brokenLinks?.length || 0,
    };

    return result;
  }

  private getDocumentBacklinks(path: string, options: LinkQueryOptions): LinkQueryResult {
    return this.getDocumentLinks(path, options);
  }

  private getAllDocumentLinks(path: string, options: LinkQueryOptions): LinkQueryResult {
    return this.getDocumentLinks(path, { ...options, includeBroken: true });
  }

  private getOrphanedDocuments(options: LinkQueryOptions): LinkQueryResult[] {
    const orphaned = this.findOrphanedDocuments();
    const limit = options.limit || orphaned.length;
    const offset = options.offset || 0;

    return orphaned.slice(offset, offset + limit).map((path) => {
      const result: LinkQueryResult = {
        document: path,
        forward_links: Array.from(this.index.forwardLinks.get(path) || []),
        backlinks: [],
      };

      if (options.includeMetadata) {
        const cached = this.index.documentCache.get(path);
        if (cached?.metadata) {
          result.metadata = cached.metadata;
        }
      }

      return result;
    });
  }

  private getDocumentsWithBrokenLinks(options: LinkQueryOptions): LinkQueryResult[] {
    const withBroken = this.findDocumentsWithBrokenLinks();
    const limit = options.limit || withBroken.length;
    const offset = options.offset || 0;

    return withBroken.slice(offset, offset + limit).map(({ path }) => {
      const result = this.getDocumentLinks(path, { ...options, includeBroken: true });
      return result;
    });
  }

  private getAllDocumentsLinks(options: LinkQueryOptions): LinkQueryResult[] {
    const allDocs = Array.from(this.index.documentCache.keys());
    const limit = options.limit || allDocs.length;
    const offset = options.offset || 0;

    return allDocs
      .slice(offset, offset + limit)
      .map((path) => this.getAllDocumentLinks(path, options));
  }

  private findOrphanedDocuments(): string[] {
    const orphaned: string[] = [];

    for (const [path] of this.index.documentCache) {
      const backlinks = this.index.backlinks.get(path);
      if (!backlinks || backlinks.size === 0) {
        orphaned.push(path);
      }
    }

    return orphaned.sort();
  }

  private findMostLinkedDocuments(
    limit: number = 10,
  ): Array<{ path: string; backlinkCount: number }> {
    const entries = Array.from(this.index.backlinks.entries())
      .map(([path, backlinks]) => ({ path, backlinkCount: backlinks.size }))
      .sort((a, b) => b.backlinkCount - a.backlinkCount);

    return entries.slice(0, limit);
  }

  private findDocumentsWithBrokenLinks(): Array<{ path: string; brokenCount: number }> {
    return Array.from(this.index.brokenLinks.entries())
      .filter(([_, broken]) => broken.size > 0)
      .map(([path, broken]) => ({ path, brokenCount: broken.size }))
      .sort((a, b) => b.brokenCount - a.brokenCount);
  }

  private countTotalLinks(): number {
    let total = 0;
    for (const links of this.index.forwardLinks.values()) {
      total += links.size;
    }
    return total;
  }

  private countTotalBrokenLinks(): number {
    let total = 0;
    for (const broken of this.index.brokenLinks.values()) {
      total += broken.size;
    }
    return total;
  }

  private getRelativePath(absolutePath: string): string {
    return relative(this.contextRoot, absolutePath);
  }
}
