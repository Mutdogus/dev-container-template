import { DiagnosticInfo } from '@vscode/types';
import { DiagnosticLogger } from './diagnostics';
import { TestLogger } from './logger';

/**
 * Enhanced diagnostic system for VS Code test output
 * Provides structured logging with multiple output formats and levels
 */
export class DiagnosticSystem {
  private logger: DiagnosticLogger;
  private testLogger: TestLogger;
  private outputFormat: 'json' | 'human' = 'human';
  private logLevel: 'info' | 'warning' | 'error' | 'debug' = 'info';

  constructor(outputFormat: 'json' | 'human' = 'human', logLevel: 'info' | 'warning' | 'error' | 'debug' = 'info') {
    this.logger = DiagnosticLogger.getInstance();
    this.testLogger = TestLogger.getInstance();
    this.outputFormat = outputFormat;
    this.logLevel = logLevel;
    this.logger.setLogLevel(logLevel);
  }

  /**
   * Log test start with structured information
   */
  public logTestStart(testName: string, context?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: 'info',
      message: `Starting test: ${testName}`,
      timestamp: new Date(),
      source: 'test-runner',
      details: context
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logTestStart(testName, context);
  }

  /**
   * Log test completion with detailed results
   */
  public logTestEnd(testName: string, duration: number, passed: boolean, metrics?: Record<string, any>): void {
    const status = passed ? 'PASSED' : 'FAILED';
    const diagnostic: DiagnosticInfo = {
      level: passed ? 'info' : 'error',
      message: `Test ${testName} ${status} in ${duration}ms`,
      timestamp: new Date(),
      source: 'test-runner',
      details: {
        duration,
        passed,
        status,
        ...metrics
      }
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logTestEnd(testName, duration, passed, metrics);
  }

  /**
   * Log container operation with status and details
   */
  public logContainerOperation(operation: string, containerId: string, status: 'success' | 'failure' | 'warning', details?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: status === 'failure' ? 'error' : status === 'warning' ? 'warning' : 'info',
      message: `Container ${operation}: ${containerId} - ${status}`,
      timestamp: new Date(),
      source: 'container',
      details: {
        operation,
        containerId,
        status,
        ...details
      }
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logContainerOperation(operation, containerId, details);
  }

  /**
   * Log extension operation with comprehensive details
   */
  public logExtensionOperation(operation: string, extensionId: string, extensionName: string, status: 'success' | 'failure' | 'warning', details?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: status === 'failure' ? 'error' : status === 'warning' ? 'warning' : 'info',
      message: `Extension ${operation}: ${extensionName} (${extensionId}) - ${status}`,
      timestamp: new Date(),
      source: 'extension',
      details: {
        operation,
        extensionId,
        extensionName,
        status,
        ...details
      }
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logExtensionOperation(operation, extensionId, details);
  }

  /**
   * Log performance metrics with context
   */
  public logPerformanceMetric(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: 'info',
      message: `Performance: ${metric} = ${value}${unit}`,
      timestamp: new Date(),
      source: 'performance',
      details: {
        metric,
        value,
        unit,
        ...context
      }
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logPerformanceMetric(metric, value, unit, context);
  }

  /**
   * Log error with full context and stack trace
   */
  public logError(error: Error, context: string, additionalInfo?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: 'error',
      message: `${context}: ${error.message}`,
      timestamp: new Date(),
      source: context,
      details: {
        error: error.message,
        stack: error.stack,
        name: error.name,
        ...additionalInfo
      }
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logError(error, context, additionalInfo);
  }

  /**
   * Log warning with context
   */
  public logWarning(message: string, context: string, additionalInfo?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: 'warning',
      message,
      timestamp: new Date(),
      source: context,
      details: additionalInfo
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logWarning(message, context, additionalInfo);
  }

  /**
   * Log debug information
   */
  public logDebug(message: string, context: string, additionalInfo?: Record<string, any>): void {
    const diagnostic: DiagnosticInfo = {
      level: 'debug',
      message,
      timestamp: new Date(),
      source: context,
      details: additionalInfo
    };

    this.outputDiagnostic(diagnostic);
    this.testLogger.logDebug(message, context, additionalInfo);
  }

  /**
   * Output diagnostic in configured format
   */
  private outputDiagnostic(diagnostic: DiagnosticInfo): void {
    if (!this.shouldLogLevel(diagnostic.level)) {
      return;
    }

    switch (this.outputFormat) {
      case 'json':
        this.outputJson(diagnostic);
        break;
      case 'human':
        this.outputHuman(diagnostic);
        break;
    }
  }

  /**
   * Output diagnostic in JSON format
   */
  private outputJson(diagnostic: DiagnosticInfo): void {
    console.log(JSON.stringify(diagnostic));
  }

  /**
   * Output diagnostic in human-readable format
   */
  private outputHuman(diagnostic: DiagnosticInfo): void {
    const timestamp = diagnostic.timestamp.toISOString();
    const level = diagnostic.level.toUpperCase();
    const source = diagnostic.source;
    const message = diagnostic.message;

    let output = `[${timestamp}] [${level}] [${source}] ${message}`;

    // Add details if available and in verbose mode
    if (diagnostic.details && process.env.VERBOSE_TEST_OUTPUT === 'true') {
      output += `\nDetails: ${JSON.stringify(diagnostic.details, null, 2)}`;
    }

    // Color coding for console output
    switch (diagnostic.level) {
      case 'error':
        console.error(`\x1b[31m${output}\x1b[0m`); // Red
        break;
      case 'warning':
        console.warn(`\x1b[33m${output}\x1b[0m`); // Yellow
        break;
      case 'debug':
        if (process.env.DEBUG_TESTS === 'true') {
          console.log(`\x1b[36m${output}\x1b[0m`); // Cyan
        }
        break;
      default:
        console.log(output); // Default color
    }
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
   * Set output format
   */
  public setOutputFormat(format: 'json' | 'human'): void {
    this.outputFormat = format;
    this.logger.info(`Output format set to: ${format}`, 'diagnostic-system');
  }

  /**
   * Set log level
   */
  public setLogLevel(level: 'info' | 'warning' | 'error' | 'debug'): void {
    this.logLevel = level;
    this.logger.setLogLevel(level);
    this.logger.info(`Log level set to: ${level}`, 'diagnostic-system');
  }

  /**
   * Get diagnostic statistics
   */
  public getStatistics(): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    debug: number;
  } {
    const allLogs = this.logger.getLogs();
    
    return {
      total: allLogs.length,
      errors: allLogs.filter(log => log.level === 'error').length,
      warnings: allLogs.filter(log => log.level === 'warning').length,
      info: allLogs.filter(log => log.level === 'info').length,
      debug: allLogs.filter(log => log.level === 'debug').length
    };
  }

  /**
   * Export all diagnostics to file
   */
  public async exportDiagnostics(outputPath?: string): Promise<string> {
    const allLogs = this.logger.getLogs();
    const exportPath = outputPath || `test-results/diagnostics-${Date.now()}.json`;
    
    const exportData = {
      exportTime: new Date().toISOString(),
      statistics: this.getStatistics(),
      configuration: {
        outputFormat: this.outputFormat,
        logLevel: this.logLevel
      },
      diagnostics: allLogs
    };

    await this.testLogger.exportLogs(exportPath);
    
    this.logger.info('Diagnostics exported to file', 'diagnostic-system', { exportPath });
    
    return exportPath;
  }

  /**
   * Clear all diagnostics
   */
  public clearDiagnostics(): void {
    this.logger.clearLogs();
    this.logger.info('Diagnostics cleared', 'diagnostic-system');
  }

  /**
   * Create diagnostic summary
   */
  public createSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    errorCount: number;
    warningCount: number;
    duration: number;
    successRate: number;
  } {
    const allLogs = this.logger.getLogs();
    const testLogs = allLogs.filter(log => log.source === 'test-runner');
    
    const totalTests = testLogs.length;
    const passedTests = testLogs.filter(log => log.message.includes('PASSED')).length;
    const failedTests = testLogs.filter(log => log.message.includes('FAILED')).length;
    const errorCount = allLogs.filter(log => log.level === 'error').length;
    const warningCount = allLogs.filter(log => log.level === 'warning').length;
    
    // Calculate total duration from test logs
    const duration = testLogs.reduce((sum, log) => {
      const durationMatch = log.message.match(/in (\\d+)ms/);
      return sum + (durationMatch ? parseInt(durationMatch[1]) : 0);
    }, 0);

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      errorCount,
      warningCount,
      duration,
      successRate
    };
  }

  /**
   * Print diagnostic summary
   */
  public printSummary(): void {
    const summary = this.createSummary();
    
    console.log('\n=== VS Code Testing Summary ===');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Duration: ${summary.duration}ms`);
    console.log(`Errors: ${summary.errorCount}`);
    console.log(`Warnings: ${summary.warningCount}`);
    console.log('=============================\n');
  }

  /**
   * Dispose diagnostic system
   */
  public dispose(): void {
    this.testLogger.flush();
    this.logger.info('Diagnostic system disposed', 'diagnostic-system');
  }
}