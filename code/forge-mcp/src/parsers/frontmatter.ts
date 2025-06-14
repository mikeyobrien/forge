// ABOUTME: Frontmatter parser for extracting and parsing YAML metadata from markdown documents
// ABOUTME: Provides type-safe parsing with Zod schema validation and comprehensive error handling

import { z, ZodSchema } from 'zod';

/**
 * Result of parsing a document's frontmatter
 */
export interface ParseResult {
  /** Parsed frontmatter as key-value pairs, null if no frontmatter */
  frontmatter: Record<string, unknown> | null;
  /** Document content after frontmatter */
  content: string;
  /** Raw frontmatter information */
  raw: {
    /** Raw frontmatter text between delimiters */
    frontmatterText: string | null;
    /** Line number where frontmatter starts (1-indexed) */
    startLine: number;
    /** Line number where frontmatter ends (1-indexed) */
    endLine: number;
  };
}

/**
 * Type-safe result when parsing with a schema
 */
export interface TypedParseResult<T> extends Omit<ParseResult, 'frontmatter'> {
  /** Parsed and validated frontmatter matching the schema */
  frontmatter: T | null;
}

/**
 * Options for configuring the parser behavior
 */
export interface ParserOptions {
  /** If true, throw errors on invalid YAML. If false, return null (default: false) */
  strict?: boolean;
  /** Custom delimiter for frontmatter blocks (default: '---') */
  delimiter?: string;
  /** Maximum allowed frontmatter size in characters (default: 1MB) */
  maxSize?: number;
}

/**
 * Custom error for frontmatter parsing failures
 */
export class FrontmatterParseError extends Error {
  public readonly line?: number;
  public readonly column?: number;

  constructor(message: string, line?: number, column?: number, cause?: unknown) {
    super(message);
    this.name = 'FrontmatterParseError';
    if (line !== undefined) {
      this.line = line;
    }
    if (column !== undefined) {
      this.column = column;
    }
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Custom error for schema validation failures
 */
export class FrontmatterValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError,
  ) {
    super(message);
    this.name = 'FrontmatterValidationError';
  }
}

/**
 * Parser for YAML frontmatter in markdown documents
 */
