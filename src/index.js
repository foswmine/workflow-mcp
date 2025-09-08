#!/usr/bin/env node
/**
 * WorkflowMCP Server - Complete Product Development Lifecycle Management
 * Entry point for MCP server handling PRD, Task, and Plan management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { PRDManager } from '../dashboard/src/lib/server/PRDManager.js';
import { TaskManager } from '../dashboard/src/lib/server/TaskManager.js';
import { DesignManager } from '../dashboard/src/lib/server/DesignManager.js';
import { DocumentManager } from './models/DocumentManager.js';
import TestManager from './models/TestManager.js';
import { MetricsCollector } from './utils/MetricsCollector.js';
import { ErrorLogger } from './utils/ErrorLogger.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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
    this.designManager = new DesignManager();
    this.documentManager = new DocumentManager();
    this.testManager = new TestManager();
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
          },
          // Design Management Tools
          {
            name: 'create_design',
            description: 'Create a new design document with structured format',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Design title' },
                description: { type: 'string', description: 'Design description' },
                design_type: { 
                  type: 'string', 
                  enum: ['system', 'architecture', 'ui_ux', 'database', 'api'],
                  description: 'Type of design'
                },
                requirement_id: { type: 'string', description: 'Related PRD/requirement ID (optional)' },
                details: { type: 'string', description: 'Detailed design specifications' },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Priority level'
                }
              },
              required: ['title', 'description', 'design_type']
            }
          },
          {
            name: 'list_designs',
            description: 'List all existing designs with summary information',
            inputSchema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['draft', 'review', 'approved', 'implemented'],
                  description: 'Filter by status (optional)'
                },
                design_type: { 
                  type: 'string', 
                  enum: ['system', 'architecture', 'ui_ux', 'database', 'api'],
                  description: 'Filter by design type (optional)'
                }
              }
            }
          },
          {
            name: 'get_design',
            description: 'Retrieve detailed design information by ID',
            inputSchema: {
              type: 'object',
              properties: {
                design_id: { type: 'string', description: 'Design unique identifier' }
              },
              required: ['design_id']
            }
          },
          {
            name: 'update_design',
            description: 'Update existing design with new information',
            inputSchema: {
              type: 'object',
              properties: {
                design_id: { type: 'string', description: 'Design unique identifier' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (title, description, status, etc.)'
                }
              },
              required: ['design_id', 'updates']
            }
          },
          {
            name: 'delete_design',
            description: 'Delete a design and its related data',
            inputSchema: {
              type: 'object',
              properties: {
                design_id: { type: 'string', description: 'Design unique identifier' }
              },
              required: ['design_id']
            }
          },
          // Task Management Tools
          {
            name: 'create_task',
            description: 'Create a new task with structured format',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Priority level'
                },
                status: { 
                  type: 'string', 
                  enum: ['pending', 'in_progress', 'done', 'blocked'],
                  description: 'Task status'
                },
                assignee: { type: 'string', description: 'Task assignee' },
                estimated_hours: { type: 'number', description: 'Estimated hours to complete' },
                due_date: { type: 'string', description: 'Due date (ISO string)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Task tags'
                },
                notes: { type: 'string', description: 'Additional notes' },
                details: { type: 'string', description: 'Detailed task specifications' }
              },
              required: ['title', 'description']
            }
          },
          {
            name: 'list_tasks',
            description: 'List all existing tasks with summary information',
            inputSchema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['pending', 'in_progress', 'done', 'blocked'],
                  description: 'Filter by status (optional)'
                },
                assignee: { type: 'string', description: 'Filter by assignee (optional)' }
              }
            }
          },
          {
            name: 'get_task',
            description: 'Retrieve detailed task information by ID',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task unique identifier' }
              },
              required: ['task_id']
            }
          },
          {
            name: 'update_task',
            description: 'Update existing task with new information',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task unique identifier' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (title, description, status, priority, etc.)'
                }
              },
              required: ['task_id', 'updates']
            }
          },
          {
            name: 'delete_task',
            description: 'Delete a task and its related data',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task unique identifier' }
              },
              required: ['task_id']
            }
          },
          // Document Management Tools
          {
            name: 'create_document',
            description: 'Create a new document and store in SQLite database',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Document title' },
                content: { type: 'string', description: 'Document content (Markdown format)' },
                doc_type: { 
                  type: 'string', 
                  enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
                  description: 'Document type' 
                },
                category: { type: 'string', description: 'Category (e.g., phase_2.6, testing)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' }, 
                  description: 'Tag list' 
                },
                summary: { type: 'string', description: 'Document summary' },
                linked_entity_type: { 
                  type: 'string', 
                  enum: ['prd', 'task', 'plan'], 
                  description: 'Entity type to link (optional)' 
                },
                linked_entity_id: { type: 'string', description: 'Entity ID to link (optional)' },
                link_type: { 
                  type: 'string', 
                  enum: ['specification', 'test_plan', 'result', 'analysis', 'notes'],
                  description: 'Link type (optional)' 
                }
              },
              required: ['title', 'content', 'doc_type']
            }
          },
          {
            name: 'search_documents',
            description: 'Search documents using full-text search',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                doc_type: { 
                  type: 'string', 
                  enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
                  description: 'Filter by document type (optional)' 
                },
                category: { type: 'string', description: 'Filter by category (optional)' },
                limit: { type: 'integer', default: 10, description: 'Limit results' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_document',
            description: 'Get specific document by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'integer', description: 'Document ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'update_document',
            description: 'Update existing document',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'integer', description: 'Document ID' },
                title: { type: 'string', description: 'Document title' },
                content: { type: 'string', description: 'Document content' },
                summary: { type: 'string', description: 'Document summary' },
                status: { 
                  type: 'string', 
                  enum: ['draft', 'review', 'approved', 'archived'],
                  description: 'Document status' 
                },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' }, 
                  description: 'Tag list' 
                }
              },
              required: ['id']
            }
          },
          {
            name: 'delete_document',
            description: 'Delete document',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'integer', description: 'Document ID' }
              },
              required: ['id']
            }
          },
          {
            name: 'list_documents',
            description: 'List documents with optional filters',
            inputSchema: {
              type: 'object',
              properties: {
                doc_type: { 
                  type: 'string', 
                  enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
                  description: 'Filter by document type' 
                },
                category: { type: 'string', description: 'Filter by category' },
                status: { 
                  type: 'string', 
                  enum: ['draft', 'review', 'approved', 'archived'],
                  description: 'Filter by status' 
                },
                limit: { type: 'integer', default: 20, description: 'Limit results' }
              }
            }
          },
          {
            name: 'link_document',
            description: 'Link document to PRD, Task, or Plan',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'integer', description: 'Document ID' },
                entity_type: { 
                  type: 'string', 
                  enum: ['prd', 'task', 'plan'],
                  description: 'Entity type to link' 
                },
                entity_id: { type: 'string', description: 'Entity ID to link' },
                link_type: { 
                  type: 'string', 
                  enum: ['specification', 'test_plan', 'result', 'analysis', 'notes'],
                  default: 'notes',
                  description: 'Link type' 
                }
              },
              required: ['document_id', 'entity_type', 'entity_id']
            }
          },
          // PRD Document Management Tools
          {
            name: 'create_prd_document',
            description: 'Create detailed document for PRD and link automatically',
            inputSchema: {
              type: 'object',
              properties: {
                prd_id: { type: 'string', description: 'PRD ID to link to' },
                title: { type: 'string', description: 'Document title' },
                content: { type: 'string', description: 'Detailed PRD content' },
                doc_type: { 
                  type: 'string', 
                  enum: ['specification', 'analysis', 'report'],
                  default: 'specification',
                  description: 'Document type' 
                },
                summary: { type: 'string', description: 'Brief summary (optional)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' }, 
                  description: 'Tag list (optional)' 
                }
              },
              required: ['prd_id', 'title', 'content']
            }
          },
          {
            name: 'get_prd_documents',
            description: 'Get all documents linked to a PRD',
            inputSchema: {
              type: 'object',
              properties: {
                prd_id: { type: 'string', description: 'PRD ID' },
                doc_type: { 
                  type: 'string', 
                  enum: ['specification', 'test_plan', 'result', 'analysis', 'notes'],
                  description: 'Filter by document type (optional)' 
                }
              },
              required: ['prd_id']
            }
          },
          {
            name: 'search_prd_documents',
            description: 'Search documents within specific PRD',
            inputSchema: {
              type: 'object',
              properties: {
                prd_id: { type: 'string', description: 'PRD ID to search within' },
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'integer', default: 10, description: 'Limit results' }
              },
              required: ['prd_id', 'query']
            }
          },
          {
            name: 'update_prd_document',
            description: 'Update document content linked to PRD',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'integer', description: 'Document ID' },
                title: { type: 'string', description: 'Updated title (optional)' },
                content: { type: 'string', description: 'Updated content (optional)' },
                summary: { type: 'string', description: 'Updated summary (optional)' },
                status: { 
                  type: 'string', 
                  enum: ['draft', 'review', 'approved', 'archived'],
                  description: 'Updated status (optional)' 
                }
              },
              required: ['document_id']
            }
          },
          {
            name: 'link_document_to_prd',
            description: 'Link existing document to PRD',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'integer', description: 'Document ID' },
                prd_id: { type: 'string', description: 'PRD ID' },
                link_type: { 
                  type: 'string', 
                  enum: ['specification', 'test_plan', 'result', 'analysis', 'notes'],
                  default: 'specification',
                  description: 'Link type' 
                }
              },
              required: ['document_id', 'prd_id']
            }
          },
          // Test Management Tools
          {
            name: 'create_test_case',
            description: 'Create a new test case with structured format',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Test case title' },
                description: { type: 'string', description: 'Test case description' },
                type: { 
                  type: 'string', 
                  enum: ['unit', 'integration', 'system', 'acceptance', 'regression'],
                  description: 'Test case type'
                },
                status: { 
                  type: 'string', 
                  enum: ['draft', 'ready', 'active', 'deprecated'],
                  description: 'Test case status'
                },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Priority level'
                },
                task_id: { type: 'string', description: 'Related task ID (optional)' },
                design_id: { type: 'string', description: 'Related design ID (optional)' },
                prd_id: { type: 'string', description: 'Related PRD ID (optional)' },
                preconditions: { type: 'string', description: 'Test preconditions' },
                test_steps: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Test execution steps'
                },
                expected_result: { type: 'string', description: 'Expected test result' },
                test_data: { type: 'object', description: 'Test data (JSON object)' },
                estimated_duration: { type: 'number', description: 'Estimated duration in minutes' },
                complexity: { 
                  type: 'string', 
                  enum: ['Low', 'Medium', 'High'],
                  description: 'Test complexity'
                },
                automation_status: { 
                  type: 'string', 
                  enum: ['manual', 'automated', 'semi_automated'],
                  description: 'Automation status'
                },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Test case tags'
                }
              },
              required: ['title', 'description']
            }
          },
          {
            name: 'list_test_cases',
            description: 'List all test cases with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['draft', 'ready', 'active', 'deprecated'],
                  description: 'Filter by status (optional)'
                },
                type: { 
                  type: 'string', 
                  enum: ['unit', 'integration', 'system', 'acceptance', 'regression'],
                  description: 'Filter by type (optional)'
                },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Filter by priority (optional)'
                },
                task_id: { type: 'string', description: 'Filter by task ID (optional)' },
                design_id: { type: 'string', description: 'Filter by design ID (optional)' },
                prd_id: { type: 'string', description: 'Filter by PRD ID (optional)' }
              }
            }
          },
          {
            name: 'get_test_case',
            description: 'Retrieve detailed test case information by ID',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' }
              },
              required: ['test_case_id']
            }
          },
          {
            name: 'update_test_case',
            description: 'Update existing test case with new information',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (title, description, status, etc.)'
                }
              },
              required: ['test_case_id', 'updates']
            }
          },
          {
            name: 'delete_test_case',
            description: 'Delete a test case and its execution history',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' }
              },
              required: ['test_case_id']
            }
          },
          {
            name: 'execute_test_case',
            description: 'Execute a test case and record the results',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' },
                status: { 
                  type: 'string', 
                  enum: ['pass', 'fail', 'blocked', 'skipped', 'pending'],
                  description: 'Execution result status'
                },
                executed_by: { type: 'string', description: 'Person who executed the test' },
                environment: { 
                  type: 'string', 
                  enum: ['development', 'staging', 'production'],
                  description: 'Test environment'
                },
                actual_result: { type: 'string', description: 'Actual test result' },
                notes: { type: 'string', description: 'Execution notes' },
                defects_found: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of defect IDs found'
                },
                actual_duration: { type: 'number', description: 'Actual duration in minutes' },
                started_at: { type: 'string', description: 'Start time (ISO string)' },
                completed_at: { type: 'string', description: 'Completion time (ISO string)' },
                attachments: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of attachment URLs/paths'
                }
              },
              required: ['test_case_id', 'status']
            }
          },
          {
            name: 'get_test_executions',
            description: 'Get test execution history for a test case',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' },
                environment: { 
                  type: 'string', 
                  enum: ['development', 'staging', 'production'],
                  description: 'Filter by environment (optional)'
                },
                limit: { type: 'number', description: 'Limit number of results (optional)' }
              },
              required: ['test_case_id']
            }
          },
          {
            name: 'get_test_summary',
            description: 'Get comprehensive test summary report with statistics',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_test_coverage',
            description: 'Get test coverage analysis by task/design/PRD',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'link_test_to_task',
            description: 'Link a test case to a specific task',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' },
                task_id: { type: 'string', description: 'Task unique identifier' }
              },
              required: ['test_case_id', 'task_id']
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
          
          // Design management cases
          case 'create_design':
            result = await this.designManager.createDesign(args);
            break;
          case 'list_designs':
            result = await this.designManager.listDesigns(args.status, args.design_type);
            break;
          case 'get_design':
            result = await this.designManager.getDesign(args.design_id);
            break;
          case 'update_design':
            result = await this.designManager.updateDesign(args.design_id, args.updates);
            break;
          case 'delete_design':
            result = await this.designManager.deleteDesign(args.design_id);
            break;
          
          // Task management cases
          case 'create_task':
            result = await this.taskManager.createTask(args);
            break;
          case 'list_tasks':
            result = await this.taskManager.listTasks(args.status, args.assignee);
            break;
          case 'get_task':
            result = await this.taskManager.getTask(args.task_id);
            break;
          case 'update_task':
            result = await this.taskManager.updateTask(args.task_id, args.updates);
            break;
          case 'delete_task':
            result = await this.taskManager.deleteTask(args.task_id);
            break;
          
          // Test management cases
          case 'create_test_case':
            result = await this.testManager.createTestCase(args);
            break;
          case 'list_test_cases':
            result = await this.testManager.listTestCases(args);
            break;
          case 'get_test_case':
            result = await this.testManager.getTestCase(args.test_case_id);
            break;
          case 'update_test_case':
            result = await this.testManager.updateTestCase(args.test_case_id, args.updates);
            break;
          case 'delete_test_case':
            result = await this.testManager.deleteTestCase(args.test_case_id);
            break;
          case 'execute_test_case':
            result = await this.testManager.executeTestCase(args.test_case_id, args);
            break;
          case 'get_test_executions':
            result = await this.testManager.getTestExecutions(args.test_case_id, args);
            break;
          case 'get_test_summary':
            result = await this.testManager.getTestSummary(args);
            break;
          case 'get_test_coverage':
            result = await this.testManager.getTestCoverage(args);
            break;
          case 'link_test_to_task':
            result = await this.testManager.linkTestToTask(args.test_case_id, args.task_id);
            break;
          
          // Document management cases
          case 'create_document':
            result = await this.documentManager.createDocument(args);
            break;
          case 'search_documents':
            result = await this.documentManager.searchDocuments(args);
            break;
          case 'get_document':
            result = await this.documentManager.getDocument(args.id);
            break;
          case 'update_document':
            result = await this.documentManager.updateDocument(args.id, args);
            break;
          case 'delete_document':
            result = await this.documentManager.deleteDocument(args.id);
            break;
          case 'list_documents':
            result = await this.documentManager.listDocuments(args);
            break;
          case 'link_document':
            result = await this.documentManager.linkDocument(args.document_id, args.entity_type, args.entity_id, args.link_type);
            break;
          // PRD Document management cases
          case 'create_prd_document':
            result = await this.createPRDDocument(args);
            break;
          case 'get_prd_documents':
            result = await this.getPRDDocuments(args.prd_id, args.doc_type);
            break;
          case 'search_prd_documents':
            result = await this.searchPRDDocuments(args.prd_id, args.query, args.limit);
            break;
          case 'update_prd_document':
            result = await this.updatePRDDocument(args.document_id, args);
            break;
          case 'link_document_to_prd':
            result = await this.linkDocumentToPRD(args.document_id, args.prd_id, args.link_type);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // 메트릭 수집
        const duration = Date.now() - startTime;
        this.metricsCollector.recordToolUsage(name, duration, 'success');

        // 문서 관련 작업의 경우 사용자 친화적인 응답 포맷
        if (name.includes('document')) {
          return {
            content: [
              {
                type: 'text',
                text: this.formatDocumentResponse(name, result)
              }
            ]
          };
        }

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

  formatDocumentResponse(toolName, result) {
    switch (toolName) {
      case 'create_document':
        return `✅ 문서가 생성되었습니다!

**문서 ID**: ${result.id}
**제목**: ${result.title}
**유형**: ${result.doc_type}
**카테고리**: ${result.category || '없음'}
**태그**: ${result.tags.length > 0 ? result.tags.join(', ') : '없음'}
${result.linked ? `**연결됨**: ${result.linked.type} #${result.linked.id} (${result.linked.link_type})` : ''}

🔍 **검색 인덱싱**: 자동으로 전문 검색 인덱스에 추가됨`;

      case 'search_documents':
        if (result.length === 0) {
          return `🔍 검색 결과가 없습니다.

💡 **검색 팁**:
- 다른 키워드 시도
- 필터 조건 완화
- 전체 문서 목록: \`list_documents\` 사용`;
        }
        return `🔍 검색 결과 (${result.length}개)

${result.map(doc => `
**[${doc.id}] ${doc.title}**
📋 유형: ${doc.doc_type} | 📂 카테고리: ${doc.category || '없음'}
📅 생성: ${new Date(doc.created_at).toLocaleDateString('ko-KR')}
📝 요약: ${doc.summary || '없음'}
🔍 발견: ${doc.snippet}
---`).join('\n')}

💡 특정 문서 보기: \`get_document\` 사용`;

      case 'get_document':
        if (!result) {
          return `❌ 문서를 찾을 수 없습니다.`;
        }
        return `📄 **${result.title}**

**문서 ID**: ${result.id}
**유형**: ${result.doc_type}
**카테고리**: ${result.category || '없음'}
**상태**: ${result.status}
**태그**: ${result.tags.join(', ') || '없음'}
**생성일**: ${new Date(result.created_at).toLocaleString('ko-KR')}
**수정일**: ${new Date(result.updated_at).toLocaleString('ko-KR')}
**작성자**: ${result.created_by}
**버전**: ${result.version}

${result.summary ? `**요약**: ${result.summary}\n` : ''}
${result.links.length > 0 ? `**연결된 항목**:\n${result.links.map(link => `- ${link.type} #${link.id} (${link.linkType})`).join('\n')}\n` : ''}

---

${result.content}`;

      case 'list_documents':
        return `📚 문서 목록 (${result.length}개)

${result.map(doc => `
**[${doc.id}] ${doc.title}**
📋 ${doc.doc_type} | 📂 ${doc.category || '없음'} | 🏷️ ${doc.status}
📅 ${new Date(doc.updated_at).toLocaleDateString('ko-KR')}
🔗 연결: ${doc.linked_entities_count}개
📝 ${doc.summary || '요약 없음'}
---`).join('\n')}

💡 **사용법**:
- 문서 보기: \`get_document\` 사용
- 검색: \`search_documents\` 사용`;

      case 'update_document':
        return `✅ 문서 ID ${result.id}가 성공적으로 업데이트되었습니다.

**업데이트된 필드**: ${result.updated_fields.join(', ')}

🔄 **버전**: 자동 증가
📅 **수정 시간**: ${new Date().toLocaleString('ko-KR')}`;

      case 'delete_document':
        return `🗑️ 문서가 삭제되었습니다.

**문서 ID**: ${result.id}
**제목**: ${result.title}

⚠️ **주의**: 연결된 링크와 관계도 함께 삭제되었습니다.`;

      case 'link_document':
        return `🔗 연결이 생성되었습니다!

**문서**: [${result.document_id}] ${result.document_title}
**연결 대상**: ${result.entity_type} #${result.entity_id}
**링크 유형**: ${result.link_type}
**상태**: ${result.is_new ? '새로 생성됨' : '이미 존재함'}`;

      case 'create_prd_document':
        return `📋 PRD 상세 문서가 생성되었습니다!

**문서 ID**: ${result.document.id}
**제목**: ${result.document.title}
**PRD**: ${result.prd_title}
**유형**: ${result.document.doc_type}
**카테고리**: prd-${result.document.category}

✅ ${result.message}`;

      case 'get_prd_documents':
        if (result.documents.length === 0) {
          return `📋 PRD "${result.prd_title}" 연결 문서가 없습니다.

💡 **제안**:
- \`create_prd_document\`로 새 문서 생성
- \`link_document_to_prd\`로 기존 문서 연결`;
        }
        
        return `📋 PRD "${result.prd_title}" 연결 문서 목록 (${result.total}개)

${result.documents.map(doc => 
`**[${doc.id}]** ${doc.title}
  📄 ${doc.doc_type} | 🔗 ${doc.link_type} | 📊 ${doc.status}
  ${doc.summary || '요약 없음'}
  📅 ${new Date(doc.updated_at).toLocaleString('ko-KR')}`
).join('\n\n')}`;

      case 'search_prd_documents':
        if (result.documents.length === 0) {
          return `🔍 PRD "${result.prd_title}"에서 "${result.query}" 검색 결과가 없습니다.

💡 **검색 팁**:
- 다른 키워드 시도
- \`get_prd_documents\`로 전체 문서 확인`;
        }
        
        return `🔍 PRD "${result.prd_title}"에서 "${result.query}" 검색 결과 (${result.total}건)

${result.documents.map(doc => 
`**[${doc.id}]** ${doc.title}
  📄 ${doc.doc_type} | 🔗 ${doc.link_type}
  ${doc.content_snippet || doc.summary || ''}
  📅 ${new Date(doc.updated_at).toLocaleString('ko-KR')}`
).join('\n\n')}`;

      case 'update_prd_document':
        return `✏️ PRD 문서 업데이트 완료!

**문서**: [${result.document.id}] ${result.document.title}
**PRD**: ${result.prd_title}
**업데이트 시간**: ${new Date().toLocaleString('ko-KR')}

✅ ${result.message}`;

      case 'link_document_to_prd':
        return `🔗 PRD-문서 연결 완료!

**문서**: ${result.document_title}
**PRD**: ${result.prd_title}
**링크 유형**: ${result.link_type}

✅ ${result.message}`;

      default:
        return JSON.stringify(result, null, 2);
    }
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

  // PRD Document Management Methods
  async createPRDDocument(args) {
    const { prd_id, title, content, doc_type = 'specification', summary, tags = [] } = args;
    
    // 먼저 PRD 존재 확인
    const prd = await this.prdManager.getPRD(prd_id);
    if (!prd.success) {
      throw new Error(`PRD not found: ${prd_id}`);
    }

    // 문서 생성
    const documentData = {
      title,
      content,
      doc_type,
      category: `prd-${prd_id}`,
      summary,
      tags,
      linked_entity_type: 'prd',
      linked_entity_id: prd_id,
      link_type: 'specification'
    };

    const result = await this.documentManager.createDocument(documentData);
    return {
      success: true,
      document: result,
      prd_title: prd.prd.title,
      message: `PRD "${prd.prd.title}"에 상세 문서 생성 완료`
    };
  }

  async getPRDDocuments(prd_id, doc_type = null) {
    // 독립적인 데이터베이스 연결 사용 (shared connection 문제 방지)
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });
    
    let query = `
      SELECT d.*, dl.link_type, dl.created_at as linked_at
      FROM documents d
      INNER JOIN document_links dl ON d.id = dl.document_id
      WHERE dl.linked_entity_type = 'prd' AND dl.linked_entity_id = ?
    `;
    const params = [prd_id];

    if (doc_type) {
      query += ` AND dl.link_type = ?`;
      params.push(doc_type);
    }

    query += ` ORDER BY d.updated_at DESC`;

    const documents = await db.all(query, params);
    await db.close();
    
    // PRD 정보도 함께 조회 
    const prd = await this.prdManager.getPRD(prd_id);
    
    return {
      success: true,
      prd_id,
      prd_title: prd.success ? prd.prd.title : 'Unknown PRD',
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        doc_type: doc.doc_type,
        link_type: doc.link_type,
        status: doc.status,
        summary: doc.summary,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        linked_at: doc.linked_at
      })),
      total: documents.length,
      message: `PRD "${prd.success ? prd.prd.title : prd_id}" 연결 문서 ${documents.length}개 조회`
    };
  }

  async searchPRDDocuments(prd_id, query, limit = 10) {
    // PRD 정보 먼저 조회
    const prd = await this.prdManager.getPRD(prd_id);
    
    // 새로운 데이터베이스 연결 생성 (DocumentManager 인스턴스를 재사용하지 않음)
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });
    
    const searchQuery = `
      SELECT d.*, dl.link_type,
        snippet(documents_fts, 1, '<mark>', '</mark>', '...', 20) as content_snippet
      FROM documents d
      INNER JOIN document_links dl ON d.id = dl.document_id
      INNER JOIN documents_fts ON documents_fts.rowid = d.id
      WHERE dl.linked_entity_type = 'prd' 
        AND dl.linked_entity_id = ?
        AND documents_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `;

    const documents = await db.all(searchQuery, [prd_id, query, limit]);
    await db.close();

    return {
      success: true,
      prd_id,
      prd_title: prd.success ? prd.prd.title : 'Unknown PRD',
      query,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        doc_type: doc.doc_type,
        link_type: doc.link_type,
        status: doc.status,
        summary: doc.summary,
        content_snippet: doc.content_snippet,
        updated_at: doc.updated_at
      })),
      total: documents.length,
      message: `PRD "${prd.success ? prd.prd.title : prd_id}"에서 "${query}" 검색 결과 ${documents.length}건`
    };
  }

  async updatePRDDocument(document_id, updates) {
    // 문서가 PRD와 연결되어 있는지 확인
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });
    
    const linkCheck = await db.get(`
      SELECT dl.linked_entity_id as prd_id, d.title
      FROM document_links dl
      INNER JOIN documents d ON dl.document_id = d.id
      WHERE dl.document_id = ? AND dl.linked_entity_type = 'prd'
    `, [document_id]);

    await db.close();

    if (!linkCheck) {
      throw new Error('Document not found or not linked to any PRD');
    }

    // 직접 문서 업데이트 (DocumentManager 우회)
    const updateDb = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });

    let updateFields = [];
    let updateValues = [];
    
    if (updates.title) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }
    if (updates.content) {
      updateFields.push('content = ?');
      updateValues.push(updates.content);
    }
    if (updates.summary) {
      updateFields.push('summary = ?');
      updateValues.push(updates.summary);
    }
    if (updates.status) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(document_id);

    await updateDb.run(`
      UPDATE documents 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // 업데이트된 문서 조회
    const updatedDoc = await updateDb.get('SELECT * FROM documents WHERE id = ?', [document_id]);
    await updateDb.close();
    
    // PRD 정보 조회
    const prd = await this.prdManager.getPRD(linkCheck.prd_id);

    return {
      success: true,
      document: updatedDoc,
      prd_id: linkCheck.prd_id,
      prd_title: prd.success ? prd.prd.title : 'Unknown PRD',
      message: `PRD "${prd.success ? prd.prd.title : linkCheck.prd_id}" 연결 문서 "${linkCheck.title}" 업데이트 완료`
    };
  }

  async linkDocumentToPRD(document_id, prd_id, link_type = 'specification') {
    // PRD 존재 확인
    const prd = await this.prdManager.getPRD(prd_id);
    if (!prd.success) {
      throw new Error(`PRD not found: ${prd_id}`);
    }

    // 문서 존재 확인 및 연결 생성 (직접 구현)
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });

    // 문서 확인
    const document = await db.get('SELECT id, title FROM documents WHERE id = ?', [document_id]);
    if (!document) {
      await db.close();
      throw new Error(`Document not found: ${document_id}`);
    }

    // 연결 생성 (중복 확인)
    const existingLink = await db.get(`
      SELECT id FROM document_links 
      WHERE document_id = ? AND linked_entity_type = 'prd' AND linked_entity_id = ?
    `, [document_id, prd_id]);

    if (!existingLink) {
      await db.run(`
        INSERT INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
        VALUES (?, 'prd', ?, ?)
      `, [document_id, prd_id, link_type]);
    }

    await db.close();
    
    return {
      success: true,
      document_title: document.title,
      prd_title: prd.prd.title,
      link_type,
      is_new: !existingLink,
      message: `문서 "${document.title}"를 PRD "${prd.prd.title}"에 연결 완료 (${link_type})`
    };
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