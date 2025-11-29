import { DiagnosticInfo } from '../types';

/**
 * Simple diagnostic logger for VS Code testing
 * Provides in-memory logging with basic functionality
 */
export class DiagnosticLogger {
  private static instance: DiagnosticLogger;
  private logs: DiagnosticInfo[] = [];
  private logLevel: 'info' | 'warning' | 'error' | 'debug' = 'info';

  private constructor() {}

  public static getInstance(): DiagnosticLogger {
    if (!DiagnosticLogger.instance) {
      DiagnosticLogger.instance = new DiagnosticLogger();
    }
    return DiagnosticLogger.instance;
  }

  /**
   * Log info message
   */
  public info(message: string, source: string, details?: Record<string, any>): void {
    this.addLog({
      level: 'info',
      message,
      timestamp: new Date(),
      source,
      details,
    });
  }

  /**
   * Log warning message
   */
  public warning(message: string, source: string, details?: Record<string, any>): void {
    this.addLog({
      level: 'warning',
      message,
      timestamp: new Date(),
      source,
      details,
    });
  }

  /**
   * Log error message
   */
  public error(message: string, source: string, details?: Record<string, any>): void {
    this.addLog({
      level: 'error',
      message,
      timestamp: new Date(),
      source,
      details,
    });
  }

  /**
   * Log debug message
   */
  public debug(message: string, source: string, details?: Record<string, any>): void {
    this.addLog({
      level: 'debug',
      message,
      timestamp: new Date(),
      source,
      details,
    });
  }

  /**
   * Add log entry
   */
  private addLog(log: DiagnosticInfo): void {
    if (!this.shouldLogLevel(log.level)) {
      return;
    }
    this.logs.push(log);
  }

  /**
   * Check if log level should be output
   */
  private shouldLogLevel(level: DiagnosticInfo['level']): boolean {
    const levels = ['debug', 'info', 'warning', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Set log level
   */
  public setLogLevel(level: 'info' | 'warning' | 'error' | 'debug'): void {
    this.logLevel = level;
  }

  /**
   * Get logs filtered by level
   */
  public getLogs(level?: DiagnosticInfo['level']): DiagnosticInfo[] {
    if (!level) {
      return [...this.logs];
    }
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get error count
   */
  public getErrorCount(): number {
    return this.logs.filter(log => log.level === 'error').length;
  }

  /**
   * Get warning count
   */
  public getWarningCount(): number {
    return this.logs.filter(log => log.level === 'warning').length;
  }

  /**
   * Check if there are errors
   */
  public hasErrors(): boolean {
    return this.getErrorCount() > 0;
  }

  /**
   * Check if there are warnings
   */
  public hasWarnings(): boolean {
    return this.getWarningCount() > 0;
  }

  /**
   * Export logs to JSON string
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
