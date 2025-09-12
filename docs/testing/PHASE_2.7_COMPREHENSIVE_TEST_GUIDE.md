# Phase 2.7 종합 테스트 가이드

## 📋 테스트 개요

**테스트 대상**: Phase 2.7 문서 관리 시스템 + Phase 2.6 이슈 해결 검증  
**필수 구성요소**: 
- SQLite 데이터베이스 (workflow.db)
- Document Management MCP 서버 
- SvelteKit 대시보드 (Chart.js & D3.js 이슈 해결)
- 기존 WorkflowMCP 기능 유지

**테스트 목표**: 
1. Phase 2.7 문서 관리 시스템 검증
2. Phase 2.6 미해결 이슈 해결 확인
3. 전체 시스템 통합성 검증

---

## ✅ Phase 2.6 이슈 해결 완료

### 이슈 #1: Chart.js 초기화 문제 - **해결됨**
**상태**: ✅ **해결완료**  
**문제**: 데이터베이스 경로 오류로 인한 빈 데이터, 차트 초기화 실패  
**해결**: 
- 데이터베이스 경로 수정: `process.cwd()` → `__dirname` 기반 안정적 경로
- 빈 데이터에서도 기본 차트 렌더링 지원
- ES 모듈에서 `require` → `import` 수정

### 이슈 #2: Gantt 차트 D3.js 렌더링 오류 - **해결됨**
**상태**: ✅ **해결완료**  
**문제**: `<rect> attribute width: A negative value is not valid`  
**해결**:
- 음수 너비 방지: `Math.max(width, 10)` 최소 너비 보장  
- 날짜 검증: endDate ≤ startDate인 경우 자동 보정
- 안정적인 데이터 처리 로직 추가

---

## 🗄️ PART 1: SQLite 데이터베이스 검증

### 1.1 데이터베이스 파일 존재 확인
```bash
# 위치 확인
ls -la data/workflow.db

# 예상 결과: 파일 존재, 크기 > 200KB
```

### 1.2 문서 관리 테이블 구조 확인
```bash
# 테이블 목록 확인
sqlite3 data/workflow.db ".tables"

# 예상 결과: documents, document_links, documents_fts 테이블 포함
```

### 1.3 테스트 데이터 확인
```bash
# 문서 수 확인
sqlite3 data/workflow.db "SELECT COUNT(*) FROM documents;"

# 문서 목록 확인
sqlite3 data/workflow.db "SELECT id, title, doc_type FROM documents LIMIT 5;"

# 예상 결과: 최소 3개 문서 (테스트 가이드, 결과 보고서, 체크리스트)
```

---

## 🔧 PART 2: Document Management MCP 서버 테스트

### 2.1 MCP 서버 시작 및 연결 테스트

#### 전제조건 확인
```bash
# Node.js 버전 확인 (v18+ 필요)
node --version

# 의존성 설치 확인
cd /c/dev/juk/edit/workflow-mcp
npm install
```

#### MCP 서버 독립 실행 테스트
```bash
# MCP 서버 직접 실행
cd /c/dev/juk/edit/workflow-mcp
node src/document-mcp-server.js

# 예상 결과: "Document Management MCP Server started" 메시지
# 오류 없이 서버 시작 (Ctrl+C로 종료)
```

### 2.2 Claude Code MCP 통합 테스트

#### 설정 확인
```bash
# MCP 설정 파일 확인
cat .mcp.json

# 예상 내용: document-mcp-server 항목 존재
```

#### Claude Code 내에서 MCP 도구 확인
```
1. Claude Code 시작: claude --debug
2. 디버그 모드에서 2분 대기 (MCP 서버 부팅 확인)
3. /mcp 명령어로 사용 가능한 MCP 도구 확인
4. 예상 결과: document management 관련 9개 도구 표시
```

### 2.3 핵심 MCP 도구 기능 테스트

#### 도구 #1: list_documents
```
Claude Code에서 실행:
mcp__workflow-mcp__list_documents

예상 결과: 
- 최소 3개 문서 반환
- 각 문서에 id, title, doc_type, created_at 필드 포함
```

#### 도구 #2: get_document  
```
Claude Code에서 실행:
mcp__workflow-mcp__get_document {"id": 1}

예상 결과:
- 문서 전체 내용 반환
- title, content, doc_type, tags 등 모든 필드 포함
```

#### 도구 #3: create_document
```
Claude Code에서 실행:
mcp__workflow-mcp__create_document {
  "title": "Phase 2.7 테스트 문서",
  "content": "MCP 도구 테스트용 문서입니다.",
  "doc_type": "test",
  "category": "testing",
  "tags": ["test", "mcp", "phase_2.7"]
}

예상 결과:
- 새 문서 ID 반환
- 성공 메시지
```

