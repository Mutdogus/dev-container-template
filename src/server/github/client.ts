import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { retry } from '@octokit/plugin-retry';
import type { GitHubAuthentication } from '../../types/github-auth.js';
import type { GitHubRepository, APILimits } from '../../types/github-issue.js';
import { logger } from '../../utils/logger.js';
import { errorHandler, ErrorCode } from '../../utils/errors.js';

const OctokitWithPlugins = Octokit.plugin(throttling, retry);

export class GitHubClient {
  private client: any = null;
  private auth: GitHubAuthentication;

  constructor(auth: GitHubAuthentication) {
    this.auth = auth;
  }

  public async initialize(): Promise<void> {
    try {
      const authOptions = this.buildAuthOptions();
      
      this.client = new OctokitWithPlugins({
        auth: authOptions,
        throttle: {
          enabled: true,
          onRateLimit: (retryAfter: number, options: any) => {
            logger.warn('GitHub rate limit exceeded', {
              retryAfter,
              method: options.method,
              url: options.url,
              request: options.request,
            });

            if (options.request?.retryCount <= 3) {
              logger.info('Retrying GitHub request', { retryCount: options.request.retryCount });
              return true;
            }
            return false;
          },
        },
        retry: {
          doNotRetry: ['422'], // Don't retry validation errors
        },
      });

      // Test authentication
      await this.testAuthentication();
      
      logger.info('GitHub client initialized successfully', {
        authType: this.auth.type,
        scopes: this.auth.scopes,
      });
    } catch (error) {
      logger.error('Failed to initialize GitHub client', {}, error as Error);
      throw error;
    }
  }

  private buildAuthOptions(): string | object {
    switch (this.auth.type) {
      case 'pat':
        if (!this.auth.token) {
          throw errorHandler.createError(
            ErrorCode.AUTH_MISSING_CREDENTIALS,
            'PAT authentication requires a token',
          );
        }
        return this.auth.token;

      case 'oauth':
        if (!this.auth.clientId || !this.auth.clientSecret) {
          throw errorHandler.createError(
            ErrorCode.AUTH_MISSING_CREDENTIALS,
            'OAuth authentication requires clientId and clientSecret',
          );
        }
        return {
          clientId: this.auth.clientId,
          clientSecret: this.auth.clientSecret,
        };

      case 'app':
        // GitHub App authentication would be handled here
        throw errorHandler.createError(
          ErrorCode.AUTH_MISSING_CREDENTIALS,
          'GitHub App authentication not yet implemented',
        );

      default:
        throw errorHandler.createError(
          ErrorCode.AUTH_MISSING_CREDENTIALS,
          `Unsupported authentication type: ${this.auth.type}`,
        );
    }
  }

  private async testAuthentication(): Promise<void> {
    if (!this.client) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const { data } = await this.client.rest.users.getAuthenticated();
      logger.info('GitHub authentication successful', {
        login: data.login,
        name: data.name,
        type: data.type,
      });
    } catch (error) {
      throw errorHandler.handleError(error as Error, { operation: 'testAuthentication' });
    }
  }

  public getClient(): any {
    if (!this.client) {
      throw errorHandler.createError(
        ErrorCode.SYSTEM_ERROR,
        'GitHub client not initialized. Call initialize() first.',
      );
    }
    return this.client;
  }

  public async getRateLimits(): Promise<APILimits> {
    const client = this.getClient();
    
    try {
      const { data } = await client.rest.rateLimit.get();
      const core = data.resources.core;

      return {
        limit: core.limit,
        remaining: core.remaining,
        used: core.limit - core.remaining,
        resetTime: new Date(core.reset * 1000),
      };
    } catch (error) {
      throw errorHandler.handleError(error as Error, { operation: 'getRateLimits' });
    }
  }

  public async getRepositories(type: 'all' | 'owner' | 'member' = 'all'): Promise<GitHubRepository[]> {
    const client = this.getClient();
    
    try {
      const { data } = await client.rest.repos.listForAuthenticatedUser({
        type,
        sort: 'updated',
        direction: 'desc',
      });

      return data.map((repo: any) => ({
        owner: repo.owner.login,
        name: repo.name,
        isPrivate: repo.private,
        permissions: {
          pull: repo.permissions?.pull ?? false,
          push: repo.permissions?.push ?? false,
          admin: repo.permissions?.admin ?? false,
          issues: repo.permissions?.issues ?? false,
        },
        defaultBranch: repo.default_branch,
        apiLimits: {
          limit: 0,
          remaining: 0,
          used: 0,
          resetTime: new Date(),
        },
      }));
    } catch (error) {
      throw errorHandler.handleError(error as Error, { operation: 'getRepositories', type });
    }
  }

  public async getRepository(owner: string, name: string): Promise<GitHubRepository> {
    const client = this.getClient();
    
    try {
      const { data } = await client.rest.repos.get({
        owner,
        name,
      });

      return {
        owner: data.owner.login,
        name: data.name,
        isPrivate: data.private,
        permissions: {
          pull: (data as any).permissions?.pull ?? false,
          push: (data as any).permissions?.push ?? false,
          admin: (data as any).permissions?.admin ?? false,
          issues: (data as any).permissions?.issues ?? false,
        },
        defaultBranch: data.default_branch,
        apiLimits: {
          limit: 0,
          remaining: 0,
          used: 0,
          resetTime: new Date(),
        },
      };
    } catch (error) {
      throw errorHandler.handleError(error as Error, { operation: 'getRepository', owner, name });
    }
  }

  public getAuthType(): string {
    return this.auth.type;
  }

  public getScopes(): string[] {
    return this.auth.scopes;
  }

  public isInitialized(): boolean {
    return this.client !== null;
  }
}