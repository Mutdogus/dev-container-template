import { VSCodeTestResult, TestMetrics } from '../types';

/**
 * Factory for creating test results with consistent structure
 */
export class TestResultFactory {
  /**
   * Create a test result with specified status
   */
  public static createTestResult(
    id: string,
    name: string,
    status: VSCodeTestResult['status'],
    duration: number,
    error?: string,
    metrics?: TestMetrics
  ): VSCodeTestResult {
    return {
      id,
      name,
      status,
      duration,
      error,
      metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Create a failed test result
   */
  public static createFailedTest(
    id: string,
    name: string,
    duration: number,
    error: string
  ): VSCodeTestResult {
    return TestResultFactory.createTestResult(id, name, 'failed', duration, error);
  }

  /**
   * Create a passed test result
   */
  public static createPassedTest(
    id: string,
    name: string,
    duration: number,
    metrics?: TestMetrics
  ): VSCodeTestResult {
    return TestResultFactory.createTestResult(id, name, 'passed', duration, undefined, metrics);
  }

  /**
   * Create a skipped test result
   */
  public static createSkippedTest(id: string, name: string, reason: string): VSCodeTestResult {
    return TestResultFactory.createTestResult(id, name, 'skipped', 0, reason);
  }
}
