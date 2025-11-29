import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Global test utilities
export const createMockTask = (overrides: Partial<any> = {}) => ({
  id: 'TEST001',
  title: 'Test Task',
  description: 'This is a test task',
  priority: 'medium',
  story: 'US1',
  status: 'pending',
  dependencies: [],
  metadata: {},
  ...overrides,
});

export const createMockRepository = (overrides: Partial<any> = {}) => ({
  owner: 'testuser',
  name: 'test-repo',
  isPrivate: false,
  permissions: {
    pull: true,
    push: true,
    admin: false,
    issues: true,
  },
  defaultBranch: 'main',
  apiLimits: {
    limit: 5000,
    remaining: 4999,
    used: 1,
    resetTime: new Date(),
  },
  ...overrides,
});

export const createMockIssue = (overrides: Partial<any> = {}) => ({
  id: 123,
  url: 'https://github.com/testuser/test-repo/issues/123',
  title: 'Test Issue',
  body: 'Test issue body',
  state: 'open',
  labels: ['bug', 'speckit'],
  assignees: ['testuser'],
  createdAt: new Date(),
  updatedAt: new Date(),
  taskId: 'TEST001',
  ...overrides,
});

export const createMockAuth = (overrides: Partial<any> = {}) => ({
  type: 'pat',
  token: 'ghp_test_token',
  scopes: ['repo', 'issues:write'],
  permissions: [],
  ...overrides,
});

export const waitFor = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const createMockGitHubClient = () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  getClient: jest.fn(),
  getRateLimits: jest.fn().mockResolvedValue({
    limit: 5000,
    remaining: 4999,
    used: 1,
    resetTime: new Date(),
  }),
  getRepositories: jest.fn().mockResolvedValue([createMockRepository()]),
  getRepository: jest.fn().mockResolvedValue(createMockRepository()),
  getAuthType: jest.fn().mockReturnValue('pat'),
  getScopes: jest.fn().mockReturnValue(['repo', 'issues:write']),
  isInitialized: jest.fn().mockReturnValue(true),
});

export const createMockMCPServer = () => ({
  registerTool: jest.fn(),
  unregisterTool: jest.fn(),
  getTool: jest.fn(),
  listTools: jest.fn().mockReturnValue([]),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  isServerRunning: jest.fn().mockReturnValue(false),
  getServerInfo: jest.fn().mockReturnValue({
    name: 'test-server',
    version: '1.0.0',
    toolCount: 0,
  }),
});

// Test data factories
export const TestDataFactory = {
  task: createMockTask,
  repository: createMockRepository,
  issue: createMockIssue,
  auth: createMockAuth,
  githubClient: createMockGitHubClient,
  mcpServer: createMockMCPServer,
};

// Environment helpers
export const setTestEnv = (env: Record<string, string>) => {
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

export const clearTestEnv = (...keys: string[]) => {
  keys.forEach(key => {
    delete process.env[key];
  });
};

// Assertion helpers
export const expectValidTask = (task: any) => {
  expect(task).toHaveProperty('id');
  expect(task).toHaveProperty('title');
  expect(task).toHaveProperty('description');
  expect(task).toHaveProperty('priority');
  expect(task).toHaveProperty('story');
  expect(task).toHaveProperty('status');
  expect(task).toHaveProperty('dependencies');
  expect(task).toHaveProperty('metadata');
  expect(['low', 'medium', 'high']).toContain(task.priority);
  expect(['pending', 'in-progress', 'completed']).toContain(task.status);
};

export const expectValidRepository = (repo: any) => {
  expect(repo).toHaveProperty('owner');
  expect(repo).toHaveProperty('name');
  expect(repo).toHaveProperty('isPrivate');
  expect(repo).toHaveProperty('permissions');
  expect(repo).toHaveProperty('defaultBranch');
  expect(repo).toHaveProperty('apiLimits');
  expect(repo.permissions).toHaveProperty('pull');
  expect(repo.permissions).toHaveProperty('push');
  expect(repo.permissions).toHaveProperty('admin');
  expect(repo.permissions).toHaveProperty('issues');
};

export const expectValidIssue = (issue: any) => {
  expect(issue).toHaveProperty('id');
  expect(issue).toHaveProperty('url');
  expect(issue).toHaveProperty('title');
  expect(issue).toHaveProperty('body');
  expect(issue).toHaveProperty('state');
  expect(issue).toHaveProperty('labels');
  expect(issue).toHaveProperty('assignees');
  expect(issue).toHaveProperty('createdAt');
  expect(issue).toHaveProperty('updatedAt');
  expect(issue).toHaveProperty('taskId');
  expect(['open', 'closed', 'locked']).toContain(issue.state);
  expect(Array.isArray(issue.labels)).toBe(true);
  expect(Array.isArray(issue.assignees)).toBe(true);
};

// Error helpers
export const expectMCPError = (error: any, expectedCode: string) => {
  expect(error).toHaveProperty('code');
  expect(error).toHaveProperty('message');
  expect(error).toHaveProperty('timestamp');
  expect(error.code).toBe(expectedCode);
};

// Mock helpers
export const mockOctokit = () => ({
  rest: {
    users: {
      getAuthenticated: jest.fn().mockResolvedValue({
        data: { login: 'testuser', name: 'Test User', type: 'User' },
      }),
    },
    repos: {
      listForAuthenticatedUser: jest.fn().mockResolvedValue({
        data: [createMockRepository()],
      }),
      get: jest.fn().mockResolvedValue({
        data: createMockRepository(),
      }),
    },
    issues: {
      create: jest.fn().mockResolvedValue({
        data: createMockIssue(),
      }),
      update: jest.fn().mockResolvedValue({
        data: createMockIssue(),
      }),
      get: jest.fn().mockResolvedValue({
        data: createMockIssue(),
      }),
    },
    rateLimit: {
      get: jest.fn().mockResolvedValue({
        data: {
          resources: {
            core: {
              limit: 5000,
              remaining: 4999,
              used: 1,
              reset: Math.floor(Date.now() / 1000) + 3600,
            },
          },
        },
      }),
    },
  },
});

export default {
  TestDataFactory,
  setTestEnv,
  clearTestEnv,
  expectValidTask,
  expectValidRepository,
  expectValidIssue,
  expectMCPError,
  mockOctokit,
  waitFor,
};