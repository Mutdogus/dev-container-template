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
}

export interface TestMetrics {
  memoryUsage?: number;
  cpuUsage?: number;
  executionTime: number;
  containerStartupTime?: number;
  extensionLoadingTime?: number;
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