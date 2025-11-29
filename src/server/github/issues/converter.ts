import type { SpeckitTask } from '../../../types/speckit-task.js';
import type { GitHubIssue } from '../../../types/github-issue.js';
import { GitHubClient } from '../client.js';
import { logger } from '../../../utils/logger.js';
import { errorHandler, ErrorCode } from '../../../utils/errors.js';

export class IssueConverter {
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  public async convertTaskToIssue(
    task: SpeckitTask,
    repository: string,
    options: {
      labels?: string[];
      assignees?: string[];
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<GitHubIssue> {
    logger.info('Converting speckit task to GitHub issue', {
      taskId: task.id,
      repository,
      title: task.title,
    });

    try {
      const [owner, repo] = repository.split('/');

      if (!owner || !repo) {
        throw errorHandler.createError(
          ErrorCode.TASK_VALIDATION,
          'Invalid repository format. Expected "owner/repo"',
          { repository }
        );
      }

      const issueData = this.buildIssueData(task, options);
      const client = this.githubClient.getClient();

      const { data } = await client.rest.issues.create({
        owner,
        repo,
        ...issueData,
      });

      const githubIssue: GitHubIssue = {
        id: data.number.toString(),
        number: data.number,
        url: data.html_url,
        title: data.title,
        body: data.body ?? '',
        state: data.state as 'open' | 'closed' | 'locked',
        labels: data.labels.map((label: any) => label.name),
        assignees: data.assignees.map((assignee: any) => assignee.login),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        taskId: task.id,
      };

      return githubIssue;
    } catch (error) {
      throw errorHandler.handleError(error as Error, {
        operation: 'convertTaskToIssue',
        taskId: task.id,
        repository,
      });
    }
  }

  public async updateIssueFromTask(
    issueId: number,
    task: SpeckitTask,
    repository: string,
    options: {
      labels?: string[];
      assignees?: string[];
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<GitHubIssue> {
    logger.info('Updating GitHub issue from speckit task', {
      taskId: task.id,
      issueId,
      repository,
    });

    try {
      const [owner, repo] = repository.split('/');

      if (!owner || !repo) {
        throw errorHandler.createError(
          ErrorCode.TASK_VALIDATION,
          'Invalid repository format. Expected "owner/repo"',
          { repository }
        );
      }

      const issueData = this.buildIssueData(task, options);
      const client = this.githubClient.getClient();

      const { data } = await client.rest.issues.update({
        owner,
        repo,
        issue_number: issueId,
        ...issueData,
      });

      const githubIssue: GitHubIssue = {
        id: data.number.toString(),
        number: data.number,
        url: data.html_url,
        title: data.title,
        body: data.body ?? '',
        state: data.state as 'open' | 'closed' | 'locked',
        labels: data.labels.map((label: any) => label.name),
        assignees: data.assignees.map((assignee: any) => assignee.login),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        taskId: this.extractTaskId(data.body || ''),
      };

      return githubIssue;
    } catch (error) {
      throw errorHandler.handleError(error as Error, {
        operation: 'updateIssueFromTask',
        taskId: task.id,
        issueId,
        repository,
      });
    }
  }

  public async getIssue(repository: string, issueId: number): Promise<GitHubIssue> {
    logger.debug('Getting GitHub issue', { repository, issueId });

    try {
      const [owner, repo] = repository.split('/');

      if (!owner || !repo) {
        throw errorHandler.createError(
          ErrorCode.TASK_VALIDATION,
          'Invalid repository format. Expected "owner/repo"',
          { repository }
        );
      }

      const client = this.githubClient.getClient();

      const { data } = await client.rest.issues.get({
        owner,
        repo,
        issue_number: issueId,
      });

      const githubIssue: GitHubIssue = {
        id: data.number.toString(),
        number: data.number,
        url: data.html_url,
        title: data.title,
        body: data.body ?? '',
        state: data.state as 'open' | 'closed' | 'locked',
        labels: data.labels?.map((label: any) => label.name) || [],
        assignees: data.assignees?.map((assignee: any) => assignee.login) || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        taskId: this.extractTaskId(data.body || ''),
      };

      return githubIssue;
    } catch (error) {
      throw errorHandler.handleError(error as Error, {
        operation: 'getIssue',
        repository,
        issueId,
      });
    }
  }

  private buildIssueData(
    task: SpeckitTask,
    options: {
      labels?: string[];
      assignees?: string[];
      priority?: 'low' | 'medium' | 'high';
    }
  ) {
    const labels = ['speckit', task.priority, task.story, ...(options.labels ?? [])].filter(
      Boolean
    );

    const body = this.buildIssueBody(task);

    return {
      title: this.buildIssueTitle(task),
      body,
      labels,
      assignees: options.assignees || [],
    };
  }

  private buildIssueTitle(task: SpeckitTask): string {
    return `${task.title} (${task.id})`;
  }

  private buildIssueBody(task: SpeckitTask): string {
    return `## Speckit Task

**Task ID**: ${task.id}
**Title**: ${task.title}
**Priority**: ${task.priority}
**User Story**: ${task.story}
**Status**: ${task.status}

## Description

${task.description}

${
  task.dependencies.length > 0
    ? `
## Dependencies

${task.dependencies.map(dep => `- ${dep}`).join('\n')}
`
    : ''
}

## Metadata

\`\`\`json
${JSON.stringify(task.metadata, null, 2)}
\`\`\`

---
*This issue was created automatically from a speckit task.*`;
  }

  private extractTaskId(body: string): string {
    const match = body.match(/\*\*Task ID\*\*:\s*([^\s\n]+)/);
    return match?.[1] || '';
  }

  public async convertMultipleTasks(
    tasks: SpeckitTask[],
    repository: string,
    options: {
      labels?: string[];
      assignees?: string[];
      priority?: 'low' | 'medium' | 'high';
      createMissing?: boolean;
      updateExisting?: boolean;
    } = {}
  ): Promise<Array<{ task: SpeckitTask; issue?: GitHubIssue; error?: string }>> {
    logger.info('Converting multiple tasks to GitHub issues', {
      taskCount: tasks.length,
      repository,
    });

    const results = [];

    for (const task of tasks) {
      try {
        const issue = await this.convertTaskToIssue(task, repository, options);
        results.push({ task, issue });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to convert task to issue', {
          taskId: task.id,
          error: errorMessage,
        });
        results.push({ task, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.issue).length;
    const errorCount = results.filter(r => r.error).length;

    logger.info('Task conversion completed', {
      total: tasks.length,
      success: successCount,
      errors: errorCount,
    });

    return results;
  }
}
