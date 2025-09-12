# 다음 세션 MCP 도구 테스트 계획 및 수정사항

**문서 번호**: 11  
**생성일**: 2025-09-07  
**상태**: 진행 중  

## 🎉 현재 세션 완료 사항

### ✅ 성공적으로 완료된 작업
1. **데이터베이스 경로 문제 해결**
   - 문제: `SQLitePRDStorage.js`에서 MCP 서버와 대시보드 실행 환경별로 다른 경로 계산
   - 해결책: 파일 기준 상대경로 사용 (`path.resolve(__dirname, '../../../../data/workflow.db')`)
   - 적용 파일: `dashboard/src/lib/server/SQLitePRDStorage.js`

2. **대시보드 PRD CRUD 기능 완전 테스트**
   - ✅ **Create**: "테스트용 모바일 쇼핑 앱 PRD" 생성 성공
   - ✅ **Read**: PRD 목록 조회 및 상세보기 성공 (19개 PRD 확인)
   - ✅ **Update**: 제목 수정 성공 ("수정됨" 접미어 추가)

3. **문서화 완료**
   - `docs/PRD_DATABASE_PATH_RESOLUTION.md`: 데이터베이스 경로 해결 방안 문서
   - `docs/NEXT_SESSION_MCP_TEST_PLAN.md`: 이 문서

## ❌ 미완료 및 다음 세션 작업 사항

### 🔧 MCP 도구 테스트 (최고 우선순위)

#### 현재 상황
- **문제**: MCP 도구 `mcp__workflow-mcp__create_prd`에서 여전히 `SQLITE_CANTOPEN` 오류 발생
- **원인**: Claude Code가 수정된 SQLitePRDStorage.js를 반영하지 못함 (캐시/재시작 필요)
- **해결 필요**: Claude Code 재시작 후 MCP 도구 재테스트

#### 테스트할 MCP 도구들
```javascript
// 1. PRD Create
mcp__workflow-mcp__create_prd({
  title: "MCP 도구 테스트 PRD",
  description: "Claude Code 재시작 후 MCP 도구 정상 작동 확인",
  requirements: ["기능1", "기능2", "기능3"],
  priority: "High"
})

// 2. PRD List
mcp__workflow-mcp__list_prds()

// 3. PRD Get
mcp__workflow-mcp__get_prd({ prd_id: "생성된_PRD_ID" })

// 4. PRD Update  
mcp__workflow-mcp__update_prd({
  prd_id: "생성된_PRD_ID",
  updates: { title: "MCP 도구 테스트 PRD - 수정됨" }
})
```

### 🔍 추가 검증 작업

#### 1. 실시간 동기화 테스트
- **목적**: MCP 도구로 생성/수정한 PRD가 대시보드에 실시간 반영되는지 확인
- **방법**: 
  1. MCP 도구로 PRD 생성
  2. 대시보드 새로고침 없이 목록에 표시되는지 확인
  3. MCP 도구로 PRD 수정
  4. 대시보드에서 변경사항 즉시 반영 확인

#### 2. 데이터 일관성 검증
- **SQLite MCP vs Workflow MCP**: 동일한 데이터베이스 접근 시 일관성 확인
- **대시보드 vs MCP**: 양방향 데이터 동기화 완전성 검증

#### 3. 오류 처리 테스트
- **잘못된 PRD ID**: 존재하지 않는 PRD 조회/수정 시 오류 처리
- **필수 필드 누락**: 필수 필드 없이 PRD 생성 시도
- **데이터베이스 잠금**: 동시 접근 시 충돌 상황 처리

### 🐛 알려진 문제점

#### 1. 날짜 표시 문제
- **현상**: 모든 PRD의 생성일/수정일이 "Invalid Date"로 표시
- **위치**: 대시보드 PRD 목록 및 상세보기 페이지
- **원인 추정**: 날짜 포맷팅 또는 데이터베이스 컬럼 타입 문제
- **해결 필요**: 날짜 필드 조사 및 수정

#### 2. MCP 서버 연결 불안정
- **현상**: MCP 서버가 시작 후 즉시 종료되는 경우 발생
- **임시 해결**: 여러 번 재시작으로 해결됨
- **근본 원인**: MCP 프로토콜 또는 서버 초기화 문제 가능성

## 🎯 다음 세션 실행 계획

### Phase 1: 환경 재설정 (5분)
1. **Claude Code 재시작** (수정된 MCP 서버 코드 반영)
2. **MCP 서버 연결 상태 확인**: `ListMcpResourcesTool()` 실행
3. **데이터베이스 상태 점검**: 기존 테스트 PRD 존재 확인

### Phase 2: MCP 도구 완전 테스트 (15분)
1. **Create 테스트**: 새 PRD 생성
2. **Read 테스트**: 목록 조회 및 특정 PRD 조회
3. **Update 테스트**: 생성한 PRD 수정
4. **실시간 동기화**: 대시보드에서 변경사항 확인

### Phase 3: 문제점 수정 (10분)
1. **날짜 표시 문제 해결**
2. **발견된 추가 이슈 수정**
3. **최종 검증 테스트**

## 📋 점검 체크리스트

### MCP 도구 테스트
- [ ] `mcp__workflow-mcp__create_prd` 정상 작동
- [ ] `mcp__workflow-mcp__list_prds` 정상 작동  
- [ ] `mcp__workflow-mcp__get_prd` 정상 작동
- [ ] `mcp__workflow-mcp__update_prd` 정상 작동

### 실시간 동기화 검증
- [ ] MCP → 대시보드 동기화 확인
- [ ] 대시보드 → MCP 동기화 확인
- [ ] 데이터 일관성 검증

### 문제점 해결
- [ ] 날짜 표시 문제 수정
- [ ] MCP 서버 안정성 개선
- [ ] 오류 처리 강화

## 🔧 기술적 참고사항

### 수정된 파일
```
dashboard/src/lib/server/SQLitePRDStorage.js
- 경로 계산 로직 변경: process.cwd() → __dirname 기준
```

### 테스트 환경
- **데이터베이스**: `C:\dev\workflow-mcp\data\workflow.db`
- **대시보드 URL**: `http://localhost:3301/prds`
- **테스트 PRD ID**: `c2ec78cc-2a36-44c8-856d-4bbf2b11141b`

### 성공 기준
✅ MCP 도구로 PRD CRUD 작업 시 오류 없이 실행  
✅ 대시보드와 MCP 도구 간 실시간 데이터 동기화  
✅ 날짜 필드 정상 표시  
✅ 안정적인 MCP 서버 연결 유지  

---

**다음 세션에서 이 문서를 기준으로 체계적인 테스트와 수정을 진행하세요.**