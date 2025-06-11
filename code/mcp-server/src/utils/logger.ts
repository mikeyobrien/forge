// ABOUTME: This file provides a stdio-safe logging utility for the MCP server
// ABOUTME: that writes to stderr to avoid interfering with JSON-RPC on stdout

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Stdio-safe logger implementation that writes to stderr
 */
class Logger {
  private logLevel: LogLevel;
  private enabled: boolean;

  constructor() {
    // Set log level based on environment variable
    const envLevel = process.env['LOG_LEVEL']?.toUpperCase();
    this.logLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;

    // Disable logging for stdio MCP servers unless explicitly enabled
    this.enabled = process.env['MCP_ENABLE_LOGGING'] === 'true';
  }

  /**
   * Log a debug message to stderr
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.enabled && this.logLevel <= LogLevel.DEBUG) {
      this.writeToStderr(`[DEBUG] ${message}`, args);
    }
  }

  /**
   * Log an info message to stderr
   */
  info(message: string, ...args: unknown[]): void {
    if (this.enabled && this.logLevel <= LogLevel.INFO) {
      this.writeToStderr(`[INFO] ${message}`, args);
    }
  }

  /**
   * Log a warning to stderr
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.enabled && this.logLevel <= LogLevel.WARN) {
      this.writeToStderr(`[WARN] ${message}`, args);
    }
  }

  /**
   * Log an error to stderr
   */
  error(message: string, ...args: unknown[]): void {
    if (this.enabled && this.logLevel <= LogLevel.ERROR) {
      this.writeToStderr(`[ERROR] ${message}`, args);
    }
  }

  /**
   * Set the log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Write message to stderr
   */
  private writeToStderr(message: string, args: unknown[]): void {
    const fullMessage =
      args.length > 0 ? `${message} ${args.map((arg) => JSON.stringify(arg)).join(' ')}` : message;
    process.stderr.write(fullMessage + '\n');
  }
}

// Export singleton instance
export const logger = new Logger();
