import WorkflowMCPServer from './src/index.js';

// 직접 서버 인스턴스를 생성하고 메서드 테스트
async function testAllPRDTools() {
  const server = new WorkflowMCPServer();
  
  console.log('🔧 PRD 문서 MCP 도구 전체 테스트 시작...\n');

  try {
    // 테스트 대상 PRD ID
    const testPRDId = 'f43ce9e2-3fe5-4bad-8cc3-cf744d143f7b';
    
    // 1. create_prd_document 테스트
    console.log('1️⃣ create_prd_document 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const createArgs = {
      prd_id: testPRDId,
      title: 'MCP Hub 상세 기술 명세서 - MCP 테스트',
      content: `# MCP Hub 상세 명세서

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

## 핵심 기능

### 인증 시스템
- Google OAuth 소셜 로그인
- Supabase Auth 활용

### 패키지 관리
- GitHub API 연동 자동 수집
- 패키지 메타데이터 관리

### 수익 모델
- Google AdSense 광고
- 프리미엄 구독 ($5/월)`,
      doc_type: 'specification',
      summary: 'MCP Hub 플랫폼의 완전한 기술 명세서',
      tags: ['mcp', 'package-hub', 'specification', 'mcp-test']
    };
    
    const createResult = await server.createPRDDocument(createArgs);
    console.log('✅ create_prd_document 성공:', createResult.message);
    console.log(`   📄 문서 ID: ${createResult.document.id}`);
    console.log(`   📋 제목: ${createResult.document.title}`);
    console.log(`   🔗 PRD: ${createResult.prd_title}\n`);
    
    const documentId = createResult.document.id;

    // 2. get_prd_documents 테스트
    console.log('2️⃣ get_prd_documents 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const getResult = await server.getPRDDocuments(testPRDId);
    console.log('✅ get_prd_documents 성공:', getResult.message);
    console.log(`   📊 총 문서 수: ${getResult.total}개`);
    getResult.documents.forEach(doc => {
      console.log(`   - [${doc.id}] ${doc.title}`);
      console.log(`     📄 ${doc.doc_type} | 🔗 ${doc.link_type} | 📊 ${doc.status}`);
    });
    console.log('');

    // 3. search_prd_documents 테스트  
    console.log('3️⃣ search_prd_documents 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const searchResult = await server.searchPRDDocuments(testPRDId, '수익', 5);
    console.log('✅ search_prd_documents 성공:', searchResult.message);
    console.log(`   🔍 검색어: "${searchResult.query}"`);
    console.log(`   📊 결과: ${searchResult.total}건`);
    searchResult.documents.forEach(doc => {
      console.log(`   - [${doc.id}] ${doc.title}`);
      console.log(`     📄 스니펫: ${doc.content_snippet}`);
    });
    console.log('');

    // 4. update_prd_document 테스트
    console.log('4️⃣ update_prd_document 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const updateArgs = {
      title: 'MCP Hub 상세 기술 명세서 - 업데이트됨',
      summary: 'MCP Hub 플랫폼의 완전한 기술 명세서 - 업데이트 및 검증 완료',
      status: 'approved'
    };
    
    const updateResult = await server.updatePRDDocument(documentId, updateArgs);
    console.log('✅ update_prd_document 성공:', updateResult.message);
    console.log(`   📄 문서: [${updateResult.document.id}] ${updateResult.document.title}`);
    console.log(`   📊 상태: ${updateResult.document.status}`);
    console.log(`   📝 요약: ${updateResult.document.summary}\n`);

    // 5. 별도 문서 생성 후 link_document_to_prd 테스트
    console.log('5️⃣ link_document_to_prd 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 먼저 일반 문서 생성 (직접 SQL 사용)
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');
    const separateDb = await open({
      filename: './data/workflow.db',
      driver: sqlite3.Database
    });
    
    const separateDocResult = await separateDb.run(`
      INSERT INTO documents (title, content, doc_type, category, tags, summary, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'mcp-user')
    `, [
      'MCP Hub 추가 분석 문서',
      `# MCP Hub 시장 분석

## 경쟁사 분석
- GitHub Package Registry
- npm 레지스트리
- Docker Hub

## 차별화 포인트
- MCP 전용 플랫폼
- AI 통합 기능
- 커뮤니티 기반 평가

## 마케팅 전략
- 개발자 커뮤니티 참여
- 오픈소스 기여
- 콘텐츠 마케팅`,
      'analysis',
      'market-research',
      JSON.stringify(['market-analysis', 'competition', 'strategy']),
      'MCP Hub의 시장 분석 및 차별화 전략'
    ]);
    
    let separateDocId = separateDocResult.lastInsertRowid;
    if (!separateDocId) {
      const lastDoc = await separateDb.get('SELECT last_insert_rowid() as id');
      separateDocId = lastDoc.id;
    }
    await separateDb.close();
    
    console.log(`📄 별도 문서 생성: [${separateDocId}] MCP Hub 추가 분석 문서`);
    
    // 이제 PRD에 연결
    const linkResult = await server.linkDocumentToPRD(separateDocId, testPRDId, 'analysis');
    console.log('✅ link_document_to_prd 성공:', linkResult.message);
    console.log(`   📄 문서: ${linkResult.document_title}`);
    console.log(`   🔗 PRD: ${linkResult.prd_title}`);
    console.log(`   📊 링크 유형: ${linkResult.link_type}\n`);

    // 최종 검증 - 다시 PRD 문서들 조회
    console.log('6️⃣ 최종 검증 - 전체 PRD 문서 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const finalCheck = await server.getPRDDocuments(testPRDId);
    console.log(`✅ 최종 확인: PRD "${finalCheck.prd_title}"에 연결된 문서 ${finalCheck.total}개`);
    finalCheck.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. [${doc.id}] ${doc.title}`);
      console.log(`      📄 유형: ${doc.doc_type} | 🔗 링크: ${doc.link_type} | 📊 상태: ${doc.status}`);
      console.log(`      📝 요약: ${doc.summary || '없음'}`);
      console.log(`      📅 생성: ${new Date(doc.created_at).toLocaleString('ko-KR')}`);
    });

    console.log('\n🎉 모든 PRD 문서 MCP 도구 테스트 완료!');
    console.log('\n📊 테스트 결과 요약:');
    console.log('   ✅ create_prd_document - PRD 상세 문서 생성');
    console.log('   ✅ get_prd_documents - PRD 연결 문서 조회');  
    console.log('   ✅ search_prd_documents - PRD 문서 전문 검색');
    console.log('   ✅ update_prd_document - PRD 문서 내용 수정');
    console.log('   ✅ link_document_to_prd - 기존 문서를 PRD에 연결');
    
    console.log('\n🚀 PRD 문서 시스템이 완전히 작동합니다!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error.stack);
  }
}

testAllPRDTools();