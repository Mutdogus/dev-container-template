import { ResourceUsage } from '@vscode/types';
import { DiagnosticLogger } from '@vscode/utils/diagnostics';
import { VSCodeTestUtils } from '@vscode/utils/helpers';

/**
 * Resource usage tracker with alerting and threshold management
 * Monitors memory, CPU, and disk usage with configurable thresholds
 */
export class ResourceTracker {
  private logger: DiagnosticLogger;
  private memoryThreshold: number;
  private cpuThreshold: number;
  private diskThreshold: number;
  private alertHistory: Array<{
    timestamp: Date;
    type: 'memory' | 'cpu' | 'disk';
    severity: 'warning' | 'critical';
    message: string;
    value: number;
    threshold: number;
  }> = [];

  constructor(
    memoryThreshold: number = 2048, // 2GB default
    cpuThreshold: number = 80, // 80% default
    diskThreshold: number = 90 // 90% default
  ) {
    this.logger = DiagnosticLogger.getInstance();
    this.memoryThreshold = memoryThreshold;
    this.cpuThreshold = cpuThreshold;
    this.diskThreshold = diskThreshold;
  }

  /**
   * Track resource usage and check for alerts
   */
  public trackResourceUsage(usage: ResourceUsage): {
    alerts: {
      memory: number;
      cpu: number;
      disk: number;
    };
    warnings: string[];
    recommendations: string[];
  } {
    const alerts = {
      memory: 0,
      cpu: 0,
      disk: 0
    };
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check memory usage
    const memoryAlert = this.checkMemoryUsage(usage.memory);
    if (memoryAlert) {
      alerts.memory++;
      warnings.push(memoryAlert.message);
      recommendations.push(memoryAlert.recommendation);
      this.logAlert('memory', memoryAlert);
    }

    // Check CPU usage
    const cpuAlert = this.checkCpuUsage(usage.cpu);
    if (cpuAlert) {
      alerts.cpu++;
      warnings.push(cpuAlert.message);
      recommendations.push(cpuAlert.recommendation);
      this.logAlert('cpu', cpuAlert);
    }

    // Check disk usage
    const diskAlert = this.checkDiskUsage(usage.disk);
    if (diskAlert) {
      alerts.disk++;
      warnings.push(diskAlert.message);
      recommendations.push(diskAlert.recommendation);
      this.logAlert('disk', diskAlert);
    }

    // Log overall resource status
    this.logger.info('Resource usage tracked', 'resource-tracker', {
      memoryUsage: usage.memory.used,
      memoryLimit: usage.memory.limit,
      cpuUsage: usage.cpu.usage,
      diskUsage: usage.disk.used,
      alerts,
      warnings: warnings.length
    });

    return {
      alerts,
      warnings,
      recommendations
    };
  }

  /**
   * Check memory usage against threshold
   */
  private checkMemoryUsage(memory: ResourceUsage['memory']): {
    message: string;
    recommendation: string;
    severity: 'warning' | 'critical';
    value: number;
    threshold: number;
  } | null {
    const usagePercentage = (memory.used / memory.limit) * 100;
    
    if (usagePercentage >= 95) {
      return {
        message: `Critical memory usage: ${usagePercentage.toFixed(1)}% (${memory.used}MB/${memory.limit}MB)`,
        recommendation: 'Immediate action required - free up memory or increase allocation',
        severity: 'critical',
        value: usagePercentage,
        threshold: this.memoryThreshold
      };
    } else if (usagePercentage >= this.memoryThreshold) {
      return {
        message: `High memory usage: ${usagePercentage.toFixed(1)}% (${memory.used}MB/${memory.limit}MB)`,
        recommendation: 'Consider optimizing memory usage or increasing memory allocation',
        severity: 'warning',
        value: usagePercentage,
        threshold: this.memoryThreshold
      };
    }

    return null;
  }

  /**
   * Check CPU usage against threshold
   */
  private checkCpuUsage(cpu: ResourceUsage['cpu']): {
    message: string;
    recommendation: string;
    severity: 'warning' | 'critical';
    value: number;
    threshold: number;
  } | null {
    const usagePercentage = cpu.usage;
    
    if (usagePercentage >= 95) {
      return {
        message: `Critical CPU usage: ${usagePercentage.toFixed(1)}% on ${cpu.cores} cores`,
        recommendation: 'Immediate action required - reduce CPU load or increase CPU allocation',
        severity: 'critical',
        value: usagePercentage,
        threshold: this.cpuThreshold
      };
    } else if (usagePercentage >= this.cpuThreshold) {
      return {
        message: `High CPU usage: ${usagePercentage.toFixed(1)}% on ${cpu.cores} cores`,
        recommendation: 'Consider optimizing CPU-intensive operations or increasing CPU allocation',
        severity: 'warning',
        value: usagePercentage,
        threshold: this.cpuThreshold
      };
    }

    return null;
  }

