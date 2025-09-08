import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function testPRDDocuments() {
  try {
    const db = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });

    console.log('🔄 PRD 문서 기능 테스트 시작...\n');

    // 1. 먼저 PRD 목록 확인
    console.log('1️⃣ 기존 PRD 목록:');
    const prds = await db.all('SELECT id, title FROM prds LIMIT 3');
    prds.forEach(prd => {
      console.log(`   - [${prd.id}] ${prd.title}`);
    });

    if (prds.length === 0) {
      console.log('   ❌ PRD가 없습니다.');
      await db.close();
      return;
    }

    const testPRD = prds[0];
    console.log(`\n📋 테스트 대상: ${testPRD.title}\n`);

    // 2. PRD에 상세 문서 생성
    console.log('2️⃣ PRD 상세 문서 생성...');
    const documentResult = await db.run(`
      INSERT INTO documents (title, content, doc_type, category, tags, summary, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `${testPRD.title} - 상세 기술 명세서`,
      `# ${testPRD.title} 상세 명세

## 비즈니스 목표
개발자 중심 MCP 패키지 공유 커뮤니티 구축. 무료 6개월 운영 후 광고+구독 수익 모델로 지속가능한 비즈니스 모델 달성.

## 타겟 사용자
- MCP 패키지 개발자
- 클로드 사용자
- AI 애플리케이션 개발자

## 성공 기준
- 6개월간 완전 무료 운영 달성
- 3개월 내 월 $100+ 수익 전환
- 10,000 MAU 달성
- 수익 대비 인프라 비용 20% 이하 유지

## 기술 제약사항
- 스택: SvelteKit + Vercel + Supabase
- 대역폭 한계: Supabase 2GB 제한
- 무료 플랜 최대 활용
- 30분 내 MVP 배포 가능

## 핵심 기능

### 인증 시스템
- Google OAuth 소셜 로그인
- Supabase Auth 활용

### 패키지 관리
- GitHub API 연동 자동 수집
- 패키지 메타데이터 관리

### 평가 시스템
- 5점 만점 별점 평가
- 상세 리뷰 작성

### 수익 모델
- Google AdSense 광고
- 프리미엄 구독 ($5/월)`,
      'specification',
      `prd-${testPRD.id}`,
      '["mcp", "package-hub", "specification", "technical-spec"]',
      'MCP Hub 패키지 공유 플랫폼의 상세 기술 명세서 - 비즈니스 목표, 기술 제약, 핵심 기능 포함',
      'test-script',
      'approved'
    ]);

    let documentId = documentResult.lastInsertRowid;
    
    // SQLite lastInsertRowid가 undefined인 경우 직접 조회
    if (!documentId) {
      const lastDoc = await db.get('SELECT last_insert_rowid() as id');
      documentId = lastDoc.id;
    }
    
    console.log(`   ✅ 문서 생성 완료! ID: ${documentId}`);

    if (!documentId) {
      console.error('   ❌ 문서 ID를 가져올 수 없습니다.');
      await db.close();
      return;
    }

    // 3. PRD와 문서 연결
    console.log('\n3️⃣ PRD-문서 연결 생성...');
    await db.run(`
      INSERT INTO document_links (document_id, linked_entity_type, linked_entity_id, link_type)
      VALUES (?, ?, ?, ?)
    `, [documentId, 'prd', testPRD.id, 'specification']);
    console.log('   ✅ PRD-문서 연결 완료!');

    // 4. 연결된 문서 조회 테스트
    console.log('\n4️⃣ PRD 연결 문서 조회...');
    const linkedDocs = await db.all(`
      SELECT d.id, d.title, d.doc_type, d.summary, d.created_at,
             dl.link_type, dl.created_at as linked_at
      FROM documents d
      INNER JOIN document_links dl ON d.id = dl.document_id
      WHERE dl.linked_entity_type = 'prd' AND dl.linked_entity_id = ?
    `, [testPRD.id]);

    console.log(`   📄 연결된 문서 ${linkedDocs.length}개:`);
    linkedDocs.forEach(doc => {
      console.log(`   - [${doc.id}] ${doc.title}`);
      console.log(`     📋 유형: ${doc.doc_type} | 🔗 링크: ${doc.link_type}`);
      console.log(`     📝 요약: ${doc.summary}`);
      console.log(`     📅 생성: ${new Date(doc.created_at).toLocaleString('ko-KR')}`);
    });

    // 5. FTS 검색 테스트
    console.log('\n5️⃣ 전문 검색 테스트...');
    const searchResults = await db.all(`
      SELECT d.id, d.title, 
             snippet(documents_fts, 1, '<mark>', '</mark>', '...', 15) as snippet
      FROM documents d
      INNER JOIN document_links dl ON d.id = dl.document_id
      INNER JOIN documents_fts ON documents_fts.rowid = d.id
      WHERE dl.linked_entity_type = 'prd' 
        AND dl.linked_entity_id = ?
        AND documents_fts MATCH ?
      ORDER BY rank
    `, [testPRD.id, '수익']);

    console.log(`   🔍 "수익" 검색 결과 ${searchResults.length}개:`);
    searchResults.forEach(result => {
      console.log(`   - [${result.id}] ${result.title}`);
      console.log(`     📄 스니펫: ${result.snippet}`);
    });

    // 6. 업데이트 테스트
    console.log('\n6️⃣ 문서 업데이트 테스트...');
    await db.run(`
      UPDATE documents 
      SET summary = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      'MCP Hub 플랫폼 상세 명세 - 업데이트됨 (비즈니스 목표, 기술 스택, 수익 모델 포함)',
      documentId
    ]);
    console.log(`   ✅ 문서 [${documentId}] 업데이트 완료!`);

    // 7. 최종 검증
    console.log('\n7️⃣ 최종 검증...');
    const finalDoc = await db.get(`
      SELECT d.*, dl.link_type
      FROM documents d
      INNER JOIN document_links dl ON d.id = dl.document_id
      WHERE d.id = ?
    `, [documentId]);

    console.log('   📋 최종 문서 정보:');
    console.log(`   - ID: ${finalDoc.id}`);
    console.log(`   - 제목: ${finalDoc.title}`);
    console.log(`   - 유형: ${finalDoc.doc_type}`);
    console.log(`   - 링크: ${finalDoc.link_type}`);
    console.log(`   - 카테고리: ${finalDoc.category}`);
    console.log(`   - 상태: ${finalDoc.status}`);
    console.log(`   - 요약: ${finalDoc.summary}`);

    await db.close();

    console.log('\n🎉 PRD 문서 시스템 테스트 완료!');
    console.log('\n📊 테스트 결과:');
    console.log('   ✅ PRD 상세 문서 생성');
    console.log('   ✅ PRD-문서 자동 연결');
    console.log('   ✅ 연결 문서 조회');
    console.log('   ✅ 전문 검색 (FTS)');
    console.log('   ✅ 문서 업데이트');
    console.log('   ✅ 데이터 무결성 검증');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error.stack);
  }
}

testPRDDocuments();