// ABOUTME: Ping tool implementation for MCP server
// ABOUTME: Provides a simple echo functionality for testing connections

export interface PingArgs {
  message?: string;
}

export function handlePing(args: PingArgs): string {
  const message = args.message !== undefined ? args.message : 'pong';
  return `Server response: ${message}`;
}
