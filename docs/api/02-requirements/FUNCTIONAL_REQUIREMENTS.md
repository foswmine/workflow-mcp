# 🔧 기능 요구사항 - WorkflowMCP Dashboard API

## 🎯 개요

WorkflowMCP 대시보드의 모든 기능을 REST API로 제공하여 MCP 도구와 웹 대시보드 기능을 통합적으로 접근할 수 있도록 합니다.

## 📋 1. PRD 관리 API

### 1.1 PRD CRUD 기능

#### FR-PRD-001: PRD 목록 조회
- **엔드포인트**: `GET /api/prds`
- **기능**: 등록된 모든 PRD 목록을 조회
- **파라미터**: 
  - `status` (선택): 상태별 필터링
  - `project_id` (선택): 프로젝트별 필터링
  - `sort` (선택): 정렬 기준 (created_desc, updated_desc 등)
- **응답**: PRD 목록과 총 개수

#### FR-PRD-002: PRD 생성
- **엔드포인트**: `POST /api/prds`
- **기능**: 새로운 PRD 문서 생성
- **입력**: title, description, requirements, acceptance_criteria, priority, status
- **검증**: 필수 필드 확인, 중복 제목 검사
- **응답**: 생성된 PRD 정보

#### FR-PRD-003: PRD 상세 조회
- **엔드포인트**: `GET /api/prds/{id}`
- **기능**: 특정 PRD의 상세 정보 조회
- **포함**: 연결된 문서, 작업, 프로젝트 정보
- **응답**: PRD 전체 데이터

#### FR-PRD-004: PRD 업데이트
- **엔드포인트**: `PUT /api/prds/{id}`
- **기능**: 기존 PRD 정보 수정
- **부분 업데이트**: PATCH 방식으로 일부 필드만 수정 가능
- **버전 관리**: 수정 시 updated_at 자동 갱신

#### FR-PRD-005: PRD 삭제
- **엔드포인트**: `DELETE /api/prds/{id}`
- **기능**: PRD 삭제 (연결된 데이터 처리)
- **안전장치**: 연결된 작업이 있으면 삭제 불가
- **소프트 삭제**: 실제 삭제 대신 상태 변경 옵션

### 1.2 PRD 문서 연결 기능

#### FR-PRD-006: PRD 문서 연결
- **엔드포인트**: `POST /api/prds/{id}/documents`
- **기능**: PRD에 문서 연결
- **연결 타입**: specification, analysis, notes 등

#### FR-PRD-007: PRD 연결 문서 조회
- **엔드포인트**: `GET /api/prds/{id}/documents`
- **기능**: PRD에 연결된 모든 문서 조회
- **필터링**: 문서 타입별 필터링 가능

## 📝 2. Task 관리 API

### 2.1 Task CRUD 기능

#### FR-TASK-001: Task 목록 조회
- **엔드포인트**: `GET /api/tasks`
- **기능**: 작업 목록 조회
- **파라미터**: status, priority, assignee, project_id
- **정렬**: 생성일, 우선순위, 마감일 등
- **페이징**: limit, offset 지원

#### FR-TASK-002: Task 생성
- **엔드포인트**: `POST /api/tasks`
- **기능**: 새 작업 생성
- **입력**: title, description, priority, assignee, due_date
- **자동 ID**: 고유 ID 자동 생성

#### FR-TASK-003: Task 상세 조회
- **엔드포인트**: `GET /api/tasks/{id}`
- **기능**: 작업 상세 정보
- **포함**: 의존성, 연결된 문서, 테스트 케이스

#### FR-TASK-004: Task 업데이트
- **엔드포인트**: `PUT /api/tasks/{id}`
- **기능**: 작업 정보 수정
- **상태 변경**: pending → in_progress → done
- **진행률**: estimated_hours, actual_hours 추적

#### FR-TASK-005: Task 삭제
- **엔드포인트**: `DELETE /api/tasks/{id}`
- **기능**: 작업 삭제
- **의존성 확인**: 다른 작업이 의존하는 경우 삭제 불가

