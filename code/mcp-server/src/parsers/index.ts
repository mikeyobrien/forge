// ABOUTME: Export barrel for parser modules
// ABOUTME: Centralizes all parser exports for easy importing

export * from './frontmatter';
export * from './serializer';

import { FrontmatterParser } from './frontmatter';

// Simple document interface for parser results
export interface ParsedDocument {
  path: string;
  content: string;
  metadata: Record<string, unknown>;
}

// Simple parse function for updater compatibility
export function parseFrontmatter(content: string): ParsedDocument {
  const parser = new FrontmatterParser();
  const result = parser.parse(content);

  return {
    path: '', // Path is set externally
    content: result.content,
    metadata: result.frontmatter || {},
  };
}
