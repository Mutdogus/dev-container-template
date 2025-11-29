import { logger } from '../../../utils/logger.js';
import { errorHandler, ErrorCode } from '../../../utils/errors.js';

export interface MCPHandler {
  name: string;
  description: string;
  handle: (request: any) => Promise<any>;
}

export class GitHubToolHandler {
  private handlers: Map<string, MCPHandler> = new Map();

  constructor() {
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    // Handler for GitHub authentication status
    this.registerHandler({
      name: 'github_auth_status',
      description: 'Check GitHub authentication status',
      handle: async () => {
        logger.info('Checking GitHub authentication status');

        try {
          // This would be implemented with actual GitHub client
          return {
            success: true,
            authenticated: true,
            authType: 'oauth', // or 'pat'
            scopes: ['repo', 'issues:write'],
            expiresAt: new Date().toISOString(),
          };
        } catch (error) {
          logger.error('Failed to check auth status', { error: (error as Error).message });
          return {
            success: false,
            authenticated: false,
            error: (error as Error).message,
          };
        }
      },
    });

    // Handler for server status
    this.registerHandler({
      name: 'server_status',
      description: 'Get MCP server status and information',
      handle: async () => {
        logger.info('Getting server status');

        try {
          return {
            success: true,
            status: {
              running: true,
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              version: '1.0.0',
              nodeVersion: process.version,
              platform: process.platform,
            },
          };
        } catch (error) {
          logger.error('Failed to get server status', { error: (error as Error).message });
          return {
            success: false,
            error: (error as Error).message,
          };
        }
      },
    });

    // Handler for configuration validation
    this.registerHandler({
      name: 'config_validate',
      description: 'Validate MCP server configuration',
      handle: async request => {
        logger.info('Validating configuration');

        try {
          const { config } = request.params || {};
          const validation = this.validateConfiguration(config);

          return {
            success: validation.valid,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
          };
        } catch (error) {
          logger.error('Failed to validate configuration', { error: (error as Error).message });
          return {
            success: false,
            valid: false,
            errors: [(error as Error).message],
          };
        }
      },
    });
  }

  private validateConfiguration(config: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config) {
      errors.push('Configuration is required');
      return { valid: false, errors, warnings };
    }

    // Validate authentication
    if (!config.auth) {
      errors.push('Authentication configuration is required');
    } else {
      const { type } = config.auth;

      if (!['oauth', 'pat', 'app'].includes(type)) {
        errors.push('Invalid authentication type. Must be oauth, pat, or app');
      }

      if (type === 'oauth') {
        if (!config.auth.clientId) {
          errors.push('OAuth client ID is required');
        }
        if (!config.auth.clientSecret) {
          errors.push('OAuth client secret is required');
        }
      } else if (type === 'pat') {
        if (!config.auth.token) {
          errors.push('Personal access token is required');
        }
      }
    }

    // Validate repository configuration
    if (config.defaultRepository && typeof config.defaultRepository !== 'string') {
      errors.push('Default repository must be a string in format "owner/repo"');
    }

    // Validate timeout
    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      errors.push('Timeout must be a positive number');
    }

    // Warnings
    if (config.auth?.type === 'pat') {
      warnings.push('Using Personal Access Token is less secure than OAuth');
    }

    if (!config.defaultRepository) {
      warnings.push('No default repository configured - will need to specify for each operation');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public registerHandler(handler: MCPHandler): void {
    logger.info('Registering MCP handler', { name: handler.name });
    this.handlers.set(handler.name, handler);
  }

  public unregisterHandler(name: string): void {
    logger.info('Unregistering MCP handler', { name });
    this.handlers.delete(name);
  }

  public getHandler(name: string): MCPHandler | undefined {
    return this.handlers.get(name);
  }

  public listHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  public async handleRequest(request: any): Promise<any> {
    const { method } = request;

    if (!method) {
      throw errorHandler.createError(ErrorCode.TASK_VALIDATION, 'Request method is required');
    }

    const handler = this.getHandler(method);

    if (!handler) {
      throw errorHandler.createError(
        ErrorCode.TASK_VALIDATION,
        `Unknown handler method: ${method}`
      );
    }

    logger.info('Handling MCP request', { method, handler: handler.name });

    try {
      return await handler.handle(request);
    } catch (error) {
      logger.error('Handler execution failed', {
        method,
        handler: handler.name,
        error: (error as Error).message,
      });

      throw errorHandler.handleError(error as Error, {
        method,
        handler: handler.name,
      });
    }
  }

  public getHandlerInfo(): Array<{ name: string; description: string }> {
    return Array.from(this.handlers.values()).map(handler => ({
      name: handler.name,
      description: handler.description,
    }));
  }
}
