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
import { ProjectManager } from '../dashboard/src/lib/server/ProjectManager.js';
import { DocumentManager } from './models/DocumentManager.js';
import TestManager from './models/TestManager.js';
import { DevOpsManager } from '../dashboard/src/lib/server/DevOpsManager.js';
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
    this.projectManager = new ProjectManager();
    this.documentManager = new DocumentManager();
    this.testManager = new TestManager();
    this.devOpsManager = new DevOpsManager();
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
                  enum: ['high', 'medium', 'low'],
                  description: 'Priority level'
                },
                status: { 
                  type: 'string', 
                  enum: ['active', 'inactive', 'draft', 'review', 'approved', 'completed'],
                  description: 'PRD status'
                },
                project_id: { 
                  type: 'string', 
                  description: 'Related project ID (optional)' 
                },
                acceptance_criteria: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of acceptance criteria'
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
                  enum: ['active', 'inactive', 'draft', 'review', 'approved', 'completed'],
                  description: 'Filter by status (optional)'
                },
                sort_by: { 
                  type: 'string', 
                  enum: ['created_desc', 'created_asc', 'updated_desc', 'updated_asc', 'title_asc', 'title_desc'],
                  description: 'Sort order (optional)'
                },
                project_id: { 
                  type: 'string', 
                  description: 'Filter by project ID (optional)'
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
                },
                sort_by: { 
                  type: 'string', 
                  enum: ['updated_desc', 'updated_asc', 'created_desc', 'created_asc', 'title_asc', 'title_desc'],
                  description: 'Sort order (optional)',
                  default: 'updated_desc'
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
                assignee: { type: 'string', description: 'Filter by assignee (optional)' },
                sort_by: { 
                  type: 'string', 
                  enum: ['updated_desc', 'updated_asc', 'created_desc', 'created_asc', 'title_asc', 'title_desc'], 
                  description: 'Sort order (optional)', 
                  default: 'updated_desc' 
                }
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
          {
            name: 'get_document_categories',
            description: 'Get existing document categories, types and tags for selection',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
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
          // Document Relations Tools
          {
            name: 'create_document_relation',
            description: 'Create a relationship between two documents',
            inputSchema: {
              type: 'object',
              properties: {
                parent_doc_id: { type: 'integer', description: 'Parent document ID' },
                child_doc_id: { type: 'integer', description: 'Child document ID' },
                relation_type: { 
                  type: 'string', 
                  enum: ['referenced_by', 'contains', 'derived_from', 'replaces'],
                  default: 'referenced_by',
                  description: 'Type of relationship' 
                },
                notes: { type: 'string', description: 'Optional notes about the relationship' }
              },
              required: ['parent_doc_id', 'child_doc_id']
            }
          },
          {
            name: 'get_document_relations',
            description: 'Get all relationships for a specific document',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'integer', description: 'Document ID' }
              },
              required: ['document_id']
            }
          },
          {
            name: 'remove_document_relation',
            description: 'Remove a relationship between two documents',
            inputSchema: {
              type: 'object',
              properties: {
                parent_doc_id: { type: 'integer', description: 'Parent document ID' },
                child_doc_id: { type: 'integer', description: 'Child document ID' },
                relation_type: { 
                  type: 'string', 
                  enum: ['referenced_by', 'contains', 'derived_from', 'replaces'],
                  description: 'Type of relationship to remove' 
                }
              },
              required: ['parent_doc_id', 'child_doc_id', 'relation_type']
            }
          },
          {
            name: 'remove_document_link',
            description: 'Remove a link between document and entity (PRD, Task, Plan)',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'integer', description: 'Document ID' },
                entity_type: { 
                  type: 'string', 
                  enum: ['prd', 'task', 'plan'],
                  description: 'Type of entity to unlink' 
                },
                entity_id: { type: 'string', description: 'Entity ID to unlink' }
              },
              required: ['document_id', 'entity_type', 'entity_id']
            }
          },
          {
            name: 'get_document_links',
            description: 'Get all entity links for a specific document',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'integer', description: 'Document ID' }
              },
              required: ['document_id']
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
                prd_id: { type: 'string', description: 'Filter by PRD ID (optional)' },
                sort_by: { 
                  type: 'string', 
                  enum: ['updated_desc', 'updated_asc', 'created_desc', 'created_asc', 'title_asc', 'title_desc'], 
                  description: 'Sort order (optional)', 
                  default: 'updated_desc' 
                }
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
          },
          {
            name: 'get_test_connections',
            description: 'Get all connections for a specific test case (tasks, designs, requirements)',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' }
              },
              required: ['test_case_id']
            }
          },
          {
            name: 'add_test_connection',
            description: 'Add a new connection between a test case and another entity',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' },
                entity_type: { 
                  type: 'string', 
                  enum: ['task', 'design', 'prd'],
                  description: 'Type of entity to connect'
                },
                entity_id: { type: 'string', description: 'Entity unique identifier' }
              },
              required: ['test_case_id', 'entity_type', 'entity_id']
            }
          },
          {
            name: 'remove_test_connection',
            description: 'Remove a connection between a test case and another entity',
            inputSchema: {
              type: 'object',
              properties: {
                test_case_id: { type: 'string', description: 'Test case unique identifier' },
                entity_type: { 
                  type: 'string', 
                  enum: ['task', 'design', 'prd'],
                  description: 'Type of entity to disconnect'
                },
                entity_id: { type: 'string', description: 'Entity unique identifier' }
              },
              required: ['test_case_id', 'entity_type', 'entity_id']
            }
          },
          {
            name: 'get_task_connections',
            description: 'Get all connections for a specific task (PRDs, designs, documents, tests)',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task unique identifier' }
              },
              required: ['task_id']
            }
          },
          {
            name: 'add_task_connection',
            description: 'Add a new connection between a task and another entity',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task unique identifier' },
                entity_type: { 
                  type: 'string', 
                  enum: ['prd', 'design', 'document', 'test'],
                  description: 'Type of entity to connect'
                },
                entity_id: { type: 'string', description: 'ID of the entity to connect' },
                connection_type: { 
                  type: 'string', 
                  enum: ['related', 'dependent', 'blocking', 'reference'],
                  description: 'Type of connection',
                  default: 'related'
                }
              },
              required: ['task_id', 'entity_type', 'entity_id']
            }
          },
          {
            name: 'remove_task_connection',
            description: 'Remove a connection between a task and another entity',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task unique identifier' },
                entity_type: { 
                  type: 'string', 
                  enum: ['prd', 'design', 'document', 'test'],
                  description: 'Type of entity to disconnect'
                },
                entity_id: { type: 'string', description: 'ID of the entity to disconnect' }
              },
              required: ['task_id', 'entity_type', 'entity_id']
            }
          },
          // Project Management Tools
          {
            name: 'create_project',
            description: 'Create a new project with structured format',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Project name' },
                description: { type: 'string', description: 'Project description' },
                status: { 
                  type: 'string', 
                  enum: ['planning', 'active', 'on_hold', 'completed'],
                  description: 'Project status'
                },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Priority level'
                },
                manager: { type: 'string', description: 'Project manager' },
                start_date: { type: 'string', description: 'Start date (ISO string)' },
                end_date: { type: 'string', description: 'End date (ISO string)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Project tags'
                },
                notes: { type: 'string', description: 'Project notes' }
              },
              required: ['name']
            }
          },
          {
            name: 'list_projects',
            description: 'List all projects with filtering and sorting',
            inputSchema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['planning', 'active', 'on_hold', 'completed'],
                  description: 'Filter by status (optional)'
                },
                priority: { 
                  type: 'string', 
                  enum: ['High', 'Medium', 'Low'],
                  description: 'Filter by priority (optional)'
                },
                sort_by: { 
                  type: 'string', 
                  enum: ['name', 'updated_desc', 'created_desc', 'priority'],
                  description: 'Sort order (optional)'
                }
              }
            }
          },
          {
            name: 'get_project',
            description: 'Get detailed project information by ID',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: { type: 'string', description: 'Project unique identifier' }
              },
              required: ['project_id']
            }
          },
          {
            name: 'update_project',
            description: 'Update existing project with new information',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: { type: 'string', description: 'Project unique identifier' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (name, description, status, etc.)'
                }
              },
              required: ['project_id', 'updates']
            }
          },
          {
            name: 'delete_project',
            description: 'Delete a project (only if no related data exists)',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: { type: 'string', description: 'Project unique identifier' }
              },
              required: ['project_id']
            }
          },
          {
            name: 'get_project_analytics',
            description: 'Get comprehensive project analytics and progress metrics',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: { type: 'string', description: 'Project unique identifier' }
              },
              required: ['project_id']
            }
          },
          // Environment Management Tools
          {
            name: 'create_environment',
            description: 'Create a new environment with configuration',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Environment name' },
                environment_type: { 
                  type: 'string', 
                  enum: ['development', 'staging', 'production', 'testing'],
                  description: 'Type of environment'
                },
                description: { type: 'string', description: 'Environment description' },
                url: { type: 'string', description: 'Environment URL' },
                status: { 
                  type: 'string', 
                  enum: ['active', 'inactive', 'maintenance'],
                  description: 'Environment status'
                },
                project_id: { type: 'string', description: 'Related project ID (optional)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Environment tags'
                }
              },
              required: ['name', 'environment_type']
            }
          },
          {
            name: 'list_environments',
            description: 'List all environments with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                environment_type: { 
                  type: 'string', 
                  enum: ['development', 'staging', 'production', 'testing'],
                  description: 'Filter by environment type (optional)'
                },
                status: { 
                  type: 'string', 
                  enum: ['active', 'inactive', 'maintenance'],
                  description: 'Filter by status (optional)'
                },
                project_id: { type: 'string', description: 'Filter by project ID (optional)' }
              }
            }
          },
          {
            name: 'get_environment_status',
            description: 'Get detailed status and health information for an environment',
            inputSchema: {
              type: 'object',
              properties: {
                environment_id: { type: 'string', description: 'Environment unique identifier' }
              },
              required: ['environment_id']
            }
          },
          {
            name: 'update_environment',
            description: 'Update environment configuration and status',
            inputSchema: {
              type: 'object',
              properties: {
                environment_id: { type: 'string', description: 'Environment unique identifier' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (name, description, status, tags, etc.)'
                }
              },
              required: ['environment_id', 'updates']
            }
          },
          // Deployment Management Tools
          {
            name: 'create_deployment',
            description: 'Create a new deployment record with structured format',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Deployment title' },
                description: { type: 'string', description: 'Deployment description' },
                environment_id: { type: 'string', description: 'Target environment ID' },
                version: { type: 'string', description: 'Application/package version' },
                deployment_type: { 
                  type: 'string', 
                  enum: ['blue_green', 'rolling', 'canary', 'hotfix'],
                  description: 'Deployment strategy type'
                },
                status: { 
                  type: 'string', 
                  enum: ['planned', 'in_progress', 'completed', 'failed', 'rolled_back'],
                  description: 'Deployment status'
                },
                deployment_config: { 
                  type: 'object',
                  description: 'Deployment configuration (JSON object)'
                },
                scheduled_at: { type: 'string', description: 'Scheduled deployment time (ISO string)' },
                rollback_version: { type: 'string', description: 'Rollback version if needed' },
                project_id: { type: 'string', description: 'Related project ID (optional)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Deployment tags'
                },
                notes: { type: 'string', description: 'Additional deployment notes' }
              },
              required: ['title', 'description', 'environment_id', 'version']
            }
          },
          {
            name: 'list_deployments',
            description: 'List all deployments with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                environment_id: { type: 'string', description: 'Filter by environment ID (optional)' },
                status: { 
                  type: 'string', 
                  enum: ['planned', 'in_progress', 'completed', 'failed', 'rolled_back'],
                  description: 'Filter by status (optional)'
                },
                deployment_type: { 
                  type: 'string', 
                  enum: ['blue_green', 'rolling', 'canary', 'hotfix'],
                  description: 'Filter by deployment type (optional)'
                },
                project_id: { type: 'string', description: 'Filter by project ID (optional)' },
                sort_by: { 
                  type: 'string', 
                  enum: ['scheduled_desc', 'scheduled_asc', 'created_desc', 'created_asc', 'status'],
                  description: 'Sort order (optional)'
                }
              }
            }
          },
          {
            name: 'get_deployment',
            description: 'Retrieve detailed deployment information by ID',
            inputSchema: {
              type: 'object',
              properties: {
                deployment_id: { type: 'string', description: 'Deployment unique identifier' }
              },
              required: ['deployment_id']
            }
          },
          {
            name: 'update_deployment',
            description: 'Update existing deployment with new information',
            inputSchema: {
              type: 'object',
              properties: {
                deployment_id: { type: 'string', description: 'Deployment unique identifier' },
                updates: { 
                  type: 'object', 
                  description: 'Fields to update (title, description, status, deployment_type, etc.)',
                  properties: {
                    title: { type: 'string', description: 'Deployment title' },
                    description: { type: 'string', description: 'Deployment description' },
                    status: { 
                      type: 'string', 
                      enum: ['planned', 'in_progress', 'completed', 'failed', 'rolled_back'],
                      description: 'Deployment status'
                    },
                    deployment_type: { 
                      type: 'string', 
                      enum: ['blue_green', 'rolling', 'canary', 'hotfix'],
                      description: 'Deployment strategy type'
                    },
                    version: { type: 'string', description: 'Application/package version' },
                    deployment_config: { 
                      type: 'object',
                      description: 'Deployment configuration (JSON object)'
                    },
                    scheduled_at: { type: 'string', description: 'Scheduled deployment time (ISO string)' },
                    rollback_version: { type: 'string', description: 'Rollback version if needed' },
                    notes: { type: 'string', description: 'Additional deployment notes' },
                    tags: { 
                      type: 'array', 
                      items: { type: 'string' },
                      description: 'Deployment tags'
                    }
                  }
                }
              },
              required: ['deployment_id', 'updates']
            }
          },
          // Incident Management Tools  
          {
            name: 'create_incident',
            description: 'Create a new incident record for tracking operational issues',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Incident title' },
                description: { type: 'string', description: 'Detailed incident description' },
                severity: { 
                  type: 'string', 
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Incident severity level'
                },
                incident_type: { 
                  type: 'string', 
                  enum: ['outage', 'performance', 'security', 'data', 'deployment'],
                  description: 'Type of incident'
                },
                status: { 
                  type: 'string', 
                  enum: ['open', 'investigating', 'identified', 'monitoring', 'resolved'],
                  description: 'Incident status'
                },
                affected_services: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of affected services'
                },
                environment_id: { type: 'string', description: 'Affected environment ID (optional)' },
                project_id: { type: 'string', description: 'Related project ID (optional)' },
                tags: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Incident tags'
                }
              },
              required: ['title', 'description', 'severity', 'incident_type']
            }
          },
          {
            name: 'list_incidents',
            description: 'List all incidents with optional filtering and sorting',
            inputSchema: {
              type: 'object',
              properties: {
                severity: { 
                  type: 'string', 
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Filter by severity (optional)'
                },
                status: { 
                  type: 'string', 
                  enum: ['open', 'investigating', 'identified', 'monitoring', 'resolved'],
                  description: 'Filter by status (optional)'
                },
                incident_type: { 
                  type: 'string', 
                  enum: ['outage', 'performance', 'security', 'data', 'deployment'],
                  description: 'Filter by incident type (optional)'
                },
                environment_id: { type: 'string', description: 'Filter by environment ID (optional)' },
                sort_by: { 
                  type: 'string', 
                  enum: ['created_desc', 'created_asc', 'updated_desc', 'severity', 'status'],
                  description: 'Sort order (optional)'
                }
              }
            }
          },
          // System Health Tools
          {
            name: 'get_system_health',
            description: 'Get comprehensive system health status and metrics',
            inputSchema: {
              type: 'object',
              properties: {
                environment_id: { type: 'string', description: 'Environment ID (optional - if not provided, gets all environments)' },
                include_details: { 
                  type: 'boolean',
                  description: 'Include detailed metrics (default: false)'
                }
              }
            }
          },
          
          // =============================================
          // Claude Collaboration Tools (Phase 3.0)
          // =============================================
          
          // Agent Session Management
          {
            name: 'start_agent_session',
            description: 'Start a new agent session (developer or supervisor)',
            inputSchema: {
              type: 'object',
              properties: {
                agent_type: {
                  type: 'string',
                  enum: ['developer', 'supervisor'],
                  description: 'Type of agent session to start'
                },
                agent_name: {
                  type: 'string',
                  description: 'Optional display name for the agent'
                },
                project_id: {
                  type: 'string',
                  description: 'Project ID this session is working on (optional)'
                }
              },
              required: ['agent_type']
            }
          },
          {
            name: 'update_agent_status',
            description: 'Update current agent session status and activity',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: { type: 'string', description: 'Agent session ID' },
                status: {
                  type: 'string',
                  enum: ['active', 'idle', 'offline'],
                  description: 'New status'
                },
                current_activity: { type: 'string', description: 'What the agent is currently doing' },
                current_task_id: { type: 'string', description: 'Task ID currently being worked on' },
                progress_notes: { type: 'string', description: 'Latest progress notes' }
              },
              required: ['session_id']
            }
          },
          {
            name: 'get_active_sessions',
            description: 'Get all currently active agent sessions',
            inputSchema: {
              type: 'object',
              properties: {
                agent_type: {
                  type: 'string',
                  enum: ['developer', 'supervisor'],
                  description: 'Filter by agent type (optional)'
                }
              }
            }
          },
          
          // Real-time Communication
          {
            name: 'send_message',
            description: 'Send message to another agent or broadcast',
            inputSchema: {
              type: 'object',
              properties: {
                from_session_id: { type: 'string', description: 'Sender session ID' },
                to_session_id: { type: 'string', description: 'Recipient session ID (null for broadcast)' },
                message_type: {
                  type: 'string',
                  enum: ['progress_update', 'question', 'feedback', 'approval_request', 'direction_change', 'task_assignment', 'status_alert'],
                  description: 'Type of message'
                },
                subject: { type: 'string', description: 'Brief subject line' },
                content: { type: 'string', description: 'Main message content' },
                priority: {
                  type: 'string',
                  enum: ['urgent', 'high', 'normal', 'low'],
                  description: 'Message priority'
                },
                related_task_id: { type: 'string', description: 'Related task ID (optional)' },
                response_required: { type: 'boolean', description: 'Whether response is required' }
              },
              required: ['from_session_id', 'message_type', 'content']
            }
          },
          {
            name: 'get_messages',
            description: 'Get messages for current session',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: { type: 'string', description: 'Session ID to get messages for' },
                unread_only: { type: 'boolean', description: 'Only return unread messages' },
                limit: { type: 'number', description: 'Limit number of messages returned' }
              },
              required: ['session_id']
            }
          },
          {
            name: 'mark_message_read',
            description: 'Mark message as read',
            inputSchema: {
              type: 'object',
              properties: {
                message_id: { type: 'number', description: 'Message ID to mark as read' },
                session_id: { type: 'string', description: 'Session ID marking the message as read' }
              },
              required: ['message_id', 'session_id']
            }
          },
          
          // Supervisor Intervention Tools
          {
            name: 'send_intervention',
            description: 'Supervisor sends intervention to developer',
            inputSchema: {
              type: 'object',
              properties: {
                supervisor_session_id: { type: 'string', description: 'Supervisor session ID' },
                developer_session_id: { type: 'string', description: 'Target developer session ID' },
                intervention_type: {
                  type: 'string',
                  enum: ['feedback', 'direction_change', 'approval', 'rejection', 'task_reassignment', 'priority_change', 'blocking', 'unblocking'],
                  description: 'Type of intervention'
                },
                title: { type: 'string', description: 'Brief intervention title' },
                message: { type: 'string', description: 'Detailed intervention message' },
                related_task_id: { type: 'string', description: 'Related task ID (optional)' },
                priority: {
                  type: 'string',
                  enum: ['critical', 'urgent', 'normal', 'advisory'],
                  description: 'Intervention priority'
                },
                requires_immediate_action: { type: 'boolean', description: 'Whether immediate action is required' }
              },
              required: ['supervisor_session_id', 'developer_session_id', 'intervention_type', 'title', 'message']
            }
          },
          {
            name: 'get_pending_interventions',
            description: 'Get pending interventions for developer',
            inputSchema: {
              type: 'object',
              properties: {
                developer_session_id: { type: 'string', description: 'Developer session ID' },
                acknowledged_only: { type: 'boolean', description: 'Only return unacknowledged interventions' }
              },
              required: ['developer_session_id']
            }
          },
          {
            name: 'acknowledge_intervention',
            description: 'Developer acknowledges supervisor intervention',
            inputSchema: {
              type: 'object',
              properties: {
                intervention_id: { type: 'number', description: 'Intervention ID to acknowledge' },
                developer_session_id: { type: 'string', description: 'Developer session ID' },
                response: { type: 'string', description: 'Developer response to intervention' }
              },
              required: ['intervention_id', 'developer_session_id']
            }
          },
          
          // Progress Monitoring
          {
            name: 'update_task_progress',
            description: 'Update detailed task progress with snapshot',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: { type: 'string', description: 'Task ID being updated' },
                agent_session_id: { type: 'string', description: 'Agent session making the update' },
                progress_percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Progress percentage (0-100)' },
                work_description: { type: 'string', description: 'Description of work completed' },
                files_modified: { type: 'array', items: { type: 'string' }, description: 'Array of file paths modified' },
                confidence_level: { type: 'number', minimum: 1, maximum: 10, description: 'Confidence level (1-10 scale)' },
                needs_review: { type: 'boolean', description: 'Whether work needs supervisor review' }
              },
              required: ['task_id', 'agent_session_id', 'work_description']
            }
          },
          {
            name: 'monitor_active_development',
            description: 'Get real-time view of active development sessions',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: { type: 'string', description: 'Filter by project ID (optional)' }
              }
            }
          },
          
          // Approval Workflows
          {
            name: 'request_approval',
            description: 'Request approval for work or decision',
            inputSchema: {
              type: 'object',
              properties: {
                requester_session_id: { type: 'string', description: 'Session ID requesting approval' },
                workflow_type: {
                  type: 'string',
                  enum: ['task_completion', 'code_change', 'architecture_decision', 'deployment_approval', 'requirement_change'],
                  description: 'Type of approval workflow'
                },
                title: { type: 'string', description: 'Approval request title' },
                description: { type: 'string', description: 'Detailed description of what needs approval' },
                related_task_id: { type: 'string', description: 'Related task ID (optional)' }
              },
              required: ['requester_session_id', 'workflow_type', 'title', 'description']
            }
          },
          {
            name: 'get_pending_approvals',
            description: 'Get pending approval requests',
            inputSchema: {
              type: 'object',
              properties: {
                approver_session_id: { type: 'string', description: 'Approver session ID (optional)' },
                workflow_type: {
                  type: 'string',
                  enum: ['task_completion', 'code_change', 'architecture_decision', 'deployment_approval', 'requirement_change'],
                  description: 'Filter by workflow type (optional)'
                }
              }
            }
          },
          {
            name: 'approve_request',
            description: 'Approve a pending request',
            inputSchema: {
              type: 'object',
              properties: {
                approval_id: { type: 'number', description: 'Approval workflow ID' },
                approver_session_id: { type: 'string', description: 'Approver session ID' }
              },
              required: ['approval_id', 'approver_session_id']
            }
          },
          
          // Collaboration Analytics
          {
            name: 'get_collaboration_dashboard',
            description: 'Get comprehensive collaboration dashboard data',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: { type: 'string', description: 'Filter by project ID (optional)' },
                time_range: {
                  type: 'string',
                  enum: ['1hour', '6hours', '1day', '1week'],
                  description: 'Time range for analytics'
                }
              }
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
            result = await this.prdManager.listPRDs(args.status, args.sort_by, args.project_id);
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
            result = await this.designManager.listDesigns(args.status, args.design_type, args.sort_by);
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
            result = await this.taskManager.listTasks(args.status, args.assignee, args.sort_by);
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
          case 'get_test_connections':
            result = await this.getTestConnections(args.test_case_id);
            break;
          case 'add_test_connection':
            result = await this.addTestConnection(args.test_case_id, args.entity_type, args.entity_id);
            break;
          case 'remove_test_connection':
            result = await this.removeTestConnection(args.test_case_id, args.entity_type, args.entity_id);
            break;
          case 'get_task_connections':
            result = await this.getTaskConnections(args.task_id);
            break;
          case 'add_task_connection':
            result = await this.addTaskConnection(args.task_id, args.entity_type, args.entity_id, args.connection_type);
            break;
          case 'remove_task_connection':
            result = await this.removeTaskConnection(args.task_id, args.entity_type, args.entity_id);
            break;
          
          // Project management cases
          case 'create_project':
            result = await this.projectManager.createProject(args);
            break;
          case 'list_projects':
            result = await this.projectManager.listProjects(args.status, args.sort_by);
            break;
          case 'get_project':
            result = await this.projectManager.getProject(args.project_id);
            break;
          case 'update_project':
            result = await this.projectManager.updateProject(args.project_id, args.updates);
            break;
          case 'delete_project':
            result = await this.projectManager.deleteProject(args.project_id);
            break;
          case 'get_project_analytics':
            // get_project already returns analytics, so we can use the same method
            result = await this.projectManager.getProject(args.project_id);
            if (result.success) {
              result = result.analytics || result;
            }
            break;
          
          // DevOps Environment management cases
          case 'create_environment':
            result = await this.devOpsManager.createEnvironment(args);
            break;
          case 'list_environments':
            result = await this.devOpsManager.listEnvironments(args.environment_type, args.status, args.project_id);
            break;
          case 'get_environment_status':
            result = await this.devOpsManager.getEnvironmentStatus(args.environment_id);
            break;
          case 'update_environment':
            result = await this.devOpsManager.updateEnvironment(args.environment_id, args.updates);
            break;
          
          // DevOps Deployment management cases
          case 'create_deployment':
            result = await this.devOpsManager.createDeployment(args);
            break;
          case 'list_deployments':
            result = await this.devOpsManager.listDeployments(args.environment_id, args.status, args.deployment_type, args.project_id, args.sort_by);
            break;
          case 'get_deployment':
            result = await this.devOpsManager.getDeployment(args.deployment_id);
            break;
          case 'update_deployment':
            result = await this.devOpsManager.updateDeployment(args.deployment_id, args.updates);
            break;
            
          // DevOps Incident management cases
          case 'create_incident':
            result = await this.devOpsManager.createIncident(args);
            break;
          case 'list_incidents':
            result = await this.devOpsManager.listIncidents(args.severity, args.status, args.incident_type, args.environment_id, args.sort_by);
            break;
            
          // DevOps System health cases
          case 'get_system_health':
            result = await this.devOpsManager.getSystemHealth(args.environment_id, args.include_details);
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
          case 'get_document_categories':
            console.log('🚀 MCP Handler: get_document_categories case executed');
            result = await this.documentManager.getDocumentCategories();
            console.log('DEBUG - get_document_categories result:', JSON.stringify({
              doc_types_count: result.doc_types.length,
              categories_count: result.categories.length,
              total: result.total_documents,
              first_doc_type: result.doc_types[0],
              first_category: result.categories[0]
            }, null, 2));
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
          
          // Document Relations Cases
          case 'create_document_relation':
            result = await this.documentManager.createDocumentRelation(args.parent_doc_id, args.child_doc_id, args.relation_type, args.notes);
            break;
          case 'get_document_relations':
            result = await this.documentManager.getDocumentRelations(args.document_id);
            break;
          case 'remove_document_relation':
            result = await this.documentManager.removeDocumentRelation(args.parent_doc_id, args.child_doc_id, args.relation_type);
            break;
          case 'remove_document_link':
            result = await this.documentManager.removeDocumentLink(args.document_id, args.entity_type, args.entity_id);
            break;
          case 'get_document_links':
            result = await this.documentManager.getDocumentLinks(args.document_id);
            break;
          
          // =============================================
          // Collaboration Tool Cases
          // =============================================
          
          // Agent Session Management
          case 'start_agent_session':
            result = await this.startAgentSession(args);
            break;
          case 'update_agent_status':
            result = await this.updateAgentStatus(args);
            break;
          case 'get_active_sessions':
            result = await this.getActiveSessions(args);
            break;
          
          // Real-time Communication
          case 'send_message':
            result = await this.sendMessage(args);
            break;
          case 'get_messages':
            result = await this.getMessages(args);
            break;
          case 'mark_message_read':
            result = await this.markMessageRead(args);
            break;
          
          // Supervisor Intervention
          case 'send_intervention':
            result = await this.sendIntervention(args);
            break;
          case 'get_pending_interventions':
            result = await this.getPendingInterventions(args);
            break;
          case 'acknowledge_intervention':
            result = await this.acknowledgeIntervention(args);
            break;
          
          // Progress Monitoring
          case 'update_task_progress':
            result = await this.updateTaskProgress(args);
            break;
          case 'monitor_active_development':
            result = await this.monitorActiveDevelopment(args);
            break;
          
          // Approval Workflows
          case 'request_approval':
            result = await this.requestApproval(args);
            break;
          case 'get_pending_approvals':
            result = await this.getPendingApprovals(args);
            break;
          case 'approve_request':
            result = await this.approveRequest(args);
            break;
          
          // Collaboration Analytics
          case 'get_collaboration_dashboard':
            result = await this.getCollaborationDashboard(args);
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

      case 'get_document_categories':
        return `📊 문서 분류 정보 (총 ${result.total_documents}개 문서)

## 📋 문서 유형 (doc_type)
${result.doc_types.map(item => `- **${item.value}** (${item.count}개)`).join('\n')}

## 📂 카테고리 (category)  
${result.categories.map(item => `- **${item.value}** (${item.count}개)`).join('\n')}

## 🏷️ 태그 (tags)
${result.tags.slice(0, 20).map(item => `- **${item.value}** (${item.count}개)`).join('\n')}
${result.tags.length > 20 ? `\n... 외 ${result.tags.length - 20}개 태그` : ''}

**사용법**: 위 목록에서 기존 분류를 선택하거나 새로운 분류를 생성하세요.`;

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

      // Document Relations Response Formatters
      case 'create_document_relation':
        if (result.success) {
          return `📝 문서 관계 생성 완료!

**부모 문서**: [${result.parent_doc.id}] ${result.parent_doc.title}
**자식 문서**: [${result.child_doc.id}] ${result.child_doc.title}
**관계 유형**: ${result.relation_type}
${result.notes ? `**설명**: ${result.notes}` : ''}

✅ ${result.message}`;
        } else {
          return `⚠️ 문서 관계 생성 실패

**오류**: ${result.error}
**부모 문서**: [${result.parent_doc.id}] ${result.parent_doc.title}
**자식 문서**: [${result.child_doc.id}] ${result.child_doc.title}
**관계 유형**: ${result.relation_type}`;
        }

      case 'get_document_relations':
        let relationsText = `📖 문서 "${result.document_title}" 관계 정보 (총 ${result.total_relations}개)

`;

        if (result.parent_relations.length > 0) {
          relationsText += `🔼 **부모 문서들** (${result.parent_relations.length}개):
${result.parent_relations.map(rel => 
  `- [${rel.parent_id}] ${rel.parent_title} (${rel.relation_type})${rel.notes ? ` - ${rel.notes}` : ''}`
).join('\n')}

`;
        }

        if (result.child_relations.length > 0) {
          relationsText += `🔽 **자식 문서들** (${result.child_relations.length}개):
${result.child_relations.map(rel => 
  `- [${rel.child_id}] ${rel.child_title} (${rel.relation_type})${rel.notes ? ` - ${rel.notes}` : ''}`
).join('\n')}

`;
        }

        if (result.total_relations === 0) {
          relationsText += `📄 관련 문서가 없습니다.

💡 다음 도구로 관계를 만들 수 있습니다:
- \`create_document_relation\`으로 문서 간 관계 생성`;
        }

        return relationsText;

      case 'remove_document_relation':
        if (result.success) {
          return `🗑️ 문서 관계 삭제 완료!

**부모**: ${result.parent_title}
**자식**: ${result.child_title}
**관계 유형**: ${result.relation_type}

✅ ${result.message}`;
        } else {
          return `⚠️ 문서 관계 삭제 실패

**오류**: ${result.error}
**부모 문서 ID**: ${result.parent_doc_id}
**자식 문서 ID**: ${result.child_doc_id}
**관계 유형**: ${result.relation_type}`;
        }

      case 'remove_document_link':
        if (result.success) {
          return `🔗 문서 링크 삭제 완료!

**문서**: ${result.document_title}
**엔터티**: ${result.entity_type}:${result.entity_id}

✅ ${result.message}`;
        } else {
          return `⚠️ 문서 링크 삭제 실패

**오류**: ${result.error}
**문서 ID**: ${result.document_id}
**엔터티**: ${result.entity_type}:${result.entity_id}`;
        }

      case 'get_document_links':
        return `🔗 문서 "${result.document_title}" 엔터티 링크 (총 ${result.total_links}개)

${result.links.length > 0 ? 
  result.links.map(link => 
    `📎 **${link.linked_entity_type.toUpperCase()}**: ${link.linked_entity_id} (${link.link_type}) - ${new Date(link.created_at).toLocaleDateString('ko-KR')}`
  ).join('\n') 
  : 
  `📄 연결된 엔터티가 없습니다.

