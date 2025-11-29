# Container Maintenance Guide

## Regular Maintenance Tasks

### Daily Maintenance
1. **Monitor Container Health**
   ```bash
   # Check container status
   docker ps
   
   # Monitor resource usage
   docker stats --no-stream
   
   # Check disk space
   df -h
   ```

2. **Verify Tool Functionality**
   ```bash
   # Check critical tools
   opencode --version
   python --version
   node --version
   git --version
   ```

3. **Clean Workspace**
   ```bash
   # Remove temporary files
   find /workspaces -name "*.tmp" -delete
   find /workspaces -name "*.log" -delete
   
   # Clean Python cache
   find /workspaces -name "__pycache__" -type d -exec rm -rf {} +
   ```

### Weekly Maintenance
1. **Update Dependencies**
   ```bash
   # Update Python packages
   pip list --outdated
   pip install --upgrade package-name
   
   # Update Node.js packages
   npm outdated
   npm update
   ```

2. **Docker Cleanup**
   ```bash
   # Remove unused images
   docker image prune -f
   
   # Remove unused containers
   docker container prune -f
   
   # Remove unused volumes (carefully)
   docker volume prune -f
   ```

3. **Backup Configuration**
   ```bash
   # Backup important configuration files
   cp ~/.bashrc ~/.bashrc.backup
   cp ~/.gitconfig ~/.gitconfig.backup
   tar -czf opencode-backup.tar.gz ~/.opencode
   ```

### Monthly Maintenance
1. **System Updates**
   ```bash
   # Update system packages (if container has apt access)
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker pull python:3.11-slim
   docker pull node:18-slim
   ```

2. **Performance Audit**
   ```bash
   # Check container performance over time
   docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
   
   # Analyze disk usage patterns
   du -sh /workspaces/*
   du -sh ~/.opencode
   ```

3. **Security Updates**
   ```bash
   # Check for security vulnerabilities
   pip audit
   npm audit
   
   # Update OpenCode CLI
   curl -LsSf https://astral.sh/uv/install.sh | sh
   # Then update OpenCode if new version available
   ```

## Backup and Recovery

### Configuration Backup
```bash
#!/bin/bash
# backup-container.sh

BACKUP_DIR="/tmp/container-backup-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup user configuration
cp ~/.bashrc "$BACKUP_DIR/"
cp ~/.gitconfig "$BACKUP_DIR/"
cp -r ~/.opencode "$BACKUP_DIR/"
cp -r ~/.config "$BACKUP_DIR/"

# Backup VS Code settings
cp -r ~/.vscode "$BACKUP_DIR/" 2>/dev/null || true

# Create backup archive
tar -czf "container-backup-$(date +%Y%m%d).tar.gz" -C /tmp "container-backup-$(date +%Y%m%d)"

echo "Backup completed: container-backup-$(date +%Y%m%d).tar.gz"
```

### Recovery Procedures
```bash
#!/bin/bash
# restore-container.sh

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

# Extract backup
tar -xzf "$BACKUP_FILE" -C /tmp

# Restore configuration
cp /tmp/container-backup-*/.bashrc ~/.bashrc
cp /tmp/container-backup-*/.gitconfig ~/.gitconfig
cp -r /tmp/container-backup-*/.opencode ~/
cp -r /tmp/container-backup-*/.config ~/ 2>/dev/null || true
cp -r /tmp/container-backup-*/.vscode ~/ 2>/dev/null || true

# Set proper permissions
chmod 644 ~/.bashrc ~/.gitconfig
chmod -R 755 ~/.opencode ~/.config

echo "Recovery completed"
```

## Health Monitoring

### Container Health Check
```bash
#!/bin/bash
# health-check.sh

echo "=== Container Health Check ==="
echo "Timestamp: $(date)"

# Check if container is running
if ! docker ps | grep -q dev-container; then
    echo "❌ Container is not running"
    exit 1
fi

# Check resource usage
echo "📊 Resource Usage:"
docker stats --no-stream dev-container

# Check disk space
echo "💾 Disk Usage:"
df -h | grep -E "(Filesystem|/workspaces|/home)"

# Check critical tools
echo "🔧 Tool Status:"
tools=("opencode" "python" "node" "git" "npm")
for tool in "${tools[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "✅ $tool: $(command -v "$tool")"
    else
        echo "❌ $tool: NOT FOUND"
    fi
done

# Check user permissions
echo "👤 User Info:"
echo "User: $(whoami)"
echo "Home: $HOME"
echo "Workspace: $(pwd)"

echo "=== Health Check Complete ==="
```

### Performance Monitoring
```bash
#!/bin/bash
# performance-monitor.sh

LOG_FILE="/tmp/performance-$(date +%Y%m%d).log"

echo "Starting performance monitoring..."
echo "Timestamp,CPU%,Memory%,NetworkIO,BlockIO" > "$LOG_FILE"

while true; do
    stats=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}}" dev-container)
    echo "$(date),$stats" >> "$LOG_FILE"
    sleep 300  # Every 5 minutes
done
```

