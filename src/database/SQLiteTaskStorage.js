/**
 * SQLite Task Storage - TaskManager 패턴을 따르는 Task 저장소
 * async/await SQLite API 사용
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SQLiteTaskStorage {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../../data/workflow.db');
    this.db = null;
  }

  async getDatabase() {
    if (!this.db) {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      await this.db.exec('PRAGMA foreign_keys = ON');
    }
    return this.db;
  }

  async initialize() {
    await this.getDatabase();
    console.log(`✅ SQLiteTaskStorage initialized: ${this.dbPath}`);
  }

  /**
   * Task 저장 (INSERT OR REPLACE)
   */
  async saveTask(task) {
    console.log('🔄 SQLiteTaskStorage.saveTask called:', task.id, task.title);
    const db = await this.getDatabase();
    
    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, status, priority, assignee,
        estimated_hours, actual_hours, due_date, created_at, updated_at,
        plan_id, version, created_by, tags, notes,
        details, acceptance_criteria, test_strategy, status_changed_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assignee,
      task.estimatedHours || 0,
      task.actualHours || 0,
      task.dueDate,
      task.createdAt,
      task.updatedAt,
      task.planId,
      task.version || 1,
      task.createdBy || 'system',
      JSON.stringify(task.tags || []),
      task.notes || '',
      task.details || '',
      JSON.stringify(task.acceptanceCriteria || []),
      task.testStrategy || '',
      task.statusChangedAt || null,
      task.completedAt || null
    );

    // Task dependencies 저장
    if (task.dependencies && task.dependencies.length > 0) {
      await this.saveDependencies(task.id, task.dependencies);
    }

    await stmt.finalize();
    return result;
  }

  /**
   * Task dependencies 저장
   */
  async saveDependencies(taskId, dependencies) {
    const db = await this.getDatabase();
    
    // 기존 의존성 삭제
    await db.run('DELETE FROM task_dependencies WHERE dependent_task_id = ?', taskId);
    
    // 새 의존성 추가
    for (const depId of dependencies) {
      await db.run(`
        INSERT OR IGNORE INTO task_dependencies (dependent_task_id, prerequisite_task_id, created_at)
        VALUES (?, ?, ?)
      `, taskId, depId, new Date().toISOString());
    }
  }

  /**
   * Task 조회
   */
  async getTask(id) {
    const db = await this.getDatabase();
    const row = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    
    if (!row) return null;

    const task = this.formatTaskRow(row);
    
    // Task dependencies 조회
    const dependencies = await db.all(
      'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?',
      id
    );
    task.dependencies = dependencies.map(dep => dep.prerequisite_task_id);

    return task;
  }

  /**
   * 모든 Task 목록 조회
   */
  async listAllTasks() {
    const db = await this.getDatabase();
    const rows = await db.all('SELECT * FROM tasks ORDER BY created_at DESC');
    
    const tasks = [];
    for (const row of rows) {
      const task = this.formatTaskRow(row);
      
      // 각 task의 dependencies 조회
      const dependencies = await db.all(
        'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?',
        task.id
      );
      task.dependencies = dependencies.map(dep => dep.prerequisite_task_id);
      
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * Task 삭제
   */
  async deleteTask(id) {
    const db = await this.getDatabase();
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Task dependencies 먼저 삭제 (외래키 제약조건)
      await db.run('DELETE FROM task_dependencies WHERE dependent_task_id = ? OR prerequisite_task_id = ?', id, id);
      
      // Task 삭제
      const result = await db.run('DELETE FROM tasks WHERE id = ?', id);
      
      await db.run('COMMIT');
      return result.changes > 0;
      
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 특정 assignee의 Task 목록 조회
   */
  async getTasksByAssignee(assignee) {
    const db = await this.getDatabase();
    const rows = await db.all('SELECT * FROM tasks WHERE assignee = ? ORDER BY created_at DESC', assignee);
    
    const tasks = [];
    for (const row of rows) {
      const task = this.formatTaskRow(row);
      const dependencies = await db.all(
        'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?',
        task.id
      );
      task.dependencies = dependencies.map(dep => dep.prerequisite_task_id);
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * 특정 status의 Task 목록 조회
   */
  async getTasksByStatus(status) {
    const db = await this.getDatabase();
    const rows = await db.all('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', status);
    
    const tasks = [];
    for (const row of rows) {
      const task = this.formatTaskRow(row);
      const dependencies = await db.all(
        'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?',
        task.id
      );
      task.dependencies = dependencies.map(dep => dep.prerequisite_task_id);
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * Plan에 속한 Task 목록 조회
   */
  async getTasksByPlan(planId) {
    const db = await this.getDatabase();
    const rows = await db.all('SELECT * FROM tasks WHERE plan_id = ? ORDER BY created_at DESC', planId);
    
    const tasks = [];
    for (const row of rows) {
      const task = this.formatTaskRow(row);
      const dependencies = await db.all(
        'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?',
        task.id
      );
      task.dependencies = dependencies.map(dep => dep.prerequisite_task_id);
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * 기한이 임박한 Task 조회
   */
  async getUpcomingTasks(daysFromNow = 7) {
    const db = await this.getDatabase();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    
    const rows = await db.all(`
      SELECT * FROM tasks 
      WHERE due_date IS NOT NULL 
        AND due_date <= ? 
        AND status != 'done'
      ORDER BY due_date ASC
    `, targetDate.toISOString());
    
    const tasks = [];
    for (const row of rows) {
      const task = this.formatTaskRow(row);
      const dependencies = await db.all(
        'SELECT prerequisite_task_id FROM task_dependencies WHERE dependent_task_id = ?',
        task.id
      );
      task.dependencies = dependencies.map(dep => dep.prerequisite_task_id);
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * 통계 데이터 조회
   */
  async getTaskStats() {
    const db = await this.getDatabase();
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done_tasks,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks,
        AVG(CASE WHEN status = 'done' AND actual_hours > 0 THEN actual_hours END) as avg_completion_hours,
        COUNT(CASE WHEN due_date < datetime('now') AND status != 'done' THEN 1 END) as overdue_tasks
      FROM tasks
    `);
    
    return stats;
  }

  /**
   * 데이터베이스 행을 Task 객체로 변환
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
      planId: row.plan_id,
      version: row.version,
      createdBy: row.created_by,
      tags: this.safeJsonParse(row.tags, []),
      notes: row.notes,
      details: row.details,
      acceptanceCriteria: this.safeJsonParse(row.acceptance_criteria, []),
      testStrategy: row.test_strategy,
      statusChangedAt: row.status_changed_at,
      completedAt: row.completed_at,
      dependencies: [] // Will be populated by calling method
    };
  }

  /**
   * 안전한 JSON 파싱
   */
  safeJsonParse(jsonString, defaultValue = null) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('JSON 파싱 실패:', jsonString);
      return defaultValue;
    }
  }

  async cleanup() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}