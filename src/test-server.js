#!/usr/bin/env node
/**
 * Simple WorkflowMCP Test Server with File Storage
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { FileStorage } from './utils/FileStorage.js';

const server = new Server(
  {
    name: 'workflow-mcp-test',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// FileStorage 초기화
const prdStorage = new FileStorage('prds');
const taskStorage = new FileStorage('tasks');
const planStorage = new FileStorage('plans');

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
        description: 'List all PRDs',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_prd',
        description: 'Get detailed information of a specific PRD by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'PRD ID to retrieve' }
          },
          required: ['id']
        }
      },
      {
        name: 'update_prd',
        description: 'Update an existing PRD',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'PRD ID to update' },
            title: { type: 'string', description: 'Updated PRD title' },
            description: { type: 'string', description: 'Updated description' },
            requirements: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Updated requirements list'
            },
            priority: { 
              type: 'string', 
              enum: ['High', 'Medium', 'Low'],
              description: 'Updated priority level'
            },
            status: {
              type: 'string',
              enum: ['draft', 'review', 'approved', 'archived'],
              description: 'Updated status'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'create_task',
        description: 'Create a new task with PRD association',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            prd_id: { type: 'string', description: 'Associated PRD ID' },
            priority: { 
              type: 'string', 
              enum: ['High', 'Medium', 'Low'],
              description: 'Task priority'
            },
            assignee: { type: 'string', description: 'Task assignee' },
            estimatedHours: { type: 'number', description: 'Estimated hours to complete' },
            dueDate: { type: 'string', description: 'Due date (ISO string)' }
          },
          required: ['title', 'description']
        }
      },
      {
        name: 'list_tasks',
        description: 'List all tasks with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['todo', 'in_progress', 'done', 'blocked'],
              description: 'Filter by status'
            },
            prd_id: { type: 'string', description: 'Filter by PRD ID' },
            assignee: { type: 'string', description: 'Filter by assignee' }
          },
          additionalProperties: false
        }
      },
      {
        name: 'get_task',
        description: 'Get detailed information of a specific task by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID to retrieve' }
          },
          required: ['id']
        }
      },
      {
        name: 'update_task',
        description: 'Update an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID to update' },
            title: { type: 'string', description: 'Updated task title' },
            description: { type: 'string', description: 'Updated description' },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done', 'blocked'],
              description: 'Updated status'
            },
            priority: { 
              type: 'string', 
              enum: ['High', 'Medium', 'Low'],
              description: 'Updated priority'
            },
            assignee: { type: 'string', description: 'Updated assignee' },
            estimatedHours: { type: 'number', description: 'Updated estimated hours' },
            dueDate: { type: 'string', description: 'Updated due date (ISO string)' }
          },
          required: ['id']
        }
      },
      {
        name: 'create_plan',
        description: 'Create a new development plan with milestones',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Plan title' },
            description: { type: 'string', description: 'Plan description' },
            prd_id: { type: 'string', description: 'Associated PRD ID' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  dueDate: { type: 'string' }
                },
                required: ['title']
              },
              description: 'Plan milestones'
            },
            startDate: { type: 'string', description: 'Plan start date' },
            endDate: { type: 'string', description: 'Plan end date' }
          },
          required: ['title', 'description']
        }
      },
      {
        name: 'list_plans',
        description: 'List all plans with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            prd_id: { type: 'string', description: 'Filter by PRD ID' },
            status: { 
              type: 'string', 
              enum: ['active', 'completed', 'paused', 'cancelled'],
              description: 'Filter by status'
            }
          },
          additionalProperties: false
        }
      },
      {
        name: 'get_plan',
        description: 'Get detailed information of a specific plan by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Plan ID to retrieve' }
          },
          required: ['id']
        }
      },
      {
        name: 'update_plan',
        description: 'Update an existing plan',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Plan ID to update' },
            title: { type: 'string', description: 'Updated plan title' },
            description: { type: 'string', description: 'Updated description' },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'paused', 'cancelled'],
              description: 'Updated status'
            },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  dueDate: { type: 'string' },
                  completed: { type: 'boolean' }
                }
              },
              description: 'Updated milestones'
            },
            startDate: { type: 'string', description: 'Updated start date' },
            endDate: { type: 'string', description: 'Updated end date' }
          },
          required: ['id']
        }
      },
      // Group 5: Utility Tools
      {
        name: 'get_metrics',
        description: 'Get comprehensive project metrics across PRDs, Tasks, and Plans',
        inputSchema: {
          type: 'object',
          properties: {
            includeDetails: { 
              type: 'boolean', 
              description: 'Include detailed breakdown by status/priority' 
            }
          }
        }
      },
      {
        name: 'validate_prd',
        description: 'Validate PRD structure and completeness',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'PRD ID to validate' }
          },
          required: ['id']
        }
      },
      {
        name: 'export_data',
        description: 'Export project data in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'summary', 'csv'],
              description: 'Export format'
            },
            dataType: {
              type: 'string',
              enum: ['prds', 'tasks', 'plans', 'all'],
              description: 'Data type to export'
            }
          },
          required: ['format', 'dataType']
        }
      },
      // Phase 2-1: 안전한 삭제 기능
      {
        name: 'delete_prd',
        description: 'Safely delete a PRD after checking dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'PRD ID to delete' },
            force: { 
              type: 'boolean', 
              description: 'Force delete even with dependencies (default: false)' 
            }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_task',
        description: 'Safely delete a Task after checking plan connections',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID to delete' },
            force: { 
              type: 'boolean', 
              description: 'Force delete even with plan connections (default: false)' 
            }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_plan',
        description: 'Safely delete a Plan after handling related tasks',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Plan ID to delete' },
            cleanup: { 
              type: 'string',
              enum: ['keep', 'orphan', 'delete'],
              description: 'How to handle related tasks: keep(유지), orphan(연결해제), delete(함께삭제)'
            }
          },
          required: ['id']
        }
      },
      // Phase 2-2: 데이터 연결 시스템
      {
        name: 'link_prd_to_plan',
        description: 'Link a PRD to a Plan for project tracking',
        inputSchema: {
          type: 'object',
          properties: {
            prd_id: { type: 'string', description: 'PRD ID to link' },
            plan_id: { type: 'string', description: 'Plan ID to link to' }
          },
          required: ['prd_id', 'plan_id']
        }
      },
      {
        name: 'link_plan_to_tasks',
        description: 'Link a Plan to multiple Tasks for workflow management',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: { type: 'string', description: 'Plan ID' },
            task_ids: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Array of Task IDs to link'
            }
          },
          required: ['plan_id', 'task_ids']
        }
      },
      {
        name: 'get_linked_data',
        description: 'Get all linked data for a specific item (PRD/Plan/Task)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID of PRD, Plan, or Task' },
            type: {
              type: 'string',
              enum: ['prd', 'plan', 'task'],
              description: 'Type of the item'
            }
          },
          required: ['id', 'type']
        }
      },
      {
        name: 'unlink_items',
        description: 'Remove connection between two items',
        inputSchema: {
          type: 'object',
          properties: {
            item1_id: { type: 'string', description: 'First item ID' },
            item2_id: { type: 'string', description: 'Second item ID' },
            item1_type: {
              type: 'string',
              enum: ['prd', 'plan', 'task'],
              description: 'Type of first item'
            },
            item2_type: {
              type: 'string',
              enum: ['prd', 'plan', 'task'],
              description: 'Type of second item'
            }
          },
          required: ['item1_id', 'item2_id', 'item1_type', 'item2_type']
        }
      },
      {
        name: 'sync_plan_progress',
        description: 'Automatically calculate and update Plan progress based on linked Tasks',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: { type: 'string', description: 'Plan ID to sync' }
          },
          required: ['plan_id']
        }
      },
      // Phase 2-3: 의존성 관리 시스템
      {
        name: 'add_task_dependency',
        description: 'Add dependency between tasks (task A must complete before task B can start)',
        inputSchema: {
          type: 'object',
          properties: {
            dependent_task_id: { type: 'string', description: 'Task that depends on another' },
            prerequisite_task_id: { type: 'string', description: 'Task that must be completed first' }
          },
          required: ['dependent_task_id', 'prerequisite_task_id']
        }
      },
      {
        name: 'remove_task_dependency',
        description: 'Remove dependency between two tasks',
        inputSchema: {
          type: 'object',
          properties: {
            dependent_task_id: { type: 'string', description: 'Dependent task ID' },
            prerequisite_task_id: { type: 'string', description: 'Prerequisite task ID' }
          },
          required: ['dependent_task_id', 'prerequisite_task_id']
        }
      },
      {
        name: 'get_task_dependencies',
        description: 'Get all dependencies for a specific task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID to check dependencies' }
          },
          required: ['task_id']
        }
      },
      {
        name: 'validate_workflow',
        description: 'Validate workflow for circular dependencies and logical consistency',
        inputSchema: {
          type: 'object',
          properties: {
            plan_id: { 
              type: 'string', 
              description: 'Plan ID to validate (optional - validates all if not provided)' 
            }
          }
        }
      },
      {
        name: 'auto_update_task_status',
        description: 'Automatically update task statuses based on dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            trigger_task_id: { 
              type: 'string', 
              description: 'Task that was just completed (optional - checks all if not provided)' 
            }
          }
        }
      },
      
      // === Phase 2-4: Basic Dashboard ===
      {
        name: 'get_project_dashboard',
        description: 'Get comprehensive project dashboard with status overview',
        inputSchema: {
          type: 'object',
          properties: {
            include_details: { 
              type: 'boolean', 
              description: 'Include detailed task and plan information',
              default: false
            }
          }
        }
      },
      {
        name: 'get_workflow_status',
        description: 'Get current workflow status and bottlenecks',
        inputSchema: {
          type: 'object',
          properties: {
            analyze_blockers: { 
              type: 'boolean', 
              description: 'Analyze blocking tasks and dependencies',
              default: true
            }
          }
        }
      },
      {
        name: 'get_progress_timeline',
        description: 'Get project progress timeline and milestones',
        inputSchema: {
          type: 'object',
          properties: {
            time_period: { 
              type: 'string', 
              enum: ['7days', '30days', 'all'],
              description: 'Time period to analyze',
              default: '30days'
            }
          }
        }
      }
    ]
  };
});

// 순환 의존성 체크 헬퍼 함수
async function checkCircularDependency(startTaskId, targetTaskId) {
  const visited = new Set();
  const stack = [targetTaskId];
  
  while (stack.length > 0) {
    const currentTaskId = stack.pop();
    
    if (currentTaskId === startTaskId) {
      return true; // 순환 의존성 발견
    }
    
    if (visited.has(currentTaskId)) {
      continue;
    }
    
    visited.add(currentTaskId);
    
    try {
      const currentTask = await taskStorage.load(currentTaskId);
      if (currentTask && currentTask.dependencies) {
        stack.push(...currentTask.dependencies);
      }
    } catch (error) {
      // Task를 로드할 수 없는 경우 무시
      continue;
    }
  }
  
  return false; // 순환 의존성 없음
}

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const args = request.params.arguments || {};

  try {
    switch (name) {
      case 'create_prd':
        const prd = {
          id: `prd_${Date.now()}`,
          title: args.title,
          description: args.description,
          requirements: args.requirements,
          priority: args.priority || 'Medium',
          createdAt: new Date().toISOString(),
          status: 'draft'
        };

        // 실제로 파일에 저장
        try {
          await prdStorage.save(prd.id, prd);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ PRD 생성 및 저장 성공!\n\n**제목**: ${prd.title}\n**설명**: ${prd.description}\n**우선순위**: ${prd.priority}\n**요구사항 수**: ${prd.requirements.length}\n**ID**: ${prd.id}\n**상태**: ${prd.status}\n**생성일**: ${prd.createdAt}\n**저장 위치**: data/prds/${prd.id}.json\n\n**요구사항 목록:**\n${prd.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD 저장 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'list_prds':
        try {
          const prds = await prdStorage.listAll();
          
          if (prds.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: '📋 등록된 PRD 목록:\n\n현재 저장된 PRD가 없습니다. create_prd 도구로 PRD를 생성해보세요!'
                }
              ]
            };
          }
          
          const prdList = prds.map((prd, index) => 
            `${index + 1}. **${prd.title}** (${prd.id})\n   - 설명: ${prd.description}\n   - 우선순위: ${prd.priority}\n   - 상태: ${prd.status}\n   - 생성일: ${prd.createdAt}`
          ).join('\n\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 등록된 PRD 목록 (총 ${prds.length}개):\n\n${prdList}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD 목록 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'get_prd':
        try {
          const prd = await prdStorage.load(args.id);
          
          if (!prd) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ PRD를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 **PRD 상세 정보**\n\n**ID**: ${prd.id}\n**제목**: ${prd.title}\n**설명**: ${prd.description}\n**우선순위**: ${prd.priority}\n**상태**: ${prd.status}\n**생성일**: ${prd.createdAt}\n**수정일**: ${prd.updatedAt || '없음'}\n\n**요구사항 목록** (${prd.requirements.length}개):\n${prd.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'update_prd':
        try {
          // 기존 PRD 조회
          const existingPrd = await prdStorage.load(args.id);
          
          if (!existingPrd) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ PRD를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 업데이트할 필드들만 적용
          const updatedPrd = {
            ...existingPrd,
            ...(args.title && { title: args.title }),
            ...(args.description && { description: args.description }),
            ...(args.requirements && { requirements: args.requirements }),
            ...(args.priority && { priority: args.priority }),
            ...(args.status && { status: args.status }),
            updatedAt: new Date().toISOString()
          };
          
          // 업데이트된 PRD 저장
          await prdStorage.save(args.id, updatedPrd);
          
          const changedFields = [];
          if (args.title) changedFields.push(`제목: ${args.title}`);
          if (args.description) changedFields.push(`설명: ${args.description}`);
          if (args.requirements) changedFields.push(`요구사항: ${args.requirements.length}개`);
          if (args.priority) changedFields.push(`우선순위: ${args.priority}`);
          if (args.status) changedFields.push(`상태: ${args.status}`);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ PRD 업데이트 성공!\n\n**ID**: ${updatedPrd.id}\n**제목**: ${updatedPrd.title}\n**수정일**: ${updatedPrd.updatedAt}\n\n**변경된 필드들**:\n${changedFields.map(field => `- ${field}`).join('\n')}\n\n**현재 요구사항 목록** (${updatedPrd.requirements.length}개):\n${updatedPrd.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD 업데이트 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'create_task':
        try {
          const task = {
            id: `task_${Date.now()}`,
            title: args.title,
            description: args.description,
            prd_id: args.prd_id || null,
            status: 'todo',
            priority: args.priority || 'Medium',
            assignee: args.assignee || 'Unassigned',
            estimatedHours: args.estimatedHours || 0,
            dueDate: args.dueDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // PRD 연결 확인
          let prdTitle = '';
          if (task.prd_id) {
            const linkedPrd = await prdStorage.load(task.prd_id);
            prdTitle = linkedPrd ? ` (연결된 PRD: ${linkedPrd.title})` : ' (PRD를 찾을 수 없음)';
          }

          await taskStorage.save(task.id, task);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Task 생성 및 저장 성공!\n\n**제목**: ${task.title}\n**설명**: ${task.description}\n**상태**: ${task.status}\n**우선순위**: ${task.priority}\n**담당자**: ${task.assignee}\n**예상 시간**: ${task.estimatedHours}시간\n**마감일**: ${task.dueDate || '미설정'}\n**ID**: ${task.id}${prdTitle}\n**생성일**: ${task.createdAt}\n**저장 위치**: data/tasks/${task.id}.json`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 저장 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'list_tasks':
        try {
          let tasks = await taskStorage.listAll();
          
          // 필터링 적용
          if (args.status) {
            tasks = tasks.filter(task => task.status === args.status);
          }
          if (args.prd_id) {
            tasks = tasks.filter(task => task.prd_id === args.prd_id);
          }
          if (args.assignee) {
            tasks = tasks.filter(task => task.assignee === args.assignee);
          }
          
          if (tasks.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: '📋 현재 저장된 Task가 없습니다. create_task 도구로 Task를 생성해보세요!'
                }
              ]
            };
          }
          
          const taskList = tasks.map((task, index) => 
            `${index + 1}. **${task.title}** (${task.id})\n   - 설명: ${task.description}\n   - 상태: ${task.status} | 우선순위: ${task.priority} | 담당자: ${task.assignee}\n   - 예상시간: ${task.estimatedHours}h | 마감일: ${task.dueDate || '미설정'}\n   - 생성일: ${task.createdAt}`
          ).join('\n\n');
          
          const filterInfo = [];
          if (args.status) filterInfo.push(`상태: ${args.status}`);
          if (args.prd_id) filterInfo.push(`PRD: ${args.prd_id}`);
          if (args.assignee) filterInfo.push(`담당자: ${args.assignee}`);
          const filterText = filterInfo.length > 0 ? ` (필터: ${filterInfo.join(', ')})` : '';
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 Task 목록${filterText} (총 ${tasks.length}개):\n\n${taskList}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 목록 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'get_task':
        try {
          const task = await taskStorage.load(args.id);
          
          if (!task) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Task를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }

          // 연결된 PRD 정보 조회
          let prdInfo = '';
          if (task.prd_id) {
            const linkedPrd = await prdStorage.load(task.prd_id);
            prdInfo = linkedPrd 
              ? `\n**연결된 PRD**: ${linkedPrd.title} (${task.prd_id})`
              : `\n**연결된 PRD**: 삭제됨 (${task.prd_id})`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 **Task 상세 정보**\n\n**ID**: ${task.id}\n**제목**: ${task.title}\n**설명**: ${task.description}\n**상태**: ${task.status}\n**우선순위**: ${task.priority}\n**담당자**: ${task.assignee}\n**예상 시간**: ${task.estimatedHours}시간\n**마감일**: ${task.dueDate || '미설정'}\n**생성일**: ${task.createdAt}\n**수정일**: ${task.updatedAt || '없음'}${prdInfo}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'update_task':
        try {
          const existingTask = await taskStorage.load(args.id);
          
          if (!existingTask) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Task를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 업데이트할 필드들만 적용
          const updatedTask = {
            ...existingTask,
            ...(args.title && { title: args.title }),
            ...(args.description && { description: args.description }),
            ...(args.status && { status: args.status }),
            ...(args.priority && { priority: args.priority }),
            ...(args.assignee && { assignee: args.assignee }),
            ...(args.estimatedHours !== undefined && { estimatedHours: args.estimatedHours }),
            ...(args.dueDate && { dueDate: args.dueDate }),
            updatedAt: new Date().toISOString()
          };
          
          await taskStorage.save(args.id, updatedTask);
          
          const changedFields = [];
          if (args.title) changedFields.push(`제목: ${args.title}`);
          if (args.description) changedFields.push(`설명: ${args.description}`);
          if (args.status) changedFields.push(`상태: ${args.status}`);
          if (args.priority) changedFields.push(`우선순위: ${args.priority}`);
          if (args.assignee) changedFields.push(`담당자: ${args.assignee}`);
          if (args.estimatedHours !== undefined) changedFields.push(`예상시간: ${args.estimatedHours}h`);
          if (args.dueDate) changedFields.push(`마감일: ${args.dueDate}`);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Task 업데이트 성공!\n\n**ID**: ${updatedTask.id}\n**제목**: ${updatedTask.title}\n**상태**: ${updatedTask.status}\n**수정일**: ${updatedTask.updatedAt}\n\n**변경된 필드들**:\n${changedFields.map(field => `- ${field}`).join('\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 업데이트 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'create_plan':
        try {
          const plan = {
            id: `plan_${Date.now()}`,
            title: args.title,
            description: args.description,
            prd_id: args.prd_id || null,
            status: 'active',
            milestones: args.milestones || [],
            startDate: args.startDate || new Date().toISOString(),
            endDate: args.endDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // PRD 연결 확인
          let prdTitle = '';
          if (plan.prd_id) {
            const linkedPrd = await prdStorage.load(plan.prd_id);
            prdTitle = linkedPrd ? ` (연결된 PRD: ${linkedPrd.title})` : ' (PRD를 찾을 수 없음)';
          }

          await planStorage.save(plan.id, plan);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Plan 생성 및 저장 성공!\n\n**제목**: ${plan.title}\n**설명**: ${plan.description}\n**상태**: ${plan.status}\n**시작일**: ${plan.startDate}\n**종료일**: ${plan.endDate || '미설정'}\n**마일스톤 수**: ${plan.milestones.length}개\n**ID**: ${plan.id}${prdTitle}\n**생성일**: ${plan.createdAt}\n**저장 위치**: data/plans/${plan.id}.json`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan 저장 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'list_plans':
        try {
          let plans = await planStorage.listAll();
          
          // 필터링 적용
          if (args.status) {
            plans = plans.filter(plan => plan.status === args.status);
          }
          if (args.prd_id) {
            plans = plans.filter(plan => plan.prd_id === args.prd_id);
          }
          
          if (plans.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: '📋 현재 저장된 Plan이 없습니다. create_plan 도구로 Plan을 생성해보세요!'
                }
              ]
            };
          }
          
          const planList = plans.map((plan, index) => 
            `${index + 1}. **${plan.title}** (${plan.id})\n   - 설명: ${plan.description}\n   - 상태: ${plan.status} | 마일스톤: ${plan.milestones.length}개\n   - 기간: ${plan.startDate.split('T')[0]} ~ ${plan.endDate ? plan.endDate.split('T')[0] : '미설정'}\n   - 생성일: ${plan.createdAt}`
          ).join('\n\n');
          
          const filterInfo = [];
          if (args.status) filterInfo.push(`상태: ${args.status}`);
          if (args.prd_id) filterInfo.push(`PRD: ${args.prd_id}`);
          const filterText = filterInfo.length > 0 ? ` (필터: ${filterInfo.join(', ')})` : '';
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 Plan 목록${filterText} (총 ${plans.length}개):\n\n${planList}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan 목록 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'get_plan':
        try {
          const plan = await planStorage.load(args.id);
          
          if (!plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Plan을 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }

          // 연결된 PRD 정보 조회
          let prdInfo = '';
          if (plan.prd_id) {
            const linkedPrd = await prdStorage.load(plan.prd_id);
            prdInfo = linkedPrd 
              ? `\n**연결된 PRD**: ${linkedPrd.title} (${plan.prd_id})`
              : `\n**연결된 PRD**: 삭제됨 (${plan.prd_id})`;
          }

          // 마일스톤 정보
          let milestoneInfo = '';
          if (plan.milestones && plan.milestones.length > 0) {
            milestoneInfo = `\n\n**마일스톤 목록** (${plan.milestones.length}개):\n${plan.milestones.map((milestone, i) => `${i + 1}. ${milestone.title}${milestone.completed ? ' ✅' : ' ⏳'}${milestone.dueDate ? ` (마감: ${milestone.dueDate.split('T')[0]})` : ''}`).join('\n')}`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 **Plan 상세 정보**\n\n**ID**: ${plan.id}\n**제목**: ${plan.title}\n**설명**: ${plan.description}\n**상태**: ${plan.status}\n**시작일**: ${plan.startDate.split('T')[0]}\n**종료일**: ${plan.endDate ? plan.endDate.split('T')[0] : '미설정'}\n**생성일**: ${plan.createdAt}\n**수정일**: ${plan.updatedAt || '없음'}${prdInfo}${milestoneInfo}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'update_plan':
        try {
          const existingPlan = await planStorage.load(args.id);
          
          if (!existingPlan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Plan을 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 업데이트할 필드들만 적용
          const updatedPlan = {
            ...existingPlan,
            ...(args.title && { title: args.title }),
            ...(args.description && { description: args.description }),
            ...(args.status && { status: args.status }),
            ...(args.milestones && { milestones: args.milestones }),
            ...(args.startDate && { startDate: args.startDate }),
            ...(args.endDate && { endDate: args.endDate }),
            updatedAt: new Date().toISOString()
          };
          
          await planStorage.save(args.id, updatedPlan);
          
          const changedFields = [];
          if (args.title) changedFields.push(`제목: ${args.title}`);
          if (args.description) changedFields.push(`설명: ${args.description}`);
          if (args.status) changedFields.push(`상태: ${args.status}`);
          if (args.milestones) changedFields.push(`마일스톤: ${args.milestones.length}개`);
          if (args.startDate) changedFields.push(`시작일: ${args.startDate.split('T')[0]}`);
          if (args.endDate) changedFields.push(`종료일: ${args.endDate.split('T')[0]}`);
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Plan 업데이트 성공!\n\n**ID**: ${updatedPlan.id}\n**제목**: ${updatedPlan.title}\n**상태**: ${updatedPlan.status}\n**수정일**: ${updatedPlan.updatedAt}\n\n**변경된 필드들**:\n${changedFields.map(field => `- ${field}`).join('\n')}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan 업데이트 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      // Group 5: Utility Tools
      case 'get_metrics':
        try {
          const allPRDs = await prdStorage.listAll();
          const allTasks = await taskStorage.listAll();
          const allPlans = await planStorage.listAll();
          
          const metrics = {
            overview: {
              totalPRDs: allPRDs.length,
              totalTasks: allTasks.length,
              totalPlans: allPlans.length,
              lastUpdated: new Date().toISOString()
            },
            prdStatus: {},
            taskStatus: {},
            planStatus: {},
            priorities: {}
          };
          
          // PRD 상태별 집계
          allPRDs.forEach(prd => {
            metrics.prdStatus[prd.status] = (metrics.prdStatus[prd.status] || 0) + 1;
          });
          
          // Task 상태별 집계
          allTasks.forEach(task => {
            metrics.taskStatus[task.status] = (metrics.taskStatus[task.status] || 0) + 1;
          });
          
          // Plan 상태별 집계
          allPlans.forEach(plan => {
            metrics.planStatus[plan.status] = (metrics.planStatus[plan.status] || 0) + 1;
          });
          
          // 우선순위별 집계 (PRD + Task)
          [...allPRDs, ...allTasks].forEach(item => {
            if (item.priority) {
              metrics.priorities[item.priority] = (metrics.priorities[item.priority] || 0) + 1;
            }
          });
          
          let metricsText = `📊 **WorkflowMCP 프로젝트 메트릭스**\n\n`;
          metricsText += `**전체 현황**:\n`;
          metricsText += `- PRD: ${metrics.overview.totalPRDs}개\n`;
          metricsText += `- Task: ${metrics.overview.totalTasks}개\n`;
          metricsText += `- Plan: ${metrics.overview.totalPlans}개\n\n`;
          
          if (args.includeDetails) {
            if (Object.keys(metrics.prdStatus).length > 0) {
              metricsText += `**PRD 상태별**:\n`;
              Object.entries(metrics.prdStatus).forEach(([status, count]) => {
                metricsText += `- ${status}: ${count}개\n`;
              });
              metricsText += `\n`;
            }
            
            if (Object.keys(metrics.taskStatus).length > 0) {
              metricsText += `**Task 상태별**:\n`;
              Object.entries(metrics.taskStatus).forEach(([status, count]) => {
                metricsText += `- ${status}: ${count}개\n`;
              });
              metricsText += `\n`;
            }
            
            if (Object.keys(metrics.planStatus).length > 0) {
              metricsText += `**Plan 상태별**:\n`;
              Object.entries(metrics.planStatus).forEach(([status, count]) => {
                metricsText += `- ${status}: ${count}개\n`;
              });
              metricsText += `\n`;
            }
            
            if (Object.keys(metrics.priorities).length > 0) {
              metricsText += `**우선순위별**:\n`;
              Object.entries(metrics.priorities).forEach(([priority, count]) => {
                metricsText += `- ${priority}: ${count}개\n`;
              });
            }
          }
          
          metricsText += `\n**생성 시간**: ${metrics.overview.lastUpdated}`;
          
          return {
            content: [
              {
                type: 'text',
                text: metricsText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 메트릭스 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'validate_prd':
        try {
          const prd = await prdStorage.load(args.id);
          
          if (!prd) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ PRD를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          const validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            score: 100
          };
          
          // 필수 필드 검증
          const requiredFields = ['title', 'description', 'requirements'];
          requiredFields.forEach(field => {
            if (!prd[field] || (Array.isArray(prd[field]) && prd[field].length === 0)) {
              validationResults.errors.push(`필수 필드 누락: ${field}`);
              validationResults.score -= 20;
            }
          });
          
          // 내용 품질 검증
          if (prd.title && prd.title.length < 10) {
            validationResults.warnings.push('제목이 너무 짧습니다 (10자 이상 권장)');
            validationResults.score -= 5;
          }
          
          if (prd.description && prd.description.length < 50) {
            validationResults.warnings.push('설명이 너무 짧습니다 (50자 이상 권장)');
            validationResults.score -= 5;
          }
          
          if (prd.requirements && prd.requirements.length < 3) {
            validationResults.warnings.push('요구사항이 너무 적습니다 (3개 이상 권장)');
            validationResults.score -= 10;
          }
          
          if (!prd.priority) {
            validationResults.warnings.push('우선순위가 설정되지 않았습니다');
            validationResults.score -= 5;
          }
          
          validationResults.isValid = validationResults.errors.length === 0;
          
          let validationText = `🔍 **PRD 검증 결과**: ${prd.title}\n\n`;
          validationText += `**전체 점수**: ${validationResults.score}/100\n`;
          validationText += `**유효성**: ${validationResults.isValid ? '✅ 유효' : '❌ 오류 있음'}\n\n`;
          
          if (validationResults.errors.length > 0) {
            validationText += `**오류 (${validationResults.errors.length}개)**:\n`;
            validationResults.errors.forEach(error => {
              validationText += `- ❌ ${error}\n`;
            });
            validationText += `\n`;
          }
          
          if (validationResults.warnings.length > 0) {
            validationText += `**경고 (${validationResults.warnings.length}개)**:\n`;
            validationResults.warnings.forEach(warning => {
              validationText += `- ⚠️ ${warning}\n`;
            });
            validationText += `\n`;
          }
          
          if (validationResults.isValid && validationResults.warnings.length === 0) {
            validationText += `🎉 **완벽한 PRD입니다!**`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: validationText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD 검증 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'export_data':
        try {
          let exportData = {};
          const timestamp = new Date().toISOString();
          
          // 데이터 수집
          if (args.dataType === 'prds' || args.dataType === 'all') {
            exportData.prds = await prdStorage.listAll();
          }
          if (args.dataType === 'tasks' || args.dataType === 'all') {
            exportData.tasks = await taskStorage.listAll();
          }
          if (args.dataType === 'plans' || args.dataType === 'all') {
            exportData.plans = await planStorage.listAll();
          }
          
          let exportText = '';
          
          if (args.format === 'json') {
            exportText = `🗂️ **JSON 데이터 익스포트** (${timestamp})\n\n`;
            exportText += '```json\n';
            exportText += JSON.stringify({
              exportedAt: timestamp,
              dataType: args.dataType,
              ...exportData
            }, null, 2);
            exportText += '\n```';
            
          } else if (args.format === 'summary') {
            exportText = `📋 **프로젝트 요약 리포트** (${timestamp})\n\n`;
            
            if (exportData.prds) {
              exportText += `## PRD 목록 (${exportData.prds.length}개)\n\n`;
              exportData.prds.forEach((prd, index) => {
                exportText += `${index + 1}. **${prd.title}** (${prd.status})\n`;
                exportText += `   - 우선순위: ${prd.priority || 'N/A'}\n`;
                exportText += `   - 요구사항: ${prd.requirements?.length || 0}개\n`;
                exportText += `   - 생성일: ${prd.createdAt.split('T')[0]}\n\n`;
              });
            }
            
            if (exportData.tasks) {
              exportText += `## Task 목록 (${exportData.tasks.length}개)\n\n`;
              exportData.tasks.forEach((task, index) => {
                exportText += `${index + 1}. **${task.title}** (${task.status})\n`;
                exportText += `   - 우선순위: ${task.priority || 'N/A'}\n`;
                exportText += `   - 담당자: ${task.assignee || 'N/A'}\n`;
                exportText += `   - 예상시간: ${task.estimatedHours || 'N/A'}시간\n\n`;
              });
            }
            
            if (exportData.plans) {
              exportText += `## Plan 목록 (${exportData.plans.length}개)\n\n`;
              exportData.plans.forEach((plan, index) => {
                exportText += `${index + 1}. **${plan.title}** (${plan.status})\n`;
                exportText += `   - 마일스톤: ${plan.milestones?.length || 0}개\n`;
                exportText += `   - 기간: ${plan.startDate?.split('T')[0] || 'N/A'} ~ ${plan.endDate?.split('T')[0] || 'N/A'}\n\n`;
              });
            }
            
          } else if (args.format === 'csv') {
            exportText = `📊 **CSV 데이터 익스포트** (${timestamp})\n\n`;
            
            if (exportData.prds) {
              exportText += `**PRD 데이터**:\n\`\`\`csv\n`;
              exportText += 'ID,Title,Status,Priority,Requirements_Count,Created_Date\n';
              exportData.prds.forEach(prd => {
                exportText += `"${prd.id}","${prd.title}","${prd.status}","${prd.priority || ''}","${prd.requirements?.length || 0}","${prd.createdAt.split('T')[0]}"\n`;
              });
              exportText += '```\n\n';
            }
            
            if (exportData.tasks) {
              exportText += `**Task 데이터**:\n\`\`\`csv\n`;
              exportText += 'ID,Title,Status,Priority,Assignee,Estimated_Hours,Due_Date\n';
              exportData.tasks.forEach(task => {
                exportText += `"${task.id}","${task.title}","${task.status}","${task.priority || ''}","${task.assignee || ''}","${task.estimatedHours || ''}","${task.dueDate?.split('T')[0] || ''}"\n`;
              });
              exportText += '```\n\n';
            }
            
            if (exportData.plans) {
              exportText += `**Plan 데이터**:\n\`\`\`csv\n`;
              exportText += 'ID,Title,Status,Milestones_Count,Start_Date,End_Date\n';
              exportData.plans.forEach(plan => {
                exportText += `"${plan.id}","${plan.title}","${plan.status}","${plan.milestones?.length || 0}","${plan.startDate?.split('T')[0] || ''}","${plan.endDate?.split('T')[0] || ''}"\n`;
              });
              exportText += '```\n\n';
            }
          }
          
          return {
            content: [
              {
                type: 'text',
                text: exportText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 데이터 익스포트 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      // Phase 2-1: 안전한 삭제 기능
      case 'delete_prd':
        try {
          const prd = await prdStorage.load(args.id);
          
          if (!prd) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ PRD를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 의존성 체크: 연결된 Plan이 있는지 확인
          const allPlans = await planStorage.listAll();
          const linkedPlans = allPlans.filter(plan => plan.prd_id === args.id);
          
          if (linkedPlans.length > 0 && !args.force) {
            return {
              content: [
                {
                  type: 'text',
                  text: `⚠️ **PRD 삭제 불가**: 연결된 Plan이 ${linkedPlans.length}개 있습니다.\n\n` +
                       `**연결된 Plan들**:\n${linkedPlans.map(plan => `- ${plan.title} (${plan.id})`).join('\n')}\n\n` +
                       `**해결 방법**:\n` +
                       `1. 연결된 Plan들을 먼저 삭제하거나\n` +
                       `2. \`force: true\` 옵션으로 강제 삭제 (연결된 Plan들의 prd_id가 제거됨)`
                }
              ],
              isError: true
            };
          }
          
          // 백업 생성 (삭제 전)
          try {
            await prdStorage.createBackup?.();
          } catch (backupError) {
            console.warn('Backup creation failed:', backupError.message);
          }
          
          // 강제 삭제 시 연결된 Plan들의 prd_id 제거
          if (args.force && linkedPlans.length > 0) {
            for (const plan of linkedPlans) {
              const updatedPlan = { ...plan };
              delete updatedPlan.prd_id;
              updatedPlan.updatedAt = new Date().toISOString();
              await planStorage.save(plan.id, updatedPlan);
            }
          }
          
          // PRD 삭제
          await prdStorage.delete(args.id);
          
          let successMessage = `✅ **PRD 삭제 성공!**\n\n`;
          successMessage += `**삭제된 PRD**: ${prd.title}\n`;
          successMessage += `**ID**: ${args.id}\n`;
          successMessage += `**삭제 시간**: ${new Date().toISOString()}\n`;
          
          if (args.force && linkedPlans.length > 0) {
            successMessage += `\n**처리된 연결**: ${linkedPlans.length}개 Plan의 PRD 연결 해제됨`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: successMessage
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD 삭제 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'delete_task':
        try {
          const task = await taskStorage.load(args.id);
          
          if (!task) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Task를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 연결 체크: 어떤 Plan에 속해있는지 확인 (향후 연결 기능에서 사용)
          // 현재는 Plan과 Task 간 직접 연결이 없으므로 경고만 표시
          let warningMessage = '';
          if (!args.force && task.status === 'in_progress') {
            warningMessage = `⚠️ **주의**: 진행중인 Task입니다. 삭제하시겠습니까?\n`;
          }
          
          // 백업 생성
          try {
            await taskStorage.createBackup?.();
          } catch (backupError) {
            console.warn('Backup creation failed:', backupError.message);
          }
          
          // Task 삭제
          await taskStorage.delete(args.id);
          
          let successMessage = `✅ **Task 삭제 성공!**\n\n`;
          successMessage += `**삭제된 Task**: ${task.title}\n`;
          successMessage += `**ID**: ${args.id}\n`;
          successMessage += `**이전 상태**: ${task.status}\n`;
          successMessage += `**삭제 시간**: ${new Date().toISOString()}\n`;
          
          if (warningMessage) {
            successMessage = warningMessage + '\n' + successMessage;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: successMessage
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 삭제 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'delete_plan':
        try {
          const plan = await planStorage.load(args.id);
          
          if (!plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Plan을 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 기본 cleanup 모드 설정
          const cleanupMode = args.cleanup || 'keep';
          
          // 관련 Task 처리 (향후 연결 기능에서 실제 연결된 Task들을 찾아 처리)
          // 현재는 시뮬레이션으로 처리
          let cleanupActions = [];
          
          if (cleanupMode === 'delete') {
            cleanupActions.push('연결된 Task들도 함께 삭제됩니다');
          } else if (cleanupMode === 'orphan') {
            cleanupActions.push('연결된 Task들의 Plan 연결이 해제됩니다');
          } else {
            cleanupActions.push('연결된 Task들은 그대로 유지됩니다');
          }
          
          // 백업 생성
          try {
            await planStorage.createBackup?.();
          } catch (backupError) {
            console.warn('Backup creation failed:', backupError.message);
          }
          
          // Plan 삭제
          await planStorage.delete(args.id);
          
          let successMessage = `✅ **Plan 삭제 성공!**\n\n`;
          successMessage += `**삭제된 Plan**: ${plan.title}\n`;
          successMessage += `**ID**: ${args.id}\n`;
          successMessage += `**마일스톤 수**: ${plan.milestones?.length || 0}개\n`;
          successMessage += `**삭제 시간**: ${new Date().toISOString()}\n`;
          successMessage += `**처리 방식**: ${cleanupMode}\n`;
          
          if (cleanupActions.length > 0) {
            successMessage += `\n**처리 내용**:\n${cleanupActions.map(action => `- ${action}`).join('\n')}`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: successMessage
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan 삭제 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      // Phase 2-2: 데이터 연결 시스템
      case 'link_prd_to_plan':
        try {
          // PRD와 Plan 존재 확인
          const prd = await prdStorage.load(args.prd_id);
          const plan = await planStorage.load(args.plan_id);
          
          if (!prd) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ PRD를 찾을 수 없습니다: ${args.prd_id}`
                }
              ],
              isError: true
            };
          }
          
          if (!plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Plan을 찾을 수 없습니다: ${args.plan_id}`
                }
              ],
              isError: true
            };
          }
          
          // Plan에 PRD 연결 정보 추가
          const updatedPlan = {
            ...plan,
            prd_id: args.prd_id,
            updatedAt: new Date().toISOString()
          };
          
          await planStorage.save(args.plan_id, updatedPlan);
          
          return {
            content: [
              {
                type: 'text',
                text: `🔗 **PRD-Plan 연결 성공!**\n\n` +
                     `**PRD**: ${prd.title} (${args.prd_id})\n` +
                     `**Plan**: ${plan.title} (${args.plan_id})\n` +
                     `**연결 시간**: ${new Date().toISOString()}\n\n` +
                     `이제 PRD의 요구사항이 Plan의 개발 계획과 연결되었습니다.`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ PRD-Plan 연결 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'link_plan_to_tasks':
        try {
          // Plan 존재 확인
          const plan = await planStorage.load(args.plan_id);
          if (!plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Plan을 찾을 수 없습니다: ${args.plan_id}`
                }
              ],
              isError: true
            };
          }
          
          // 모든 Task들 존재 확인
          const tasks = [];
          const missingTasks = [];
          
          for (const taskId of args.task_ids) {
            const task = await taskStorage.load(taskId);
            if (task) {
              tasks.push(task);
            } else {
              missingTasks.push(taskId);
            }
          }
          
          if (missingTasks.length > 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 다음 Task들을 찾을 수 없습니다: ${missingTasks.join(', ')}`
                }
              ],
              isError: true
            };
          }
          
          // Plan에 연결된 Task IDs 추가
          const updatedPlan = {
            ...plan,
            linked_task_ids: args.task_ids,
            updatedAt: new Date().toISOString()
          };
          
          await planStorage.save(args.plan_id, updatedPlan);
          
          // 각 Task에 Plan ID 추가
          for (const task of tasks) {
            const updatedTask = {
              ...task,
              plan_id: args.plan_id,
              updatedAt: new Date().toISOString()
            };
            await taskStorage.save(task.id, updatedTask);
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `🔗 **Plan-Tasks 연결 성공!**\n\n` +
                     `**Plan**: ${plan.title} (${args.plan_id})\n` +
                     `**연결된 Task 수**: ${tasks.length}개\n` +
                     `**연결된 Tasks**:\n${tasks.map(task => `- ${task.title} (${task.id})`).join('\n')}\n\n` +
                     `**연결 시간**: ${new Date().toISOString()}\n\n` +
                     `이제 Plan의 진행률이 Task들의 상태에 따라 자동 계산됩니다.`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan-Tasks 연결 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'get_linked_data':
        try {
          let item, linkedData = {};
          
          // 요청된 아이템 로드
          if (args.type === 'prd') {
            item = await prdStorage.load(args.id);
          } else if (args.type === 'plan') {
            item = await planStorage.load(args.id);
          } else if (args.type === 'task') {
            item = await taskStorage.load(args.id);
          }
          
          if (!item) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ ${args.type.toUpperCase()}를 찾을 수 없습니다: ${args.id}`
                }
              ],
              isError: true
            };
          }
          
          // 연결된 데이터 수집
          if (args.type === 'prd') {
            // PRD → 연결된 Plan들 찾기
            const allPlans = await planStorage.listAll();
            linkedData.plans = allPlans.filter(plan => plan.prd_id === args.id);
            
            // PRD → 연결된 Plan들의 Task들 찾기
            linkedData.tasks = [];
            for (const plan of linkedData.plans) {
              if (plan.linked_task_ids) {
                for (const taskId of plan.linked_task_ids) {
                  const task = await taskStorage.load(taskId);
                  if (task) linkedData.tasks.push(task);
                }
              }
            }
          } else if (args.type === 'plan') {
            // Plan → 연결된 PRD 찾기
            if (item.prd_id) {
              linkedData.prd = await prdStorage.load(item.prd_id);
            }
            
            // Plan → 연결된 Task들 찾기
            linkedData.tasks = [];
            if (item.linked_task_ids) {
              for (const taskId of item.linked_task_ids) {
                const task = await taskStorage.load(taskId);
                if (task) linkedData.tasks.push(task);
              }
            }
          } else if (args.type === 'task') {
            // Task → 연결된 Plan 찾기
            if (item.plan_id) {
              linkedData.plan = await planStorage.load(item.plan_id);
              
              // Task → Plan을 통해 PRD 찾기
              if (linkedData.plan && linkedData.plan.prd_id) {
                linkedData.prd = await prdStorage.load(linkedData.plan.prd_id);
              }
            }
          }
          
          // 결과 텍스트 생성
          let resultText = `🔍 **연결된 데이터 조회**: ${item.title || item.name}\n\n`;
          resultText += `**기본 정보**:\n`;
          resultText += `- ID: ${args.id}\n`;
          resultText += `- 타입: ${args.type.toUpperCase()}\n`;
          resultText += `- 상태: ${item.status}\n\n`;
          
          // 연결된 데이터 표시
          if (linkedData.prd) {
            resultText += `**연결된 PRD**:\n`;
            resultText += `- ${linkedData.prd.title} (${linkedData.prd.id})\n\n`;
          }
          
          if (linkedData.plans && linkedData.plans.length > 0) {
            resultText += `**연결된 Plan들** (${linkedData.plans.length}개):\n`;
            linkedData.plans.forEach(plan => {
              resultText += `- ${plan.title} (${plan.id}) - ${plan.status}\n`;
            });
            resultText += `\n`;
          }
          
          if (linkedData.plan) {
            resultText += `**연결된 Plan**:\n`;
            resultText += `- ${linkedData.plan.title} (${linkedData.plan.id}) - ${linkedData.plan.status}\n\n`;
          }
          
          if (linkedData.tasks && linkedData.tasks.length > 0) {
            resultText += `**연결된 Task들** (${linkedData.tasks.length}개):\n`;
            linkedData.tasks.forEach(task => {
              resultText += `- ${task.title} (${task.id}) - ${task.status}\n`;
            });
            resultText += `\n`;
          }
          
          if (!linkedData.prd && (!linkedData.plans || linkedData.plans.length === 0) && 
              !linkedData.plan && (!linkedData.tasks || linkedData.tasks.length === 0)) {
            resultText += `**연결된 데이터**: 없음\n\n`;
            resultText += `이 ${args.type.toUpperCase()}는 아직 다른 항목과 연결되지 않았습니다.`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 연결된 데이터 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'unlink_items':
        try {
          // 연결 해제 로직 (item1_type과 item2_type에 따라 처리)
          let item1, item2;
          
          // 첫 번째 아이템 로드
          if (args.item1_type === 'prd') {
            item1 = await prdStorage.load(args.item1_id);
          } else if (args.item1_type === 'plan') {
            item1 = await planStorage.load(args.item1_id);
          } else if (args.item1_type === 'task') {
            item1 = await taskStorage.load(args.item1_id);
          }
          
          // 두 번째 아이템 로드
          if (args.item2_type === 'prd') {
            item2 = await prdStorage.load(args.item2_id);
          } else if (args.item2_type === 'plan') {
            item2 = await planStorage.load(args.item2_id);
          } else if (args.item2_type === 'task') {
            item2 = await taskStorage.load(args.item2_id);
          }
          
          if (!item1 || !item2) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 아이템을 찾을 수 없습니다: ${!item1 ? args.item1_id : args.item2_id}`
                }
              ],
              isError: true
            };
          }
          
          // 연결 해제 처리
          let unlinkActions = [];
          
          // PRD-Plan 연결 해제
          if ((args.item1_type === 'prd' && args.item2_type === 'plan') ||
              (args.item1_type === 'plan' && args.item2_type === 'prd')) {
            const plan = args.item1_type === 'plan' ? item1 : item2;
            const planId = args.item1_type === 'plan' ? args.item1_id : args.item2_id;
            
            const updatedPlan = { ...plan };
            delete updatedPlan.prd_id;
            updatedPlan.updatedAt = new Date().toISOString();
            await planStorage.save(planId, updatedPlan);
            
            unlinkActions.push('PRD-Plan 연결 해제됨');
          }
          
          // Plan-Task 연결 해제
          if ((args.item1_type === 'plan' && args.item2_type === 'task') ||
              (args.item1_type === 'task' && args.item2_type === 'plan')) {
            const plan = args.item1_type === 'plan' ? item1 : item2;
            const task = args.item1_type === 'task' ? item1 : item2;
            const planId = args.item1_type === 'plan' ? args.item1_id : args.item2_id;
            const taskId = args.item1_type === 'task' ? args.item1_id : args.item2_id;
            
            // Plan에서 Task ID 제거
            const updatedPlan = { ...plan };
            if (updatedPlan.linked_task_ids) {
              updatedPlan.linked_task_ids = updatedPlan.linked_task_ids.filter(id => id !== taskId);
            }
            updatedPlan.updatedAt = new Date().toISOString();
            await planStorage.save(planId, updatedPlan);
            
            // Task에서 Plan ID 제거
            const updatedTask = { ...task };
            delete updatedTask.plan_id;
            updatedTask.updatedAt = new Date().toISOString();
            await taskStorage.save(taskId, updatedTask);
            
            unlinkActions.push('Plan-Task 연결 해제됨');
          }
          
          if (unlinkActions.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 해당 아이템들 간에 연결이 존재하지 않습니다.`
                }
              ],
              isError: true
            };
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `🔓 **연결 해제 성공!**\n\n` +
                     `**아이템 1**: ${item1.title || item1.name} (${args.item1_type})\n` +
                     `**아이템 2**: ${item2.title || item2.name} (${args.item2_type})\n` +
                     `**처리 내용**:\n${unlinkActions.map(action => `- ${action}`).join('\n')}\n` +
                     `**해제 시간**: ${new Date().toISOString()}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 연결 해제 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'sync_plan_progress':
        try {
          const plan = await planStorage.load(args.plan_id);
          
          if (!plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Plan을 찾을 수 없습니다: ${args.plan_id}`
                }
              ],
              isError: true
            };
          }
          
          // 연결된 Task들 조회
          const linkedTasks = [];
          if (plan.linked_task_ids) {
            for (const taskId of plan.linked_task_ids) {
              const task = await taskStorage.load(taskId);
              if (task) linkedTasks.push(task);
            }
          }
          
          if (linkedTasks.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `ℹ️ **연결된 Task가 없습니다**: ${plan.title}\n\n` +
                     `이 Plan에는 연결된 Task가 없어 진행률을 계산할 수 없습니다.\n` +
                     `\`link_plan_to_tasks\` 도구를 사용해 Task들을 연결해주세요.`
                }
              ]
            };
          }
          
          // 진행률 계산
          const totalTasks = linkedTasks.length;
          const completedTasks = linkedTasks.filter(task => task.status === 'done').length;
          const inProgressTasks = linkedTasks.filter(task => task.status === 'in_progress').length;
          const todoTasks = linkedTasks.filter(task => task.status === 'todo').length;
          const blockedTasks = linkedTasks.filter(task => task.status === 'blocked').length;
          
          const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
          
          // Plan 상태 자동 업데이트
          let planStatus = plan.status;
          if (progressPercentage === 100) {
            planStatus = 'completed';
          } else if (progressPercentage > 0) {
            planStatus = 'active';
          }
          
          // 예상 완료일 계산 (간단한 추정)
          const averageTaskDuration = 7; // 평균 7일로 가정
          const remainingTasks = totalTasks - completedTasks;
          const estimatedDaysToComplete = remainingTasks * averageTaskDuration;
          const estimatedCompletionDate = new Date();
          estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedDaysToComplete);
          
          // Plan 업데이트
          const updatedPlan = {
            ...plan,
            status: planStatus,
            progress: {
              percentage: progressPercentage,
              totalTasks: totalTasks,
              completedTasks: completedTasks,
              inProgressTasks: inProgressTasks,
              todoTasks: todoTasks,
              blockedTasks: blockedTasks,
              lastSyncAt: new Date().toISOString(),
              estimatedCompletionDate: estimatedCompletionDate.toISOString()
            },
            updatedAt: new Date().toISOString()
          };
          
          await planStorage.save(args.plan_id, updatedPlan);
          
          return {
            content: [
              {
                type: 'text',
                text: `📊 **Plan 진행률 동기화 완료!**\n\n` +
                     `**Plan**: ${plan.title}\n` +
                     `**전체 진행률**: ${progressPercentage}% (${completedTasks}/${totalTasks})\n\n` +
                     `**Task 상태별 현황**:\n` +
                     `- ✅ 완료: ${completedTasks}개\n` +
                     `- 🔄 진행중: ${inProgressTasks}개\n` +
                     `- 📋 대기: ${todoTasks}개\n` +
                     `- 🚫 차단: ${blockedTasks}개\n\n` +
                     `**Plan 상태**: ${planStatus}\n` +
                     `**예상 완료일**: ${estimatedCompletionDate.toISOString().split('T')[0]}\n` +
                     `**동기화 시간**: ${new Date().toISOString()}\n\n` +
                     `진행률이 실시간으로 업데이트되었습니다! 🎉`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Plan 진행률 동기화 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      // Phase 2-3: 의존성 관리 시스템
      case 'add_task_dependency':
        try {
          // 두 Task 모두 존재하는지 확인
          const dependentTask = await taskStorage.load(args.dependent_task_id);
          const prerequisiteTask = await taskStorage.load(args.prerequisite_task_id);
          
          if (!dependentTask) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 의존 Task를 찾을 수 없습니다: ${args.dependent_task_id}`
                }
              ],
              isError: true
            };
          }
          
          if (!prerequisiteTask) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 선행 Task를 찾을 수 없습니다: ${args.prerequisite_task_id}`
                }
              ],
              isError: true
            };
          }
          
          // 자기 자신에게 의존할 수 없음
          if (args.dependent_task_id === args.prerequisite_task_id) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Task는 자기 자신에게 의존할 수 없습니다.`
                }
              ],
              isError: true
            };
          }
          
          // 순환 의존성 체크
          const wouldCreateCycle = await checkCircularDependency(
            args.prerequisite_task_id, 
            args.dependent_task_id
          );
          
          if (wouldCreateCycle) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ **순환 의존성 감지!**\n\n` +
                       `"${prerequisiteTask.title}"이 이미 "${dependentTask.title}"에 직접 또는 간접적으로 의존하고 있습니다.\n` +
                       `이 의존성을 추가하면 순환 의존성이 발생합니다.`
                }
              ],
              isError: true
            };
          }
          
          // 의존성 정보를 dependent task에 추가
          const updatedDependentTask = {
            ...dependentTask,
            dependencies: [
              ...(dependentTask.dependencies || []),
              args.prerequisite_task_id
            ],
            updatedAt: new Date().toISOString()
          };
          
          // 중복 의존성 제거
          updatedDependentTask.dependencies = [...new Set(updatedDependentTask.dependencies)];
          
          await taskStorage.save(args.dependent_task_id, updatedDependentTask);
          
          // 의존성에 따라 Task 상태 조정
          if (prerequisiteTask.status !== 'done' && dependentTask.status === 'in_progress') {
            updatedDependentTask.status = 'blocked';
            updatedDependentTask.blockedReason = `선행 Task 대기: ${prerequisiteTask.title}`;
            await taskStorage.save(args.dependent_task_id, updatedDependentTask);
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `🔗 **Task 의존성 추가 성공!**\n\n` +
                     `**의존 Task**: ${dependentTask.title}\n` +
                     `**선행 Task**: ${prerequisiteTask.title}\n\n` +
                     `📋 **규칙**: "${prerequisiteTask.title}"이 완료되어야 "${dependentTask.title}"을(를) 시작할 수 있습니다.\n\n` +
                     `**현재 상태**:\n` +
                     `- 선행 Task: ${prerequisiteTask.status}\n` +
                     `- 의존 Task: ${updatedDependentTask.status}\n\n` +
                     `**추가 시간**: ${new Date().toISOString()}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 의존성 추가 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'remove_task_dependency':
        try {
          const dependentTask = await taskStorage.load(args.dependent_task_id);
          const prerequisiteTask = await taskStorage.load(args.prerequisite_task_id);
          
          if (!dependentTask) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 의존 Task를 찾을 수 없습니다: ${args.dependent_task_id}`
                }
              ],
              isError: true
            };
          }
          
          if (!prerequisiteTask) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 선행 Task를 찾을 수 없습니다: ${args.prerequisite_task_id}`
                }
              ],
              isError: true
            };
          }
          
          // 의존성이 실제로 존재하는지 확인
          if (!dependentTask.dependencies || !dependentTask.dependencies.includes(args.prerequisite_task_id)) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 해당 의존성이 존재하지 않습니다.\n\n` +
                       `"${dependentTask.title}"은(는) "${prerequisiteTask.title}"에 의존하지 않습니다.`
                }
              ],
              isError: true
            };
          }
          
          // 의존성 제거
          const updatedDependentTask = {
            ...dependentTask,
            dependencies: dependentTask.dependencies.filter(id => id !== args.prerequisite_task_id),
            updatedAt: new Date().toISOString()
          };
          
          // blocked 상태 해제 확인
          if (dependentTask.status === 'blocked' && dependentTask.blockedReason?.includes(prerequisiteTask.title)) {
            updatedDependentTask.status = 'todo';
            delete updatedDependentTask.blockedReason;
          }
          
          await taskStorage.save(args.dependent_task_id, updatedDependentTask);
          
          return {
            content: [
              {
                type: 'text',
                text: `🔓 **Task 의존성 제거 성공!**\n\n` +
                     `**의존 Task**: ${dependentTask.title}\n` +
                     `**제거된 선행 Task**: ${prerequisiteTask.title}\n\n` +
                     `📋 이제 "${dependentTask.title}"은(는) "${prerequisiteTask.title}"과(와) 독립적으로 실행할 수 있습니다.\n\n` +
                     `**업데이트된 상태**: ${updatedDependentTask.status}\n` +
                     `**제거 시간**: ${new Date().toISOString()}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 의존성 제거 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'get_task_dependencies':
        try {
          const task = await taskStorage.load(args.task_id);
          
          if (!task) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Task를 찾을 수 없습니다: ${args.task_id}`
                }
              ],
              isError: true
            };
          }
          
          let resultText = `🔍 **Task 의존성 정보**: ${task.title}\n\n`;
          
          // 이 Task가 의존하는 Task들 (선행 Task들)
          if (task.dependencies && task.dependencies.length > 0) {
            resultText += `**선행 Task들** (${task.dependencies.length}개):\n`;
            for (const depId of task.dependencies) {
              const depTask = await taskStorage.load(depId);
              if (depTask) {
                const statusIcon = depTask.status === 'done' ? '✅' : 
                                 depTask.status === 'in_progress' ? '🔄' :
                                 depTask.status === 'blocked' ? '🚫' : '📋';
                resultText += `- ${statusIcon} ${depTask.title} (${depTask.status})\n`;
              }
            }
            resultText += `\n`;
          } else {
            resultText += `**선행 Task**: 없음 (독립적으로 시작 가능)\n\n`;
          }
          
          // 이 Task에 의존하는 Task들 찾기 (후속 Task들)
          const allTasks = await taskStorage.listAll();
          const dependentTasks = allTasks.filter(t => 
            t.dependencies && t.dependencies.includes(args.task_id)
          );
          
          if (dependentTasks.length > 0) {
            resultText += `**후속 Task들** (${dependentTasks.length}개):\n`;
            dependentTasks.forEach(depTask => {
              const statusIcon = depTask.status === 'done' ? '✅' : 
                               depTask.status === 'in_progress' ? '🔄' :
                               depTask.status === 'blocked' ? '🚫' : '📋';
              resultText += `- ${statusIcon} ${depTask.title} (${depTask.status})\n`;
            });
            resultText += `\n`;
          } else {
            resultText += `**후속 Task**: 없음 (다른 Task가 이 Task에 의존하지 않음)\n\n`;
          }
          
          // 현재 Task 상태와 워크플로 영향 분석
          resultText += `**현재 상태**: ${task.status}\n`;
          
          if (task.status === 'done') {
            const blockedDependents = dependentTasks.filter(t => t.status === 'blocked');
            if (blockedDependents.length > 0) {
              resultText += `**워크플로 영향**: ${blockedDependents.length}개 Task가 이제 시작할 수 있습니다!\n`;
            }
          } else if (task.status === 'blocked') {
            const incompleteDeps = task.dependencies ? 
              await Promise.all(task.dependencies.map(id => taskStorage.load(id))) : [];
            const pendingDeps = incompleteDeps.filter(t => t && t.status !== 'done');
            if (pendingDeps.length > 0) {
              resultText += `**차단 사유**: ${pendingDeps.length}개 선행 Task 완료 대기\n`;
            }
          }
          
          return {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 의존성 조회 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'validate_workflow':
        try {
          let tasksToValidate = [];
          
          if (args.plan_id) {
            // 특정 Plan의 Task들만 검증
            const plan = await planStorage.load(args.plan_id);
            if (!plan) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `❌ Plan을 찾을 수 없습니다: ${args.plan_id}`
                  }
                ],
                isError: true
              };
            }
            
            if (plan.linked_task_ids) {
              for (const taskId of plan.linked_task_ids) {
                const task = await taskStorage.load(taskId);
                if (task) tasksToValidate.push(task);
              }
            }
          } else {
            // 모든 Task 검증
            tasksToValidate = await taskStorage.listAll();
          }
          
          const validationResults = {
            isValid: true,
            warnings: [],
            errors: [],
            circularDependencies: [],
            orphanedTasks: [],
            blockedTasks: [],
            readyTasks: []
          };
          
          // 순환 의존성 검사
          for (const task of tasksToValidate) {
            if (task.dependencies) {
              for (const depId of task.dependencies) {
                if (await checkCircularDependency(task.id, depId)) {
                  validationResults.circularDependencies.push({
                    task: task.title,
                    dependency: depId
                  });
                  validationResults.isValid = false;
                }
              }
            }
          }
          
          // 고아 Task 검사 (존재하지 않는 의존성 참조)
          for (const task of tasksToValidate) {
            if (task.dependencies) {
              for (const depId of task.dependencies) {
                const depTask = await taskStorage.load(depId);
                if (!depTask) {
                  validationResults.orphanedTasks.push({
                    task: task.title,
                    missingDependency: depId
                  });
                  validationResults.warnings.push(`"${task.title}"이(가) 존재하지 않는 Task에 의존: ${depId}`);
                }
              }
            }
          }
          
          // 차단된 Task와 시작 가능한 Task 분류
          for (const task of tasksToValidate) {
            if (task.dependencies && task.dependencies.length > 0) {
              const deps = await Promise.all(
                task.dependencies.map(id => taskStorage.load(id))
              );
              const incompleteDeps = deps.filter(dep => dep && dep.status !== 'done');
              
              if (incompleteDeps.length > 0) {
                validationResults.blockedTasks.push({
                  task: task.title,
                  status: task.status,
                  waitingFor: incompleteDeps.map(dep => dep.title)
                });
              } else if (task.status === 'todo') {
                validationResults.readyTasks.push({
                  task: task.title,
                  canStart: true
                });
              }
            } else if (task.status === 'todo') {
              validationResults.readyTasks.push({
                task: task.title,
                canStart: true
              });
            }
          }
          
          // 결과 텍스트 생성
          let resultText = `🔍 **워크플로 검증 결과**\n\n`;
          resultText += `**전체 유효성**: ${validationResults.isValid ? '✅ 유효' : '❌ 문제 발견'}\n`;
          resultText += `**검증된 Task 수**: ${tasksToValidate.length}개\n\n`;
          
          // 오류 표시
          if (validationResults.circularDependencies.length > 0) {
            resultText += `❌ **순환 의존성 발견** (${validationResults.circularDependencies.length}개):\n`;
            validationResults.circularDependencies.forEach(item => {
              resultText += `- ${item.task} ↔ ${item.dependency}\n`;
            });
            resultText += `\n`;
          }
          
          if (validationResults.orphanedTasks.length > 0) {
            resultText += `⚠️ **고아 의존성** (${validationResults.orphanedTasks.length}개):\n`;
            validationResults.orphanedTasks.forEach(item => {
              resultText += `- ${item.task} → 🚫 ${item.missingDependency}\n`;
            });
            resultText += `\n`;
          }
          
          // 워크플로 상태
          if (validationResults.readyTasks.length > 0) {
            resultText += `🚀 **시작 가능한 Task들** (${validationResults.readyTasks.length}개):\n`;
            validationResults.readyTasks.forEach(item => {
              resultText += `- ✅ ${item.task}\n`;
            });
            resultText += `\n`;
          }
          
          if (validationResults.blockedTasks.length > 0) {
            resultText += `🚫 **차단된 Task들** (${validationResults.blockedTasks.length}개):\n`;
            validationResults.blockedTasks.forEach(item => {
              resultText += `- ${item.task} (대기중: ${item.waitingFor.join(', ')})\n`;
            });
            resultText += `\n`;
          }
          
          if (validationResults.isValid && validationResults.warnings.length === 0) {
            resultText += `🎉 **워크플로가 완벽합니다!** 순환 의존성이나 논리적 오류가 없습니다.`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 워크플로 검증 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      case 'auto_update_task_status':
        try {
          let updatedTasks = [];
          let tasksToCheck = [];
          
          if (args.trigger_task_id) {
            // 특정 Task 완료에 따른 의존 Task들 상태 업데이트
            const triggerTask = await taskStorage.load(args.trigger_task_id);
            if (!triggerTask) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `❌ 트리거 Task를 찾을 수 없습니다: ${args.trigger_task_id}`
                  }
                ],
                isError: true
              };
            }
            
            // 이 Task에 의존하는 모든 Task들 찾기
            const allTasks = await taskStorage.listAll();
            tasksToCheck = allTasks.filter(task => 
              task.dependencies && task.dependencies.includes(args.trigger_task_id)
            );
          } else {
            // 모든 Task 상태 검사 및 업데이트
            tasksToCheck = await taskStorage.listAll();
          }
          
          for (const task of tasksToCheck) {
            if (!task.dependencies || task.dependencies.length === 0) continue;
            
            // 모든 의존성 Task들의 상태 확인
            const dependencyTasks = await Promise.all(
              task.dependencies.map(id => taskStorage.load(id))
            );
            
            const validDependencies = dependencyTasks.filter(dep => dep !== null);
            const completedDependencies = validDependencies.filter(dep => dep.status === 'done');
            const allDependenciesComplete = validDependencies.length === completedDependencies.length;
            
            let shouldUpdate = false;
            let newStatus = task.status;
            let newData = { ...task };
            
            // 의존성 완료에 따른 상태 변경
            if (allDependenciesComplete && task.status === 'blocked') {
              newStatus = 'todo';
              shouldUpdate = true;
              delete newData.blockedReason;
            } else if (!allDependenciesComplete && task.status === 'todo') {
              newStatus = 'blocked';
              shouldUpdate = true;
              const incompleteDeps = validDependencies.filter(dep => dep.status !== 'done');
              newData.blockedReason = `선행 Task 대기: ${incompleteDeps.map(dep => dep.title).join(', ')}`;
            }
            
            if (shouldUpdate) {
              newData.status = newStatus;
              newData.updatedAt = new Date().toISOString();
              newData.autoUpdatedAt = new Date().toISOString();
              
              await taskStorage.save(task.id, newData);
              
              updatedTasks.push({
                taskTitle: task.title,
                taskId: task.id,
                oldStatus: task.status,
                newStatus: newStatus,
                reason: allDependenciesComplete ? '모든 의존성 완료' : '의존성 미완료'
              });
            }
          }
          
          let resultText = `🔄 **Task 상태 자동 업데이트 완료**\n\n`;
          
          if (args.trigger_task_id) {
            const triggerTask = await taskStorage.load(args.trigger_task_id);
            resultText += `**트리거 Task**: ${triggerTask.title}\n`;
            resultText += `**영향받은 Task 수**: ${updatedTasks.length}개\n\n`;
          } else {
            resultText += `**전체 Task 검사**: ${tasksToCheck.length}개 확인\n`;
            resultText += `**업데이트된 Task 수**: ${updatedTasks.length}개\n\n`;
          }
          
          if (updatedTasks.length > 0) {
            resultText += `**상태 변경 내역**:\n`;
            updatedTasks.forEach(update => {
              const statusIcon = update.newStatus === 'todo' ? '🚀' : 
                               update.newStatus === 'blocked' ? '🚫' : '🔄';
              resultText += `${statusIcon} **${update.taskTitle}**\n`;
              resultText += `   ${update.oldStatus} → ${update.newStatus} (${update.reason})\n\n`;
            });
          } else {
            resultText += `ℹ️ 상태 변경이 필요한 Task가 없습니다.\n`;
            resultText += `모든 Task가 의존성에 맞는 적절한 상태를 유지하고 있습니다.`;
          }
          
          resultText += `\n**업데이트 시간**: ${new Date().toISOString()}`;
          
          return {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Task 상태 자동 업데이트 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }
      
      // === Phase 2-4: Basic Dashboard 핸들러 ===
      case 'get_project_dashboard':
        try {
          const [allPRDs, allTasks, allPlans] = await Promise.all([
            prdStorage.listAll(),
            taskStorage.listAll(),
            planStorage.listAll()
          ]);
          
          // 기본 통계
          const stats = {
            prds: {
              total: allPRDs.length,
              byStatus: {}
            },
            tasks: {
              total: allTasks.length,
              byStatus: {},
              byPriority: {}
            },
            plans: {
              total: allPlans.length,
              byStatus: {},
              milestones: {
                total: 0,
                completed: 0
              }
            }
          };
          
          // PRD 상태별 집계
          allPRDs.forEach(prd => {
            stats.prds.byStatus[prd.status] = (stats.prds.byStatus[prd.status] || 0) + 1;
          });
          
          // Task 상태별/우선순위별 집계
          allTasks.forEach(task => {
            stats.tasks.byStatus[task.status] = (stats.tasks.byStatus[task.status] || 0) + 1;
            stats.tasks.byPriority[task.priority] = (stats.tasks.byPriority[task.priority] || 0) + 1;
          });
          
          // Plan 상태별 집계 및 마일스톤 계산
          allPlans.forEach(plan => {
            stats.plans.byStatus[plan.status] = (stats.plans.byStatus[plan.status] || 0) + 1;
            if (plan.milestones) {
              stats.plans.milestones.total += plan.milestones.length;
              stats.plans.milestones.completed += plan.milestones.filter(m => m.completed).length;
            }
          });
          
          let dashboardText = `# 📊 프로젝트 대시보드\n\n`;
          dashboardText += `**전체 현황 요약**\n`;
          dashboardText += `- 📋 PRD: ${stats.prds.total}개\n`;
          dashboardText += `- 📝 Task: ${stats.tasks.total}개\n`;
          dashboardText += `- 📅 Plan: ${stats.plans.total}개\n`;
          dashboardText += `- 🎯 마일스톤: ${stats.plans.milestones.completed}/${stats.plans.milestones.total} 완료\n\n`;
          
          // PRD 상태
          dashboardText += `## 📋 PRD 현황\n`;
          Object.entries(stats.prds.byStatus).forEach(([status, count]) => {
            const emoji = status === 'approved' ? '✅' : status === 'review' ? '⏳' : '📝';
            dashboardText += `${emoji} ${status}: ${count}개\n`;
          });
          dashboardText += '\n';
          
          // Task 상태
          dashboardText += `## 📝 Task 현황\n`;
          Object.entries(stats.tasks.byStatus).forEach(([status, count]) => {
            const emoji = status === 'done' ? '✅' : status === 'in_progress' ? '🔄' : 
                         status === 'blocked' ? '🚫' : '⏳';
            dashboardText += `${emoji} ${status}: ${count}개\n`;
          });
          dashboardText += '\n**우선순위별:**\n';
          Object.entries(stats.tasks.byPriority).forEach(([priority, count]) => {
            const emoji = priority === 'High' ? '🔥' : priority === 'Medium' ? '⚡' : '📋';
            dashboardText += `${emoji} ${priority}: ${count}개\n`;
          });
          dashboardText += '\n';
          
          // Plan 상태
          dashboardText += `## 📅 Plan 현황\n`;
          Object.entries(stats.plans.byStatus).forEach(([status, count]) => {
            const emoji = status === 'completed' ? '✅' : status === 'active' ? '🔄' : 
                         status === 'paused' ? '⏸️' : '❌';
            dashboardText += `${emoji} ${status}: ${count}개\n`;
          });
          
          // 상세 정보 포함
          if (args.include_details) {
            dashboardText += `\n## 📋 상세 PRD 목록\n`;
            allPRDs.forEach(prd => {
              dashboardText += `- **${prd.title}** (${prd.id})\n`;
              dashboardText += `  📊 상태: ${prd.status} | 🔥 우선순위: ${prd.priority}\n\n`;
            });
            
            dashboardText += `\n## 📝 활성 Task 목록\n`;
            const activeTasks = allTasks.filter(t => ['todo', 'in_progress'].includes(t.status));
            activeTasks.forEach(task => {
              dashboardText += `- **${task.title}** (${task.id})\n`;
              dashboardText += `  📊 상태: ${task.status} | 👤 담당: ${task.assignee || 'N/A'}\n`;
              if (task.dependencies && task.dependencies.length > 0) {
                dashboardText += `  🔗 의존성: ${task.dependencies.join(', ')}\n`;
              }
              dashboardText += '\n';
            });
          }
          
          dashboardText += `\n**업데이트 시간**: ${new Date().toISOString()}`;
          
          return {
            content: [
              {
                type: 'text',
                text: dashboardText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 대시보드 생성 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }
        
      case 'get_workflow_status':
        try {
          const allTasks = await taskStorage.listAll();
          const allPlans = await planStorage.listAll();
          
          let statusText = `# 🔄 워크플로 상태 분석\n\n`;
          
          // 차단된 Task들 분석
          const blockedTasks = allTasks.filter(t => t.status === 'blocked');
          const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
          const todoTasks = allTasks.filter(t => t.status === 'todo');
          
          statusText += `## 📊 현재 상태\n`;
          statusText += `- 🔄 진행 중: ${inProgressTasks.length}개\n`;
          statusText += `- ⏳ 대기 중: ${todoTasks.length}개\n`;
          statusText += `- 🚫 차단됨: ${blockedTasks.length}개\n\n`;
          
          if (args.analyze_blockers && blockedTasks.length > 0) {
            statusText += `## 🚫 차단된 Task 분석\n`;
            blockedTasks.forEach(task => {
              statusText += `### ${task.title} (${task.id})\n`;
              statusText += `- 👤 담당자: ${task.assignee || 'N/A'}\n`;
              if (task.dependencies && task.dependencies.length > 0) {
                statusText += `- 🔗 의존성: ${task.dependencies.join(', ')}\n`;
              }
              statusText += `- 📅 마감일: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}\n\n`;
            });
          }
          
          // 의존성 체인 분석
          const dependencyChains = [];
          todoTasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
              const readyDeps = task.dependencies.filter(depId => {
                const depTask = allTasks.find(t => t.id === depId);
                return depTask && depTask.status === 'done';
              });
              
              if (readyDeps.length === task.dependencies.length) {
                dependencyChains.push({
                  task: task.title,
                  id: task.id,
                  ready: true
                });
              } else {
                dependencyChains.push({
                  task: task.title,
                  id: task.id,
                  ready: false,
                  waitingOn: task.dependencies.filter(depId => {
                    const depTask = allTasks.find(t => t.id === depId);
                    return !depTask || depTask.status !== 'done';
                  })
                });
              }
            }
          });
          
          if (dependencyChains.length > 0) {
            statusText += `## 🔗 의존성 분석\n`;
            
            const readyTasks = dependencyChains.filter(c => c.ready);
            if (readyTasks.length > 0) {
              statusText += `### ✅ 시작 가능한 Task (${readyTasks.length}개)\n`;
              readyTasks.forEach(task => {
                statusText += `- **${task.task}** (${task.id})\n`;
              });
              statusText += '\n';
            }
            
            const waitingTasks = dependencyChains.filter(c => !c.ready);
            if (waitingTasks.length > 0) {
              statusText += `### ⏳ 대기 중인 Task (${waitingTasks.length}개)\n`;
              waitingTasks.forEach(task => {
                statusText += `- **${task.task}** (${task.id})\n`;
                statusText += `  대기 중: ${task.waitingOn.join(', ')}\n`;
              });
            }
          }
          
          statusText += `\n**분석 시간**: ${new Date().toISOString()}`;
          
          return {
            content: [
              {
                type: 'text',
                text: statusText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 워크플로 상태 분석 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }
        
      case 'get_progress_timeline':
        try {
          const [allTasks, allPlans] = await Promise.all([
            taskStorage.listAll(),
            planStorage.listAll()
          ]);
          
          // 시간 범위 계산
          const now = new Date();
          let cutoffDate;
          switch (args.time_period) {
            case '7days':
              cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30days':
              cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              cutoffDate = new Date(0); // All time
          }
          
          let timelineText = `# 📅 프로젝트 진행 타임라인 (${args.time_period})\n\n`;
          
          // 완료된 Task들의 타임라인
          const completedTasks = allTasks
            .filter(t => t.status === 'done' && new Date(t.updatedAt) >= cutoffDate)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          
          if (completedTasks.length > 0) {
            timelineText += `## ✅ 완료된 Task (${completedTasks.length}개)\n`;
            completedTasks.forEach(task => {
              const completedDate = new Date(task.updatedAt).toLocaleDateString();
              timelineText += `**${completedDate}** - ${task.title} (${task.id})\n`;
              if (task.assignee) {
                timelineText += `  👤 담당자: ${task.assignee}\n`;
              }
              timelineText += '\n';
            });
          }
          
          // Plan 마일스톤 진행상황
          const activePlans = allPlans.filter(p => p.status === 'active');
          if (activePlans.length > 0) {
            timelineText += `## 🎯 활성 Plan 마일스톤\n`;
            activePlans.forEach(plan => {
              timelineText += `### ${plan.title} (${plan.id})\n`;
              if (plan.milestones && plan.milestones.length > 0) {
                const completedMilestones = plan.milestones.filter(m => m.completed).length;
                const progress = Math.round((completedMilestones / plan.milestones.length) * 100);
                timelineText += `**진행률**: ${progress}% (${completedMilestones}/${plan.milestones.length})\n`;
                
                plan.milestones.forEach(milestone => {
                  const status = milestone.completed ? '✅' : '⏳';
                  const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'N/A';
                  timelineText += `${status} **${milestone.title}** (마감: ${dueDate})\n`;
                });
              }
              timelineText += '\n';
            });
          }
          
          // 다가오는 마감일
          const upcomingTasks = allTasks
            .filter(t => t.dueDate && t.status !== 'done')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
          
          if (upcomingTasks.length > 0) {
            timelineText += `## ⏰ 다가오는 마감일 (상위 5개)\n`;
            upcomingTasks.forEach(task => {
              const dueDate = new Date(task.dueDate);
              const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
              const urgency = daysUntil <= 3 ? '🔥' : daysUntil <= 7 ? '⚡' : '📅';
              timelineText += `${urgency} **${task.title}** (${task.id})\n`;
              timelineText += `  📅 마감일: ${dueDate.toLocaleDateString()} (${daysUntil}일 후)\n`;
              timelineText += `  📊 상태: ${task.status}\n`;
              timelineText += `  👤 담당자: ${task.assignee || 'N/A'}\n\n`;
            });
          }
          
          timelineText += `\n**분석 시간**: ${new Date().toISOString()}`;
          
          return {
            content: [
              {
                type: 'text',
                text: timelineText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 진행 타임라인 생성 실패: ${error.message}`
              }
            ],
            isError: true
          };
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

async function main() {
  // FileStorage 초기화
  await prdStorage.initialize();
  await taskStorage.initialize();
  await planStorage.initialize();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WorkflowMCP Phase 2 Complete - CRUD + Deletion + Data Linking + Dependency Management + Dashboard system ready');
}

main().catch(console.error);