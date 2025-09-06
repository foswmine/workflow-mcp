#!/usr/bin/env node
/**
 * WorkflowMCP Server - Complete Product Development Lifecycle Management
 * Entry point for MCP server handling PRD, Task, and Plan management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { PRDManager } from './models/PRDManager.js';
import { TaskManager } from './models/TaskManager.js';
import { PlanManager } from './models/PlanManager.js';
import { MetricsCollector } from './utils/MetricsCollector.js';
import { ErrorLogger } from './utils/ErrorLogger.js';

class WorkflowMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'workflow-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize managers
    this.prdManager = new PRDManager();
    this.taskManager = new TaskManager();
    this.planManager = new PlanManager();
    this.metricsCollector = new MetricsCollector();
    this.errorLogger = new ErrorLogger();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // PRD Management Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // PRD Tools
          {
            name: 'create_prd',
            description: 'Create a new Product Requirements Document with structured format',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'PRD title' },
                description: { type: 'string', description: 'Brief description' },
                requirements: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of functional requirements'
                },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Priority level'
                }
              },
              required: ['title', 'description', 'requirements']
            }
          },
          {
            name: 'list_prds',
            description: 'List all existing PRDs with summary information',
            inputSchema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['draft', 'approved', 'completed'],
                  description: 'Filter by status (optional)'
                }
              }
            }
          },
          {
            name: 'get_prd',
            description: 'Retrieve detailed PRD information by ID',
            inputSchema: {
              type: 'object',
              properties: {
                prd_id: { type: 'string', description: 'PRD unique identifier' }
              },
              required: ['prd_id']
            }
          },
          {
            name: 'update_prd',
            description: 'Update existing PRD with new information',
            inputSchema: {
              type: 'object',
              properties: {
                prd_id: { type: 'string', description: 'PRD unique identifier' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (title, description, requirements, etc.)'
                }
              },
              required: ['prd_id', 'updates']
            }
          }
        ]
      };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const startTime = Date.now();
        let result;

        switch (name) {
          case 'create_prd':
            result = await this.prdManager.createPRD(args);
            break;
          case 'list_prds':
            result = await this.prdManager.listPRDs(args.status);
            break;
          case 'get_prd':
            result = await this.prdManager.getPRD(args.prd_id);
            break;
          case 'update_prd':
            result = await this.prdManager.updatePRD(args.prd_id, args.updates);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // 메트릭 수집
        const duration = Date.now() - startTime;
        this.metricsCollector.recordToolUsage(name, duration, 'success');

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
        // 에러 로깅
        this.errorLogger.logError(name, error.message, args);
        this.metricsCollector.recordToolUsage(name, 0, 'error');
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      this.errorLogger.logError('uncaughtException', error.message, {});
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.errorLogger.logError('unhandledRejection', reason.toString(), { promise });
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // console.error('WorkflowMCP Server started successfully');
  }
}

// Start server
const server = new WorkflowMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default WorkflowMCPServer;