💡 다음 도구로 연결할 수 있습니다:
- \`link_document\`로 PRD, Task, Plan과 연결`
}`;

      case 'get_task_connections':
        const { connections } = result;
        let connectionsText = `🔗 작업 "${connections.task_title}" 연결 정보 (총 ${result.total_connections}개)

`;

        if (connections.connected_prds.length > 0) {
          connectionsText += `📋 **연결된 요구사항** (${connections.connected_prds.length}개):
${connections.connected_prds.map(prd => 
`  • [${prd.id}] ${prd.title}
    📊 ${prd.status} | 🎯 ${prd.priority} | 🔗 ${prd.connection_type}
    ${prd.description ? `📝 ${prd.description.substring(0, 100)}${prd.description.length > 100 ? '...' : ''}` : ''}`
).join('\n\n')}

`;
        }

        if (connections.connected_designs.length > 0) {
          connectionsText += `🏗️ **연결된 설계** (${connections.connected_designs.length}개):
${connections.connected_designs.map(design => 
`  • [${design.id}] ${design.title}
    🔧 ${design.design_type} | 📊 ${design.status} | 🎯 ${design.priority} | 🔗 ${design.connection_type}
    ${design.description ? `📝 ${design.description.substring(0, 100)}${design.description.length > 100 ? '...' : ''}` : ''}`
).join('\n\n')}

