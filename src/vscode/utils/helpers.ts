import { VSCodeTestResult, ContainerValidation, ExtensionStatus, EnvironmentCheck, ResourceUsage } from '@vscode/types';
import { TestLogger } from './logger';

/**
 * Utility functions and helpers for VS Code testing
 */
export class VSCodeTestUtils {
  private static logger = TestLogger.getInstance();

  /**
   * Wait for a condition to be true with timeout
   */
  public static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeoutMs: number,
    intervalMs: number = 1000,
    context?: string
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await condition();
        if (result) {
          return true;
        }
      } catch (error) {
        this.logger.logWarning(`Condition check failed: ${error}`, 'test-utils', { context });
      }
      
      await this.sleep(intervalMs);
    }
    
    this.logger.logWarning(`Condition timeout after ${timeoutMs}ms`, 'test-utils', { context });
    return false;
  }

  /**
   * Execute command with timeout
   */
  public static async executeWithTimeout<T>(
    command: () => Promise<T>,
    timeoutMs: number,
    context?: string
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await command();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Retry operation with exponential backoff
   */
  public static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    baseDelayMs: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt <= maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.logWarning(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries + 1})`, 'test-utils', {
            context,
            error: lastError.message
          });
          await this.sleep(delay);
        }
      }
    }

    this.logger.logError(lastError!, `Operation failed after ${maxRetries} retries`, { context });
    throw lastError!;
  }

  /**
   * Generate unique test ID
   */
  public static generateTestId(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Generate unique container name
   */
  public static generateContainerName(prefix: string = 'vscode-test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Parse memory usage from string
   */
  public static parseMemoryUsage(memoryStr: string): number {
    const match = memoryStr.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)?/i);
    if (!match) {
      throw new Error(`Invalid memory format: ${memoryStr}`);
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    switch (unit) {
      case 'KB':
        return value * 1024;
      case 'MB':
        return value * 1024 * 1024;
      case 'GB':
        return value * 1024 * 1024 * 1024;
      case 'TB':
        return value * 1024 * 1024 * 1024 * 1024;
      default:
        return value;
    }
  }

  /**
   * Format memory usage to human readable string
   */
  public static formatMemoryUsage(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format duration to human readable string
   */
  public static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Check if test result is successful
   */
  public static isTestSuccessful(result: VSCodeTestResult): boolean {
    return result.status === 'passed';
  }

  /**
   * Check if container validation is successful
   */
  public static isContainerValidationSuccessful(validation: ContainerValidation): boolean {
    return validation.status === 'running' && 
           validation.extensions.every(ext => ext.status === 'loaded') &&
           validation.environmentChecks.every(check => check.status !== 'failed');
  }

  /**
   * Calculate success rate from test results
   */
  public static calculateSuccessRate(results: VSCodeTestResult[]): number {
    if (results.length === 0) {
      return 0;
    }

    const passed = results.filter(result => this.isTestSuccessful(result)).length;
    return (passed / results.length) * 100;
  }

  /**
   * Filter test results by status
   */
  public static filterTestsByStatus(results: VSCodeTestResult[], status: VSCodeTestResult['status']): VSCodeTestResult[] {
    return results.filter(result => result.status === status);
  }

  /**
   * Get slowest tests
   */
  public static getSlowestTests(results: VSCodeTestResult[], count: number = 5): VSCodeTestResult[] {
    return results
      .filter(result => result.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, count);
  }

  /**
   * Check memory usage against threshold
   */
  public static checkMemoryThreshold(usage: ResourceUsage['memory'], thresholdMb: number): {
    isAboveThreshold: boolean;
    usageMb: number;
    thresholdMb: number;
    percentage: number;
  } {
    const usageMb = usage.used / (1024 * 1024);
    const percentage = (usageMb / thresholdMb) * 100;

    return {
      isAboveThreshold: usageMb > thresholdMb,
      usageMb,
      thresholdMb,
      percentage
    };
  }

  /**
   * Create test result with timing
   */
  public static async createTimedTestResult(
    testId: string,
    testName: string,
    testFunction: () => Promise<void>
  ): Promise<VSCodeTestResult> {
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        id: testId,
        name: testName,
        status: 'passed',
        duration,
        timestamp: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        id: testId,
        name: testName,
        status: 'failed',
        duration,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create directory if it doesn't exist
   */
  public static async ensureDirectory(dirPath: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Check if file exists
   */
  public static async fileExists(filePath: string): Promise<boolean> {
    const fs = await import('fs/promises');
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read JSON file safely
   */
  public static async readJsonFile<T>(filePath: string): Promise<T | null> {
    const fs = await import('fs/promises');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.logWarning(`Failed to read JSON file: ${filePath}`, 'test-utils', { error });
      return null;
    }
  }

  /**
   * Write JSON file safely
   */
  public static async writeJsonFile(filePath: string, data: any): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await this.ensureDirectory(path.dirname(filePath));
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      this.logger.logError(error instanceof Error ? error : new Error(String(error)), 'test-utils', { filePath });
      throw error;
    }
  }

  /**
   * Sanitize string for file names
   */
  public static sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  /**
   * Get current timestamp string
   */
  public static getTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Deep clone object
   */
  public static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Merge objects with deep merge
   */
  public static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
    
    return result;
  }
}