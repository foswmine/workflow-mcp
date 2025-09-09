/**
 * SQLite Test Storage - TestManager 패턴을 따르는 Test 저장소
 * async/await SQLite API 사용
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SQLiteTestStorage {
  constructor() {
    // dashboard/src/lib/server/ -> project root (4 levels up)
    this.dbPath = path.resolve(__dirname, '../../../../data/workflow.db');
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
    console.log(`✅ SQLiteTestStorage initialized: ${this.dbPath}`);
  }

  /**
   * Test case 저장 (INSERT OR REPLACE)
   */
  async saveTestCase(testCase) {
    console.log('🔄 SQLiteTestStorage.saveTestCase called:', testCase.id, testCase.title);
    const db = await this.getDatabase();
    
    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO test_cases (
        id, title, description, type, status, priority,
        task_id, design_id, prd_id, preconditions, test_steps,
        expected_result, test_data, estimated_duration, complexity,
        automation_status, tags, created_at, updated_at, created_by, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      testCase.id,
      testCase.title,
      testCase.description,
      testCase.type,
      testCase.status,
      testCase.priority,
      testCase.task_id,
      testCase.design_id,
      testCase.prd_id,
      testCase.preconditions,
      JSON.stringify(testCase.test_steps || []),
      testCase.expected_result,
      JSON.stringify(testCase.test_data || {}),
      testCase.estimated_duration || 0,
      testCase.complexity || 'Medium',
      testCase.automation_status || 'manual',
      JSON.stringify(testCase.tags || []),
      testCase.created_at,
      testCase.updated_at,
      testCase.created_by || 'system',
      testCase.version || 1
    );

    await stmt.finalize();
    return result;
  }

  /**
   * Test case 조회
   */
  async getTestCase(id) {
    const db = await this.getDatabase();
    const row = await db.get(`
      SELECT tc.*,
             COUNT(te.id) AS total_executions,
             COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
             COUNT(CASE WHEN te.status = 'fail' THEN 1 END) AS failed_executions,
             MAX(te.execution_date) AS last_execution_date,
             (SELECT status FROM test_executions WHERE test_case_id = tc.id ORDER BY execution_date DESC LIMIT 1) AS last_execution_status
      FROM test_cases tc
      LEFT JOIN test_executions te ON tc.id = te.test_case_id
      WHERE tc.id = ?
      GROUP BY tc.id
    `, [id]);
    
    if (!row) return null;

    return this.formatTestCaseRow(row);
  }

  /**
   * 모든 Test case 목록 조회
   */
  async listAllTestCases() {
    const db = await this.getDatabase();
    const rows = await db.all(`
      SELECT tc.*,
             COUNT(te.id) AS total_executions,
             COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
             MAX(te.execution_date) AS last_execution_date,
             (SELECT status FROM test_executions WHERE test_case_id = tc.id ORDER BY execution_date DESC LIMIT 1) AS last_execution_status
      FROM test_cases tc
      LEFT JOIN test_executions te ON tc.id = te.test_case_id
      GROUP BY tc.id
      ORDER BY tc.updated_at DESC
    `);
    
    const testCases = [];
    for (const row of rows) {
      testCases.push(this.formatTestCaseRow(row));
    }
    
    return testCases;
  }

  /**
   * Test case 삭제
   */
  async deleteTestCase(id) {
    const db = await this.getDatabase();
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Test executions 먼저 삭제 (외래키 제약조건)
      await db.run('DELETE FROM test_executions WHERE test_case_id = ?', [id]);
      
      // Test case 삭제
      const result = await db.run('DELETE FROM test_cases WHERE id = ?', [id]);
      
      await db.run('COMMIT');
      return result.changes > 0;
      
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Test execution 저장
   */
  async saveTestExecution(execution) {
    const db = await this.getDatabase();
    
    const result = await db.run(`
      INSERT INTO test_executions (
        id, test_case_id, execution_date, executed_by, environment,
        status, actual_result, notes, defects_found, actual_duration,
        started_at, completed_at, attachments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      execution.id,
      execution.test_case_id,
      execution.execution_date,
      execution.executed_by,
      execution.environment,
      execution.status,
      execution.actual_result,
      execution.notes,
      JSON.stringify(execution.defects_found || []),
      execution.actual_duration || 0,
      execution.started_at,
      execution.completed_at,
      JSON.stringify(execution.attachments || []),
      execution.created_at,
      execution.updated_at
    ]);
    
    return result;
  }

  /**
   * Test execution 목록 조회
   */
  async getTestExecutions(testCaseId) {
    const db = await this.getDatabase();
    const rows = await db.all(`
      SELECT te.*, tc.title AS test_case_title
      FROM test_executions te
      LEFT JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE te.test_case_id = ?
      ORDER BY te.execution_date DESC
    `, [testCaseId]);

    return rows.map(row => ({
      ...row,
      defects_found: this.safeJsonParse(row.defects_found, []),
      attachments: this.safeJsonParse(row.attachments, [])
    }));
  }

  /**
   * 데이터베이스 행을 Test case 객체로 변환
   */
  formatTestCaseRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      priority: row.priority,
      task_id: row.task_id,
      design_id: row.design_id,
      prd_id: row.prd_id,
      preconditions: row.preconditions,
      test_steps: this.safeJsonParse(row.test_steps, []),
      expected_result: row.expected_result,
      test_data: this.safeJsonParse(row.test_data, {}),
      estimated_duration: row.estimated_duration,
      complexity: row.complexity,
      automation_status: row.automation_status,
      tags: this.safeJsonParse(row.tags, []),
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      version: row.version,
      // Analytics data
      total_executions: row.total_executions || 0,
      passed_executions: row.passed_executions || 0,
      failed_executions: row.failed_executions || 0,
      last_execution_date: row.last_execution_date,
      last_execution_status: row.last_execution_status
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