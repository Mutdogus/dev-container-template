import { z } from 'zod';

export interface MCPTool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  handler: (input: unknown) => Promise<unknown>;
  rateLimit: RateLimit;
}

export interface RateLimit {
  requests: number;
  window: number;
  current: number;
}

export interface MCPToolResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface MCPError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}