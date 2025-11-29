export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;

  private constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.logLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
    this.enableConsole = process.env.NODE_ENV !== 'test';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel && this.enableConsole;
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? `\n${entry.error.stack}` : '';
    
    return `[${timestamp}] ${level} ${entry.message}${context}${error}`;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  public error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context: context || {},
      error,
    });
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context: context || {},
    });
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context: context || {},
    });
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context: context || {},
    });
  }

  public setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public enableConsoleOutput(enable: boolean): void {
    this.enableConsole = enable;
  }
}

export const logger = Logger.getInstance();