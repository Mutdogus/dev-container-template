#!/usr/bin/env node

// Simple mock Playwright MCP server for testing
console.error('Playwright MCP Server v1.0.0 starting...');

// Mock functionality - just echo that we're running
setInterval(() => {
  console.error('Playwright MCP Server running...');
}, 30000);

// Handle basic commands
process.stdin.on('data', (data) => {
  const input = data.toString().trim();
  console.error(`Playwright received: ${input}`);

  // Mock responses for testing
  if (input.includes('initialize')) {
    const response = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false,
          }
        },
        serverInfo: {
          name: 'playwright-mcp-server',
          version: '1.0.0'
        }
      }
    };
    console.log(JSON.stringify(response));
  } else if (input.includes('tools/list')) {
    const response = {
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: [
          {
            name: 'run_test',
            description: 'Execute Playwright tests',
            inputSchema: {
              type: 'object',
              properties: {
                test_file: { type: 'string' },
                browser: { type: 'string', enum: ['chromium', 'firefox', 'webkit'] }
              },
              required: ['test_file']
            }
          },
          {
            name: 'take_screenshot',
            description: 'Capture webpage screenshot',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                selector: { type: 'string' }
              },
              required: ['url']
            }
          }
        ]
      }
    };
    console.log(JSON.stringify(response));
  } else if (input.includes('tools/call')) {
    // Mock tool call response
    const response = {
      jsonrpc: '2.0',
      id: 3,
      result: {
        content: [
          {
            type: 'text',
            text: 'Mock Playwright response: Test execution completed successfully'
          }
        ]
      }
    };
    console.log(JSON.stringify(response));
  }
});

console.error('Playwright MCP Server ready');