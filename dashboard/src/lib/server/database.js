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
    LEFT JOIN plans pl ON p.id = pl.prd_id
    LEFT JOIN tasks t ON pl.id = t.plan_id
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

  // 2. 의존성 체크 - 관련 계획(plans)이 있는지 확인
  const relatedPlans = await database.all(
    'SELECT id, title FROM plans WHERE prd_id = ?', 
    id
  );
  
  if (relatedPlans.length > 0) {
    const planTitles = relatedPlans.map(p => p.title).join(', ');
    throw new Error(`이 PRD와 연결된 계획이 있어 삭제할 수 없습니다: ${planTitles}`);
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
  const database = await getDatabase();
  const taskRows = await database.all(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN plans pl ON t.plan_id = pl.id
    LEFT JOIN prds p ON pl.prd_id = p.id
    ORDER BY t.created_at DESC
  `);

  // Merge with file storage data
  for (const task of taskRows) {
    const fileData = await readFileStorageData('tasks', task.id);
    if (fileData) {
      // Merge file data into database record
      task.description = fileData.description || task.description;
      task.details = fileData.details;
      task.acceptance_criteria = fileData.acceptance_criteria;
      task.test_strategy = fileData.test_strategy;
      task.dependencies = fileData.dependencies;
      task.tags = fileData.tags;
      task.estimated_hours = fileData.estimated_hours;
      task.actual_hours = fileData.actual_hours;
      task.notes = fileData.notes;
    }
  }

  return taskRows;
}

export async function getTaskById(id) {
  const database = await getDatabase();
  const task = await database.get(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN plans pl ON t.plan_id = pl.id
    LEFT JOIN prds p ON pl.prd_id = p.id
    WHERE t.id = ?
  `, id);

  if (task) {
    // Merge with file storage data
    const fileData = await readFileStorageData('tasks', id);
    if (fileData) {
      // Merge file data into database record
      task.description = fileData.description || task.description;
      task.details = fileData.details;
      task.acceptance_criteria = fileData.acceptance_criteria;
      task.test_strategy = fileData.test_strategy;
      task.dependencies = fileData.dependencies;
      task.tags = fileData.tags;
      task.estimated_hours = fileData.estimated_hours;
      task.actual_hours = fileData.actual_hours;
      task.notes = fileData.notes;
    }
  }

  return task;
}

export async function getTasksByPRDId(prdId) {
  const database = await getDatabase();
  return await database.all(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN plans pl ON t.plan_id = pl.id
    LEFT JOIN prds p ON pl.prd_id = p.id
    WHERE p.id = ?
    ORDER BY t.created_at ASC
  `, prdId);
}

export async function createTask(task) {
  const database = await getDatabase();
  const result = await database.run(
    'INSERT INTO tasks (title, description, status, priority, due_date, plan_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [task.title, task.description, task.status, task.priority, task.due_date, task.plan_id]
  );
  return result.lastID;
}

export async function updateTask(id, task) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, plan_id = ?, updated_at = datetime("now") WHERE id = ?',
    [task.title, task.description, task.status, task.priority, task.due_date, task.plan_id, id]
  );
}

export async function updateTaskStatus(id, status) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ?',
    [status, id]
  );
}

export async function deleteTask(id) {
  const database = await getDatabase();
  return await database.run('DELETE FROM tasks WHERE id = ?', id);
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
    FROM plans p
    LEFT JOIN tasks t ON p.id = t.plan_id
    LEFT JOIN document_links dl ON p.id = dl.linked_entity_id AND dl.linked_entity_type = 'plan'
    LEFT JOIN documents d ON dl.document_id = d.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  // Merge with file storage data
  for (const plan of planRows) {
    const fileData = await readFileStorageData('plans', plan.id);
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
  const plan = await database.get('SELECT * FROM plans WHERE id = ?', id);
  
  if (plan) {
    // Merge with file storage data
    const fileData = await readFileStorageData('plans', id);
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
    'INSERT INTO plans (title, description, timeline, milestones, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [plan.title, plan.description, JSON.stringify(plan.timeline), JSON.stringify(plan.milestones), plan.status]
  );
  return result.lastID;
}

export async function updatePlan(id, plan) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE plans SET title = ?, description = ?, timeline = ?, milestones = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
    [plan.title, plan.description, JSON.stringify(plan.timeline), JSON.stringify(plan.milestones), plan.status, id]
  );
}

export async function deletePlan(id) {
  const database = await getDatabase();
  return await database.run('DELETE FROM plans WHERE id = ?', id);
}

// Dashboard statistics
export async function getDashboardStats() {
  const database = await getDatabase();
  
  const stats = await database.get(`
    SELECT 
      COUNT(DISTINCT p.id) as total_prds,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT pl.id) as total_plans,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
      COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_prds,
      COUNT(CASE WHEN pl.status = 'active' THEN 1 END) as active_plans
    FROM prds p
    LEFT JOIN plans pl ON p.id = pl.prd_id
    LEFT JOIN tasks t ON pl.id = t.plan_id
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