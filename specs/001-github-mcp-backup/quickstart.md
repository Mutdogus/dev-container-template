# Quickstart Guide: GitHub MCP Server Integration

## Overview

This guide helps you set up the GitHub MCP server to enable full speckit-driven development workflow, including converting tasks to GitHub issues.

## Prerequisites

- Node.js 18+ and npm installed
- GitHub account with appropriate repository permissions
- Speckit development environment already configured

## Installation

### 1. Install MCP Server Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd dev-container-template

# Install dependencies
npm install

# Build the MCP server
npm run build
```

### 2. Configure GitHub Authentication

#### Option A: GitHub OAuth App (Recommended for Production)

1. **Create GitHub OAuth App**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Set Application name: "Speckit GitHub MCP"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/callback`
   - Set permissions: `repo`, `issues:write`

2. **Configure Environment Variables**:
```bash
# Create .env file
cat > .env << EOF
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret
NODE_ENV=production
EOF
```

#### Option B: Personal Access Token (Quick Start)

1. **Generate GitHub PAT**:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Click "Generate new token"
   - Set scopes: `repo`, `issues:write`
   - Copy the generated token

2. **Configure Environment Variables**:
```bash
# Create .env file
cat > .env << EOF
GITHUB_PERSONAL_ACCESS_TOKEN=your_pat_here
NODE_ENV=development
EOF
```

### 3. Configure MCP Server

Create `mcp-config.json` in your project root:

```json
{
  "mcpServers": {
    "github-speckit": {
      "command": "node",
      "args": ["./dist/server.js"],
      "env": {
        "GITHUB_CLIENT_ID": "${GITHUB_CLIENT_ID}",
        "GITHUB_CLIENT_SECRET": "${GITHUB_CLIENT_SECRET}",
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}",
        "NODE_ENV": "${NODE_ENV}"
      },
      "timeout": 30000
    }
  }
}
```

## Usage

### 1. Start MCP Server

```bash
# Start the server
npm start

# Or run in development mode
npm run dev
```

### 2. Test MCP Integration

```bash
# Test MCP server connection
node scripts/test-mcp.js

# Verify GitHub authentication
node scripts/test-auth.js
```

### 3. Use with Speckit

Once the MCP server is running, you can use all speckit commands:

```bash
# Convert tasks to GitHub issues
/speckit.taskstoissues

# Full speckit workflow
/speckit.specify
/speckit.plan
/speckit.tasks
/speckit.taskstoissues  # Now works!
```

## Configuration Options

### Environment Variables

| Variable | Required | Description | Example |
|-----------|-----------|-------------|---------|
| `GITHUB_CLIENT_ID` | OAuth only | GitHub OAuth App client ID | `ghp_1234567890abcdef` |
| `GITHUB_CLIENT_SECRET` | OAuth only | GitHub OAuth App client secret | `ghp_1234567890abcdef1234567890abcdef` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | PAT only | GitHub personal access token | `ghp_1234567890abcdef1234567890abcdef` |
| `NODE_ENV` | No | Environment mode | `production` or `development` |
| `GITHUB_DEFAULT_REPO` | No | Default repository for operations | `username/repo-name` |

### Server Configuration

| Option | Default | Description |
|---------|---------|-------------|
| `timeout` | 30000 | Request timeout in milliseconds |
| `maxRetries` | 3 | Maximum retry attempts for failed requests |
| `rateLimitBuffer` | 100 | Buffer for GitHub API rate limits |

## Troubleshooting

### Common Issues

#### Authentication Failures

**Error**: "Invalid credentials" or "Bad credentials"
**Solution**:
1. Verify environment variables are set correctly
2. Check GitHub token has required scopes (`repo`, `issues:write`)
3. For OAuth: Ensure callback URL matches GitHub App configuration

#### Rate Limiting

**Error**: "API rate limit exceeded"
**Solution**:
1. Wait for rate limit reset (check `X-RateLimit-Reset` header)
2. Use authenticated requests (higher limits)
3. Implement batching for multiple operations

#### Repository Permissions

**Error**: "Not Found" or "Access denied"
**Solution**:
1. Verify repository exists and is accessible
2. Check user has required permissions
3. For private repos: Ensure repository access granted

#### MCP Server Connection

**Error**: "MCP server not responding"
**Solution**:
1. Check server is running: `npm start`
2. Verify port is not blocked by firewall
3. Test with MCP client: `mcp list-tools`

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export DEBUG=mcp:*

# Run server with debug output
npm run dev
```

## Advanced Configuration

### Custom Repository Mapping

Configure multiple repositories:

```json
{
  "mcpServers": {
    "github-speckit": {
      "command": "node",
      "args": ["./dist/server.js"],
      "env": {
        "GITHUB_REPOSITORIES": "user/repo1,user/repo2,org/repo3"
      }
    }
  }
}
```

### Custom Issue Templates

Define custom issue templates:

```json
{
  "issueTemplates": {
    "feature": {
      "title": "Feature: {{taskId}} - {{title}}",
      "labels": ["enhancement", "speckit"],
      "body": "## Speckit Task\n\n**Task ID**: {{taskId}}\n\n**Description**:\n{{description}}\n\n**User Story**: {{story}}\n\n**Priority**: {{priority}}"
    },
    "bug": {
      "title": "Bug: {{taskId}} - {{title}}",
      "labels": ["bug", "speckit"],
      "body": "## Bug Report\n\n**Task ID**: {{taskId}}\n\n**Description**:\n{{description}}\n\n**Steps to Reproduce**:\n{{steps}}"
    }
  }
}
```

## Security Considerations

### Token Security

- Never commit tokens to version control
- Use environment variables or secure credential storage
- Rotate tokens regularly (especially for production)
- Use minimum required scopes

### Network Security

- Use HTTPS for all GitHub API calls
- Validate SSL certificates in production
- Consider VPN or proxy requirements for enterprise

### Access Control

- Limit repository access to required repositories only
- Use GitHub Apps instead of PATs for team scenarios
- Implement proper scope validation

## Performance Optimization

### Caching

Enable response caching:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 1000
  }
}
```

### Batch Operations

Configure batch processing:

```json
{
  "batching": {
    "enabled": true,
    "batchSize": 10,
    "delay": 1000
  }
}
```

## Monitoring

### Health Checks

Monitor server health:

```bash
# Check server status
curl http://localhost:3000/health

# Check GitHub API limits
curl http://localhost:3000/github/rate-limit
```

### Metrics

Track key metrics:

- Task conversion success rate
- GitHub API response times
- Authentication success/failure rates
- Error rates by category

## Integration with Existing Tools

### VS Code Integration

Add to VS Code settings:

```json
{
  "mcp.servers": {
    "github-speckit": {
      "command": "node",
      "args": ["./path/to/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### CI/CD Integration

GitHub Actions example:

```yaml
name: Sync Speckit Tasks
on:
  push:
    paths: ['specs/**/tasks.md']

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install MCP Server
        run: npm install
      - name: Sync Tasks to Issues
        run: npm run sync-tasks
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Support

### Getting Help

- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### License

MIT License - see LICENSE file for details.