/**
 * SQLite Project Storage - 프로젝트 데이터베이스 저장소 클래스
 * 기존 TaskStorage 패턴을 따라 sqlite3/sqlite 사용
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SQLiteProjectStorage {
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

  /**
   * 데이터베이스 초기화
   */
  async initialize() {
    try {
      await this.getDatabase();
      
      console.log(`✅ SQLiteProjectStorage initialized: ${this.dbPath}`);
    } catch (error) {
      console.error('SQLiteProjectStorage 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 저장
   * @param {Object} project - 저장할 프로젝트 데이터
   */
  async saveProject(project) {
    const db = await this.getDatabase();
    
    try {
      const tagsJson = Array.isArray(project.tags) ? JSON.stringify(project.tags) : project.tags;

      await db.run(`
        INSERT OR REPLACE INTO projects (
          id, name, description, status, priority, start_date, end_date,
          created_at, updated_at, created_by, manager, tags, progress, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        project.id,
        project.name,
        project.description,
        project.status,
        project.priority,
        project.start_date,
        project.end_date,
        project.created_at,
        project.updated_at,
        project.created_by,
        project.manager,
        tagsJson,
        project.progress,
        project.notes
      ]);

      return project;
    } catch (error) {
      console.error('프로젝트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Object|null} 프로젝트 데이터
   */
  async getProject(projectId) {
    const db = await this.getDatabase();
    
    try {
      const row = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      
      if (row) {
        return this.formatProjectData(row);
      }
      return null;
    } catch (error) {
      console.error('프로젝트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 전체 프로젝트 목록 조회
   * @param {string} sortBy - 정렬 기준
   * @returns {Array} 프로젝트 목록
   */
  async listAllProjects(sortBy = 'updated_desc') {
    const db = await this.getDatabase();
    
    try {
      let orderClause = 'ORDER BY updated_at DESC';
      
      switch (sortBy) {
        case 'created_desc':
          orderClause = 'ORDER BY created_at DESC';
          break;
        case 'created_asc':
          orderClause = 'ORDER BY created_at ASC';
          break;
        case 'updated_asc':
          orderClause = 'ORDER BY updated_at ASC';
          break;
        case 'name_asc':
          orderClause = 'ORDER BY name ASC';
          break;
        case 'name_desc':
          orderClause = 'ORDER BY name DESC';
          break;
        case 'priority':
          orderClause = `ORDER BY 
            CASE priority 
              WHEN 'High' THEN 1 
              WHEN 'Medium' THEN 2 
              WHEN 'Low' THEN 3 
              ELSE 4 
            END ASC, updated_at DESC`;
          break;
        case 'status':
          orderClause = `ORDER BY 
            CASE status 
              WHEN 'active' THEN 1 
              WHEN 'planning' THEN 2 
              WHEN 'on_hold' THEN 3 
              WHEN 'completed' THEN 4 
              ELSE 5 
            END ASC, updated_at DESC`;
          break;
        default:
          orderClause = 'ORDER BY updated_at DESC';
      }

      const rows = await db.all(`SELECT * FROM projects ${orderClause}`);
      
      return rows.map(row => this.formatProjectData(row));
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 상태별 프로젝트 목록 조회
   * @param {string} status - 필터링할 상태
   * @returns {Array} 프로젝트 목록
   */
  async listProjectsByStatus(status) {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM projects 
        WHERE status = ? 
        ORDER BY updated_at DESC
      `);
      const rows = stmt.all(status);
      
      return rows.map(row => this.formatProjectData(row));
    } catch (error) {
      console.error('상태별 프로젝트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 삭제
   * @param {string} projectId - 프로젝트 ID
   */
  async deleteProject(projectId) {
    const db = await this.getDatabase();
    
    try {
      const result = await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
      
      if (result.changes === 0) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }
      
      return { success: true, deletedId: projectId };
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 진행률 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {number} progress - 진행률 (0-100)
   */
  async updateProjectProgress(projectId, progress) {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(`
        UPDATE projects 
        SET progress = ?, updated_at = ? 
        WHERE id = ?
      `);
      
      const result = stmt.run(progress, new Date().toISOString(), projectId);
      
      if (result.changes === 0) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }
      
      return { success: true, projectId, progress };
    } catch (error) {
      console.error('프로젝트 진행률 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 통계 조회
   * @returns {Object} 프로젝트 전체 통계
   */
  async getProjectStatistics() {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold,
          AVG(progress) as avg_progress
        FROM projects
      `);
      
      const stats = stmt.get();
      return {
        total: stats.total || 0,
        active: stats.active || 0,
        planning: stats.planning || 0,
        completed: stats.completed || 0,
        on_hold: stats.on_hold || 0,
        avgProgress: Math.round(stats.avg_progress || 0)
      };
    } catch (error) {
      console.error('프로젝트 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 검색
   * @param {string} searchTerm - 검색어
   * @returns {Array} 검색 결과
   */
  async searchProjects(searchTerm) {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM projects 
        WHERE name LIKE ? OR description LIKE ? OR manager LIKE ? 
        ORDER BY updated_at DESC
      `);
      
      const searchPattern = `%${searchTerm}%`;
      const rows = stmt.all(searchPattern, searchPattern, searchPattern);
      
      return rows.map(row => this.formatProjectData(row));
    } catch (error) {
      console.error('프로젝트 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 행을 프로젝트 객체로 변환
   * @param {Object} row - 데이터베이스 행
   * @returns {Object} 프로젝트 객체
   */
  formatProjectData(row) {
    try {
      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        status: row.status,
        priority: row.priority,
        start_date: row.start_date,
        end_date: row.end_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
        manager: row.manager || '',
        tags: row.tags ? JSON.parse(row.tags) : [],
        progress: row.progress || 0,
        notes: row.notes || ''
      };
    } catch (error) {
      console.error('프로젝트 데이터 포맷 실패:', error);
      return row;
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}