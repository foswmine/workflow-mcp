import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

// Helper function to read JSON files from WorkflowMCP file storage
async function readFileStorageData(dataType, itemId) {
  try {
    const filePath = path.join(__dirname, '../../../../data', dataType, `${itemId}.json`);
    const fileContent = await readFile(filePath, { encoding: 'utf-8' });
    return JSON.parse(fileContent);
  } catch (error) {
    // Silently ignore missing files - some items may not have JSON file storage
    return null;
  }
}

// Database path - reference the main workflow-mcp database using file location
// dashboard/src/lib/server -> ../../../../data/workflow.db 
const DB_PATH = path.resolve(__dirname, '../../../../data/workflow.db');

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Enable WAL mode for better concurrent access
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

// PRD operations
export async function getAllPRDs() {
  const database = await getDatabase();
  const prdRows = await database.all(`
    SELECT p.*, 
           COUNT(DISTINCT t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM prds p
    LEFT JOIN designs d ON p.id = d.requirement_id
    LEFT JOIN tasks t ON d.id = t.design_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  // Merge with file storage data
  for (const prd of prdRows) {
    const fileData = await readFileStorageData('prds', prd.id);
    if (fileData) {
      // Merge file data into database record
      prd.description = fileData.description || prd.description;
      prd.requirements = fileData.requirements || (prd.requirements ? JSON.parse(prd.requirements) : []);
      prd.acceptance_criteria = fileData.acceptance_criteria || (prd.acceptance_criteria ? JSON.parse(prd.acceptance_criteria) : []);
      prd.businessObjective = fileData.businessObjective;
      prd.targetUsers = fileData.targetUsers;
      prd.successCriteria = fileData.successCriteria;
      prd.epics = fileData.epics;
      prd.userStories = fileData.userStories;
      prd.technicalConstraints = fileData.technicalConstraints;
      prd.assumptions = fileData.assumptions;
      prd.risks = fileData.risks;
      prd.timeline = fileData.timeline;
      prd.qualityGates = fileData.qualityGates;
      prd.tags = fileData.tags;
      prd.attachments = fileData.attachments;
    }
  }

  return prdRows;
}

export async function getPRDById(id) {
  const database = await getDatabase();
  const prdRow = await database.get('SELECT * FROM prds WHERE id = ?', id);
  
  if (!prdRow) {
    return null;
  }

  // MCP 스타일의 향상된 PRD 조회 (PRDManager 패턴 적용)
  
  // 기본 PRD 데이터 포맷팅
  const prd = {
    id: prdRow.id,
    title: prdRow.title,
    description: prdRow.description,
    version: prdRow.version || '1.0.0',
    status: prdRow.status,
    priority: prdRow.priority,
    createdAt: prdRow.created_at,
    updatedAt: prdRow.updated_at,
    createdBy: prdRow.created_by,
    lastModifiedBy: prdRow.last_modified_by,
    businessObjective: prdRow.business_objective,
    targetUsers: safeJsonParse(prdRow.target_users, ['General users']),
    successCriteria: safeJsonParse(prdRow.success_criteria, ['Success criteria to be defined']),
    epics: safeJsonParse(prdRow.epics, []),
    requirements: safeJsonParse(prdRow.requirements, []),
    userStories: safeJsonParse(prdRow.user_stories, []),
    technicalConstraints: safeJsonParse(prdRow.technical_constraints, []),
    assumptions: safeJsonParse(prdRow.assumptions, []),
    risks: safeJsonParse(prdRow.risks, []),
    timeline: safeJsonParse(prdRow.timeline, { phases: [] }),
    qualityGates: safeJsonParse(prdRow.quality_gates, []),
    tags: safeJsonParse(prdRow.tags, []),
    attachments: safeJsonParse(prdRow.attachments, [])
  };

  // 파일 스토리지 데이터와 병합 (기존 기능 유지)
  const fileData = await readFileStorageData('prds', id);
  if (fileData) {
    // 파일 데이터로 필드 오버라이드
    prd.description = fileData.description || prd.description;
    prd.requirements = fileData.requirements || prd.requirements;
    prd.businessObjective = fileData.businessObjective || prd.businessObjective;
    prd.targetUsers = fileData.targetUsers || prd.targetUsers;
    prd.successCriteria = fileData.successCriteria || prd.successCriteria;
    prd.epics = fileData.epics || prd.epics;
    prd.userStories = fileData.userStories || prd.userStories;
    prd.technicalConstraints = fileData.technicalConstraints || prd.technicalConstraints;
    prd.assumptions = fileData.assumptions || prd.assumptions;
    prd.risks = fileData.risks || prd.risks;
    prd.timeline = fileData.timeline || prd.timeline;
    prd.qualityGates = fileData.qualityGates || prd.qualityGates;
    prd.tags = fileData.tags || prd.tags;
    prd.attachments = fileData.attachments || prd.attachments;
  }

  // MCP 스타일 분석 데이터 추가 (PRDManager 패턴)
  prd.analytics = {
    totalRequirements: prd.requirements.length,
    requirementsByType: groupRequirementsByType(prd.requirements),
    requirementsByPriority: groupRequirementsByPriority(prd.requirements),
    estimatedHours: calculateTotalHours(prd.requirements),
    completionRate: 0 // 기본값, 향후 Task 연동 시 계산
  };
  
  return prd;
}

// MCP PRDManager 유틸리티 함수들 추가
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (error) {
    console.warn('JSON 파싱 실패:', jsonString);
    return defaultValue;
  }
}

function groupRequirementsByType(requirements) {
  const grouped = {};
  requirements.forEach(req => {
    const type = req.type || 'undefined';
    if (!grouped[type]) grouped[type] = 0;
    grouped[type]++;
  });
  return grouped;
}

function groupRequirementsByPriority(requirements) {
  const grouped = {};
  requirements.forEach(req => {
    const priority = req.priority || 'undefined';
    if (!grouped[priority]) grouped[priority] = 0;
    grouped[priority]++;
  });
  return grouped;
}

function calculateTotalHours(requirements) {
  return requirements.reduce((total, req) => total + (req.estimatedHours || 0), 0);
}

export async function createPRD(prdData) {
  const database = await getDatabase();
  
  // MCP 스타일의 향상된 PRD 생성 (PRDManager 로직 적용)
  const id = crypto.randomUUID();
  
  // 기본 PRD 구조 생성 (MCP PRDManager 패턴)
  const prd = {
    id: id,
    title: prdData.title,
    description: prdData.description,
    version: '1.0.0',
    status: prdData.status || 'draft',
    priority: prdData.priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'dashboard',
    lastModifiedBy: 'dashboard',
    businessObjective: prdData.businessObjective || 'Business objective to be defined',
    targetUsers: prdData.targetUsers || ['General users'],
    successCriteria: prdData.successCriteria || ['Success criteria to be defined'],
    epics: [],
    requirements: [],
    userStories: [],
    technicalConstraints: prdData.technicalConstraints || [],
    assumptions: prdData.assumptions || [],
    risks: [],
    timeline: { phases: [] },
    qualityGates: [],
    tags: prdData.tags || [],
    attachments: []
  };

  // 요구사항 처리 (MCP PRDManager 패턴)
  if (prdData.requirements && Array.isArray(prdData.requirements)) {
    prd.requirements = prdData.requirements.map(req => {
      if (typeof req === 'string') {
        // 문자열 요구사항을 객체로 변환 (MCP 방식)
        return {
          id: crypto.randomUUID(),
          title: req.substring(0, 100),
          description: req,
          type: 'functional',
          priority: prd.priority,
          moscow: 'Must',
          acceptanceCriteria: [`${req} 기능이 정상적으로 동작해야 함`],
          dependencies: [],
          estimatedHours: 0,
          tags: []
        };
      } else {
        // 이미 구조화된 요구사항
        return {
          id: req.id || crypto.randomUUID(),
          title: req.title,
          description: req.description,
          type: req.type || 'functional',
          priority: req.priority || prd.priority,
          moscow: req.moscow || 'Must',
          acceptanceCriteria: req.acceptanceCriteria || [],
          dependencies: req.dependencies || [],
          estimatedHours: req.estimatedHours || 0,
          tags: req.tags || []
        };
      }
    });
  }

  // 간단한 검증 (MCP 패턴)
  if (!prd.title || prd.title.trim().length === 0) {
    throw new Error('제목은 필수입니다');
  }

  // 확장된 필드를 포함하여 데이터베이스에 저장
  const result = await database.run(
    'INSERT INTO prds (id, title, description, requirements, priority, status, version, created_at, updated_at, created_by, last_modified_by, business_objective, target_users, success_criteria, epics, user_stories, technical_constraints, assumptions, risks, timeline, quality_gates, tags, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      prd.id,
      prd.title,
      prd.description,
      JSON.stringify(prd.requirements),
      prd.priority,
      prd.status,
      prd.version,
      prd.createdBy,
      prd.lastModifiedBy,
      prd.businessObjective,
      JSON.stringify(prd.targetUsers),
      JSON.stringify(prd.successCriteria),
      JSON.stringify(prd.epics),
      JSON.stringify(prd.userStories),
      JSON.stringify(prd.technicalConstraints),
      JSON.stringify(prd.assumptions),
      JSON.stringify(prd.risks),
      JSON.stringify(prd.timeline),
      JSON.stringify(prd.qualityGates),
      JSON.stringify(prd.tags),
      JSON.stringify(prd.attachments)
    ]
  );
  return id;
}

export async function updatePRD(id, prd) {
  const database = await getDatabase();
  
  // MCP 스타일의 향상된 업데이트 (버전 관리 포함)
  const existingPRD = await database.get('SELECT * FROM prds WHERE id = ?', id);
  if (!existingPRD) {
    throw new Error('PRD를 찾을 수 없습니다');
  }
  
  // 버전 관리
  let newVersion = existingPRD.version;
  if (prd.title !== existingPRD.title || prd.requirements !== existingPRD.requirements) {
    const versionParts = (existingPRD.version || '1.0.0').split('.');
    const major = parseInt(versionParts[0]) || 1;
    const minor = parseInt(versionParts[1]) || 0;
    const patch = parseInt(versionParts[2]) || 0;
    newVersion = `${major}.${minor}.${patch + 1}`;
  }
  
  return await database.run(
    'UPDATE prds SET title = ?, description = ?, requirements = ?, priority = ?, status = ?, version = ?, updated_at = datetime("now"), last_modified_by = ? WHERE id = ?',
    [prd.title, prd.description, JSON.stringify(prd.requirements), prd.priority, prd.status, newVersion, 'dashboard', id]
  );
}

export async function deletePRD(id) {
  const database = await getDatabase();
  
  // MCP 스타일의 향상된 PRD 삭제 (PRDManager 패턴 적용)
  
  // 1. 삭제 전 PRD 존재 확인
  const existingPRD = await database.get('SELECT * FROM prds WHERE id = ?', id);
  if (!existingPRD) {
    throw new Error(`PRD를 찾을 수 없습니다: ${id}`);
  }

  // 2. 의존성 체크 - 관련 설계(designs)가 있는지 확인
  const relatedDesigns = await database.all(
    'SELECT id, title FROM designs WHERE requirement_id = ?', 
    id
  );
  
  if (relatedDesigns.length > 0) {
    const designTitles = relatedDesigns.map(d => d.title).join(', ');
    throw new Error(`이 PRD와 연결된 설계가 있어 삭제할 수 없습니다: ${designTitles}`);
  }

  // 3. 관련 문서 링크 체크
  const relatedDocuments = await database.all(
    'SELECT document_id FROM document_links WHERE linked_entity_type = ? AND linked_entity_id = ?',
    ['prd', id]
  );

  // 4. 트랜잭션으로 안전한 삭제 수행
  await database.run('BEGIN TRANSACTION');
  
  try {
    // 관련 문서 링크 삭제
    if (relatedDocuments.length > 0) {
      await database.run(
        'DELETE FROM document_links WHERE linked_entity_type = ? AND linked_entity_id = ?',
        ['prd', id]
      );
    }
    
    // PRD 삭제
    const result = await database.run('DELETE FROM prds WHERE id = ?', id);
    
    await database.run('COMMIT');
    
    // 삭제 결과 검증
    if (result.changes === 0) {
      throw new Error('PRD 삭제 중 오류가 발생했습니다');
    }
    
    return {
      success: true,
      deletedPRD: existingPRD.title,
      relatedDocumentsUnlinked: relatedDocuments.length,
      message: `PRD "${existingPRD.title}" 및 관련 링크 ${relatedDocuments.length}개가 성공적으로 삭제되었습니다`
    };
    
  } catch (error) {
    await database.run('ROLLBACK');
    throw error;
  }
}

// Task operations
export async function getAllTasks() {
  // MCP TaskManager로 완전히 대체된 함수
  const { TaskManager } = await import('C:/dev/workflow-mcp/src/models/TaskManager.js');
  
  try {
    const taskManager = new TaskManager();
    await taskManager.ensureInitialized();
    
    const result = await taskManager.listTasks();
    return result.success ? result.tasks : [];
  } catch (error) {
    console.error('MCP TaskManager getAllTasks 실패:', error);
    // 폴백: 기본 데이터베이스 조회
    const database = await getDatabase();
    return await database.all(`
      SELECT t.*, pl.title as plan_title, p.title as prd_title
      FROM tasks t
      LEFT JOIN designs d ON t.design_id = d.id
      LEFT JOIN prds p ON d.requirement_id = p.id
      ORDER BY t.created_at DESC
    `);
  }
}

export async function getTaskById(id) {
  // MCP TaskManager로 완전히 대체된 함수
  const { TaskManager } = await import('C:/dev/workflow-mcp/src/models/TaskManager.js');
  
  try {
    const taskManager = new TaskManager();
    await taskManager.ensureInitialized();
    
    const result = await taskManager.getTask(id);
    if (result.success) {
      // 대시보드에 필요한 추가 정보 보강 (plan_title, prd_title)
      const task = result.task;
      if (task.planId) {
        const database = await getDatabase();
        const planInfo = await database.get(`
          SELECT p.title as plan_title, pr.title as prd_title
          FROM designs d
          LEFT JOIN prds pr ON p.prd_id = pr.id
          WHERE p.id = ?
        `, task.planId);
        
        if (planInfo) {
          task.plan_title = planInfo.plan_title;
          task.prd_title = planInfo.prd_title;
        }
      }
      return task;
    }
    return null;
  } catch (error) {
    console.error('MCP TaskManager getTaskById 실패:', error);
    // 폴백: 기본 데이터베이스 조회
    const database = await getDatabase();
    return await database.get(`
      SELECT t.*, pl.title as plan_title, p.title as prd_title
      FROM tasks t
      LEFT JOIN designs d ON t.design_id = d.id
      LEFT JOIN prds p ON d.requirement_id = p.id
      WHERE t.id = ?
    `, id);
  }
}

export async function getTasksByPRDId(prdId) {
  const database = await getDatabase();
  return await database.all(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN designs d ON t.design_id = d.id
    LEFT JOIN prds p ON d.requirement_id = p.id
    WHERE p.id = ?
    ORDER BY t.created_at ASC
  `, prdId);
}

