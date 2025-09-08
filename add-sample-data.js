#!/usr/bin/env node
/**
 * WorkflowMCP Sample Data Generator
 * Adds sample data for testing and demonstration purposes
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { randomUUID } from 'crypto';

const DB_PATH = './data/workflow.db';

/**
 * Generate sample data for WorkflowMCP
 */
async function addSampleData() {
  console.log('🎯 WorkflowMCP Sample Data Generator');
  console.log('=====================================\n');

  try {
    // Connect to database
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    console.log('✅ Connected to database');

    // Check if data already exists
    const existingPRDs = await db.get('SELECT COUNT(*) as count FROM prds');
    const existingTasks = await db.get('SELECT COUNT(*) as count FROM tasks');
    const existingDocs = await db.get('SELECT COUNT(*) as count FROM documents');

    if (existingPRDs.count > 0 || existingTasks.count > 0 || existingDocs.count > 0) {
      console.log('⚠️  Sample data already exists:');
      console.log(`   📊 PRDs: ${existingPRDs.count}, Tasks: ${existingTasks.count}, Documents: ${existingDocs.count}`);
      console.log('   Skipping data generation to avoid duplicates.\n');
      
      console.log('💡 To reset and add fresh sample data:');
      console.log('   1. Delete data/workflow.db');
      console.log('   2. Run: node init-database.js');
      console.log('   3. Run: node add-sample-data.js');
      
      await db.close();
      return;
    }

    console.log('📊 Adding sample data...\n');

    // Sample PRDs
    const samplePRDs = [
      {
        id: randomUUID(),
        title: '워크플로우 MCP 플랫폼 개발',
        description: 'AI 기반 프로젝트 관리 및 협업 플랫폼 구축을 위한 종합 요구사항 문서',
        requirements: JSON.stringify([
          '사용자 인증 및 권한 관리 시스템',
          'PRD, 작업, 계획 관리 기능',
          '실시간 협업 및 알림 시스템',
          '대시보드 및 분석 기능',
          '테스트 관리 시스템'
        ]),
        priority: 'High',
        status: 'approved',
        tags: JSON.stringify(['platform', 'mcp', 'ai', 'collaboration'])
      },
      {
        id: randomUUID(),
        title: '테스트 자동화 시스템',
        description: '통합 테스트 자동화 및 CI/CD 파이프라인 구축',
        requirements: JSON.stringify([
          '단위 테스트 자동화',
          '통합 테스트 환경 구축',
          'CI/CD 파이프라인 설정',
          '테스트 리포트 생성'
        ]),
        priority: 'High',
        status: 'review',
        tags: JSON.stringify(['testing', 'automation', 'cicd'])
      },
      {
        id: randomUUID(),
        title: '사용자 경험 개선',
        description: '대시보드 UI/UX 개선 및 접근성 향상',
        requirements: JSON.stringify([
          '반응형 디자인 적용',
          '접근성 가이드라인 준수',
          '사용자 피드백 시스템',
          '성능 최적화'
        ]),
        priority: 'Medium',
        status: 'draft',
        tags: JSON.stringify(['ui', 'ux', 'accessibility', 'performance'])
      }
    ];

    console.log('📋 Creating sample PRDs...');
    for (const prd of samplePRDs) {
      await db.run(`
        INSERT INTO prds (id, title, description, requirements, priority, status, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [prd.id, prd.title, prd.description, prd.requirements, prd.priority, prd.status, prd.tags]);
    }
    console.log(`   ✅ ${samplePRDs.length} PRDs created`);

    // Sample Tasks
    const sampleTasks = [
      {
        id: randomUUID(),
        title: '데이터베이스 스키마 설계',
        description: 'SQLite 데이터베이스 스키마 설계 및 최적화',
        status: 'done',
        priority: 'High',
        assignee: 'dev-team',
        estimated_hours: 16,
        actual_hours: 18,
        tags: JSON.stringify(['database', 'schema', 'sqlite'])
      },
      {
        id: randomUUID(),
        title: 'MCP 서버 구현',
        description: 'Model Context Protocol 서버 구현 및 35개 도구 개발',
        status: 'done',
        priority: 'High',
        assignee: 'backend-team',
        estimated_hours: 40,
        actual_hours: 45,
        tags: JSON.stringify(['mcp', 'server', 'tools'])
      },
      {
        id: randomUUID(),
        title: '웹 대시보드 개발',
        description: 'SvelteKit 기반 반응형 웹 대시보드 구현',
        status: 'in_progress',
        priority: 'High',
        assignee: 'frontend-team',
        estimated_hours: 32,
        actual_hours: 28,
        tags: JSON.stringify(['frontend', 'sveltekit', 'dashboard'])
      },
      {
        id: randomUUID(),
        title: '테스트 케이스 작성',
        description: '핵심 기능에 대한 테스트 케이스 작성 및 실행',
        status: 'pending',
        priority: 'Medium',
        assignee: 'qa-team',
        estimated_hours: 24,
        tags: JSON.stringify(['testing', 'qa', 'validation'])
      },
      {
        id: randomUUID(),
        title: '문서화 작업',
        description: '사용자 가이드 및 API 문서 작성',
        status: 'pending',
        priority: 'Medium',
        assignee: 'tech-writer',
        estimated_hours: 20,
        tags: JSON.stringify(['documentation', 'guide', 'api'])
      }
    ];

    console.log('📋 Creating sample tasks...');
    for (const task of sampleTasks) {
      await db.run(`
        INSERT INTO tasks (id, title, description, status, priority, assignee, estimated_hours, actual_hours, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [task.id, task.title, task.description, task.status, task.priority, task.assignee, task.estimated_hours, task.actual_hours || null, task.tags]);
    }
    console.log(`   ✅ ${sampleTasks.length} tasks created`);

    // Sample Documents
    const sampleDocuments = [
      {
        title: '프로젝트 요구사항 분석 보고서',
        content: `# 프로젝트 요구사항 분석 보고서

## 개요
WorkflowMCP 프로젝트의 핵심 요구사항을 분석한 결과를 정리합니다.

## 주요 발견사항
1. **AI 통합의 중요성**: Claude Code와의 원활한 통합이 핵심 성공 요소
2. **확장성 요구**: 대량의 프로젝트 데이터를 효율적으로 처리해야 함
3. **사용성 우선**: 개발자 중심의 직관적인 인터페이스 필요

## 권장사항
- MCP 프로토콜 표준 준수
- SQLite를 통한 경량화된 데이터 관리
- 반응형 웹 대시보드 구현`,
        doc_type: 'analysis',
        category: 'requirements',
        summary: 'WorkflowMCP 프로젝트의 요구사항 분석 및 권장사항',
        tags: JSON.stringify(['requirements', 'analysis', 'project'])
      },
      {
        title: '데이터베이스 설계 문서',
        content: `# 데이터베이스 설계 문서

## 스키마 버전
- 현재 버전: 3.0.0
- 최종 업데이트: ${new Date().toISOString().split('T')[0]}

## 핵심 테이블
1. **prds**: 제품 요구사항 문서
2. **tasks**: 작업 관리
3. **plans**: 프로젝트 계획
4. **documents**: 문서 관리
5. **test_cases**: 테스트 케이스 관리

## 관계형 설계
- 외래키 제약조건을 통한 데이터 무결성 보장
- 트리거를 통한 자동 업데이트 로직
- 인덱스 최적화로 성능 향상

## 성능 고려사항
- FTS5를 통한 전문 검색 지원
- 뷰를 통한 복잡한 쿼리 최적화
- 적절한 인덱싱 전략`,
        doc_type: 'specification',
        category: 'database',
        summary: 'WorkflowMCP SQLite 데이터베이스 설계 상세 문서',
        tags: JSON.stringify(['database', 'schema', 'design', 'sqlite'])
      },
      {
        title: 'MCP 도구 테스트 결과',
        content: `# MCP 도구 테스트 결과

## 테스트 개요
- 테스트 일시: ${new Date().toLocaleDateString('ko-KR')}
- 테스트 도구: 35개 MCP 도구
- 테스트 환경: Claude Code CLI

## 테스트 결과 요약
- ✅ 성공: 33/35 도구 (94.3%)
- ⚠️ 경고: 2/35 도구 (5.7%)
- ❌ 실패: 0/35 도구 (0%)

## 주요 성과
1. **CRUD 작업**: 모든 생성, 읽기, 수정, 삭제 작업 정상 작동
2. **검색 기능**: 전문 검색 및 필터링 기능 완벽 작동
3. **관계형 작업**: 엔티티 간 연결 작업 성공적 수행

## 개선 권장사항
- 에러 핸들링 강화
- 성능 모니터링 추가
- 로깅 시스템 개선`,
        doc_type: 'test_results',
        category: 'testing',
        summary: 'MCP 서버 도구들에 대한 종합 테스트 결과 및 성능 분석',
        tags: JSON.stringify(['mcp', 'testing', 'results', 'tools'])
      },
      {
        title: '대시보드 UI 개발 가이드',
        content: `# 대시보드 UI 개발 가이드

## 디자인 원칙
1. **일관성**: 모든 페이지에서 통일된 UI 패턴 사용
2. **접근성**: WCAG 2.1 AA 수준 준수
3. **반응성**: 모바일부터 데스크탑까지 완벽 지원

## 컴포넌트 구조
- **카드 기반 레이아웃**: 정보를 명확하게 구분
- **필터 시스템**: 직관적인 데이터 필터링
- **네비게이션**: 일관된 CRUD 패턴

## 기술 스택
- **프론트엔드**: SvelteKit + Tailwind CSS
- **상태 관리**: Svelte stores
- **라우팅**: SvelteKit 파일 기반 라우팅

## 성능 최적화
- 코드 분할 및 지연 로딩
- 이미지 최적화
- 캐싱 전략`,
        doc_type: 'specification',
        category: 'frontend',
        summary: '웹 대시보드 UI 개발을 위한 종합 가이드 문서',
        tags: JSON.stringify(['ui', 'frontend', 'guide', 'sveltekit'])
      }
    ];

    console.log('📄 Creating sample documents...');
    for (const doc of sampleDocuments) {
      await db.run(`
        INSERT INTO documents (title, content, doc_type, category, summary, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [doc.title, doc.content, doc.doc_type, doc.category, doc.summary, doc.tags]);
    }
    console.log(`   ✅ ${sampleDocuments.length} documents created`);

    // Sample Test Cases
    const sampleTestCases = [
      {
        id: randomUUID(),
        title: 'PRD 생성 기능 테스트',
        description: 'PRD 생성 API 및 UI 기능의 정상 작동 확인',
        type: 'integration',
        status: 'active',
        priority: 'High',
        preconditions: '대시보드에 로그인된 상태',
        test_steps: JSON.stringify([
          'PRD 관리 페이지 접속',
          '새 PRD 추가 버튼 클릭',
          '필수 필드 입력 (제목, 설명)',
          '저장 버튼 클릭',
          '생성된 PRD 확인'
        ]),
        expected_result: 'PRD가 성공적으로 생성되고 목록에 표시됨',
        tags: JSON.stringify(['prd', 'crud', 'integration'])
      },
      {
        id: randomUUID(),
        title: '검색 기능 성능 테스트',
        description: '대량 데이터 환경에서 검색 성능 확인',
        type: 'system',
        status: 'active',
        priority: 'Medium',
        preconditions: '1000개 이상의 문서가 데이터베이스에 존재',
        test_steps: JSON.stringify([
          '문서 검색 페이지 접속',
          '키워드 "테스트" 입력',
          '검색 실행',
          '응답 시간 측정',
          '결과 정확성 확인'
        ]),
        expected_result: '2초 이내에 정확한 검색 결과 반환',
        tags: JSON.stringify(['search', 'performance', 'fts'])
      }
    ];

    console.log('🧪 Creating sample test cases...');
    for (const testCase of sampleTestCases) {
      await db.run(`
        INSERT INTO test_cases (id, title, description, type, status, priority, preconditions, test_steps, expected_result, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [testCase.id, testCase.title, testCase.description, testCase.type, testCase.status, testCase.priority, testCase.preconditions, testCase.test_steps, testCase.expected_result, testCase.tags]);
    }
    console.log(`   ✅ ${sampleTestCases.length} test cases created`);

    // Final verification
    console.log('\n📊 Verifying sample data...');
    const finalCounts = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM prds'),
      db.get('SELECT COUNT(*) as count FROM tasks'),
      db.get('SELECT COUNT(*) as count FROM documents'),
      db.get('SELECT COUNT(*) as count FROM test_cases')
    ]);

    console.log('   📈 Final counts:');
    console.log(`      PRDs: ${finalCounts[0].count}`);
    console.log(`      Tasks: ${finalCounts[1].count}`);
    console.log(`      Documents: ${finalCounts[2].count}`);
    console.log(`      Test Cases: ${finalCounts[3].count}`);

    await db.close();

    console.log('\n🎉 SAMPLE DATA CREATION COMPLETE!');
    console.log('=====================================');
    console.log('💡 You can now:');
    console.log('   1. Start the MCP server: npm start');
    console.log('   2. Start the dashboard: cd dashboard && npm run dev');
    console.log('   3. View sample data at: http://localhost:3302');
    console.log('   4. Test MCP tools with Claude Code');

  } catch (error) {
    console.error('\n❌ SAMPLE DATA CREATION FAILED');
    console.error('===============================');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSampleData();
}

export default addSampleData;