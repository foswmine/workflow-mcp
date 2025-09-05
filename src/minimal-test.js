#!/usr/bin/env node
/**
 * 최소한의 MCP 테스트 서버 - 간단한 도구 하나 추가
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'minimal-test',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 간단한 ping 도구 하나만 제공
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ping',
        description: 'Simple ping test',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      }
    ]
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'ping') {
    return {
      content: [
        {
          type: 'text',
          text: 'Pong! MCP server is working.'
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Minimal MCP Server connected');
}

main().catch(console.error);