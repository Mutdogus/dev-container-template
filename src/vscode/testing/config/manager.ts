import { TestConfiguration, ContainerConfig } from '@vscode/types';
import { DiagnosticLogger } from '@vscode/utils/diagnostics';
import { VSCodeTestUtils } from '@vscode/utils/helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Test configuration management system
 * Handles loading, validation, and management of test configurations
 */
export class TestConfigurationManager {
  private logger: DiagnosticLogger;
  private configPath: string;
  private defaultConfig: TestConfiguration;
  private currentConfig: TestConfiguration;

  constructor(configPath?: string) {
    this.logger = DiagnosticLogger.getInstance();
    this.configPath = configPath || path.join(process.cwd(), '.env');
    this.defaultConfig = this.createDefaultConfiguration();
    this.currentConfig = { ...this.defaultConfig };
  }

  /**
   * Load configuration from environment variables and config file
   */
  public async loadConfiguration(): Promise<TestConfiguration> {
    this.logger.info('Loading test configuration', 'config-manager');

    // Load from environment variables
    const envConfig = this.loadFromEnvironment();
    
    // Load from config file if exists
    const fileConfig = await this.loadFromFile();
    
    // Merge configurations (env vars take precedence)
    const mergedConfig = { ...this.defaultConfig, ...fileConfig, ...envConfig };
    
    // Validate configuration
    this.validateConfiguration(mergedConfig);
    
    // Store current configuration
    this.currentConfig = mergedConfig;
    
    this.logger.info('Test configuration loaded successfully', 'config-manager', {
      vscodeVersions: mergedConfig.vscodeVersions,
      timeout: mergedConfig.timeout,
      parallel: mergedConfig.parallel,
      memoryThreshold: mergedConfig.memoryThreshold
    });

    return mergedConfig;
  }

