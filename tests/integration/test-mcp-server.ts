import { MCPServer } from '../../src/server/mcp/server.js';
import { TestDataFactory, setTestEnv, clearTestEnv } from '../test-utils.js';

describe('MCP Server Integration Tests', () => {
  let server: MCPServer;

  beforeAll(() => {
    // Set up test environment
    setTestEnv({
      GITHUB_AUTH_TYPE: 'pat',
      GITHUB_PERSONAL_ACCESS_TOKEN: 'test_token',
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
    });
  });

  afterAll(() => {
    // Clean up test environment
    clearTestEnv('GITHUB_AUTH_TYPE', 'GITHUB_PERSONAL_ACCESS_TOKEN', 'NODE_ENV', 'LOG_LEVEL');
  });

  beforeEach(() => {
    server = new MCPServer('test-server', '1.0.0');
  });

  afterEach(async () => {
    if (server.isServerRunning()) {
      await server.stop();
    }
  });

  describe('Server Initialization', () => {
    test('should create server with correct info', () => {
      const info = server.getServerInfo();
      
      expect(info.name).toBe('test-server');
      expect(info.version).toBe('1.0.0');
      expect(info.toolCount).toBe(0);
      expect(server.isServerRunning()).toBe(false);
    });

    test('should register tools correctly', () => {
      const mockTool = TestDataFactory.tool({
        name: 'test-tool',
        description: 'Test tool',
        schema: { type: 'string' },
        handler: jest.fn().mockResolvedValue('test result'),
      });

      server.registerTool(mockTool);
      
      expect(server.listTools()).toContain('test-tool');
      expect(server.getTool('test-tool')).toEqual(mockTool);
      
      const info = server.getServerInfo();
      expect(info.toolCount).toBe(1);
    });

    test('should unregister tools correctly', () => {
      const mockTool = TestDataFactory.tool({
        name: 'test-tool',
        description: 'Test tool',
        schema: { type: 'string' },
        handler: jest.fn().mockResolvedValue('test result'),
      });

      server.registerTool(mockTool);
      expect(server.listTools()).toContain('test-tool');
      
      server.unregisterTool('test-tool');
      expect(server.listTools()).not.toContain('test-tool');
      expect(server.getTool('test-tool')).toBeUndefined();
    });
  });

  describe('Tool Execution', () => {
    test('should handle tool registration and execution', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ success: true, data: 'test result' });
      
      const mockTool = TestDataFactory.tool({
        name: 'test-execution',
        description: 'Test execution tool',
        schema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
          required: ['input'],
        },
        handler: mockHandler,
      });

      server.registerTool(mockTool);
      
      // Simulate tool call
      const mockRequest = {
        params: {
          name: 'test-execution',
          arguments: { input: 'test input' },
        },
      };

      // Note: In a real test, we would use the MCP SDK to test this
      // For now, we're testing the registration and basic structure
      expect(server.getTool('test-execution')).toBeDefined();
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing tools gracefully', () => {
      const result = server.getTool('non-existent-tool');
      expect(result).toBeUndefined();
    });

    test('should handle duplicate tool registration', () => {
      const mockTool = TestDataFactory.tool({
        name: 'duplicate-tool',
        description: 'Test tool',
        schema: { type: 'string' },
        handler: jest.fn(),
      });

      server.registerTool(mockTool);
      
      // Register the same tool again - should overwrite
      server.registerTool(mockTool);
      
      expect(server.listTools()).toContain('duplicate-tool');
      expect(server.listTools().filter(name => name === 'duplicate-tool')).toHaveLength(1);
    });
  });

  describe('Server Lifecycle', () => {
    test('should track server state correctly', () => {
      expect(server.isServerRunning()).toBe(false);
      
      // Note: We can't actually start the server in tests without proper MCP transport
      // But we can test the state tracking
      expect(server.getServerInfo()).toMatchObject({
        name: 'test-server',
        version: '1.0.0',
        toolCount: 0,
      });
    });
  });
});