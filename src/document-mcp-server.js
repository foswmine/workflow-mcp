/**
 * WorkflowMCP Document Management Server - Phase 2.7
 * SQLite 기반 문서 관리 전용 MCP 서버
 * 프로젝트 문서를 체계적으로 저장, 검색, 관리
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.resolve(__dirname, '../data/workflow.db');

let db;

/**
 * 서버 초기화
 */
async function initializeServer() {
  console.log('📚 Initializing Document Management MCP Server...');
  
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Check if document tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE '%document%'
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  Document tables not found. Please run migration first:');
      console.log('   node src/database/migrate-documents.js');
      process.exit(1);
    }
    
    console.log('✅ Document Management database ready');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// MCP 서버 생성
const server = new Server({
  name: 'workflow-document-mcp',
  version: '2.7.0'
});

// =============================================
// MCP 도구 목록 정의
// =============================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // 문서 생성 및 관리
      {
        name: 'create_document',
        description: '새 문서를 생성하고 SQLite에 저장',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '문서 제목' },
            content: { type: 'string', description: '문서 내용 (Markdown 형식)' },
            doc_type: { 
              type: 'string', 
              enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
              description: '문서 유형' 
            },
            category: { type: 'string', description: '카테고리 (예: phase_2.6, testing)' },
            tags: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: '태그 목록' 
            },
            summary: { type: 'string', description: '문서 요약' },
            linked_entity_type: { 
              type: 'string', 
              enum: ['prd', 'task', 'plan'], 
              description: '연결할 엔터티 유형 (선택사항)' 
            },
            linked_entity_id: { type: 'string', description: '연결할 엔터티 ID (선택사항)' },
            link_type: { 
              type: 'string', 
              enum: ['specification', 'test_plan', 'result', 'analysis', 'notes'],
              description: '링크 유형 (선택사항)' 
            }
          },
          required: ['title', 'content', 'doc_type']
        }
      },
      
      {
        name: 'search_documents',
        description: 'Full-text search로 문서 검색',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '검색 쿼리' },
            doc_type: { 
              type: 'string', 
              enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
              description: '특정 문서 유형으로 필터 (선택사항)' 
            },
            category: { type: 'string', description: '특정 카테고리로 필터 (선택사항)' },
            limit: { type: 'integer', default: 10, description: '결과 제한 수' }
          },
          required: ['query']
        }
      },
      
      {
        name: 'get_document',
        description: 'ID로 특정 문서 조회',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: '문서 ID' }
          },
          required: ['id']
        }
      },
      
      {
        name: 'update_document',
        description: '기존 문서 업데이트',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: '문서 ID' },
            title: { type: 'string', description: '문서 제목' },
            content: { type: 'string', description: '문서 내용' },
            summary: { type: 'string', description: '문서 요약' },
            status: { 
              type: 'string', 
              enum: ['draft', 'review', 'approved', 'archived'],
              description: '문서 상태' 
            },
            tags: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: '태그 목록' 
            }
          },
          required: ['id']
        }
      },
      
      {
        name: 'delete_document',
        description: '문서 삭제',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: '문서 ID' }
          },
          required: ['id']
        }
      },
      
      {
        name: 'list_documents',
        description: '문서 목록 조회',
        inputSchema: {
          type: 'object',
          properties: {
            doc_type: { 
              type: 'string', 
              enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
              description: '특정 문서 유형으로 필터' 
            },
            category: { type: 'string', description: '특정 카테고리로 필터' },
            status: { 
              type: 'string', 
              enum: ['draft', 'review', 'approved', 'archived'],
              description: '특정 상태로 필터' 
            },
            limit: { type: 'integer', default: 20, description: '결과 제한 수' }
          }
        }
      },
      
      {
        name: 'import_markdown_file',
        description: '기존 Markdown 파일을 문서로 가져오기',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: '가져올 Markdown 파일 경로' },
            doc_type: { 
              type: 'string', 
              enum: ['test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log'],
              description: '문서 유형' 
            },
            category: { type: 'string', description: '카테고리' },
            tags: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: '태그 목록' 
            },
            auto_summary: { type: 'boolean', default: true, description: '자동 요약 생성 여부' }
          },
          required: ['file_path', 'doc_type']
        }
      },
      
      {
        name: 'link_document',
        description: '문서를 PRD, Task, Plan에 연결',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: { type: 'integer', description: '문서 ID' },
            entity_type: { 
              type: 'string', 
              enum: ['prd', 'task', 'plan'],
              description: '연결할 엔터티 유형' 
            },
            entity_id: { type: 'string', description: '연결할 엔터티 ID' },
            link_type: { 
              type: 'string', 
              enum: ['specification', 'test_plan', 'result', 'analysis', 'notes'],
              default: 'notes',
              description: '링크 유형' 
            }
          },
          required: ['document_id', 'entity_type', 'entity_id']
        }
      },
      
      {
        name: 'get_document_links',
        description: '문서의 모든 연결 관계 조회',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: { type: 'integer', description: '문서 ID' }
          },
          required: ['document_id']
        }
      }
    ]
  };
});

