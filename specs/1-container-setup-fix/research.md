# Research Findings: Container Setup Fix

## OpenCode Installation Research

### Decision: Use curl installer with fallback to manual binary download

**Rationale**: 
The OpenCode installer script (`curl -fsSL https://opencode.ai/install | bash`) may fail in containerized environments due to:
- Missing interactive shell features
- Network restrictions
- Permission issues
- Missing dependencies

**Implementation Strategy**:
1. Primary: Use official installer script
2. Fallback: Direct binary download to `/home/vscode/.opencode/bin/`
3. Verification: Test installation with `opencode --version`

**Alternatives Considered**:
- Package manager installation: Not available in standard repos
- Docker multi-stage: Overcomplicated for this use case
- Pre-built base image: Limits flexibility

## Container Build Optimization Research

### Decision: Reorder Docker layers for better caching

**Rationale**:
Current Dockerfile mixes frequently changing tools with stable system dependencies, causing unnecessary rebuilds.

**Optimal Layer Order**:
1. System packages (apt-get) - changes rarely
2. Programming runtimes (Node.js, Python) - changes occasionally  
3. Development tools (uv, git) - changes infrequently
4. User configuration - changes rarely
5. Application-specific tools (OpenCode, spec-kit) - changes most frequently

**Benefits**:
- Faster rebuilds when only application tools change
- Better Docker layer caching
- Reduced bandwidth usage

## User Environment Setup Research

### Decision: Consolidate PATH configuration and use proper user switching

**Current Issues**:
- PATH is modified in multiple places
- Some tools installed as root, others as vscode user
- Potential permission conflicts

**Improved Approach**:
1. Single PATH configuration at end of Dockerfile
2. All user tools installed as vscode user
3. Proper ownership of all user directories
4. Consistent use of USER directive

## uv Tool Integration Research

### Decision: Keep uv installation but improve integration

**Findings**:
- uv is a modern Python package manager that's faster than pip
- Works well in containerized environments
- No conflicts with system Python when properly configured

**Best Practices**:
- Install uv as root for system availability
- Use uv tool install for user-specific tools
- Ensure proper PATH configuration for both root and user

## VS Code Extensions Research

### Decision: Streamline extension list

**Current Extensions**:
- GitHub.copilot: Essential for AI-assisted development
- tanishqkancharla.opencode-vscode: Core OpenCode integration
- ms-vscode-remote.remote-containers: Redundant (already available)
- ms-vscode-remote.remote-ssh: Not needed for container development

**Optimized List**:
- GitHub.copilot
- tanishqkancharla.opencode-vscode

**Rationale**: Remove unnecessary extensions to reduce container startup time and complexity.

## Network Reliability Research

### Decision: Add retry logic and local caching

**Potential Issues**:
- Network timeouts during tool installation
- CDN failures for download URLs
- Proxy/firewall restrictions

**Mitigation Strategies**:
1. Add retry logic for curl commands
2. Use reliable download sources
3. Implement local caching where possible
4. Graceful fallback for non-critical tools

## Security Best Practices Research

### Decision: Maintain non-root user with proper permissions

**Security Considerations**:
- Non-root user reduces attack surface
- Proper sudo configuration for necessary operations
- File permissions should be consistent

**Implementation**:
- Create vscode user with appropriate UID/GID
- Configure sudo for specific commands only
- Ensure all user-owned files have correct permissions
- Avoid running applications as root

## Performance Optimization Research

### Decision: Optimize for build time and runtime efficiency

**Build Time Optimizations**:
- Layer reordering for better caching
- Parallel installation where possible
- Minimize apt-get updates
- Use .dockerignore to exclude unnecessary files

**Runtime Optimizations**:
- Minimal base image (Python 3.11-slim)
- Remove build dependencies after use
- Optimize PATH for tool lookup
- Efficient VS Code extension selection

## Error Handling Research

### Decision: Add comprehensive error checking

**Current Gaps**:
- No verification that tools installed successfully
- No graceful handling of network failures
- Missing validation of configuration

**Improvements**:
1. Add verification steps after each installation
2. Implement retry logic for network operations
3. Add health checks for critical tools
4. Provide meaningful error messages

## Testing Strategy Research

### Decision: Implement comprehensive testing approach

**Test Categories**:
1. **Build Tests**: Verify container builds successfully
2. **Integration Tests**: Test VS Code connection and extensions
3. **Tool Tests**: Verify all development tools are accessible
4. **Performance Tests**: Ensure build time requirements are met
5. **Security Tests**: Validate non-root user and permissions

**Test Automation**:
- Use GitHub Actions for automated testing
- Test on multiple platforms (Linux, macOS, Windows)
- Validate against different Docker versions

## Conclusion

The research identifies several key areas for improvement in the container setup:

1. **Reliability**: Add fallback mechanisms and error handling
2. **Performance**: Optimize layer ordering and reduce unnecessary components  
3. **Security**: Maintain proper user permissions and minimize attack surface
4. **Maintainability**: Improve documentation and testing

These findings will guide the implementation of a robust, efficient development container that meets all specified requirements.