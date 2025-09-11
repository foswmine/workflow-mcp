# Work Breakdown Structure (WBS) - 수정판
# WorkflowMCP Dashboard API 완성 및 확장

## 📋 프로젝트 개요

**프로젝트명**: WorkflowMCP Dashboard API 완성 및 자기설명적 API 구현  
**목적**: 기존 34개 SvelteKit API를 보강하고, 누락된 28개 MCP 도구를 API로 추가하여 완전한 REST API 제공  
**핵심 제약**: 기존 API 변경 금지, 확장 및 보강만 허용  
**새로운 발견**: 이미 58개 중 30개의 MCP 도구가 SvelteKit API로 구현됨

## 🏗️ 1단계: 기반 구조 (Foundation Layer)

### 1.1 프로젝트 셋업 (4시간)

#### 1.1.1 API 서버 기본 구조 (2시간)
- [ ] API 서버 엔트리 포인트 생성 (`src/api-server.js`)
- [ ] Express.js 기본 설정 및 미들웨어 구성
- [ ] CORS, 보안 헤더, 압축 설정
- [ ] 환경 변수 및 설정 파일 구성

**산출물**: 
- `src/api-server.js` 
- `src/config/api-config.js`

#### 1.1.2 라우터 구조 설계 (1시간)
- [ ] API 라우터 기본 구조 생성 (`src/routes/`)
- [ ] 버전 관리 라우터 설정 (`/api/v1`, `/api/v2`)
- [ ] 에러 핸들링 미들웨어 구현
- [ ] 요청/응답 로깅 미들웨어

**산출물**: 
- `src/routes/index.js`
- `src/routes/v1/index.js` 
- `src/middleware/error-handler.js`
- `src/middleware/logger.js`

#### 1.1.3 Service Layer 아키텍처 (1시간)
- [ ] 기존 MCP Manager 래퍼 클래스 설계
- [ ] Service Layer 기본 인터페이스 정의
- [ ] 의존성 주입 컨테이너 구성

**산출물**: 
- `src/services/BaseService.js`
- `src/services/ServiceContainer.js`

### 1.2 데이터베이스 확장 (3시간)

#### 1.2.1 API 메타데이터 스키마 (1.5시간)
- [ ] API 스키마 테이블 생성 (`api_schemas`)
- [ ] API 예제 테이블 생성 (`api_examples`)
- [ ] API 도움말 테이블 생성 (`api_help_content`)
- [ ] 스키마 마이그레이션 스크립트 작성

**산출물**: 
- `src/database/migrations/003-api-metadata.sql`
- `src/database/api-schema-setup.js`

#### 1.2.2 API 사용 통계 테이블 (1시간)
- [ ] API 호출 로그 테이블 (`api_call_logs`)
- [ ] API 사용량 집계 테이블 (`api_usage_stats`)
- [ ] 속도 제한 테이블 (`api_rate_limits`)

**산출물**: 
- `src/database/migrations/004-api-stats.sql`

#### 1.2.3 인덱스 최적화 (0.5시간)
- [ ] API 성능을 위한 추가 인덱스 생성
- [ ] 기존 인덱스 영향도 분석 및 문서화

**산출물**: 
- `src/database/migrations/005-api-indexes.sql`

## 🔧 2단계: 핵심 API 구현 (Core API Layer)

### 2.1 PRD Management API (6시간)

#### 2.1.1 PRD Service Wrapper (2시간)
- [ ] `PRDServiceWrapper` 클래스 구현
- [ ] 기존 `PRDManager` 래핑 및 API 호환 형태로 변환
- [ ] 입력 검증 및 에러 핸들링

**산출물**: 
- `src/services/PRDService.js`
- `src/validators/prd-validators.js`

#### 2.1.2 PRD REST 엔드포인트 (3시간)
- [ ] `GET /api/prds` - PRD 목록 조회 (페이징, 필터링)
- [ ] `POST /api/prds` - PRD 생성
- [ ] `GET /api/prds/:id` - PRD 상세 조회
- [ ] `PUT /api/prds/:id` - PRD 업데이트
- [ ] `DELETE /api/prds/:id` - PRD 삭제

**산출물**: 
- `src/routes/v1/prds.js`

