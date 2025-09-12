/**
 * Document Manager - SQLite 기반 문서 관리 클래스
 * 프로젝트 문서를 체계적으로 저장, 검색, 관리
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentManager {
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

  /**
   * 새로운 문서 생성
   * @param {Object} documentData - 문서 데이터
   * @returns {Object} 생성된 문서 정보
   */
  async createDocument(documentData) {
    const { title, content, doc_type, category, tags, summary, linked_entity_type, linked_entity_id, link_type } = documentData;
    const db = await this.getDatabase();

    // Insert document
    const result = await db.run(`
      INSERT INTO documents (title, content, doc_type, category, tags, summary, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'mcp-user')
    `, [
      title,
      content,
      doc_type,
      category || null,
      tags ? JSON.stringify(tags) : null,
      summary || null
    ]);
    
    let documentId = result.lastInsertRowid;
    
    // SQLite lastInsertRowid가 undefined인 경우 직접 조회
    if (!documentId) {
      const lastDoc = await db.get('SELECT last_insert_rowid() as id');
      documentId = lastDoc.id;
    }

    if (!documentId) {
      await db.close();
      throw new Error('Failed to get document ID after creation');
    }

    // Link to entity if specified
    if (linked_entity_type && linked_entity_id) {
      await db.run(`
        INSERT INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
        VALUES (?, ?, ?, ?)
      `, [documentId, linked_entity_type, linked_entity_id, link_type || 'notes']);
    }

    return {
      success: true,
      id: documentId,
      title,
      doc_type,
      category: category || null,
      tags: tags || [],
      linked: linked_entity_type ? { type: linked_entity_type, id: linked_entity_id, link_type: link_type || 'notes' } : null
    };
  }

  /**
   * 문서 검색 (Full-text search)
   * @param {Object} searchParams - 검색 조건
   * @returns {Array} 검색된 문서 목록
   */
  async searchDocuments(searchParams) {
    const { query, doc_type, category, limit = 10 } = searchParams;
    const db = await this.getDatabase();

    let sql = `
      SELECT d.id, d.title, d.doc_type, d.category, d.summary, d.created_at,
             snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
      FROM documents d
      JOIN documents_fts ON d.id = documents_fts.rowid
      WHERE documents_fts MATCH ?
    `;
    
    const params = [query];
    
    if (doc_type) {
      sql += ' AND d.doc_type = ?';
      params.push(doc_type);
    }
    
    if (category) {
      sql += ' AND d.category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY documents_fts.bm25 LIMIT ?';
    params.push(limit);

    const results = await db.all(sql, params);
    return results;
  }

  /**
   * 문서 조회 (ID로)
   * @param {number} id - 문서 ID
   * @returns {Object} 문서 정보
   */
  async getDocument(id) {
    const db = await this.getDatabase();

    const doc = await db.get(`
      SELECT d.*, 
             GROUP_CONCAT(
               dl.linked_entity_type || ':' || dl.linked_entity_id || ':' || dl.link_type, 
               '|'
             ) as links
      FROM documents d
      LEFT JOIN document_links dl ON d.id = dl.document_id
      WHERE d.id = ?
      GROUP BY d.id
    `, [id]);

    if (!doc) {
      return null;
    }

    const tags = doc.tags ? JSON.parse(doc.tags) : [];
    const links = doc.links ? doc.links.split('|').map(link => {
      const [type, id, linkType] = link.split(':');
      return { type, id, linkType };
    }) : [];

    return {
      ...doc,
      tags,
      links
    };
  }

  /**
   * 문서 업데이트
   * @param {number} id - 문서 ID
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Object} 업데이트 결과
   */
  async updateDocument(id, updates) {
    const db = await this.getDatabase();
    
    // Check if document exists
    const existing = await db.get('SELECT id FROM documents WHERE id = ?', [id]);
    if (!existing) {
      throw new Error(`Document ID ${id} not found`);
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];

    if (updates.title !== undefined) { updateFields.push('title = ?'); params.push(updates.title); }
    if (updates.content !== undefined) { updateFields.push('content = ?'); params.push(updates.content); }
    if (updates.summary !== undefined) { updateFields.push('summary = ?'); params.push(updates.summary); }
    if (updates.status !== undefined) { updateFields.push('status = ?'); params.push(updates.status); }
    if (updates.tags !== undefined) { updateFields.push('tags = ?'); params.push(JSON.stringify(updates.tags)); }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateFields.push('version = version + 1');
    params.push(id);

    const sql = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.run(sql, params);

    return {
      success: true,
      id,
      updated_fields: Object.keys(updates)
    };
  }

  /**
   * 문서 삭제
   * @param {number} id - 문서 ID
   * @returns {Object} 삭제 결과
   */
  async deleteDocument(id) {
    const db = await this.getDatabase();

    const doc = await db.get('SELECT title FROM documents WHERE id = ?', [id]);
    if (!doc) {
      throw new Error(`Document ID ${id} not found`);
    }

    await db.run('DELETE FROM documents WHERE id = ?', [id]);

    return {
      success: true,
      id,
      title: doc.title
    };
  }

  /**
   * 문서 목록 조회
   * @param {Object} filters - 필터 조건
   * @returns {Array} 문서 목록
   */
  async listDocuments(filters = {}) {
    const { doc_type, category, status, limit = 20 } = filters;
    const db = await this.getDatabase();

    let sql = 'SELECT * FROM document_overview WHERE 1=1';
    const params = [];

    if (doc_type) {
      sql += ' AND doc_type = ?';
      params.push(doc_type);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);

    const docs = await db.all(sql, params);
    return docs;
  }

  /**
   * 문서를 엔터티에 연결
   * @param {number} documentId - 문서 ID
   * @param {string} entityType - 엔터티 유형
   * @param {string} entityId - 엔터티 ID
   * @param {string} linkType - 연결 유형
   * @returns {Object} 연결 결과
   */
  async linkDocument(documentId, entityType, entityId, linkType = 'notes') {
    const db = await this.getDatabase();

    // Check if document exists
    const doc = await db.get('SELECT title FROM documents WHERE id = ?', [documentId]);
    if (!doc) {
      throw new Error(`Document ID ${documentId} not found`);
    }

    // Insert link
    const result = await db.run(`
      INSERT OR IGNORE INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
      VALUES (?, ?, ?, ?)
    `, [documentId, entityType, entityId, linkType]);

    return {
      success: true,
      document_id: documentId,
      document_title: doc.title,
      entity_type: entityType,
      entity_id: entityId,
      link_type: linkType,
      is_new: result.changes > 0
    };
  }

  /**
   * 문서의 연결 관계 조회
   * @param {number} documentId - 문서 ID
   * @returns {Object} 연결 관계 정보
   */
  async getDocumentLinks(documentId) {
    const db = await this.getDatabase();

    const doc = await db.get('SELECT title FROM documents WHERE id = ?', [documentId]);
    if (!doc) {
      throw new Error(`Document ID ${documentId} not found`);
    }

    const links = await db.all(`
      SELECT linked_entity_type, linked_entity_id, link_type, created_at
      FROM document_links
      WHERE document_id = ?
      ORDER BY created_at DESC
    `, [documentId]);

    return {
      document_id: documentId,
      document_title: doc.title,
      total_links: links.length,
      links
    };
  }

  /**
   * 문서 간 관계 생성 (document_relations 테이블 사용)
   * @param {number} parentDocId - 부모 문서 ID
   * @param {number} childDocId - 자식 문서 ID
   * @param {string} relationType - 관계 유형 (referenced_by, contains, derived_from, replaces)
   * @param {string} notes - 관계에 대한 설명
   * @returns {Object} 관계 생성 결과
   */
  async createDocumentRelation(parentDocId, childDocId, relationType = 'referenced_by', notes = null) {
    const db = await this.getDatabase();

    // 두 문서가 모두 존재하는지 확인
    const [parentDoc, childDoc] = await Promise.all([
      db.get('SELECT id, title FROM documents WHERE id = ?', [parentDocId]),
      db.get('SELECT id, title FROM documents WHERE id = ?', [childDocId])
    ]);

    if (!parentDoc) {
      throw new Error(`Parent document ID ${parentDocId} not found`);
    }
    if (!childDoc) {
      throw new Error(`Child document ID ${childDocId} not found`);
    }

    // 중복 관계 확인
    const existingRelation = await db.get(`
      SELECT id FROM document_relations 
      WHERE parent_doc_id = ? AND child_doc_id = ? AND relation_type = ?
    `, [parentDocId, childDocId, relationType]);

    if (existingRelation) {
      return {
        success: false,
        error: 'Document relation already exists',
        parent_doc: parentDoc,
        child_doc: childDoc,
        relation_type: relationType
      };
    }

    // 관계 생성
    const result = await db.run(`
      INSERT INTO document_relations (parent_doc_id, child_doc_id, relation_type, notes)
      VALUES (?, ?, ?, ?)
    `, [parentDocId, childDocId, relationType, notes]);

    return {
      success: true,
      relation_id: result.lastInsertRowid,
      parent_doc: parentDoc,
      child_doc: childDoc,
      relation_type: relationType,
      notes: notes,
      message: `문서 관계 생성: "${parentDoc.title}" ${relationType} "${childDoc.title}"`
    };
  }

  /**
   * 문서의 관계 조회 (부모-자식 관계)
   * @param {number} documentId - 문서 ID
   * @returns {Object} 문서 관계 정보
   */
  async getDocumentRelations(documentId) {
    const db = await this.getDatabase();

    const doc = await db.get('SELECT id, title FROM documents WHERE id = ?', [documentId]);
    if (!doc) {
      throw new Error(`Document ID ${documentId} not found`);
    }

    // 부모 관계 (이 문서가 자식인 경우)
    const parentRelations = await db.all(`
      SELECT dr.relation_type, dr.notes, dr.created_at,
             d.id as parent_id, d.title as parent_title
      FROM document_relations dr
      JOIN documents d ON dr.parent_doc_id = d.id
      WHERE dr.child_doc_id = ?
      ORDER BY dr.created_at DESC
    `, [documentId]);

    // 자식 관계 (이 문서가 부모인 경우)
    const childRelations = await db.all(`
      SELECT dr.relation_type, dr.notes, dr.created_at,
             d.id as child_id, d.title as child_title
      FROM document_relations dr
      JOIN documents d ON dr.child_doc_id = d.id
      WHERE dr.parent_doc_id = ?
      ORDER BY dr.created_at DESC
    `, [documentId]);

    return {
      document_id: documentId,
      document_title: doc.title,
      parent_relations: parentRelations,
      child_relations: childRelations,
      total_relations: parentRelations.length + childRelations.length
    };
  }

  /**
   * 문서 간 관계 삭제
   * @param {number} parentDocId - 부모 문서 ID
   * @param {number} childDocId - 자식 문서 ID
   * @param {string} relationType - 관계 유형
   * @returns {Object} 삭제 결과
   */
  async removeDocumentRelation(parentDocId, childDocId, relationType) {
    const db = await this.getDatabase();

    // 관계 존재 확인
    const relation = await db.get(`
      SELECT dr.id, p.title as parent_title, c.title as child_title
      FROM document_relations dr
      JOIN documents p ON dr.parent_doc_id = p.id
      JOIN documents c ON dr.child_doc_id = c.id
      WHERE dr.parent_doc_id = ? AND dr.child_doc_id = ? AND dr.relation_type = ?
    `, [parentDocId, childDocId, relationType]);

    if (!relation) {
      return {
        success: false,
        error: 'Document relation not found',
        parent_doc_id: parentDocId,
        child_doc_id: childDocId,
        relation_type: relationType
      };
    }

    // 관계 삭제
    await db.run(`
      DELETE FROM document_relations 
      WHERE parent_doc_id = ? AND child_doc_id = ? AND relation_type = ?
    `, [parentDocId, childDocId, relationType]);

    return {
      success: true,
      parent_title: relation.parent_title,
      child_title: relation.child_title,
      relation_type: relationType,
      message: `문서 관계 삭제: "${relation.parent_title}" ${relationType} "${relation.child_title}"`
    };
  }

  /**
   * 문서 링크 제거 (document_links 테이블)
   * @param {number} documentId - 문서 ID
   * @param {string} entityType - 엔터티 유형
   * @param {string} entityId - 엔터티 ID
   * @returns {Object} 삭제 결과
   */
  async removeDocumentLink(documentId, entityType, entityId) {
    const db = await this.getDatabase();

    // 링크 존재 확인
    const link = await db.get(`
      SELECT dl.id, d.title as document_title
      FROM document_links dl
      JOIN documents d ON dl.document_id = d.id
      WHERE dl.document_id = ? AND dl.linked_entity_type = ? AND dl.linked_entity_id = ?
    `, [documentId, entityType, entityId]);

    if (!link) {
      return {
        success: false,
        error: 'Document link not found',
        document_id: documentId,
        entity_type: entityType,
        entity_id: entityId
      };
    }

    // 링크 삭제
    await db.run(`
      DELETE FROM document_links 
      WHERE document_id = ? AND linked_entity_type = ? AND linked_entity_id = ?
    `, [documentId, entityType, entityId]);

    return {
      success: true,
      document_title: link.document_title,
      entity_type: entityType,
      entity_id: entityId,
      message: `문서 링크 삭제: "${link.document_title}" -> ${entityType}:${entityId}`
    };
  }

  /**
   * 문서 분류 정보 조회 (doc_type, category, tags)
   * @returns {Object} 분류 정보
   */
  async getDocumentCategories() {
    console.log('🔍 DocumentManager.getDocumentCategories() called - UPDATED VERSION');
    const db = await this.getDatabase();

    const [docTypes, categories, allTags] = await Promise.all([
      // 사용된 doc_type 목록
      db.all(`
        SELECT doc_type, COUNT(*) as count
        FROM documents 
        WHERE doc_type IS NOT NULL 
        GROUP BY doc_type
        ORDER BY count DESC, doc_type
      `),

      // 사용된 category 목록  
      db.all(`
        SELECT category, COUNT(*) as count
        FROM documents 
        WHERE category IS NOT NULL 
        GROUP BY category
        ORDER BY count DESC, category
      `),

      // 사용된 tags 목록
      db.all(`
        SELECT tags
        FROM documents 
        WHERE tags IS NOT NULL AND tags != '[]'
      `)
    ]);

    // tags 추출 및 집계
    const tagsMap = new Map();
    allTags.forEach(row => {
      try {
        const tags = JSON.parse(row.tags || '[]');
        tags.forEach(tag => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
        });
      } catch (e) {
        // JSON 파싱 에러 무시
      }
    });

    const tags = Array.from(tagsMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    const result = {
      success: true,
      doc_types: docTypes.map(row => ({
        value: row.doc_type,
        count: row.count
      })),
      categories: categories.map(row => ({
        value: row.category, 
        count: row.count
      })),
      tags: tags.map(item => ({
        value: item.tag,
        count: item.count
      })),
      total_documents: docTypes.reduce((sum, row) => sum + row.count, 0)
    };
    
    console.log('📊 DocumentManager result:', {
      doc_types_count: result.doc_types.length,
      categories_count: result.categories.length, 
      first_doc_type: result.doc_types[0],
      first_category: result.categories[0],
      total: result.total_documents
    });
    
    return result;
  }
}

export default DocumentManager;