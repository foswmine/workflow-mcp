/**
 * SQLite Storage - SQLite 기반 데이터 저장소
 * Phase 2.5: JSON 파일 저장소를 SQLite로 전환
 */

import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SQLiteStorage {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/workflow.db');
    this.schemaPath = path.join(__dirname, 'schema.sql');
    this.db = null;
    this.initialized = false;
  }

  /**
   * 데이터베이스 초기화
   */
  async initialize() {
    try {
      // 데이터 디렉토리 생성
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // SQLite 데이터베이스 연결
      this.db = new Database(this.dbPath);
      
      // WAL 모드 활성화 (다중 세션 지원)
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');

      // 스키마 적용
      await this.applySchema();

      this.initialized = true;
      console.log(`SQLiteStorage initialized at ${this.dbPath}`);
    } catch (error) {
      throw new Error(`Failed to initialize SQLiteStorage: ${error.message}`);
    }
  }

  /**
   * 데이터베이스 스키마 적용
   */
  async applySchema() {
    try {
      const schemaSQL = await fs.readFile(this.schemaPath, 'utf8');
      
      // 스키마를 개별 명령으로 분할하여 실행
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          this.db.exec(statement + ';');
        } catch (error) {
          // 일부 명령은 이미 존재할 수 있으므로 계속 진행
          console.warn(`Schema statement warning: ${error.message}`);
        }
      }

      console.log('Database schema applied successfully');
    } catch (error) {
      throw new Error(`Failed to apply schema: ${error.message}`);
    }
  }

  /**
   * 연결 확인
   */
  ensureInitialized() {
    if (!this.initialized || !this.db) {
      throw new Error('SQLiteStorage not initialized. Call initialize() first.');
    }
  }

  // =============================================
  // PRD Operations
  // =============================================

  /**
   * PRD 저장
   */
  savePRD(prd) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO prds (
        id, title, description, requirements, priority, status, 
        created_at, updated_at, version, created_by, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      prd.id,
      prd.title,
      prd.description,
      JSON.stringify(prd.requirements || []),
      prd.priority || 'Medium',
      prd.status || 'draft',
      prd.createdAt,
      prd.updatedAt || prd.createdAt,
      prd.version || 1,
      prd.createdBy || null,
      JSON.stringify(prd.tags || [])
    );
  }

  /**
   * PRD 조회
   */
  getPRD(id) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare('SELECT * FROM prds WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return this.formatPRDRow(row);
  }

  /**
   * 모든 PRD 목록 조회
   */
  listAllPRDs() {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT * FROM prds 
      ORDER BY created_at DESC
    `);
    
    return stmt.all().map(row => this.formatPRDRow(row));
  }

  /**
   * PRD 삭제
   */
  deletePRD(id) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare('DELETE FROM prds WHERE id = ?');
    return stmt.run(id);
  }

  /**
   * PRD 포맷팅
   */
  formatPRDRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: JSON.parse(row.requirements || '[]'),
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      createdBy: row.created_by,
      tags: JSON.parse(row.tags || '[]'),
      // Phase 2 호환성을 위한 추가 필드
      linked_plans: this.getLinkedPlans(row.id)
    };
  }

  // =============================================
  // Task Operations
  // =============================================

  /**
   * Task 저장
   */
  saveTask(task) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, status, priority, assignee, 
        estimated_hours, actual_hours, due_date, created_at, updated_at,
        plan_id, version, created_by, tags, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      task.id,
      task.title,
      task.description,
      task.status || 'pending',
      task.priority || 'Medium',
      task.assignee || null,
      task.estimatedHours || null,
      task.actualHours || null,
      task.dueDate || null,
      task.createdAt,
      task.updatedAt || task.createdAt,
      task.plan_id || null,
      task.version || 1,
      task.createdBy || null,
      JSON.stringify(task.tags || []),
      task.notes || null
    );

    // 의존성 관계 저장
    if (task.dependencies && task.dependencies.length > 0) {
      this.saveTaskDependencies(task.id, task.dependencies);
    }

    return result;
  }

  /**
   * Task 조회
   */
  getTask(id) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return this.formatTaskRow(row);
  }

  /**
   * 모든 Task 목록 조회
   */
  listAllTasks() {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT * FROM tasks 
      ORDER BY created_at DESC
    `);
    
    return stmt.all().map(row => this.formatTaskRow(row));
  }

  /**
   * Task 삭제
   */
  deleteTask(id) {
    this.ensureInitialized();
    
    // 트랜잭션으로 의존성 관계도 함께 삭제
    const deleteTask = this.db.transaction(() => {
      // 의존성 관계 삭제
      this.db.prepare('DELETE FROM task_dependencies WHERE dependent_task_id = ? OR prerequisite_task_id = ?').run(id, id);
      
      // 계획-작업 연결 삭제
      this.db.prepare('DELETE FROM plan_task_links WHERE task_id = ?').run(id);
      
      // 작업 삭제
      return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    });

    return deleteTask();
  }

  /**
   * Task 포맷팅
   */
  formatTaskRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignee: row.assignee,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      plan_id: row.plan_id,
      version: row.version,
      createdBy: row.created_by,
      tags: JSON.parse(row.tags || '[]'),
      notes: row.notes,
      // Phase 2 호환성을 위한 의존성 배열
      dependencies: this.getTaskDependencies(row.id),
      dependents: this.getTaskDependents(row.id)
    };
  }

  // =============================================
  // Plan Operations
  // =============================================

  /**
   * Plan 저장
   */
  savePlan(plan) {
    this.ensureInitialized();
    
    const planStmt = this.db.prepare(`
      INSERT OR REPLACE INTO plans (
        id, title, description, status, start_date, end_date, 
        created_at, updated_at, prd_id, version, created_by, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = planStmt.run(
      plan.id,
      plan.title,
      plan.description,
      plan.status || 'active',
      plan.startDate || null,
      plan.endDate || null,
      plan.createdAt,
      plan.updatedAt || plan.createdAt,
      plan.prd_id || null,
      plan.version || 1,
      plan.createdBy || null,
      JSON.stringify(plan.tags || [])
    );

    // 마일스톤 저장
    if (plan.milestones && plan.milestones.length > 0) {
      this.saveMilestones(plan.id, plan.milestones);
    }

    return result;
  }

  /**
   * Plan 조회
   */
  getPlan(id) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare('SELECT * FROM plans WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return this.formatPlanRow(row);
  }

  /**
   * 모든 Plan 목록 조회
   */
  listAllPlans() {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT * FROM plans 
      ORDER BY created_at DESC
    `);
    
    return stmt.all().map(row => this.formatPlanRow(row));
  }

  /**
   * Plan 삭제
   */
  deletePlan(id) {
    this.ensureInitialized();
    
    // 트랜잭션으로 관련 데이터 모두 삭제
    const deletePlan = this.db.transaction(() => {
      // 마일스톤 삭제 (CASCADE 설정되어 있음)
      this.db.prepare('DELETE FROM milestones WHERE plan_id = ?').run(id);
      
      // 계획-작업 연결 삭제
      this.db.prepare('DELETE FROM plan_task_links WHERE plan_id = ?').run(id);
      
      // PRD-Plan 연결 삭제
      this.db.prepare('DELETE FROM prd_plan_links WHERE plan_id = ?').run(id);
      
      // Plan 삭제
      return this.db.prepare('DELETE FROM plans WHERE id = ?').run(id);
    });

    return deletePlan();
  }

  /**
   * Plan 포맷팅
   */
  formatPlanRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      prd_id: row.prd_id,
      version: row.version,
      createdBy: row.created_by,
      tags: JSON.parse(row.tags || '[]'),
      // Phase 2 호환성을 위한 추가 필드
      milestones: this.getMilestones(row.id),
      linked_task_ids: this.getLinkedTasks(row.id),
      progress: {
        percentage: row.progress_percentage || 0,
        totalTasks: row.total_tasks || 0,
        completedTasks: row.completed_tasks || 0,
        inProgressTasks: row.in_progress_tasks || 0,
        todoTasks: row.todo_tasks || 0,
        blockedTasks: row.blocked_tasks || 0,
        lastSyncAt: row.last_sync_at,
        estimatedCompletionDate: row.estimated_completion_date
      }
    };
  }

  // =============================================
  // Relationship Operations
  // =============================================

  /**
   * PRD-Plan 연결
   */
  linkPRDToPlan(prdId, planId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO prd_plan_links (prd_id, plan_id, created_at)
      VALUES (?, ?, ?)
    `);
    
    return stmt.run(prdId, planId, new Date().toISOString());
  }

  /**
   * Plan-Task 연결
   */
  linkPlanToTask(planId, taskId) {
    this.ensureInitialized();
    
    const linkTransaction = this.db.transaction(() => {
      // plan_task_links 테이블에 연결 추가
      const linkStmt = this.db.prepare(`
        INSERT OR IGNORE INTO plan_task_links (plan_id, task_id, created_at)
        VALUES (?, ?, ?)
      `);
      linkStmt.run(planId, taskId, new Date().toISOString());
      
      // tasks 테이블의 plan_id도 업데이트
      const updateStmt = this.db.prepare(`
        UPDATE tasks SET plan_id = ?, updated_at = ? WHERE id = ?
      `);
      updateStmt.run(planId, new Date().toISOString(), taskId);
    });

    return linkTransaction();
  }

  /**
   * Task 의존성 추가
   */
  addTaskDependency(dependentTaskId, prerequisiteTaskId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      INSERT INTO task_dependencies (dependent_task_id, prerequisite_task_id, created_at)
      VALUES (?, ?, ?)
    `);
    
    try {
      return stmt.run(dependentTaskId, prerequisiteTaskId, new Date().toISOString());
    } catch (error) {
      if (error.message.includes('순환 의존성')) {
        throw new Error(error.message);
      }
      throw new Error(`의존성 추가 실패: ${error.message}`);
    }
  }

  /**
   * Task 의존성 제거
   */
  removeTaskDependency(dependentTaskId, prerequisiteTaskId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      DELETE FROM task_dependencies 
      WHERE dependent_task_id = ? AND prerequisite_task_id = ?
    `);
    
    return stmt.run(dependentTaskId, prerequisiteTaskId);
  }

  // =============================================
  // Helper Methods
  // =============================================

  /**
   * PRD와 연결된 Plan 목록 조회
   */
  getLinkedPlans(prdId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT p.id FROM plans p
      JOIN prd_plan_links ppl ON p.id = ppl.plan_id
      WHERE ppl.prd_id = ?
    `);
    
    return stmt.all(prdId).map(row => row.id);
  }

  /**
   * Plan과 연결된 Task 목록 조회
   */
  getLinkedTasks(planId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT t.id FROM tasks t
      JOIN plan_task_links ptl ON t.id = ptl.task_id
      WHERE ptl.plan_id = ?
    `);
    
    return stmt.all(planId).map(row => row.id);
  }

  /**
   * Task의 의존성(선행조건) 목록 조회
   */
  getTaskDependencies(taskId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT prerequisite_task_id FROM task_dependencies
      WHERE dependent_task_id = ?
    `);
    
    return stmt.all(taskId).map(row => row.prerequisite_task_id);
  }

  /**
   * Task에 의존하는(후행) Task 목록 조회
   */
  getTaskDependents(taskId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT dependent_task_id FROM task_dependencies
      WHERE prerequisite_task_id = ?
    `);
    
    return stmt.all(taskId).map(row => row.dependent_task_id);
  }

  /**
   * Plan의 마일스톤 목록 조회
   */
  getMilestones(planId) {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT * FROM milestones 
      WHERE plan_id = ? 
      ORDER BY sort_order, due_date
    `);
    
    return stmt.all(planId).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
      sortOrder: row.sort_order
    }));
  }

  /**
   * 마일스톤 저장
   */
  saveMilestones(planId, milestones) {
    this.ensureInitialized();
    
    const deleteStmt = this.db.prepare('DELETE FROM milestones WHERE plan_id = ?');
    const insertStmt = this.db.prepare(`
      INSERT INTO milestones (
        id, plan_id, title, description, due_date, completed, 
        completed_at, created_at, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteStmt.run(planId);
      
      milestones.forEach((milestone, index) => {
        const id = `milestone_${Date.now()}_${index}`;
        insertStmt.run(
          id,
          planId,
          milestone.title,
          milestone.description || null,
          milestone.dueDate || null,
          milestone.completed || false,
          milestone.completedAt || null,
          new Date().toISOString(),
          index
        );
      });
    });

    return transaction();
  }

  /**
   * Task 의존성 일괄 저장
   */
  saveTaskDependencies(taskId, dependencies) {
    this.ensureInitialized();
    
    const deleteStmt = this.db.prepare('DELETE FROM task_dependencies WHERE dependent_task_id = ?');
    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO task_dependencies (dependent_task_id, prerequisite_task_id, created_at)
      VALUES (?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteStmt.run(taskId);
      
      dependencies.forEach(prerequisiteId => {
        try {
          insertStmt.run(taskId, prerequisiteId, new Date().toISOString());
        } catch (error) {
          console.warn(`의존성 추가 건너뛰기 ${taskId} -> ${prerequisiteId}: ${error.message}`);
        }
      });
    });

    return transaction();
  }

  // =============================================
  // Dashboard and Analytics
  // =============================================

  /**
   * 대시보드 통계 조회
   */
  getDashboardStats() {
    this.ensureInitialized();
    
    const stmt = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM prds) AS total_prds,
        (SELECT COUNT(*) FROM plans) AS total_plans,
        (SELECT COUNT(*) FROM tasks) AS total_tasks,
        (SELECT COUNT(*) FROM milestones) AS total_milestones,
        (SELECT COUNT(*) FROM prds WHERE status = 'approved') AS approved_prds,
        (SELECT COUNT(*) FROM plans WHERE status = 'active') AS active_plans,
        (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'blocked') AS blocked_tasks,
        (SELECT COUNT(*) FROM milestones WHERE completed = 1) AS completed_milestones
    `);
    
    return stmt.get();
  }

  /**
   * 워크플로 상태 분석
   */
  getWorkflowStatus() {
    this.ensureInitialized();
    
    const blockedTasksStmt = this.db.prepare(`
      SELECT id, title, assignee FROM tasks 
      WHERE status = 'blocked'
      ORDER BY created_at DESC
    `);
    
    const readyTasksStmt = this.db.prepare(`
      SELECT t.id, t.title, t.assignee FROM tasks t
      WHERE t.status = 'pending'
        AND NOT EXISTS (
          SELECT 1 FROM task_dependencies td 
          JOIN tasks pt ON td.prerequisite_task_id = pt.id
          WHERE td.dependent_task_id = t.id AND pt.status != 'done'
        )
      ORDER BY t.priority DESC, t.created_at
    `);
    
    return {
      blockedTasks: blockedTasksStmt.all(),
      readyTasks: readyTasksStmt.all(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 데이터베이스 정리 및 최적화
   */
  cleanup() {
    if (this.db) {
      this.db.pragma('optimize');
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * 백업 생성
   */
  async createBackup() {
    this.ensureInitialized();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupDir, `workflow-backup-${timestamp}.db`);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      this.db.backup(backupPath, (err) => {
        if (err) {
          reject(new Error(`백업 생성 실패: ${err.message}`));
        } else {
          resolve(backupPath);
        }
      });
    });
  }
}