#### 2.1.3 PRD 관계 API (1시간)
- [ ] `GET /api/prds/:id/tasks` - PRD 연관 태스크
- [ ] `GET /api/prds/:id/documents` - PRD 연관 문서
- [ ] `POST /api/prds/:id/links` - PRD 링크 생성

**산출물**: 
- `src/routes/v1/prd-relations.js`

### 2.2 Task Management API (6시간)

#### 2.2.1 Task Service Wrapper (2시간)
- [ ] `TaskServiceWrapper` 클래스 구현
- [ ] 기존 `TaskManager` 래핑
- [ ] 의존성 관리 API 호환 처리

**산출물**: 
- `src/services/TaskService.js`
- `src/validators/task-validators.js`

#### 2.2.2 Task REST 엔드포인트 (3시간)
- [ ] `GET /api/tasks` - 태스크 목록 (상태별, 담당자별 필터)
- [ ] `POST /api/tasks` - 태스크 생성
- [ ] `GET /api/tasks/:id` - 태스크 상세
- [ ] `PUT /api/tasks/:id` - 태스크 업데이트
- [ ] `PATCH /api/tasks/:id/status` - 상태 변경

**산출물**: 
- `src/routes/v1/tasks.js`

#### 2.2.3 Task 의존성 API (1시간)
- [ ] `GET /api/tasks/:id/dependencies` - 의존성 조회
- [ ] `POST /api/tasks/:id/dependencies` - 의존성 추가
- [ ] `DELETE /api/tasks/:id/dependencies/:depId` - 의존성 제거

**산출물**: 
- `src/routes/v1/task-dependencies.js`

### 2.3 Document Management API (6시간)

#### 2.3.1 Document Service Wrapper (2시간)
- [ ] `DocumentServiceWrapper` 클래스 구현
- [ ] 기존 `DocumentManager` 래핑
- [ ] 전문 검색 API 통합

**산출물**: 
- `src/services/DocumentService.js`
- `src/validators/document-validators.js`

#### 2.3.2 Document REST 엔드포인트 (3시간)
- [ ] `GET /api/documents` - 문서 목록 및 검색
- [ ] `POST /api/documents` - 문서 생성
- [ ] `GET /api/documents/:id` - 문서 상세
- [ ] `PUT /api/documents/:id` - 문서 업데이트
- [ ] `DELETE /api/documents/:id` - 문서 삭제

**산출물**: 
- `src/routes/v1/documents.js`

#### 2.3.3 Document 검색 및 분류 API (1시간)
- [ ] `GET /api/documents/search` - 전문 검색
- [ ] `GET /api/documents/categories` - 카테고리 목록
- [ ] `GET /api/documents/tags` - 태그 목록

**산출물**: 
- `src/routes/v1/document-search.js`

## 🤖 3단계: 자기설명적 API (Self-Descriptive Layer)

### 3.1 Discovery API (4시간)

#### 3.1.1 API 탐색 엔드포인트 (2시간)
- [ ] `GET /api` - API 루트 디스커버리
- [ ] `GET /api/endpoints` - 모든 엔드포인트 목록
- [ ] `GET /api/schema` - API 스키마 정보

**산출물**: 
- `src/routes/discovery.js`
- `src/services/DiscoveryService.js`

#### 3.1.2 HATEOAS 링크 생성 (2시간)
- [ ] 응답 객체에 네비게이션 링크 자동 추가
- [ ] 리소스 간 관계 링크 생성
- [ ] 동적 링크 생성 유틸리티

**산출물**: 
- `src/utils/hateoas-builder.js`
- `src/middleware/hateoas-middleware.js`

### 3.2 Help API System (5시간)

#### 3.2.1 Help 컨텐츠 관리 (2시간)
- [ ] 데이터베이스 기반 도움말 시스템
- [ ] 도움말 컨텐츠 CRUD API
- [ ] 컨텍스트별 도움말 생성

**산출물**: 
- `src/services/HelpService.js`
- `src/routes/v1/help.js`

#### 3.2.2 카테고리별 Help API (2시간)
- [ ] `GET /api/help/prds` - PRD 관리 도움말
- [ ] `GET /api/help/tasks` - 태스크 관리 도움말
- [ ] `GET /api/help/documents` - 문서 관리 도움말
- [ ] `GET /api/help/search` - 검색 기능 도움말

**산출물**: 
- `src/routes/help-categories.js`

