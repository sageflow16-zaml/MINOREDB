export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  project_id?: string;
  operation?: string;
  function?: string;
  duration_ms?: number;
  error_code?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
}

function shouldLog(level: LogLevel): boolean {
  const min = (Deno.env.get('LOG_LEVEL') || 'info') as LogLevel;
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return order.indexOf(level) >= order.indexOf(min);
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, ctx: LogContext = {}): void {
    if (!shouldLog(level)) return;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...ctx },
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  debug(message: string, ctx: LogContext = {}): Logger {
    this.log('debug', message, ctx);
    return this;
  }

  info(message: string, ctx: LogContext = {}): Logger {
    this.log('info', message, ctx);
    return this;
  }

  warn(message: string, ctx: LogContext = {}): Logger {
    this.log('warn', message, ctx);
    return this;
  }

  error(message: string, ctx: LogContext = {}): Logger {
    this.log('error', message, ctx);
    return this;
  }

  with(ctx: LogContext): Logger {
    return new Logger({ ...this.context, ...ctx });
  }

  time(label: string): { end: () => void } {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.info(`Timer: ${label}`, { duration_ms: duration });
      },
    };
  }
}

export const logger = new Logger({ function: 'unknown' });

export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half_open' = 'closed';

  constructor(
    private name: string,
    private failureThreshold: number = 5,
    private timeoutMs: number = 60000,
    private retryTimeoutMs: number = 60000,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailure;
      if (elapsed < this.timeoutMs) {
        throw new Error(`Circuit breaker "${this.name}" is open`);
      }
      this.state = 'half_open';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'half_open') {
      this.state = 'closed';
      logger.info(`Circuit breaker ${this.name} closed`, { circuit: this.name });
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.warn(`Circuit breaker ${this.name} opened`, {
        circuit: this.name,
        failures: this.failures,
        threshold: this.failureThreshold,
      });
    }
  }

  get currentFailure(): number {
    return this.failures;
  }
}

export class RetryStrategy {
  static async withBackoff<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelayMs?: number;
      maxDelayMs?: number;
      shouldRetry?: (err: unknown) => boolean;
      onRetry?: (err: unknown, attempt: number) => void;
    } = {},
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = options.baseDelayMs ?? 1000;
    const maxDelay = options.maxDelayMs ?? 30000;
    const shouldRetry = options.shouldRetry ?? (() => true);
    const onRetry = options.onRetry ?? (() => {});

    let lastErr: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt >= maxRetries || !shouldRetry(err)) {
          throw err;
        }
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = Math.random() * 0.3 + 0.7;
        onRetry(err, attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, Math.floor(delay * jitter)));
      }
    }
    throw lastErr;
  }
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxTokens: number, refillPerSecond: number) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.maxTokens = maxTokens;
    this.refillRate = refillPerSecond;
  }

  async acquire(): Promise<boolean> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const e = err as ApiError;
    if (e.message?.includes('timeout')) return true;
    if (e.message?.includes('ECONNREFUSED')) return true;
    if (e.message?.includes('ENOTFOUND')) return true;
    return false;
  }
  return false;
}