  /**
   * Check disk usage against threshold
   */
  private checkDiskUsage(disk: ResourceUsage['disk']): {
    message: string;
    recommendation: string;
    severity: 'warning' | 'critical';
    value: number;
    threshold: number;
  } | null {
    const total = disk.used + disk.available;
    const usagePercentage = total > 0 ? (disk.used / total) * 100 : 0;
    
    if (usagePercentage >= 98) {
      return {
        message: `Critical disk usage: ${usagePercentage.toFixed(1)}% (${disk.used}MB used)`,
        recommendation: 'Immediate action required - free up disk space or increase storage',
        severity: 'critical',
        value: usagePercentage,
        threshold: this.diskThreshold
      };
    } else if (usagePercentage >= this.diskThreshold) {
      return {
        message: `High disk usage: ${usagePercentage.toFixed(1)}% (${disk.used}MB used)`,
        recommendation: 'Consider cleaning up temporary files or increasing disk allocation',
        severity: 'warning',
        value: usagePercentage,
        threshold: this.diskThreshold
      };
    }

    return null;
  }

  /**
   * Log an alert to the alert history
   */
  private logAlert(type: 'memory' | 'cpu' | 'disk', alert: {
    message: string;
    recommendation: string;
    severity: 'warning' | 'critical';
    value: number;
    threshold: number;
  }): void {
    const alertEntry = {
      timestamp: new Date(),
      type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    };

    this.alertHistory.push(alertEntry);

    // Keep only last 1000 alerts to prevent memory issues
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    this.logger.warning(`Resource alert: ${type}`, 'resource-tracker', {
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    });
  }

