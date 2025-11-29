import { IssueConverter } from '../../src/server/github/issues/converter.js';
import { GitHubClient } from '../../src/server/github/client.js';
import { TestDataFactory, setTestEnv, clearTestEnv, expectValidIssue } from '../test-utils.js';

// Mock GitHub Client
jest.mock('../../src/server/github/client.js');

describe('Task-to-Issue Conversion Integration Tests', () => {
  let issueConverter: IssueConverter;
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeAll(() => {
    setTestEnv({
      GITHUB_AUTH_TYPE: 'pat',
      GITHUB_PERSONAL_ACCESS_TOKEN: 'test_token',
      NODE_ENV: 'test',
    });
  });

  afterAll(() => {
    clearTestEnv('GITHUB_AUTH_TYPE', 'GITHUB_PERSONAL_ACCESS_TOKEN', 'NODE_ENV');
  });

  beforeEach(() => {
    // Create mock GitHub client
    mockGitHubClient = TestDataFactory.githubClient() as jest.Mocked<GitHubClient>;
    (GitHubClient as jest.MockedClass<typeof GitHubClient>).mockImplementation(() => mockGitHubClient);
    
    // Create issue converter with mocked client
    issueConverter = new IssueConverter(mockGitHubClient);
  });

  describe('Single Task Conversion', () => {
    test('should convert basic task to GitHub issue', async () => {
      const task = TestDataFactory.task({
        id: 'TASK001',
        title: 'Implement user authentication',
        description: 'Add login and registration functionality',
        priority: 'high',
        story: 'US1',
      });

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const expectedIssue = TestDataFactory.issue({
        id: 123,
        title: 'Implement user authentication (TASK001)',
        body: expect.stringContaining('TASK001'),
        taskId: 'TASK001',
      });

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: expectedIssue,
      });

      const result = await issueConverter.convertTaskToIssue(task, 'testuser/test-repo');

      expectValidIssue(result);
      expect(result.taskId).toBe('TASK001');
      expect(result.title).toBe('Implement user authentication (TASK001)');
      expect(result.body).toContain('TASK001');
      expect(result.body).toContain('Implement user authentication');
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        title: 'Implement user authentication (TASK001)',
        body: expect.stringContaining('TASK001'),
        labels: ['speckit', 'high', 'US1'],
        assignees: [],
      });
    });

    test('should convert task with custom options', async () => {
      const task = TestDataFactory.task({
        id: 'TASK002',
        title: 'Fix login bug',
        priority: 'medium',
      });

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const expectedIssue = TestDataFactory.issue({
        id: 124,
        title: 'Fix login bug (TASK002)',
        labels: ['bug', 'urgent'],
        assignees: ['developer1'],
      });

      mockOctokit.rest.issues.create.mockResolvedValue({
        data: expectedIssue,
      });

      const result = await issueConverter.convertTaskToIssue(task, 'testuser/test-repo', {
        labels: ['bug', 'urgent'],
        assignees: ['developer1'],
        priority: 'low', // This should override task priority
      });

      expectValidIssue(result);
      expect(result.labels).toContain('bug');
      expect(result.labels).toContain('urgent');
      expect(result.assignees).toContain('developer1');
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        title: 'Fix login bug (TASK002)',
        body: expect.stringContaining('TASK002'),
        labels: ['speckit', 'low', 'US1', 'bug', 'urgent'],
        assignees: ['developer1'],
      });
    });

    test('should handle task with dependencies', async () => {
      const task = TestDataFactory.task({
        id: 'TASK003',
        title: 'Add user profile page',
        dependencies: ['TASK001', 'TASK002'],
      });

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const expectedIssue = TestDataFactory.issue();
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: expectedIssue,
      });

      const result = await issueConverter.convertTaskToIssue(task, 'testuser/test-repo');

      expectValidIssue(result);
      expect(result.body).toContain('TASK001');
      expect(result.body).toContain('TASK002');
      expect(result.body).toContain('## Dependencies');
    });

    test('should handle invalid repository format', async () => {
      const task = TestDataFactory.task();

      await expect(
        issueConverter.convertTaskToIssue(task, 'invalid-repo-format')
      ).rejects.toThrow('Invalid repository format');
    });

    test('should handle GitHub API errors', async () => {
      const task = TestDataFactory.task();

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      mockOctokit.rest.issues.create.mockRejectedValue(new Error('GitHub API error'));

      await expect(
        issueConverter.convertTaskToIssue(task, 'testuser/test-repo')
      ).rejects.toThrow('GitHub API error');
    });
  });

  describe('Issue Updates', () => {
    test('should update existing issue from task', async () => {
      const task = TestDataFactory.task({
        id: 'TASK004',
        title: 'Updated task title',
        description: 'Updated description',
      });

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const expectedIssue = TestDataFactory.issue({
        id: 125,
        title: 'Updated task title (TASK004)',
        body: expect.stringContaining('Updated description'),
      });

      mockOctokit.rest.issues.update.mockResolvedValue({
        data: expectedIssue,
      });

      const result = await issueConverter.updateIssueFromTask(125, task, 'testuser/test-repo');

      expectValidIssue(result);
      expect(result.title).toBe('Updated task title (TASK004)');
      expect(result.body).toContain('Updated description');
      expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        issue_number: 125,
        title: 'Updated task title (TASK004)',
        body: expect.stringContaining('TASK004'),
        labels: ['speckit', 'medium', 'US1'],
        assignees: [],
      });
    });
  });

  describe('Issue Retrieval', () => {
    test('should retrieve issue details', async () => {
      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const expectedIssue = TestDataFactory.issue({
        id: 126,
        taskId: 'TASK005',
        body: '**Task ID**: TASK005\n\nIssue content here',
      });

      mockOctokit.rest.issues.get.mockResolvedValue({
        data: expectedIssue,
      });

      const result = await issueConverter.getIssue('testuser/test-repo', 126);

      expectValidIssue(result);
      expect(result.id).toBe(126);
      expect(result.taskId).toBe('TASK005');
      expect(mockOctokit.rest.issues.get).toHaveBeenCalledWith({
        owner: 'testuser',
        repo: 'test-repo',
        issue_number: 126,
      });
    });

    test('should extract task ID from issue body', async () => {
      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const issueWithTaskId = TestDataFactory.issue({
        id: 127,
        body: '**Task ID**: CUSTOM_TASK_ID\n\nSome other content',
      });

      mockOctokit.rest.issues.get.mockResolvedValue({
        data: issueWithTaskId,
      });

      const result = await issueConverter.getIssue('testuser/test-repo', 127);

      expect(result.taskId).toBe('CUSTOM_TASK_ID');
    });

    test('should handle missing task ID in issue body', async () => {
      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const issueWithoutTaskId = TestDataFactory.issue({
        id: 128,
        body: 'Just a regular issue without task ID',
      });

      mockOctokit.rest.issues.get.mockResolvedValue({
        data: issueWithoutTaskId,
      });

      const result = await issueConverter.getIssue('testuser/test-repo', 128);

      expect(result.taskId).toBe('');
    });
  });

  describe('Batch Conversion', () => {
    test('should convert multiple tasks', async () => {
      const tasks = [
        TestDataFactory.task({ id: 'BATCH001', title: 'First task' }),
        TestDataFactory.task({ id: 'BATCH002', title: 'Second task' }),
        TestDataFactory.task({ id: 'BATCH003', title: 'Third task' }),
      ];

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      // Mock successful creation for each task
      mockOctokit.rest.issues.create
        .mockResolvedValueOnce({ data: TestDataFactory.issue({ id: 201 }) })
        .mockResolvedValueOnce({ data: TestDataFactory.issue({ id: 202 }) })
        .mockResolvedValueOnce({ data: TestDataFactory.issue({ id: 203 }) });

      const results = await issueConverter.convertMultipleTasks(tasks, 'testuser/test-repo');

      expect(results).toHaveLength(3);
      expect(results.every(r => r.issue)).toBe(true);
      expect(results.every(r => !r.error)).toBe(true);
      
      expect(mockOctokit.rest.issues.create).toHaveBeenCalledTimes(3);
    });

    test('should handle mixed success and failure in batch', async () => {
      const tasks = [
        TestDataFactory.task({ id: 'MIX001', title: 'Success task' }),
        TestDataFactory.task({ id: 'MIX002', title: 'Failure task' }),
        TestDataFactory.task({ id: 'MIX003', title: 'Another success' }),
      ];

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      // Mock mixed results
      mockOctokit.rest.issues.create
        .mockResolvedValueOnce({ data: TestDataFactory.issue({ id: 301 }) })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ data: TestDataFactory.issue({ id: 302 }) });

      const results = await issueConverter.convertMultipleTasks(tasks, 'testuser/test-repo');

      expect(results).toHaveLength(3);
      expect(results[0].issue).toBeDefined();
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
      expect(results[1].issue).toBeUndefined();
      expect(results[2].issue).toBeDefined();
      expect(results[2].error).toBeUndefined();
    });

    test('should handle empty task list', async () => {
      const results = await issueConverter.convertMultipleTasks([], 'testuser/test-repo');

      expect(results).toHaveLength(0);
    });
  });

  describe('Issue Body Formatting', () => {
    test('should format issue body correctly', async () => {
      const task = TestDataFactory.task({
        id: 'FORMAT001',
        title: 'Test formatting',
        description: 'This is a test description',
        priority: 'high',
        story: 'US2',
        metadata: { component: 'auth', complexity: 'medium' },
      });

      const mockOctokit = TestDataFactory.mockOctokit();
      mockGitHubClient.getClient.mockReturnValue(mockOctokit as any);

      const expectedIssue = TestDataFactory.issue();
      mockOctokit.rest.issues.create.mockResolvedValue({
        data: expectedIssue,
      });

      await issueConverter.convertTaskToIssue(task, 'testuser/test-repo');

      const createCall = mockOctokit.rest.issues.create.mock.calls[0][0];
      const body = createCall.body;

      expect(body).toContain('## Speckit Task');
      expect(body).toContain('**Task ID**: FORMAT001');
      expect(body).toContain('**Title**: Test formatting');
      expect(body).toContain('**Priority**: high');
      expect(body).toContain('**User Story**: US2');
      expect(body).toContain('## Description');
      expect(body).toContain('This is a test description');
      expect(body).toContain('## Metadata');
      expect(body).toContain('"component": "auth"');
      expect(body).toContain('*This issue was created automatically from a speckit task.*');
    });
  });
});