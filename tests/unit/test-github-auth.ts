import { GitHubClient } from '../../src/server/github/client.js';
import { TestDataFactory, setTestEnv, clearTestEnv, expectMCPError } from '../test-utils.js';
import { ErrorCode } from '../../src/utils/errors.js';

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => TestDataFactory.mockOctokit()),
  };
});

jest.mock('@octokit/plugin-throttling', () => ({
  throttling: jest.fn(),
}));

jest.mock('@octokit/plugin-retry', () => ({
  retry: jest.fn(),
}));

describe('GitHub Authentication Tests', () => {
  let githubClient: GitHubClient;

  beforeEach(() => {
    // Reset environment
    clearTestEnv(
      'GITHUB_AUTH_TYPE',
      'GITHUB_PERSONAL_ACCESS_TOKEN',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
    );
  });

  describe('PAT Authentication', () => {
    beforeAll(() => {
      setTestEnv({
        GITHUB_AUTH_TYPE: 'pat',
        GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_test_token_123',
        NODE_ENV: 'test',
      });
    });

    afterAll(() => {
      clearTestEnv('GITHUB_AUTH_TYPE', 'GITHUB_PERSONAL_ACCESS_TOKEN', 'NODE_ENV');
    });

    beforeEach(() => {
      const auth = TestDataFactory.auth({
        type: 'pat',
        token: 'ghp_test_token_123',
      });
      githubClient = new GitHubClient(auth);
    });

    test('should initialize successfully with PAT', async () => {
      await expect(githubClient.initialize()).resolves.not.toThrow();
      expect(githubClient.isInitialized()).toBe(true);
      expect(githubClient.getAuthType()).toBe('pat');
      expect(githubClient.getScopes()).toEqual(['repo', 'issues:write']);
    });

    test('should fail initialization with missing PAT token', async () => {
      const auth = TestDataFactory.auth({
        type: 'pat',
        token: undefined,
      });
      const client = new GitHubClient(auth);

      await expect(client.initialize()).rejects.toThrow();
    });

    test('should get rate limits successfully', async () => {
      await githubClient.initialize();
      
      const rateLimits = await githubClient.getRateLimits();
      
      expect(rateLimits).toHaveProperty('limit');
      expect(rateLimits).toHaveProperty('remaining');
      expect(rateLimits).toHaveProperty('used');
      expect(rateLimits).toHaveProperty('resetTime');
      expect(typeof rateLimits.resetTime).toBe('object');
    });

    test('should get repositories successfully', async () => {
      await githubClient.initialize();
      
      const repositories = await githubClient.getRepositories();
      
      expect(Array.isArray(repositories)).toBe(true);
      expect(repositories.length).toBeGreaterThan(0);
      repositories.forEach(repo => {
        expect(repo).toHaveProperty('owner');
        expect(repo).toHaveProperty('name');
        expect(repo).toHaveProperty('isPrivate');
        expect(repo).toHaveProperty('permissions');
        expect(repo).toHaveProperty('defaultBranch');
      });
    });

    test('should get single repository successfully', async () => {
      await githubClient.initialize();
      
      const repository = await githubClient.getRepository('testuser', 'test-repo');
      
      expect(repository).toHaveProperty('owner', 'testuser');
      expect(repository).toHaveProperty('name', 'test-repo');
      expect(repository).toHaveProperty('isPrivate');
      expect(repository).toHaveProperty('permissions');
      expect(repository).toHaveProperty('defaultBranch');
    });
  });

  describe('OAuth Authentication', () => {
    beforeAll(() => {
      setTestEnv({
        GITHUB_AUTH_TYPE: 'oauth',
        GITHUB_CLIENT_ID: 'test_client_id',
        GITHUB_CLIENT_SECRET: 'test_client_secret',
        NODE_ENV: 'test',
      });
    });

    afterAll(() => {
      clearTestEnv('GITHUB_AUTH_TYPE', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'NODE_ENV');
    });

    test('should initialize successfully with OAuth credentials', async () => {
      const auth = TestDataFactory.auth({
        type: 'oauth',
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
      });
      githubClient = new GitHubClient(auth);

      await expect(githubClient.initialize()).resolves.not.toThrow();
      expect(githubClient.isInitialized()).toBe(true);
      expect(githubClient.getAuthType()).toBe('oauth');
    });

    test('should fail initialization with missing OAuth client ID', async () => {
      const auth = TestDataFactory.auth({
        type: 'oauth',
        clientId: undefined,
        clientSecret: 'test_client_secret',
      });
      const client = new GitHubClient(auth);

      await expect(client.initialize()).rejects.toThrow();
    });

    test('should fail initialization with missing OAuth client secret', async () => {
      const auth = TestDataFactory.auth({
        type: 'oauth',
        clientId: 'test_client_id',
        clientSecret: undefined,
      });
      const client = new GitHubClient(auth);

      await expect(client.initialize()).rejects.toThrow();
    });
  });

  describe('GitHub App Authentication', () => {
    test('should fail initialization for GitHub App (not implemented)', async () => {
      const auth = TestDataFactory.auth({
        type: 'app',
      });
      githubClient = new GitHubClient(auth);

      await expect(githubClient.initialize()).rejects.toThrow('GitHub App authentication not yet implemented');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const auth = TestDataFactory.auth({
        type: 'pat',
        token: 'ghp_test_token_123',
      });
      githubClient = new GitHubClient(auth);
    });

    test('should handle authentication failure', async () => {
      // Mock authentication failure
      const { Octokit } = require('@octokit/rest');
      Octokit.mockImplementation(() => ({
        rest: {
          users: {
            getAuthenticated: jest.fn().mockRejectedValue(new Error('Bad credentials')),
          },
        },
      }));

      await expect(githubClient.initialize()).rejects.toThrow();
    });

    test('should handle API errors gracefully', async () => {
      await githubClient.initialize();

      // Mock API error
      const client = githubClient.getClient();
      client.rest.repos.get = jest.fn().mockRejectedValue(new Error('Not Found'));

      await expect(githubClient.getRepository('nonexistent', 'repo')).rejects.toThrow();
    });

    test('should handle rate limit errors', async () => {
      await githubClient.initialize();

      // Mock rate limit error
      const rateLimitError = new Error('API rate limit exceeded');
      (rateLimitError as any).status = 403;

      const client = githubClient.getClient();
      client.rest.repos.get = jest.fn().mockRejectedValue(rateLimitError);

      await expect(githubClient.getRepository('testuser', 'test-repo')).rejects.toThrow();
    });
  });

  describe('Client State Management', () => {
    test('should track initialization state', () => {
      const auth = TestDataFactory.auth({
        type: 'pat',
        token: 'ghp_test_token_123',
      });
      const client = new GitHubClient(auth);

      expect(client.isInitialized()).toBe(false);

      // Note: We can't actually initialize in this test without mocking
      // but we can test the state tracking
      expect(client.getAuthType()).toBe('pat');
      expect(client.getScopes()).toEqual(['repo', 'issues:write']);
    });

    test('should throw error when getting client before initialization', async () => {
      const auth = TestDataFactory.auth({
        type: 'pat',
        token: 'ghp_test_token_123',
      });
      const client = new GitHubClient(auth);

      expect(() => client.getClient()).toThrow('GitHub client not initialized');
    });
  });
});