export async function createTask(task) {
  // MCP TaskManager로 완전히 대체된 함수
  const { TaskManager } = await import('C:/dev/workflow-mcp/src/models/TaskManager.js');
  
  try {
    const taskManager = new TaskManager();
    await taskManager.ensureInitialized();
    
    // 대시보드 형식을 MCP 형식으로 변환
    const taskData = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      planId: task.plan_id,
      assignee: task.assignee || null,
      estimatedHours: task.estimated_hours || 0,
      createdBy: 'dashboard'
    };
    
    const result = await taskManager.createTask(taskData);
    if (result.success) {
      return result.task.id;
    }
    throw new Error(result.message || 'Task 생성 실패');
  } catch (error) {
    console.error('MCP TaskManager createTask 실패:', error);
    // 폴백: 기본 데이터베이스 삽입
    const database = await getDatabase();
    const result = await database.run(
      'INSERT INTO tasks (title, description, status, priority, due_date, plan_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
      [task.title, task.description, task.status, task.priority, task.due_date, task.plan_id]
    );
    return result.lastID;
  }
}

export async function updateTask(id, task) {
  // MCP TaskManager로 완전히 대체된 함수
  const { TaskManager } = await import('C:/dev/workflow-mcp/src/models/TaskManager.js');
  
  try {
    const taskManager = new TaskManager();
    await taskManager.ensureInitialized();
    
    // 대시보드 형식을 MCP 형식으로 변환
    const updates = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      planId: task.plan_id,
      assignee: task.assignee,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      notes: task.notes
    };
    
    const result = await taskManager.updateTask(id, updates);
    if (result.success) {
      return { changes: 1 }; // 대시보드 호환성을 위해 changes 형식 반환
    }
    throw new Error(result.message || 'Task 업데이트 실패');
  } catch (error) {
    console.error('MCP TaskManager updateTask 실패:', error);
    // 폴백: 기본 데이터베이스 업데이트
    const database = await getDatabase();
    return await database.run(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, plan_id = ?, updated_at = datetime("now") WHERE id = ?',
      [task.title, task.description, task.status, task.priority, task.due_date, task.plan_id, id]
    );
  }
}

