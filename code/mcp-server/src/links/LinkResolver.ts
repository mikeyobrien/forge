// ABOUTME: Resolves wiki-link targets to absolute paths within the context root
// ABOUTME: Handles various link formats and validates target existence

import { join, resolve, extname, dirname } from 'path';
import { IFileSystem } from '../filesystem/IFileSystem';

export class LinkResolver {
  constructor(
    private readonly contextRoot: string,
    private readonly fileSystem: IFileSystem,
  ) {}

  /**
   * Resolve a wiki-link target to an absolute path
   * @param linkTarget The target from a wiki-link (e.g., "projects/my-project")
   * @param sourcePath The path of the document containing the link
   * @returns The resolved absolute path or null if invalid
   */
  async resolve(linkTarget: string, sourcePath: string): Promise<string | null> {
    // Remove any anchor from the target
    const [target] = linkTarget.split('#');

    if (!target || target.trim() === '') {
      return null;
    }

    // Clean the target
    const cleanTarget = target.trim();

    // Try different resolution strategies
    const candidates = this.generateCandidatePaths(cleanTarget, sourcePath);

    // Find the first existing candidate
    for (const candidate of candidates) {
      if (this.isValidPath(candidate) && (await this.fileSystem.exists(candidate))) {
        return candidate;
      }
    }

    // Return the most likely candidate even if it doesn't exist
    // This allows us to track broken links
    return candidates[0] || null;
  }

  /**
   * Check if a path exists within the context root
   */
  async exists(path: string): Promise<boolean> {
    return this.isValidPath(path) && (await this.fileSystem.exists(path));
  }

  /**
   * Extract anchor from a link target
   */
  extractAnchor(linkTarget: string): string | undefined {
    const anchorIndex = linkTarget.indexOf('#');
    return anchorIndex > -1 ? linkTarget.slice(anchorIndex + 1) : undefined;
  }

  private generateCandidatePaths(target: string, sourcePath: string): string[] {
    const candidates: string[] = [];
    const sourceDir = dirname(sourcePath);

    // Handle absolute paths
    if (target.startsWith('/')) {
      // Absolute path within context
      const absolute = join(this.contextRoot, target.slice(1));
      if (this.isValidPath(absolute)) {
        candidates.push(...this.addExtensionVariants(absolute));
      }
    } else {
      // Relative to source document
      const relative = resolve(sourceDir, target);
      if (this.isValidPath(relative)) {
        candidates.push(...this.addExtensionVariants(relative));
      }

      // Relative to context root
      const fromRoot = join(this.contextRoot, target);
      if (this.isValidPath(fromRoot)) {
        candidates.push(...this.addExtensionVariants(fromRoot));
      }

      // Try in each PARA category
      const paraCategories = ['projects', 'areas', 'resources', 'archives'];
      for (const category of paraCategories) {
        const inCategory = join(this.contextRoot, category, target);
        if (this.isValidPath(inCategory)) {
          candidates.push(...this.addExtensionVariants(inCategory));
        }
      }
    }

    // Remove duplicates while preserving order
    return [...new Set(candidates)];
  }

  private addExtensionVariants(basePath: string): string[] {
    const variants: string[] = [];

    // If already has an extension, use as-is
    if (extname(basePath)) {
      variants.push(basePath);
    } else {
      // Try with .md extension first (most common)
      variants.push(`${basePath}.md`);
      variants.push(basePath);

      // Try other common extensions
      const otherExtensions = ['.markdown', '.txt', '.org'];
      for (const ext of otherExtensions) {
        variants.push(`${basePath}${ext}`);
      }
    }

    return variants;
  }

  private isValidPath(path: string): boolean {
    try {
      // Ensure path is within context root
      const resolved = resolve(path);
      const contextResolved = resolve(this.contextRoot);

      // Path must be within context root
      if (!resolved.startsWith(contextResolved + '/') && resolved !== contextResolved) {
        return false;
      }

      // Additional check for path traversal attempts
      if (path.includes('../') || path.includes('..\\')) {
        // Only allow relative paths if they resolve within context
        const normalizedPath = resolve(this.contextRoot, path);
        return (
          normalizedPath.startsWith(contextResolved + '/') || normalizedPath === contextResolved
        );
      }

      return true;
    } catch {
      return false;
    }
  }
}
