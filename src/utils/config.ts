import { config } from 'dotenv';
import { z } from 'zod';
import type { MCPServerConfiguration } from '../types/mcp-config.js';
import type { GitHubAuthentication } from '../types/github-auth.js';
import { logger } from './logger.js';

// Load environment variables
config();

const AuthTypeSchema = z.enum(['oauth', 'pat', 'app']);

const ConfigSchema = z.object({
  // Authentication
  GITHUB_AUTH_TYPE: AuthTypeSchema.default('oauth'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_PERSONAL_ACCESS_TOKEN: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_APP_INSTALLATION_ID: z.string().optional(),

  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GITHUB_DEFAULT_REPO: z.string().optional(),
  SERVER_TIMEOUT: z.string().transform(Number).default('30000'),
  SERVER_PORT: z.string().transform(Number).default('3000'),

  // Rate Limiting
  GITHUB_RATE_LIMIT_BUFFER: z.string().transform(Number).default('100'),
  GITHUB_MAX_RETRIES: z.string().transform(Number).default('3'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DEBUG: z.string().optional(),

  // Cache Configuration
  CACHE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CACHE_TTL: z.string().transform(Number).default('300'),
  CACHE_MAX_SIZE: z.string().transform(Number).default('1000'),

  // Batch Processing
  BATCH_ENABLED: z.string().transform(val => val === 'true').default('true'),
  BATCH_SIZE: z.string().transform(Number).default('10'),
  BATCH_DELAY: z.string().transform(Number).default('1000'),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SESSION_SECRET: z.string().optional(),

  // Monitoring
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  METRICS_ENABLED: z.string().transform(val => val === 'true').default('true'),
});

export type ServerConfig = z.infer<typeof ConfigSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private config: ServerConfig;

  private constructor() {
    try {
      this.config = ConfigSchema.parse(process.env);
      logger.info('Configuration loaded successfully', {
        authType: this.config.GITHUB_AUTH_TYPE,
        nodeEnv: this.config.NODE_ENV,
      });
    } catch (error) {
      logger.error('Failed to load configuration', {}, error as Error);
      throw error;
    }
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): ServerConfig {
    return this.config;
  }

  public getGitHubAuth(): GitHubAuthentication {
    const { GITHUB_AUTH_TYPE, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_PERSONAL_ACCESS_TOKEN } = this.config;

    const auth: GitHubAuthentication = {
      type: GITHUB_AUTH_TYPE,
      scopes: ['repo', 'issues:write'],
      permissions: [],
    };

    switch (GITHUB_AUTH_TYPE) {
      case 'oauth':
        if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
          throw new Error('OAuth authentication requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
        }
        auth.clientId = GITHUB_CLIENT_ID;
        auth.clientSecret = GITHUB_CLIENT_SECRET;
        break;

      case 'pat':
        if (!GITHUB_PERSONAL_ACCESS_TOKEN) {
          throw new Error('PAT authentication requires GITHUB_PERSONAL_ACCESS_TOKEN');
        }
        auth.token = GITHUB_PERSONAL_ACCESS_TOKEN;
        break;

      case 'app':
        if (!this.config.GITHUB_APP_ID || !this.config.GITHUB_APP_PRIVATE_KEY) {
          throw new Error('GitHub App authentication requires GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY');
        }
        // GitHub App authentication is handled at the client level
        break;

      default:
        throw new Error(`Unsupported authentication type: ${GITHUB_AUTH_TYPE}`);
    }

    return auth;
  }

  public getMCPServerConfig(): MCPServerConfiguration {
    return {
      serverName: 'github-speckit',
      command: 'node',
      args: ['./dist/server.js'],
      env: {
        GITHUB_AUTH_TYPE: this.config.GITHUB_AUTH_TYPE,
        GITHUB_CLIENT_ID: this.config.GITHUB_CLIENT_ID ?? '',
        GITHUB_CLIENT_SECRET: this.config.GITHUB_CLIENT_SECRET ?? '',
        GITHUB_PERSONAL_ACCESS_TOKEN: this.config.GITHUB_PERSONAL_ACCESS_TOKEN ?? '',
        NODE_ENV: this.config.NODE_ENV,
        GITHUB_DEFAULT_REPO: this.config.GITHUB_DEFAULT_REPO ?? '',
        SERVER_TIMEOUT: this.config.SERVER_TIMEOUT.toString(),
        SERVER_PORT: this.config.SERVER_PORT.toString(),
      },
      timeout: this.config.SERVER_TIMEOUT,
      enabled: true,
    };
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  public validate(): boolean {
    try {
      const auth = this.getGitHubAuth();
      logger.info('Configuration validation passed', {
        authType: auth.type,
        hasClientId: !!auth.clientId,
        hasToken: !!auth.token,
      });
      return true;
    } catch (error) {
      logger.error('Configuration validation failed', {}, error as Error);
      return false;
    }
  }
}

export const configManager = ConfigManager.getInstance();