#### 3.2.3 인터랙티브 예제 생성 (1시간)
- [ ] API 호출 예제 자동 생성
- [ ] 실행 가능한 예제 코드 제공
- [ ] 다국어 예제 지원 (영어/한국어)

**산출물**: 
- `src/utils/example-generator.js`

## 📊 4단계: 실시간 기능 (Real-time Layer)

### 4.1 Server-Sent Events (3시간)

#### 4.1.1 SSE 기본 구조 (1.5시간)
- [ ] SSE 미들웨어 구현
- [ ] 클라이언트 연결 관리
- [ ] 이벤트 브로드캐스팅 시스템

**산출물**: 
- `src/middleware/sse-middleware.js`
- `src/services/EventBroadcaster.js`

#### 4.1.2 실시간 업데이트 이벤트 (1.5시간)
- [ ] `GET /api/stream/prds` - PRD 변경 실시간 알림
- [ ] `GET /api/stream/tasks` - 태스크 상태 변경 알림
- [ ] `GET /api/stream/progress` - 프로젝트 진행 상황 알림

**산출물**: 
- `src/routes/v1/stream.js`

### 4.2 대시보드 통합 (2시간)

#### 4.2.1 대시보드 API 연동 (1시간)
- [ ] 기존 대시보드 페이지에 API 호출 추가
- [ ] 실시간 업데이트 이벤트 리스너 구현

**산출물**: 
- `dashboard/src/lib/api-client.js`

#### 4.2.2 API 콘솔 페이지 (1시간)
- [ ] API 테스트 콘솔 페이지 생성
- [ ] 인터랙티브 API 탐색 인터페이스

**산출물**: 
- `dashboard/src/routes/api-console/+page.svelte`

## 📝 5단계: 문서화 및 도구 (Documentation & Tools)

### 5.1 OpenAPI 문서화 (3시간)

#### 5.1.1 Swagger 설정 (1시간)
- [ ] OpenAPI 3.0 스펙 정의
- [ ] Swagger UI 통합
- [ ] API 스키마 자동 생성

**산출물**: 
- `src/docs/openapi.yaml`
- `src/routes/docs.js`

#### 5.1.2 API 문서 자동화 (2시간)
- [ ] JSDoc에서 OpenAPI 스펙 자동 생성
- [ ] 예제 코드 자동 삽입
- [ ] 문서 유효성 검증

**산출물**: 
- `src/utils/docs-generator.js`
- `scripts/generate-docs.js`

### 5.2 테스트 도구 (2시간)

#### 5.2.1 API 테스트 스위트 (1시간)
- [ ] Jest + Supertest 테스트 환경 구성
- [ ] 각 엔드포인트별 기본 테스트 케이스

**산출물**: 
- `tests/api/prds.test.js`
- `tests/api/tasks.test.js`
- `tests/api/documents.test.js`

#### 5.2.2 호환성 테스트 (1시간)
- [ ] 기존 MCP 도구 영향도 테스트
- [ ] 대시보드 기능 회귀 테스트

**산출물**: 
- `tests/compatibility/mcp-compatibility.test.js`
- `tests/compatibility/dashboard-compatibility.test.js`

## 🔧 6단계: 성능 및 보안 (Performance & Security)

### 6.1 성능 최적화 (4시간)

#### 6.1.1 캐싱 시스템 (2시간)
- [ ] Redis 또는 메모리 캐싱 구현
- [ ] ETag 기반 조건부 요청 지원
- [ ] API 응답 캐시 전략

**산출물**: 
- `src/middleware/cache-middleware.js`
- `src/services/CacheService.js`

#### 6.1.2 데이터베이스 쿼리 최적화 (1시간)
- [ ] N+1 쿼리 문제 해결
- [ ] 배치 쿼리 최적화
- [ ] 인덱스 성능 검증

**산출물**: 
- `src/utils/query-optimizer.js`

#### 6.1.3 API 속도 제한 (1시간)
- [ ] Rate limiting 미들웨어 구현
- [ ] 사용자별/IP별 제한 설정
- [ ] 제한 정보 헤더 제공

**산출물**: 
- `src/middleware/rate-limit.js`

### 6.2 보안 강화 (3시간)

#### 6.2.1 입력 검증 및 살균 (1.5시간)
- [ ] Joi 스키마 기반 입력 검증 강화
- [ ] SQL Injection 방지
- [ ] XSS 방지 처리

