#!/usr/bin/env node

/**
 * Container Management Tools
 * Built on the working Docker integration foundation
 */

import Docker from 'dockerode';

class ContainerManager {
  constructor() {
    this.docker = new Docker();
  }

  /**
   * List all containers with detailed information
   */
  async listContainers(options = { all: false }) {
    try {
      console.log('📋 Listing containers...');
      const containers = await this.docker.listContainers(options);

      console.log(`✅ Found ${containers.length} containers:`);
      containers.forEach((container, index) => {
        console.log(
          `  ${index + 1}. ${container.Names?.[0] || 'unnamed'} (${container.Id?.substring(0, 12)}...)`
        );
        console.log(`     Status: ${container.Status}`);
        console.log(`     Image: ${container.Image}`);
        console.log(`     Created: ${container.Created}`);
        if (container.Ports && container.Ports.length > 0) {
          console.log(
            `     Ports: ${container.Ports.map(p => `${p.PrivatePort}->${p.PublicPort}`).join(', ')}`
          );
        }
      });

      return containers;
    } catch (error) {
      console.error('❌ Failed to list containers:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed container information
   */
  async getContainerInfo(containerId) {
    try {
      console.log(`🔍 Getting info for container: ${containerId}`);
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();

      console.log('✅ Container info:');
      console.log(`  ID: ${info.Id}`);
      console.log(`  Name: ${info.Name}`);
      console.log(`  Status: ${info.State?.Status}`);
      console.log(`  Started: ${info.State?.StartedAt}`);
      console.log(`  Image: ${info.Config?.Image}`);
      console.log(`  Command: ${info.Config?.Cmd?.join(' ')}`);

      if (info.NetworkSettings?.Networks) {
        console.log(`  Networks: ${Object.keys(info.NetworkSettings.Networks).join(', ')}`);
      }

      return info;
    } catch (error) {
      console.error('❌ Failed to get container info:', error.message);
      throw error;
    }
  }

  /**
   * Start a container
   */
  async startContainer(containerId, options = {}) {
    try {
      console.log(`🚀 Starting container: ${containerId}`);
      const container = this.docker.getContainer(containerId);
      await container.start(options);
      console.log('✅ Container started successfully');

      // Wait a moment and check status
      setTimeout(async () => {
        const info = await this.getContainerInfo(containerId);
        console.log(`📊 Current status: ${info.State?.Status}`);
      }, 2000);

      return true;
    } catch (error) {
      console.error('❌ Failed to start container:', error.message);
      throw error;
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(containerId, options = {}) {
    try {
      console.log(`🛑 Stopping container: ${containerId}`);
      const container = this.docker.getContainer(containerId);
      await container.stop(options);
      console.log('✅ Container stopped successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to stop container:', error.message);
      throw error;
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(containerId, options = { follow: false, tail: 50 }) {
    try {
      console.log(`📄 Getting logs for container: ${containerId}`);
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        tail: options.tail,
        follow: options.follow,
      });

      console.log('✅ Container logs retrieved');
      console.log('--- Last 50 lines of logs ---');

      // Convert buffer to string and display
      const logString = logs.toString();
      const lines = logString.split('\n').slice(-50);
      lines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`  [${String(index + 1).padStart(2, '0')}] ${line}`);
        }
      });

      return logs;
    } catch (error) {
      console.error('❌ Failed to get container logs:', error.message);
      throw error;
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId, options = { force: false }) {
    try {
      console.log(`🗑️ Removing container: ${containerId}`);
      const container = this.docker.getContainer(containerId);
      await container.remove(options);
      console.log('✅ Container removed successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to remove container:', error.message);
      throw error;
    }
  }

  /**
   * List available images
   */
  async listImages() {
    try {
      console.log('🖼️ Listing Docker images...');
      const images = await this.docker.listImages();

      console.log(`✅ Found ${images.length} images:`);
      images.forEach((image, index) => {
        console.log(
          `  ${index + 1}. ${image.RepoTags?.[0] || 'untagged'} (${image.Id?.substring(0, 12)}...)`
        );
        console.log(`     Size: ${Math.round(image.Size / 1024 / 1024)}MB`);
        console.log(`     Created: ${image.Created}`);
      });

      return images;
    } catch (error) {
      console.error('❌ Failed to list images:', error.message);
      throw error;
    }
  }

  /**
   * Run system diagnostics
   */
  async runDiagnostics() {
    try {
      console.log('🔧 Running Docker diagnostics...');

      // Check Docker version
      const version = await this.getDockerVersion();
      console.log(`✅ Docker version: ${version}`);

      // Check system info
      const info = await this.docker.info();
      console.log(`✅ Docker info retrieved`);
      console.log(`  Total Memory: ${info.MemTotal}`);
      console.log(`  CPUs: ${info.NCPU}`);
      console.log(`  Operating System: ${info.OperatingSystem}`);
      console.log(`  Architecture: ${info.Architecture}`);

      // List containers
      const containers = await this.listContainers({ all: true });
      const running = containers.filter(c => c.State === 'running');
      const stopped = containers.filter(c => c.State === 'exited');
      const failed = containers.filter(c => c.State === 'dead');

      console.log(`📊 Container Status Summary:`);
      console.log(`  Running: ${running.length}`);
      console.log(`  Stopped: ${stopped.length}`);
      console.log(`  Failed: ${failed.length}`);
      console.log(`  Total: ${containers.length}`);

      return {
        version,
        info,
        containerSummary: {
          running: running.length,
          stopped: stopped.length,
          failed: failed.length,
          total: containers.length,
        },
      };
    } catch (error) {
      console.error('❌ Docker diagnostics failed:', error.message);
      throw error;
    }
  }

  /**
   * Get Docker version
   */
  async getDockerVersion() {
    return new Promise((resolve, reject) => {
      this.docker.version((err, version) => {
        if (err) {
          reject(err);
        } else {
          resolve(version);
        }
      });
    });
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const containerId = process.argv[3];

  const manager = new ContainerManager();

  try {
    switch (command) {
      case 'list':
        await manager.listContainers();
        break;

      case 'info':
        if (!containerId) {
          console.error('❌ Container ID required for info command');
          process.exit(1);
        }
        await manager.getContainerInfo(containerId);
        break;

      case 'start':
        if (!containerId) {
          console.error('❌ Container ID required for start command');
          process.exit(1);
        }
        await manager.startContainer(containerId);
        break;

      case 'stop':
        if (!containerId) {
          console.error('❌ Container ID required for stop command');
          process.exit(1);
        }
        await manager.stopContainer(containerId);
        break;

      case 'logs':
        if (!containerId) {
          console.error('❌ Container ID required for logs command');
          process.exit(1);
        }
        await manager.getContainerLogs(containerId);
        break;

      case 'images':
        await manager.listImages();
        break;

      case 'diagnostics':
        await manager.runDiagnostics();
        break;

      default:
        console.log('🛠️ Container Management Tools');
        console.log('');
        console.log('Usage:');
        console.log('  node container-tools.js <command> [containerId]');
        console.log('');
        console.log('Commands:');
        console.log('  list        - List all containers');
        console.log('  info <id>  - Get container information');
        console.log('  start <id>  - Start a container');
        console.log('  stop <id>  - Stop a container');
        console.log('  logs <id>  - Get container logs');
        console.log('  images      - List Docker images');
        console.log('  diagnostics  - Run Docker diagnostics');
        console.log('');
        console.log('Examples:');
        console.log('  node container-tools.js list');
        console.log('  node container-tools.js info abc123');
        console.log('  node container-tools.js start abc123');
        console.log('  node container-tools.js diagnostics');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
