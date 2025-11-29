export interface GitHubIssue {
  id: number;
  url: string;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'locked';
  labels: string[];
  assignees: string[];
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
}

export interface GitHubRepository {
  owner: string;
  name: string;
  isPrivate: boolean;
  permissions: RepositoryPermission[];
  defaultBranch: string;
  apiLimits: APILimits;
}

export interface RepositoryPermission {
  pull: boolean;
  push: boolean;
  admin: boolean;
  issues: boolean;
}

export interface APILimits {
  remaining: number;
  resetTime: Date;
  limit: number;
  used: number;
}

export interface TaskIssueMapping {
  taskId: string;
  issueId: number;
  issueUrl: string;
  createdAt: Date;
  status: 'created' | 'updated' | 'synced';
}