**산출물**: 
- `src/middleware/security-middleware.js`
- `src/validators/security-validators.js`

#### 6.2.2 API 보안 헤더 (1시간)
- [ ] Helmet.js 보안 헤더 설정
- [ ] CORS 정책 세밀 조정
- [ ] Content Security Policy 설정

**산출물**: 
- `src/config/security-config.js`

#### 6.2.3 API 키 및 인증 (0.5시간)
- [ ] 기본 API 키 시스템 (선택적)
- [ ] 요청 로깅 및 모니터링

**산출물**: 
- `src/middleware/auth-middleware.js`

## 🚀 7단계: 배포 및 운영 (Deployment & Operations)

### 7.1 배포 준비 (2시간)

#### 7.1.1 환경 설정 (1시간)
- [ ] 개발/프로덕션 환경 분리
- [ ] 환경 변수 관리
- [ ] 설정 파일 템플릿

**산출물**: 
- `.env.example`
- `src/config/environment.js`

#### 7.1.2 시작 스크립트 (1시간)
- [ ] API 서버 시작 스크립트
- [ ] 통합 서버 시작 스크립트 (MCP + API + Dashboard)
- [ ] 헬스체크 엔드포인트

**산출물**: 
- `scripts/start-api.js`
- `scripts/start-all.js`
- `src/routes/health.js`

### 7.2 모니터링 (2시간)

#### 7.2.1 메트릭 수집 (1시간)
- [ ] 기존 `MetricsCollector` 확장
- [ ] API 호출 통계 수집
- [ ] 성능 메트릭 추적

**산출물**: 
- `src/services/APIMetrics.js`

#### 7.2.2 로깅 강화 (1시간)
- [ ] 기존 `ErrorLogger` 확장
- [ ] 구조화된 로그 형식
- [ ] 에러 알림 시스템

**산출물**: 
- `src/services/APILogger.js`

## 📈 총 작업 추정

### 총 시간: **47시간**

| 단계 | 작업시간 | 누적시간 |
|------|----------|----------|
| 1단계: 기반 구조 | 7시간 | 7시간 |
| 2단계: 핵심 API | 18시간 | 25시간 |
| 3단계: 자기설명적 API | 9시간 | 34시간 |
| 4단계: 실시간 기능 | 5시간 | 39시간 |
| 5단계: 문서화 도구 | 5시간 | 44시간 |
| 6단계: 성능 보안 | 7시간 | 51시간 |
| 7단계: 배포 운영 | 4시간 | 55시간 |

### 우선순위별 분류

#### 🔴 High Priority (MVP) - 34시간
- 1단계: 기반 구조 (7시간)
- 2단계: 핵심 API (18시간)  
- 3단계: 자기설명적 API (9시간)

#### 🟡 Medium Priority - 8시간
- 4단계: 실시간 기능 (5시간)
- 5단계: 문서화 도구 (3시간)

#### 🟢 Low Priority - 13시간
- 5단계: 테스트 도구 (2시간)
- 6단계: 성능 보안 (7시간)
- 7단계: 배포 운영 (4시간)

## 🎯 마일스톤

### Milestone 1: API 기반 (1주) - 25시간
- 기반 구조 완성
- PRD, Task, Document API 구현
- 기본 테스트 및 검증

### Milestone 2: 완전한 API (2주) - 34시간  
- 자기설명적 API 완성
- Help 시스템 구현
- 대시보드 통합

### Milestone 3: 프로덕션 준비 (3주) - 55시간
- 실시간 기능 추가
- 성능 최적화
- 보안 강화 및 운영 준비

## ✅ 성공 기준

1. **기능 요구사항**
   - [ ] 55개 MCP 도구의 REST API 래핑 완료
   - [ ] 자기설명적 API로 세션에서 쉬운 탐색 가능
   - [ ] 기존 대시보드 기능과 완전 호환

2. **비기능 요구사항**  
   - [ ] API 응답 시간 < 500ms (95percentile)
   - [ ] 기존 MCP 서버 성능 영향 < 5%
   - [ ] 100% 기존 기능 호환성 유지

3. **사용성 요구사항**
   - [ ] 새 세션에서 5분 내 API 사용법 학습 가능
   - [ ] Claude Code에서 바로 활용 가능한 예제 제공
   - [ ] 완전한 API 문서화 및 인터랙티브 콘솔