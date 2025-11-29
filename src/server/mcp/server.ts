import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { MCPTool } from '../../types/mcp-tool.js';
import type { MCPServerConfiguration } from '../../types/mcp-config.js';
import type { GitHubAuthentication } from '../../types/github-auth.js';
import { GitHubClient } from '../github/client.js';
import { GitHubOAuthAuth } from '../github/auth/oauth.js';
import {
  createGitHubIssueCreationTool,
  createGitHubIssueUpdateTool,
  createGitHubIssueGetTool,
  createGitHubIssueListTool,
} from './tools/github-tools.js';

import { logger } from '../../utils/logger.js';
import { errorHandler, ErrorCode } from '../../utils/errors.js';

export class MCPServer {
  private server: Server;
  private tools: Map<string, MCPTool> = new Map();

  private githubClient?: GitHubClient;
  private isRunning: boolean = false;
  private config?: MCPServerConfiguration;

  constructor(name: string, version: string = '1.0.0') {
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupErrorHandling();
    this.setupToolHandlers();
  }

  private setupErrorHandling(): void {
    this.server.onerror = error => {
      logger.error('MCP Server error', { error: error.message }, error);
    };

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.schema,
      }));

      return { tools };
    });

    // Execute a tool
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      if (!this.tools.has(name)) {
        return {
          content: [
            {
              type: 'text',
              text: `Tool '${name}' not found`,
            },
          ],
          isError: true,
        };
      }

      const tool = this.tools.get(name)!;

      try {
        const result = await errorHandler.withErrorHandling(() => tool.handler(args), {
          toolName: name,
          args,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const mcpError = error as any;
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool '${name}': ${mcpError.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  public async configure(config: MCPServerConfiguration): Promise<void> {
    logger.info('Configuring MCP server', { serverName: config.serverName });

    try {
      this.config = config;

      // Initialize GitHub client
      if (config.auth) {
        await this.initializeGitHubClient(config.auth);
      }

      // Register GitHub tools
      this.registerGitHubTools();

      logger.info('MCP server configured successfully', {
        serverName: config.serverName,
        toolCount: this.tools.size,
        authType: config.auth?.type || 'none',
      });
    } catch (error) {
      logger.error('Failed to configure MCP server', { config: config.serverName }, error as Error);
      throw error;
    }
  }

  private async initializeGitHubClient(auth: GitHubAuthentication): Promise<void> {
    try {
      if (auth.type === 'oauth' && (!auth.token || !auth.clientId)) {
        // Initialize OAuth flow if needed
        // const oauthAuth = new GitHubOAuthAuth(auth.clientId!, auth.clientSecret!);

        // For now, we'll assume token is provided or use environment variables
        if (!auth.token) {
          logger.warn('OAuth token not provided, using environment variables');
          const envAuth = GitHubOAuthAuth.validateEnvironmentVariables();
          if (!envAuth.valid) {
            throw errorHandler.createError(
              ErrorCode.AUTH_MISSING_CREDENTIALS,
              'OAuth credentials not found in configuration or environment'
            );
          }
        }
      }

      this.githubClient = new GitHubClient(auth);
      await this.githubClient.initialize();

      logger.info('GitHub client initialized', { authType: auth.type });
    } catch (error) {
      logger.error('Failed to initialize GitHub client', { authType: auth.type }, error as Error);
      throw error;
    }
  }

  private registerGitHubTools(): void {
    if (!this.githubClient) {
      throw errorHandler.createError(ErrorCode.SYSTEM_ERROR, 'GitHub client not initialized');
    }

    const tools = [
      createGitHubIssueCreationTool(this.githubClient),
      createGitHubIssueUpdateTool(this.githubClient),
      createGitHubIssueGetTool(this.githubClient),
      createGitHubIssueListTool(this.githubClient),
    ];

    tools.forEach(tool => this.registerTool(tool));

    logger.info('Registered GitHub tools', { toolCount: tools.length });
  }

  public registerTool(tool: MCPTool): void {
    logger.info('Registering MCP tool', { name: tool.name });
    this.tools.set(tool.name, tool);
  }

  public unregisterTool(name: string): void {
    logger.info('Unregistering MCP tool', { name });
    this.tools.delete(name);
  }

  public getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  public listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('MCP Server is already running');
      return;
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.isRunning = true;
      logger.info('MCP Server started successfully', {
        toolCount: this.tools.size,
        tools: this.listTools(),
      });
    } catch (error) {
      logger.error('Failed to start MCP Server', {}, error as Error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.server.close();
      this.isRunning = false;
      logger.info('MCP Server stopped');
    } catch (error) {
      logger.error('Error stopping MCP Server', {}, error as Error);
      throw error;
    }
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }

  public getServerInfo(): {
    name: string;
    version: string;
    toolCount: number;
    configured: boolean;
    authType?: string;
  } {
    return {
      name: (this.server as any).name || 'github-speckit',
      version: (this.server as any).version || '1.0.0',
      toolCount: this.tools.size,
      configured: !!this.config,
      authType: this.config?.auth?.type || 'none',
    };
  }

  public getGitHubClient(): GitHubClient | undefined {
    return this.githubClient;
  }

  public getConfiguration(): MCPServerConfiguration | undefined {
    return this.config;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.githubClient) {
      return {
        success: false,
        message: 'GitHub client not initialized',
      };
    }

    try {
      const rateLimits = await this.githubClient.getRateLimits();
      return {
        success: true,
        message: 'GitHub connection successful',
        details: {
          authType: this.githubClient.getAuthType(),
          scopes: this.githubClient.getScopes(),
          rateLimits: {
            remaining: rateLimits.remaining,
            limit: rateLimits.limit,
            used: rateLimits.used,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `GitHub connection failed: ${(error as Error).message}`,
      };
    }
  }
}