### 2.2 Task 의존성 관리

#### FR-TASK-006: 의존성 추가
- **엔드포인트**: `POST /api/tasks/{id}/dependencies`
- **기능**: 작업 간 의존성 생성
- **순환 의존성 검사**: 무한 루프 방지

#### FR-TASK-007: 의존성 조회
- **엔드포인트**: `GET /api/tasks/{id}/dependencies`
- **기능**: 작업의 의존성 그래프 조회
- **방향**: 의존하는 작업, 의존받는 작업 모두 제공

#### FR-TASK-008: 의존성 삭제
- **엔드포인트**: `DELETE /api/tasks/{id}/dependencies/{dep_id}`
- **기능**: 특정 의존성 관계 제거

## 📄 3. Document 관리 API

### 3.1 Document CRUD 기능

#### FR-DOC-001: Document 목록 조회
- **엔드포인트**: `GET /api/documents`
- **기능**: 문서 목록 조회
- **파라미터**: doc_type, category, status, tags
- **검색**: 제목, 내용 전문 검색 지원

#### FR-DOC-002: Document 생성
- **엔드포인트**: `POST /api/documents`
- **기능**: 새 문서 생성
- **입력**: title, content, doc_type, category, tags
- **자동 인덱싱**: FTS 검색 인덱스 자동 생성

#### FR-DOC-003: Document 상세 조회
- **엔드포인트**: `GET /api/documents/{id}`
- **기능**: 문서 상세 정보
- **포함**: 전체 내용, 메타데이터, 연결 정보

#### FR-DOC-004: Document 업데이트
- **엔드포인트**: `PUT /api/documents/{id}`
- **기능**: 문서 수정
- **버전 관리**: 수정 이력 추적
- **재인덱싱**: 내용 변경 시 검색 인덱스 업데이트

#### FR-DOC-005: Document 삭제
- **엔드포인트**: `DELETE /api/documents/{id}`
- **기능**: 문서 삭제
- **연결 확인**: 다른 엔티티와의 연결 관계 정리

### 3.2 Document 검색 기능

#### FR-DOC-006: 전문 검색
- **엔드포인트**: `GET /api/documents/search`
- **기능**: 문서 내용 전문 검색
- **파라미터**: query, doc_type, category, limit
- **하이라이팅**: 검색어 강조 표시

#### FR-DOC-007: 태그 기반 검색
- **엔드포인트**: `GET /api/documents/tags/{tag}`
- **기능**: 특정 태그의 문서 조회
- **관련 태그**: 함께 사용되는 태그 추천

## 🔗 4. 연결 관리 API

### 4.1 엔티티 연결 기능

#### FR-CONN-001: 연결 생성
- **엔드포인트**: `POST /api/connections`
- **기능**: 엔티티 간 연결 생성 (PRD-Task, Task-Document 등)
- **연결 타입**: related, dependent, blocking, reference

#### FR-CONN-002: 연결 조회
- **엔드포인트**: `GET /api/connections`
- **기능**: 모든 연결 관계 조회
- **필터링**: 엔티티 타입, 연결 타입별 필터링

#### FR-CONN-003: 연결 삭제
- **엔드포인트**: `DELETE /api/connections/{id}`
- **기능**: 연결 관계 제거

## 📊 5. 대시보드 데이터 API

### 5.1 프로젝트 대시보드

#### FR-DASH-001: 프로젝트 개요
- **엔드포인트**: `GET /api/projects/{id}/dashboard`
- **기능**: 프로젝트 전체 개요 데이터
- **포함**: 진행률, 작업 현황, 최근 활동

#### FR-DASH-002: 진행률 타임라인
- **엔드포인트**: `GET /api/projects/{id}/timeline`
- **기능**: 프로젝트 진행률 시계열 데이터
- **기간**: 일별, 주별, 월별 집계

