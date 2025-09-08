/**
 * SQLite Design Storage - PRD Storage 패턴을 따르는 설계 저장소
 * async/await SQLite API 사용
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { DATABASE_PATH } from './config.js';

export class SQLiteDesignStorage {
  constructor() {
    this.dbPath = DATABASE_PATH;
    this.db = null;
    console.log('SQLite Design Storage - Database path:', this.dbPath);
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
    console.log(`✅ SQLiteDesignStorage initialized: ${this.dbPath}`);
  }

  /**
   * Design 저장
   * @param {Object} design - 저장할 설계 데이터
   */
  async saveDesign(design) {
    console.log('🔄 SQLiteDesignStorage.saveDesign called:', design.id, design.title);
    const db = await this.getDatabase();
    
    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO designs (
        id, title, description, requirement_id, status, design_type, priority,
        design_details, diagrams, acceptance_criteria, created_at, updated_at,
        created_by, version, tags, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
        design.id,
        design.title,
        design.description,
        design.requirement_id,
        design.status,
        design.design_type,
        design.priority,
        design.design_details,
        design.diagrams,
        typeof design.acceptance_criteria === 'string' ? design.acceptance_criteria : JSON.stringify(design.acceptance_criteria || []),
        design.created_at,
        design.updated_at,
        design.created_by,
        design.version,
        typeof design.tags === 'string' ? design.tags : JSON.stringify(design.tags || []),
        design.notes
    );

    await stmt.finalize();
    return result;
  }

  /**
   * Design 조회
   * @param {string} designId - Design ID
   * @returns {Object|null} Design 데이터
   */
  async getDesign(designId) {
    const db = await this.getDatabase();
    const row = await db.get('SELECT * FROM designs WHERE id = ?', designId);
    return row || null;
  }

  /**
   * 모든 Design 목록 조회
   * @returns {Array} Design 목록
   */
  async listAllDesigns() {
    const db = await this.getDatabase();
    const rows = await db.all(`
      SELECT * FROM designs 
      ORDER BY created_at DESC
    `);
    return rows || [];
  }

  /**
   * Design 삭제
   * @param {string} designId - Design ID
   * @returns {boolean} 삭제 성공 여부
   */
  async deleteDesign(designId) {
    const db = await this.getDatabase();
    const result = await db.run('DELETE FROM designs WHERE id = ?', designId);
    return result.changes > 0;
  }

  /**
   * 요구사항 ID로 관련 Design 목록 조회
   * @param {string} requirementId - 요구사항 ID  
   * @returns {Array} Design 목록
   */
  async getDesignsByRequirement(requirementId) {
    try {
      const sql = `
        SELECT * FROM designs 
        WHERE requirement_id = ?
        ORDER BY created_at ASC
      `;
      const designs = await this.db.all(sql, [requirementId]);
      return designs || [];
    } catch (error) {
      console.error('Failed to get designs by requirement:', error);
      throw error;
    }
  }

  /**
   * 상태별 Design 개수 조회
   * @returns {Object} 상태별 개수
   */
  async getDesignCountByStatus() {
    try {
      const sql = `
        SELECT status, COUNT(*) as count 
        FROM designs 
        GROUP BY status
      `;
      const results = await this.db.all(sql);
      
      const counts = {};
      results.forEach(row => {
        counts[row.status] = row.count;
      });
      
      return counts;
    } catch (error) {
      console.error('Failed to get design count by status:', error);
      throw error;
    }
  }

  /**
   * 연결 끊기 (종료 시 호출)
   */
  async close() {
    if (this.db) {
      await this.db.close();
      console.log('SQLite Design Storage closed');
    }
  }
}