#### 도구 #4: search_documents
```
Claude Code에서 실행:
mcp__workflow-mcp__search_documents {"query": "테스트"}

예상 결과:
- 검색어가 포함된 문서들 반환
- 최소 2개 문서 매칭 (기존 테스트 문서 + 새로 생성한 문서)
```

#### 도구 #5: update_document
```
Claude Code에서 실행:
mcp__workflow-mcp__update_document {
  "id": [새로_생성한_문서_ID],
  "content": "업데이트된 내용입니다.",
  "status": "published"
}

예상 결과:
- 문서 업데이트 성공
- updated_at 필드 갱신
```

### 2.4 고급 기능 테스트

#### 전체 텍스트 검색 (FTS)
```
mcp__workflow-mcp__search_documents {"query": "SvelteKit Dashboard"}

예상 결과:
- FTS 인덱스를 통한 빠른 검색
- 관련 문서들 반환
```

#### 문서 연결 기능
```
mcp__workflow-mcp__link_document {
  "document_id": 1,
  "linked_entity_type": "task",
  "linked_entity_id": "1.1",
  "link_type": "reference"
}

예상 결과:
- 문서 링크 생성 성공
```

---

## 🎨 PART 3: SvelteKit 대시보드 통합 테스트

### 3.1 서버 시작 및 기본 동작
```bash
# 대시보드 서버 시작
cd /c/dev/juk/edit/workflow-mcp/dashboard
npm run dev

# 예상 결과: http://localhost:3302 에서 서버 실행
```

### 3.2 Phase 2.6 이슈 해결 확인 (간단 검증)

#### Chart.js 초기화 문제 해결 확인
1. **브라우저에서 접근**: http://localhost:3302
2. **대시보드 페이지 확인**: 
   - ✅ 통계 카드 4개 정상 표시
   - ✅ **차트 2개 정상 렌더링** (해결됨)
3. **브라우저 콘솔 확인**: 
   - Chart.js 관련 오류 없음
   - 차트 인스턴스 정상 생성

#### D3.js Gantt 차트 렌더링 오류 해결 확인
1. **간트 차트 페이지 접근**: http://localhost:3302/gantt
2. **렌더링 확인**:
   - ✅ 타임라인 정상 표시
   - ✅ **모든 막대 그래프 정상 렌더링** (해결됨)
3. **브라우저 콘솔 확인**:
   - `negative value is not valid` 오류 없음
   - D3.js 스케일링 정상 동작

### 3.3 문서 관리 UI 통합 (새 기능)

#### 새 페이지: 문서 관리 탭 추가 확인
1. **내비게이션 메뉴 확인**: "문서 관리" 탭 추가
2. **문서 관리 페이지**: http://localhost:3302/documents
3. **기능 테스트**:
   - 문서 목록 표시
   - 새 문서 생성 버튼
   - 검색 기능
   - 카테고리 필터링

---

## 🔗 PART 4: 시스템 통합성 테스트

### 4.1 WorkflowMCP ↔ Document Management 연동

#### PRD 문서와 작업 연결 테스트
```
Claude Code에서 실행:
1. PRD 생성: mcp__workflow-mcp__create_prd
2. 관련 문서 생성: mcp__workflow-mcp__create_document  
3. 문서-PRD 연결: mcp__workflow-mcp__link_document
4. 연결 확인: mcp__workflow-mcp__get_linked_data
```

#### 작업 진행과 문서 업데이트 연동
```
1. 작업 상태 변경: mcp__workflow-mcp__update_task
2. 관련 문서 업데이트: mcp__workflow-mcp__update_document
3. 대시보드에서 변경사항 확인
```

### 4.2 SQLite 데이터베이스 무결성 확인
```bash
# 데이터베이스 무결성 검사
sqlite3 data/workflow.db "PRAGMA integrity_check;"

# 외래 키 제약 조건 확인  
sqlite3 data/workflow.db "PRAGMA foreign_key_check;"

# 예상 결과: "ok" 반환, 오류 없음
```

---

## ✅ PART 5: 성능 및 안정성 테스트

### 5.1 동시성 테스트
```
Claude Code에서 동시에 실행:
1. 여러 문서 동시 생성 (5개)
2. 동시 검색 요청 (3개)
3. 문서 업데이트와 조회 동시 실행

예상 결과: 모든 작업 성공, 데이터 일관성 유지
```

