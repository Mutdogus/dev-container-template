import { ContainerValidation, ExtensionStatus, EnvironmentCheck, ResourceUsage } from '@vscode/types';
import { ContainerState } from '@vscode/types/container-state';
import { DiagnosticLogger } from '@vscode/utils/diagnostics';
import { VSCodeTestUtils } from '@vscode/utils/helpers';
import * as Docker from 'dockerode';

/**
 * Container validator for VS Code development containers
 * Provides comprehensive container startup and runtime validation
 */
export class ContainerValidator {
  private logger: DiagnosticLogger;
  private docker: Docker;
  private validationTimeout: number;
  private memoryThreshold: number;

  constructor(docker: Docker, validationTimeout: number = 300000, memoryThreshold: number = 2048) {
    this.logger = DiagnosticLogger.getInstance();
    this.docker = docker;
    this.validationTimeout = validationTimeout;
    this.memoryThreshold = memoryThreshold;
  }

  /**
   * Validate container startup process
   */
  public async validateContainerStartup(containerConfig: {
    image: string;
    name: string;
    environment?: Record<string, string>;
    volumes?: string[];
    ports?: Record<string, any>;
  }): Promise<ContainerValidation> {
    const containerId = VSCodeTestUtils.generateContainerName('validation');
    const startTime = Date.now();

    this.logger.info('Starting container validation', 'container-validator', { 
      containerId, 
      image: containerConfig.image 
    });

    try {
      // Create container
      const container = await this.createContainer(containerConfig, containerId);
      
      // Start container
      await this.startContainer(container);
      
      // Wait for container to be ready
      const readyState = await this.waitForContainerReady(containerId);
      
      // Validate container state
      const containerState = await this.inspectContainer(containerId);
      
      // Check resource usage
      const resourceUsage = await this.monitorResourceUsage(containerId);
      
      // Validate environment
      const environmentChecks = await this.validateEnvironment(containerId);
      
      const buildTime = Date.now() - startTime;
      const startupTime = readyState.timestamp - startTime;

      const validation = {
        containerId,
        status: readyState.isRunning ? 'running' : 'failed',
        buildTime,
        startupTime,
        resourceUsage,
        extensions: [], // Will be populated by extension validator
        environmentChecks
      };

      this.logger.info('Container validation completed', 'container-validator', {
        containerId,
        status: validation.status,
        buildTime,
        startupTime
      });

      return validation;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Container validation failed: ${errorMessage}`, 'container-validator');

      return {
        containerId,
        status: 'failed',
        resourceUsage: {
          memory: { used: 0, limit: 0, warningThreshold: this.memoryThreshold },
          cpu: { usage: 0, cores: 0 },
          disk: { used: 0, available: 0 }
        },
        extensions: [],
        environmentChecks: [{
          name: 'Container Startup',
          status: 'failed',
          message: errorMessage,
          executionTime: Date.now() - startTime
        }]
      };
    }
  }

  /**
   * Create Docker container with configuration
   */
  private async createContainer(config: any, containerId: string): Promise<Docker.Container> {
    this.logger.info('Creating container', 'container-validator', { containerId });

    const containerConfig = {
      Image: config.image,
      name: containerId,
      Env: Object.entries(config.environment || {}).map(([key, value]) => `${key}=${value}`),
      ExposedPorts: Object.keys(config.ports || {}).reduce((exposed, port) => {
        exposed[port] = {};
        return exposed;
      }, {}),
      HostConfig: {
        Binds: config.volumes || [],
        PortBindings: config.ports || {},
        Memory: this.memoryThreshold * 1024 * 1024, // Convert GB to bytes
        CpuShares: 512,
        RestartPolicy: {
          Name: 'unless-stopped'
        }
      }
    };

    const container = await this.docker.createContainer(containerConfig);
    
    this.logger.info('Container created successfully', 'container-validator', { 
      containerId: container.id 
    });

    return container;
  }

  /**
   * Start Docker container
   */
  private async startContainer(container: Docker.Container): Promise<void> {
    this.logger.info('Starting container', 'container-validator', { 
      containerId: container.id 
    });

    await container.start();
    
    this.logger.info('Container started successfully', 'container-validator', { 
      containerId: container.id 
    });
  }

  /**
   * Wait for container to be ready
   */
  private async waitForContainerReady(containerId: string): Promise<{ isRunning: boolean; timestamp: number }> {
    this.logger.info('Waiting for container to be ready', 'container-validator', { containerId });

    const startTime = Date.now();
    const maxWaitTime = Math.min(this.validationTimeout, 120000); // Max 2 minutes for readiness

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const containerData = await this.docker.getContainer(containerId);
        const containerInfo = await containerData.inspect();
        
        if (containerInfo.State.Running) {
          // Additional readiness checks
          const isReady = await this.checkReadiness(containerId);
          if (isReady) {
            this.logger.info('Container is ready', 'container-validator', { 
              containerId,
              uptime: Date.now() - startTime
            });
            return { isRunning: true, timestamp: Date.now() };
          }
        }

        if (containerInfo.State.Status === 'exited' || containerInfo.State.Status === 'dead') {
          this.logger.error('Container exited during startup', 'container-validator', {
            containerId,
            status: containerInfo.State.Status,
            exitCode: containerInfo.State.ExitCode
          });
          return { isRunning: false, timestamp: Date.now() };
        }

        await VSCodeTestUtils.sleep(2000); // Wait 2 seconds before next check

      } catch (error) {
        this.logger.warning(`Error checking container status: ${error}`, 'container-validator');
        await VSCodeTestUtils.sleep(5000); // Wait 5 seconds on error
      }
    }

    this.logger.error('Container readiness timeout', 'container-validator', { 
      containerId,
      waitTime: Date.now() - startTime
    });

    return { isRunning: false, timestamp: Date.now() };
  }

  /**
   * Check container readiness beyond just running
   */
  private async checkReadiness(containerId: string): Promise<boolean> {
    try {
      // Check if basic processes are running
      const containerData = await this.docker.getContainer(containerId);
      const containerInfo = await containerData.inspect();
      
      if (!containerInfo.State.Running) {
        return false;
      }

      // Check if container has been running for at least 5 seconds
      const uptimeSeconds = this.calculateUptime(containerInfo.State.StartedAt);
      if (uptimeSeconds < 5) {
        return false;
      }

      // Check for common readiness indicators
      const isReady = await this.checkReadinessIndicators(containerId);
      
      return isReady;

    } catch (error) {
      this.logger.warning(`Readiness check failed: ${error}`, 'container-validator');
      return false;
    }
  }

  /**
   * Check specific readiness indicators
   */
  private async checkReadinessIndicators(containerId: string): Promise<boolean> {
    try {
      // For VS Code containers, check if Node.js processes are responsive
      const execOptions = {
        Cmd: ['node', '--version'],
        AttachStdout: true,
        AttachStderr: true
      };

      const exec = await this.docker.exec(containerId, execOptions);
      const stream = await exec.start();

      return new Promise((resolve) => {
        let output = '';
        stream.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });

        stream.on('end', () => {
          // Node.js should respond with version
          const isReady = output.includes('v') && output.length > 5;
          resolve(isReady);
        });

        stream.on('error', () => {
          resolve(false);
        });

        // Timeout after 10 seconds
        setTimeout(() => resolve(false), 10000);
      });

    } catch (error) {
      this.logger.warning(`Readiness indicator check failed: ${error}`, 'container-validator');
      return false;
    }
  }

  /**
   * Inspect container and get detailed information
   */
  private async inspectContainer(containerId: string): Promise<ContainerState> {
    try {
      const containerData = await this.docker.getContainer(containerId);
      const containerInfo = await containerData.inspect();

      const state = new ContainerState(containerId, containerInfo.Config.Image);
      
      if (containerInfo.State.Running) {
        state.markStarted();
        state.setStartedAt(new Date(containerInfo.State.StartedAt));
      }

      // Set resource usage from container info
      if (containerInfo.State.Running) {
        // Get actual resource usage from stats
        const stats = await this.getContainerStats(containerId);
        state.updateResourceUsage(this.parseDockerStats(stats));
      }

      // Set network ports
      if (containerInfo.NetworkSettings?.Ports) {
        Object.entries(containerInfo.NetworkSettings.Ports).forEach(([containerPort, hostBindings]) => {
          if (hostBindings && hostBindings.length > 0) {
            const hostPort = hostBindings[0].HostPort;
            state.addPort(parseInt(containerPort), hostPort);
          }
        });
      }

      // Set environment variables
      if (containerInfo.Config.Env) {
        containerInfo.Config.Env.forEach(envVar => {
          const [key, value] = envVar.split('=', 2);
          if (key && value) {
            state.addEnvironmentVariable(key, value);
          }
        });
      }

      // Set volumes
      if (containerInfo.HostConfig?.Binds) {
        containerInfo.HostConfig.Binds.forEach(volume => {
          state.addVolume(volume);
        });
      }

      return state;

    } catch (error) {
      this.logger.error(`Container inspection failed: ${error}`, 'container-validator');
      
      // Return minimal state on inspection failure
      const state = new ContainerState(containerId, 'unknown');
      state.markFailed();
      state.setMetadata('inspection_error', error instanceof Error ? error.message : String(error));
      
      return state;
    }
  }

  /**
   * Monitor container resource usage
   */
  private async monitorResourceUsage(containerId: string): Promise<ResourceUsage> {
    try {
      const stats = await this.getContainerStats(containerId);
      return this.parseDockerStats(stats);

    } catch (error) {
      this.logger.warning(`Resource monitoring failed: ${error}`, 'container-validator');
      
      // Return default resource usage on monitoring failure
      return {
        memory: { used: 0, limit: this.memoryThreshold, warningThreshold: this.memoryThreshold },
        cpu: { usage: 0, cores: 0 },
        disk: { used: 0, available: 0 }
      };
    }
  }

  /**
   * Get container statistics from Docker
   */
  private async getContainerStats(containerId: string): Promise<any> {
    const containerData = await this.docker.getContainer(containerId);
    const stats = await containerData.stats({ stream: false });
    return stats;
  }

  /**
   * Parse Docker stats into ResourceUsage format
   */
  private parseDockerStats(stats: any): ResourceUsage {
    // Memory usage
    const memoryStats = stats.memory_stats || {};
    const memoryLimit = memoryStats.limit || 0;
    const memoryUsage = memoryStats.usage || 0;
    const memoryUsedMb = Math.round(memoryUsage / (1024 * 1024)); // Convert bytes to MB
    const memoryLimitMb = Math.round(memoryLimit / (1024 * 1024));

    // CPU usage
    const cpuStats = stats.cpu_stats || {};
    const preCpuStats = stats.precpu_stats || {};
    const cpuDelta = cpuStats.cpu_usage - (preCpuStats.cpu_usage || 0);
    const systemDelta = cpuStats.system_cpu_usage - (preCpuStats.system_cpu_usage || 0);
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * (cpuStats.online_cpus || 1) * 100 : 0;

    // Disk usage (if available)
    const diskStats = stats.blkio_stats || {};
    const diskRead = diskStats.io_service_bytes_recursive?.read || 0;
    const diskWrite = diskStats.io_service_bytes_recursive?.write || 0;
    const diskUsedMb = Math.round((diskRead + diskWrite) / (1024 * 1024));

    return {
      memory: {
        used: memoryUsedMb,
        limit: memoryLimitMb,
        warningThreshold: this.memoryThreshold
      },
      cpu: {
        usage: Math.min(cpuPercent, 100), // Cap at 100%
        cores: cpuStats.online_cpus || 1
      },
      disk: {
        used: diskUsedMb,
        available: Math.max(0, memoryLimitMb - diskUsedMb) // Estimate available space
      }
    };
  }

  /**
   * Validate container environment
   */
  private async validateEnvironment(containerId: string): Promise<EnvironmentCheck[]> {
    const checks: EnvironmentCheck[] = [];
    const startTime = Date.now();

    try {
      // Check Node.js availability
      const nodeCheck = await this.checkNodeAvailability(containerId);
      checks.push(nodeCheck);

      // Check Git availability
      const gitCheck = await this.checkGitAvailability(containerId);
      checks.push(gitCheck);

      // Check development tools
      const devToolsCheck = await this.checkDevelopmentTools(containerId);
      checks.push(devToolsCheck);

      // Check file system permissions
      const fsCheck = await this.checkFileSystemPermissions(containerId);
      checks.push(fsCheck);

      // Check network connectivity
      const networkCheck = await this.checkNetworkConnectivity(containerId);
      checks.push(networkCheck);

    } catch (error) {
      this.logger.error(`Environment validation failed: ${error}`, 'container-validator');
      
      checks.push({
        name: 'Environment Validation',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      });
    }

    return checks;
  }

  /**
   * Check Node.js availability in container
   */
  private async checkNodeAvailability(containerId: string): Promise<EnvironmentCheck> {
    const startTime = Date.now();

    try {
      const execOptions = {
        Cmd: ['node', '--version'],
        AttachStdout: true,
        AttachStderr: true
      };

      const exec = await this.docker.exec(containerId, execOptions);
      const stream = await exec.start();

      return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          if (execOptions.AttachStdout) output += data;
          if (execOptions.AttachStderr) errorOutput += data;
        });

        stream.on('end', () => {
          const executionTime = Date.now() - startTime;
          
          if (output.includes('v') && output.length > 5) {
            resolve({
              name: 'Node.js Availability',
              status: 'passed',
              message: `Node.js available: ${output.trim()}`,
              executionTime
            });
          } else {
            resolve({
              name: 'Node.js Availability',
              status: 'failed',
              message: `Node.js not available or error: ${errorOutput || output}`,
              executionTime
            });
          }
        });

        stream.on('error', (error: any) => {
          resolve({
            name: 'Node.js Availability',
            status: 'failed',
            message: `Node.js check failed: ${error.message || error}`,
            executionTime: Date.now() - startTime
          });
        });

        setTimeout(() => {
          resolve({
            name: 'Node.js Availability',
            status: 'failed',
            message: 'Node.js check timeout',
            executionTime: Date.now() - startTime
          });
        }, 10000);
      });

    } catch (error) {
      return {
        name: 'Node.js Availability',
        status: 'failed',
        message: `Node.js check error: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check Git availability in container
   */
  private async checkGitAvailability(containerId: string): Promise<EnvironmentCheck> {
    const startTime = Date.now();

    try {
      const execOptions = {
        Cmd: ['git', '--version'],
        AttachStdout: true,
        AttachStderr: true
      };

      const exec = await this.docker.exec(containerId, execOptions);
      const stream = await exec.start();

      return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          if (execOptions.AttachStdout) output += data;
          if (execOptions.AttachStderr) errorOutput += data;
        });

        stream.on('end', () => {
          const executionTime = Date.now() - startTime;
          
          if (output.includes('git version') && output.length > 10) {
            resolve({
              name: 'Git Availability',
              status: 'passed',
              message: `Git available: ${output.trim()}`,
              executionTime
            });
          } else {
            resolve({
              name: 'Git Availability',
              status: 'warning', // Warning because Git might not be essential for all containers
              message: `Git not available: ${errorOutput || output}`,
              executionTime
            });
          }
        });

        stream.on('error', (error: any) => {
          resolve({
            name: 'Git Availability',
            status: 'warning',
            message: `Git check failed: ${error.message || error}`,
            executionTime: Date.now() - startTime
          });
        });

        setTimeout(() => {
          resolve({
            name: 'Git Availability',
            status: 'warning',
            message: 'Git check timeout',
            executionTime: Date.now() - startTime
          });
        }, 8000);
      });

    } catch (error) {
      return {
        name: 'Git Availability',
        status: 'warning',
        message: `Git check error: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check development tools availability
   */
  private async checkDevelopmentTools(containerId: string): Promise<EnvironmentCheck> {
    const startTime = Date.now();

    try {
      // Check for common development tools
      const tools = ['npm', 'yarn', 'python', 'pip'];
      const results: string[] = [];

      for (const tool of tools) {
        try {
          const execOptions = {
            Cmd: ['which', tool],
            AttachStdout: true,
            AttachStderr: true
          };

          const exec = await this.docker.exec(containerId, execOptions);
          const stream = await exec.start();

          await new Promise<void>((resolve) => {
            stream.on('data', (chunk: Buffer) => {
              const data = chunk.toString();
              if (data.trim() && !data.includes('not found')) {
                results.push(`${tool}: found`);
              }
            });

            stream.on('end', resolve);
            stream.on('error', resolve);
            setTimeout(resolve, 3000);
          });

        } catch (error) {
          // Tool not found, continue with others
        }
      }

      const executionTime = Date.now() - startTime;
      const hasTools = results.length > 0;

      return {
        name: 'Development Tools',
        status: hasTools ? 'passed' : 'warning',
        message: hasTools ? `Development tools available: ${results.join(', ')}` : 'No development tools found',
        executionTime,
        details: { tools: results }
      };

    } catch (error) {
      return {
        name: 'Development Tools',
        status: 'failed',
        message: `Development tools check error: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check file system permissions
   */
  private async checkFileSystemPermissions(containerId: string): Promise<EnvironmentCheck> {
    const startTime = Date.now();

    try {
      // Check write permissions in /tmp
      const execOptions = {
        Cmd: ['sh', '-c', 'touch /tmp/vscode-test-permissions && rm /tmp/vscode-test-permissions'],
        AttachStdout: true,
        AttachStderr: true
      };

      const exec = await this.docker.exec(containerId, execOptions);
      const stream = await exec.start();

      return new Promise((resolve) => {
        let errorOutput = '';

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          if (execOptions.AttachStderr) errorOutput += data;
        });

        stream.on('end', () => {
          const executionTime = Date.now() - startTime;
          
          if (!errorOutput) {
            resolve({
              name: 'File System Permissions',
              status: 'passed',
              message: 'File system permissions are adequate',
              executionTime
            });
          } else {
            resolve({
              name: 'File System Permissions',
              status: 'warning',
              message: `File system permission issue: ${errorOutput}`,
              executionTime
            });
          }
        });

        stream.on('error', (error: any) => {
          resolve({
            name: 'File System Permissions',
            status: 'failed',
            message: `File system permissions check failed: ${error.message || error}`,
            executionTime: Date.now() - startTime
          });
        });

        setTimeout(() => {
          resolve({
            name: 'File System Permissions',
            status: 'warning',
            message: 'File system permissions check timeout',
            executionTime: Date.now() - startTime
          });
        }, 5000);
      });

    } catch (error) {
      return {
        name: 'File System Permissions',
        status: 'failed',
        message: `File system permissions check error: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(containerId: string): Promise<EnvironmentCheck> {
    const startTime = Date.now();

    try {
      // Check basic network connectivity with ping to external host
      const execOptions = {
        Cmd: ['sh', '-c', 'ping -c 1 8.8.8.8 >/dev/null 2>&1 && echo "Network OK" || echo "Network Failed"'],
        AttachStdout: true,
        AttachStderr: true
      };

      const exec = await this.docker.exec(containerId, execOptions);
      const stream = await exec.start();

      return new Promise((resolve) => {
        let output = '';

        stream.on('data', (chunk: Buffer) => {
          const data = chunk.toString();
          if (execOptions.AttachStdout) output += data;
        });

        stream.on('end', () => {
          const executionTime = Date.now() - startTime;
          
          if (output.includes('Network OK')) {
            resolve({
              name: 'Network Connectivity',
              status: 'passed',
              message: 'Network connectivity is working',
              executionTime
            });
          } else {
            resolve({
              name: 'Network Connectivity',
              status: 'warning', // Warning because network might not be essential
              message: 'Network connectivity issues detected',
              executionTime
            });
          }
        });

        stream.on('error', (error: any) => {
          resolve({
            name: 'Network Connectivity',
            status: 'warning',
            message: `Network check failed: ${error.message || error}`,
            executionTime: Date.now() - startTime
          });
        });

        setTimeout(() => {
          resolve({
            name: 'Network Connectivity',
            status: 'warning',
            message: 'Network connectivity check timeout',
            executionTime: Date.now() - startTime
          });
        }, 8000);
      });

    } catch (error) {
      return {
        name: 'Network Connectivity',
        status: 'warning',
        message: `Network connectivity check error: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Calculate uptime from start time
   */
  private calculateUptime(startedAt: string): number {
    const startTime = new Date(startedAt);
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
  }

  /**
   * Cleanup container resources
   */
  public async cleanup(containerId: string): Promise<void> {
    try {
      this.logger.info('Cleaning up container resources', 'container-validator', { containerId });

      const container = await this.docker.getContainer(containerId);
      
      // Stop container if running
      const containerInfo = await container.inspect();
      if (containerInfo.State.Running) {
        await container.stop({ t: 10 }); // 10 second timeout
        this.logger.info('Container stopped', 'container-validator', { containerId });
      }

      // Remove container
      await container.remove();
      this.logger.info('Container removed', 'container-validator', { containerId });

    } catch (error) {
      this.logger.error(`Container cleanup failed: ${error}`, 'container-validator', { containerId });
      throw error;
    }
  }
}