import type { LogLevel, LogEntry } from './types';
import { addLog } from './storage';

class ExtensionLogger {
  private prefix = '[Minore]';

  private async log(level: LogLevel, message: string, data?: unknown): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: Date.now(),
    };

    const consoleFn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'debug' ? console.debug
      : console.log;

    if (data) {
      consoleFn(`${this.prefix} [${level.toUpperCase()}] ${message}`, data);
    } else {
      consoleFn(`${this.prefix} [${level.toUpperCase()}] ${message}`);
    }

    try {
      await addLog(entry);
    } catch {
      // Storage write failure is non-critical
    }
  }

  async debug(message: string, data?: unknown): Promise<void> {
    return this.log('debug', message, data);
  }

  async info(message: string, data?: unknown): Promise<void> {
    return this.log('info', message, data);
  }

  async warn(message: string, data?: unknown): Promise<void> {
    return this.log('warn', message, data);
  }

  async error(message: string, data?: unknown): Promise<void> {
    return this.log('error', message, data);
  }
}

export const logger = new ExtensionLogger();
