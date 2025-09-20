import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function insertTestDocument() {
  try {
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });

    const result = await db.run(`
      INSERT INTO documents (title, content, doc_type, category, tags, summary, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Claude Code 직접 테스트 문서 - 2025-09-06',
      `# Claude Code 직접 테스트 문서

## 생성 정보
- **생성일**: 2025년 9월 6일
- **생성자**: Claude Code (직접 삽입)
- **목적**: SQLite → Dashboard 연동 테스트

## 테스트 내용

이 문서는 다음을 검증합니다:

### 1. 데이터베이스 직접 삽입
- SQLite3으로 documents 테이블에 직접 삽입
- 한글 내용과 마크다운 형식 지원
- 메타데이터 (태그, 카테고리) 포함

### 2. Dashboard 실시간 반영
- 웹 인터페이스에서 새 문서 표시
- 필터링으로 찾을 수 있는지 확인
- 내용이 정확히 일치하는지 확인

### 3. 검색 기능
- FTS(Full-Text Search) 인덱스 동작
- 한글 검색 지원
- 스니펫 기능

## 예상 결과

이 문서가 Dashboard에서:
- ✅ ID와 함께 목록에 표시
- ✅ "claude-code-direct" 카테고리로 필터링 가능
- ✅ "test_results" 타입으로 분류
- ✅ 모든 내용이 정확히 표시
- ✅ "Claude Code" 또는 "직접" 키워드로 검색 가능

이것이 성공하면 workflow-mcp의 문서 시스템이 완전히 작동한다는 의미입니다!`,
      'test_results',
      'claude-code-direct',
      '["claude-code", "direct-test", "sqlite", "dashboard"]',
      'Claude Code에서 SQLite 데이터베이스에 직접 삽입한 테스트 문서 - Dashboard 연동 확인용',
      'claude-code-direct',
      'approved'
    ]);

    console.log('✅ 문서가 성공적으로 삽입되었습니다!');
    console.log('📄 문서 ID:', result.lastInsertRowid);
    console.log('🔗 확인 URL: http://localhost:3301/documents');

    await db.close();
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

insertTestDocument();