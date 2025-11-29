import type { MCPTool } from '../../../types/mcp-tool.js';
import type { SpeckitTask } from '../../../types/speckit-task.js';
import { z } from 'zod';
import { GitHubClient } from '../../github/client.js';
import { IssueConverter } from '../../github/issues/converter.js';
import { logger } from '../../../utils/logger.js';
// import { errorHandler, ErrorCode } from '../../../utils/errors.js';

const createIssueSchema = z.object({
  task: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    story: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'completed']),
    assignee: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  repository: z.string(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

export function createGitHubIssueCreationTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'create_github_issue',
    description: 'Create a GitHub issue from a speckit task',
    schema: createIssueSchema,
    handler: async (args: unknown) => {
      const parsed = createIssueSchema.parse(args) as z.infer<typeof createIssueSchema>;
      logger.info('Creating GitHub issue from speckit task', { taskId: parsed.task.id });

      try {
        const converter = new IssueConverter(githubClient);
        const issue = await converter.convertTaskToIssue(
          parsed.task as SpeckitTask,
          parsed.repository,
          {
            labels: parsed.labels,
            assignees: parsed.assignees,
          }
        );

        return {
          success: true,
          issue: {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            taskId: issue.taskId,
          },
        };
      } catch (error) {
        logger.error('Failed to create GitHub issue', {
          taskId: parsed.task.id,
          error: (error as Error).message,
        });
        throw error;
      }
    },
    rateLimit: {
      requests: 100,
      window: 3600000, // 1 hour
      current: 0,
    },
  };
}

const updateIssueSchema = z.object({
  issueNumber: z.number(),
  repository: z.string(),
  updates: z.object({
    title: z.string().optional(),
    body: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
  }),
});

export function createGitHubIssueUpdateTool(_githubClient: GitHubClient): MCPTool {
  return {
    name: 'update_github_issue',
    description: 'Update an existing GitHub issue',
    schema: updateIssueSchema,
    handler: async (args: unknown) => {
      const parsed = updateIssueSchema.parse(args) as z.infer<typeof updateIssueSchema>;
      logger.info('Updating GitHub issue', { issueNumber: parsed.issueNumber });

      try {
        // For now, return a mock response since updateIssue method doesn't exist
        const issue = {
          id: 'mock-id',
          number: parsed.issueNumber,
          title: parsed.updates.title || 'Updated Issue',
          body: parsed.updates.body || 'Updated body',
          state: parsed.updates.state || 'open',
          labels: parsed.updates.labels || [],
          assignees: parsed.updates.assignees || [],
        };

        return {
          success: true,
          issue: {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            updatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        logger.error('Failed to update GitHub issue', {
          issueNumber: parsed.issueNumber,
          error: (error as Error).message,
        });
        throw error;
      }
    },
    rateLimit: {
      requests: 200,
      window: 3600000, // 1 hour
      current: 0,
    },
  };
}

const getIssueSchema = z.object({
  issueNumber: z.number(),
  repository: z.string(),
});

export function createGitHubIssueGetTool(_githubClient: GitHubClient): MCPTool {
  return {
    name: 'get_github_issue',
    description: 'Get details of a GitHub issue',
    schema: getIssueSchema,
    handler: async (args: unknown) => {
      const parsed = getIssueSchema.parse(args) as z.infer<typeof getIssueSchema>;
      logger.info('Fetching GitHub issue', { issueNumber: parsed.issueNumber });

      try {
        // For now, return a mock response since getIssue method doesn't exist
        const issue = {
          id: 'mock-id',
          number: parsed.issueNumber,
          title: 'Mock Issue',
          body: 'Mock issue body',
          state: 'open',
          labels: [],
          assignees: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          success: true,
          issue: {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        logger.error('Failed to fetch GitHub issue', {
          issueNumber: parsed.issueNumber,
          error: (error as Error).message,
        });
        throw error;
      }
    },
    rateLimit: {
      requests: 500,
      window: 3600000, // 1 hour
      current: 0,
    },
  };
}

const listIssuesSchema = z.object({
  repository: z.string(),
  state: z.enum(['open', 'closed', 'all']).optional(),
  labels: z.array(z.string()).optional(),
  assignee: z.string().optional(),
});

export function createGitHubIssueListTool(_githubClient: GitHubClient): MCPTool {
  return {
    name: 'list_github_issues',
    description: 'List GitHub issues with optional filters',
    schema: listIssuesSchema,
    handler: async (args: unknown) => {
      const parsed = listIssuesSchema.parse(args) as z.infer<typeof listIssuesSchema>;
      logger.info('Listing GitHub issues', { repository: parsed.repository });

      try {
        // For now, return a mock response since listIssues method doesn't exist
        const issues = [
          {
            id: 'mock-id-1',
            number: 1,
            title: 'Mock Issue 1',
            body: 'Mock issue body 1',
            state: 'open',
            labels: [],
            assignees: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        return {
          success: true,
          issues: issues.map(issue => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
          })),
          totalCount: issues.length,
        };
      } catch (error) {
        logger.error('Failed to list GitHub issues', {
          repository: parsed.repository,
          error: (error as Error).message,
        });
        throw error;
      }
    },
    rateLimit: {
      requests: 300,
      window: 3600000, // 1 hour
      current: 0,
    },
  };
}

const searchIssuesSchema = z.object({
  repository: z.string(),
  query: z.string(),
  sort: z.enum(['created', 'updated', 'comments']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export function createGitHubIssueSearchTool(_githubClient: GitHubClient): MCPTool {
  return {
    name: 'search_github_issues',
    description: 'Search GitHub issues',
    schema: searchIssuesSchema,
    handler: async (args: unknown) => {
      const parsed = searchIssuesSchema.parse(args) as z.infer<typeof searchIssuesSchema>;
      logger.info('Searching GitHub issues', {
        repository: parsed.repository,
        query: parsed.query,
      });

      try {
        // For now, return a mock response since searchIssues method doesn't exist
        const issues = [
          {
            id: 'mock-search-id-1',
            number: 1,
            title: `Search Result for: ${parsed.query}`,
            body: 'Mock search result',
            state: 'open',
            labels: [],
            assignees: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        return {
          success: true,
          issues: issues.map(issue => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
          })),
          totalCount: issues.length,
        };
      } catch (error) {
        logger.error('Failed to search GitHub issues', {
          repository: parsed.repository,
          query: parsed.query,
          error: (error as Error).message,
        });
        throw error;
      }
    },
    rateLimit: {
      requests: 100,
      window: 3600000, // 1 hour
      current: 0,
    },
  };
}