### 5.2 대용량 데이터 테스트
```
1. 긴 내용의 문서 생성 (10,000자 이상)
2. 다수의 문서 생성 (50개)
3. 복잡한 검색 쿼리 실행

예상 결과: 성능 저하 없이 정상 처리
```

### 5.3 오류 복구 테스트
```
1. 잘못된 문서 ID로 조회 시도
2. 필수 필드 누락으로 문서 생성 시도
3. 존재하지 않는 문서 업데이트 시도

예상 결과: 적절한 오류 메시지 반환, 시스템 안정성 유지
```

---

## 🎯 PART 6: 최종 검증 체크리스트

### Phase 2.6 이슈 해결 확인
- [x] Chart.js 초기화 문제 완전 해결 ✅ **해결완료**
- [x] Gantt 차트 D3.js 렌더링 오류 완전 해결 ✅ **해결완료**  
- [ ] 기존 SvelteKit 대시보드 기능 유지 (간단 검증)

### Phase 2.7 문서 관리 시스템 확인
- [ ] SQLite 스키마 정상 생성 (documents, document_links, documents_fts)
- [ ] MCP 서버 독립 실행 성공
- [ ] Claude Code MCP 통합 성공
- [ ] 9개 MCP 도구 모두 정상 동작
- [ ] 전체 텍스트 검색(FTS) 기능 동작
- [ ] 문서 연결 기능 동작

### 시스템 통합성 확인
- [ ] 기존 WorkflowMCP 기능 유지
- [ ] 문서 관리와 워크플로우 연동
- [ ] SQLite 데이터베이스 무결성 유지
- [ ] 동시성 및 성능 요구사항 충족

---

## 🚨 테스트 실패 시 대응 방안

### Chart.js 초기화 실패 시
```
1. dashboard/src/lib/components/Dashboard.svelte 파일 확인
2. Chart.js import 구문 확인
3. onMount 함수 내 차트 초기화 로직 점검
4. 브라우저 콘솔에서 Chart.js 로딩 상태 확인
```

### D3.js 렌더링 오류 시
```
1. dashboard/src/lib/components/GanttChart.svelte 파일 확인
2. D3.js 스케일 함수에서 음수 값 처리 로직 확인
3. 데이터 전처리에서 유효하지 않은 날짜/길이 값 필터링
```

### MCP 연결 실패 시
```
1. .mcp.json 설정 파일 구문 확인
2. Node.js 경로 및 버전 확인
3. document-mcp-server.js 파일 존재 및 실행 권한 확인
4. SQLite 데이터베이스 파일 접근 권한 확인
```

---

## 📊 예상 테스트 결과 요약

### 성공 기준
- **Phase 2.6 이슈**: 2개 모두 해결 (Chart.js + D3.js)
- **Document Management MCP**: 9개 도구 모두 정상 동작
- **SQLite 통합**: 무결성 검사 통과
- **성능**: 모든 작업 2초 이내 완료

### 테스트 소요 시간 (업데이트됨)
- **PART 1-2 (데이터베이스 + MCP)**: 30분
- **PART 3 (대시보드 간단 검증 + Phase 2.7 UI)**: 15분 (단축됨)  
- **PART 4-5 (통합 + 성능)**: 25분
- **PART 6 (최종 검증)**: 10분
- **총 소요 시간**: 약 **70분** (20분 단축)

---

## 📋 테스트 결과 보고 형식

```markdown
# Phase 2.7 테스트 결과 보고서

## 📊 전체 결과 요약
- **테스트 일시**: [날짜/시간]
- **테스트 환경**: [OS, Node.js 버전, 브라우저]
- **전체 테스트**: [총 개수]개
- **통과**: [개수]개 ✅  
- **부분 통과**: [개수]개 🟡
- **실패**: [개수]개 ❌
- **통과율**: [%]

## 🔧 Phase 2.6 이슈 해결 결과
### Chart.js 초기화 문제
- **상태**: [해결됨/부분해결/미해결]
- **세부사항**: [구체적인 결과]

### D3.js Gantt 차트 렌더링 오류  
- **상태**: [해결됨/부분해결/미해결]
- **세부사항**: [구체적인 결과]

## 📑 Phase 2.7 문서 관리 시스템 결과
[각 PART별 세부 테스트 결과]

## 🚨 발견된 새로운 이슈
[새로 발견된 문제점들]

## 📈 권장사항
[다음 단계 개발 방향]
```

---

**문서 작성자**: Claude Code Assistant  
**문서 버전**: v1.0  
**작성일**: 2025년 9월 5일  
**테스트 대상**: Phase 2.7 문서 관리 시스템 + Phase 2.6 이슈 해결