  /**
   * Save configuration to file
   */
  public async saveConfiguration(config: TestConfiguration): Promise<void> {
    try {
      const configContent = this.formatConfigForFile(config);
      await this.ensureConfigDirectory();
      await fs.writeFile(this.configPath, configContent, 'utf-8');
      
      this.logger.info('Configuration saved to file', 'config-manager', { 
        path: this.configPath 
      });
      
      // Update current configuration
      this.currentConfig = { ...config };
      
    } catch (error) {
      this.logger.error(`Failed to save configuration: ${error}`, 'config-manager');
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  public getCurrentConfiguration(): TestConfiguration {
    return { ...this.currentConfig };
  }

  /**
   * Update configuration with new values
   */
  public updateConfiguration(updates: Partial<TestConfiguration>): TestConfiguration {
    const updatedConfig = { ...this.currentConfig, ...updates };
    this.currentConfig = updatedConfig;
    
    this.logger.info('Configuration updated', 'config-manager', { 
      updates,
      newConfig: updatedConfig 
    });
    
    return updatedConfig;
  }

  /**
   * Get configuration for specific VS Code version
   */
  public getConfigurationForVersion(vscodeVersion: string): TestConfiguration {
    const baseConfig = { ...this.currentConfig };
    
    // Version-specific overrides
    switch (vscodeVersion) {
      case 'insiders':
        // Insiders-specific configuration
        baseConfig.timeout = Math.max(baseConfig.timeout, 45000); // Longer timeout for insiders
        baseConfig.parallel = false; // Disable parallel for insiders testing
        break;
      case 'stable':
        // Stable-specific configuration
        baseConfig.timeout = Math.min(baseConfig.timeout, 30000); // Standard timeout
        break;
      default:
        // Default configuration for other versions
        break;
    }

    this.logger.info('Configuration retrieved for version', 'config-manager', {
      vscodeVersion,
      timeout: baseConfig.timeout,
      parallel: baseConfig.parallel
    });

    return baseConfig;
  }

  /**
   * Validate configuration against requirements
   */
  public validateConfiguration(config: TestConfiguration): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate VS Code versions
    if (!config.vscodeVersions || config.vscodeVersions.length === 0) {
      errors.push('VS Code versions must be specified');
    }

    if (config.vscodeVersions.some(v => !v || v.trim() === '')) {
      errors.push('VS Code versions cannot be empty strings');
    }

    // Validate timeout
    if (config.timeout <= 0) {
      errors.push('Test timeout must be greater than 0');
    }

    if (config.timeout > 600000) { // 10 minutes max
      warnings.push('Test timeout is very long (>10 minutes)');
    }

    // Validate retry count
    if (config.retryCount < 0) {
      errors.push('Retry count cannot be negative');
    }

    if (config.retryCount > 10) {
      warnings.push('High retry count may cause long test execution');
    }

    // Validate memory threshold
    if (config.memoryThreshold <= 0) {
      errors.push('Memory threshold must be greater than 0');
    }

    if (config.memoryThreshold < 512) { // Less than 512MB
      warnings.push('Memory threshold is very low (<512MB)');
    }

    if (config.memoryThreshold > 8192) { // More than 8GB
      warnings.push('Memory threshold is very high (>8GB)');
    }

    // Validate parallel execution
    if (typeof config.parallel !== 'boolean') {
      errors.push('Parallel execution must be a boolean value');
    }

    // Validate container configuration
    if (!config.containerConfig) {
      errors.push('Container configuration is required');
    }

    if (!config.containerConfig.image) {
      errors.push('Container image must be specified');
    }

    if (config.containerConfig.timeout && config.containerConfig.timeout <= 0) {
      errors.push('Container timeout must be greater than 0');
    }

    if (config.containerConfig.timeout && config.containerConfig.timeout > 1800000) { // 30 minutes max
      warnings.push('Container timeout is very long (>30 minutes)');
    }

    // Validate environment variables
    if (config.containerConfig.environment) {
      for (const [key, value] of Object.entries(config.containerConfig.environment)) {
        if (typeof value !== 'string') {
          errors.push(`Environment variable ${key} must be a string`);
        }
        
        if (key.includes(' ') || key.includes('=') || value.includes('\n')) {
          warnings.push(`Environment variable ${key} contains potentially problematic characters`);
        }
      }
    }

    // Validate volumes
    if (config.containerConfig.volumes) {
      for (const volume of config.containerConfig.volumes) {
        if (typeof volume !== 'string') {
          errors.push(`Volume path must be a string: ${volume}`);
        }
        
        // Check for potentially dangerous volume paths
        if (volume.includes('/') && !volume.startsWith('/tmp') && !volume.startsWith('/var/tmp')) {
          warnings.push(`Volume path may be dangerous: ${volume}`);
        }
      }
    }

    // Validate ports
    if (config.containerConfig.ports) {
      for (const [containerPort, hostPort] of Object.entries(config.containerConfig.ports)) {
        const containerPortNum = parseInt(containerPort);
        const hostPortNum = parseInt(hostPort);
        
        if (isNaN(containerPortNum) || containerPortNum < 1 || containerPortNum > 65535) {
          errors.push(`Invalid container port: ${containerPort}`);
        }
        
        if (isNaN(hostPortNum) || hostPortNum < 1 || hostPortNum > 65535) {
          errors.push(`Invalid host port: ${hostPort}`);
        }
        
        // Check for commonly used ports that might conflict
        const commonPorts = [22, 80, 443, 8080, 3000, 8081];
        if (commonPorts.includes(hostPortNum)) {
          warnings.push(`Host port ${hostPort} is commonly used and may conflict`);
        }
      }
    }

    const isValid = errors.length === 0;
    
    if (isValid) {
      this.logger.info('Configuration validation passed', 'config-manager');
    } else {
      this.logger.error('Configuration validation failed', 'config-manager', { errors, warnings });
    }

    return { isValid, errors, warnings };
  }

  /**
   * Get effective timeout for a given test type
   */
  public getTimeoutForTestType(testType: 'container' | 'extension' | 'environment' | 'integration'): number {
    switch (testType) {
      case 'container':
        return this.currentConfig.containerConfig.timeout;
      case 'extension':
        return Math.min(this.currentConfig.timeout, 30000); // 30 seconds max for extension tests
      case 'environment':
        return Math.min(this.currentConfig.timeout, 120000); // 2 minutes max for environment tests
      case 'integration':
        return this.currentConfig.timeout; // Use full timeout for integration tests
      default:
        return this.currentConfig.timeout;
    }
  }

  /**
   * Check if configuration supports parallel execution
   */
  public supportsParallelExecution(): boolean {
    return this.currentConfig.parallel;
  }

  /**
   * Get memory threshold in MB
   */
  public getMemoryThreshold(): number {
    return this.currentConfig.memoryThreshold;
  }

  /**
   * Get container configuration
   */
  public getContainerConfiguration(): ContainerConfig {
    return { ...this.currentConfig.containerConfig };
  }

  /**
   * Create test-specific configuration
   */
  public createTestConfiguration(overrides: {
    timeout?: number;
    memoryThreshold?: number;
    parallel?: boolean;
    containerConfig?: Partial<ContainerConfig>;
  }): TestConfiguration {
    return {
      ...this.currentConfig,
      ...overrides,
      containerConfig: {
        ...this.currentConfig.containerConfig,
        ...overrides.containerConfig
      }
    };
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): TestConfiguration {
    this.currentConfig = { ...this.defaultConfig };
    this.logger.info('Configuration reset to defaults', 'config-manager');
    return this.currentConfig;
  }

  /**
   * Export configuration to JSON
   */
  public exportConfiguration(): string {
    const exportData = {
      exportTime: new Date().toISOString(),
      configuration: this.currentConfig,
      validation: this.validateConfiguration(this.currentConfig)
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public importConfiguration(jsonConfig: string): TestConfiguration {
    try {
      const config = JSON.parse(jsonConfig);
      
      if (!this.isValidConfigurationFormat(config)) {
        throw new Error('Invalid configuration format');
      }

      this.validateConfiguration(config);
      this.currentConfig = { ...this.defaultConfig, ...config };
      
      this.logger.info('Configuration imported successfully', 'config-manager');
      return this.currentConfig;

    } catch (error) {
      this.logger.error(`Failed to import configuration: ${error}`, 'config-manager');
      throw error;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<TestConfiguration> {
    const env: Partial<TestConfiguration> = {};

    // VS Code versions
    if (process.env.VSCODE_VERSIONS) {
      env.vscodeVersions = process.env.VSCODE_VERSIONS.split(',').map(v => v.trim());
    }

    // Test configuration
    if (process.env.TEST_TIMEOUT) {
      env.timeout = parseInt(process.env.TEST_TIMEOUT, 10);
    }

    if (process.env.TEST_PARALLEL) {
      env.parallel = process.env.TEST_PARALLEL === 'true';
    }

    if (process.env.TEST_RETRY_COUNT) {
      env.retryCount = parseInt(process.env.TEST_RETRY_COUNT, 10);
    }

    // Performance thresholds
    if (process.env.MEMORY_WARNING_THRESHOLD_GB) {
      env.memoryThreshold = parseFloat(process.env.MEMORY_WARNING_THRESHOLD_GB) * 1024; // Convert GB to MB
    }

    // Container configuration
    if (process.env.CONTAINER_IMAGE) {
      if (!env.containerConfig) {
        env.containerConfig = {};
      }
      env.containerConfig.image = process.env.CONTAINER_IMAGE;
    }

    if (process.env.CONTAINER_NAME) {
      if (!env.containerConfig) {
        env.containerConfig = {};
      }
      env.containerConfig.name = process.env.CONTAINER_NAME;
    }

    if (process.env.CONTAINER_STARTUP_TIMEOUT_MS) {
      if (!env.containerConfig) {
        env.containerConfig = {};
      }
      env.containerConfig.timeout = parseInt(process.env.CONTAINER_STARTUP_TIMEOUT_MS, 10);
    }

    return env;
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(): Promise<Partial<TestConfiguration>> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const config: Partial<TestConfiguration> = {};

      // Parse simple key=value format
      const lines = configContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
          continue;
        }

        const [key, value] = trimmedLine.split('=', 2);
        const cleanKey = key.trim();
        const cleanValue = value.trim();

        switch (cleanKey) {
          case 'VSCODE_VERSIONS':
            config.vscodeVersions = cleanValue.split(',').map(v => v.trim());
            break;
          case 'TEST_TIMEOUT':
            config.timeout = parseInt(cleanValue, 10);
            break;
          case 'TEST_PARALLEL':
            config.parallel = cleanValue === 'true';
            break;
          case 'TEST_RETRY_COUNT':
            config.retryCount = parseInt(cleanValue, 10);
            break;
          case 'MEMORY_WARNING_THRESHOLD_GB':
            config.memoryThreshold = parseFloat(cleanValue) * 1024;
            break;
          case 'CONTAINER_IMAGE':
            if (!config.containerConfig) {
              config.containerConfig = {};
            }
            config.containerConfig.image = cleanValue;
            break;
          case 'CONTAINER_NAME':
            if (!config.containerConfig) {
              config.containerConfig = {};
            }
            config.containerConfig.name = cleanValue;
            break;
          case 'CONTAINER_STARTUP_TIMEOUT_MS':
            if (!config.containerConfig) {
              config.containerConfig = {};
            }
            config.containerConfig.timeout = parseInt(cleanValue, 10);
            break;
        }
      }

      this.logger.info('Configuration loaded from file', 'config-manager', { 
        path: this.configPath 
      });

      return config;

    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        this.logger.warning(`Failed to load config file: ${error}`, 'config-manager');
      }
      return {};
    }
  }

  /**
   * Format configuration for file storage
   */
  private formatConfigForFile(config: TestConfiguration): string {
    const lines = [
      '# VS Code Testing Configuration',
      '',
      `VSCODE_VERSIONS=${config.vscodeVersions.join(',')}`,
      `TEST_TIMEOUT=${config.timeout}`,
      `TEST_PARALLEL=${config.parallel}`,
      `TEST_RETRY_COUNT=${config.retryCount}`,
      `MEMORY_WARNING_THRESHOLD_GB=${config.memoryThreshold / 1024}`,
      `CONTAINER_IMAGE=${config.containerConfig.image}`,
      `CONTAINER_NAME=${config.containerConfig.name}`,
      `CONTAINER_STARTUP_TIMEOUT_MS=${config.containerConfig.timeout}`,
      ''
    ];

    return lines.join('\n');
  }

  /**
   * Ensure config directory exists
   */
  private async ensureConfigDirectory(): Promise<void> {
    const configDir = path.dirname(this.configPath);
    try {
      await fs.access(configDir);
    } catch {
      await fs.mkdir(configDir, { recursive: true });
    }
  }

  /**
   * Validate configuration format
   */
  private isValidConfigurationFormat(config: any): boolean {
    return (
      typeof config === 'object' &&
      config !== null &&
      !Array.isArray(config)
    );
  }

  /**
   * Create default configuration
   */
  private createDefaultConfiguration(): TestConfiguration {
    return {
      vscodeVersions: ['stable'],
      timeout: 30000,
      parallel: true,
      retryCount: 3,
      memoryThreshold: 2048, // 2GB in MB
      containerConfig: {
        image: 'mcr.microsoft.com/vscode/devcontainers/javascript-node:18',
        name: 'vscode-test-container',
        timeout: 300000, // 5 minutes
        environment: {},
        volumes: [],
        ports: {}
      }
    };
  }
}