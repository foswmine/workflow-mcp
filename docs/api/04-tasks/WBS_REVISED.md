# Work Breakdown Structure (WBS) - 수정판
# WorkflowMCP Dashboard API 완성 및 확장

## 📋 프로젝트 개요

**프로젝트명**: WorkflowMCP Dashboard API 완성 및 자기설명적 API 구현  
**목적**: 기존 34개 SvelteKit API를 보강하고, 누락된 28개 MCP 도구를 API로 추가하여 완전한 REST API 제공  
**핵심 제약**: 기존 API 변경 금지, 확장 및 보강만 허용  
**새로운 발견**: 이미 58개 중 30개의 MCP 도구가 SvelteKit API로 구현됨

## 🚨 현황 분석 결과

### ✅ 이미 구현된 기능 (30개 MCP 도구 → 34개 API)
- **PRD Management**: 완전 구현 (4/4)
- **Design Management**: 완전 구현 (5/5) 
- **Task Management**: 완전 구현 (5/5)
- **Test Management**: 대부분 구현 (7/10)
- **Project Management**: 대부분 구현 (5/6)
- **Document Management**: 기본 구현 (5/13)
- **Environment Management**: 대부분 구현 (3/4)
- **DevOps Management**: 기본 구현 (6/6)

### ❌ 누락된 기능 (28개 MCP 도구)
- **Document Relations**: 8개 도구 (연결, PRD 문서 등)
- **Test Analysis**: 3개 도구 (요약, 커버리지, 연결)
- **Connection Management**: 6개 도구 (태스크/테스트 연결)
- **Analytics**: 2개 도구 (프로젝트 분석, 환경 상태)
- **System Health**: 3개 도구 (인시던트, 시스템 상태)
- **기타**: 6개 도구

## 🏗️ 수정된 작업 계획

## 1단계: 기존 API 분석 및 Gap 식별 (5시간)

### 1.1 기존 API 상세 분석 (2시간)

#### 1.1.1 API 응답 형식 분석 (1시간)
- [ ] 기존 34개 API 엔드포인트 응답 구조 분석
- [ ] Manager vs 직접 DB 접근 패턴 파악
- [ ] 에러 처리 방식 표준화 현황 확인

**산출물**: 
- `docs/api/existing-api-analysis.md`
- API 응답 형식 표준안

#### 1.1.2 MCP vs API 완전 매핑 (1시간)
- [ ] 58개 MCP 도구와 34개 API의 정확한 매핑표 작성
- [ ] 누락된 기능별 우선순위 결정
- [ ] 기존 API와 겹치는 부분 식별

**산출물**: 
- `docs/api/mcp-api-mapping.md`
- 구현 우선순위 매트릭스

### 1.2 누락 기능 Gap Analysis (2시간)

#### 1.2.1 Document Relations 분석 (1시간)
- [ ] `link_document`, `create_prd_document` 등 8개 도구 분석
- [ ] 기존 Documents API와 통합 방안 설계
- [ ] PRD-Document 연결 기능 설계

**산출물**: 
- `dashboard/src/routes/api/documents/link/+server.js` 설계
- `dashboard/src/routes/api/prds/[id]/documents/+server.js` 설계

#### 1.2.2 Connection Management 분석 (1시간)
- [ ] Task-Test 연결, Task 관계 등 6개 도구 분석
- [ ] 기존 `/api/tasks/[id]/connections` 확장 방안
- [ ] 네트워크 시각화 데이터 API 설계

**산출물**: 
- Connection API 확장 설계서
- 네트워크 데이터 형식 정의

### 1.3 기존 코드 호환성 검증 (1시간)

#### 1.3.1 Manager 클래스 메서드 조사 (0.5시간)
- [ ] 각 Manager 클래스의 public 메서드 목록 작성
- [ ] MCP 도구와 Manager 메서드 매핑 확인
- [ ] 누락된 기능에 필요한 새 메서드 식별

**산출물**: 
- Manager 클래스 메서드 매트릭스
- 필요한 새 메서드 목록

