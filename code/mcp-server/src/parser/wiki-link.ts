// ABOUTME: Core wiki-link parser implementation for extracting and manipulating [[wiki-style]] links
// ABOUTME: Supports various link formats including display text and anchors with full TypeScript type safety

export interface WikiLink {
  raw: string; // Full raw link text including brackets
  target: string; // The document being linked to
  anchor?: string; // Optional section anchor
  displayText?: string; // Optional display text
  position: {
    start: number; // Start position in source
    end: number; // End position in source
  };
}

export interface WikiLinkParserOptions {
  excludeCodeBlocks?: boolean; // Skip links in code blocks
  excludeInlineCode?: boolean; // Skip links in inline code
}

// Regex patterns for parsing
const WIKI_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]+`/g;

/**
 * Parses wiki-style links from markdown content
 */
export function parseWikiLinks(content: string, options: WikiLinkParserOptions = {}): WikiLink[] {
  const { excludeCodeBlocks = true, excludeInlineCode = true } = options;

  const links: WikiLink[] = [];
  const excludedRanges: Array<{ start: number; end: number }> = [];

  // Find ranges to exclude (code blocks and inline code)
  // Process code blocks first as they have higher precedence
  const codeBlockRanges: Array<{ start: number; end: number }> = [];

  // Always find code blocks to handle inline code correctly
  const codeBlocks = [...content.matchAll(CODE_BLOCK_PATTERN)];
  for (const match of codeBlocks) {
    if (match.index !== undefined) {
      const range = {
        start: match.index,
        end: match.index + match[0].length,
      };
      codeBlockRanges.push(range);

      // Only exclude if excludeCodeBlocks is true
      if (excludeCodeBlocks) {
        excludedRanges.push(range);
      }
    }
  }

  if (excludeInlineCode) {
    // Create a masked version of content where code blocks are replaced with spaces
    let maskedContent = content;
    const maskReplacements: Array<{ start: number; length: number }> = [];

    for (const block of codeBlockRanges) {
      const spaces = ' '.repeat(block.end - block.start);
      maskedContent =
        maskedContent.substring(0, block.start) + spaces + maskedContent.substring(block.end);
      maskReplacements.push({ start: block.start, length: block.end - block.start });
    }

    // Find inline code in the masked content
    const inlineCode = [...maskedContent.matchAll(INLINE_CODE_PATTERN)];
    for (const match of inlineCode) {
      if (match.index !== undefined) {
        excludedRanges.push({
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
  }

  // Find all wiki links
  const matches = [...content.matchAll(WIKI_LINK_PATTERN)];

  for (const match of matches) {
    if (match.index === undefined) continue;

    const start = match.index;
    const end = match.index + match[0].length;

    // Check if this link is in an excluded range
    const isExcluded = excludedRanges.some((range) => start >= range.start && end <= range.end);

    if (!isExcluded) {
      const rawContent = match[1];
      if (!rawContent) continue;

      const parsed = extractLinkComponents(rawContent);

      const link: WikiLink = {
        raw: match[0],
        target: parsed.target,
        position: { start, end },
      };

      if (parsed.anchor !== undefined) {
        link.anchor = parsed.anchor;
      }

      if (parsed.displayText !== undefined) {
        link.displayText = parsed.displayText;
      }

      links.push(link);
    }
  }

  return links;
}

/**
 * Extracts components from a wiki link's inner content
 */
export function extractLinkComponents(rawContent: string): {
  target: string;
  anchor?: string;
  displayText?: string;
} {
  // Handle display text (pipe separator)
  const pipeIndex = rawContent.indexOf('|');
  let targetPart: string;
  let displayText: string | undefined;

  if (pipeIndex !== -1) {
    targetPart = rawContent.substring(0, pipeIndex).trim();
    displayText = rawContent.substring(pipeIndex + 1).trim();
  } else {
    targetPart = rawContent.trim();
  }

  // Handle anchor (hash separator)
  const hashIndex = targetPart.indexOf('#');
  let target: string;
  let anchor: string | undefined;

  if (hashIndex !== -1) {
    target = targetPart.substring(0, hashIndex).trim();
    anchor = targetPart.substring(hashIndex + 1).trim();
  } else {
    target = targetPart;
  }

  return {
    target,
    ...(anchor && { anchor }),
    ...(displayText && { displayText }),
  };
}

/**
 * Replaces a wiki link in content with a new link
 */
export function replaceWikiLink(content: string, oldLink: string, newLink: string): string {
  // Escape special regex characters in the old link
  const escapedOldLink = oldLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedOldLink, 'g');
  return content.replace(regex, newLink);
}

/**
 * Normalizes a link target for comparison
 */
export function normalizeTarget(target: string): string {
  return target
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]/g, ''); // Remove non-alphanumeric except hyphens
}

/**
 * Creates a wiki link string from components
 */
export function createWikiLink(
  target: string,
  options?: {
    anchor?: string;
    displayText?: string;
  },
): string {
  let linkContent = target;

  if (options?.anchor) {
    linkContent += `#${options.anchor}`;
  }

  if (options?.displayText) {
    linkContent += `|${options.displayText}`;
  }

  return `[[${linkContent}]]`;
}

/**
 * Validates if a string is a valid wiki link target
 */
export function isValidTarget(target: string): boolean {
  // Target should not be empty and should not contain certain characters
  if (!target || target.trim().length === 0) {
    return false;
  }

  // Check for invalid characters
  const invalidChars = ['[', ']', '|', '#'];
  return !invalidChars.some((char) => target.includes(char));
}

/**
 * Extracts unique link targets from content
 */
export function extractUniqueTargets(content: string): string[] {
  const links = parseWikiLinks(content);
  const targets = new Set(links.map((link) => link.target));
  return Array.from(targets);
}

/**
 * Finds all positions of a specific link target
 */
export function findLinkPositions(
  content: string,
  target: string,
): Array<{ start: number; end: number }> {
  const normalizedTarget = normalizeTarget(target);
  const links = parseWikiLinks(content);

  return links
    .filter((link) => normalizeTarget(link.target) === normalizedTarget)
    .map((link) => link.position);
}
