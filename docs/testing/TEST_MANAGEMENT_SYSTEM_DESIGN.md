# 테스트 관리 시스템 설계 문서

## 1. 시스템 개요

### 목표
기존 WorkflowMCP 플랫폼의 요구사항 → 설계 → 작업 워크플로우에 테스트 관리를 통합하여 완전한 개발 라이프사이클을 지원

### 핵심 원칙
- 기존 시스템과의 원활한 통합
- 추적성 유지 (Traceability)
- 확장 가능한 아키텍처
- 일관된 사용자 경험

## 2. 데이터베이스 설계

### 2.1 테스트 케이스 테이블 (test_cases)
```sql
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('unit', 'integration', 'system', 'acceptance', 'regression')) DEFAULT 'unit',
  status TEXT CHECK(status IN ('draft', 'ready', 'active', 'deprecated')) DEFAULT 'draft',
  priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  
  -- 연결 관계
  task_id TEXT REFERENCES tasks(id),
  design_id TEXT REFERENCES designs(id),
  prd_id TEXT REFERENCES prds(id),
  
  -- 테스트 상세 정보
  preconditions TEXT,
  test_steps TEXT, -- JSON 형태로 단계별 저장
  expected_result TEXT,
  test_data TEXT, -- JSON 형태로 테스트 데이터 저장
  
  -- 메타데이터
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'system',
  version INTEGER DEFAULT 1,
  tags TEXT, -- JSON 배열 형태
  
  -- 실행 정보
  estimated_duration INTEGER DEFAULT 0, -- 분 단위
  complexity TEXT CHECK(complexity IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  automation_status TEXT CHECK(automation_status IN ('manual', 'automated', 'semi_automated')) DEFAULT 'manual'
);
```

### 2.2 테스트 실행 결과 테이블 (test_executions)
```sql
CREATE TABLE test_executions (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  
  -- 실행 정보
  execution_date TEXT DEFAULT (datetime('now')),
  executed_by TEXT DEFAULT 'system',
  environment TEXT DEFAULT 'development', -- development, staging, production
  
  -- 결과 정보
  status TEXT CHECK(status IN ('pass', 'fail', 'blocked', 'skipped', 'pending')) NOT NULL,
  actual_result TEXT,
  notes TEXT,
  defects_found TEXT, -- JSON 배열 형태로 발견된 결함 ID들
  
  -- 시간 추적
  actual_duration INTEGER, -- 분 단위
  started_at TEXT,
  completed_at TEXT,
  
  -- 첨부 파일 (스크린샷, 로그 등)
  attachments TEXT, -- JSON 배열 형태
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 2.3 결함/이슈 테이블 (test_defects)
```sql
CREATE TABLE test_defects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed', 'deferred')) DEFAULT 'open',
  
  -- 연결 관계
  test_case_id TEXT REFERENCES test_cases(id),
  test_execution_id TEXT REFERENCES test_executions(id),
  related_task_id TEXT REFERENCES tasks(id), -- 수정이 필요한 작업
  
  -- 메타데이터
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'system',
  assigned_to TEXT,
  resolved_at TEXT,
  
  -- 추가 정보
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  workaround TEXT,
  tags TEXT -- JSON 배열
);
```

### 2.4 연결 관계 테이블들
```sql
-- 테스트 케이스 간 의존성
CREATE TABLE test_case_dependencies (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  depends_on_test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  dependency_type TEXT CHECK(dependency_type IN ('prerequisite', 'blocks', 'related')) DEFAULT 'prerequisite',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 테스트 스위트 (테스트 케이스 그룹)
CREATE TABLE test_suites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK(type IN ('smoke', 'regression', 'integration', 'acceptance')) DEFAULT 'regression',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'system'
);