#### 1.3.2 데이터베이스 스키마 확인 (0.5시간)
- [ ] 현재 SQLite 스키마 분석
- [ ] 누락 기능 구현에 필요한 테이블/컬럼 확인
- [ ] API 메타데이터용 확장 테이블 설계

**산출물**: 
- 현재 스키마 문서
- 필요한 스키마 확장안

## 2단계: 누락 기능 구현 (SvelteKit API 확장) (12시간)

### 2.1 Document Relations API (4시간)

#### 2.1.1 Document Linking API (2시간)
- [ ] `POST /api/documents/[id]/link` - 문서 연결
- [ ] `GET /api/documents/[id]/links` - 연결 조회
- [ ] `DELETE /api/documents/[id]/link/[linkId]` - 연결 해제

**산출물**: 
- `dashboard/src/routes/api/documents/[id]/link/+server.js`
- `dashboard/src/routes/api/documents/[id]/links/+server.js`

#### 2.1.2 PRD Document API (2시간)
- [ ] `POST /api/prds/[id]/documents` - PRD 문서 생성
- [ ] `GET /api/prds/[id]/documents` - PRD 문서 목록
- [ ] `GET /api/prds/[id]/documents/search` - PRD 내 문서 검색
- [ ] `PUT /api/documents/[id]/prd` - PRD 문서 업데이트

**산출물**: 
- `dashboard/src/routes/api/prds/[id]/documents/+server.js`
- `dashboard/src/routes/api/prds/[id]/documents/search/+server.js`

### 2.2 Test Analysis API (3시간)

#### 2.2.1 Test Summary & Coverage (1.5시간)
- [ ] `GET /api/test-summary` - 전체 테스트 요약
- [ ] `GET /api/test-coverage` - 테스트 커버리지 분석
- [ ] `GET /api/test-coverage/[projectId]` - 프로젝트별 커버리지

**산출물**: 
- `dashboard/src/routes/api/test-summary/+server.js`
- `dashboard/src/routes/api/test-coverage/+server.js`

#### 2.2.2 Test-Task Connection (1.5시간)
- [ ] `GET /api/test-cases/[id]/connections` - 테스트 연결 조회
- [ ] `POST /api/test-cases/[id]/connections` - 테스트 연결 추가
- [ ] `DELETE /api/test-cases/[id]/connections/[connId]` - 연결 제거

**산출물**: 
- `dashboard/src/routes/api/test-cases/[id]/connections/+server.js`

### 2.3 Enhanced Connection Management (3시간)

#### 2.3.1 Task Connection Enhancement (1.5시간)
- [ ] 기존 `/api/tasks/[id]/connections` 확장
- [ ] `POST /api/tasks/[id]/connections/batch` - 대량 연결 추가
- [ ] `GET /api/connections/network` - 전체 네트워크 데이터

**산출물**: 
- 기존 connections API 확장
- `dashboard/src/routes/api/connections/network/+server.js`

#### 2.3.2 Cross-Entity Connections (1.5시간)
- [ ] `GET /api/entities/[type]/[id]/connections` - 범용 연결 조회
- [ ] `POST /api/entities/[type]/[id]/connections` - 범용 연결 생성
- [ ] `GET /api/relationships/matrix` - 관계 매트릭스 데이터

**산출물**: 
- `dashboard/src/routes/api/entities/[type]/[id]/connections/+server.js`
- `dashboard/src/routes/api/relationships/matrix/+server.js`

### 2.4 Analytics & Status API (2시간)

#### 2.4.1 Project Analytics Enhancement (1시간)
- [ ] `GET /api/projects/[id]/analytics` - 기존 기능 확장
- [ ] `GET /api/projects/[id]/timeline` - 프로젝트 타임라인
- [ ] `GET /api/projects/[id]/metrics` - 상세 메트릭

**산출물**: 
- 기존 analytics API 확장
- 새로운 timeline, metrics 엔드포인트

#### 2.4.2 Environment Status (1시간)
- [ ] `GET /api/environments/[id]/status` - 환경 상태 상세
- [ ] `GET /api/environments/[id]/health` - 헬스체크
- [ ] `POST /api/environments/[id]/healthcheck` - 헬스체크 실행