// =============================================
// 도구 핸들러 구현
// =============================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_document':
        return await handleCreateDocument(args);
      case 'search_documents':
        return await handleSearchDocuments(args);
      case 'get_document':
        return await handleGetDocument(args);
      case 'update_document':
        return await handleUpdateDocument(args);
      case 'delete_document':
        return await handleDeleteDocument(args);
      case 'list_documents':
        return await handleListDocuments(args);
      case 'import_markdown_file':
        return await handleImportMarkdownFile(args);
      case 'link_document':
        return await handleLinkDocument(args);
      case 'get_document_links':
        return await handleGetDocumentLinks(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: `❌ Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// =============================================
// 핸들러 함수들
// =============================================

async function handleCreateDocument(args) {
  const { title, content, doc_type, category, tags, summary, linked_entity_type, linked_entity_id, link_type } = args;

  // Insert document
  const insertDoc = db.prepare(`
    INSERT INTO documents (title, content, doc_type, category, tags, summary, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'mcp-user')
  `);
  
  const result = insertDoc.run(
    title,
    content,
    doc_type,
    category || null,
    tags ? JSON.stringify(tags) : null,
    summary || null
  );
  
  const documentId = result.lastInsertRowid;

  // Link to entity if specified
  if (linked_entity_type && linked_entity_id) {
    const insertLink = db.prepare(`
      INSERT INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
      VALUES (?, ?, ?, ?)
    `);
    
    insertLink.run(documentId, linked_entity_type, linked_entity_id, link_type || 'notes');
  }

  return {
    content: [{
      type: 'text',
      text: `✅ 문서가 생성되었습니다!

**문서 ID**: ${documentId}
**제목**: ${title}
**유형**: ${doc_type}
**카테고리**: ${category || '없음'}
**태그**: ${tags ? tags.join(', ') : '없음'}
${linked_entity_type ? `**연결됨**: ${linked_entity_type} #${linked_entity_id} (${link_type || 'notes'})` : ''}

🔍 **검색 인덱싱**: 자동으로 전문 검색 인덱스에 추가됨`
    }]
  };
}

async function handleSearchDocuments(args) {
  const { query, doc_type, category, limit = 10 } = args;

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

  const results = db.prepare(sql).all(...params);

  if (results.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `🔍 검색 결과가 없습니다.

**검색어**: "${query}"
${doc_type ? `**문서 유형**: ${doc_type}` : ''}
${category ? `**카테고리**: ${category}` : ''}

💡 **검색 팁**:
- 다른 키워드 시도
- 필터 조건 완화
- 전체 문서 목록: \`list_documents\` 사용`
      }]
    };
  }

  return {
    content: [{
      type: 'text',
      text: `🔍 검색 결과 (${results.length}개)

**검색어**: "${query}"
${doc_type ? `**필터**: ${doc_type}` : ''}
${category ? `**카테고리**: ${category}` : ''}

${results.map(doc => `
**[${doc.id}] ${doc.title}**
📋 유형: ${doc.doc_type} | 📂 카테고리: ${doc.category || '없음'}
📅 생성: ${new Date(doc.created_at).toLocaleDateString('ko-KR')}
📝 요약: ${doc.summary || '없음'}
🔍 발견: ${doc.snippet}
---`).join('\n')}

💡 특정 문서 보기: \`get_document\` 사용`
    }]
  };
}

