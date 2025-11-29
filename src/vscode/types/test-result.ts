import { VSCodeTestResult, TestMetrics } from '@vscode/types';
import { TestResultFactory } from './test-result';

/**
 * Test result models for VS Code testing
 * Provides comprehensive result tracking with metrics and metadata
 */
export class TestResultBuilder {
  private result: Partial<VSCodeTestResult> = {};

  public constructor(id: string, name: string) {
    this.result.id = id;
    this.result.name = name;
    this.result.status = 'pending';
    this.result.timestamp = new Date();
  }

  /**
   * Set test status
   */
  public setStatus(status: VSCodeTestResult['status']): TestResultBuilder {
    this.result.status = status;
    return this;
  }

  /**
   * Set test duration
   */
  public setDuration(duration: number): TestResultBuilder {
    this.result.duration = duration;
    return this;
  }

  /**
   * Set error message
   */
  public setError(error: string): TestResultBuilder {
    this.result.error = error;
    this.result.status = 'failed';
    return this;
  }

  /**
   * Set test metrics
   */
  public setMetrics(metrics: TestMetrics): TestResultBuilder {
    this.result.metrics = metrics;
    return this;
  }

  /**
   * Add metric to existing metrics
   */
  public addMetric(key: keyof TestMetrics, value: any): TestResultBuilder {
    if (!this.result.metrics) {
      this.result.metrics = {} as TestMetrics;
    }
    (this.result.metrics as any)[key] = value;
    return this;
  }

  /**
   * Set execution time metric
   */
  public setExecutionTime(time: number): TestResultBuilder {
    return this.addMetric('executionTime', time);
  }

  /**
   * Set memory usage metric
   */
  public setMemoryUsage(usageMb: number): TestResultBuilder {
    return this.addMetric('memoryUsage', usageMb);
  }

  /**
   * Set CPU usage metric
   */
  public setCpuUsage(usagePercent: number): TestResultBuilder {
    return this.addMetric('cpuUsage', usagePercent);
  }

  /**
   * Set container startup time metric
   */
  public setContainerStartupTime(timeMs: number): TestResultBuilder {
    return this.addMetric('containerStartupTime', timeMs);
  }

  /**
   * Set extension loading time metric
   */
  public setExtensionLoadingTime(timeMs: number): TestResultBuilder {
    return this.addMetric('extensionLoadingTime', timeMs);
  }

  /**
   * Mark test as passed
   */
  public setPassed(): TestResultBuilder {
    return this.setStatus('passed');
  }

  /**
   * Mark test as failed
   */
  public setFailed(error?: string): TestResultBuilder {
    if (error) {
      this.setError(error);
    } else {
      this.setStatus('failed');
    }
    return this;
  }

  /**
   * Mark test as skipped
   */
  public setSkipped(reason?: string): TestResultBuilder {
    this.setStatus('skipped');
    if (reason) {
      this.result.error = reason;
    }
    return this;
  }

  /**
   * Add custom metadata
   */
  public addMetadata(key: string, value: any): TestResultBuilder {
    if (!this.result.metadata) {
      this.result.metadata = {};
    }
    this.result.metadata[key] = value;
    return this;
  }

  /**
   * Build the final test result
   */
  public build(): VSCodeTestResult {
    // Ensure required fields are present
    if (!this.result.id) {
      throw new Error('Test result must have an ID');
    }
    if (!this.result.name) {
      throw new Error('Test result must have a name');
    }
    if (!this.result.status) {
      throw new Error('Test result must have a status');
    }
    if (!this.result.timestamp) {
      this.result.timestamp = new Date();
    }

    return this.result as VSCodeTestResult;
  }
}

/**
 * Container state models for tracking container lifecycle and status
 */
export class ContainerStateBuilder {
  private state: Partial<ContainerValidation> = {};

  public constructor(containerId: string) {
    this.state.containerId = containerId;
    this.state.status = 'pending';
    this.state.extensions = [];
    this.state.environmentChecks = [];
  }

  /**
   * Set container status
   */
  public setStatus(status: ContainerValidation['status']): ContainerStateBuilder {
    this.state.status = status;
    return this;
  }