**산출물**: 
- 기존 environment API 확장
- 헬스체크 기능 추가

## 3단계: 자기설명적 API 시스템 (Express.js) (8시간)

### 3.1 Discovery & Help API 서버 (4시간)

#### 3.1.1 Express API 서버 기반 구조 (2시간)
- [ ] Express.js API 서버 설정 (`src/api-server.js`)
- [ ] SvelteKit API와 통합을 위한 프록시 설정
- [ ] CORS, 보안 헤더 등 기본 미들웨어 구성

**산출물**: 
- `src/api-server.js`
- `src/middleware/proxy-middleware.js`

#### 3.1.2 Discovery API 구현 (2시간)
- [ ] `GET /api` - 전체 API 디스커버리 루트
- [ ] `GET /api/endpoints` - 모든 엔드포인트 목록
- [ ] `GET /api/categories` - 카테고리별 API 그룹핑
- [ ] `GET /api/schema` - API 스키마 정보

**산출물**: 
- `src/routes/discovery.js`
- `src/services/DiscoveryService.js`

### 3.2 Help System 구현 (4시간)

#### 3.2.1 Help Database & Content (2시간)
- [ ] Help 컨텐츠용 SQLite 테이블 생성
- [ ] 카테고리별 도움말 컨텐츠 작성
- [ ] 동적 예제 생성 시스템 구현

**산출물**: 
- `src/database/help-schema.sql`
- `src/services/HelpContentService.js`
- 도움말 컨텐츠 데이터

#### 3.2.2 Interactive Help API (2시간)
- [ ] `GET /api/help` - 도움말 시스템 루트
- [ ] `GET /api/help/[category]` - 카테고리별 도움말
- [ ] `GET /api/help/[category]/examples` - 실행 가능한 예제
- [ ] `GET /api/help/search` - 도움말 검색

**산출물**: 
- `src/routes/help.js`
- `src/services/HelpService.js`
- Interactive help system

## 4단계: API 통합 및 개선 (6시간)

### 4.1 HATEOAS 링크 시스템 (3시간)

#### 4.1.1 Response Enhancement Middleware (1.5시간)
- [ ] 기존 SvelteKit API 응답에 HATEOAS 링크 자동 추가
- [ ] 리소스 간 관계 링크 생성 시스템
- [ ] 동적 링크 생성 유틸리티

**산출물**: 
- `dashboard/src/lib/middleware/hateoas-middleware.js`
- `src/utils/link-builder.js`

#### 4.1.2 Navigation Links (1.5시간)
- [ ] 각 API 응답에 관련 리소스 링크 추가
- [ ] 페이지네이션 링크 자동 생성
- [ ] 액션 링크 (편집, 삭제 등) 추가

**산출물**: 
- Enhanced API responses with navigation
- Link schema definition

### 4.2 API 표준화 및 문서화 (3시간)

#### 4.2.1 Response Format Standardization (1.5시간)
- [ ] 모든 API 응답 형식 통일
- [ ] 에러 응답 표준화
- [ ] 성공 응답 메타데이터 추가

**산출물**: 
- API 응답 표준 스키마
- 에러 처리 표준화

#### 4.2.2 OpenAPI Documentation (1.5시간)
- [ ] 기존 + 신규 API의 OpenAPI 3.0 스펙 생성
- [ ] Swagger UI 통합
- [ ] API 문서 자동 업데이트 시스템

**산출물**: 
- `docs/openapi.yaml`
- Swagger UI integration

## 5단계: 실시간 기능 및 최종 통합 (4시간)

### 5.1 Server-Sent Events (2시간)

#### 5.1.1 SSE 기본 구조 (1시간)
- [ ] SvelteKit에 SSE 엔드포인트 추가
- [ ] 데이터 변경 이벤트 브로드캐스팅
- [ ] 클라이언트 연결 관리

**산출물**: 
- `dashboard/src/routes/api/stream/+server.js`
- SSE event broadcasting system

