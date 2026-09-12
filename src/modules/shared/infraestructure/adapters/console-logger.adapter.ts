import type { Logger } from '#modules/shared/domain/interfaces/logger.interface';

export class ConsoleLogger implements Logger {
  private write(level: string, message: string, meta?: Record<string, unknown>) {
    const entry = { ts: new Date().toISOString(), level, message, ...(meta ?? {}) };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
  debug(m: string, meta?: Record<string, unknown>) {
    this.write('debug', m, meta);
  }
  info(m: string, meta?: Record<string, unknown>) {
    this.write('info', m, meta);
  }
  warn(m: string, meta?: Record<string, unknown>) {
    this.write('warn', m, meta);
  }
  error(m: string, meta?: Record<string, unknown>) {
    this.write('error', m, meta);
  }
}

export class SilentLogger implements Logger {
  debug() {}
  info() {}
  warn() {}
  error() {}
}