  /**
   * Set build time
   */
  public setBuildTime(timeMs: number): ContainerStateBuilder {
    this.state.buildTime = timeMs;
    return this;
  }

  /**
   * Set startup time
   */
  public setStartupTime(timeMs: number): ContainerStateBuilder {
    this.state.startupTime = timeMs;
    return this;
  }

  /**
   * Set resource usage
   */
  public setResourceUsage(usage: {
    memory: { used: number; limit: number; warningThreshold: number };
    cpu: { usage: number; cores: number };
    disk: { used: number; available: number };
  }): ContainerStateBuilder {
    this.state.resourceUsage = usage;
    return this;
  }

  /**
   * Add extension status
   */
  public addExtension(extension: {
    id: string;
    name: string;
    version: string;
    status: 'loaded' | 'failed' | 'disabled' | 'inactive';
    loadTime?: number;
    error?: string;
    compatibility?: {
      vscodeVersion: string;
      isCompatible: boolean;
      issues?: string[];
      warnings?: string[];
    };
  }): ContainerStateBuilder {
    if (!this.state.extensions) {
      this.state.extensions = [];
    }
    this.state.extensions.push(extension);
    return this;
  }

  /**
   * Add environment check
   */
  public addEnvironmentCheck(check: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    message?: string;
    details?: Record<string, any>;
    executionTime: number;
  }): ContainerStateBuilder {
    if (!this.state.environmentChecks) {
      this.state.environmentChecks = [];
    }
    this.state.environmentChecks.push(check);
    return this;
  }

  /**
   * Mark container as running
   */
  public setRunning(): ContainerStateBuilder {
    return this.setStatus('running');
  }

  /**
   * Mark container as failed
   */
  public setFailed(): ContainerStateBuilder {
    return this.setStatus('failed');
  }

  /**
   * Mark container as stopped
   */
  public setStopped(): ContainerStateBuilder {
    return this.setStatus('stopped');
  }

  /**
   * Build the final container state
   */
  public build(): ContainerValidation {
    // Ensure required fields are present
    if (!this.state.containerId) {
      throw new Error('Container state must have a container ID');
    }
    if (!this.state.status) {
      throw new Error('Container state must have a status');
    }
    if (!this.state.extensions) {
      this.state.extensions = [];
    }
    if (!this.state.environmentChecks) {
      this.state.environmentChecks = [];
    }
    if (!this.state.resourceUsage) {
      this.state.resourceUsage = {
        memory: { used: 0, limit: 0, warningThreshold: 2048 },
        cpu: { usage: 0, cores: 0 },
        disk: { used: 0, available: 0 }
      };
    }

    return this.state as ContainerValidation;
  }
}

/**
 * Extension status builder for tracking extension lifecycle
 */
export class ExtensionStatusBuilder {
  private extension: Partial<ExtensionStatus> = {};

  public constructor(id: string, name: string, version: string) {
    this.extension.id = id;
    this.extension.name = name;
    this.extension.version = version;
  }

  /**
   * Set extension status
   */
  public setStatus(status: ExtensionStatus['status']): ExtensionStatusBuilder {
    this.extension.status = status;
    return this;
  }

  /**
   * Set load time
   */
  public setLoadTime(timeMs: number): ExtensionStatusBuilder {
    this.extension.loadTime = timeMs;
    return this;
  }

  /**
   * Set error message
   */
  public setError(error: string): ExtensionStatusBuilder {
    this.extension.error = error;
    this.extension.status = 'failed';
    return this;
  }

  /**
   * Set compatibility information
   */
  public setCompatibility(compatibility: {
    vscodeVersion: string;
    isCompatible: boolean;
    issues?: string[];
    warnings?: string[];
  }): ExtensionStatusBuilder {
    this.extension.compatibility = compatibility;
    return this;
  }

  /**
   * Mark extension as loaded
   */
  public setLoaded(loadTime?: number): ExtensionStatusBuilder {
    this.extension.status = 'loaded';
    if (loadTime !== undefined) {
      this.extension.loadTime = loadTime;
    }
    return this;
  }