`;
        }

        if (connections.connected_documents.length > 0) {
          connectionsText += `📄 **연결된 문서** (${connections.connected_documents.length}개):
${connections.connected_documents.map(doc => 
`  • [${doc.id}] ${doc.title}
    📋 ${doc.doc_type} | 📊 ${doc.status} | 🔗 ${doc.connection_type}
    ${doc.summary ? `📝 ${doc.summary.substring(0, 100)}${doc.summary.length > 100 ? '...' : ''}` : ''}`
).join('\n\n')}

`;
        }

        if (connections.connected_tests.length > 0) {
          connectionsText += `🧪 **연결된 테스트** (${connections.connected_tests.length}개):
${connections.connected_tests.map(test => 
`  • [${test.id}] ${test.title}
    🔬 ${test.type} | 📊 ${test.status} | 🎯 ${test.priority} | 🔗 ${test.connection_type}
    ${test.description ? `📝 ${test.description.substring(0, 100)}${test.description.length > 100 ? '...' : ''}` : ''}`
).join('\n\n')}

`;
        }

        if (result.total_connections === 0) {
          connectionsText += `💡 **연결된 항목이 없습니다**
- \`add_task_connection\`으로 PRD, 설계, 문서, 테스트를 연결하세요`;
        }

        return connectionsText;

      case 'add_task_connection':
        return `🔗 작업 연결 추가 완료!

**작업**: ${result.task_title}
**연결 항목**: ${result.entity_type} "${result.entity_title}"
**연결 유형**: ${result.connection_type}

✅ ${result.message}`;

      case 'remove_task_connection':
        return `🔗 작업 연결 해제 완료!

**작업**: ${result.task_title}
**해제 항목**: ${result.entity_type} "${result.entity_title}"

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
      driver: sqlite3.default.Database
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
      driver: sqlite3.default.Database
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
      driver: sqlite3.default.Database
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
      driver: sqlite3.default.Database
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
      driver: sqlite3.default.Database
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

  // Task Connection Management Methods
  async getTaskConnections(task_id) {
    const sqlite3 = await import('sqlite3');
    const { open } = await import('sqlite');
    
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.default.Database
    });

    try {
      // 작업 확인
      const task = await db.get('SELECT id, title FROM tasks WHERE id = ?', [task_id]);
      if (!task) {
        throw new Error(`Task not found: ${task_id}`);
      }

      const connections = {
        task_title: task.title,
        connected_prds: [],
        connected_designs: [],
        connected_documents: [],
        connected_tests: []
      };

      // 작업의 전체 정보 조회 (prd_id, design_id 포함)
      const fullTask = await db.get('SELECT * FROM tasks WHERE id = ?', [task_id]);
      
      // 연결된 PRD 조회 (task 테이블의 prd_id 필드)
      if (fullTask.prd_id) {
        const prd = await db.get('SELECT id, title, description, status, priority FROM prds WHERE id = ?', [fullTask.prd_id]);
        if (prd) {
          connections.connected_prds.push({
            id: prd.id,
            title: prd.title,
            description: prd.description,
            status: prd.status,
            priority: prd.priority,
            connection_type: 'primary'
          });
        }
      }

      // 연결된 설계 조회 (task 테이블의 design_id 필드)
      if (fullTask.design_id) {
        const design = await db.get('SELECT id, title, description, status, priority, design_type FROM designs WHERE id = ?', [fullTask.design_id]);
        if (design) {
          connections.connected_designs.push({
            id: design.id,
            title: design.title,
            description: design.description,
            status: design.status,
            priority: design.priority,
            design_type: design.design_type,
            connection_type: 'primary'
          });
        }
      }

      // 연결된 문서 조회
      const documents = await db.all(`
        SELECT d.id, d.title, d.summary, d.doc_type, d.status, dl.link_type
        FROM documents d
        JOIN document_links dl ON d.id = dl.document_id
        WHERE dl.linked_entity_type = 'task' AND dl.linked_entity_id = ?
      `, [task_id]);
      
      connections.connected_documents = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        doc_type: doc.doc_type,
        status: doc.status,
        connection_type: doc.link_type || 'related'
      }));

      // 연결된 테스트 조회
      const tests = await db.all(`
        SELECT id, title, description, status, type, priority
        FROM test_cases
        WHERE task_id = ?
      `, [task_id]);
      
      connections.connected_tests = tests.map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        status: test.status,
        type: test.type,
        priority: test.priority,
        connection_type: 'primary'
      }));

      await db.close();
      return {
        success: true,
        connections,
        total_connections: connections.connected_prds.length + 
                         connections.connected_designs.length + 
                         connections.connected_documents.length + 
                         connections.connected_tests.length
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  async addTaskConnection(task_id, entity_type, entity_id, connection_type = 'related') {
    const sqlite3 = await import('sqlite3');
    const { open } = await import('sqlite');
    
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.default.Database
    });

    try {
      // 작업 확인
      const task = await db.get('SELECT id, title FROM tasks WHERE id = ?', [task_id]);
      if (!task) {
        throw new Error(`Task not found: ${task_id}`);
      }

      let entity = null;
      let tableName = '';
      let updateField = '';
      
      // 엔티티 타입별 처리
      switch (entity_type) {
        case 'prd':
          tableName = 'prds';
          updateField = 'prd_id';
          entity = await db.get('SELECT id, title FROM prds WHERE id = ?', [entity_id]);
          break;
        case 'design':
          tableName = 'designs';
          updateField = 'design_id';
          entity = await db.get('SELECT id, title FROM designs WHERE id = ?', [entity_id]);
          break;
        case 'document':
          tableName = 'documents';
          entity = await db.get('SELECT id, title FROM documents WHERE id = ?', [entity_id]);
          break;
        case 'test':
          tableName = 'test_cases';
          entity = await db.get('SELECT id, title FROM test_cases WHERE id = ?', [entity_id]);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entity_type}`);
      }

      if (!entity) {
        throw new Error(`${entity_type} not found: ${entity_id}`);
      }

      // 연결 처리
      if (entity_type === 'prd' || entity_type === 'design') {
        // PRD와 Design은 task 테이블의 필드 업데이트
        await db.run(`UPDATE tasks SET ${updateField} = ? WHERE id = ?`, [entity_id, task_id]);
      } else if (entity_type === 'document') {
        // 문서는 document_links 테이블 사용
        const existingLink = await db.get(`
          SELECT id FROM document_links 
          WHERE document_id = ? AND linked_entity_type = 'task' AND linked_entity_id = ?
        `, [entity_id, task_id]);

        if (!existingLink) {
          await db.run(`
            INSERT INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
            VALUES (?, 'task', ?, ?)
          `, [entity_id, task_id, connection_type]);
        }
      } else if (entity_type === 'test') {
        // 테스트는 test_cases 테이블의 task_id 필드 업데이트
        await db.run('UPDATE test_cases SET task_id = ? WHERE id = ?', [task_id, entity_id]);
      }

      await db.close();
      return {
        success: true,
        task_title: task.title,
        entity_title: entity.title,
        entity_type,
        connection_type,
        message: `${entity_type} "${entity.title}"를 작업 "${task.title}"에 연결 완료`
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  async removeTaskConnection(task_id, entity_type, entity_id) {
    const sqlite3 = await import('sqlite3');
    const { open } = await import('sqlite');
    
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.default.Database
    });

    try {
      // 작업 확인
      const task = await db.get('SELECT id, title FROM tasks WHERE id = ?', [task_id]);
      if (!task) {
        throw new Error(`Task not found: ${task_id}`);
      }

      let entity = null;
      let updateField = '';
      
      // 엔티티 타입별 처리
      switch (entity_type) {
        case 'prd':
          updateField = 'prd_id';
          entity = await db.get('SELECT id, title FROM prds WHERE id = ?', [entity_id]);
          break;
        case 'design':
          updateField = 'design_id';
          entity = await db.get('SELECT id, title FROM designs WHERE id = ?', [entity_id]);
          break;
        case 'document':
          entity = await db.get('SELECT id, title FROM documents WHERE id = ?', [entity_id]);
          break;
        case 'test':
          entity = await db.get('SELECT id, title FROM test_cases WHERE id = ?', [entity_id]);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entity_type}`);
      }

      if (!entity) {
        throw new Error(`${entity_type} not found: ${entity_id}`);
      }

      // 연결 해제 처리
      if (entity_type === 'prd' || entity_type === 'design') {
        // PRD와 Design은 task 테이블의 필드를 NULL로 설정
        await db.run(`UPDATE tasks SET ${updateField} = NULL WHERE id = ? AND ${updateField} = ?`, [task_id, entity_id]);
      } else if (entity_type === 'document') {
        // 문서는 document_links 테이블에서 삭제
        await db.run(`
          DELETE FROM document_links 
          WHERE document_id = ? AND linked_entity_type = 'task' AND linked_entity_id = ?
        `, [entity_id, task_id]);
      } else if (entity_type === 'test') {
        // 테스트는 test_cases 테이블의 task_id 필드를 NULL로 설정
        await db.run('UPDATE test_cases SET task_id = NULL WHERE id = ? AND task_id = ?', [entity_id, task_id]);
      }

      await db.close();
      return {
        success: true,
        task_title: task.title,
        entity_title: entity.title,
        entity_type,
        message: `${entity_type} "${entity.title}"와 작업 "${task.title}" 연결 해제 완료`
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  // 테스트 연결 관리 메서드들
  async getTestConnections(test_case_id) {
    try {
      const db = await this.database.getDatabase();
      
      // 테스트 케이스 정보 가져오기
      const testCase = await db.get('SELECT * FROM test_cases WHERE id = ?', [test_case_id]);
      if (!testCase) {
        return { success: false, error: 'Test case not found' };
      }

      const connections = {
        task: null,
        design: null,
        prd: null
      };

      // 연결된 작업 정보
      if (testCase.task_id) {
        const task = await db.get('SELECT id, title, status, priority FROM tasks WHERE id = ?', [testCase.task_id]);
        if (task) {
          connections.task = task;
        }
      }

      // 연결된 설계 정보
      if (testCase.design_id) {
        const design = await db.get('SELECT id, title, type, status FROM designs WHERE id = ?', [testCase.design_id]);
        if (design) {
          connections.design = design;
        }
      }

      // 연결된 요구사항 정보
      if (testCase.prd_id) {
        const prd = await db.get('SELECT id, title, status, priority FROM prds WHERE id = ?', [testCase.prd_id]);
        if (prd) {
          connections.prd = prd;
        }
      }

      return {
        success: true,
        test_case_id: test_case_id,
        test_case_title: testCase.title,
        connections: connections
      };
    } catch (error) {
      console.error('Error getting test connections:', error);
      return { success: false, error: error.message };
    }
  }

  async addTestConnection(test_case_id, entity_type, entity_id) {
    try {
      const db = await this.database.getDatabase();

      // 테스트 케이스 존재 확인
      const testCase = await db.get('SELECT id, title FROM test_cases WHERE id = ?', [test_case_id]);
      if (!testCase) {
        return { success: false, error: 'Test case not found' };
      }

      // 연결할 엔티티 확인 및 필드 결정
      let updateField, entity;
      switch (entity_type) {
        case 'task':
          updateField = 'task_id';
          entity = await db.get('SELECT id, title FROM tasks WHERE id = ?', [entity_id]);
          break;
        case 'design':
          updateField = 'design_id';
          entity = await db.get('SELECT id, title FROM designs WHERE id = ?', [entity_id]);
          break;
        case 'prd':
          updateField = 'prd_id';
          entity = await db.get('SELECT id, title FROM prds WHERE id = ?', [entity_id]);
          break;
        default:
          return { success: false, error: 'Invalid entity type. Must be task, design, or prd' };
      }

      if (!entity) {
        return { success: false, error: `${entity_type.charAt(0).toUpperCase() + entity_type.slice(1)} not found` };
      }

      // 테스트 케이스 업데이트
      await db.run(`UPDATE test_cases SET ${updateField} = ? WHERE id = ?`, [entity_id, test_case_id]);

      return {
        success: true,
        message: `Test case '${testCase.title}' connected to ${entity_type} '${entity.title}'`
      };
    } catch (error) {
      console.error('Error adding test connection:', error);
      return { success: false, error: error.message };
    }
  }

  async removeTestConnection(test_case_id, entity_type, entity_id) {
    try {
      const db = await this.database.getDatabase();

      // 테스트 케이스 존재 확인
      const testCase = await db.get('SELECT id, title FROM test_cases WHERE id = ?', [test_case_id]);
      if (!testCase) {
        return { success: false, error: 'Test case not found' };
      }

      // 연결 해제할 필드 결정
      let updateField;
      switch (entity_type) {
        case 'task':
          updateField = 'task_id';
          break;
        case 'design':
          updateField = 'design_id';
          break;
        case 'prd':
          updateField = 'prd_id';
          break;
        default:
          return { success: false, error: 'Invalid entity type. Must be task, design, or prd' };
      }

      // 현재 연결된 엔티티 확인
      const currentConnectionId = testCase[updateField];
      if (currentConnectionId !== entity_id) {
        return { success: false, error: `Test case is not connected to this ${entity_type}` };
      }

      // 연결 해제
      await db.run(`UPDATE test_cases SET ${updateField} = NULL WHERE id = ? AND ${updateField} = ?`, [test_case_id, entity_id]);

      return {
        success: true,
        message: `Test case '${testCase.title}' disconnected from ${entity_type}`
      };
    } catch (error) {
      console.error('Error removing test connection:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // Collaboration Methods Implementation
  // =============================================

  async startAgentSession({ agent_type, agent_name, project_id, notification_preferences }) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await this.storage.run(`
        INSERT INTO agent_sessions (
          id, agent_type, agent_name, project_id, 
          notification_preferences, status
        ) VALUES (?, ?, ?, ?, ?, 'active')
      `, [
        sessionId,
        agent_type,
        agent_name || null,
        project_id || null,
        notification_preferences ? JSON.stringify(notification_preferences) : null
      ]);

      return {
        success: true,
        session_id: sessionId,
        message: `${agent_type} session started successfully`
      };
    } catch (error) {
      console.error('Error starting agent session:', error);
      return { success: false, error: error.message };
    }
  }

  async updateAgentStatus({ session_id, status, current_activity, current_task_id, progress_notes }) {
    try {
      await this.storage.run(`
        UPDATE agent_sessions 
        SET status = ?, current_activity = ?, current_task_id = ?, 
            progress_notes = ?, last_activity = datetime('now'), 
            updated_at = datetime('now')
        WHERE id = ?
      `, [status, current_activity, current_task_id, progress_notes, session_id]);

      return {
        success: true,
        message: `Session ${session_id} status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating agent status:', error);
      return { success: false, error: error.message };
    }
  }

  async sendHeartbeat({ session_id }) {
    try {
      await this.storage.run(`
        UPDATE agent_sessions 
        SET last_heartbeat = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `, [session_id]);

      return {
        success: true,
        message: `Heartbeat sent for session ${session_id}`
      };
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveSessions({ agent_type, project_id }) {
    try {
      let query = `
        SELECT * FROM active_collaboration_sessions
        WHERE 1=1
      `;
      const params = [];

      if (agent_type) {
        query += ` AND agent_type = ?`;
        params.push(agent_type);
      }

      if (project_id) {
        query += ` AND project_id = ?`;
        params.push(project_id);
      }

      query += ` ORDER BY last_activity DESC`;

      const sessions = await this.storage.all(query, params);
      return {
        success: true,
        sessions,
        count: sessions.length
      };
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return { success: false, error: error.message };
    }
  }

  async endAgentSession({ session_id }) {
    try {
      await this.storage.run(`
        UPDATE agent_sessions 
        SET status = 'offline', updated_at = datetime('now')
        WHERE id = ?
      `, [session_id]);

      return {
        success: true,
        message: `Session ${session_id} ended`
      };
    } catch (error) {
      console.error('Error ending agent session:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage({ from_session_id, to_session_id, message_type, subject, content, priority = 'normal', related_task_id, related_prd_id, response_required = false, response_deadline }) {
    try {
      const result = await this.storage.run(`
        INSERT INTO collaboration_messages (
          from_session_id, to_session_id, message_type, subject, content,
          priority, related_task_id, related_prd_id, response_required, response_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        from_session_id, to_session_id, message_type, subject, content,
        priority, related_task_id, related_prd_id, response_required, response_deadline
      ]);

      return {
        success: true,
        message_id: result.lastID,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessages({ session_id, unread_only = false, message_type, limit = 50 }) {
    try {
      let query = `
        SELECT m.*, 
               from_sess.agent_name as from_agent_name,
               from_sess.agent_type as from_agent_type
        FROM collaboration_messages m
        LEFT JOIN agent_sessions from_sess ON m.from_session_id = from_sess.id
        WHERE (m.to_session_id = ? OR m.to_session_id IS NULL)
      `;
      const params = [session_id];

      if (unread_only) {
        query += ` AND m.read_status = FALSE`;
      }

      if (message_type) {
        query += ` AND m.message_type = ?`;
        params.push(message_type);
      }

      query += ` ORDER BY m.created_at DESC LIMIT ?`;
      params.push(limit);

      const messages = await this.storage.all(query, params);
      return {
        success: true,
        messages,
        count: messages.length
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  }

  async markMessageRead({ message_id, session_id }) {
    try {
      await this.storage.run(`
        UPDATE collaboration_messages 
        SET read_status = TRUE, read_at = datetime('now')
        WHERE id = ? AND (to_session_id = ? OR to_session_id IS NULL)
      `, [message_id, session_id]);

      return {
        success: true,
        message: `Message ${message_id} marked as read`
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  }

  async respondToMessage({ original_message_id, from_session_id, response_content }) {
    try {
      // Get original message details
      const originalMessage = await this.storage.get(`
        SELECT * FROM collaboration_messages WHERE id = ?
      `, [original_message_id]);

      if (!originalMessage) {
        return { success: false, error: 'Original message not found' };
      }

      // Send response message
      const result = await this.storage.run(`
        INSERT INTO collaboration_messages (
          from_session_id, to_session_id, message_type, subject, content,
          priority, related_task_id, related_prd_id
        ) VALUES (?, ?, 'feedback', ?, ?, ?, ?, ?)
      `, [
        from_session_id,
        originalMessage.from_session_id,
        `Re: ${originalMessage.subject || 'Message'}`,
        response_content,
        originalMessage.priority,
        originalMessage.related_task_id,
        originalMessage.related_prd_id
      ]);

      // Mark original as responded
      await this.storage.run(`
        UPDATE collaboration_messages 
        SET responded = TRUE
        WHERE id = ?
      `, [original_message_id]);

      return {
        success: true,
        response_message_id: result.lastID,
        message: 'Response sent successfully'
      };
    } catch (error) {
      console.error('Error responding to message:', error);
      return { success: false, error: error.message };
    }
  }

  async sendIntervention({ supervisor_session_id, developer_session_id, intervention_type, title, message, related_task_id, priority = 'normal', requires_immediate_action = false, new_status }) {
    try {
      const result = await this.storage.run(`
        INSERT INTO supervisor_interventions (
          supervisor_session_id, developer_session_id, intervention_type,
          title, message, related_task_id, priority, requires_immediate_action, new_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        supervisor_session_id, developer_session_id, intervention_type,
        title, message, related_task_id, priority, requires_immediate_action, new_status
      ]);

      return {
        success: true,
        intervention_id: result.lastID,
        message: 'Intervention sent successfully'
      };
    } catch (error) {
      console.error('Error sending intervention:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingInterventions({ developer_session_id, acknowledged_only = false }) {
    try {
      let query = `
        SELECT i.*, 
               sup.agent_name as supervisor_name,
               sup.agent_type as supervisor_type,
               t.title as task_title
        FROM supervisor_interventions i
        LEFT JOIN agent_sessions sup ON i.supervisor_session_id = sup.id
        LEFT JOIN tasks t ON i.related_task_id = t.id
        WHERE i.developer_session_id = ?
      `;
      const params = [developer_session_id];

      if (!acknowledged_only) {
        query += ` AND i.acknowledged = FALSE`;
      }

      query += ` ORDER BY i.created_at DESC`;

      const interventions = await this.storage.all(query, params);
      return {
        success: true,
        interventions,
        count: interventions.length
      };
    } catch (error) {
      console.error('Error getting pending interventions:', error);
      return { success: false, error: error.message };
    }
  }

  async acknowledgeIntervention({ intervention_id, developer_session_id, response }) {
    try {
      await this.storage.run(`
        UPDATE supervisor_interventions 
        SET acknowledged = TRUE, acknowledged_at = datetime('now'),
            developer_response = ?
        WHERE id = ? AND developer_session_id = ?
      `, [response, intervention_id, developer_session_id]);

      return {
        success: true,
        message: `Intervention ${intervention_id} acknowledged`
      };
    } catch (error) {
      console.error('Error acknowledging intervention:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTaskProgress({ task_id, agent_session_id, progress_percentage, work_description, files_modified = [], code_changes_summary, tests_added = false, tests_passed, estimated_completion_time, confidence_level, blockers_encountered = [], needs_review = false }) {
    try {
      const result = await this.storage.run(`
        INSERT INTO task_progress_snapshots (
          task_id, agent_session_id, progress_percentage, work_description,
          files_modified, code_changes_summary, tests_added, tests_passed,
          estimated_completion_time, confidence_level, blockers_encountered, needs_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task_id, agent_session_id, progress_percentage, work_description,
        JSON.stringify(files_modified), code_changes_summary, tests_added, tests_passed,
        estimated_completion_time, confidence_level, JSON.stringify(blockers_encountered), needs_review
      ]);

      return {
        success: true,
        snapshot_id: result.lastID,
        message: 'Task progress updated'
      };
    } catch (error) {
      console.error('Error updating task progress:', error);
      return { success: false, error: error.message };
    }
  }

  async getTaskProgressHistory({ task_id, limit = 20 }) {
    try {
      const progressHistory = await this.storage.all(`
        SELECT p.*, a.agent_name, a.agent_type
        FROM task_progress_snapshots p
        LEFT JOIN agent_sessions a ON p.agent_session_id = a.id
        WHERE p.task_id = ?
        ORDER BY p.created_at DESC
        LIMIT ?
      `, [task_id, limit]);

      return {
        success: true,
        progress_history: progressHistory,
        count: progressHistory.length
      };
    } catch (error) {
      console.error('Error getting task progress history:', error);
      return { success: false, error: error.message };
    }
  }

  async monitorActiveDevelopment({ project_id }) {
    try {
      let query = `
        SELECT 
          s.id, s.agent_name, s.agent_type, s.status, s.current_activity,
          s.current_task_id, s.last_activity,
          t.title as current_task_title,
          COUNT(DISTINCT m.id) as unread_messages,
          COUNT(DISTINCT i.id) as pending_interventions
        FROM agent_sessions s
        LEFT JOIN tasks t ON s.current_task_id = t.id
        LEFT JOIN collaboration_messages m ON s.id = m.to_session_id AND m.read_status = FALSE
        LEFT JOIN supervisor_interventions i ON s.id = i.developer_session_id AND i.acknowledged = FALSE
        WHERE s.status = 'active' AND s.last_heartbeat > datetime('now', '-5 minutes')
      `;
      const params = [];

      if (project_id) {
        query += ` AND s.project_id = ?`;
        params.push(project_id);
      }

      query += ` GROUP BY s.id ORDER BY s.last_activity DESC`;

      const activeSessions = await this.storage.all(query, params);
      return {
        success: true,
        active_sessions: activeSessions,
        count: activeSessions.length
      };
    } catch (error) {
      console.error('Error monitoring active development:', error);
      return { success: false, error: error.message };
    }
  }

  async requestApproval({ requester_session_id, approver_session_id, workflow_type, title, description, related_task_id, approval_deadline }) {
    try {
      const result = await this.storage.run(`
        INSERT INTO approval_workflows (
          requester_session_id, approver_session_id, workflow_type,
          title, description, related_task_id, approval_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        requester_session_id, approver_session_id, workflow_type,
        title, description, related_task_id, approval_deadline
      ]);

      return {
        success: true,
        approval_id: result.lastID,
        message: 'Approval request created'
      };
    } catch (error) {
      console.error('Error requesting approval:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingApprovals({ approver_session_id, workflow_type }) {
    try {
      let query = `
        SELECT * FROM pending_approvals_summary
        WHERE 1=1
      `;
      const params = [];

      if (approver_session_id) {
        query += ` AND approver_session_id = ?`;
        params.push(approver_session_id);
      }

      if (workflow_type) {
        query += ` AND workflow_type = ?`;
        params.push(workflow_type);
      }

      query += ` ORDER BY created_at DESC`;

      const approvals = await this.storage.all(query, params);
      return {
        success: true,
        approvals,
        count: approvals.length
      };
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return { success: false, error: error.message };
    }
  }

  async approveRequest({ approval_id, approver_session_id, conditions }) {
    try {
      await this.storage.run(`
        UPDATE approval_workflows 
        SET status = 'approved', conditions = ?
        WHERE id = ? AND (approver_session_id = ? OR approver_session_id IS NULL)
      `, [conditions, approval_id, approver_session_id]);

      return {
        success: true,
        message: `Approval ${approval_id} approved`
      };
    } catch (error) {
      console.error('Error approving request:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectRequest({ approval_id, approver_session_id, rejection_reason }) {
    try {
      await this.storage.run(`
        UPDATE approval_workflows 
        SET status = 'rejected', rejection_reason = ?
        WHERE id = ? AND (approver_session_id = ? OR approver_session_id IS NULL)
      `, [rejection_reason, approval_id, approver_session_id]);

      return {
        success: true,
        message: `Approval ${approval_id} rejected`
      };
    } catch (error) {
      console.error('Error rejecting request:', error);
      return { success: false, error: error.message };
    }
  }

  async getCollaborationDashboard({ project_id, time_range = '1day' }) {
    try {
      const timeMap = {
        '1hour': '-1 hour',
        '6hours': '-6 hours', 
        '1day': '-1 day',
        '1week': '-1 week'
      };

      const timeFilter = timeMap[time_range] || '-1 day';

      // Get recent activity
      let activityQuery = `
        SELECT * FROM recent_collaboration_activity
        WHERE created_at > datetime('now', ?)
      `;
      const params = [timeFilter];

      if (project_id) {
        // This would need to be adjusted based on how we track project relationships
        activityQuery += ` AND 1=1`; // Placeholder for project filtering
      }

      activityQuery += ` ORDER BY created_at DESC LIMIT 50`;

      const recentActivity = await this.storage.all(activityQuery, params);

      // Get active sessions
      const activeSessions = await this.getActiveSessions({ project_id });

      return {
        success: true,
        dashboard: {
          active_sessions: activeSessions.sessions || [],
          recent_activity: recentActivity,
          time_range,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting collaboration dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  async getSessionAnalytics({ session_id }) {
    try {
      // Get session details
      const session = await this.storage.get(`
        SELECT * FROM agent_sessions WHERE id = ?
      `, [session_id]);

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Get messages sent/received
      const messageStats = await this.storage.get(`
        SELECT 
          COUNT(CASE WHEN from_session_id = ? THEN 1 END) as messages_sent,
          COUNT(CASE WHEN to_session_id = ? THEN 1 END) as messages_received
        FROM collaboration_messages
        WHERE from_session_id = ? OR to_session_id = ?
      `, [session_id, session_id, session_id, session_id]);

      // Get task progress snapshots
      const progressCount = await this.storage.get(`
        SELECT COUNT(*) as progress_updates
        FROM task_progress_snapshots
        WHERE agent_session_id = ?
      `, [session_id]);

      return {
        success: true,
        analytics: {
          session,
          message_stats: messageStats,
          progress_updates: progressCount?.progress_updates || 0
        }
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      return { success: false, error: error.message };
    }
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