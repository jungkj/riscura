// Enhanced Logger for Performance Monitoring
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
  context?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.getContext(),
    };
  }

  private getContext(): string {
    if (typeof window !== 'undefined') {
      return 'client';
    }
    return 'server';
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.isDevelopment
      ? this.formatForDevelopment(entry)
      : this.formatForProduction(entry);

    switch (entry.level) {
      case 'debug':
        // console.debug(formatted);
        break;
      case 'info':
        // console.info(formatted);
        break;
      case 'warn':
        // console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        // console.error(formatted);
        break;
    }
  }

  private formatForDevelopment(entry: LogEntry): string {
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';

    let message = `${timestamp} ${level} ${context} ${entry.message}`;

    if (entry.data) {
      message += `\n${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      message += `\n${entry.error.stack}`;
    }

    return message;
  }

  private formatForProduction(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  public debug(message: string, data?: any): void {
    this.output(this.formatMessage('debug', message, data));
  }

  public info(message: string, data?: any): void {
    this.output(this.formatMessage('info', message, data));
  }

  public warn(message: string, data?: any): void {
    this.output(this.formatMessage('warn', message, data));
  }

  public error(message: string, error?: Error | any, data?: any): void {
    const entry = this.formatMessage('error', message, data);
    if (error instanceof Error) {
      entry.error = error;
    } else if (error) {
      entry.data = { ...entry.data, error };
    }
    this.output(entry);
  }

  public fatal(message: string, error?: Error | any, data?: any): void {
    const entry = this.formatMessage('fatal', message, data);
    if (error instanceof Error) {
      entry.error = error;
    } else if (error) {
      entry.data = { ...entry.data, error };
    }
    this.output(entry);
  }

  // Performance logging
  public performance(operation: string, duration: number, data?: any): void {
    const entry = this.formatMessage('info', `Performance: ${operation}`, data);
    entry.duration = duration;
    this.output(entry);
  }

  // Request logging
  public request(method: string, url: string, duration: number, status: number): void {
    const entry = this.formatMessage('info', `${method} ${url} - ${status}`, {
      method,
      url,
      status,
    });
    entry.duration = duration;
    this.output(entry);
  }

  // User action logging
  public userAction(_userId: string, action: string, data?: any): void {
    const entry = this.formatMessage('info', `User action: ${action}`, data);
    entry.userId = userId;
    this.output(entry);
  }

  // Cache logging
  public cache(operation: string, key: string, hit: boolean, duration?: number): void {
    const entry = this.formatMessage('debug', `Cache ${operation}: ${key}`, {
      operation,
      key,
      hit,
    });
    if (duration) {
      entry.duration = duration;
    }
    this.output(entry);
  }

  // Database logging
  public database(query: string, duration: number, rows?: number): void {
    const entry = this.formatMessage('debug', `Database query`, {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      rows,
    });
    entry.duration = duration;
    this.output(entry);
  }

  // Security logging
  public security(event: string, userId?: string, data?: any): void {
    const entry = this.formatMessage('warn', `Security event: ${event}`, data);
    if (userId) {
      entry.userId = userId;
    }
    this.output(entry);
  }

  // Set log level dynamically
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Get current log level
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export class for testing
export { Logger };
