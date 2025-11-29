#!/usr/bin/env node

/**
 * VS Code Dev Container Log Analyzer
 * Finds and analyzes recent container build logs
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

function findVSCodeContainerLogs() {
  console.log('🔍 Searching for VS Code Container Logs\n');

  const possibleLogPaths = [
    `${homedir()}/Library/Application Support/Code/User/logs`,
    `${homedir()}/.vscode/logs`,
    `${homedir()}/AppData/Roaming/Code/User/logs`,
    '/tmp/vscode-remote-containers-logs',
  ];

  let logDir = null;
  for (const path of possibleLogPaths) {
    if (existsSync(path)) {
      logDir = path;
      console.log(`✅ Found VS Code logs directory: ${path}`);
      break;
    }
  }

  if (!logDir) {
    console.log('❌ VS Code logs directory not found');
    console.log('📝 Try these locations:');
    possibleLogPaths.forEach(path => console.log(`   ${path}`));
    return null;
  }

  try {
    const files = readdirSync(logDir);
    const logFiles = files
      .filter(file => file.includes('remote') || file.includes('container'))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5);

    if (logFiles.length === 0) {
      console.log('❌ No container-related log files found');
      return null;
    }

    console.log(`\n📋 Found ${logFiles.length} recent container log files:`);
    logFiles.forEach(file => console.log(`   ${file}`));

    // Analyze the most recent log file
    const latestLogFile = logFiles[0];
    const logPath = join(logDir, latestLogFile);

    console.log(`\n🔬 Analyzing: ${latestLogFile}`);
    console.log('='.repeat(60));

    const logContent = readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n');

    analyzeLogLines(lines);

    return logPath;
  } catch (error) {
    console.log(`❌ Error reading logs: ${error.message}`);
    return null;
  }
}

function analyzeLogLines(lines) {
  const errors = [];
  const warnings = [];
  const critical = [];
  const buildSteps = [];

  let inBuildSection = false;
  let buildStartTime = null;
  let buildEndTime = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Track build timing
    if (
      trimmedLine.includes('Starting container build') ||
      trimmedLine.includes('Building container')
    ) {
      buildStartTime = extractTimestamp(line);
      inBuildSection = true;
      buildSteps.push('🏗️ Build started');
    }

    if (trimmedLine.includes('Build completed') || trimmedLine.includes('Container started')) {
      buildEndTime = extractTimestamp(line);
      inBuildSection = false;
      buildSteps.push('✅ Build completed');
    }

    // Extract errors
    if (
      trimmedLine.toLowerCase().includes('error') ||
      trimmedLine.toLowerCase().includes('failed') ||
      trimmedLine.toLowerCase().includes('exception')
    ) {
      const errorLine = extractErrorContext(lines, i);
      if (errorLine) {
        errors.push(errorLine);
      }
    }

    // Extract warnings
    if (
      trimmedLine.toLowerCase().includes('warning') ||
      trimmedLine.toLowerCase().includes('deprecated')
    ) {
      warnings.push(trimmedLine);
    }

    // Extract critical issues
    if (
      trimmedLine.toLowerCase().includes('critical') ||
      trimmedLine.toLowerCase().includes('fatal') ||
      trimmedLine.includes('EACCES') ||
      trimmedLine.includes('permission denied')
    ) {
      critical.push(trimmedLine);
    }

    // Track build progress
    if (inBuildSection && trimmedLine.includes('Step')) {
      buildSteps.push(`📦 ${trimmedLine}`);
    }
  }

  // Display analysis
  console.log('\n🎯 BUILD ANALYSIS:');

  if (buildSteps.length > 0) {
    console.log('\n📋 Build Steps:');
    buildSteps.slice(-10).forEach(step => console.log(`   ${step}`));
  }

  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    critical.forEach(issue => console.log(`   ${issue}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.slice(-10).forEach(error => console.log(`   ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.slice(-5).forEach(warning => console.log(`   ${warning}`));
  }

  // Build timing
  if (buildStartTime && buildEndTime) {
    const duration = buildEndTime - buildStartTime;
    console.log(`\n⏱️  Build Duration: ${Math.round(duration / 1000)} seconds`);
  }

  // Root cause analysis
  console.log('\n🔍 ROOT CAUSE ANALYSIS:');
  analyzeRootCauses(errors, warnings, critical);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  generateRecommendations(errors, warnings, critical);
}

function extractTimestamp(line) {
  const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (timestampMatch) {
    return new Date(timestampMatch[1]);
  }
  return Date.now();
}

function extractErrorContext(lines, currentIndex) {
  const contextLines = [];
  const start = Math.max(0, currentIndex - 2);
  const end = Math.min(lines.length - 1, currentIndex + 2);

  for (let i = start; i <= end; i++) {
    const line = lines[i].trim();
    if (line && (line.includes('ERROR') || line.includes('error') || line.includes('failed'))) {
      contextLines.push(line);
    }
  }

  return contextLines.join(' → ');
}

function analyzeRootCauses(errors, warnings, critical) {
  const allIssues = [...errors, ...warnings, ...critical].join(' ').toLowerCase();

  if (
    allIssues.includes('port') ||
    allIssues.includes('bind') ||
    allIssues.includes('address already in use')
  ) {
    console.log('   🔍 Port conflicts detected');
  }

  if (
    allIssues.includes('permission') ||
    allIssues.includes('eacces') ||
    allIssues.includes('denied')
  ) {
    console.log('   🔍 Permission issues detected');
  }

  if (allIssues.includes('docker') && allIssues.includes('not found')) {
    console.log('   🔍 Docker daemon issues');
  }

  if (
    allIssues.includes('disk') ||
    allIssues.includes('space') ||
    allIssues.includes('no space left')
  ) {
    console.log('   🔍 Disk space issues');
  }

  if (
    allIssues.includes('network') ||
    allIssues.includes('connection') ||
    allIssues.includes('timeout')
  ) {
    console.log('   🔍 Network connectivity issues');
  }

  if (
    allIssues.includes('image') ||
    (allIssues.includes('build') && allIssues.includes('failed'))
  ) {
    console.log('   🔍 Container build issues');
  }

  if (errors.length === 0 && warnings.length === 0 && critical.length === 0) {
    console.log('   ✅ No specific issues detected - check VS Code extension');
  }
}

function generateRecommendations(errors, warnings, critical) {
  const allIssues = [...errors, ...warnings, ...critical].join(' ').toLowerCase();

  if (allIssues.includes('port') || allIssues.includes('bind')) {
    console.log('   🔧 Fix port conflicts:');
    console.log('      • Kill processes using ports 3001, 8001, 5433');
    console.log('      • Or change ports in devcontainer.json');
  }

  if (allIssues.includes('permission')) {
    console.log('   🔧 Fix permission issues:');
    console.log('      • Check Docker Desktop permissions');
    console.log('      • Restart Docker Desktop');
    console.log('      • Run: docker system prune');
  }

  if (allIssues.includes('docker') && allIssues.includes('not found')) {
    console.log('   🔧 Fix Docker issues:');
    console.log('      • Restart Docker Desktop');
    console.log('      • Check Docker daemon status');
    console.log('      • Verify Docker in PATH');
  }

  if (allIssues.includes('disk') || allIssues.includes('space')) {
    console.log('   🔧 Fix disk issues:');
    console.log('      • Free up disk space');
    console.log('      • Run: docker system prune -a');
    console.log('      • Remove unused Docker images');
  }

  if (allIssues.includes('network') || allIssues.includes('connection')) {
    console.log('   🔧 Fix network issues:');
    console.log('      • Check internet connection');
    console.log('      • Restart network services');
    console.log('      • Try VS Code "Reload Window"');
  }

  if (allIssues.includes('build') && allIssues.includes('failed')) {
    console.log('   🔧 Fix build issues:');
    console.log('      • Check Dockerfile syntax');
    console.log('      • Verify base image availability');
    console.log('      • Try: docker build --no-cache');
  }

  // General recommendations
  console.log('   🔄 General fixes:');
  console.log('      • VS Code: Developer → Reload Window');
  console.log('      • VS Code: Command Palette → "Dev Containers: Rebuild"');
  console.log('      • Restart Docker Desktop completely');
  console.log('      • Check VS Code Output panel for detailed errors');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  findVSCodeContainerLogs();
}

export { findVSCodeContainerLogs };
