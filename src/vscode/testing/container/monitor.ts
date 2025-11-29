import { ContainerState, ResourceUsage } from '@vscode/types';
import { DiagnosticLogger } from '@vscode/utils/diagnostics';
import { VSCodeTestUtils } from '@vscode/utils/helpers';
import * as Docker from 'dockerode';

/**
 * Container monitoring for tracking resource usage and performance
 * Provides real-time monitoring with alerts and historical data
 */
export class ContainerMonitor {
  private logger: DiagnosticLogger;
  private docker: Docker;
  private monitoredContainers: Map<string, {
    state: ContainerState;
    monitoring: boolean;
    lastUpdate: Date;
    alerts: {
      memory: number;
      cpu: number;
      disk: number;
    };
    history: Array<{
      timestamp: Date;
      resourceUsage: ResourceUsage;
    }>;
  }> = new Map();
  private monitoringInterval: number = 5000; // 5 seconds
  private memoryThreshold: number;
  private cpuThreshold: number;
  private monitoringTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(docker: Docker, memoryThreshold: number = 2048, cpuThreshold: number = 80) {
    this.logger = DiagnosticLogger.getInstance();
    this.docker = docker;
    this.memoryThreshold = memoryThreshold;
    this.cpuThreshold = cpuThreshold;
  }

  /**
   * Start monitoring a container
   */
  public startMonitoring(containerId: string, containerState: ContainerState): void {
    this.logger.info('Starting container monitoring', 'container-monitor', { containerId });

    const monitoringData = {
      state: containerState,
      monitoring: true,
      lastUpdate: new Date(),
      alerts: {
        memory: 0,
        cpu: 0,
        disk: 0
      },
      history: []
    };

    this.monitoredContainers.set(containerId, monitoringData);

    // Start periodic monitoring
    this.startPeriodicMonitoring(containerId);

    this.logger.info('Container monitoring started', 'container-monitor', {
      containerId,
      memoryThreshold: this.memoryThreshold,
      cpuThreshold: this.cpuThreshold
    });
  }

  /**
   * Stop monitoring a container
   */
  public stopMonitoring(containerId: string): void {
    this.logger.info('Stopping container monitoring', 'container-monitor', { containerId });

    const monitoringData = this.monitoredContainers.get(containerId);
    if (monitoringData) {
      monitoringData.monitoring = false;
      
      // Clear monitoring timer
      const timer = this.monitoringTimers.get(containerId);
      if (timer) {
        clearInterval(timer);
        this.monitoringTimers.delete(containerId);
      }
    }

    this.logger.info('Container monitoring stopped', 'container-monitor', { containerId });
  }

  /**
   * Get monitoring status for a container
   */
  public getMonitoringStatus(containerId: string): {
    isMonitoring: boolean;
    alerts: any;
    uptime: number;
    lastUpdate: Date;
  } | null {
    const monitoringData = this.monitoredContainers.get(containerId);
    
    if (!monitoringData) {
      return null;
    }

    return {
      isMonitoring: monitoringData.monitoring,
      alerts: monitoringData.alerts,
      uptime: monitoringData.state.getUptime(),
      lastUpdate: monitoringData.lastUpdate
    };
  }

  /**
   * Get resource usage history for a container
   */
  public getResourceHistory(containerId: string, limit: number = 100): Array<{
    timestamp: Date;
    resourceUsage: ResourceUsage;
  }> {
    const monitoringData = this.monitoredContainers.get(containerId);
    
    if (!monitoringData) {
      return [];
    }

    return monitoringData.history.slice(-limit);
  }

  /**
   * Get current resource usage for a container
   */
  public async getCurrentResourceUsage(containerId: string): Promise<ResourceUsage | null> {
    try {
      const container = await this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      
      return this.parseDockerStats(stats);

    } catch (error) {
      this.logger.error(`Failed to get resource usage: ${error}`, 'container-monitor', { containerId });
      return null;
    }
  }

  /**
   * Get monitoring summary for all containers
   */
  public getMonitoringSummary(): {
    totalContainers: number;
    monitoringContainers: number;
    totalAlerts: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
  } {
    const containers = Array.from(this.monitoredContainers.values());
    const monitoringContainers = containers.filter(c => c.monitoring);
    
    // Calculate averages
    const allHistory = containers.flatMap(c => c.history);
    const averageMemoryUsage = allHistory.length > 0 
      ? allHistory.reduce((sum, h) => sum + h.resourceUsage.memory.used, 0) / allHistory.length 
      : 0;
    
    const averageCpuUsage = allHistory.length > 0 
      ? allHistory.reduce((sum, h) => sum + h.resourceUsage.cpu.usage, 0) / allHistory.length 
      : 0;

    // Count total alerts
    const totalAlerts = containers.reduce((sum, c) => 
      sum + c.alerts.memory + c.alerts.cpu + c.alerts.disk, 0
    );

    return {
      totalContainers: containers.length,
      monitoringContainers: monitoringContainers.length,
      totalAlerts,
      averageMemoryUsage,
      averageCpuUsage
    };
  }

