# Quickstart Guide: VS Code Container Launch Fix

## Overview

This extension provides comprehensive validation, error diagnosis, and recovery guidance for VS Code dev container launch issues. It helps developers quickly identify and resolve container setup problems.

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Container Launch Fix"
4. Click Install

### From VSIX
```bash
code --install-extension container-launch-fix-*.vsix
```

## Getting Started

### 1. Validate Your Configuration
Before launching a container, validate your devcontainer.json:

```bash
# Command Palette (Ctrl+Shift+P)
> Container Launch: Validate Configuration
```

### 2. Launch with Enhanced Diagnostics
Use the enhanced launch command for detailed feedback:

```bash
# Command Palette
> Container Launch: Launch with Diagnostics
```

### 3. Check Environment Status
Verify your Docker environment:

```bash
# Command Palette
> Container Launch: Check Environment
```

## Key Features

### Configuration Validation
- **Syntax Validation**: Checks devcontainer.json syntax and structure
- **Schema Validation**: Validates against official dev container schema
- **Best Practices**: Suggests improvements based on common patterns

### Environment Diagnostics
- **Docker Status**: Checks Docker daemon availability and version
- **Permission Check**: Verifies Docker access permissions
- **Network Connectivity**: Tests external network access
- **Disk Space**: Checks available space for container images

### Error Recovery
- **Smart Suggestions**: Provides context-aware recovery actions
- **Step-by-Step Guides**: Walks through common fixes
- **Automated Fixes**: Applies simple corrections automatically

## Common Issues and Solutions

### Docker Daemon Not Running
**Error**: "Cannot connect to Docker daemon"
**Solution**: 
1. Start Docker Desktop
2. Check Docker service status
3. Verify Docker socket permissions

### Invalid devcontainer.json
**Error**: "Invalid configuration syntax"
**Solution**:
1. Use validation command to identify issues
2. Fix syntax errors highlighted in the editor
3. Validate again before launching

### Insufficient Permissions
**Error**: "Permission denied accessing Docker socket"
**Solution**:
1. Add user to docker group: `sudo usermod -aG docker $USER`
2. Log out and log back in
3. Restart VS Code

### Network Connectivity Issues
**Error**: "Failed to download base image"
**Solution**:
1. Check internet connection
2. Configure proxy settings if needed
3. Try alternative registry or mirror

## Configuration

### Extension Settings
```json
{
  "containerLaunch.autoValidate": true,
  "containerLaunch.showDiagnostics": true,
  "containerLaunch.maxRetries": 3,
  "containerLaunch.logLevel": "info"
}
```

### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "containerLaunch.validation.strict": true,
  "containerLaunch.recovery.automated": true,
  "containerLaunch.performance.monitoring": true
}
```

## Development Workflow

### 1. Setup Development Environment
```bash
git clone <repository>
cd container-launch-fix
npm install
npm run compile
```

### 2. Run Tests
```bash
npm test
npm run test:integration
```

### 3. Debug Extension
```bash
# Launch Extension (F5)
# Test in new VS Code window
```

### 4. Build Extension
```bash
npm run build
npm run package
```

## Troubleshooting

### Extension Not Loading
1. Check VS Code version compatibility (requires 1.85+)
2. Verify Node.js version (18+)
3. Check extension logs: Help > Toggle Developer Tools > Console

### Docker Commands Failing
1. Verify Docker installation
2. Check Docker daemon status
3. Test Docker CLI: `docker version`

### Validation Errors
1. Check devcontainer.json syntax
2. Validate against official schema
3. Review extension logs for details

## API Reference

### Validation API
```typescript
// Validate configuration
const result = await validateConfig(configPath);
console.log(result.isValid, result.errors);
```

### Launch API
```typescript
// Launch with diagnostics
const launch = await launchContainer(configPath, {
  enableDiagnostics: true,
  forceRebuild: false
});
```

### Environment API
```typescript
// Check environment
const env = await checkEnvironment();
console.log(env.isRunning, env.version);
```

## Contributing

### Development Setup
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Style
- Use TypeScript strict mode
- Follow VS Code extension conventions
- Add comprehensive tests
- Document public APIs

## Support

### Getting Help
- **Documentation**: [Extension Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

### Reporting Bugs
1. Check existing issues
2. Create new issue with:
   - VS Code version
   - Extension version
   - Operating system
   - Docker version
   - Steps to reproduce
   - Expected vs actual behavior

## License

MIT License - see LICENSE file for details.