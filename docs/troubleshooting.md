# Container Troubleshooting Guide

## Common Issues and Solutions

### Build Issues

#### Container Build Fails
**Symptoms**: Docker build fails with errors during installation

**Solutions**:
1. **Check Docker Resources**: Ensure Docker Desktop has sufficient memory (8GB+ recommended)
2. **Network Issues**: Verify internet connection for downloading dependencies
3. **Disk Space**: Ensure sufficient disk space for container images
4. **Restart Docker**: Sometimes Docker Desktop needs a restart

#### OpenCode Installation Fails
**Symptoms**: OpenCode CLI not found or installation errors

**Solutions**:
1. **Check Installation Logs**: View logs in `~/.opencode/logs/`
2. **Manual Installation**: Container includes fallback binary installation
3. **Network Check**: Ensure GitHub releases are accessible
4. **Permissions**: Verify user permissions in container

### Runtime Issues

#### VS Code Extension Problems
**Symptoms**: Extensions not loading or working

**Solutions**:
1. **Reload VS Code**: Command Palette > "Developer: Reload Window"
2. **Check Extensions**: Verify extensions are installed in container
3. **Restart Container**: Rebuild container if extensions persistently fail
4. **Check Settings**: Verify VS Code settings in devcontainer.json

#### Permission Errors
**Symptoms**: Permission denied errors when creating files

**Solutions**:
1. **Check User**: Ensure running as `vscode` user (not root)
2. **File Ownership**: Verify file ownership in workspace
3. **Sudo Access**: Use `sudo` only when necessary
4. **Workspace Permissions**: Check workspace directory permissions

#### Tool Not Found
**Symptoms**: Command not found errors for development tools

**Solutions**:
1. **Check PATH**: Run `echo $PATH` to verify tool paths
2. **Source Profile**: Run `source ~/.bashrc` to reload environment
3. **Restart Terminal**: Close and reopen VS Code terminal
4. **Rebuild Container**: If tools missing, rebuild container

### Performance Issues

#### Slow Build Times
**Symptoms**: Container build takes longer than expected

**Solutions**:
1. **Layer Caching**: Docker should cache layers after first build
2. **Network Speed**: Slow internet affects download times
3. **Docker Resources**: Increase CPU/memory allocation in Docker Desktop
4. **Clean Build**: Use `docker system prune` to clean up old images

#### Container Slowness
**Symptoms**: Container runs slowly after startup

**Solutions**:
1. **Resource Limits**: Check Docker Desktop resource allocation
2. **Disk Space**: Ensure sufficient disk space
3. **Background Processes**: Check for processes consuming resources
4. **Restart Container**: Sometimes a fresh restart helps

### Network Issues

#### Port Forwarding Problems
**Symptoms**: Cannot access services running in container

**Solutions**:
1. **Check Port Configuration**: Verify ports in devcontainer.json
2. **Service Status**: Ensure services are actually running
3. **Firewall**: Check if firewall blocks port access
4. **Port Conflicts**: Ensure ports aren't in use on host

#### Internet Access Issues
**Symptoms**: Cannot download packages or access external services

**Solutions**:
1. **DNS Configuration**: Check DNS settings in container
2. **Proxy Settings**: Configure proxy if required
3. **Network Mode**: Ensure proper Docker network configuration
4. **Host Network**: Try host network mode if needed

### Debugging Commands

#### Container Diagnostics
```bash
# Check container status
docker ps

# Check container logs
docker logs <container-id>

# Enter running container
docker exec -it <container-id> bash

# Check resource usage
docker stats
```

#### Inside Container
```bash
# Check user and permissions
whoami
id
ls -la

# Check environment
env | sort
echo $PATH

# Check tool installations
which opencode
opencode --version
python --version
node --version
git --version

# Check disk space
df -h
du -sh ~/.opencode
```

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**: Look at container logs and installation logs
2. **Search Issues**: Check GitHub issues for similar problems
3. **Minimal Reproduction**: Try to reproduce with minimal setup
4. **Report Issue**: Include logs, system info, and reproduction steps

### Recovery Procedures

#### Complete Reset
If container is completely broken:

1. **Remove Container**: `docker rmi <image-name>`
2. **Clean Docker**: `docker system prune -a`
3. **Restart Docker Desktop**
4. **Rebuild Container**: Open project in VS Code and rebuild

#### Partial Reset
If only some tools are broken:

1. **Rebuild Specific Layers**: Modify Dockerfile to rebuild problematic sections
2. **Manual Tool Installation**: Install missing tools manually in container
3. **Configuration Reset**: Reset configuration files in home directory