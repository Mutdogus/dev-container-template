# Container Performance Optimization Tips

## Build Performance

### Layer Optimization
The container is already optimized for layer caching:

1. **System Dependencies** (Layer 1): Changes rarely - cached effectively
2. **Programming Runtimes** (Layer 2): Node.js - changes occasionally  
3. **Python Tools** (Layer 3): Development tools - changes infrequently
4. **User Configuration** (Layer 4): User setup - changes rarely
5. **Environment Variables** (Layer 5): Configuration - changes rarely
6. **User Tools** (Layer 6): OpenCode CLI - changes most frequently

### Build Time Optimization
```bash
# Monitor build time
time docker build -t dev-container .

# Use build cache effectively
docker build --no-cache -t dev-container .  # Only when needed

# Parallel builds (Docker BuildKit)
DOCKER_BUILDKIT=1 docker build -t dev-container .
```

### Resource Allocation
**Docker Desktop Settings**:
- **Memory**: 8GB+ recommended
- **CPUs**: 4+ cores recommended  
- **Disk**: 50GB+ available
- **Swap**: Enabled

## Runtime Performance

### Memory Management
```bash
# Monitor memory usage
docker stats

# Check container memory limits
docker inspect <container-id> | grep -i memory

# Optimize Python memory usage
export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1
```

### CPU Optimization
```bash
# Monitor CPU usage
docker stats --no-stream

# Set CPU limits (if needed)
docker run --cpus="2.0" dev-container

# Optimize Node.js performance
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Disk Performance
```bash
# Check disk usage
df -h
du -sh ~/.opencode

# Clean up unnecessary files
docker system prune -a
docker volume prune
```

## Development Tool Optimization

### Python Performance
```bash
# Use uv for faster package management
uv pip install -r requirements.txt

# Optimize Python imports
python -c "import sys; print(sys.path)"

# Use compiled Python files
python -O main.py  # Optimized bytecode
```

### Node.js Performance
```bash
# Use npm ci for faster installs
npm ci

# Enable npm cache
npm config set cache ~/.npm-cache

# Use yarn for faster operations (optional)
yarn install
```

### OpenCode CLI Optimization
```bash
# Check OpenCode performance
time opencode --version

# Use OpenCode efficiently
opencode "quick question"  # Faster than long prompts
```

## VS Code Performance

### Extension Management
```json
// .vscode/settings.json
{
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": false,  // Disable if not needed
    "python.linting.flake8Enabled": true,
    "files.watcherExclude": {
        "**/.git/objects/**": true,
        "**/.git/subtree-cache/**": true,
        "**/node_modules/**": true,
        "**/__pycache__/**": true
    }
}
```

### Terminal Performance
```bash
# Use faster shell
echo 'set -g default-shell /bin/bash' >> ~/.tmux.conf

# Optimize bash prompt
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
```

## Network Optimization

### Port Forwarding
```json
// .devcontainer/devcontainer.json
{
    "portsAttributes": {
        "3000": {
            "label": "Development Server",
            "onAutoForward": "notify"
        }
    }
}
```

### DNS Optimization
```bash
# Use faster DNS
echo "nameserver 8.8.8.8" > /etc/resolv.conf

# Check DNS resolution time
nslookup google.com
```

## File System Optimization

### Workspace Organization
```
/workspaces/
├── src/           # Source code (faster access)
├── build/         # Build outputs (exclude from search)
├── node_modules/  # Dependencies (exclude from search)
├── .git/         # Version control (exclude from search)
└── dist/          # Distribution (exclude from search)
```

### Search Optimization
```json
// .vscode/settings.json
{
    "search.exclude": {
        "**/node_modules": true,
        "**/build": true,
        "**/dist": true,
        "**/.git": true,
        "**/__pycache__": true
    },
    "files.exclude": {
        "**/__pycache__": true,
        "**/.pytest_cache": true
    }
}
```

## Monitoring and Profiling

### Performance Monitoring
```bash
# Container resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# System performance
htop
iotop
nethogs
```

### Python Profiling
```bash
# Profile Python code
python -m cProfile -o profile.stats main.py
python -c "import pstats; p = pstats.Stats('profile.stats'); p.sort_stats('cumulative'); p.print_stats(10)"

# Memory profiling
pip install memory-profiler
python -m memory_profiler main.py
```

### Node.js Profiling
```bash
# Node.js performance
node --prof main.js
node --prof-process isolate-*.log > processed.txt

# Memory usage
node --inspect main.js
# Then use Chrome DevTools
```

## Caching Strategies

### Docker Caching
```bash
# Build with cache
docker build -t dev-container .

# Force rebuild (when needed)
docker build --no-cache -t dev-container .

# Use .dockerignore to exclude unnecessary files
echo "node_modules/" >> .dockerignore
echo "*.log" >> .dockerignore
```

### Package Caching
```bash
# Python package cache
export PIP_CACHE_DIR=~/.cache/pip

# Node.js cache
export npm_config_cache=~/.npm-cache

# Git cache
git config --global credential.helper cache
```

## Optimization Checklist

### Daily Optimization
- [ ] Monitor container resource usage
- [ ] Clean up unnecessary files
- [ ] Check for performance bottlenecks
- [ ] Optimize VS Code settings

### Weekly Optimization  
- [ ] Update dependencies
- [ ] Clean Docker images and volumes
- [ ] Review and optimize build times
- [ ] Check disk space usage

### Monthly Optimization
- [ ] Review and update Docker configuration
- [ ] Optimize development workflow
- [ ] Update VS Code extensions
- [ ] Performance audit and improvements

## Troubleshooting Performance Issues

### Slow Build Times
1. **Check Docker Resources**: Insufficient memory/CPU allocation
2. **Network Issues**: Slow package downloads
3. **Disk Space**: Low disk space affecting performance
4. **Cache Issues**: Docker cache corruption

### Slow Runtime Performance
1. **Resource Limits**: Container resource constraints
2. **Tool Performance**: Inefficient tool configuration
3. **File I/O**: Slow disk operations
4. **Memory Leaks**: Applications consuming excessive memory

### VS Code Slowness
1. **Extension Overhead**: Too many extensions
2. **Large Workspaces**: Too many files to index
3. **Search Performance**: Inefficient search configuration
4. **Terminal Performance**: Slow terminal operations

## Advanced Optimization

### Custom Docker Configuration
```dockerfile
# Multi-stage builds for smaller images
FROM python:3.11-slim as builder
# ... build steps ...

FROM python:3.11-slim as runtime
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
```

### Performance Testing
```bash
# Benchmark container startup
time docker run --rm dev-container echo "ready"

# Benchmark tool performance
time opencode --version
time python --version
time node --version
```

### Monitoring Setup
```bash
# Install monitoring tools
pip install psutil
npm install -g clinic

# Create performance monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "$(date): $(docker stats --no-stream --format 'table {{.CPUPerc}}\t{{.MemUsage}}')"
    sleep 60
done
EOF
```