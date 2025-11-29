export interface GitHubAuthentication {
  type: 'oauth' | 'pat' | 'app';
  clientId?: string;
  clientSecret?: string;
  token?: string;
  scopes: string[];
  expiresAt?: Date;
  permissions: GitHubPermission[];
}

export interface GitHubPermission {
  name: string;
  granted: boolean;
  level: 'read' | 'write' | 'admin';
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}
