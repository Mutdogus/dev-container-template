import { DiagnosticInfo } from '@vscode/types';
import { DiagnosticLogger } from './diagnostics';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Enhanced logging infrastructure for VS Code testing operations
 * Provides structured logging with file output and rotation
 */
export class TestLogger {
  private diagnosticLogger: DiagnosticLogger;
  private logFile?: string;
  private logBuffer: DiagnosticInfo[] = [];
  private flushInterval?: NodeJS.Timeout;
  private readonly maxBufferSize = 100;
  private readonly flushIntervalMs = 5000;

  constructor(logFile?: string) {
    this.diagnosticLogger = DiagnosticLogger.getInstance();
    this.logFile = logFile || path.join(process.cwd(), 'test-results', 'test.log');
    this.setupPeriodicFlush();
  }

  /**
   * Log test start
   */
  public logTestStart(testName: string, context?: Record<string, any>): void {
    this.diagnosticLogger.info(`Starting test: ${testName}`, 'test-logger', context);
    this.addToBuffer({
      level: 'info',
      message: `Starting test: ${testName}`,
      timestamp: new Date(),
      source: 'test-logger',
      details: context
    });
  }

  /**
   * Log test completion
   */
  public logTestEnd(testName: string, status: 'passed' | 'failed', duration: number, context?: Record<string, any>): void {
    this.diagnosticLogger.info(`Test ${testName} ${status} in ${duration}ms`, 'test-logger', { status, duration, ...context });
    this.addToBuffer({
      level: status === 'failed' ? 'error' : 'info',
      message: `Test ${testName} ${status} in ${duration}ms`,
      timestamp: new Date(),
      source: 'test-logger',
      details: { status, duration, ...context }
    });
  }

  /**
   * Log container operation
   */
  public logContainerOperation(operation: string, containerId: string, context?: Record<string, any>): void {
    this.diagnosticLogger.info(`Container ${operation}: ${containerId}`, 'container-logger', context);
    this.addToBuffer({
      level: 'info',
      message: `Container ${operation}: ${containerId}`,
      timestamp: new Date(),
      source: 'container-logger',
      details: context
    });
  }

  /**
   * Log extension operation
   */
  public logExtensionOperation(operation: string, extensionId: string, context?: Record<string, any>): void {
    this.diagnosticLogger.info(`Extension ${operation}: ${extensionId}`, 'extension-logger', context);
    this.addToBuffer({
      level: 'info',
      message: `Extension ${operation}: ${extensionId}`,
      timestamp: new Date(),
      source: 'extension-logger',
      details: context
    });
  }

  /**
   * Log performance metrics
   */
  public logPerformanceMetric(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    this.diagnosticLogger.info(`Performance: ${metric} = ${value}${unit}`, 'performance-logger', { metric, value, unit, ...context });
    this.addToBuffer({
      level: 'info',
      message: `Performance: ${metric} = ${value}${unit}`,
      timestamp: new Date(),
      source: 'performance-logger',
      details: { metric, value, unit, ...context }
    });
  }

  /**
   * Log error with stack trace
   */
  public logError(error: Error, context: string, additionalInfo?: Record<string, any>): void {
    this.diagnosticLogger.error(`${context}: ${error.message}`, context, {
      stack: error.stack,
      ...additionalInfo
    });
    this.addToBuffer({
      level: 'error',
      message: `${context}: ${error.message}`,
      timestamp: new Date(),
      source: context,
      details: {
        stack: error.stack,
        ...additionalInfo
      }
    });
  }

  /**
   * Log warning
   */
  public logWarning(message: string, context: string, additionalInfo?: Record<string, any>): void {
    this.diagnosticLogger.warning(message, context, additionalInfo);
    this.addToBuffer({
      level: 'warning',
      message,
      timestamp: new Date(),
      source: context,
      details: additionalInfo
    });
  }

  /**
   * Log debug information
   */
  public logDebug(message: string, context: string, additionalInfo?: Record<string, any>): void {
    this.diagnosticLogger.debug(message, context, additionalInfo);
    this.addToBuffer({
      level: 'debug',
      message,
      timestamp: new Date(),
      source: context,
      details: additionalInfo
    });
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: DiagnosticInfo): void {
    this.logBuffer.push(entry);

    // Flush immediately for errors
    if (entry.level === 'error') {
      this.flushBuffer();
    } else if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * Setup periodic flush interval
   */
  private setupPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushBuffer();
      }
    }, this.flushIntervalMs);
  }

  /**
   * Flush buffer to file
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.logFile) {
      return;
    }

    const entriesToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.ensureLogDirectory();
      
      const logLines = entriesToFlush.map(entry => this.formatLogEntry(entry));
      const logContent = logLines.join('\n') + '\n';

      await fs.appendFile(this.logFile, logContent, 'utf-8');
      
    } catch (error) {
      console.error('Failed to flush log buffer:', error);
      // Re-add entries to buffer if flush failed
      this.logBuffer.unshift(...entriesToFlush);
    }
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(entry: DiagnosticInfo): string {
    const timestamp = entry.timestamp.toISOString();
    const details = entry.details ? JSON.stringify(entry.details) : '';
    return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${details ? ` ${details}` : ''}`;
  }

  /**
   * Force flush all pending logs
   */
  public async flush(): Promise<void> {
    await this.flushBuffer();
  }

  /**
   * Get log statistics
   */
  public getStatistics(): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    debug: number;
  } {
    const allLogs = this.diagnosticLogger.getLogs();
    
    return {
      total: allLogs.length,
      errors: allLogs.filter(log => log.level === 'error').length,
      warnings: allLogs.filter(log => log.level === 'warning').length,
      info: allLogs.filter(log => log.level === 'info').length,
      debug: allLogs.filter(log => log.level === 'debug').length
    };
  }

  /**
   * Export logs to JSON file
   */
  public async exportLogs(outputPath?: string): Promise<string> {
    const allLogs = this.diagnosticLogger.getLogs();
    const exportPath = outputPath || path.join(process.cwd(), 'test-results', 'logs-export.json');
    
    await this.ensureLogDirectory();
    
    const exportData = {
      exportTime: new Date().toISOString(),
      statistics: this.getStatistics(),
      logs: allLogs
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    this.diagnosticLogger.info('Logs exported to file', 'test-logger', { exportPath });
    
    return exportPath;
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.diagnosticLogger.clearLogs();
    this.logBuffer = [];
    this.diagnosticLogger.info('Logs cleared', 'test-logger');
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush any remaining logs
    this.flushBuffer().catch(error => {
      console.error('Failed to flush logs on dispose:', error);
    });
    
    this.diagnosticLogger.info('Test logger disposed', 'test-logger');
  }
}

/**
 * Singleton instance for global access
 */
export class TestLoggerFactory {
  private static instance: TestLogger;

  public static getInstance(logFile?: string): TestLogger {
    if (!TestLoggerFactory.instance) {
      TestLoggerFactory.instance = new TestLogger(logFile);
    }
    return TestLoggerFactory.instance;
  }

  public static resetInstance(): void {
    if (TestLoggerFactory.instance) {
      TestLoggerFactory.instance.dispose();
      TestLoggerFactory.instance = null as any;
    }
  }
}