  /**
   * Mark extension as failed
   */
  public setFailed(error: string): ExtensionStatusBuilder {
    return this.setError(error);
  }

  /**
   * Mark extension as disabled
   */
  public setDisabled(): ExtensionStatusBuilder {
    this.extension.status = 'disabled';
    return this;
  }

  /**
   * Mark extension as inactive
   */
  public setInactive(): ExtensionStatusBuilder {
    this.extension.status = 'inactive';
    return this;
  }

  /**
   * Add compatibility issue
   */
  public addCompatibilityIssue(issue: string): ExtensionStatusBuilder {
    if (!this.extension.compatibility) {
      this.extension.compatibility = {
        vscodeVersion: 'unknown',
        isCompatible: true,
        issues: [],
        warnings: []
      };
    }
    this.extension.compatibility.issues!.push(issue);
    this.extension.compatibility.isCompatible = false;
    return this;
  }

  /**
   * Add compatibility warning
   */
  public addCompatibilityWarning(warning: string): ExtensionStatusBuilder {
    if (!this.extension.compatibility) {
      this.extension.compatibility = {
        vscodeVersion: 'unknown',
        isCompatible: true,
        issues: [],
        warnings: []
      };
    }
    this.extension.compatibility.warnings!.push(warning);
    return this;
  }

  /**
   * Build the final extension status
   */
  public build(): ExtensionStatus {
    // Ensure required fields are present
    if (!this.extension.id) {
      throw new Error('Extension status must have an ID');
    }
    if (!this.extension.name) {
      throw new Error('Extension status must have a name');
    }
    if (!this.extension.version) {
      throw new Error('Extension status must have a version');
    }
    if (!this.extension.status) {
      throw new Error('Extension status must have a status');
    }

    return this.extension as ExtensionStatus;
  }
}

/**
 * Environment check builder for tracking environment validation
 */
export class EnvironmentCheckBuilder {
  private check: Partial<EnvironmentCheck> = {};

  public constructor(name: string) {
    this.check.name = name;
    this.check.executionTime = 0;
  }

  /**
   * Set check status
   */
  public setStatus(status: EnvironmentCheck['status']): EnvironmentCheckBuilder {
    this.check.status = status;
    return this;
  }

  /**
   * Set execution time
   */
  public setExecutionTime(timeMs: number): EnvironmentCheckBuilder {
    this.check.executionTime = timeMs;
    return this;
  }

  /**
   * Set message
   */
  public setMessage(message: string): EnvironmentCheckBuilder {
    this.check.message = message;
    return this;
  }

  /**
   * Set details
   */
  public setDetails(details: Record<string, any>): EnvironmentCheckBuilder {
    this.check.details = details;
    return this;
  }

  /**
   * Mark check as passed
   */
  public setPassed(message?: string, executionTime?: number): EnvironmentCheckBuilder {
    this.check.status = 'passed';
    if (message) {
      this.check.message = message;
    }
    if (executionTime !== undefined) {
      this.check.executionTime = executionTime;
    }
    return this;
  }

  /**
   * Mark check as failed
   */
  public setFailed(message: string, details?: Record<string, any>, executionTime?: number): EnvironmentCheckBuilder {
    this.check.status = 'failed';
    this.check.message = message;
    if (details) {
      this.check.details = details;
    }
    if (executionTime !== undefined) {
      this.check.executionTime = executionTime;
    }
    return this;
  }

  /**
   * Mark check as warning
   */
  public setWarning(message: string, details?: Record<string, any>, executionTime?: number): EnvironmentCheckBuilder {
    this.check.status = 'warning';
    this.check.message = message;
    if (details) {
      this.check.details = details;
    }
    if (executionTime !== undefined) {
      this.check.executionTime = executionTime;
    }
    return this;
  }

  /**
   * Build the final environment check
   */
  public build(): EnvironmentCheck {
    // Ensure required fields are present
    if (!this.check.name) {
      throw new Error('Environment check must have a name');
    }
    if (!this.check.status) {
      throw new Error('Environment check must have a status');
    }
    if (this.check.executionTime === undefined) {
      this.check.executionTime = 0;
    }

    return this.check as EnvironmentCheck;
  }
}