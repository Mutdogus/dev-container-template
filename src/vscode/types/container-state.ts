import { ResourceUsage } from './index';

/**
 * Container state models for tracking container lifecycle and status
 * Provides comprehensive container monitoring and validation capabilities
 */
export class ContainerState {
  public containerId: string;
  public status: 'pending' | 'running' | 'stopped' | 'failed';
  public image: string;
  public createdAt: Date;
  public startedAt?: Date;
  public stoppedAt?: Date;
  public resourceUsage: ResourceUsage;
  public ports: Record<string, number>;
  public environment: Record<string, string>;
  public volumes: string[];
  public metadata: Record<string, any>;

  constructor(containerId: string, image: string) {
    this.containerId = containerId;
    this.image = image;
    this.status = 'pending';
    this.createdAt = new Date();
    this.resourceUsage = {
      memory: { used: 0, limit: 0, warningThreshold: 2048 },
      cpu: { usage: 0, cores: 0 },
      disk: { used: 0, available: 0 },
    };
    this.ports = {};
    this.environment = {};
    this.volumes = [];
    this.metadata = {};
  }

  /**
   * Mark container as started
   */
  public markStarted(): void {
    this.status = 'running';
    this.startedAt = new Date();
  }

  /**
   * Mark container as stopped
   */
  public markStopped(): void {
    this.status = 'stopped';
    this.stoppedAt = new Date();
  }

  /**
   * Mark container as failed
   */
  public markFailed(error?: string): void {
    this.status = 'failed';
    this.stoppedAt = new Date();
    if (error) {
      this.metadata.error = error;
    }
  }

  /**
   * Update resource usage
   */
  public updateResourceUsage(usage: Partial<ResourceUsage>): void {
    this.resourceUsage = {
      memory: { ...this.resourceUsage.memory, ...usage.memory },
      cpu: { ...this.resourceUsage.cpu, ...usage.cpu },
      disk: { ...this.resourceUsage.disk, ...usage.disk },
    };
  }

  /**
   * Set memory usage
   */
  public setMemoryUsage(usedMb: number, limitMb?: number, warningThresholdMb?: number): void {
    this.resourceUsage.memory = {
      used: usedMb,
      limit: limitMb || this.resourceUsage.memory.limit,
      warningThreshold: warningThresholdMb || this.resourceUsage.memory.warningThreshold,
    };
  }

  /**
   * Set CPU usage
   */
  public setCpuUsage(usagePercent: number, cores?: number): void {
    this.resourceUsage.cpu = {
      usage: usagePercent,
      cores: cores || this.resourceUsage.cpu.cores,
    };
  }

  /**
   * Set disk usage
   */
  public setDiskUsage(usedMb: number, availableMb?: number): void {
    this.resourceUsage.disk = {
      used: usedMb,
      available: availableMb || this.resourceUsage.disk.available,
    };
  }

  /**
   * Add port mapping
   */
  public addPort(containerPort: number, hostPort: number): void {
    this.ports[containerPort.toString()] = hostPort;
  }

  /**
   * Add environment variable
   */
  public addEnvironmentVariable(key: string, value: string): void {
    this.environment[key] = value;
  }

  /**
   * Add volume mount
   */
  public addVolume(volume: string): void {
    this.volumes.push(volume);
  }