export class FrontmatterParser {
  private readonly options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      strict: options.strict ?? false,
      delimiter: options.delimiter ?? '---',
      maxSize: options.maxSize ?? 1024 * 1024, // 1MB
    };
  }

  /**
   * Parse frontmatter from a document
   * @param content The full document content
   * @returns Parsed frontmatter and remaining content
   */
  parse(content: string): ParseResult {
    const lines = this.normalizeLineEndings(content).split('\n');
    const { delimiter } = this.options;

    // Check if document starts with delimiter
    if (!lines[0] || lines[0].trim() !== delimiter) {
      return {
        frontmatter: null,
        content,
        raw: {
          frontmatterText: null,
          startLine: 0,
          endLine: 0,
        },
      };
    }

    // Find closing delimiter
    let endLine = -1;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined && line.trim() === delimiter) {
        endLine = i;
        break;
      }
    }

    // No closing delimiter found
    if (endLine === -1) {
      if (this.options.strict) {
        throw new FrontmatterParseError(
          `Unclosed frontmatter block - missing closing delimiter "${delimiter}"`,
        );
      }
      return {
        frontmatter: null,
        content,
        raw: {
          frontmatterText: null,
          startLine: 0,
          endLine: 0,
        },
      };
    }

    // Extract frontmatter text
    const frontmatterLines = lines.slice(1, endLine);
    const frontmatterText = frontmatterLines.join('\n');

    // Check size limit
    if (frontmatterText.length > this.options.maxSize) {
      throw new FrontmatterParseError(
        `Frontmatter exceeds maximum size of ${this.options.maxSize} characters`,
      );
    }

    // Parse YAML
    let frontmatter: Record<string, unknown> | null = null;
    try {
      frontmatter = this.parseYAML(frontmatterText);
    } catch (error) {
      if (this.options.strict) {
        throw new FrontmatterParseError(
          'Failed to parse frontmatter YAML',
          undefined,
          undefined,
          error,
        );
      }
      // In non-strict mode, return null frontmatter
      frontmatter = null;
    }

    // Extract content after frontmatter
    const contentLines = lines.slice(endLine + 1);
    const remainingContent = contentLines.join('\n');

    return {
      frontmatter,
      content: remainingContent,
      raw: {
        frontmatterText,
        startLine: 1,
        endLine: endLine + 1, // Convert to 1-indexed
      },
    };
  }

  /**
   * Parse frontmatter with schema validation
   * @param content The full document content
   * @param schema Zod schema for validation
   * @returns Type-safe parsed frontmatter and content
   */
  parseWithSchema<T>(content: string, schema: ZodSchema<T>): TypedParseResult<T> {
    const result = this.parse(content);

    if (result.frontmatter === null) {
      return {
        ...result,
        frontmatter: null,
      } as TypedParseResult<T>;
    }

    // Validate against schema
    const validation = schema.safeParse(result.frontmatter);
    if (!validation.success) {
      throw new FrontmatterValidationError('Frontmatter validation failed', validation.error);
    }

    return {
      ...result,
      frontmatter: validation.data,
    };
  }

  /**
   * Normalize line endings to LF
   */
  private normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Parse YAML content into JavaScript object
   * Custom implementation to avoid external dependencies
   */
  private parseYAML(yaml: string): Record<string, unknown> {
    if (!yaml.trim()) {
      return {};
    }

    const lines = yaml.split('\n');
    const root: Record<string, unknown> = {};

    interface ParseState {
      obj: Record<string, unknown>;
      indent: number;
    }

    const stack: ParseState[] = [{ obj: root, indent: -1 }];
    const arrayParents = new Map<Record<string, unknown>, string>();

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (line === undefined) continue;

      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const indent = line.length - line.trimStart().length;

      // Pop stack to find the right parent based on indentation
      while (stack.length > 1) {
        const last = stack[stack.length - 1];
        if (last && indent <= last.indent) {
          stack.pop();
          arrayParents.delete(last.obj);
        } else {
          break;
        }
      }

      const current = stack[stack.length - 1];
      if (!current) {
        throw new FrontmatterParseError('Invalid YAML structure', lineNum + 1);
      }

      // Handle array items
      if (trimmed.startsWith('- ')) {
        const valueStr = trimmed.substring(2).trim();
        const arrayKey = arrayParents.get(current.obj);

        if (!arrayKey) {
          throw new FrontmatterParseError('Array item without parent key', lineNum + 1);
        }

        const arr = current.obj[arrayKey] as unknown[];

        // Check if this is an object in the array
        if (valueStr.includes(':') && valueStr.indexOf(':') < valueStr.lastIndexOf(' ')) {
          const newObj: Record<string, unknown> = {};
          arr.push(newObj);

          // Parse inline key-value
          const colonIndex = valueStr.indexOf(':');
          const key = valueStr.substring(0, colonIndex).trim();
          const val = valueStr.substring(colonIndex + 1).trim();

          if (val) {
            newObj[key] = this.parseValue(val);
          }

          // Push context for potential nested properties
          stack.push({ obj: newObj, indent });
        } else {
          // Simple value
          arr.push(this.parseValue(valueStr));
        }
      }
      // Handle key-value pairs
      else if (trimmed.includes(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        const valueStr = trimmed.substring(colonIndex + 1).trim();

        if (!valueStr) {
          // Check next line to determine if it's an array or object
          const nextLineIdx = lineNum + 1;
          if (nextLineIdx < lines.length) {
            const nextLine = lines[nextLineIdx];
            if (nextLine !== undefined) {
              const nextTrimmed = nextLine.trim();
              if (nextTrimmed.startsWith('- ')) {
                // It's an array
                current.obj[key] = [];
                arrayParents.set(current.obj, key);
              } else {
                // It's an object
                const newObj: Record<string, unknown> = {};
                current.obj[key] = newObj;
                stack.push({ obj: newObj, indent });
              }
            }
          }
        } else {
          // Direct value
          current.obj[key] = this.parseValue(valueStr);
        }
      } else {
        throw new FrontmatterParseError(`Invalid YAML syntax: "${trimmed}"`, lineNum + 1);
      }
    }

    return root;
  }

  /**
   * Parse a YAML value string into appropriate JavaScript type
   */
  private parseValue(value: string): unknown {
    // Handle quoted strings
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    // Handle boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Handle null
    if (value === 'null' || value === '~') return null;

    // Handle numbers
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^-?\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Handle arrays (inline format)
    if (value.startsWith('[')) {
      if (!value.endsWith(']')) {
        // Unclosed array - this is invalid YAML
        throw new FrontmatterParseError('Unclosed array in YAML');
      }
      const items = value
        .slice(1, -1)
        .split(',')
        .map((item) => this.parseValue(item.trim()));
      return items;
    }

    // Default to string
    return value;
  }
}
