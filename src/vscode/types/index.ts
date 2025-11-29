/**
 * Base interfaces for VS Code testing framework
 */

export interface VSCodeTestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  metrics?: TestMetrics;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TestSuiteResult {
  name: string;
  tests: VSCodeTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    successRate: number;
  };
}

export interface TestMetrics {
  memoryUsage?: number;
  cpuUsage?: number;
  executionTime: number;
  containerStartupTime?: number;
  extensionLoadingTime?: number;
  activationTime?: number;
  deactivationTime?: number;
  settingsTime?: number;
  extensionId?: string;
  extensionVersion?: string;
}

export interface ContainerValidation {
  containerId: string;
  status: 'pending' | 'running' | 'stopped' | 'failed';
  buildTime?: number;
  startupTime?: number;
  resourceUsage: ResourceUsage;
  extensions: ExtensionStatus[];
  environmentChecks: EnvironmentCheck[];
}

export interface ExtensionStatus {
  id: string;
  name: string;
  version: string;
  status: 'loaded' | 'failed' | 'disabled' | 'inactive';
  loadTime?: number;
  error?: string;
  compatibility?: CompatibilityInfo;
}

export interface CompatibilityInfo {
  vscodeVersion: string;
  isCompatible: boolean;
  issues?: string[];
  warnings?: string[];
}

export interface EnvironmentCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message?: string;
  details?: Record<string, any>;
  executionTime: number;
}

export interface ResourceUsage {
  memory: {
    used: number;
    limit: number;
    warningThreshold: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  disk: {
    used: number;
    available: number;
  };
}

export interface TestConfiguration {
  vscodeVersions: string[];
  timeout: number;
  parallel: boolean;
  retryCount: number;
  memoryThreshold: number;
  containerConfig: ContainerConfig;
}

export interface PartialTestConfiguration {
  vscodeVersions?: string[];
  timeout?: number;
  parallel?: boolean;
  retryCount?: number;
  memoryThreshold?: number;
  containerConfig?: PartialContainerConfig;
}

export interface PartialContainerConfig {
  image?: string;
  name?: string;
  timeout?: number;
  environment?: Record<string, string>;
  volumes?: string[];
  ports?: Record<string, number>;
}

export interface ContainerConfig {
  image: string;
  name: string;
  timeout: number;
  environment: Record<string, string>;
  volumes: string[];
  ports: Record<string, number>;
}

export interface TestSuite {
  name: string;
  tests: VSCodeTestResult[];
  configuration: TestConfiguration;
  summary: TestSummary;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  successRate: number;
}

export interface DiagnosticInfo {
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  source: string;
  details?: Record<string, any>;
}

export interface TestExecutionContext {
  containerId?: string;
  vscodeVersion: string;
  testSuite: string;
  startTime: Date;
  configuration: TestConfiguration;
}

export interface ContainerState {
  status: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';
  startedAt?: Date;
  finishedAt?: Date;
  exitCode?: number;
  error?: string;
}

export class ContainerStateManager {
  private state: ContainerState;

  constructor(initialStatus: ContainerState['status'] = 'created') {
    this.state = {
      status: initialStatus,
      startedAt: undefined,
      finishedAt: undefined,
      exitCode: undefined,
      error: undefined,
    };
  }

  markStarted(): void {
    this.state.status = 'running';
    this.state.startedAt = new Date();
  }

  markStopped(): void {
    this.state.status = 'exited';
    this.state.finishedAt = new Date();
  }

  markFailed(error: string): void {
    this.state.status = 'dead';
    this.state.error = error;
    this.state.finishedAt = new Date();
  }

  isRunning(): boolean {
    return this.state.status === 'running';
  }

  getUptime(): number {
    if (!this.state.startedAt) return 0;
    return Date.now() - this.state.startedAt.getTime();
  }

  getUptimeFormatted(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getStatus(): ContainerState['status'] {
    return this.state.status;
  }

  getState(): ContainerState {
    return { ...this.state };
  }

  updateResourceUsage(_usage: any): void {
    // This would update resource usage in the state
  }

  toJSON(): any {
    return {
      ...this.state,
      uptime: this.getUptime(),
      uptimeFormatted: this.getUptimeFormatted(),
    };
  }
}
