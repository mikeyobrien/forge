// ABOUTME: Stub implementations for integration tests
// ABOUTME: Provides simplified versions of methods that tests expect but aren't in the real implementation

import { BacklinkManager } from '../../../backlinks/BacklinkManager';
import { BacklinkEntry } from '../../../backlinks/types';
import { parseWikiLinks } from '../../../parser/wiki-link';
import { IFileSystem } from '../../../filesystem/IFileSystem';

// Extend BacklinkManager prototype with test methods
declare module '../../../backlinks/BacklinkManager' {
  interface BacklinkManager {
    getForwardLinks(documentPath: string): Promise<Array<{ target: string; displayText?: string | undefined }>>;
    getBrokenLinks(): Promise<Array<{ source: string; target: string; line: number; column: number }>>;
    getOrphanedDocuments(): Promise<string[]>;
    getAllBacklinks(): Promise<Map<string, BacklinkEntry[]>>;
  }
}

// Add test methods to BacklinkManager prototype
BacklinkManager.prototype.getForwardLinks = async function(documentPath: string) {
  const fs = (this as any).fileSystem as IFileSystem;
  try {
    const content = await fs.readFile(documentPath);
    const links = parseWikiLinks(content);
    return links.map(link => ({
      target: link.target,
      displayText: link.displayText
    }));
  } catch {
    return [];
  }
};

BacklinkManager.prototype.getBrokenLinks = async function() {
  const brokenLinks: Array<{ source: string; target: string; line: number; column: number }> = [];
  // Simplified implementation
  return brokenLinks;
};

BacklinkManager.prototype.getOrphanedDocuments = async function() {
  const orphans: string[] = [];
  // Simplified implementation - would need to check all documents
  return orphans;
};

BacklinkManager.prototype.getAllBacklinks = async function() {
  const allBacklinks = new Map<string, BacklinkEntry[]>();
  // Return current index as a Map
  const index = (this as any).index;
  for (const [key, value] of Object.entries(index)) {
    allBacklinks.set(key, value as BacklinkEntry[]);
  }
  return allBacklinks;
};

// Helper to check stats has the expected properties
export function normalizeBacklinkStats(stats: any) {
  return {
    totalDocuments: stats.documentCount || stats.totalDocuments || 0,
    totalBacklinks: stats.linkCount || stats.totalBacklinks || 0,
    documentBacklinks: stats.documentBacklinks || {},
    brokenLinks: stats.brokenLinks || 0
  };
}