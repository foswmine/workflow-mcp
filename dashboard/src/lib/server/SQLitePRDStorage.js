/**
 * SQLite PRD Storage - DocumentManager 패턴을 따르는 PRD 저장소
 * async/await SQLite API 사용
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SQLitePRDStorage {
  constructor() {
    // Use file-based relative path for both MCP server and dashboard
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // dashboard/src/lib/server/ -> project root (4 levels up)
    this.dbPath = path.resolve(__dirname, '../../../../data/workflow.db');
    this.db = null;
    console.log('SQLite PRD Storage - Database path:', this.dbPath);
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
    console.log(`✅ SQLitePRDStorage initialized: ${this.dbPath}`);
  }

  /**
   * PRD 저장 (INSERT OR REPLACE)
   */
  async savePRD(prd) {
    console.log('🔄 SQLitePRDStorage.savePRD called:', prd.id, prd.title);
    const db = await this.getDatabase();
    
    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO prds (
        id, title, description, status, priority, version,
        created_at, updated_at, created_by, last_modified_by,
        business_objective, target_users, success_criteria,
        epics, requirements, acceptance_criteria, user_stories, technical_constraints,
        assumptions, risks, timeline, quality_gates, tags, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      prd.id,
      prd.title,
      prd.description,
      prd.status,
      prd.priority,
      prd.version || '1.0.0',
      prd.createdAt || new Date().toISOString(),
      prd.updatedAt || new Date().toISOString(),
      prd.createdBy || 'system',
      prd.lastModifiedBy || 'system',
      prd.businessObjective || 'Business objective to be defined',
      JSON.stringify(prd.targetUsers || ['General users']),
      JSON.stringify(prd.successCriteria || ['Success criteria to be defined']),
      JSON.stringify(prd.epics || []),
      JSON.stringify(prd.requirements || []),
      JSON.stringify(prd.acceptance_criteria || []),
      JSON.stringify(prd.userStories || []),
      JSON.stringify(prd.technicalConstraints || []),
      JSON.stringify(prd.assumptions || []),
      JSON.stringify(prd.risks || []),
      JSON.stringify(prd.timeline || { phases: [] }),
      JSON.stringify(prd.qualityGates || []),
      JSON.stringify(prd.tags || []),
      JSON.stringify(prd.attachments || [])
    );

    await stmt.finalize();
    return result;
  }

  /**
   * PRD 조회
   */
  async getPRD(id) {
    const db = await this.getDatabase();
    const row = await db.get('SELECT * FROM prds WHERE id = ?', id);
    
    if (!row) return null;

    return this.formatPRDRow(row);
  }

  /**
   * 모든 PRD 목록 조회
   */
  async listAllPRDs(sortBy = 'created_desc') {
    const db = await this.getDatabase();
    
    // 정렬 옵션에 따른 ORDER BY 절 생성 (날짜 변환을 통한 올바른 정렬)
    let orderClause = 'ORDER BY datetime(CASE WHEN created_at LIKE "%T%" THEN created_at ELSE datetime(created_at/1000, "unixepoch") END) DESC'; // 기본값
    
    switch (sortBy) {
      case 'created_desc':
        orderClause = 'ORDER BY datetime(CASE WHEN created_at LIKE "%T%" THEN created_at ELSE datetime(created_at/1000, "unixepoch") END) DESC';
        break;
      case 'created_asc':
        orderClause = 'ORDER BY datetime(CASE WHEN created_at LIKE "%T%" THEN created_at ELSE datetime(created_at/1000, "unixepoch") END) ASC';
        break;
      case 'updated_desc':
        orderClause = 'ORDER BY datetime(CASE WHEN updated_at LIKE "%T%" THEN updated_at ELSE datetime(updated_at/1000, "unixepoch") END) DESC';
        break;
      case 'updated_asc':
        orderClause = 'ORDER BY datetime(CASE WHEN updated_at LIKE "%T%" THEN updated_at ELSE datetime(updated_at/1000, "unixepoch") END) ASC';
        break;
      case 'title_asc':
        orderClause = 'ORDER BY title ASC';
        break;
      case 'title_desc':
        orderClause = 'ORDER BY title DESC';
        break;
      default:
        orderClause = 'ORDER BY datetime(CASE WHEN created_at LIKE "%T%" THEN created_at ELSE datetime(created_at/1000, "unixepoch") END) DESC';
    }
    
    const rows = await db.all(`SELECT * FROM prds ${orderClause}`);
    
    return rows.map(row => this.formatPRDRow(row));
  }

  /**
   * PRD 삭제
   */
  async deletePRD(id) {
    const db = await this.getDatabase();
    
    // Disable foreign key constraints temporarily
    await db.run('PRAGMA foreign_keys = OFF');
    
    // Begin transaction for consistency
    await db.run('BEGIN TRANSACTION');
    
    try {
      console.log(`🗑️ Starting PRD deletion for ID: ${id} (Foreign keys disabled)`);
      
      // Step 1: Delete tasks that might reference this PRD through design_id
      // First, get all design IDs that reference this PRD
      const designIds = await db.all('SELECT id FROM designs WHERE requirement_id = ?', id);
      if (designIds.length > 0) {
        const designIdList = designIds.map(d => d.id);
        console.log(`🗑️ Found ${designIds.length} designs to clean up`);
        
        // Delete tasks that reference these designs
        for (const designId of designIdList) {
          const taskResult = await db.run('DELETE FROM tasks WHERE design_id = ?', designId);
          console.log(`🗑️ Deleted ${taskResult.changes} tasks for design ${designId}`);
        }
      }
      
      // Step 2: Delete related designs that reference this PRD
      const designsResult = await db.run('DELETE FROM designs WHERE requirement_id = ?', id);
      console.log(`🗑️ Deleted ${designsResult.changes} design records`);
      
      // Step 3: Delete any document links that reference this PRD
      const linksResult = await db.run('DELETE FROM document_links WHERE linked_entity_type = ? AND linked_entity_id = ?', ['prd', id]);
      console.log(`🗑️ Deleted ${linksResult.changes} document links`);
      
      // Step 4: Delete the PRD itself
      const result = await db.run('DELETE FROM prds WHERE id = ?', id);
      console.log(`🗑️ Deleted PRD: ${result.changes > 0 ? 'SUCCESS' : 'NOT FOUND'}`);
      
      // Commit transaction
      await db.run('COMMIT');
      
      // Re-enable foreign key constraints
      await db.run('PRAGMA foreign_keys = ON');
      
      return result.changes > 0;
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      // Re-enable foreign key constraints even on error
      await db.run('PRAGMA foreign_keys = ON');
      console.error(`❌ PRD deletion failed:`, error);
      throw error;
    }
  }

  /**
   * 데이터베이스 행을 PRD 객체로 변환
   */
  formatPRDRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      version: row.version,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
      businessObjective: row.business_objective,
      targetUsers: this.safeJsonParse(row.target_users, ['General users']),
      successCriteria: this.safeJsonParse(row.success_criteria, ['Success criteria to be defined']),
      epics: this.safeJsonParse(row.epics, []),
      requirements: this.safeJsonParse(row.requirements, []),
      acceptance_criteria: this.safeJsonParse(row.acceptance_criteria, []),
      userStories: this.safeJsonParse(row.user_stories, []),
      technicalConstraints: this.safeJsonParse(row.technical_constraints, []),
      assumptions: this.safeJsonParse(row.assumptions, []),
      risks: this.safeJsonParse(row.risks, []),
      timeline: this.safeJsonParse(row.timeline, { phases: [] }),
      qualityGates: this.safeJsonParse(row.quality_gates, []),
      tags: this.safeJsonParse(row.tags, []),
      attachments: this.safeJsonParse(row.attachments, [])
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