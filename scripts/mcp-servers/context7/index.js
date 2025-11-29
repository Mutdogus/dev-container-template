#!/usr/bin/env node

// Simple mock Context7 MCP server for testing
console.error('Context7 MCP Server v1.0.0 starting...');

// Mock functionality - just echo that we're running
setInterval(() => {
  console.error('Context7 MCP Server running...');
}, 30000);

// Handle basic commands
process.stdin.on('data', (data) => {
  const input = data.toString().trim();
  console.error(`Context7 received: ${input}`);

  // Mock responses for testing
  if (input.includes('initialize')) {
    const response = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: 'context7-mcp-server',
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
            name: 'api_lookup',
            description: 'Search for API documentation',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                language: { type: 'string' }
              },
              required: ['query']
            }
          },
          {
            name: 'code_context',
            description: 'Analyze code context',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                language: { type: 'string' }
              },
              required: ['code']
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
            text: 'Mock Context7 response: API lookup completed successfully'
          }
        ]
      }
    };
    console.log(JSON.stringify(response));
  }
});

console.error('Context7 MCP Server ready');