  /**
   * Start periodic monitoring for a container
   */
  private startPeriodicMonitoring(containerId: string): void {
    const timer = setInterval(async () => {
      await this.performMonitoringCheck(containerId);
    }, this.monitoringInterval);

    this.monitoringTimers.set(containerId, timer);
  }

  /**
   * Perform a single monitoring check
   */
  private async performMonitoringCheck(containerId: string): Promise<void> {
    const monitoringData = this.monitoredContainers.get(containerId);
    
    if (!monitoringData || !monitoringData.monitoring) {
      return;
    }

    try {
      // Get current resource usage
      const currentUsage = await this.getCurrentResourceUsage(containerId);
      
      if (!currentUsage) {
        this.logger.warning(`Failed to get resource usage for container ${containerId}`, 'container-monitor');
        return;
      }

      // Update container state
      monitoringData.state.updateResourceUsage(currentUsage);
      monitoringData.lastUpdate = new Date();

      // Check for alerts
      const newAlerts = this.checkAlerts(currentUsage, monitoringData.alerts);
      monitoringData.alerts = {
        memory: newAlerts.memory,
        cpu: newAlerts.cpu,
        disk: newAlerts.disk
      };

      // Log alerts
      this.logAlerts(containerId, newAlerts);

      // Add to history
      monitoringData.history.push({
        timestamp: new Date(),
        resourceUsage: currentUsage
      });

      // Limit history size
      if (monitoringData.history.length > 1000) {
        monitoringData.history = monitoringData.history.slice(-500);
      }

      // Log resource usage
      this.logger.debug('Container resource usage updated', 'container-monitor', {
        containerId,
        memoryUsage: currentUsage.memory.used,
        cpuUsage: currentUsage.cpu.usage,
        memoryPercentage: this.calculateMemoryPercentage(currentUsage.memory),
        cpuPercentage: currentUsage.cpu.usage
      });

    } catch (error) {
      this.logger.error(`Monitoring check failed for container ${containerId}: ${error}`, 'container-monitor');
    }
  }

  /**
   * Check for resource usage alerts
   */
  private checkAlerts(currentUsage: ResourceUsage, previousAlerts: {
    memory: number;
    cpu: number;
    disk: number;
  }): {
    memory: number;
    cpu: number;
    disk: number;
  } {
    const alerts = {
      memory: 0,
      cpu: 0,
      disk: 0
    };

    // Memory alerts
    const memoryPercentage = this.calculateMemoryPercentage(currentUsage.memory);
    if (memoryPercentage > 90) {
      alerts.memory = previousAlerts.memory + 1;
    } else if (memoryPercentage > 80) {
      alerts.memory = previousAlerts.memory > 0 ? previousAlerts.memory : 1; // Only count first time crossing 80%
    } else {
      alerts.memory = 0; // Reset when below threshold
    }

    // CPU alerts
    if (currentUsage.cpu.usage > 95) {
      alerts.cpu = previousAlerts.cpu + 1;
    } else if (currentUsage.cpu.usage > 85) {
      alerts.cpu = previousAlerts.cpu > 0 ? previousAlerts.cpu : 1; // Only count first time crossing 85%
    } else {
      alerts.cpu = 0; // Reset when below threshold
    }

    // Disk alerts (if disk usage is available)
    if (currentUsage.disk.available > 0) {
      const diskPercentage = this.calculateDiskPercentage(currentUsage.disk);
      if (diskPercentage > 95) {
        alerts.disk = previousAlerts.disk + 1;
      } else if (diskPercentage > 85) {
        alerts.disk = previousAlerts.disk > 0 ? previousAlerts.disk : 1; // Only count first time crossing 85%
      } else {
        alerts.disk = 0; // Reset when below threshold
      }
    }

    return alerts;
  }

  /**
   * Log alerts with appropriate severity
   */
  private logAlerts(containerId: string, alerts: {
    memory: number;
    cpu: number;
    disk: number;
  }): void {
    if (alerts.memory > 0) {
      this.logger.warning(`Memory usage alert for container ${containerId}`, 'container-monitor', {
        alertCount: alerts.memory,
        threshold: this.memoryThreshold
      });
    }

    if (alerts.cpu > 0) {
      this.logger.warning(`CPU usage alert for container ${containerId}`, 'container-monitor', {
        alertCount: alerts.cpu,
        threshold: this.cpuThreshold
      });
    }

    if (alerts.disk > 0) {
      this.logger.warning(`Disk usage alert for container ${containerId}`, 'container-monitor', {
        alertCount: alerts.disk
      });
    }
  }

  /**
   * Calculate memory usage percentage
   */
  private calculateMemoryPercentage(memory: {
    used: number;
    limit: number;
    warningThreshold: number;
  }): number {
    if (memory.limit === 0) {
      return 0;
    }
    return (memory.used / memory.limit) * 100;
  }

