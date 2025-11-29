import * as Docker from 'dockerode';
import { ContainerState, ResourceUsage } from '@vscode/types';
import { DiagnosticLogger } from '@vscode/utils/diagnostics';
import { VSCodeTestUtils } from '@vscode/utils/helpers';

/**
 * Docker integration for VS Code container operations
 * Provides comprehensive Docker API wrapper with error handling and logging
 */
export class DockerIntegration {
  private logger: DiagnosticLogger;
  private docker: Docker;
  private isConnected: boolean = false;

  constructor(dockerOptions?: Docker.DockerOptions) {
    this.logger = DiagnosticLogger.getInstance();
    
    // Initialize Docker client with default options
    const defaultOptions: Docker.DockerOptions = {
      protocol: 'https',
      host: process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
      port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT) : undefined,
      version: process.env.DOCKER_VERSION || 'v1.40',
      timeout: parseInt(process.env.DOCKER_TIMEOUT || '300000')
    };

    const options = { ...defaultOptions, ...dockerOptions };
    this.docker = new Docker(options);
    
    this.logger.info('Docker integration initialized', 'docker-integration', {
      host: options.host,
      protocol: options.protocol,
      version: options.version
    });
  }

  /**
   * Test Docker connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      this.logger.info('Testing Docker connection', 'docker-integration');
      
      // Simple ping to Docker daemon
      await this.docker.ping();
      
      this.isConnected = true;
      this.logger.info('Docker connection successful', 'docker-integration');
      return true;

    } catch (error) {
      this.isConnected = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Docker connection failed: ${errorMessage}`, 'docker-integration');
      return false;
    }
  }

  /**
   * Get Docker system information
   */
  public async getSystemInfo(): Promise<{
    version: string;
    apiVersion: string;
    kernelVersion: string;
    architecture: string;
    operatingSystem: string;
    containers: number;
    images: number;
  } | null> {
    try {
      this.logger.info('Getting Docker system info', 'docker-integration');
      
      const info = await this.docker.info();
      const version = await this.docker.version();
      
      const systemInfo = {
        version: version.Version || 'unknown',
        apiVersion: version.ApiVersion || 'unknown',
        kernelVersion: info.KernelVersion || 'unknown',
        architecture: info.Architecture || 'unknown',
        operatingSystem: info.OperatingSystem || 'unknown',
        containers: info.Containers || 0,
        images: info.Images || 0
      };

      this.logger.info('Docker system info retrieved', 'docker-integration', systemInfo);
      return systemInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get Docker system info: ${errorMessage}`, 'docker-integration');
      return null;
    }
  }

  /**
   * List all containers
   */
  public async listContainers(all: boolean = false): Promise<Docker.ContainerInfo[]> {
    try {
      this.logger.info('Listing containers', 'docker-integration', { all });
      
      const containers = await this.docker.listContainers({ all });
      
      this.logger.info(`Found ${containers.length} containers`, 'docker-integration');
      return containers;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list containers: ${errorMessage}`, 'docker-integration');
      throw error;
    }
  }

  /**
   * Get container information
   */
  public async getContainerInfo(containerId: string): Promise<Docker.ContainerInfo | null> {
    try {
      this.logger.info('Getting container info', 'docker-integration', { containerId });
      
      const containers = await this.docker.listContainers({ all: true });
      const containerInfo = containers.find(c => c.Id === containerId);
      
      if (containerInfo) {
        this.logger.info('Container info retrieved', 'docker-integration', { 
          containerId,
          name: containerInfo.Names[0],
          status: containerInfo.Status,
          image: containerInfo.Image
        });
        return containerInfo;
      } else {
        this.logger.warning(`Container not found: ${containerId}`, 'docker-integration');
        return null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get container info: ${errorMessage}`, 'docker-integration');
      throw error;
    }
  }

  /**
   * Create a new container
   */
  public async createContainer(config: {
    image: string;
    name?: string;
    command?: string[];
    environment?: Record<string, string>;
    volumes?: string[];
    ports?: Record<string, any>;
    workingDir?: string;
    memoryLimit?: number;
    cpuShares?: number;
    user?: string;
    labels?: Record<string, string>;
  }): Promise<Docker.Container> {
    try {
      this.logger.info('Creating container', 'docker-integration', {
        image: config.image,
        name: config.name
      });

      const containerConfig = this.buildContainerConfig(config);
      const container = await this.docker.createContainer(containerConfig);
      
      this.logger.info('Container created successfully', 'docker-integration', {
        containerId: container.id,
        name: config.name
      });

      return container;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create container: ${errorMessage}`, 'docker-integration', {
        image: config.image,
        name: config.name
      });
      throw error;
    }
  }

  /**
   * Start a container
   */
  public async startContainer(containerId: string, options: {
    detach?: boolean;
    timeout?: number;
  } = {}): Promise<void> {
    try {
      this.logger.info('Starting container', 'docker-integration', { containerId });

      const container = await this.docker.getContainer(containerId);
      await container.start({
        Detach: options.detach !== false,
        Tty: true
      });

      this.logger.info('Container started successfully', 'docker-integration', { containerId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to start container: ${errorMessage}`, 'docker-integration', { containerId });
      throw error;
    }
  }

  /**
   * Stop a container
   */
  public async stopContainer(containerId: string, options: {
    timeout?: number;
    force?: boolean;
  } = {}): Promise<void> {
    try {
      this.logger.info('Stopping container', 'docker-integration', { containerId });

      const container = await this.docker.getContainer(containerId);
      await container.stop({
        t: options.timeout || 10000 // 10 second default timeout
      });

      this.logger.info('Container stopped successfully', 'docker-integration', { containerId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to stop container: ${errorMessage}`, 'docker-integration', { containerId });
      throw error;
    }
  }

  /**
   * Restart a container
   */
  public async restartContainer(containerId: string, options: {
    timeout?: number;
  } = {}): Promise<void> {
    try {
      this.logger.info('Restarting container', 'docker-integration', { containerId });

      const container = await this.docker.getContainer(containerId);
      await container.restart({
        t: options.timeout || 30000 // 30 second default timeout
      });

      this.logger.info('Container restarted successfully', 'docker-integration', { containerId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to restart container: ${errorMessage}`, 'docker-integration', { containerId });
      throw error;
    }
  }

  /**
   * Remove a container
   */
  public async removeContainer(containerId: string, options: {
    force?: boolean;
    removeVolumes?: boolean;
  } = {}): Promise<void> {
    try {
      this.logger.info('Removing container', 'docker-integration', { containerId });

      const container = await this.docker.getContainer(containerId);
      await container.remove({
        v: options.removeVolumes !== false,
        force: options.force || false
      });

      this.logger.info('Container removed successfully', 'docker-integration', { containerId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to remove container: ${errorMessage}`, 'docker-integration', { containerId });
      throw error;
    }
  }

  /**
   * Execute command in container
   */
  public async executeCommand(containerId: string, command: string[], options: {
    workingDir?: string;
    environment?: Record<string, string>;
    user?: string;
    attachStdout?: boolean;
    attachStderr?: boolean;
    timeout?: number;
  } = {}): Promise<Docker.Exec> {
    try {
      this.logger.info('Executing command in container', 'docker-integration', {
        containerId,
        command: command.join(' ')
      });

      const container = await this.docker.getContainer(containerId);
      
      const execConfig = {
        Cmd: command,
        WorkingDir: options.workingDir,
        Env: options.environment ? Object.entries(options.environment).map(([k, v]) => `${k}=${v}`) : undefined,
        User: options.user,
        AttachStdout: options.attachStdout !== false,
        AttachStderr: options.attachStderr !== false
      };

      const exec = await container.exec(execConfig);

      this.logger.info('Command execution created', 'docker-integration', {
        containerId,
        execId: exec.id
      });

      return exec;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to execute command: ${errorMessage}`, 'docker-integration', {
        containerId,
        command: command.join(' ')
      });
      throw error;
    }
  }

  /**
   * Get container logs
   */
  public async getContainerLogs(containerId: string, options: {
    follow?: boolean;
    stdout?: boolean;
    stderr?: boolean;
    timestamps?: boolean;
    since?: Date;
    until?: Date;
    tail?: number;
  } = {}): Promise<NodeJS.ReadableStream> {
    try {
      this.logger.info('Getting container logs', 'docker-integration', {
        containerId,
        follow: options.follow,
        tail: options.tail
      });

      const container = await this.docker.getContainer(containerId);
      
      const logOptions = {
        follow: options.follow || false,
        stdout: options.stdout !== false,
        stderr: options.stderr !== false,
        timestamps: options.timestamps || false,
        tail: options.tail
      };

      if (options.since) {
        logOptions.since = options.since;
      }
      if (options.until) {
        logOptions.until = options.until;
      }

      const logs = await container.logs(logOptions);

      this.logger.info('Container logs stream created', 'docker-integration', {
        containerId
      });

      return logs;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get container logs: ${errorMessage}`, 'docker-integration', { containerId });
      throw error;
    }
  }

  /**
   * Get container statistics
   */
  public async getContainerStats(containerId: string): Promise<any> {
    try {
      this.logger.info('Getting container stats', 'docker-integration', { containerId });

      const container = await this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      this.logger.info('Container stats retrieved', 'docker-integration', {
        containerId
      });

      return stats;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get container stats: ${errorMessage}`, 'docker-integration', { containerId });
      throw error;
    }
  }

  /**
   * Wait for container to be ready
   */
  public async waitForContainer(containerId: string, options: {
    timeout?: number;
    checkInterval?: number;
    readyCondition?: (container: Docker.ContainerInspectInfo) => boolean;
  } = {}): Promise<boolean> {
    const timeout = options.timeout || 120000; // 2 minutes default
    const checkInterval = options.checkInterval || 2000; // 2 seconds default
    const startTime = Date.now();

    this.logger.info('Waiting for container to be ready', 'docker-integration', {
      containerId,
      timeout
    });

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Container readiness timeout after ${timeout}ms`));
      }, timeout);

      const checkReady = async () => {
        try {
          const container = await this.docker.getContainer(containerId);
          const containerInfo = await container.inspect();
          
          if (containerInfo.State.Running) {
            const isReady = options.readyCondition ? 
              options.readyCondition(containerInfo) : 
              this.defaultReadinessCondition(containerInfo);
            
            if (isReady) {
              clearTimeout(timeoutHandle);
              this.logger.info('Container is ready', 'docker-integration', {
                containerId,
                waitTime: Date.now() - startTime
              });
              resolve(true);
              return;
            }
          }

          if (!containerInfo.State.Running && containerInfo.State.Status !== 'starting') {
            clearTimeout(timeoutHandle);
            this.logger.error('Container failed to start', 'docker-integration', {
              containerId,
              status: containerInfo.State.Status
            });
            reject(new Error(`Container failed to start: ${containerInfo.State.Status}`));
            return;
          }

          // Continue checking
          setTimeout(checkReady, checkInterval);

        } catch (error) {
          clearTimeout(timeoutHandle);
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error checking container readiness: ${errorMessage}`, 'docker-integration');
          reject(error);
        }
      };

      // Start checking after a short delay
      setTimeout(checkReady, 1000);
    });
  }

  /**
   * Default readiness condition
   */
  private defaultReadinessCondition(containerInfo: Docker.ContainerInspectInfo): boolean {
    // Container is ready if it's been running for at least 5 seconds
    if (!containerInfo.State.StartedAt) {
      return false;
    }

    const startTime = new Date(containerInfo.State.StartedAt);
    const uptimeMs = Date.now() - startTime.getTime();
    
    return uptimeMs > 5000; // 5 seconds minimum uptime
  }

  /**
   * Build Docker container configuration
   */
  private buildContainerConfig(config: any): Docker.ContainerCreateOptions {
    const containerConfig: Docker.ContainerCreateOptions = {
      Image: config.image,
      name: config.name,
      Cmd: config.command,
      Env: config.environment ? Object.entries(config.environment).map(([k, v]) => `${k}=${v}`) : undefined,
      WorkingDir: config.workingDir,
      HostConfig: {
        Binds: config.volumes,
        PortBindings: config.ports,
        Memory: config.memoryLimit ? config.memoryLimit * 1024 * 1024 : undefined, // Convert GB to bytes
        CpuShares: config.cpuShares || 512,
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
      Labels: config.labels || {},
      User: config.user
    };

    return containerConfig;
  }

  /**
   * Get connection status
   */
  public isDockerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get Docker client instance
   */
  public getDockerClient(): Docker {
    return this.docker;
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.logger.info('Cleaning up Docker integration resources', 'docker-integration');
    
    try {
      // Close any open connections
      // Note: dockerode doesn't have explicit close method, but we can mark as disconnected
      this.isConnected = false;
      
      this.logger.info('Docker integration cleaned up', 'docker-integration');
    } catch (error) {
      this.logger.error(`Error during Docker cleanup: ${error}`, 'docker-integration');
    }
  }

  /**
   * Get container resource usage as ResourceUsage format
   */
  public async getContainerResourceUsage(containerId: string): Promise<ResourceUsage | null> {
    try {
      const stats = await this.getContainerStats(containerId);
      
      // Parse memory usage
      const memoryStats = stats.memory_stats || {};
      const memoryLimit = memoryStats.limit || 0;
      const memoryUsage = memoryStats.usage || 0;
      const memoryUsedMb = Math.round(memoryUsage / (1024 * 1024));
      const memoryLimitMb = Math.round(memoryLimit / (1024 * 1024));

      // Parse CPU usage
      const cpuStats = stats.cpu_stats || {};
      const preCpuStats = stats.precpu_stats || {};
      const cpuDelta = cpuStats.cpu_usage - (preCpuStats.cpu_usage || 0);
      const systemDelta = cpuStats.system_cpu_usage - (preCpuStats.system_cpu_usage || 0);
      const cpuPercentage = systemDelta > 0 ? (cpuDelta / systemDelta) * (cpuStats.online_cpus || 1) * 100 : 0;

      // Parse disk usage (if available)
      const diskStats = stats.blkio_stats || {};
      const diskRead = diskStats.io_service_bytes_recursive?.read || 0;
      const diskWrite = diskStats.io_service_bytes_recursive?.write || 0;
      const diskUsedMb = Math.round((diskRead + diskWrite) / (1024 * 1024));

      const resourceUsage: ResourceUsage = {
        memory: {
          used: memoryUsedMb,
          limit: memoryLimitMb,
          warningThreshold: 2048 // 2GB default
        },
        cpu: {
          usage: Math.min(cpuPercentage, 100), // Cap at 100%
          cores: cpuStats.online_cpus || 1
        },
        disk: {
          used: diskUsedMb,
          available: Math.max(0, memoryLimitMb - diskUsedMb) // Estimate available space
        }
      };

      this.logger.info('Container resource usage retrieved', 'docker-integration', {
        containerId,
        memoryUsage: resourceUsage.memory.used,
        cpuUsage: resourceUsage.cpu.usage
      });

      return resourceUsage;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get container resource usage: ${errorMessage}`, 'docker-integration', { containerId });
      return null;
    }
  }

  /**
   * List available images
   */
  public async listImages(): Promise<Docker.ImageInfo[]> {
    try {
      this.logger.info('Listing Docker images', 'docker-integration');
      
      const images = await this.docker.listImages();
      
      this.logger.info(`Found ${images.length} Docker images`, 'docker-integration');
      return images;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list Docker images: ${errorMessage}`, 'docker-integration');
      throw error;
    }
  }

  /**
   * Pull an image
   */
  public async pullImage(imageName: string, options: {
    onProgress?: (progress: Docker.ImageInfo) => void;
    timeout?: number;
  } = {}): Promise<void> {
    try {
      this.logger.info('Pulling Docker image', 'docker-integration', { imageName });

      await new Promise<void>((resolve, reject) => {
        const timeout = options.timeout || 600000; // 10 minutes default
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Image pull timeout after ${timeout}ms`));
        }, timeout);

        this.docker.pull(imageName, (err: any, stream: NodeJS.ReadableStream) => {
          if (err) {
            clearTimeout(timeoutHandle);
            reject(err);
            return;
          }

          stream.on('data', (chunk: Buffer) => {
            const progress = JSON.parse(chunk.toString());
            if (options.onProgress) {
              options.onProgress(progress);
            }
            
            this.logger.debug('Image pull progress', 'docker-integration', {
              imageName,
              progress: progress.status,
              progressDetail: progress.statusDetail
            });
          });

          stream.on('end', () => {
            clearTimeout(timeoutHandle);
            this.logger.info('Image pulled successfully', 'docker-integration', { imageName });
            resolve();
          });

          stream.on('error', (error: any) => {
            clearTimeout(timeoutHandle);
            this.logger.error(`Image pull error: ${error}`, 'docker-integration', { imageName });
            reject(error);
          });
        });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to pull image: ${errorMessage}`, 'docker-integration', { imageName });
      throw error;
    }
  }
}