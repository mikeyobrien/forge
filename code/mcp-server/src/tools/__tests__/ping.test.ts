// ABOUTME: Unit tests for the ping tool
// ABOUTME: Verifies ping functionality with various inputs

import { handlePing, PingArgs } from '../ping';

interface PingResponse {
  message: string;
  timestamp: string;
  contextRoot: string;
}

describe('handlePing', () => {
  beforeEach(() => {
    // Set a test context root
    process.env['CONTEXT_ROOT'] = '/test/context';
  });

  afterEach(() => {
    delete process.env['CONTEXT_ROOT'];
  });

  it('should return default pong message when no message provided', () => {
    const args: PingArgs = {};
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.message).toBe('pong');
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.contextRoot).toBe('/test/context');
  });

  it('should echo custom message', () => {
    const args: PingArgs = { message: 'Hello, MCP!' };
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.message).toBe('Hello, MCP!');
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.contextRoot).toBe('/test/context');
  });

  it('should handle empty message', () => {
    const args: PingArgs = { message: '' };
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.message).toBe('');
    expect(parsed.timestamp).toBeDefined();
  });

  it('should handle whitespace message', () => {
    const args: PingArgs = { message: '   ' };
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.message).toBe('   ');
  });

  it('should handle special characters', () => {
    const args: PingArgs = { message: 'Hello! @#$%^&*() 123' };
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.message).toBe('Hello! @#$%^&*() 123');
  });

  it('should handle unicode characters', () => {
    const args: PingArgs = { message: 'Hello 世界 🌍' };
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.message).toBe('Hello 世界 🌍');
  });

  it('should use unknown when CONTEXT_ROOT is not set', () => {
    delete process.env['CONTEXT_ROOT'];

    const args: PingArgs = { message: 'test' };
    const result = handlePing(args);
    const parsed = JSON.parse(result) as PingResponse;

    expect(parsed.contextRoot).toBe('unknown');
  });
});
