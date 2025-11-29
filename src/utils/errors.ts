import type { MCPError } from '../types/mcp-tool.js';
import { logger } from './logger.js';

export enum ErrorCode {
  // Authentication Errors
  AUTH_MISSING_CREDENTIALS = 'AUTH_MISSING_CREDENTIALS',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_INSUFFICIENT_SCOPES = 'AUTH_INSUFFICIENT_SCOPES',
  AUTH_FAILED = 'AUTH_FAILED',

  // GitHub API Errors
  GITHUB_RATE_LIMIT = 'GITHUB_RATE_LIMIT',
  GITHUB_NOT_FOUND = 'GITHUB_NOT_FOUND',
  GITHUB_FORBIDDEN = 'GITHUB_FORBIDDEN',
  GITHUB_VALIDATION = 'GITHUB_VALIDATION',
  GITHUB_SERVER_ERROR = 'GITHUB_SERVER_ERROR',

  // MCP Server Errors
  MCP_SERVER_STARTUP = 'MCP_SERVER_STARTUP',
  MCP_TOOL_NOT_FOUND = 'MCP_TOOL_NOT_FOUND',
  MCP_INVALID_INPUT = 'MCP_INVALID_INPUT',
  MCP_TOOL_EXECUTION = 'MCP_TOOL_EXECUTION',

  // Configuration Errors
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_VALIDATION = 'CONFIG_VALIDATION',

  // Task Conversion Errors
  TASK_CONVERSION = 'TASK_CONVERSION',
  TASK_VALIDATION = 'TASK_VALIDATION',
  TASK_MAPPING = 'TASK_MAPPING',

  // Network Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION = 'NETWORK_CONNECTION',

  // System Errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class MCPErrorImpl extends Error {
  public readonly code: ErrorCode;
  public readonly details: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    details: Record<string, unknown> = {},
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.retryable = retryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MCPErrorImpl);
    }
  }

  public toJSON(): MCPError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  public static fromGitHubError(error: any): MCPErrorImpl {
    const status = error.status;
    const message = error.message || 'GitHub API error';

    switch (status) {
      case 401:
        return new MCPErrorImpl(
          ErrorCode.AUTH_INVALID_TOKEN,
          'Invalid GitHub authentication token',
          { status, originalMessage: message },
          false
        );

      case 403:
        if (message.includes('rate limit')) {
          return new MCPErrorImpl(
            ErrorCode.GITHUB_RATE_LIMIT,
            'GitHub API rate limit exceeded',
            { status, originalMessage: message, resetTime: error.headers?.['x-ratelimit-reset'] },
            true
          );
        }
        return new MCPErrorImpl(
          ErrorCode.GITHUB_FORBIDDEN,
          'Access forbidden to GitHub resource',
          { status, originalMessage: message },
          false
        );

      case 404:
        return new MCPErrorImpl(
          ErrorCode.GITHUB_NOT_FOUND,
          'GitHub resource not found',
          { status, originalMessage: message },
          false
        );

      case 422:
        return new MCPErrorImpl(
          ErrorCode.GITHUB_VALIDATION,
          'GitHub API validation failed',
          { status, originalMessage: message, errors: error.errors },
          false
        );

      case 500:
      case 502:
      case 503:
        return new MCPErrorImpl(
          ErrorCode.GITHUB_SERVER_ERROR,
          'GitHub server error',
          { status, originalMessage: message },
          true
        );

      default:
        return new MCPErrorImpl(
          ErrorCode.GITHUB_SERVER_ERROR,
          'Unexpected GitHub API error',
          { status, originalMessage: message },
          status >= 500
        );
    }
  }

  public static isRetryable(error: Error): boolean {
    if (error instanceof MCPErrorImpl) {
      return error.retryable;
    }

    // Check for network-related errors
    if (error.name === 'FetchError' || error.name === 'TimeoutError') {
      return true;
    }

    return false;
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error, context?: Record<string, unknown>): MCPError {
    let mcpError: MCPErrorImpl;

    if (error instanceof MCPErrorImpl) {
      mcpError = error;
    } else if (this.isGitHubError(error)) {
      mcpError = MCPErrorImpl.fromGitHubError(error);
    } else {
      mcpError = new MCPErrorImpl(
        ErrorCode.UNKNOWN_ERROR,
        error.message || 'Unknown error occurred',
        { originalError: error.name, ...context },
        false
      );
    }

    // Log the error
    logger.error(
      'Error handled',
      {
        code: mcpError.code,
        message: mcpError.message,
        retryable: mcpError.retryable,
        context,
      },
      error
    );

    return mcpError.toJSON();
  }

  public async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const mcpError = this.handleError(error as Error, context);
      throw mcpError;
    }
  }

  private isGitHubError(error: any): boolean {
    return error.status !== undefined || error.message?.includes('GitHub');
  }

  public createError(
    code: ErrorCode,
    message: string,
    details: Record<string, unknown> = {},
    retryable: boolean = false
  ): MCPErrorImpl {
    return new MCPErrorImpl(code, message, details, retryable);
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const createAuthError = (
  message: string,
  details: Record<string, unknown> = {}
): MCPErrorImpl => {
  return new MCPErrorImpl(ErrorCode.AUTH_MISSING_CREDENTIALS, message, details, false);
};

export const createGitHubRateLimitError = (resetTime?: number): MCPErrorImpl => {
  return new MCPErrorImpl(
    ErrorCode.GITHUB_RATE_LIMIT,
    'GitHub API rate limit exceeded',
    { resetTime },
    true
  );
};

export const createValidationError = (
  message: string,
  details: Record<string, unknown> = {}
): MCPErrorImpl => {
  return new MCPErrorImpl(ErrorCode.MCP_INVALID_INPUT, message, details, false);
};

export const createTaskConversionError = (taskId: string, reason: string): MCPErrorImpl => {
  return new MCPErrorImpl(
    ErrorCode.TASK_CONVERSION,
    `Failed to convert task ${taskId}`,
    { taskId, reason },
    false
  );
};
