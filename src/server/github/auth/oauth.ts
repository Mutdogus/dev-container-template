import type { GitHubAuthentication, OAuthTokenResponse } from '../../../types/github-auth.js';
import { logger } from '../../../utils/logger.js';
import { errorHandler, ErrorCode } from '../../../utils/errors.js';

export interface OAuthUserInfo {
  login: string;
  id: number;
  name: string | null;
  email: string | null;
  avatar_url: string;
  type: string;
}

export class GitHubOAuthAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string = 'http://localhost:3000/callback',
    scopes: string[] = ['repo', 'issues:write']
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
  }

  public getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      ...(state && { state }),
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;

    logger.info('Generated GitHub OAuth authorization URL', {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scopes: this.scopes,
    });

    return url;
  }

  // @ts-nostrict
  public async exchangeCodeForToken(code: string, state?: string): Promise<OAuthTokenResponse> {
    logger.info('Exchanging OAuth code for access token', { code: code.substring(0, 10) + '...' });

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
          ...(state && { state }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw errorHandler.createError(
          ErrorCode.AUTH_FAILED,
          `OAuth token exchange failed: ${response.status} ${errorText}`,
          { status: response.status, errorText }
        );
      }

      const data = (await response.json()) as OAuthTokenResponse;

      if (data.error) {
        throw errorHandler.createError(
          ErrorCode.AUTH_FAILED,
          `OAuth error: ${data.error_description || data.error}`,
          { error: data.error, errorDescription: data.error_description }
        );
      }

      logger.info('Successfully exchanged OAuth code for access token', {
        tokenType: data.token_type,
        scope: data.scope,
        expiresIn: data.expires_in,
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw errorHandler.handleError(error as Error, { operation: 'exchangeCodeForToken' });
    }
  }

  public async getUserInfo(token: string): Promise<OAuthUserInfo> {
    logger.info('Fetching user info with OAuth token');

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw errorHandler.createError(
          ErrorCode.AUTH_FAILED,
          `Failed to fetch user info: ${response.status} ${errorText}`,
          { status: response.status, errorText }
        );
      }

      const data = (await response.json()) as OAuthUserInfo;

      logger.info('Successfully fetched user info', {
        login: data.login,
        name: data.name,
        type: data.type,
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw errorHandler.handleError(error as Error, { operation: 'getUserInfo' });
    }
  }

  public async validateToken(token: string): Promise<boolean> {
    try {
      await this.getUserInfo(token);
      return true;
    } catch (error) {
      logger.warn('Token validation failed', { error: (error as Error).message });
      return false;
    }
  }

  public createAuthentication(token: string, expiresAt?: Date): GitHubAuthentication {
    return {
      type: 'oauth',
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      token,
      scopes: this.scopes,
      expiresAt: expiresAt || this.calculateExpiryDate(),
      permissions: [],
    };
  }

  private calculateExpiryDate(): Date {
    // GitHub OAuth tokens typically don't expire, but we'll set a reasonable default
    const now = new Date();
    // Set expiration to 1 year from now as a safety measure
    now.setFullYear(now.getFullYear() + 1);
    return now;
  }

  public getScopes(): string[] {
    return [...this.scopes];
  }

  public getClientId(): string {
    return this.clientId;
  }

  public getRedirectUri(): string {
    return this.redirectUri;
  }

  public static validateEnvironmentVariables(): {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId) {
      errors.push('GITHUB_CLIENT_ID environment variable is required');
    }

    if (!clientSecret) {
      errors.push('GITHUB_CLIENT_SECRET environment variable is required');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: redirectUri || 'http://localhost:3000/callback',
      valid: errors.length === 0,
      errors,
    };
  }

  public static createFromEnvironment(): GitHubOAuthAuth {
    const env = GitHubOAuthAuth.validateEnvironmentVariables();

    if (!env.valid) {
      throw errorHandler.createError(
        ErrorCode.AUTH_MISSING_CREDENTIALS,
        'Missing required OAuth environment variables',
        { errors: env.errors }
      );
    }

    return new GitHubOAuthAuth(env.clientId!, env.clientSecret!, env.redirectUri);
  }
}