  /**
   * Get current alert summary
   */
  public getAlertSummary(timeframe: 'hour' | 'day' | 'week' = 'hour'): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: any[];
  } {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeframe) {
      case 'hour':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        break;
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
    }

    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp >= cutoffTime);

    const byType = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: recentAlerts.length,
      byType,
      bySeverity,
      recent: recentAlerts.slice(-10) // Last 10 alerts
    };
  }

  /**
   * Get resource usage trends
   */
  public getResourceTrends(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    memory: {
      average: number;
      peak: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    cpu: {
      average: number;
      peak: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    disk: {
      average: number;
      peak: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  } {
    // This would typically use historical data
    // For now, return current usage as trends
    const currentAlerts = this.getAlertSummary(timeframe);
    
    return {
      memory: {
        average: this.memoryThreshold * 0.7, // Mock average
        peak: this.memoryThreshold * 0.9, // Mock peak
        trend: currentAlerts.byType.memory > 5 ? 'increasing' : 'stable'
      },
      cpu: {
        average: this.cpuThreshold * 0.6, // Mock average
        peak: this.cpuThreshold * 0.8, // Mock peak
        trend: currentAlerts.byType.cpu > 3 ? 'increasing' : 'stable'
      },
      disk: {
        average: 50, // Mock average
        peak: 80, // Mock peak
        trend: currentAlerts.byType.disk > 2 ? 'increasing' : 'stable'
      }
    };
  }

  /**
   * Generate resource usage report
   */
  public generateResourceReport(): {
    summary: any;
    alerts: any[];
    trends: any;
    recommendations: string[];
    timestamp: string;
  } {
    const alertSummary = this.getAlertSummary('day');
    const trends = this.getResourceTrends('day');
    
    const recommendations = this.generateRecommendations(alertSummary, trends);

    const report = {
      summary: {
        totalAlerts: alertSummary.total,
        criticalAlerts: alertSummary.bySeverity.critical || 0,
        warningAlerts: alertSummary.bySeverity.warning || 0,
        memoryAlerts: alertSummary.byType.memory || 0,
        cpuAlerts: alertSummary.byType.cpu || 0,
        diskAlerts: alertSummary.byType.disk || 0
      },
      alerts: this.alertHistory.slice(-20), // Last 20 alerts
      trends,
      recommendations,
      timestamp: new Date().toISOString()
    };

    this.logger.info('Resource report generated', 'resource-tracker', {
      totalAlerts: alertSummary.total,
      recommendations: recommendations.length
    });

    return report;
  }

  /**
   * Generate recommendations based on alerts and trends
   */
  private generateRecommendations(alertSummary: any, trends: any): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    if (alertSummary.memoryAlerts > 3) {
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }

    if (trends.memory.trend === 'increasing') {
      recommendations.push('Memory usage is trending upward - investigate potential memory leaks');
    }

    // CPU recommendations
    if (alertSummary.cpuAlerts > 2) {
      recommendations.push('Consider optimizing CPU-intensive operations or increasing CPU allocation');
    }

    if (trends.cpu.trend === 'increasing') {
      recommendations.push('CPU usage is trending upward - review recent changes or workload');
    }

    // Disk recommendations
    if (alertSummary.diskAlerts > 1) {
      recommendations.push('Consider cleaning up temporary files or increasing disk allocation');
    }

    if (trends.disk.trend === 'increasing') {
      recommendations.push('Disk usage is trending upward - review log rotation and cleanup policies');
    }

    // General recommendations
    if (alertSummary.totalAlerts > 10) {
      recommendations.push('High alert frequency detected - review overall resource management strategy');
    }

    if (recommendations.length === 0) {
      recommendations.push('Resource usage is within acceptable limits');
    }

    return recommendations;
  }

  /**
   * Update thresholds
   */
  public updateThresholds(thresholds: {
    memory?: number;
    cpu?: number;
    disk?: number;
  }): void {
    if (thresholds.memory !== undefined) {
      this.memoryThreshold = thresholds.memory;
      this.logger.info(`Memory threshold updated to: ${thresholds.memory}MB`, 'resource-tracker');
    }

    if (thresholds.cpu !== undefined) {
      this.cpuThreshold = thresholds.cpu;
      this.logger.info(`CPU threshold updated to: ${thresholds.cpu}%`, 'resource-tracker');
    }

    if (thresholds.disk !== undefined) {
      this.diskThreshold = thresholds.disk;
      this.logger.info(`Disk threshold updated to: ${thresholds.disk}%`, 'resource-tracker');
    }
  }

  /**
   * Get current thresholds
   */
  public getThresholds(): {
    memory: number;
    cpu: number;
    disk: number;
  } {
    return {
      memory: this.memoryThreshold,
      cpu: this.cpuThreshold,
      disk: this.diskThreshold
    };
  }

  /**
   * Clear alert history
   */
  public clearAlertHistory(): void {
    this.alertHistory = [];
    this.logger.info('Alert history cleared', 'resource-tracker');
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit: number = 100): Array<{
    timestamp: Date;
    type: 'memory' | 'cpu' | 'disk';
    severity: 'warning' | 'critical';
    message: string;
    value: number;
    threshold: number;
  }> {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Export alert data
   */
  public exportAlertData(): {
    exportTime: string;
    thresholds: any;
    history: any[];
    summary: any;
  } {
    return {
      exportTime: new Date().toISOString(),
      thresholds: this.getThresholds(),
      history: this.alertHistory,
      summary: this.getAlertSummary('week'),
      trends: this.getResourceTrends('week'),
      recommendations: this.generateRecommendations(this.getAlertSummary('week'), this.getResourceTrends('week'))
    };
  }

  /**
   * Check if resource usage is within acceptable limits
   */
  public isWithinLimits(usage: ResourceUsage): boolean {
    const memoryPercentage = (usage.memory.used / usage.memory.limit) * 100;
    const cpuWithinLimit = usage.cpu.usage <= this.cpuThreshold;
    const diskWithinLimit = this.calculateDiskPercentage(usage.disk) <= this.diskThreshold;

    return memoryPercentage <= this.memoryThreshold && cpuWithinLimit && diskWithinLimit;
  }

  /**
   * Calculate disk usage percentage
   */
  private calculateDiskPercentage(disk: ResourceUsage['disk']): number {
    const total = disk.used + disk.available;
    return total > 0 ? (disk.used / total) * 100 : 0;
  }

  /**
   * Get resource efficiency score
   */
  public getResourceEfficiencyScore(usage: ResourceUsage): number {
    const memoryEfficiency = Math.max(0, 100 - (usage.memory.used / usage.memory.limit) * 100);
    const cpuEfficiency = Math.max(0, 100 - usage.cpu.usage);
    const diskEfficiency = Math.max(0, 100 - this.calculateDiskPercentage(usage.disk));

    // Weighted average (memory: 40%, cpu: 40%, disk: 20%)
    const score = (memoryEfficiency * 0.4) + (cpuEfficiency * 0.4) + (diskEfficiency * 0.2);

    return Math.round(score);
  }

  /**
   * Dispose of tracker resources
   */
  public dispose(): void {
    this.clearAlertHistory();
    this.logger.info('Resource tracker disposed', 'resource-tracker');
  }
}