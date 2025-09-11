# Test Plan - WorkflowMCP API 시스템 검증
# 기존 시스템 테스트 및 누락 기능 우선순위 결정

## 📋 테스트 개요

**목적**: 기존 WorkflowMCP 시스템의 실제 상태를 검증하고 누락된 기능의 우선순위를 결정  
**범위**: 58개 MCP 도구, 34개 기존 API, 대시보드 기능  
**현재 상황**: 대시보드 실행 중 (http://localhost:3302), MCP 서버 실행 중  
**발견된 이슈**: SQLite 스키마 불일치 (`recorded_at`, `uptime_percentage` 컬럼 누락)

## 🎯 테스트 목표

### 1차 목표: 현재 시스템 상태 파악
- [ ] 기존 34개 API 엔드포인트 실제 작동 확인
- [ ] 30개 구현된 MCP 도구 동작 검증
- [ ] 대시보드 페이지별 기능 테스트
- [ ] 데이터베이스 스키마 문제 식별

### 2차 목표: 누락 기능 우선순위 결정
- [ ] 28개 누락 MCP 도구 중 긴급도 평가
- [ ] 사용자 워크플로우 기반 우선순위 설정
- [ ] 구현 복잡도 vs 중요도 매트릭스 작성

### 3차 목표: 구현 계획 최적화
- [ ] 실제 상황 기반 WBS 조정
- [ ] 위험 요소 및 블로커 식별
- [ ] 빠른 구현 가능한 기능 선별

## 🧪 테스트 단계별 계획

## Phase 1: 시스템 상태 검증 (1시간)

### 1.1 데이터베이스 상태 확인 (15분)

#### 기본 연결 테스트
```bash
# 데이터베이스 파일 존재 및 권한 확인
ls -la C:\dev\workflow-mcp\data\workflow.db

# 스키마 확인
sqlite3 C:\dev\workflow-mcp\data\workflow.db ".schema"

# 테이블 목록 확인  
sqlite3 C:\dev\workflow-mcp\data\workflow.db ".tables"
```

#### 발견된 이슈 확인
- [ ] `recorded_at` 컬럼 누락 테이블 식별
- [ ] `uptime_percentage` 컬럼 누락 테이블 식별
- [ ] 스키마 불일치로 인한 API 에러 목록 작성

**예상 결과**: DevOps 관련 테이블에 최신 스키마 미적용

### 1.2 MCP 서버 기능 테스트 (20분)

#### MCP 도구 목록 확인
```bash
# Claude Code에서 MCP 도구 확인
echo '{"method": "tools/list"}' | node src/index.js
```

#### 핵심 MCP 도구 테스트 (각 2분)
1. **PRD Management** 
   - [ ] `create_prd` 테스트
   - [ ] `list_prds` 테스트  
   - [ ] `get_prd` 테스트

2. **Task Management**
   - [ ] `create_task` 테스트
   - [ ] `list_tasks` 테스트
   - [ ] `update_task` 테스트

3. **Document Management**
   - [ ] `create_document` 테스트
   - [ ] `search_documents` 테스트
   - [ ] `list_documents` 테스트

**테스트 방법**: Claude Code MCP 도구 직접 호출

### 1.3 대시보드 API 엔드포인트 테스트 (25분)

#### API 응답 시간 및 기능 테스트
```bash
# 기본 API 테스트 스크립트
curl -X GET http://localhost:3302/api/prds
curl -X GET http://localhost:3302/api/tasks  
curl -X GET http://localhost:3302/api/documents
curl -X GET http://localhost:3302/api/projects
```

#### 카테고리별 테스트 (각 3분)
1. **PRD APIs** (4개)
   - [ ] `GET /api/prds` - 목록 조회
   - [ ] `POST /api/prds` - 생성
   - [ ] `GET /api/prds/[id]` - 상세 조회
   - [ ] `PUT /api/prds/[id]` - 업데이트

2. **Task APIs** (5개)
   - [ ] `GET /api/tasks` - 목록 조회
   - [ ] `POST /api/tasks` - 생성
   - [ ] `GET /api/tasks/[id]` - 상세 조회
   - [ ] `PUT /api/tasks/[id]` - 업데이트
   - [ ] `GET /api/tasks/[id]/connections` - 연결 조회

3. **Document APIs** (3개)
   - [ ] `GET /api/documents` - 목록 조회
   - [ ] `POST /api/documents` - 생성
   - [ ] `GET /api/documents/[id]` - 상세 조회

4. **DevOps APIs** (문제 발생 예상)
   - [ ] `GET /api/system-health` - 스키마 에러 확인
   - [ ] `GET /api/performance-metrics` - 스키마 에러 확인
   - [ ] `GET /api/incidents` - 작동 여부 확인

**기록 항목**:
- 응답 시간 (< 500ms 목표)
- HTTP 상태 코드
- 에러 메시지 내용
- 응답 데이터 구조

## Phase 2: 대시보드 페이지별 기능 테스트 (45분)

### 2.1 핵심 페이지 테스트 (각 5분)

#### 메인 페이지들
1. **Home** (`http://localhost:3302/`)
   - [ ] 대시보드 로딩 확인
   - [ ] 기본 통계 정보 표시
   - [ ] 네비게이션 메뉴 작동

2. **PRDs** (`http://localhost:3302/prds`)
   - [ ] PRD 목록 표시
   - [ ] 새 PRD 생성 기능
   - [ ] 필터링 및 정렬 기능

3. **Tasks** (`http://localhost:3302/tasks`)
   - [ ] 태스크 목록 표시
   - [ ] 상태별 필터링
   - [ ] 새 태스크 생성

4. **Documents** (`http://localhost:3302/documents`)
   - [ ] 문서 목록 표시
   - [ ] 문서 검색 기능
   - [ ] 카테고리별 필터링

5. **Projects** (`http://localhost:3302/projects`)
   - [ ] 프로젝트 목록
   - [ ] 프로젝트 상세 정보
   - [ ] 간트 차트 (`/gantt`)

### 2.2 고급 기능 페이지 테스트 (각 3분)

6. **Tests** (`http://localhost:3302/tests`)
   - [ ] 테스트 케이스 관리
   - [ ] 테스트 실행 기능
   - [ ] 결과 보고서

7. **Environments** (`http://localhost:3302/environments`)
   - [ ] 환경 목록 표시
   - [ ] 환경 상태 모니터링
   - [ ] 새 환경 생성

8. **Operations** (`http://localhost:3302/operations`)
   - [ ] 시스템 상태 대시보드
   - [ ] 인시던트 관리
   - [ ] 알림 규칙 관리

9. **Network** (`http://localhost:3302/network`)
   - [ ] 관계 네트워크 시각화
   - [ ] 노드 간 연결 표시
   - [ ] 인터랙티브 탐색

### 2.3 특별 기능 테스트 (각 2분)

10. **Kanban** (`http://localhost:3302/kanban`)
    - [ ] 칸반 보드 표시
    - [ ] 드래그 앤 드롭 기능
    - [ ] 태스크 상태 변경

11. **Database** (`http://localhost:3302/database`)
    - [ ] 데이터베이스 직접 접근
    - [ ] SQL 쿼리 실행
    - [ ] 테이블 브라우징

## Phase 3: 누락 기능 분석 및 우선순위 결정 (30분)

### 3.1 누락 MCP 도구 분석 (15분)

#### 28개 누락 MCP 도구 우선순위 매트릭스

| MCP 도구 | 기능 영역 | 중요도 | 복잡도 | 사용 빈도 | 우선순위 |
|----------|-----------|--------|--------|-----------|----------|
| `link_document` | Document Relations | High | Low | High | 🔴 P1 |
| `create_prd_document` | Document Relations | High | Medium | High | 🔴 P1 |
| `get_prd_documents` | Document Relations | High | Low | High | 🔴 P1 |
| `get_test_summary` | Test Analysis | Medium | Low | Medium | 🟡 P2 |
| `get_test_coverage` | Test Analysis | Medium | Medium | Medium | 🟡 P2 |
| `get_task_connections` | Connection Mgmt | High | Low | High | 🔴 P1 |
| `add_task_connection` | Connection Mgmt | High | Medium | High | 🔴 P1 |
| `get_project_analytics` | Analytics | Medium | High | Low | 🟢 P3 |
| `get_environment_status` | Environment | Low | Low | Low | 🟢 P3 |

#### 우선순위 기준
- **🔴 P1 (긴급)**: 일상 워크플로우에 필수적인 기능
- **🟡 P2 (중요)**: 생산성 향상에 도움되는 기능  
- **🟢 P3 (선택)**: 부가적 분석 및 모니터링 기능

### 3.2 워크플로우 기반 우선순위 (15분)

#### 일반적인 사용 시나리오 분석
1. **PRD 작성 → Task 생성 → Document 연결**
   - 누락: PRD-Document 연결 기능
   - 영향: 문서 관리 워크플로우 단절

2. **Task 관리 → 의존성 설정 → 진행률 추적**
   - 누락: Task 연결 관리 기능
   - 영향: 프로젝트 관리 효율성 저하

3. **Test 실행 → 결과 분석 → 커버리지 리포트**
   - 누락: 테스트 분석 기능
   - 영향: 품질 관리 프로세스 불완전

#### 최종 우선순위 (구현 순서)
1. **Week 1**: Document Relations (P1) - 8개 API
2. **Week 2**: Connection Management (P1) - 6개 API  
3. **Week 3**: Test Analysis (P2) - 4개 API
4. **Future**: Analytics & Monitoring (P3) - 10개 API

## 📊 테스트 결과 분석 템플릿

### 시스템 상태 스코어카드
```
┌─ WorkflowMCP System Health ──────────────────┐
│                                              │
│ 🗄️  Database: ⚠️  스키마 불일치 발견         │
│ 🛠️  MCP Server: ✅ 실행 중                   │
│ 🌐 Dashboard: ✅ 실행 중 (포트 3302)          │
│ 📡 APIs: ⚠️  일부 에러 (DevOps 관련)         │
│                                              │
│ 📊 Overall Score: XX/100                     │
│                                              │
│ ✅ Working: XX/34 APIs                       │
│ ⚠️  Issues: XX/34 APIs                       │
│ ❌ Broken: XX/34 APIs                        │
└──────────────────────────────────────────────┘
```

### API 테스트 결과 매트릭스
```
Category          | APIs | Working | Issues | Broken | Score
------------------|------|---------|--------|--------|-------
PRD Management    | 4    | X       | X      | X      | XX%
Task Management   | 5    | X       | X      | X      | XX%
Document Mgmt     | 3    | X       | X      | X      | XX%
Test Management   | 7    | X       | X      | X      | XX%
Project Mgmt      | 6    | X       | X      | X      | XX%
Environment Mgmt  | 4    | X       | X      | X      | XX%
DevOps Mgmt       | 6    | X       | X      | X      | XX%
```

### 대시보드 페이지 테스트 결과
```
Page              | Load | Function | Data | UX  | Issues
------------------|------|----------|------|-----|--------
Home              | ✅   | ✅       | ✅   | ✅  | None
PRDs              | ✅   | ⚠️       | ✅   | ✅  | Minor
Tasks             | ✅   | ✅       | ✅   | ✅  | None
Documents         | ✅   | ✅       | ⚠️   | ✅  | Search slow
Projects          | ✅   | ✅       | ✅   | ✅  | None
Tests             | ⚠️   | ⚠️       | ⚠️   | ✅  | Multiple
Environments      | ❌   | ❌       | ❌   | ✅  | DB error
Operations        | ❌   | ❌       | ❌   | ⚠️  | DB error
Network           | ✅   | ✅       | ⚠️   | ✅  | Performance
Kanban            | ✅   | ✅       | ✅   | ✅  | None
Database          | ✅   | ✅       | ✅   | ✅  | None
```

## 🔧 발견된 문제 해결 계획

### 긴급 수정 필요 (테스트 전)
1. **데이터베이스 스키마 업데이트**
   - `recorded_at` 컬럼 추가
   - `uptime_percentage` 컬럼 추가
   - DevOps 테이블 스키마 정정

2. **API 에러 수정**
   - DevOps 관련 API 스키마 동기화
   - 에러 핸들링 개선

### 중기 개선 계획
1. **성능 최적화**
   - 응답 시간 > 500ms API 최적화
   - 대용량 데이터 페이지네이션

2. **사용성 개선**
   - 에러 메시지 사용자 친화적 개선
   - 로딩 상태 표시 추가

## ✅ 테스트 완료 기준

### Phase 1 완료 기준
- [ ] 34개 API 중 80% 이상 정상 작동
- [ ] 주요 MCP 도구 10개 이상 정상 작동
- [ ] 데이터베이스 스키마 문제 완전 식별

### Phase 2 완료 기준  
- [ ] 11개 페이지 중 8개 이상 정상 로딩
- [ ] 핵심 기능 (PRD, Task, Document) 100% 작동
- [ ] 사용자 워크플로우 테스트 통과

### Phase 3 완료 기준
- [ ] 28개 누락 기능 우선순위 확정
- [ ] P1 기능 구현 계획 수립
- [ ] 위험 요소 및 블로커 식별 완료

### 전체 테스트 성공 기준
- [ ] 시스템 전체 건강도 점수 > 70/100
- [ ] 핵심 워크플로우 영향 없음
- [ ] 누락 기능 구현 로드맵 확정
- [ ] 다음 구현 단계 준비 완료

## 📋 다음 단계 계획

### 즉시 실행 (테스트 완료 후)
1. **긴급 문제 수정**: 데이터베이스 스키마 업데이트
2. **P1 기능 구현 시작**: Document Relations API 구현
3. **지속적 모니터링**: 시스템 상태 정기 체크

### 1주 내 실행
1. **P1 기능 완성**: 14개 누락 기능 구현
2. **통합 테스트**: 새 기능과 기존 기능 호환성 검증
3. **문서화 업데이트**: API 문서 및 사용 가이드

이 테스트 계획을 통해 현재 시스템의 정확한 상태를 파악하고, 가장 효율적인 개발 방향을 결정할 수 있습니다.