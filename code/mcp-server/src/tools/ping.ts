// ABOUTME: Ping tool implementation for MCP server
// ABOUTME: Provides a simple echo functionality for testing connections

export interface PingArgs {
  message?: string;
}

export function handlePing(args: PingArgs): string {
  const message = args.message !== undefined ? args.message : 'pong';
  const response = {
    message,
    timestamp: new Date().toISOString(),
    contextRoot: process.env['CONTEXT_ROOT'] || 'unknown',
  };
  return JSON.stringify(response);
}
