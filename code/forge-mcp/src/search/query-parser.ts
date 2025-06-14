// ABOUTME: This file implements the advanced query parser for sophisticated search syntax
// ABOUTME: supporting boolean operators, field-specific search, wildcards, and phrases

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ParsedQuery, QueryClause } from './advanced-types.js';

/**
 * Token types for query parsing
 */
enum TokenType {
  TEXT = 'TEXT',
  QUOTED = 'QUOTED',
  FIELD = 'FIELD',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  WILDCARD = 'WILDCARD',
  EOF = 'EOF',
}

/**
 * Token structure
 */
interface Token {
  type: TokenType;
  value: string;
  field?: string;
}

/**
 * Advanced query parser for search syntax
 */
export class QueryParser {
  private tokens: Token[] = [];
  private current = 0;

  /**
   * Parse a raw query string into structured format
   */
  parse(query: string): ParsedQuery {
    this.tokens = this.tokenize(query);
    this.current = 0;

    const parsed: ParsedQuery = {
      must: [],
      should: [],
      mustNot: [],
    };

    // Parse the query expression
    const clauses = this.parseExpression();

    // Distribute clauses based on their context
    for (const clause of clauses) {
      if (clause.isNegated) {
        parsed.mustNot.push(clause.clause);
      } else if (clause.isOptional) {
        parsed.should.push(clause.clause);
      } else {
        parsed.must.push(clause.clause);
      }
    }

    // If no must clauses but has should clauses, move one should to must
    // This ensures at least one condition must match
    if (parsed.must.length === 0 && parsed.should.length > 0) {
      parsed.must.push(parsed.should.shift()!);
    }

    return parsed;
  }