  /**
   * Calculate disk usage percentage
   */
  private calculateDiskPercentage(disk: {
    used: number;
    available: number;
  }): number {
    const total = disk.used + disk.available;
    if (total === 0) {
      return 0;
    }
    return (disk.used / total) * 100;
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
    const cpuPercentage = systemDelta > 0 ? (cpuDelta / systemDelta) * (cpuStats.online_cpus || 1) * 100 : 0;

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
        usage: Math.min(cpuPercentage, 100), // Cap at 100%
        cores: cpuStats.online_cpus || 1
      },
      disk: {
        used: diskUsedMb,
        available: Math.max(0, memoryLimitMb - diskUsedMb) // Estimate available space
      }
    };
  }

  /**
   * Generate monitoring report
   */
  public generateMonitoringReport(containerId: string): {
    containerId: string;
    monitoringPeriod: string;
    resourceSummary: any;
    alertSummary: any;
    recommendations: string[];
  } {
    const monitoringData = this.monitoredContainers.get(containerId);
    
    if (!monitoringData) {
      throw new Error(`No monitoring data found for container ${containerId}`);
    }

    const history = monitoringData.history;
    const alerts = monitoringData.alerts;
    
    // Calculate summary statistics
    const resourceSummary = {
      memory: {
        average: history.length > 0 ? history.reduce((sum, h) => sum + h.resourceUsage.memory.used, 0) / history.length : 0,
        max: history.length > 0 ? Math.max(...history.map(h => h.resourceUsage.memory.used)) : 0,
        min: history.length > 0 ? Math.min(...history.map(h => h.resourceUsage.memory.used)) : 0,
        threshold: this.memoryThreshold,
        thresholdExceededCount: alerts.memory
      },
      cpu: {
        average: history.length > 0 ? history.reduce((sum, h) => sum + h.resourceUsage.cpu.usage, 0) / history.length : 0,
        max: history.length > 0 ? Math.max(...history.map(h => h.resourceUsage.cpu.usage)) : 0,
        min: history.length > 0 ? Math.min(...history.map(h => h.resourceUsage.cpu.usage)) : 0,
        threshold: this.cpuThreshold,
        thresholdExceededCount: alerts.cpu
      },
      uptime: monitoringData.state.getUptimeFormatted()
    };

    const alertSummary = {
      total: alerts.memory + alerts.cpu + alerts.disk,
      byType: {
        memory: alerts.memory,
        cpu: alerts.cpu,
        disk: alerts.disk
      }
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(resourceSummary, alertSummary);

    return {
      containerId,
      monitoringPeriod: `${history.length} data points over ${monitoringData.state.getUptime()}`,
      resourceSummary,
      alertSummary,
      recommendations
    };
  }

  /**
   * Generate recommendations based on monitoring data
   */
  private generateRecommendations(resourceSummary: any, alertSummary: any): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    if (resourceSummary.memory.average > resourceSummary.memory.threshold * 0.8) {
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }

    if (resourceSummary.memory.thresholdExceededCount > 5) {
      recommendations.push('Frequent memory alerts detected - investigate memory leaks or inefficient usage');
    }

    // CPU recommendations
    if (resourceSummary.cpu.average > resourceSummary.cpu.threshold * 0.8) {
      recommendations.push('Consider optimizing CPU-intensive operations or increasing CPU allocation');
    }

    if (resourceSummary.cpu.thresholdExceededCount > 3) {
      recommendations.push('Frequent CPU alerts detected - investigate performance bottlenecks');
    }

    // General recommendations
    if (alertSummary.total > 10) {
      recommendations.push('High number of alerts detected - review container configuration and resource limits');
    }

    if (recommendations.length === 0) {
      recommendations.push('Resource usage is within acceptable limits');
    }

    return recommendations;
  }

  /**
   * Export monitoring data
   */
  public exportMonitoringData(containerId: string): {
    containerId: string;
    exportTime: string;
    monitoringData: any;
    alerts: any;
    history: any;
  } {
    const monitoringData = this.monitoredContainers.get(containerId);
    
    if (!monitoringData) {
      throw new Error(`No monitoring data found for container ${containerId}`);
    }

    return {
      containerId,
      exportTime: new Date().toISOString(),
      monitoringData: {
        state: monitoringData.state.toJSON(),
        alerts: monitoringData.alerts,
        uptime: monitoringData.state.getUptime(),
        lastUpdate: monitoringData.lastUpdate.toISOString()
      },
      alerts: monitoringData.alerts,
      history: monitoringData.history.map(h => ({
        timestamp: h.timestamp.toISOString(),
        resourceUsage: h.resourceUsage
      }))
    };
  }

  /**
   * Cleanup monitoring resources
   */
  public async dispose(): Promise<void> {
    this.logger.info('Disposing container monitor', 'container-monitor');

    // Clear all monitoring timers
    for (const [containerId, timer] of this.monitoringTimers) {
      clearInterval(timer);
    }
    this.monitoringTimers.clear();

    // Stop monitoring all containers
    for (const containerId of this.monitoredContainers.keys()) {
      this.stopMonitoring(containerId);
    }

    // Clear monitoring data
    this.monitoredContainers.clear();

    this.logger.info('Container monitor disposed', 'container-monitor');
  }
}