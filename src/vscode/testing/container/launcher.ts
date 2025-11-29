import { ContainerState } from '@vscode/types/container-state';
import { DiagnosticLogger } from '@vscode/utils/diagnostics';
import { VSCodeTestUtils } from '@vscode/utils/helpers';
import * as Docker from 'dockerode';

/**
 * Container launcher for VS Code testing
 * Manages container lifecycle for test execution
 */
export class ContainerLauncher {
  private logger: DiagnosticLogger;
  private docker: Docker;
  private activeContainers: Map<string, ContainerState> = new Map();
  private defaultTimeout: number;
  private memoryThreshold: number;

  constructor(docker: Docker, defaultTimeout: number = 300000, memoryThreshold: number = 2048) {
    this.logger = DiagnosticLogger.getInstance();
    this.docker = docker;
    this.defaultTimeout = defaultTimeout;
    this.memoryThreshold = memoryThreshold;
  }

  /**
   * Launch a new container for testing
   */
  public async launchContainer(config: {
    image: string;
    name?: string;
    environment?: Record<string, string>;
    volumes?: string[];
    ports?: Record<string, any>;
    command?: string[];
    workingDir?: string;
  }): Promise<ContainerState> {
    const containerId = VSCodeTestUtils.generateContainerName('test-launch');
    const startTime = Date.now();

    this.logger.info('Launching container', 'container-launcher', {
      containerId,
      image: config.image,
      name: config.name
    });

    try {
      // Create container configuration
      const containerConfig = this.buildContainerConfig(containerId, config);
      
      // Create container
      const container = await this.docker.createContainer(containerConfig);
      
      // Create container state
      const containerState = new ContainerState(containerId, config.image);
      containerState.addEnvironmentVariable('LAUNCHED_AT', new Date().toISOString());
      containerState.addEnvironmentVariable('LAUNCHER', 'vscode-test');
      
      // Start container
      await container.start();
      containerState.markStarted();
      
      // Store in active containers
      this.activeContainers.set(containerId, containerState);
      
      this.logger.info('Container launched successfully', 'container-launcher', {
        containerId,
        launchTime: Date.now() - startTime
      });

      return containerState;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Container launch failed: ${errorMessage}`, 'container-launcher', {
        containerId,
        image: config.image
      });

      // Return failed container state
      const failedState = new ContainerState(containerId, config.image);
      failedState.markFailed(errorMessage);
      return failedState;
    }
  }

  /**
   * Stop a running container
   */
  public async stopContainer(containerId: string, timeout: number = 30000): Promise<boolean> {
    const containerState = this.activeContainers.get(containerId);
    
    if (!containerState) {
      this.logger.warning(`Container not found: ${containerId}`, 'container-launcher');
      return false;
    }

    this.logger.info('Stopping container', 'container-launcher', { containerId });

    try {
      const container = await this.docker.getContainer(containerId);
      
      // Stop with timeout
      await this.executeWithTimeout(
        () => container.stop({ t: timeout / 1000 }),
        timeout,
        'container-stop'
      );

      containerState.markStopped();
      
      this.logger.info('Container stopped successfully', 'container-launcher', {
        containerId,
        uptime: containerState.getUptime()
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Container stop failed: ${errorMessage}`, 'container-launcher', {
        containerId
      });

      containerState.markFailed(errorMessage);
      return false;
    }
  }

  /**
   * Remove a container
   */
  public async removeContainer(containerId: string): Promise<boolean> {
    const containerState = this.activeContainers.get(containerId);
    
    if (!containerState) {
      this.logger.warning(`Container not found for removal: ${containerId}`, 'container-launcher');
      return false;
    }

    this.logger.info('Removing container', 'container-launcher', { containerId });

    try {
      // Stop if running
      if (containerState.isRunning()) {
        await this.stopContainer(containerId);
      }

      // Remove container
      const container = await this.docker.getContainer(containerId);
      await container.remove({ v: true });
      
      // Remove from active containers
      this.activeContainers.delete(containerId);
      
      this.logger.info('Container removed successfully', 'container-launcher', {
        containerId,
        totalUptime: containerState.getUptime()
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Container removal failed: ${errorMessage}`, 'container-launcher', {
        containerId
      });

      return false;
    }
  }

  /**
   * Execute command in container
   */
  public async executeCommand(containerId: string, command: string[], options: {
    workingDir?: string;
    environment?: Record<string, string>;
    timeout?: number;
    attachStdout?: boolean;
    attachStderr?: boolean;
  } = {}): Promise<{
    exitCode: number;
    output: string;
    errorOutput: string;
    executionTime: number;
  }> {
    const containerState = this.activeContainers.get(containerId);
    
    if (!containerState) {
      throw new Error(`Container not found: ${containerId}`);
    }

    this.logger.info('Executing command in container', 'container-launcher', {
      containerId,
      command: command.join(' '),
      workingDir: options.workingDir
    });

    const startTime = Date.now();

    try {
      const container = await this.docker.getContainer(containerId);
      
      const execConfig = {
        Cmd: command,
        AttachStdout: options.attachStdout !== false,
        AttachStderr: options.attachStderr !== false,
        WorkingDir: options.workingDir || containerState.environment['WORKING_DIR'],
        Env: options.environment ? Object.entries(options.environment).map(([k, v]) => `${k}=${v}`) : undefined
      };

      const exec = await container.exec(execConfig);
      const stream = await exec.start();

      let output = '';
      let errorOutput = '';
      let exitCode = 0;

      return new Promise((resolve, reject) => {
        const timeout = options.timeout || 30000;
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Command execution timeout: ${timeout}ms`));
        }, timeout);

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          if (execConfig.AttachStdout) output += data;
          if (execConfig.AttachStderr) errorOutput += data;
        });

        stream.on('end', () => {
          clearTimeout(timeoutHandle);
          const executionTime = Date.now() - startTime;
          
          this.logger.info('Command executed successfully', 'container-launcher', {
            containerId,
            command: command.join(' '),
            executionTime,
            exitCode
          });

          resolve({
            exitCode,
            output,
            errorOutput,
            executionTime
          });
        });

        stream.on('error', (error: any) => {
          clearTimeout(timeoutHandle);
          const executionTime = Date.now() - startTime;
          const errorMessage = error.message || String(error);
          
          this.logger.error(`Command execution failed: ${errorMessage}`, 'container-launcher', {
            containerId,
            command: command.join(' '),
            executionTime
          });

          reject(error);
        });
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Command execution setup failed: ${errorMessage}`, 'container-launcher', {
        containerId,
        command: command.join(' '),
        executionTime
      });

      throw error;
    }
  }

  /**
   * Get container logs
   */
  public async getContainerLogs(containerId: string, options: {
    tail?: number;
    since?: Date;
    until?: Date;
    timestamps?: boolean;
  } = {}): Promise<string[]> {
    const containerState = this.activeContainers.get(containerId);
    
    if (!containerState) {
      throw new Error(`Container not found: ${containerId}`);
    }

    this.logger.info('Fetching container logs', 'container-launcher', { containerId });

    try {
      const container = await this.docker.getContainer(containerId);
      
      const logOptions: any = {
        stdout: true,
        stderr: true,
        timestamps: options.timestamps || false
      };

      if (options.tail) {
        logOptions.tail = options.tail;
      }
      if (options.since) {
        logOptions.since = options.since;
      }
      if (options.until) {
        logOptions.until = options.until;
      }

      const logStream = await container.logs(logOptions);
      const logs: string[] = [];

      return new Promise((resolve, reject) => {
        logStream.on('data', (chunk: Buffer) => {
          logs.push(chunk.toString().trim());
        });

        logStream.on('end', () => {
          this.logger.info('Container logs fetched successfully', 'container-launcher', {
            containerId,
            logCount: logs.length
          });
          resolve(logs);
        });

        logStream.on('error', (error: any) => {
          const errorMessage = error.message || String(error);
          this.logger.error(`Failed to fetch container logs: ${errorMessage}`, 'container-launcher', {
            containerId
          });
          reject(error);
        });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Container logs fetch failed: ${errorMessage}`, 'container-launcher', {
        containerId
      });
      throw error;
    }
  }

  /**
   * Get container status
   */
  public async getContainerStatus(containerId: string): Promise<ContainerState | null> {
    try {
      const container = await this.docker.getContainer(containerId);
      const containerInfo = await container.inspect();
      
      let containerState = this.activeContainers.get(containerId);
      
      if (!containerState) {
        // Create state if not found in active containers
        containerState = new ContainerState(containerId, containerInfo.Config.Image);
      }

      // Update status based on container info
      if (containerInfo.State.Running) {
        if (!containerState.isRunning()) {
          containerState.markStarted();
        }
      } else if (containerInfo.State.Status === 'exited') {
        containerState.markStopped();
        if (containerInfo.State.ExitCode && containerInfo.State.ExitCode !== 0) {
          containerState.markFailed(`Container exited with code ${containerInfo.State.ExitCode}`);
        }
      } else if (containerInfo.State.Status === 'dead') {
        containerState.markFailed('Container is dead');
      }

      return containerState;

    } catch (error) {
      this.logger.error(`Failed to get container status: ${error}`, 'container-launcher', {
        containerId
      });
      return null;
    }
  }

  /**
   * List all active containers
   */
  public getActiveContainers(): ContainerState[] {
    return Array.from(this.activeContainers.values());
  }

  /**
   * Cleanup all containers
   */
  public async cleanupAllContainers(): Promise<void> {
    this.logger.info('Cleaning up all containers', 'container-launcher', {
      containerCount: this.activeContainers.size
    });

    const containerIds = Array.from(this.activeContainers.keys());
    const results = await Promise.allSettled(
      containerIds.map(id => this.removeContainer(id))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    this.logger.info('Container cleanup completed', 'container-launcher', {
      total: containerIds.length,
      successful,
      failed
    });

    if (failed > 0) {
      this.logger.warning(`${failed} containers failed to cleanup`, 'container-launcher');
    }
  }

  /**
   * Build Docker container configuration
   */
  private buildContainerConfig(containerId: string, config: any): any {
    const baseConfig = {
      name: config.name || containerId,
      Image: config.image,
      Env: config.environment ? Object.entries(config.environment).map(([k, v]) => `${k}=${v}`) : undefined,
      ExposedPorts: config.ports ? Object.keys(config.ports).reduce((exposed, port) => {
        exposed[port] = {};
        return exposed;
      }, {}) : undefined,
      HostConfig: {
        Binds: config.volumes || [],
        PortBindings: config.ports || {},
        Memory: this.memoryThreshold * 1024 * 1024, // Convert GB to bytes
        CpuShares: 512,
        RestartPolicy: {
          Name: 'unless-stopped'
        },
        LogConfig: {
          Type: 'json-file',
          Config: {
            'max-size': '10m',
            'max-file': '3'
          }
        }
      },
      WorkingDir: config.workingDir,
      Cmd: config.command
    };

    // Add VS Code specific configurations
    baseConfig.HostConfig!.Privileged = false;
    baseConfig.HostConfig!.User = 'vscode'; // Run as vscode user
    baseConfig.HostConfig!.Tty = true;
    baseConfig.HostConfig!.OpenStdin = true;
    baseConfig.HostConfig!.OpenStdout = true;
    baseConfig.HostConfig!.OpenStderr = true;

    return baseConfig;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await operation();
        clearTimeout(timeoutHandle);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  /**
   * Wait for container to be ready
   */
  public async waitForContainerReady(containerId: string, timeout: number = 60000): Promise<boolean> {
    this.logger.info('Waiting for container to be ready', 'container-launcher', {
      containerId,
      timeout
    });

    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const containerState = await this.getContainerStatus(containerId);
        
        if (containerState && containerState.isRunning()) {
          // Additional readiness checks
          const uptime = containerState.getUptime();
          if (uptime > 5000) { // Container has been running for at least 5 seconds
            this.logger.info('Container is ready', 'container-launcher', {
              containerId,
              uptime
            });
            return true;
          }
        }

        await VSCodeTestUtils.sleep(checkInterval);

      } catch (error) {
        this.logger.warning(`Error checking container readiness: ${error}`, 'container-launcher');
        await VSCodeTestUtils.sleep(checkInterval);
      }
    }

    this.logger.error('Container readiness timeout', 'container-launcher', {
      containerId,
      waitTime: Date.now() - startTime
    });

    return false;
  }

  /**
   * Get container resource usage
   */
  public async getContainerResourceUsage(containerId: string): Promise<{
    memory: { used: number; limit: number; percentage: number };
    cpu: { usage: number; cores: number };
  } | null> {
    try {
      const container = await this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      // Parse memory usage
      const memoryStats = stats.memory_stats || {};
      const memoryUsage = memoryStats.usage || 0;
      const memoryLimit = memoryStats.limit || 0;
      const memoryPercentage = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

      // Parse CPU usage
      const cpuStats = stats.cpu_stats || {};
      const cpuDelta = cpuStats.cpu_usage - (stats.precpu_stats?.cpu_usage || 0);
      const systemDelta = cpuStats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
      const cpuPercentage = systemDelta > 0 ? (cpuDelta / systemDelta) * (cpuStats.online_cpus || 1) * 100 : 0;

      const resourceUsage = {
        memory: {
          used: Math.round(memoryUsage / (1024 * 1024)), // Convert to MB
          limit: Math.round(memoryLimit / (1024 * 1024)), // Convert to MB
          percentage: Math.round(memoryPercentage * 100) / 100
        },
        cpu: {
          usage: Math.round(cpuPercentage * 100) / 100,
          cores: cpuStats.online_cpus || 1
        }
      };

      this.logger.info('Container resource usage retrieved', 'container-launcher', {
        containerId,
        resourceUsage
      });

      return resourceUsage;

    } catch (error) {
      this.logger.error(`Failed to get container resource usage: ${error}`, 'container-launcher', {
        containerId
      });
      return null;
    }
  }

  /**
   * Dispose of launcher resources
   */
  public async dispose(): Promise<void> {
    this.logger.info('Disposing container launcher', 'container-launcher');

    // Cleanup all active containers
    await this.cleanupAllContainers();
    
    this.logger.info('Container launcher disposed', 'container-launcher');
  }
}