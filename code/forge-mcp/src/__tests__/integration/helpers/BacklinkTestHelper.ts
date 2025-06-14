// ABOUTME: Helper class that extends BacklinkManager functionality for integration tests
// ABOUTME: Provides additional methods needed for comprehensive testing

import { BacklinkManager } from '../../../backlinks/BacklinkManager';
import { BacklinkEntry } from '../../../backlinks/types';
import { parseWikiLinks } from '../../../parser/wiki-link';
import { IFileSystem } from '../../../filesystem/IFileSystem';

export interface BrokenLink {
  source: string;
  target: string;
  line: number;
  column: number;
}

export interface ForwardLink {
  target: string;
  displayText?: string | undefined;
}

export class BacklinkTestHelper {
  constructor(
    private backlinkManager: BacklinkManager,
    private fileSystem: IFileSystem,
  ) {}

  /**
   * Get all backlinks from the manager
   */
  async getAllBacklinks(): Promise<Map<string, BacklinkEntry[]>> {
    const allBacklinks = new Map<string, BacklinkEntry[]>();

    // We'll need to iterate through all documents to get their backlinks
    // This is a simplified implementation for testing
    const allPaths = await this.getAllDocumentPaths();

    for (const path of allPaths) {
      const result = this.backlinkManager.getDetailedBacklinks(path);
      if (result.backlinks.length > 0) {
        allBacklinks.set(path, result.backlinks);
      }
    }

    return allBacklinks;
  }

  /**
   * Get forward links from a document
   */
  async getForwardLinks(documentPath: string): Promise<ForwardLink[]> {
    try {
      const content = await this.fileSystem.readFile(documentPath);
      const links = parseWikiLinks(content);

      return links.map((link) => ({
        target: link.target,
        displayText: link.displayText,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Find broken links (links to non-existent documents)
   */
  async getBrokenLinks(): Promise<BrokenLink[]> {
    const brokenLinks: BrokenLink[] = [];

    // Get all documents
    const allFiles = await this.getAllDocumentPaths();

    for (const filePath of allFiles) {
      try {
        const content = await this.fileSystem.readFile(filePath);
        const links = parseWikiLinks(content);

        for (const link of links) {
          const targetPath = link.target + '.md';
          const exists = await this.fileSystem.exists(targetPath);

          if (!exists) {
            brokenLinks.push({
              source: filePath,
              target: targetPath,
              line: link.position?.start || 0,
              column: link.position?.start || 0,
            });
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return brokenLinks;
  }

  /**
   * Find orphaned documents (documents with no backlinks)
   */
  async getOrphanedDocuments(): Promise<string[]> {
    const orphans: string[] = [];
    const allFiles = await this.getAllDocumentPaths();

    for (const filePath of allFiles) {
      const backlinks = await this.backlinkManager.getBacklinks(filePath);
      if (backlinks.length === 0) {
        orphans.push(filePath);
      }
    }

    return orphans;
  }

  /**
   * Get all document paths in the knowledge base
   */
  private async getAllDocumentPaths(): Promise<string[]> {
    const paths: string[] = [];
    const categories = ['projects', 'areas', 'resources', 'archives'];

    for (const category of categories) {
      try {
        const files = await this.fileSystem.readdir(category);
        const mdFiles = files.filter((f) => f.endsWith('.md')).map((f) => `${category}/${f}`);
        paths.push(...mdFiles);
      } catch {
        // Category might not exist
      }
    }

    return paths;
  }
}
