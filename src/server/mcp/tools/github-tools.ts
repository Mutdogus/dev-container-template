import type { MCPTool } from '../../../types/mcp-tool.js';
import type { SpeckitTask } from '../../../types/speckit-task.js';
import type { GitHubIssue } from '../../../types/github-issue.js';
import { GitHubClient } from '../client.js';
import { IssueConverter } from '../issues/converter.js';
import { logger } from '../../../utils/logger.js';
import { errorHandler, ErrorCode } from '../../../utils/errors.js';

export function createGitHubIssueCreationTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'github_create_issue',
    description: 'Create a GitHub issue from a speckit task',
    schema: {
      type: 'object',
      properties: {
        task: {
          type: 'object',
          description: 'Speckit task to convert to an issue',
          properties: {
            id: { type: 'string', description: 'Task identifier' },
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Task priority' },
            story: { type: 'string', description: 'Associated user story' },
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], description: 'Task status' },
            dependencies: { type: 'array', items: { type: 'string' }, description: 'Task dependencies' },
            metadata: { type: 'object', description: 'Additional task metadata' },
          },
          required: ['id', 'title', 'description'],
        },
        repository: {
          type: 'string',
          description: 'Repository in format "owner/repo"',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional labels to add to the issue',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Users to assign to the issue',
        },
      },
      required: ['task', 'repository'],
    },
    handler: async (args) => {
      logger.info('Creating GitHub issue from speckit task', { taskId: args.task.id });

      try {
        const converter = new IssueConverter(githubClient);
        const issue = await converter.convertTaskToIssue(
          args.task as SpeckitTask,
          args.repository,
          {
            labels: args.labels,
            assignees: args.assignees,
          },
        );

        return {
          success: true,
          issue: {
            id: issue.id,
            url: issue.url,
            title: issue.title,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            taskId: issue.taskId,
          },
        };
      } catch (error) {
        logger.error('Failed to create GitHub issue', { taskId: args.task.id, error: (error as Error).message });
        throw error;
      }
    },
  };
}

export function createGitHubIssueUpdateTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'github_update_issue',
    description: 'Update a GitHub issue from a speckit task',
    schema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'number',
          description: 'GitHub issue number to update',
        },
        task: {
          type: 'object',
          description: 'Speckit task with updated information',
          properties: {
            id: { type: 'string', description: 'Task identifier' },
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Task priority' },
            story: { type: 'string', description: 'Associated user story' },
            status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], description: 'Task status' },
            dependencies: { type: 'array', items: { type: 'string' }, description: 'Task dependencies' },
            metadata: { type: 'object', description: 'Additional task metadata' },
          },
          required: ['id', 'title', 'description'],
        },
        repository: {
          type: 'string',
          description: 'Repository in format "owner/repo"',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional labels to add to the issue',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Users to assign to the issue',
        },
      },
      required: ['issueId', 'task', 'repository'],
    },
    handler: async (args) => {
      logger.info('Updating GitHub issue from speckit task', { issueId: args.issueId, taskId: args.task.id });

      try {
        const converter = new IssueConverter(githubClient);
        const issue = await converter.updateIssueFromTask(
          args.issueId,
          args.task as SpeckitTask,
          args.repository,
          {
            labels: args.labels,
            assignees: args.assignees,
          },
        );

        return {
          success: true,
          issue: {
            id: issue.id,
            url: issue.url,
            title: issue.title,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
            taskId: issue.taskId,
          },
        };
      } catch (error) {
        logger.error('Failed to update GitHub issue', { issueId: args.issueId, taskId: args.task.id, error: (error as Error).message });
        throw error;
      }
    },
  };
}

export function createGitHubIssueGetTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'github_get_issue',
    description: 'Get details of a GitHub issue',
    schema: {
      type: 'object',
      properties: {
        repository: {
          type: 'string',
          description: 'Repository in format "owner/repo"',
        },
        issueId: {
          type: 'number',
          description: 'GitHub issue number',
        },
      },
      required: ['repository', 'issueId'],
    },
    handler: async (args) => {
      logger.info('Getting GitHub issue details', { repository: args.repository, issueId: args.issueId });

      try {
        const converter = new IssueConverter(githubClient);
        const issue = await converter.getIssue(args.repository, args.issueId);

        return {
          success: true,
          issue: {
            id: issue.id,
            url: issue.url,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            labels: issue.labels,
            assignees: issue.assignees,
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
            taskId: issue.taskId,
          },
        };
      } catch (error) {
        logger.error('Failed to get GitHub issue', { repository: args.repository, issueId: args.issueId, error: (error as Error).message });
        throw error;
      }
    },
  };
}