  /**
   * Set metadata
   */
  public setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  /**
   * Get uptime in milliseconds
   */
  public getUptime(): number {
    if (!this.startedAt) {
      return 0;
    }
    const endTime = this.stoppedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  /**
   * Get uptime in human readable format
   */
  public getUptimeFormatted(): string {
    const uptimeMs = this.getUptime();

    if (uptimeMs < 1000) {
      return `${uptimeMs}ms`;
    }

    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    if (uptimeSeconds < 60) {
      return `${uptimeSeconds}s`;
    }

    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const remainingSeconds = uptimeSeconds % 60;
    if (uptimeMinutes < 60) {
      return `${uptimeMinutes}m ${remainingSeconds}s`;
    }

    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const remainingMinutes = uptimeMinutes % 60;
    return `${uptimeHours}h ${remainingMinutes}m`;
  }

  /**
   * Check if container is currently running
   */
  public isRunning(): boolean {
    return this.status === 'running';
  }

  /**
   * Check if container has failed
   */
  public hasFailed(): boolean {
    return this.status === 'failed';
  }

  /**
   * Check if memory usage is above threshold
   */
  public isMemoryAboveThreshold(): boolean {
    return this.resourceUsage.memory.used > this.resourceUsage.memory.warningThreshold;
  }

  /**
   * Check if CPU usage is high
   */
  public isCpuUsageHigh(threshold: number = 80): boolean {
    return this.resourceUsage.cpu.usage > threshold;
  }

  /**
   * Get memory usage percentage
   */
  public getMemoryUsagePercentage(): number {
    if (this.resourceUsage.memory.limit === 0) {
      return 0;
    }
    return (this.resourceUsage.memory.used / this.resourceUsage.memory.limit) * 100;
  }

  /**
   * Get disk usage percentage
   */
  public getDiskUsagePercentage(): number {
    const total = this.resourceUsage.disk.used + this.resourceUsage.disk.available;
    if (total === 0) {
      return 0;
    }
    return (this.resourceUsage.disk.used / total) * 100;
  }

  /**
   * Get container summary
   */
  public getSummary(): {
    containerId: string;
    status: string;
    image: string;
    uptime: string;
    memoryUsage: string;
    cpuUsage: string;
    diskUsage: string;
    portCount: number;
    volumeCount: number;
  } {
    return {
      containerId: this.containerId,
      status: this.status,
      image: this.image,
      uptime: this.getUptimeFormatted(),
      memoryUsage: `${this.resourceUsage.memory.used}MB / ${this.resourceUsage.memory.limit}MB (${this.getMemoryUsagePercentage().toFixed(1)}%)`,
      cpuUsage: `${this.resourceUsage.cpu.usage}% (${this.resourceUsage.cpu.cores} cores)`,
      diskUsage: `${this.resourceUsage.disk.used}MB used, ${this.resourceUsage.disk.available}MB available (${this.getDiskUsagePercentage().toFixed(1)}%)`,
      portCount: Object.keys(this.ports).length,
      volumeCount: this.volumes.length,
    };
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): Record<string, any> {
    return {
      containerId: this.containerId,
      status: this.status,
      image: this.image,
      createdAt: this.createdAt.toISOString(),
      startedAt: this.startedAt?.toISOString(),
      stoppedAt: this.stoppedAt?.toISOString(),
      uptime: this.getUptime(),
      resourceUsage: this.resourceUsage,
      ports: this.ports,
      environment: this.environment,
      volumes: this.volumes,
      metadata: this.metadata,
      summary: this.getSummary(),
    };
  }

  /**
   * Create container state from JSON
   */
  public static fromJSON(json: Record<string, any>): ContainerState {
    const state = new ContainerState(json.containerId, json.image);

    state.status = json.status;
    state.createdAt = new Date(json.createdAt);
    state.startedAt = json.startedAt ? new Date(json.startedAt) : undefined;
    state.stoppedAt = json.stoppedAt ? new Date(json.stoppedAt) : undefined;
    state.resourceUsage = json.resourceUsage;
    state.ports = json.ports || {};
    state.environment = json.environment || {};
    state.volumes = json.volumes || [];
    state.metadata = json.metadata || {};

    return state;
  }

  /**
   * Validate container state
   */
  public validate(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!this.containerId) {
      errors.push('Container ID is required');
    }

    if (!this.image) {
      errors.push('Container image is required');
    }

    if (!['pending', 'running', 'stopped', 'failed'].includes(this.status)) {
      errors.push(`Invalid container status: ${this.status}`);
    }

    if (this.resourceUsage.memory.used < 0) {
      errors.push('Memory usage cannot be negative');
    }

    if (this.resourceUsage.cpu.usage < 0 || this.resourceUsage.cpu.usage > 100) {
      errors.push('CPU usage must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