  /**
   * Tokenize the query string
   */
  private tokenize(query: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < query.length) {
      // Skip whitespace
      if (/\s/.test(query[i]!)) {
        i++;
        continue;
      }

      // Quoted strings
      if (query[i] === '"') {
        const start = i + 1;
        i++;
        while (i < query.length && query[i] !== '"') {
          // Handle escaped quotes
          if (query[i] === '\\' && query[i + 1] === '"') {
            i += 2;
          } else {
            i++;
          }
        }
        const value = query.slice(start, i).replace(/\\"/g, '"');
        tokens.push({ type: TokenType.QUOTED, value });
        i++; // Skip closing quote
        continue;
      }

      // Parentheses
      if (query[i] === '(') {
        tokens.push({ type: TokenType.LPAREN, value: '(' });
        i++;
        continue;
      }
      if (query[i] === ')') {
        tokens.push({ type: TokenType.RPAREN, value: ')' });
        i++;
        continue;
      }

      // Operators and text
      const start = i;
      while (i < query.length && !/[\s"()]/.test(query[i]!)) {
        i++;
      }
      const word = query.slice(start, i);

      // Check for field-specific search
      if (word.includes(':') && !word.startsWith(':') && !word.endsWith(':')) {
        const [field, ...valueParts] = word.split(':');
        const value = valueParts.join(':');

        if (this.isValidField(field!)) {
          // Handle quoted values after field
          if (query[i] === '"') {
            // Parse the quoted value
            const quotedToken = this.parseQuotedAfterField(query, i);
            tokens.push({
              type: TokenType.FIELD,
              value: quotedToken.value,
              field: field!,
            });
            i = quotedToken.endIndex;
          } else {
            tokens.push({
              type: TokenType.FIELD,
              value: value,
              field: field!,
            });
          }
          continue;
        }
      }

      // Check for operators
      const upperWord = word.toUpperCase();
      if (upperWord === 'AND') {
        tokens.push({ type: TokenType.AND, value: 'AND' });
      } else if (upperWord === 'OR') {
        tokens.push({ type: TokenType.OR, value: 'OR' });
      } else if (upperWord === 'NOT' || word === '-') {
        tokens.push({ type: TokenType.NOT, value: 'NOT' });
      } else if (word.includes('*') || word.includes('?')) {
        tokens.push({ type: TokenType.WILDCARD, value: word });
      } else {
        tokens.push({ type: TokenType.TEXT, value: word });
      }
    }

    tokens.push({ type: TokenType.EOF, value: '' });
    return tokens;
  }

  /**
   * Parse quoted value after field specifier
   */
  private parseQuotedAfterField(
    query: string,
    startIndex: number,
  ): { value: string; endIndex: number } {
    let i = startIndex + 1; // Skip opening quote
    const start = i;

    while (i < query.length && query[i] !== '"') {
      if (query[i] === '\\' && query[i + 1] === '"') {
        i += 2;
      } else {
        i++;
      }
    }

    const value = query.slice(start, i).replace(/\\"/g, '"');
    return { value, endIndex: i + 1 }; // +1 to skip closing quote
  }

  /**
   * Check if a field name is valid
   */
  private isValidField(field: string): boolean {
    return ['title', 'content', 'tags', 'tag'].includes(field.toLowerCase());
  }

  /**
   * Parse expression with OR precedence
   */
  private parseExpression(): Array<{
    clause: QueryClause;
    isNegated: boolean;
    isOptional: boolean;
  }> {
    let left = this.parseAndExpression();

    while (this.match(TokenType.OR)) {
      const right = this.parseAndExpression();

      // Mark both sides as optional (OR means at least one must match)
      left = left.map((c) => ({ ...c, isOptional: true }));
      right.forEach((c) => {
        c.isOptional = true;
        left.push(c);
      });
    }

    return left;
  }

  /**
   * Parse AND expression
   */
  private parseAndExpression(): Array<{
    clause: QueryClause;
    isNegated: boolean;
    isOptional: boolean;
  }> {
    const clauses: Array<{ clause: QueryClause; isNegated: boolean; isOptional: boolean }> = [];
    let first = true;

    while (!this.isAtEnd() && !this.check(TokenType.OR) && !this.check(TokenType.RPAREN)) {
      // Implicit AND between terms
      if (!first && !this.previous().type.includes('AND')) {
        // Terms are implicitly AND-ed
      }

      const term = this.parseTerm();
      if (term) {
        clauses.push(term);
      }

      first = false;

      // Consume explicit AND if present
      this.match(TokenType.AND);
    }

    return clauses;
  }

  /**
   * Parse a single term
   */
  private parseTerm(): { clause: QueryClause; isNegated: boolean; isOptional: boolean } | null {
    // Handle NOT
    const isNegated = this.match(TokenType.NOT);

    // Handle parentheses
    if (this.match(TokenType.LPAREN)) {
      const subExpression = this.parseExpression();
      this.consume(TokenType.RPAREN, 'Expected closing parenthesis');

      // Combine sub-expression clauses
      if (subExpression.length === 1) {
        return {
          clause: subExpression[0]!.clause,
          isNegated: isNegated !== subExpression[0]!.isNegated,
          isOptional: subExpression[0]!.isOptional,
        };
      }

      // For multiple clauses, create a combined clause
      // This is a simplification - in a full implementation,
      // we might want to support nested boolean logic
      return null;
    }

    // Handle field-specific search
    if (this.check(TokenType.FIELD)) {
      const token = this.advance();
      return {
        clause: {
          field: token.field as 'title' | 'content' | 'tags',
          value: token.value,
          type: this.determineClauseType(token.value),
        },
        isNegated,
        isOptional: false,
      };
    }

    // Handle quoted strings
    if (this.check(TokenType.QUOTED)) {
      const token = this.advance();
      return {
        clause: {
          value: token.value,
          type: 'phrase',
        },
        isNegated,
        isOptional: false,
      };
    }

    // Handle wildcards
    if (this.check(TokenType.WILDCARD)) {
      const token = this.advance();
      return {
        clause: {
          value: token.value,
          type: 'wildcard',
        },
        isNegated,
        isOptional: false,
      };
    }

    // Handle regular text
    if (this.check(TokenType.TEXT)) {
      const token = this.advance();
      return {
        clause: {
          value: token.value,
          type: 'fuzzy',
        },
        isNegated,
        isOptional: false,
      };
    }

    return null;
  }

  /**
   * Determine clause type based on value
   */
  private determineClauseType(value: string): QueryClause['type'] {
    if (value.includes('*') || value.includes('?')) {
      return 'wildcard';
    }
    return 'fuzzy';
  }

  /**
   * Match and consume a token type
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * Check current token type
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Advance to next token
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * Check if at end of tokens
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Peek at current token
   */
  private peek(): Token {
    return this.tokens[this.current]!;
  }

  /**
   * Get previous token
   */
  private previous(): Token {
    return this.tokens[this.current - 1]!;
  }

  /**
   * Consume a token or throw error
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`Parse error at token ${this.current}: ${message}`);
  }

  /**
   * Convert parsed query back to normalized string (for debugging)
   */
  static normalize(parsed: ParsedQuery): string {
    const parts: string[] = [];

    // Add must clauses
    if (parsed.must.length > 0) {
      parts.push(parsed.must.map((c) => this.clauseToString(c)).join(' AND '));
    }

    // Add should clauses
    if (parsed.should.length > 0) {
      const shouldPart = parsed.should.map((c) => this.clauseToString(c)).join(' OR ');
      if (parts.length > 0) {
        parts.push(`AND (${shouldPart})`);
      } else {
        parts.push(shouldPart);
      }
    }

    // Add must not clauses
    if (parsed.mustNot.length > 0) {
      const notPart = parsed.mustNot.map((c) => `NOT ${this.clauseToString(c)}`).join(' AND ');
      if (parts.length > 0) {
        parts.push(`AND ${notPart}`);
      } else {
        parts.push(notPart);
      }
    }

    return parts.join(' ');
  }

  /**
   * Convert clause to string
   */
  private static clauseToString(clause: QueryClause): string {
    const value = clause.type === 'phrase' ? `"${clause.value}"` : clause.value;
    return clause.field ? `${clause.field}:${value}` : value;
  }
}