export function createGitHubRepositoryListTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'github_list_repositories',
    description: 'List accessible GitHub repositories',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['all', 'owner', 'member'],
          description: 'Type of repositories to list',
          default: 'all',
        },
      },
    },
    handler: async (args) => {
      logger.info('Listing GitHub repositories', { type: args.type || 'all' });

      try {
        const repositories = await githubClient.getRepositories(args.type || 'all');

        return {
          success: true,
          repositories: repositories.map(repo => ({
            name: repo.name,
            owner: repo.owner,
            isPrivate: repo.isPrivate,
            defaultBranch: repo.defaultBranch,
            permissions: repo.permissions,
            fullName: `${repo.owner}/${repo.name}`,
          })),
          totalCount: repositories.length,
        };
      } catch (error) {
        logger.error('Failed to list repositories', { type: args.type, error: (error as Error).message });
        throw error;
      }
    },
  };
}

export function createGitHubRateLimitTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'github_rate_limit',
    description: 'Get GitHub API rate limit information',
    schema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      logger.info('Getting GitHub API rate limits');

      try {
        const rateLimits = await githubClient.getRateLimits();

        return {
          success: true,
          rateLimits: {
            limit: rateLimits.limit,
            remaining: rateLimits.remaining,
            used: rateLimits.used,
            resetTime: rateLimits.resetTime.toISOString(),
            resetTimeUnix: Math.floor(rateLimits.resetTime.getTime() / 1000),
          },
        };
      } catch (error) {
        logger.error('Failed to get rate limits', { error: (error as Error).message });
        throw error;
      }
    },
  };
}

export function createSpeckitTaskConversionTool(githubClient: GitHubClient): MCPTool {
  return {
    name: 'speckit_convert_tasks',
    description: 'Convert multiple speckit tasks to GitHub issues',
    schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'Array of speckit tasks to convert',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Task identifier' },
              title: { type: 'string', description: 'Task title' },
              description: { type: 'string', description: 'Task description' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Task priority' },
              story: { type: 'string', description: 'Associated user story' },
              status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], description: 'Task status' },
              dependencies: { type: 'array', items: { type: 'string' }, description: 'Task dependencies' },
              metadata: { type: 'object', description: 'Additional task metadata' },
            },
            required: ['id', 'title', 'description'],
          },
        },
        repository: {
          type: 'string',
          description: 'Target repository in format "owner/repo"',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional labels to add to all issues',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Users to assign to all issues',
        },
        createMissing: {
          type: 'boolean',
          description: 'Create issues for tasks that do not exist',
          default: true,
        },
        updateExisting: {
          type: 'boolean',
          description: 'Update existing issues',
          default: false,
        },
      },
      required: ['tasks', 'repository'],
    },
    handler: async (args) => {
      logger.info('Converting multiple speckit tasks to GitHub issues', { 
        taskCount: args.tasks.length, 
        repository: args.repository 
      });

      try {
        const converter = new IssueConverter(githubClient);
        const results = await converter.convertMultipleTasks(
          args.tasks as SpeckitTask[],
          args.repository,
          {
            labels: args.labels,
            assignees: args.assignees,
            createMissing: args.createMissing,
            updateExisting: args.updateExisting,
          },
        );

        const successful = results.filter(r => r.issue);
        const failed = results.filter(r => r.error);

        return {
          success: failed.length === 0,
          results: results.map(r => ({
            taskId: r.task.id,
            result: r.issue ? 'created' : 'error',
            issueId: r.issue?.id,
            issueUrl: r.issue?.url,
            error: r.error,
          })),
          summary: {
            totalProcessed: results.length,
            created: successful.length,
            failed: failed.length,
            successRate: (successful.length / results.length * 100).toFixed(1) + '%',
          },
        };
      } catch (error) {
        logger.error('Failed to convert tasks', { error: (error as Error).message });
        throw error;
      }
    },
  };
}