#### 5.1.2 실시간 알림 (1시간)
- [ ] PRD/Task/Test 상태 변경 알림
- [ ] 프로젝트 진행률 실시간 업데이트
- [ ] 시스템 상태 모니터링 알림

**산출물**: 
- Real-time notification system
- Event management utilities

### 5.2 대시보드 통합 (2시간)

#### 5.2.1 API 콘솔 페이지 (1시간)
- [ ] 대시보드에 API 테스트 콘솔 페이지 추가
- [ ] 인터랙티브 API 탐색 도구 구현
- [ ] 예제 실행 및 결과 확인 기능

**산출물**: 
- `dashboard/src/routes/api-console/+page.svelte`
- Interactive API explorer

#### 5.2.2 API 모니터링 (1시간)
- [ ] API 사용량 통계 페이지
- [ ] 응답 시간 모니터링
- [ ] 에러율 추적 및 알림

**산출물**: 
- `dashboard/src/routes/api-stats/+page.svelte`
- API monitoring dashboard

## 📈 총 작업 추정 (수정)

### 총 시간: **35시간** (기존 55시간에서 20시간 단축)

| 단계 | 작업시간 | 누적시간 | 변경사유 |
|------|----------|----------|----------|
| 1단계: 기존 API 분석 | 5시간 | 5시간 | 신규: 현황 파악 필수 |
| 2단계: 누락 기능 구현 | 12시간 | 17시간 | 대폭 단축: 기존 구조 활용 |
| 3단계: 자기설명적 API | 8시간 | 25시간 | 단축: 핵심 기능만 |
| 4단계: 통합 및 개선 | 6시간 | 31시간 | 단축: 표준화 중심 |
| 5단계: 실시간 기능 | 4시간 | 35시간 | 단축: 기본 기능만 |

### 우선순위별 분류 (수정)

#### 🔴 High Priority (MVP) - 17시간
- 1단계: 기존 API 분석 (5시간) - **필수**
- 2단계: 누락 기능 구현 (12시간) - **핵심**

#### 🟡 Medium Priority - 14시간
- 3단계: 자기설명적 API (8시간) - **사용성**
- 4단계: 통합 및 개선 (6시간) - **품질**

#### 🟢 Low Priority - 4시간
- 5단계: 실시간 기능 (4시간) - **부가**

## 🎯 수정된 마일스톤

### Milestone 1: 현황 파악 및 핵심 기능 완성 (1주) - 17시간
- 기존 API 완전 분석
- 누락된 28개 MCP 도구 API 구현
- 기본 테스트 및 검증

### Milestone 2: 자기설명적 API 완성 (2주) - 31시간  
- Discovery & Help API 시스템
- HATEOAS 링크 시스템
- API 표준화 및 문서화

### Milestone 3: 완전한 솔루션 (3주) - 35시간
- 실시간 업데이트 기능
- 대시보드 API 콘솔 통합
- 모니터링 및 운영 도구

## ✅ 수정된 성공 기준

1. **기능 요구사항**
   - [ ] 58개 MCP 도구 중 누락된 28개의 API 구현 완료
   - [ ] 기존 34개 API와의 완전한 호환성 유지
   - [ ] 자기설명적 API로 세션에서 쉬운 탐색 가능

2. **비기능 요구사항**  
   - [ ] API 응답 시간 < 500ms (95percentile) 
   - [ ] 기존 대시보드 기능 영향 < 5%
   - [ ] 100% 기존 API 호환성 유지

3. **사용성 요구사항**
   - [ ] 새 세션에서 5분 내 API 사용법 학습 가능
   - [ ] Claude Code에서 바로 활용 가능한 Discovery API
   - [ ] 완전한 API 문서화 및 인터랙티브 콘솔

## 🔍 핵심 변경사항

1. **⚡ 20시간 단축**: 기존 API 활용으로 중복 작업 제거
2. **🎯 명확한 범위**: 28개 누락 기능에 집중
3. **🔄 실용적 접근**: SvelteKit API 확장 + Express 보완
4. **📊 현실적 일정**: 3주에서 완성 가능한 계획
5. **✅ 검증된 기반**: 이미 작동하는 34개 API 기반 확장