CREATE TABLE test_suite_cases (
  id TEXT PRIMARY KEY,
  test_suite_id TEXT NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
  test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  execution_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## 3. API 설계

### 3.1 테스트 케이스 관리 API
- `GET /api/tests` - 테스트 케이스 목록 조회 (필터링 지원)
- `POST /api/tests` - 새 테스트 케이스 생성
- `GET /api/tests/{id}` - 특정 테스트 케이스 조회
- `PUT /api/tests/{id}` - 테스트 케이스 수정
- `DELETE /api/tests/{id}` - 테스트 케이스 삭제

### 3.2 테스트 실행 API
- `POST /api/tests/{id}/execute` - 테스트 실행 기록
- `GET /api/tests/{id}/executions` - 테스트 실행 히스토리
- `PUT /api/executions/{id}` - 실행 결과 업데이트
- `GET /api/executions/{id}` - 특정 실행 결과 조회

### 3.3 테스트 보고서 API
- `GET /api/tests/reports/summary` - 전체 테스트 요약
- `GET /api/tests/reports/coverage` - 커버리지 리포트
- `GET /api/tests/reports/trends` - 테스트 결과 트렌드

### 3.4 연결 관계 API
- `GET /api/tests/by-task/{taskId}` - 작업별 테스트 케이스
- `GET /api/tests/by-design/{designId}` - 설계별 테스트 케이스
- `POST /api/tests/{id}/link` - 테스트 케이스 연결

## 4. MCP 도구 설계

### 4.1 테스트 케이스 관리 도구
- `create_test_case` - 새 테스트 케이스 생성
- `list_test_cases` - 테스트 케이스 목록 조회
- `get_test_case` - 특정 테스트 케이스 조회
- `update_test_case` - 테스트 케이스 수정
- `delete_test_case` - 테스트 케이스 삭제

### 4.2 테스트 실행 관리 도구
- `execute_test_case` - 테스트 실행 및 결과 기록
- `get_test_executions` - 테스트 실행 히스토리 조회
- `update_test_execution` - 실행 결과 업데이트

### 4.3 보고서 및 분석 도구
- `get_test_summary` - 테스트 요약 보고서
- `get_test_coverage` - 테스트 커버리지 분석
- `get_test_trends` - 테스트 결과 트렌드 분석

### 4.4 연결 관계 도구
- `link_test_to_task` - 테스트 케이스를 작업에 연결
- `get_tests_by_task` - 작업별 테스트 케이스 조회
- `get_task_test_status` - 작업의 테스트 상태 조회

## 5. 웹 인터페이스 설계

### 5.1 페이지 구조
```
/tests
├── /tests (목록 페이지)
├── /tests/new (새 테스트 케이스 생성)
├── /tests/{id} (테스트 케이스 상세보기)
├── /tests/{id}/edit (테스트 케이스 편집)
├── /tests/{id}/execute (테스트 실행)
├── /tests/reports (테스트 보고서)
└── /tests/suites (테스트 스위트 관리)
```

### 5.2 주요 컴포넌트
- `TestCaseList.svelte` - 테스트 케이스 목록 및 필터링
- `TestCaseForm.svelte` - 테스트 케이스 생성/편집 폼
- `TestCaseDetail.svelte` - 테스트 케이스 상세 정보
- `TestExecution.svelte` - 테스트 실행 인터페이스
- `TestReports.svelte` - 테스트 보고서 대시보드
- `TestMetrics.svelte` - 테스트 메트릭 시각화

### 5.3 상태 관리
- 테스트 케이스 상태별 색상 코딩
- 실행 결과 상태 표시
- 진행률 및 커버리지 시각화

## 6. 통합 워크플로우

### 6.1 개발 워크플로우
1. **PRD 생성** → 요구사항 정의
2. **설계 작성** → 기술 설계 문서
3. **작업 생성** → 개발 작업 분할
4. **테스트 케이스 생성** → 각 작업에 대한 테스트 케이스
5. **개발 진행** → 작업 상태 업데이트
6. **테스트 실행** → 테스트 케이스 실행 및 결과 기록
7. **결함 관리** → 발견된 이슈 추적 및 해결
8. **완료 확인** → 모든 테스트 통과 시 작업 완료

### 6.2 추적성 매트릭스
```
PRD → Design → Task → Test Case → Test Execution → Results
 ↓      ↓        ↓        ↓           ↓             ↓
Requirements Coverage Analysis → Quality Metrics
```

## 7. 기술적 구현 방향

### 7.1 백엔드 구조
```
src/
├── models/
│   ├── TestManager.js       # 테스트 케이스 관리
│   ├── TestExecutionManager.js  # 테스트 실행 관리
│   └── TestReportManager.js     # 보고서 생성
├── database/
│   ├── SQLiteTestStorage.js     # 테스트 데이터 저장
│   └── test-schema.sql          # 테스트 스키마
└── api/
    └── tests/                   # 테스트 API 엔드포인트
```

### 7.2 프론트엔드 구조
```
dashboard/src/routes/
├── tests/
│   ├── +page.svelte            # 테스트 목록
│   ├── new/+page.svelte        # 새 테스트 생성
│   ├── [id]/
│   │   ├── +page.svelte        # 테스트 상세보기
│   │   ├── edit/+page.svelte   # 테스트 편집
│   │   └── execute/+page.svelte # 테스트 실행
│   └── reports/+page.svelte    # 테스트 보고서
└── api/tests/                  # API 엔드포인트
```

### 7.3 MCP 통합
```javascript
// MCP 서버 (src/index.js)에 추가할 도구들
const testTools = [
  'create_test_case',
  'list_test_cases', 
  'get_test_case',
  'update_test_case',
  'delete_test_case',
  'execute_test_case',
  'get_test_executions',
  'link_test_to_task',
  'get_test_summary',
  'get_test_coverage'
];
```

## 8. 성능 및 확장성 고려사항

### 8.1 성능 최적화
- 테스트 실행 결과 인덱싱
- 대량 테스트 케이스 처리를 위한 페이지네이션
- 캐싱 전략 (테스트 요약 데이터)

### 8.2 확장성
- 테스트 자동화 도구 연동 준비
- 외부 테스트 도구 통합 인터페이스
- 플러그인 아키텍처 고려

## 9. 구현 우선순위

### Phase 1 (핵심 기능)
1. 데이터베이스 스키마 생성
2. 테스트 케이스 CRUD 기능
3. 기본 웹 인터페이스 (/tests)
4. 작업-테스트 연결 기능

### Phase 2 (실행 및 추적)
1. 테스트 실행 기능
2. 결과 기록 및 히스토리
3. 기본 보고서 기능
4. MCP 도구 완성

### Phase 3 (고도화)
1. 테스트 스위트 관리
2. 결함 추적 시스템
3. 고급 보고서 및 메트릭
4. 자동화 연동 준비

## 10. 보안 고려사항
- 테스트 데이터 보안 (민감 정보 마스킹)
- 실행 권한 관리
- 감사 로그 (테스트 실행 및 결과 변경 이력)