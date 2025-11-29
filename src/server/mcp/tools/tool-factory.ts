import { z } from 'zod';
import type { MCPTool } from '../../types/mcp-tool.js';
import { logger } from '../../utils/logger.js';

export function createTool<T extends z.ZodSchema>(
  name: string,
  description: string,
  schema: T,
  handler: (input: z.infer<T>) => Promise<unknown>,
): MCPTool {
  return {
    name,
    description,
    schema,
    handler: async (input: unknown) => {
      logger.debug('Executing MCP tool', { name, input });
      
      try {
        const validatedInput = schema.parse(input);
        const result = await handler(validatedInput);
        
        logger.debug('MCP tool executed successfully', { name, result });
        return result;
      } catch (error) {
        logger.error('MCP tool execution failed', { name, input, error: (error as Error).message });
        throw error;
      }
    },
    rateLimit: {
      requests: 100,
      window: 60, // 1 minute
      current: 0,
    },
  };
}

// Common schemas for GitHub operations
export const RepositorySchema = z.object({
  owner: z.string().describe('Repository owner'),
  name: z.string().describe('Repository name'),
});

export const IssueCreateSchema = z.object({
  repository: z.string().describe('Repository in format owner/repo'),
  title: z.string().describe('Issue title'),
  body: z.string().describe('Issue body content'),
  labels: z.array(z.string()).optional().describe('Issue labels'),
  assignees: z.array(z.string()).optional().describe('Issue assignees'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Issue priority'),
  taskId: z.string().optional().describe('Associated speckit task ID'),
});

export const TaskConvertSchema = z.object({
  tasks: z.array(z.string()).describe('Task IDs to convert'),
  repository: z.string().optional().describe('Target repository'),
  createMissing: z.boolean().default(false).describe('Create missing tasks'),
  updateExisting: z.boolean().default(true).describe('Update existing issues'),
});

export const AuthStatusSchema = z.object({});

export const RepositoryListSchema = z.object({
  type: z.enum(['all', 'owner', 'member']).default('all').describe('Repository type filter'),
  sort: z.enum(['created', 'updated', 'pushed', 'full_name']).default('updated').describe('Sort field'),
  direction: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),
});

export const IssueGetSchema = z.object({
  repository: z.string().describe('Repository in format owner/repo'),
  issueId: z.number().describe('Issue number'),
});

export const ConfigStatusSchema = z.object({});

export const ConfigSetSchema = z.object({
  authType: z.enum(['oauth', 'pat', 'app']).describe('Authentication type'),
  clientId: z.string().optional().describe('GitHub OAuth client ID'),
  clientSecret: z.string().optional().describe('GitHub OAuth client secret'),
  token: z.string().optional().describe('GitHub personal access token'),
  repository: z.string().optional().describe('Default repository'),
  timeout: z.number().optional().describe('Request timeout in milliseconds'),
});