async function handleGetDocument(args) {
  const { id } = args;

  const doc = db.prepare(`
    SELECT d.*, 
           GROUP_CONCAT(
             dl.linked_entity_type || ':' || dl.linked_entity_id || ':' || dl.link_type, 
             '|'
           ) as links
    FROM documents d
    LEFT JOIN document_links dl ON d.id = dl.document_id
    WHERE d.id = ?
    GROUP BY d.id
  `).get(id);

  if (!doc) {
    return {
      content: [{
        type: 'text',
        text: `❌ ID ${id}에 해당하는 문서를 찾을 수 없습니다.`
      }]
    };
  }

  const tags = doc.tags ? JSON.parse(doc.tags) : [];
  const links = doc.links ? doc.links.split('|').map(link => {
    const [type, id, linkType] = link.split(':');
    return { type, id, linkType };
  }) : [];

  return {
    content: [{
      type: 'text',
      text: `📄 **${doc.title}**

**문서 ID**: ${doc.id}
**유형**: ${doc.doc_type}
**카테고리**: ${doc.category || '없음'}
**상태**: ${doc.status}
**태그**: ${tags.join(', ') || '없음'}
**생성일**: ${new Date(doc.created_at).toLocaleString('ko-KR')}
**수정일**: ${new Date(doc.updated_at).toLocaleString('ko-KR')}
**작성자**: ${doc.created_by}
**버전**: ${doc.version}

${doc.summary ? `**요약**: ${doc.summary}\n` : ''}
${links.length > 0 ? `**연결된 항목**:\n${links.map(link => `- ${link.type} #${link.id} (${link.linkType})`).join('\n')}\n` : ''}

---

${doc.content}`
    }]
  };
}

async function handleUpdateDocument(args) {
  const { id, title, content, summary, status, tags } = args;

  // Check if document exists
  const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
  if (!existing) {
    throw new Error(`Document ID ${id} not found`);
  }

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (summary !== undefined) { updates.push('summary = ?'); params.push(summary); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  updates.push('version = version + 1');
  params.push(id);

  const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...params);

  return {
    content: [{
      type: 'text',
      text: `✅ 문서 ID ${id}가 성공적으로 업데이트되었습니다.

**업데이트된 필드**:
${title ? `- 제목: ${title}` : ''}
${content ? `- 내용: 업데이트됨` : ''}
${summary ? `- 요약: ${summary}` : ''}
${status ? `- 상태: ${status}` : ''}
${tags ? `- 태그: ${tags.join(', ')}` : ''}

🔄 **버전**: 자동 증가
📅 **수정 시간**: ${new Date().toLocaleString('ko-KR')}`
    }]
  };
}

async function handleDeleteDocument(args) {
  const { id } = args;

  const doc = db.prepare('SELECT title FROM documents WHERE id = ?').get(id);
  if (!doc) {
    throw new Error(`Document ID ${id} not found`);
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);

  return {
    content: [{
      type: 'text',
      text: `🗑️ 문서가 삭제되었습니다.

**문서 ID**: ${id}
**제목**: ${doc.title}

⚠️ **주의**: 연결된 링크와 관계도 함께 삭제되었습니다.`
    }]
  };
}

async function handleListDocuments(args) {
  const { doc_type, category, status, limit = 20 } = args;

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

  const docs = db.prepare(sql).all(...params);

  return {
    content: [{
      type: 'text',
      text: `📚 문서 목록 (${docs.length}개)

${doc_type ? `📋 **필터 - 유형**: ${doc_type}` : ''}
${category ? `📂 **필터 - 카테고리**: ${category}` : ''}
${status ? `🏷️ **필터 - 상태**: ${status}` : ''}

${docs.map(doc => `
**[${doc.id}] ${doc.title}**
📋 ${doc.doc_type} | 📂 ${doc.category || '없음'} | 🏷️ ${doc.status}
📅 ${new Date(doc.updated_at).toLocaleDateString('ko-KR')}
🔗 연결: ${doc.linked_entities_count}개 | 📑 관련 문서: ${doc.related_docs_count}개
📝 ${doc.summary || '요약 없음'}
---`).join('\n')}

💡 **사용법**:
- 문서 보기: \`get_document\` 사용
- 검색: \`search_documents\` 사용`
    }]
  };
}

