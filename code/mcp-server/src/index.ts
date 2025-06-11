// ABOUTME: Entry point for the MCP server implementation
// ABOUTME: Provides Model Context Protocol server functionality

export function hello(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}