#### FR-DASH-003: 작업 통계
- **엔드포인트**: `GET /api/projects/{id}/task-stats`
- **기능**: 작업 상태별 통계
- **차트 데이터**: 파이차트, 막대차트용 데이터

### 5.2 전체 시스템 대시보드

#### FR-DASH-004: 시스템 개요
- **엔드포인트**: `GET /api/dashboard/overview`
- **기능**: 전체 시스템 현황
- **포함**: 총 PRD/Task/Document 수, 최근 활동

#### FR-DASH-005: 활동 피드
- **엔드포인트**: `GET /api/dashboard/activities`
- **기능**: 최근 활동 피드
- **실시간**: SSE를 통한 실시간 업데이트

## 🔄 6. 배치 작업 API

### 6.1 일괄 처리 기능

#### FR-BATCH-001: 일괄 PRD 처리
- **엔드포인트**: `POST /api/batch/prds`
- **기능**: 여러 PRD 일괄 생성/업데이트
- **트랜잭션**: 전체 성공 또는 전체 실패

#### FR-BATCH-002: 일괄 Task 처리
- **엔드포인트**: `POST /api/batch/tasks`
- **기능**: 여러 작업 일괄 처리
- **의존성**: 일괄 의존성 설정 지원

#### FR-BATCH-003: 일괄 Document 처리
- **엔드포인트**: `POST /api/batch/documents`
- **기능**: 여러 문서 일괄 처리
- **인덱싱**: 일괄 검색 인덱스 업데이트

## 🔔 7. 실시간 업데이트 API

### 7.1 Server-Sent Events

#### FR-SSE-001: 실시간 이벤트 스트림
- **엔드포인트**: `GET /api/events/stream`
- **기능**: 실시간 데이터 변경 알림
- **이벤트 타입**: create, update, delete

#### FR-SSE-002: 이벤트 필터링
- **파라미터**: entity_type, project_id
- **기능**: 특정 엔티티나 프로젝트의 이벤트만 수신

## ⚡ 8. 성능 최적화 기능

### 8.1 캐싱

#### FR-CACHE-001: 응답 캐싱
- **대상**: 자주 조회되는 데이터 (목록, 통계)
- **무효화**: 데이터 변경 시 자동 캐시 무효화

#### FR-CACHE-002: 쿼리 최적화
- **기능**: 복잡한 조인 쿼리 최적화
- **인덱싱**: 자주 사용되는 검색 조건 인덱싱

### 8.2 페이지네이션

#### FR-PAGE-001: 커서 기반 페이징
- **모든 목록 API**: cursor, limit 파라미터 지원
- **성능**: 대용량 데이터에서도 일정한 성능

## 🔍 9. 검색 및 필터링

### 9.1 고급 검색

#### FR-SEARCH-001: 복합 검색
- **기능**: 여러 조건을 조합한 검색
- **연산자**: AND, OR, NOT 지원

#### FR-SEARCH-002: 정렬 옵션
- **다중 정렬**: 여러 필드 조합 정렬
- **사용자 정의**: 사용자 정의 정렬 기준 저장

## 📋 10. 데이터 검증 및 무결성

### 10.1 입력 검증

#### FR-VALID-001: 스키마 검증
- **모든 입력**: JSON 스키마 기반 검증
- **타입 검사**: 데이터 타입 및 형식 검증

#### FR-VALID-002: 비즈니스 규칙 검증
- **의존성**: 순환 의존성 방지
- **상태 전이**: 유효한 상태 변경만 허용

### 10.2 데이터 무결성

#### FR-INTEG-001: 참조 무결성
- **외래키**: 참조 무결성 검사
- **카스케이드**: 연결된 데이터의 일관성 유지

---

**작성일**: 2025-09-11  
**작성자**: 요구사항 분석가 (Claude Code)  
**검토자**: 시스템 설계자  
**버전**: 1.0  
**상태**: 상세 설계 대기