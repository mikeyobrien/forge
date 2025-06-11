// ABOUTME: Unit tests for the ping tool
// ABOUTME: Verifies ping functionality with various inputs

import { handlePing, PingArgs } from '../ping';

describe('handlePing', () => {
  it('should return default pong message when no message provided', () => {
    const args: PingArgs = {};
    const result = handlePing(args);
    expect(result).toBe('Server response: pong');
  });

  it('should echo custom message', () => {
    const args: PingArgs = { message: 'Hello, MCP!' };
    const result = handlePing(args);
    expect(result).toBe('Server response: Hello, MCP!');
  });

  it('should handle empty message', () => {
    const args: PingArgs = { message: '' };
    const result = handlePing(args);
    expect(result).toBe('Server response: ');
  });

  it('should handle whitespace message', () => {
    const args: PingArgs = { message: '   ' };
    const result = handlePing(args);
    expect(result).toBe('Server response:    ');
  });

  it('should handle special characters', () => {
    const args: PingArgs = { message: 'Hello! @#$%^&*() 123' };
    const result = handlePing(args);
    expect(result).toBe('Server response: Hello! @#$%^&*() 123');
  });

  it('should handle unicode characters', () => {
    const args: PingArgs = { message: 'Hello 世界 🌍' };
    const result = handlePing(args);
    expect(result).toBe('Server response: Hello 世界 🌍');
  });
});
