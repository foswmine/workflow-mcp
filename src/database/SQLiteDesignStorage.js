/**
 * SQLite Design Storage - 설계 데이터 저장 관리
 * SQLite 데이터베이스를 사용한 설계 데이터 CRUD 작업
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { DATABASE_PATH } from '../config/database.js';

export class SQLiteDesignStorage {
  constructor() {
    this.db = null;
    this.dbPath = DATABASE_PATH;
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
    try {
      const sql = `
        INSERT OR REPLACE INTO designs (
          id, title, description, requirement_id, status, design_type, priority,
          design_details, diagrams, acceptance_criteria, created_at, updated_at,
          created_by, version, tags, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.run(sql, [
        design.id,
        design.title,
        design.description,
        design.requirement_id,
        design.status,
        design.design_type,
        design.priority,
        design.design_details,
        design.diagrams,
        design.acceptance_criteria,
        design.created_at,
        design.updated_at,
        design.created_by,
        design.version,
        design.tags,
        design.notes
      ]);

      console.log(`Design saved: ${design.title} (${design.id})`);
      return true;
    } catch (error) {
      console.error('Failed to save design:', error);
      throw error;
    }
  }

  /**
   * Design 조회
   * @param {string} designId - Design ID
   * @returns {Object|null} Design 데이터
   */
  async getDesign(designId) {
    try {
      const sql = `SELECT * FROM designs WHERE id = ?`;
      const design = await this.db.get(sql, [designId]);
      return design || null;
    } catch (error) {
      console.error('Failed to get design:', error);
      throw error;
    }
  }

  /**
   * 모든 Design 목록 조회
   * @returns {Array} Design 목록
   */
  async listAllDesigns() {
    try {
      const sql = `
        SELECT * FROM designs 
        ORDER BY created_at DESC
      `;
      const designs = await this.db.all(sql);
      return designs || [];
    } catch (error) {
      console.error('Failed to list designs:', error);
      throw error;
    }
  }

  /**
   * Design 삭제
   * @param {string} designId - Design ID
   * @returns {boolean} 삭제 성공 여부
   */
  async deleteDesign(designId) {
    try {
      const sql = `DELETE FROM designs WHERE id = ?`;
      const result = await this.db.run(sql, [designId]);
      
      console.log(`Design deleted: ${designId}`);
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to delete design:', error);
      throw error;
    }
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