async function handleImportMarkdownFile(args) {
  const { file_path, doc_type, category, tags, auto_summary = true } = args;

  if (!fs.existsSync(file_path)) {
    throw new Error(`File not found: ${file_path}`);
  }

  const content = fs.readFileSync(file_path, 'utf8');
  const title = path.basename(file_path, '.md').replace(/[-_]/g, ' ');

  // Auto-generate summary from first paragraph if enabled
  let summary = null;
  if (auto_summary) {
    const firstParagraph = content.split('\n\n')[0];
    summary = firstParagraph.replace(/^#+\s*/, '').substring(0, 200);
  }

  const insertDoc = db.prepare(`
    INSERT INTO documents (title, content, doc_type, category, file_path, tags, summary, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'file-import')
  `);
  
  const result = insertDoc.run(
    title,
    content,
    doc_type,
    category || null,
    file_path,
    tags ? JSON.stringify(tags) : null,
    summary
  );

  return {
    content: [{
      type: 'text',
      text: `📁 파일을 문서로 가져왔습니다!

**문서 ID**: ${result.lastInsertRowid}
**파일**: ${file_path}
**제목**: ${title}
**유형**: ${doc_type}
**크기**: ${content.length}자
**자동 요약**: ${auto_summary ? '생성됨' : '건너뜀'}

✅ 전문 검색 인덱스에 자동 추가되었습니다.`
    }]
  };
}

async function handleLinkDocument(args) {
  const { document_id, entity_type, entity_id, link_type = 'notes' } = args;

  // Check if document exists
  const doc = db.prepare('SELECT title FROM documents WHERE id = ?').get(document_id);
  if (!doc) {
    throw new Error(`Document ID ${document_id} not found`);
  }

  // Insert link
  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = insertLink.run(document_id, entity_type, entity_id, link_type);

  return {
    content: [{
      type: 'text',
      text: `🔗 연결이 생성되었습니다!

**문서**: [${document_id}] ${doc.title}
**연결 대상**: ${entity_type} #${entity_id}
**링크 유형**: ${link_type}
**상태**: ${result.changes > 0 ? '새로 생성됨' : '이미 존재함'}

💡 연결 확인: \`get_document_links\` 사용`
    }]
  };
}

async function handleGetDocumentLinks(args) {
  const { document_id } = args;

  const doc = db.prepare('SELECT title FROM documents WHERE id = ?').get(document_id);
  if (!doc) {
    throw new Error(`Document ID ${document_id} not found`);
  }

  const links = db.prepare(`
    SELECT linked_entity_type, linked_entity_id, link_type, created_at
    FROM document_links
    WHERE document_id = ?
    ORDER BY created_at DESC
  `).all(document_id);

  return {
    content: [{
      type: 'text',
      text: `🔗 문서 연결 관계

**문서**: [${document_id}] ${doc.title}
**총 연결**: ${links.length}개

${links.length > 0 ? 
  links.map(link => `
- **${link.linked_entity_type} #${link.linked_entity_id}**
  유형: ${link.link_type}
  생성: ${new Date(link.created_at).toLocaleDateString('ko-KR')}
  `).join('\n') :
  '연결된 항목이 없습니다.'
}

💡 새 연결 생성: \`link_document\` 사용`
    }]
  };
}

// =============================================
// 서버 시작
// =============================================

async function main() {
  try {
    await initializeServer();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log('✅ Document Management MCP Server ready - 9 document tools available');
    
  } catch (error) {
    console.error('💥 Server startup failed:', error);
    process.exit(1);
  }
}

// 종료 시 정리
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down document server...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

main();