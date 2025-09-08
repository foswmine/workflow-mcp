import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function createFTSTable() {
  try {
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });

    console.log('🔄 FTS 테이블 생성...');

    // FTS 테이블 생성
    await db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
        title,
        content,
        summary,
        tags,
        content=documents,
        content_rowid=id
      );
    `);

    // 기존 문서들을 FTS에 인덱싱
    await db.exec(`
      INSERT INTO documents_fts(rowid, title, content, summary, tags) 
      SELECT id, title, content, summary, tags FROM documents;
    `);

    // FTS 트리거들 생성
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS documents_fts_insert AFTER INSERT ON documents BEGIN
        INSERT INTO documents_fts(rowid, title, content, summary, tags) 
        VALUES (new.id, new.title, new.content, new.summary, new.tags);
      END;
    `);

    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS documents_fts_update AFTER UPDATE ON documents BEGIN
        UPDATE documents_fts 
        SET title = new.title, content = new.content, summary = new.summary, tags = new.tags
        WHERE rowid = new.id;
      END;
    `);

    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS documents_fts_delete AFTER DELETE ON documents BEGIN
        DELETE FROM documents_fts WHERE rowid = old.id;
      END;
    `);

    console.log('✅ FTS 테이블 및 트리거 생성 완료!');

    // 테스트
    const count = await db.get('SELECT COUNT(*) as count FROM documents_fts');
    console.log(`📊 FTS 인덱싱된 문서: ${count.count}개`);

    await db.close();
    console.log('🎉 FTS 설정 완료!');

  } catch (error) {
    console.error('❌ FTS 생성 실패:', error.message);
  }
}

createFTSTable();