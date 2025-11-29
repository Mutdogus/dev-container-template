# Container Setup Instructions

## Overview

This project includes a fully configured development container that provides a complete development environment with OpenCode CLI, Python, Node.js, and essential development tools.

## Prerequisites

- Docker Desktop installed and running
- VS Code with Remote - Containers extension
- Sufficient system resources (8GB RAM recommended)

## Quick Start

1. **Open in VS Code**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd <repository-name>
   
   # Open in VS Code
   code .
   ```

2. **Reopen in Container**
   - When VS Code prompts, click "Reopen in Container"
   - Or use Command Palette: `Remote-Containers: Reopen in Container`

3. **Wait for Setup**
   - Container will build automatically (first time takes ~2-3 minutes)
   - All tools will be installed and configured
   - VS Code extensions will be installed

## What's Included

### Development Tools
- **OpenCode CLI** (v1.0.119) - AI-powered development assistant
- **Python 3.11** with development tools (black, flake8, pytest, mypy)
- **Node.js 18.x LTS** with npm
- **Git** with version control
- **uv** - Fast Python package manager

### VS Code Extensions
- GitHub Copilot
- OpenCode VS Code
- Python extension pack
- Black formatter
- Flake8 linter
- Pylint

### User Environment
- Non-root user `vscode` with sudo access
- Proper PATH configuration
- Home directory with development workspace

## Container Configuration

### Build Features
- **Layer Optimization**: System dependencies cached separately from application tools
- **Fallback Installation**: OpenCode CLI installs with primary installer + binary fallback
- **Error Handling**: Comprehensive logging and graceful failure recovery
- **Security**: Non-root user with minimal privileges

### Port Forwarding
- **3000**: Development server (notify on forward)
- **8000**: Application server (notify on forward)  
- **5432**: Database (silent forward)

## Development Workflow

1. **Start Development**: Container is ready after build completes
2. **Use OpenCode**: Run `opencode` commands in terminal
3. **Python Development**: Use `uv` for package management
4. **VS Code Integration**: All extensions and tools pre-configured

## Troubleshooting

See [troubleshooting guide](docs/troubleshooting.md) for common issues and solutions.

## Performance Tips

See [performance optimization guide](docs/performance-tips.md) for best practices.

## Maintenance

See [container maintenance guide](docs/maintenance.md) for ongoing care.