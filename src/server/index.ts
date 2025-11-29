import { MCPServer } from './mcp/server.js';
import { GitHubClient } from './github/client.js';
import { IssueConverter } from './github/issues/converter.js';
import { configManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { createTool } from './mcp/tools/tool-factory.js';
import {
  IssueCreateSchema,
  TaskConvertSchema,
  AuthStatusSchema,
  RepositoryListSchema,
  IssueGetSchema,
  ConfigStatusSchema,
  ConfigSetSchema,
} from './mcp/tools/tool-factory.js';

class GitHubMCPServer {
  private mcpServer: MCPServer;
  private githubClient: GitHubClient;
  private issueConverter: IssueConverter;

  constructor() {
    this.mcpServer = new MCPServer('github-speckit', '1.0.0');
    
    const auth = configManager.getGitHubAuth();
    this.githubClient = new GitHubClient(auth);
    this.issueConverter = new IssueConverter(this.githubClient);
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing GitHub MCP Server...');

      // Validate configuration
      if (!configManager.validate()) {
        throw new Error('Configuration validation failed');
      }

      // Initialize GitHub client
      await this.githubClient.initialize();

      // Register MCP tools
      this.registerTools();

      logger.info('GitHub MCP Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize GitHub MCP Server', {}, error as Error);
      throw error;
    }
  }

  private registerTools(): void {
    // GitHub Authentication Status Tool
    this.mcpServer.registerTool(
      createTool(
        'github_auth_status',
        'Get GitHub authentication status and information',
        AuthStatusSchema,
        async () => {
          const rateLimits = await this.githubClient.getRateLimits();
          const authType = this.githubClient.getAuthType();
          const scopes = this.githubClient.getScopes();

          return {
            authenticated: true,
            authType,
            scopes,
            rateLimits,
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    // List Repositories Tool
    this.mcpServer.registerTool(
      createTool(
        'github_list_repositories',
        'List accessible GitHub repositories',
        RepositoryListSchema,
        async ({ type, sort, direction }) => {
          const repositories = await this.githubClient.getRepositories(type);
          
          return {
            repositories,
            totalCount: repositories.length,
            filters: { type, sort, direction },
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    // Create Issue Tool
    this.mcpServer.registerTool(
      createTool(
        'github_create_issue',
        'Create a GitHub issue from task data',
        IssueCreateSchema,
        async ({ repository, title, body, labels, assignees, priority, taskId }) => {
          const task = {
            id: taskId || 'manual',
            title,
            description: body,
            priority: priority || 'medium',
            story: 'manual',
            status: 'pending' as const,
            dependencies: [],
            metadata: { source: 'mcp_tool' },
          };

          const issue = await this.issueConverter.convertTaskToIssue(task, repository, {
            labels: labels || [],
            assignees: assignees || [],
            priority: priority || 'medium',
          });

          return {
            success: true,
            issue,
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    // Get Issue Tool
    this.mcpServer.registerTool(
      createTool(
        'github_get_issue',
        'Get details of a GitHub issue',
        IssueGetSchema,
        async ({ repository, issueId }) => {
          const issue = await this.issueConverter.getIssue(repository, issueId);
          
          return {
            success: true,
            issue,
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    // Convert Tasks Tool
    this.mcpServer.registerTool(
      createTool(
        'speckit_convert_tasks',
        'Convert speckit tasks to GitHub issues',
        TaskConvertSchema,
        async ({ tasks, repository, createMissing, updateExisting }) => {
          // For now, we'll simulate task conversion
          // In a real implementation, this would read from the actual speckit tasks
          const mockTasks = tasks.map(taskId => ({
            id: taskId,
            title: `Task ${taskId}`,
            description: `Description for task ${taskId}`,
            priority: 'medium' as const,
            story: 'US1',
            status: 'pending' as const,
            dependencies: [],
            metadata: { source: 'speckit' },
          }));

          const results = await this.issueConverter.convertMultipleTasks(
            mockTasks,
            repository || configManager.getConfig().GITHUB_DEFAULT_REPO || 'owner/repo',
            {
              createMissing,
              updateExisting,
            },
          );

          const successCount = results.filter(r => r.issue).length;
          const errorCount = results.filter(r => r.error).length;

          return {
            success: errorCount === 0,
            results,
            summary: {
              total: results.length,
              created: successCount,
              errors: errorCount,
            },
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    // Configuration Status Tool
    this.mcpServer.registerTool(
      createTool(
        'config_status',
        'Get MCP server configuration status',
        ConfigStatusSchema,
        async () => {
          const config = configManager.getConfig();
          const mcpConfig = configManager.getMCPServerConfig();

          return {
            configured: true,
            authType: config.GITHUB_AUTH_TYPE,
            defaultRepo: config.GITHUB_DEFAULT_REPO,
            serverName: mcpConfig.serverName,
            timeout: mcpConfig.timeout,
            environment: config.NODE_ENV,
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    // Configuration Set Tool
    this.mcpServer.registerTool(
      createTool(
        'config_set',
        'Update MCP server configuration',
        ConfigSetSchema,
        async ({ authType, clientId, clientSecret, token, repository, timeout }) => {
          // Note: In a real implementation, this would update the configuration
          // For now, we'll just return the proposed configuration
          
          return {
            success: true,
            message: 'Configuration updated (simulated)',
            proposedConfig: {
              authType,
              hasClientId: !!clientId,
              hasClientSecret: !!clientSecret,
              hasToken: !!token,
              repository,
              timeout,
            },
            timestamp: new Date().toISOString(),
          };
        },
      ),
    );

    logger.info('Registered MCP tools', {
      toolCount: this.mcpServer.listTools().length,
      tools: this.mcpServer.listTools(),
    });
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();
      await this.mcpServer.start();
      
      logger.info('GitHub MCP Server started successfully', {
        serverInfo: this.mcpServer.getServerInfo(),
      });
    } catch (error) {
      logger.error('Failed to start GitHub MCP Server', {}, error as Error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.mcpServer.stop();
      logger.info('GitHub MCP Server stopped');
    } catch (error) {
      logger.error('Error stopping GitHub MCP Server', {}, error as Error);
      throw error;
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const server = new GitHubMCPServer();

  try {
    await server.start();
  } catch (error) {
    logger.error('GitHub MCP Server failed to start', {}, error as Error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
}

export { GitHubMCPServer };