## Troubleshooting Common Issues

### Container Won't Start
```bash
# Check Docker daemon
docker version

# Check for conflicting containers
docker ps -a

# Remove stuck containers
docker rm -f $(docker ps -aq --filter "status=exited")

# Rebuild container
docker build --no-cache -t dev-container .
```

### Tools Not Working
```bash
# Check PATH
echo $PATH | tr ':' '\n'

# Reinstall problematic tool
# Example: Reinstall OpenCode
rm -rf ~/.opencode
mkdir -p ~/.opencode/bin
curl -fsSL "https://github.com/sst/opencode/releases/latest/download/opencode-linux-$(uname -m | sed 's/x86_64/amd64/' | sed 's/aarch64/arm64/').tar.gz" | tar -xz -C ~/.opencode/bin
chmod +x ~/.opencode/bin/opencode
```

### Performance Issues
```bash
# Check resource limits
docker inspect dev-container | grep -A 10 "Resources"

# Increase resources if needed
docker run --cpus="2.0" --memory="4g" dev-container

# Clean up Docker
docker system prune -a
```

## Security Maintenance

### Regular Security Tasks
```bash
# Scan for vulnerabilities
pip audit
npm audit

# Update system packages
sudo apt update && sudo apt upgrade -y

# Check file permissions
find ~ -type f -perm /o+w -ls

# Monitor user activity
last
who
```

### Security Hardening
```bash
# Remove unnecessary packages
sudo apt autoremove -y

# Secure SSH keys (if using)
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Check for suspicious processes
ps aux | grep -v "^\[.*\]"
```

## Automation Scripts

### Automated Maintenance
```bash
#!/bin/bash
# auto-maintenance.sh

echo "Starting automated maintenance..."

# Daily tasks
echo "Running daily maintenance..."
./health-check.sh
./cleanup-temp-files.sh

# Weekly tasks (if it's Sunday)
if [ $(date +%u) -eq 7 ]; then
    echo "Running weekly maintenance..."
    ./update-dependencies.sh
    ./docker-cleanup.sh
fi

# Monthly tasks (if it's the 1st)
if [ $(date +%d) -eq 01 ]; then
    echo "Running monthly maintenance..."
    ./system-update.sh
    ./performance-audit.sh
fi

echo "Automated maintenance completed"
```

### Scheduled Maintenance
```bash
# Add to crontab for automation
# crontab -e

# Daily at 2 AM
0 2 * * * /path/to/auto-maintenance.sh

# Weekly on Sunday at 3 AM
0 3 * * 0 /path/to/weekly-maintenance.sh

# Monthly on 1st at 4 AM
0 4 1 * * /path/to/monthly-maintenance.sh
```

## Documentation Maintenance

### Update Documentation
```bash
# Update README when changes are made
echo "Last updated: $(date)" >> README.md

# Update version information
echo "Container version: $(docker images dev-container --format "{{.Tag}}")" >> README.md

# Document known issues
echo "## Known Issues" >> README.md
echo "- Issue description and solution" >> README.md
```

### Change Log
```markdown
# Change Log

## [Date] - Version X.X.X
### Added
- New feature or improvement

### Changed
- Modified existing functionality

### Fixed
- Bug fixes

### Removed
- Deprecated features removed
```

## Emergency Procedures

### Container Recovery
```bash
# Emergency container restart
docker stop dev-container
docker start dev-container

# Complete rebuild (last resort)
docker rmi -f dev-container
docker build -t dev-container .
```

### Data Recovery
```bash
# Recover workspace data
docker cp dev-container:/workspaces ./recovered-workspace

# Recover user configuration
docker cp dev-container:/home/vscode/.opencode ./recovered-opencode
```

### Contact Support
```bash
# Generate support information
docker info > docker-info.txt
docker version > docker-version.txt
docker logs dev-container > container-logs.txt
docker inspect dev-container > container-inspect.txt

# Create support bundle
tar -czf support-bundle-$(date +%Y%m%d).tar.gz docker-*.txt container-*.txt
```

## Maintenance Schedule

| Frequency | Task | Script | Status |
|------------|------|--------|--------|
| Daily | Health check | health-check.sh | ✅ |
| Daily | Cleanup temp files | cleanup-temp-files.sh | ✅ |
| Weekly | Update dependencies | update-dependencies.sh | ✅ |
| Weekly | Docker cleanup | docker-cleanup.sh | ✅ |
| Monthly | System updates | system-update.sh | ✅ |
| Monthly | Performance audit | performance-audit.sh | ✅ |
| Quarterly | Security review | security-review.sh | ✅ |
| Annually | Major updates | major-updates.sh | ⏳ |

## Best Practices

1. **Regular Monitoring**: Don't wait for problems to occur
2. **Automated Backups**: Schedule regular backups of important data
3. **Documentation**: Keep documentation updated with changes
4. **Testing**: Test recovery procedures before they're needed
5. **Security**: Regular security audits and updates
6. **Performance**: Monitor and optimize performance regularly
7. **Planning**: Plan for container updates and migrations