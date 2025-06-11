// ABOUTME: Serializer for converting Document objects to markdown with YAML frontmatter
// ABOUTME: Handles proper YAML formatting and content assembly

import { Document as ModelDocument, DocumentFrontmatter } from '../models/types.js';
import { ParsedDocument } from './index.js';

// Type guard to check if document has frontmatter field
function hasFullDocument(doc: unknown): doc is ModelDocument {
  return 'frontmatter' in doc;
}

/**
 * Serialize a Document object to markdown format with YAML frontmatter
 * @param document The document to serialize
 * @returns Markdown string with frontmatter
 */
export function serializeDocument(
  document:
    | ModelDocument
    | ParsedDocument
    | { path: string; content: string; metadata: DocumentFrontmatter },
): string {
  // Handle different document types
  let frontmatter: DocumentFrontmatter | Record<string, unknown>;

  if (hasFullDocument(document)) {
    frontmatter = document.frontmatter;
  } else if ('metadata' in document) {
    frontmatter = document.metadata;
  } else {
    // Fallback - shouldn't happen
    frontmatter = {};
  }

  const frontmatterYaml = serializeFrontmatter(frontmatter as DocumentFrontmatter);

  // If no frontmatter, return content only
  if (!frontmatterYaml) {
    return document.content;
  }

  // Assemble document with frontmatter
  return `---\n${frontmatterYaml}---\n${document.content}`;
}

/**
 * Serialize frontmatter object to YAML string
 * @param frontmatter The frontmatter object to serialize
 * @returns YAML string without delimiters
 */
export function serializeFrontmatter(frontmatter: DocumentFrontmatter): string {
  const lines: string[] = [];

  // Handle required fields first
  if (frontmatter.title) {
    lines.push(`title: ${yamlValue(frontmatter.title)}`);
  }

  // Handle PARA fields
  if (frontmatter.category) {
    lines.push(`category: ${frontmatter.category}`);
  }

  if (frontmatter.status) {
    lines.push(`status: ${frontmatter.status}`);
  }

  if (frontmatter.due_date) {
    lines.push(`due_date: ${frontmatter.due_date}`);
  }

  if (frontmatter.parent) {
    lines.push(`parent: ${yamlValue(frontmatter.parent)}`);
  }

  // Handle dates
  if (frontmatter.created) {
    lines.push(`created: ${frontmatter.created}`);
  }

  if (frontmatter.modified) {
    lines.push(`modified: ${frontmatter.modified}`);
  }

  // Handle arrays
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    lines.push('tags:');
    frontmatter.tags.forEach((tag) => {
      lines.push(`  - ${yamlValue(tag)}`);
    });
  }

  if (frontmatter.aliases && frontmatter.aliases.length > 0) {
    lines.push('aliases:');
    frontmatter.aliases.forEach((alias) => {
      lines.push(`  - ${yamlValue(alias)}`);
    });
  }

  if (frontmatter.links_to && frontmatter.links_to.length > 0) {
    lines.push('links_to:');
    frontmatter.links_to.forEach((link) => {
      lines.push(`  - ${yamlValue(link)}`);
    });
  }

  // Handle any additional custom fields
  const handledKeys = new Set([
    'title',
    'category',
    'status',
    'due_date',
    'parent',
    'created',
    'modified',
    'tags',
    'aliases',
    'links_to',
    'backlinks',
  ]);

  Object.entries(frontmatter).forEach(([key, value]) => {
    if (!handledKeys.has(key) && value !== undefined) {
      const yamlVal = yamlValue(value);
      if (yamlVal) {
        lines.push(`${key}: ${yamlVal}`);
      }
    }
  });

  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

/**
 * Convert a value to proper YAML format
 * @param value The value to convert
 * @returns YAML-formatted string
 */
function yamlValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return ''; // Skip undefined values
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string') {
    // Check if string needs quoting
    if (
      value.includes(':') ||
      value.includes('#') ||
      value.includes('\n') ||
      value.includes('"') ||
      value.startsWith(' ') ||
      value.endsWith(' ') ||
      value === 'true' ||
      value === 'false' ||
      value === 'null' ||
      /^-?\d+(\.\d+)?$/.test(value)
    ) {
      // Use double quotes and escape internal quotes and newlines
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }

    return value;
  }

  // For complex objects, convert to JSON string
  return JSON.stringify(value);
}
