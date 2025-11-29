# Implementation Plan: Container Setup Fix

## Technical Context

### Current Issue Analysis
The dev container configuration has been updated to use the custom Dockerfile (which was the main fix), but there may be additional issues preventing successful container build and startup.

### Known Configuration
- **Base Image**: Python 3.11 slim
- **User**: Non-root user "vscode" with UID/GID 1000
- **Tools to Install**: OpenCode CLI, Node.js, uv, Python tools, git
- **VS Code Extensions**: GitHub Copilot, OpenCode, Remote Containers

### Potential Issues to Investigate
- OpenCode installer script reliability
- Network connectivity during build
- Permission issues with user switching
- PATH configuration conflicts
- uv tool installation conflicts

### Dependencies
- Docker daemon
- VS Code Remote Containers extension
- Network access for downloads
- Sufficient build resources

## Constitution Check

### Security Principles
- ✅ Non-root user implementation
- ✅ Minimal base image (Python slim)
- ✅ No hardcoded secrets
- ✅ Proper file permissions

### Development Standards  
- ✅ Reproducible builds
- ✅ Version-controlled configuration
- ✅ Clear separation of concerns
- ✅ Documentation included

### Performance Requirements
- ✅ Build time optimization (layer caching)
- ✅ Minimal runtime overhead
- ✅ Efficient tool installation

## Phase 0: Research & Investigation

### Research Tasks

1. **OpenCode Installer Reliability**
   - Task: Research OpenCode installer script failure modes and best practices
   - Investigate alternative installation methods
   - Check for known issues with containerized installation

2. **Dev Container Best Practices**
   - Task: Find current best practices for multi-tool dev containers
   - Research optimal layer ordering for cache efficiency
   - Investigate user permission patterns

3. **uv Tool Integration**
   - Task: Research uv tool installation in containerized environments
   - Check for conflicts with system Python packages
   - Investigate PATH configuration best practices

### Research Findings

#### OpenCode Installation
- **Decision**: Use curl installer with fallback to manual binary download
- **Rationale**: Installer script may fail in container environments; binary download is more reliable
- **Alternatives considered**: Package manager installation, direct binary extraction

#### Container Build Optimization
- **Decision**: Reorder Docker layers for better caching
- **Rationale**: System dependencies change less frequently than application tools
- **Alternatives considered**: Multi-stage builds, separate tool images

#### User Environment Setup
- **Decision**: Consolidate PATH configuration and use proper user switching
- **Rationale**: Prevents permission issues and ensures tool availability
- **Alternatives considered**: Root user with sudo, entrypoint scripts

## Phase 1: Design & Implementation

### Data Model

No data model required for this infrastructure fix.

### Configuration Contracts

#### devcontainer.json Schema
```json
{
  "name": "Spec-kit / OpenCode Dev Container",
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  },
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "tanishqkancharla.opencode-vscode"
      ]
    }
  },
  "forwardPorts": [3000, 8000, 5432],
  "postCreateCommand": "echo 'Container ready for development'",
  "remoteUser": "vscode"
}
```

#### Dockerfile Optimization
- Layer 1: System dependencies and base setup
- Layer 2: Development tools (Node.js, uv)
- Layer 3: User configuration
- Layer 4: User-specific tool installation

### Implementation Strategy

#### Step 1: Dockerfile Optimization
- Reorder RUN commands for optimal caching
- Add error handling for installations
- Improve user environment setup

#### Step 2: OpenCode Installation Fix
- Add fallback installation method
- Verify installation success
- Proper PATH configuration

#### Step 3: Configuration Validation
- Test container build process
- Verify all tools are accessible
- Validate VS Code integration

## Phase 2: Testing & Validation

### Test Scenarios

1. **Fresh Build Test**
   - Build container from scratch
   - Verify all tools install correctly
   - Check build time is under 10 minutes

2. **Tool Accessibility Test**
   - Verify opencode CLI is accessible
   - Test Python and Node.js availability
   - Confirm git functionality

3. **VS Code Integration Test**
   - Test VS Code connection to container
   - Verify extensions install correctly
   - Check development workflow

4. **User Environment Test**
   - Verify non-root user permissions
   - Test file system access
   - Confirm PATH configuration

### Success Metrics
- Container builds successfully on first attempt
- All development tools are accessible
- VS Code connects without manual intervention
- Build time under 10 minutes
- No permission errors

## Implementation Checklist

### Dockerfile Updates
- [ ] Reorder layers for optimal caching
- [ ] Add error handling for installations
- [ ] Fix OpenCode installation with fallback
- [ ] Consolidate PATH configuration
- [ ] Improve user setup process

### Configuration Updates
- [ ] Clean up devcontainer.json
- [ ] Remove unnecessary extensions
- [ ] Optimize postCreateCommand
- [ ] Verify port forwarding

### Testing & Validation
- [ ] Test fresh container build
- [ ] Verify tool accessibility
- [ ] Test VS Code integration
- [ ] Validate user environment
- [ ] Performance testing

### Documentation
- [ ] Update setup instructions
- [ ] Document troubleshooting steps
- [ ] Add container usage guide
- [ ] Update README with container info

## Risk Mitigation

### High Risk Items
1. **OpenCode Installation Failure**
   - Mitigation: Implement fallback binary download
   - Contingency: Manual installation instructions

2. **Permission Issues**
   - Mitigation: Proper user setup and testing
   - Contingency: Root user fallback with documentation

### Medium Risk Items
1. **Build Time Exceeded**
   - Mitigation: Layer optimization and caching
   - Contingency: Pre-built base image

2. **Network Dependencies**
   - Mitigation: Local caching where possible
   - Contingency: Offline installation methods

## Next Steps

1. Implement Dockerfile optimizations
2. Test container build process
3. Validate tool installation
4. Update documentation
5. Final integration testing