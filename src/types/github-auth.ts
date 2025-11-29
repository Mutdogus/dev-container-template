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