export async function updateTaskStatus(id, status) {
  // MCP TaskManager로 완전히 대체된 함수
  const { TaskManager } = await import('C:/dev/workflow-mcp/src/models/TaskManager.js');
  
  try {
    const taskManager = new TaskManager();
    await taskManager.ensureInitialized();
    
    const result = await taskManager.updateTask(id, { status });
    if (result.success) {
      return { changes: 1 }; // 대시보드 호환성을 위해 changes 형식 반환
    }
    throw new Error(result.message || 'Task 상태 업데이트 실패');
  } catch (error) {
    console.error('MCP TaskManager updateTaskStatus 실패:', error);
    // 폴백: 기본 데이터베이스 업데이트
    const database = await getDatabase();
    return await database.run(
      'UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, id]
    );
  }
}

export async function deleteTask(id) {
  const database = await getDatabase();
  
  console.log('🗑️ DELETE Task 요청:', id);
  
  try {
    // 우선 Task가 존재하는지 확인
    const existingTask = await database.get('SELECT * FROM tasks WHERE id = ?', id);
    if (!existingTask) {
      console.log('❌ Task not found:', id);
      throw new Error(`Task를 찾을 수 없습니다: ${id}`);
    }
    
    console.log('✅ Task 존재 확인:', existingTask.title);

    // 의존성 체크 - 다른 Task가 이 Task에 의존하는지 확인
    const dependentTasks = await database.all(
      'SELECT t.id, t.title FROM tasks t JOIN task_dependencies td ON t.id = td.dependent_task_id WHERE td.prerequisite_task_id = ?',
      id
    );

    if (dependentTasks.length > 0) {
      const dependentTitles = dependentTasks.map(t => t.title).join(', ');
      console.log('⚠️ 의존성 있는 Task들:', dependentTitles);
      throw new Error(`이 Task에 의존하는 다른 Task가 있어 삭제할 수 없습니다: ${dependentTitles}`);
    }

    // 트랜잭션으로 삭제 수행
    await database.run('BEGIN TRANSACTION');
    
    try {
      // Task dependencies 먼저 삭제 (외래키 제약조건)
      await database.run('DELETE FROM task_dependencies WHERE dependent_task_id = ? OR prerequisite_task_id = ?', id, id);
      console.log('✅ Task dependencies 삭제 완료');
      
      // Task 삭제
      const result = await database.run('DELETE FROM tasks WHERE id = ?', id);
      console.log('✅ Task 삭제 완료:', result.changes);
      
      await database.run('COMMIT');
      
      if (result.changes > 0) {
        console.log('🎉 Task 삭제 성공:', existingTask.title);
        return { changes: result.changes, deletedTask: existingTask.title };
      } else {
        throw new Error('Task가 삭제되지 않았습니다');
      }
      
    } catch (innerError) {
      await database.run('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    console.error('❌ Task 삭제 실패:', error.message);
    throw error;
  }
}

// Plan operations
export async function getAllPlans() {
  const database = await getDatabase();
  const planRows = await database.all(`
    SELECT p.*, 
           COUNT(DISTINCT t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
           d.id as document_id,
           d.title as document_title,
           d.content as document_content
    FROM designs d
    LEFT JOIN tasks t ON p.id = t.plan_id
    LEFT JOIN document_links dl ON p.id = dl.linked_entity_id AND dl.linked_entity_type = 'plan'
    LEFT JOIN documents d ON dl.document_id = d.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  // Merge with file storage data
  for (const plan of planRows) {
    const fileData = await readFileStorageData('designs', plan.id);
    if (fileData) {
      // Merge file data into database record
      plan.description = fileData.description || plan.description;
      plan.timeline = fileData.timeline || (plan.timeline ? JSON.parse(plan.timeline) : {});
      plan.milestones = fileData.milestones || (plan.milestones ? JSON.parse(plan.milestones) : []);
      plan.resources = fileData.resources;
      plan.goals = fileData.goals;
      plan.constraints = fileData.constraints;
      plan.assumptions = fileData.assumptions;
      plan.risks = fileData.risks;
      plan.success_criteria = fileData.success_criteria;
      plan.deliverables = fileData.deliverables;
      plan.stakeholders = fileData.stakeholders;
      plan.communication_plan = fileData.communication_plan;
      plan.budget = fileData.budget;
      plan.notes = fileData.notes;
      plan.tags = fileData.tags;
      // Set document_content from file data if available
      plan.document_content = fileData;
    }
  }

  return planRows;
}

export async function getPlanById(id) {
  const database = await getDatabase();
  const plan = await database.get('SELECT * FROM designs WHERE id = ?', id);
  
  if (plan) {
    // Merge with file storage data
    const fileData = await readFileStorageData('designs', id);
    if (fileData) {
      // Merge file data into database record
      plan.description = fileData.description || plan.description;
      plan.timeline = fileData.timeline || (plan.timeline ? JSON.parse(plan.timeline) : {});
      plan.milestones = fileData.milestones || (plan.milestones ? JSON.parse(plan.milestones) : []);
      plan.resources = fileData.resources;
      plan.goals = fileData.goals;
      plan.constraints = fileData.constraints;
      plan.assumptions = fileData.assumptions;
      plan.risks = fileData.risks;
      plan.success_criteria = fileData.success_criteria;
      plan.deliverables = fileData.deliverables;
      plan.stakeholders = fileData.stakeholders;
      plan.communication_plan = fileData.communication_plan;
      plan.budget = fileData.budget;
      plan.notes = fileData.notes;
      plan.tags = fileData.tags;
      // Set document_content from file data if available
      plan.document_content = fileData;
    }
  }
  
  return plan;
}

export async function createPlan(plan) {
  const database = await getDatabase();
  const result = await database.run(
    'INSERT INTO designs (title, description, timeline, milestones, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [plan.title, plan.description, JSON.stringify(plan.timeline), JSON.stringify(plan.milestones), plan.status]
  );
  return result.lastID;
}

export async function updatePlan(id, plan) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE designs SET title = ?, description = ?, timeline = ?, milestones = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
    [plan.title, plan.description, JSON.stringify(plan.timeline), JSON.stringify(plan.milestones), plan.status, id]
  );
}

export async function deletePlan(id) {
  const database = await getDatabase();
  return await database.run('DELETE FROM designs WHERE id = ?', id);
}

// Dashboard statistics
export async function getDashboardStats() {
  const database = await getDatabase();
  
  const stats = await database.get(`
    SELECT 
      COUNT(DISTINCT p.id) as total_prds,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT d.id) as total_designs,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
      COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_prds,
      COUNT(CASE WHEN d.status = 'approved' THEN 1 END) as approved_designs
    FROM prds p
    LEFT JOIN plans pl ON p.id = d.requirement_id
    LEFT JOIN tasks t ON d.id = t.plan_id
  `);
  
  return stats;
}

// Task activity timeline
export async function getTaskActivity(days = 30) {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      DATE(updated_at) as date,
      COUNT(*) as task_count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
    FROM tasks
    WHERE updated_at >= datetime('now', '-${days} days')
    GROUP BY DATE(updated_at)
    ORDER BY date ASC
  `);
}

// Priority distribution
export async function getPriorityDistribution() {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      priority,
      COUNT(*) as count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
    FROM tasks
    GROUP BY priority
  `);
}

// =====================================
// Design Management Functions
// =====================================

// Get all designs
export async function getAllDesigns() {
  const database = await getDatabase();
  console.log('🎨 getAllDesigns called');
  
  try {
    const designs = await database.all(`
      SELECT d.*,
             r.title as requirement_title,
             COUNT(DISTINCT t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM designs d
      LEFT JOIN prds r ON d.requirement_id = r.id
      LEFT JOIN tasks t ON d.id = t.design_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);
    
    console.log(`✅ Found ${designs.length} designs`);
    return designs;
  } catch (error) {
    console.error('❌ Error in getAllDesigns:', error);
    throw error;
  }
}

