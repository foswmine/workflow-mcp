/**
 * Simple SQLite Storage - 기본 sqlite3 패키지 사용
 * Phase 2.5: JSON 파일 저장소를 SQLite로 전환
 * Windows 환경에서도 안정적으로 작동하는 간단한 구현
 */

import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SimpleSQLiteStorage {
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
    return new Promise(async (resolve, reject) => {
      try {
        // 데이터 디렉토리 생성
        const dataDir = path.dirname(this.dbPath);
        await fs.mkdir(dataDir, { recursive: true });

        // SQLite 데이터베이스 연결
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            reject(new Error(`Failed to connect to SQLite: ${err.message}`));
            return;
          }
        });

        // 프라미스 헬퍼 메서드 추가
        this.db.runAsync = promisify(this.db.run.bind(this.db));
        this.db.getAsync = promisify(this.db.get.bind(this.db));
        this.db.allAsync = promisify(this.db.all.bind(this.db));

        // 스키마 적용
        await this.applySchema();

        this.initialized = true;
        console.log(`SimpleSQLiteStorage initialized at ${this.dbPath}`);
        resolve();
      } catch (error) {
        reject(new Error(`Failed to initialize SimpleSQLiteStorage: ${error.message}`));
      }
    });
  }

  /**
   * 데이터베이스 스키마 적용
   */
  async applySchema() {
    try {
      const schemaSQL = await fs.readFile(this.schemaPath, 'utf8');
      
      // 간단한 테이블만 생성 (복잡한 스키마는 나중에 적용)
      const basicSchema = `
        PRAGMA foreign_keys = ON;
        
        CREATE TABLE IF NOT EXISTS prds (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          requirements TEXT,
          priority TEXT DEFAULT 'Medium',
          status TEXT DEFAULT 'draft',
          created_at TEXT NOT NULL,
          updated_at TEXT
        );
        
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'Medium',
          assignee TEXT,
          estimated_hours INTEGER,
          due_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          plan_id TEXT
        );
        
        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          start_date TEXT,
          end_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          prd_id TEXT
        );
        
        CREATE TABLE IF NOT EXISTS task_dependencies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dependent_task_id TEXT NOT NULL,
          prerequisite_task_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `;

      // 스키마를 개별 명령으로 분할하여 실행
      const statements = basicSchema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          await this.db.runAsync(statement);
        } catch (error) {
          console.warn(`Schema statement warning: ${error.message}`);
        }
      }

      console.log('Basic database schema applied successfully');
    } catch (error) {
      throw new Error(`Failed to apply schema: ${error.message}`);
    }
  }

  /**
   * 연결 확인
   */
  ensureInitialized() {
    if (!this.initialized || !this.db) {
      throw new Error('SimpleSQLiteStorage not initialized. Call initialize() first.');
    }
  }

  // =============================================
  // PRD Operations
  // =============================================

  /**
   * PRD 저장
   */
  async savePRD(prd) {
    this.ensureInitialized();
    
    const sql = `
      INSERT OR REPLACE INTO prds (
        id, title, description, requirements, priority, status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await this.db.runAsync(
      sql,
      prd.id,
      prd.title,
      prd.description,
      JSON.stringify(prd.requirements || []),
      prd.priority || 'Medium',
      prd.status || 'draft',
      prd.createdAt,
      prd.updatedAt || prd.createdAt
    );
  }

  /**
   * PRD 조회
   */
  async getPRD(id) {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM prds WHERE id = ?';
    const row = await this.db.getAsync(sql, id);
    
    if (!row) return null;
    
    return this.formatPRDRow(row);
  }

  /**
   * 모든 PRD 목록 조회
   */
  async listAllPRDs() {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM prds ORDER BY created_at DESC';
    const rows = await this.db.allAsync(sql);
    
    return rows.map(row => this.formatPRDRow(row));
  }

  /**
   * PRD 삭제
   */
  async deletePRD(id) {
    this.ensureInitialized();
    
    const sql = 'DELETE FROM prds WHERE id = ?';
    return await this.db.runAsync(sql, id);
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
      updatedAt: row.updated_at
    };
  }

  // =============================================
  // Task Operations
  // =============================================

  /**
   * Task 저장
   */
  async saveTask(task) {
    this.ensureInitialized();
    
    const sql = `
      INSERT OR REPLACE INTO tasks (
        id, title, description, status, priority, assignee, 
        estimated_hours, due_date, created_at, updated_at, plan_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await this.db.runAsync(
      sql,
      task.id,
      task.title,
      task.description,
      task.status || 'pending',
      task.priority || 'Medium',
      task.assignee || null,
      task.estimatedHours || null,
      task.dueDate || null,
      task.createdAt,
      task.updatedAt || task.createdAt,
      task.plan_id || null
    );
  }

  /**
   * Task 조회
   */
  async getTask(id) {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM tasks WHERE id = ?';
    const row = await this.db.getAsync(sql, id);
    
    if (!row) return null;
    
    return await this.formatTaskRow(row);
  }

  /**
   * 모든 Task 목록 조회
   */
  async listAllTasks() {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
    const rows = await this.db.allAsync(sql);
    
    const tasks = [];
    for (const row of rows) {
      tasks.push(await this.formatTaskRow(row));
    }
    return tasks;
  }

  /**
   * Task 삭제
   */
  async deleteTask(id) {
    this.ensureInitialized();
    
    // 의존성 관계도 함께 삭제
    await this.db.runAsync('DELETE FROM task_dependencies WHERE dependent_task_id = ? OR prerequisite_task_id = ?', id, id);
    
    const sql = 'DELETE FROM tasks WHERE id = ?';
    return await this.db.runAsync(sql, id);
  }

  /**
   * Task 포맷팅
   */
  async formatTaskRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignee: row.assignee,
      estimatedHours: row.estimated_hours,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      plan_id: row.plan_id,
      // 의존성 배열 추가
      dependencies: await this.getTaskDependencies(row.id)
    };
  }

  // =============================================
  // Plan Operations
  // =============================================

  /**
   * Plan 저장
   */
  async savePlan(plan) {
    this.ensureInitialized();
    
    const sql = `
      INSERT OR REPLACE INTO plans (
        id, title, description, status, start_date, end_date, 
        created_at, updated_at, prd_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await this.db.runAsync(
      sql,
      plan.id,
      plan.title,
      plan.description,
      plan.status || 'active',
      plan.startDate || null,
      plan.endDate || null,
      plan.createdAt,
      plan.updatedAt || plan.createdAt,
      plan.prd_id || null
    );
  }

  /**
   * Plan 조회
   */
  async getPlan(id) {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM plans WHERE id = ?';
    const row = await this.db.getAsync(sql, id);
    
    if (!row) return null;
    
    return await this.formatPlanRow(row);
  }

  /**
   * 모든 Plan 목록 조회
   */
  async listAllPlans() {
    this.ensureInitialized();
    
    const sql = 'SELECT * FROM plans ORDER BY created_at DESC';
    const rows = await this.db.allAsync(sql);
    
    const plans = [];
    for (const row of rows) {
      plans.push(await this.formatPlanRow(row));
    }
    return plans;
  }

  /**
   * Plan 삭제
   */
  async deletePlan(id) {
    this.ensureInitialized();
    
    const sql = 'DELETE FROM plans WHERE id = ?';
    return await this.db.runAsync(sql, id);
  }

  /**
   * Plan 포맷팅
   */
  async formatPlanRow(row) {
    // 연결된 Task들 찾기
    const linkedTasks = await this.db.allAsync('SELECT id FROM tasks WHERE plan_id = ?', row.id);
    
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
      // Phase 2 호환성을 위한 추가 필드
      linked_task_ids: linkedTasks.map(t => t.id),
      progress: await this.calculatePlanProgress(row.id)
    };
  }

  // =============================================
  // Helper Methods
  // =============================================

  /**
   * Task의 의존성 목록 조회
   */
  async getTaskDependencies(taskId) {
    this.ensureInitialized();
    
    const sql = 'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?';
    const rows = await this.db.allAsync(sql, taskId);
    
    return rows.map(row => row.prerequisite_task_id);
  }

  /**
   * Task 의존성 추가
   */
  async addTaskDependency(dependentTaskId, prerequisiteTaskId) {
    this.ensureInitialized();
    
    const sql = `
      INSERT INTO task_dependencies (dependent_task_id, prerequisite_task_id, created_at)
      VALUES (?, ?, ?)
    `;
    
    return await this.db.runAsync(sql, dependentTaskId, prerequisiteTaskId, new Date().toISOString());
  }

  /**
   * Plan 진행률 계산
   */
  async calculatePlanProgress(planId) {
    this.ensureInitialized();
    
    const totalTasksSql = 'SELECT COUNT(*) as count FROM tasks WHERE plan_id = ?';
    const completedTasksSql = 'SELECT COUNT(*) as count FROM tasks WHERE plan_id = ? AND status = ?';
    
    const totalResult = await this.db.getAsync(totalTasksSql, planId);
    const completedResult = await this.db.getAsync(completedTasksSql, planId, 'done');
    
    const totalTasks = totalResult.count;
    const completedTasks = completedResult.count;
    
    return {
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalTasks,
      completedTasks,
      lastSyncAt: new Date().toISOString()
    };
  }

  /**
   * 대시보드 통계 조회
   */
  async getDashboardStats() {
    this.ensureInitialized();
    
    const prdCount = await this.db.getAsync('SELECT COUNT(*) as count FROM prds');
    const taskCount = await this.db.getAsync('SELECT COUNT(*) as count FROM tasks');
    const planCount = await this.db.getAsync('SELECT COUNT(*) as count FROM plans');
    
    return {
      total_prds: prdCount.count,
      total_tasks: taskCount.count,
      total_plans: planCount.count,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 데이터베이스 연결 정리
   */
  cleanup() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.warn(`Database close warning: ${err.message}`);
          }
          this.db = null;
          this.initialized = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 모든 테이블 목록 조회 (디버깅용)
   */
  async getTables() {
    this.ensureInitialized();
    
    const sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
    const rows = await this.db.allAsync(sql);
    
    return rows.map(row => row.name);
  }
}