# Container Usage Best Practices

## Development Workflow

### Daily Development
1. **Start Container**: Open project in VS Code, let container build/connect
2. **Check Environment**: Verify tools are working (`opencode --version`)
3. **Development Work**: Use container as your primary development environment
4. **Commit Changes**: Use git within container for version control
5. **Shutdown**: Close VS Code to stop container

### Code Organization
```
/workspaces/                    # Main workspace
├── src/                       # Source code
├── tests/                     # Test files
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── .vscode/                   # VS Code settings
```

## Tool Usage

### OpenCode CLI
```bash
# Get help
opencode --help

# Check version
opencode --version

# Use in development
opencode "explain this code"
opencode "write tests for this function"
opencode "optimize this algorithm"
```

### Python Development
```bash
# Use uv for package management
uv init my-project
uv add requests
uv run python main.py

# Virtual environments
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Code formatting and linting
black src/
flake8 src/
mypy src/
pytest tests/
```

### Node.js Development
```bash
# Initialize project
npm init -y

# Install dependencies
npm install express
npm install --save-dev jest

# Run scripts
npm start
npm test
npm run build
```

### Git Workflow
```bash
# Configure git (done automatically)
git config --list

# Daily workflow
git add .
git commit -m "feat: add new feature"
git push origin main

# Branch management
git checkout -b feature/new-feature
git merge feature/new-feature
```

## VS Code Integration

### Recommended Extensions
All extensions are pre-installed and configured:

- **GitHub Copilot**: AI pair programming
- **OpenCode VS Code**: Direct OpenCode integration
- **Python Extension**: IntelliSense, debugging, testing
- **Black Formatter**: Automatic code formatting
- **Flake8**: Python linting
- **Pylint**: Advanced Python analysis

### Keyboard Shortcuts
- `Ctrl+Shift+P`: Open Command Palette
- `Ctrl+``: Open integrated terminal
- `F5`: Start debugging
- `Ctrl+Shift+B`: Run build task

### Debugging Configuration
Python debugging is pre-configured:
```json
{
    "name": "Python: Current File",
    "type": "python",
    "request": "launch",
    "program": "${file}",
    "console": "integratedTerminal"
}
```

## Performance Best Practices

### Container Optimization
1. **Layer Caching**: Docker caches layers, subsequent builds are faster
2. **Resource Allocation**: Allocate sufficient memory/CPU in Docker Desktop
3. **Minimal Extensions**: Only install necessary VS Code extensions
4. **Clean Workspace**: Regular cleanup of unnecessary files

### Development Practices
1. **Small Commits**: Commit frequently with clear messages
2. **Test Early**: Run tests as you develop
3. **Code Quality**: Use formatters and linters consistently
4. **Documentation**: Document code as you write it

## Security Practices

### Container Security
1. **Non-root User**: All operations run as `vscode` user
2. **Minimal Privileges**: Only use sudo when necessary
3. **Secrets Management**: Never commit secrets to repository
4. **Regular Updates**: Keep dependencies updated

### Development Security
1. **Dependency Scanning**: Regularly scan for vulnerabilities
2. **Code Review**: Review code changes before merging
3. **Access Control**: Limit access to sensitive resources
4. **Backup Strategy**: Regular backups of important work

## Collaboration

### Team Workflow
1. **Consistent Environment**: Everyone uses same container configuration
2. **Shared Configuration**: VS Code settings and extensions are shared
3. **Documentation**: Keep documentation updated
4. **Code Standards**: Follow agreed coding standards

### Onboarding New Developers
1. **Prerequisites**: Docker Desktop and VS Code with Remote Containers
2. **Quick Start**: Follow README instructions
3. **Training**: Provide container usage training
4. **Support**: Available troubleshooting documentation

## Maintenance

### Regular Tasks
1. **Update Dependencies**: Regularly update Python packages and Node modules
2. **Clean Container**: Periodically remove unused Docker images
3. **Backup Configuration**: Backup important configuration files
4. **Monitor Performance**: Keep an eye on container performance

### Health Checks
```bash
# Check container status
docker ps

# Check resource usage
docker stats

# Check disk space
df -h

# Check tool versions
opencode --version
python --version
node --version
```

## Troubleshooting

### Common Issues
1. **Slow Performance**: Check Docker resource allocation
2. **Tool Not Found**: Verify PATH and installation
3. **Permission Errors**: Ensure running as correct user
4. **Network Issues**: Check internet connectivity

### Recovery Steps
1. **Restart Container**: Often fixes temporary issues
2. **Rebuild Container**: For persistent problems
3. **Check Logs**: Review container and tool logs
4. **Seek Help**: Use troubleshooting guide or support

## Advanced Usage

### Customization
1. **Modify Dockerfile**: Add additional tools as needed
2. **Update devcontainer.json**: Customize VS Code settings
3. **Add Scripts**: Create utility scripts for common tasks
4. **Extend Configuration**: Add project-specific configurations

### Automation
1. **CI/CD Integration**: Use container in continuous integration
2. **Automated Testing**: Run tests in container environment
3. **Deployment**: Use container for deployment staging
4. **Monitoring**: Add monitoring and logging tools