// Get design by ID
export async function getDesignById(id) {
  const database = await getDatabase();
  console.log('🎨 getDesignById called:', id);
  
  try {
    const design = await database.get(`
      SELECT d.*,
             r.title as requirement_title,
             COUNT(DISTINCT t.id) as task_count,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM designs d
      LEFT JOIN prds r ON d.requirement_id = r.id
      LEFT JOIN tasks t ON d.id = t.design_id
      WHERE d.id = ?
      GROUP BY d.id
    `, id);
    
    if (design) {
      console.log('✅ Found design:', design.title);
    } else {
      console.log('❌ Design not found');
    }
    
    return design;
  } catch (error) {
    console.error('❌ Error in getDesignById:', error);
    throw error;
  }
}

// Create design
export async function createDesign(designData) {
  const database = await getDatabase();
  console.log('🎨 createDesign called:', designData.title);
  
  try {
    // Generate ID if not provided
    const id = designData.id || `design-${Date.now()}`;
    
    const result = await database.run(`
      INSERT INTO designs (
        id, title, description, requirement_id, status, design_type, priority,
        design_details, diagrams, acceptance_criteria, created_at, updated_at,
        created_by, version, tags, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      designData.title,
      designData.description || '',
      designData.requirement_id || null,
      designData.status || 'draft',
      designData.design_type || 'system',
      designData.priority || 'medium',
      designData.design_details || '{}',
      designData.diagrams || '',
      designData.acceptance_criteria || '[]',
      new Date().toISOString(),
      new Date().toISOString(),
      designData.created_by || 'system',
      1,
      JSON.stringify(designData.tags || []),
      designData.notes || ''
    ]);
    
    console.log('✅ Design created:', result.changes);
    return { id, changes: result.changes };
  } catch (error) {
    console.error('❌ Error in createDesign:', error);
    throw error;
  }
}

// Update design
export async function updateDesign(id, updates) {
  const database = await getDatabase();
  console.log('🎨 updateDesign called:', id);
  
  try {
    // Get existing design
    const existing = await database.get('SELECT * FROM designs WHERE id = ?', id);
    if (!existing) {
      throw new Error(`설계를 찾을 수 없습니다: ${id}`);
    }
    
    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    
    // Only update provided fields
    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    if (updates.requirement_id !== undefined) {
      updateFields.push('requirement_id = ?');
      updateValues.push(updates.requirement_id);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }
    if (updates.design_type !== undefined) {
      updateFields.push('design_type = ?');
      updateValues.push(updates.design_type);
    }
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(updates.priority);
    }
    if (updates.design_details !== undefined) {
      updateFields.push('design_details = ?');
      updateValues.push(updates.design_details);
    }
    if (updates.diagrams !== undefined) {
      updateFields.push('diagrams = ?');
      updateValues.push(updates.diagrams);
    }
    if (updates.acceptance_criteria !== undefined) {
      updateFields.push('acceptance_criteria = ?');
      updateValues.push(updates.acceptance_criteria);
    }
    if (updates.tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(updates.tags));
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(updates.notes);
    }
    
    // Always update version and timestamp
    updateFields.push('version = version + 1');
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(id);
    
    const sql = `UPDATE designs SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await database.run(sql, updateValues);
    
    console.log('✅ Design updated:', result.changes);
    return { changes: result.changes };
  } catch (error) {
    console.error('❌ Error in updateDesign:', error);
    throw error;
  }
}

// Update design status
export async function updateDesignStatus(id, status) {
  const database = await getDatabase();
  console.log('🎨 updateDesignStatus called:', id, status);
  
  try {
    const result = await database.run(`
      UPDATE designs 
      SET status = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `, [status, new Date().toISOString(), id]);
    
    console.log('✅ Design status updated:', result.changes);
    return { changes: result.changes };
  } catch (error) {
    console.error('❌ Error in updateDesignStatus:', error);
    throw error;
  }
}

// Delete design
export async function deleteDesign(id) {
  const database = await getDatabase();
  console.log('🗑️ DELETE Design 요청:', id);
  
  try {
    // 1. Design existence check
    const existingDesign = await database.get('SELECT * FROM designs WHERE id = ?', id);
    if (!existingDesign) {
      throw new Error(`설계를 찾을 수 없습니다: ${id}`);
    }
    console.log('✅ Design 존재 확인:', existingDesign.title);
    
    // 2. Dependency check - Tasks that depend on this design
    const dependentTasks = await database.all(
      'SELECT id, title FROM tasks WHERE design_id = ?',
      id
    );
    
    if (dependentTasks.length > 0) {
      const taskTitles = dependentTasks.map(t => t.title).join(', ');
      throw new Error(`이 설계에 의존하는 작업이 있어 삭제할 수 없습니다: ${taskTitles}`);
    }
    
    // 3. Transaction-based deletion
    await database.run('BEGIN TRANSACTION');
    
    try {
      // Delete design
      const result = await database.run('DELETE FROM designs WHERE id = ?', id);
      console.log('✅ Design 삭제 완료:', result.changes);
      
      await database.run('COMMIT');
      console.log('🎉 Design 삭제 성공:', existingDesign.title);
      
      return { changes: result.changes, deletedDesign: existingDesign.title };
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Error in deleteDesign:', error);
    throw error;
  }
}