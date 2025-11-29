# Data Model: GitHub MCP Server

## Core Entities

### MCPServerConfiguration
Represents the MCP server configuration and settings.

**Attributes**:
- `serverName`: string - Unique identifier for the MCP server
- `command`: string - Command to start the server
- `args`: string[] - Command line arguments
- `env`: Record<string, string> - Environment variables
- `timeout`: number - Request timeout in milliseconds
- `enabled`: boolean - Whether the server is active

### GitHubAuthentication
Represents GitHub authentication state and credentials.

**Attributes**:
- `type`: "oauth" | "pat" | "app" - Authentication method
- `clientId`: string - GitHub OAuth client ID (OAuth only)
- `clientSecret`: string - GitHub OAuth client secret (OAuth only)
- `token`: string - Personal access token (PAT only)
- `scopes`: string[] - Required GitHub API scopes
- `expiresAt`: Date - Token expiration time
- `permissions`: GitHubPermission[] - Granted permissions

### GitHubRepository
Represents a GitHub repository context.

**Attributes**:
- `owner`: string - Repository owner
- `name`: string - Repository name
- `isPrivate`: boolean - Repository visibility
- `permissions`: RepositoryPermission[] - User permissions
- `defaultBranch`: string - Default branch name
- `apiLimits`: APILimits - Current API rate limits

### SpeckitTask
Represents a speckit task to be converted to GitHub issue.

**Attributes**:
- `id`: string - Unique task identifier
- `title`: string - Task title
- `description`: string - Task description
- `priority`: "low" | "medium" | "high" - Task priority
- `story`: string - Associated user story
- `status`: "pending" | "in-progress" | "completed" - Task status
- `dependencies`: string[] - Dependent task IDs
- `metadata`: Record<string, any> - Additional task metadata

### GitHubIssue
Represents a GitHub issue created from a speckit task.

**Attributes**:
- `id`: number - GitHub issue number
- `url`: string - Issue URL
- `title`: string - Issue title
- `body`: string - Issue body content
- `state`: "open" | "closed" | "locked" - Issue state
- `labels`: string[] - Issue labels
- `assignees`: string[] - Assigned users
- `createdAt`: Date - Creation timestamp
- `updatedAt`: Date - Last update timestamp
- `taskId`: string - Associated speckit task ID

### MCPTool
Represents an MCP tool for GitHub operations.

**Attributes**:
- `name`: string - Tool name
- `description`: string - Tool description
- `schema`: JSONSchema - Input validation schema
- `handler`: Function - Tool implementation function
- `rateLimit`: RateLimit - Tool-specific rate limits

## Supporting Entities

### GitHubPermission
- `name`: string - Permission name
- `granted`: boolean - Whether permission is granted
- `level`: "read" | "write" | "admin" - Permission level

### RepositoryPermission
- `pull`: boolean - Can pull from repository
- `push`: boolean - Can push to repository
- `admin`: boolean - Has admin access
- `issues`: boolean - Can manage issues

### APILimits
- `remaining`: number - Remaining requests
- `resetTime`: Date - When limits reset
- `limit`: number - Total request limit
- `used`: number - Requests used

### RateLimit
- `requests`: number - Max requests per period
- `window`: number - Time window in seconds
- `current`: number - Current request count

### TaskIssueMapping
- `taskId`: string - Speckit task ID
- `issueId`: number - GitHub issue number
- `issueUrl`: string - GitHub issue URL
- `createdAt`: Date - Mapping creation timestamp
- `status`: "created" | "updated" | "synced" - Mapping status

## State Transitions

### Authentication Flow
```
unauthenticated → authenticating → authenticated
                    ↓
                 failed → retry → authenticated
```

### Task to Issue Conversion
```
speckit-task → processing → issue-created → synced
      ↓           ↓
    error     retry   → issue-updated
```

### MCP Server Lifecycle
```
stopped → starting → running → processing → stopping → stopped
           ↓         ↓
        error     error   → restarting
```

## Relationships

- MCPServerConfiguration 1:* GitHubAuthentication
- GitHubAuthentication 1 GitHubRepository
- SpeckitTask 1:* GitHubIssue (via TaskIssueMapping)
- GitHubRepository 1:* APILimits
- MCPTool 1 RateLimit
- GitHubIssue 1 GitHubRepository
- TaskIssueMapping 1 SpeckitTask, 1 GitHubIssue