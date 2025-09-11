# 📋 PRD: WorkflowMCP 대시보드 API 구현

## 🎯 프로젝트 개요

### 프로젝트 목적
**WorkflowMCP 대시보드의 API 확장 및 통합**을 통해 MCP 도구와 대시보드 기능을 API로 접근할 수 있는 통합 인터페이스 구축

### 배경
- WorkflowMCP 시스템이 구축되어 있고 웹 대시보드가 운영 중
- 대시보드에서 API 사용 시 매우 유연한 동작 확인
- MCP 도구들과 대시보드 CRUD 기능을 API로 통합 제공 필요
- 기존 구현된 API는 유지하고, 누락된 API는 추가 구현

## 🎯 비즈니스 목표

### 주요 목표
1. **API 통합성**: 모든 MCP 도구를 REST API로 접근 가능
2. **대시보드 연동**: 웹 대시보드 모든 기능을 API로 제공
3. **확장성**: 새로운 MCP 도구 추가 시 자동 API 매핑
4. **일관성**: 통일된 API 인터페이스 및 응답 형식

### 성과 지표
- **API 커버리지**: MCP 도구 대비 API 제공 비율 95% 이상
- **응답 시간**: 평균 API 응답시간 500ms 이하
- **에러율**: API 호출 실패율 1% 이하
- **사용성**: 대시보드 모든 기능을 API로 수행 가능

## 👥 대상 사용자

### Primary Users
- **Claude Code 사용자**: MCP 도구를 HTTP API로 접근하려는 개발자
- **대시보드 사용자**: 웹 인터페이스와 API를 혼용하는 프로젝트 관리자
- **통합 개발자**: WorkflowMCP를 다른 시스템과 연동하려는 개발자

### Secondary Users
- **자동화 스크립트**: CI/CD나 자동화 도구에서 API 호출
- **모바일/데스크톱 앱**: 대시보드 대신 네이티브 앱 개발자
- **써드파티 도구**: WorkflowMCP 데이터를 활용하려는 외부 도구

## 🔧 핵심 기능 요구사항

### 1. MCP 도구 API 매핑

#### 1.1 PRD 관리 API
- `GET /api/prds` - PRD 목록 조회
- `POST /api/prds` - 새 PRD 생성
- `GET /api/prds/{id}` - PRD 상세 조회
- `PUT /api/prds/{id}` - PRD 업데이트
- `DELETE /api/prds/{id}` - PRD 삭제

#### 1.2 Task 관리 API
- `GET /api/tasks` - 작업 목록 조회
- `POST /api/tasks` - 새 작업 생성
- `GET /api/tasks/{id}` - 작업 상세 조회
- `PUT /api/tasks/{id}` - 작업 업데이트
- `DELETE /api/tasks/{id}` - 작업 삭제
- `POST /api/tasks/{id}/dependencies` - 작업 의존성 추가

#### 1.3 Document 관리 API
- `GET /api/documents` - 문서 목록 조회
- `POST /api/documents` - 새 문서 생성
- `GET /api/documents/{id}` - 문서 상세 조회
- `PUT /api/documents/{id}` - 문서 업데이트
- `DELETE /api/documents/{id}` - 문서 삭제
- `GET /api/documents/search?q={query}` - 문서 검색

#### 1.4 프로젝트 분석 API
- `GET /api/projects/{id}/dashboard` - 프로젝트 대시보드 데이터
- `GET /api/projects/{id}/analytics` - 프로젝트 분석 데이터
- `GET /api/progress/timeline` - 진행률 타임라인

### 2. 대시보드 기능 API

#### 2.1 대시보드 페이지 데이터
- `GET /api/dashboard/overview` - 전체 개요 데이터
- `GET /api/dashboard/prds` - PRD 관리 페이지 데이터
- `GET /api/dashboard/tasks` - 작업 관리 페이지 데이터
- `GET /api/dashboard/documents` - 문서 관리 페이지 데이터

#### 2.2 실시간 업데이트
- `GET /api/events/stream` - Server-Sent Events로 실시간 업데이트
- `POST /api/events/trigger` - 수동 이벤트 트리거

### 3. 통합 API 기능

#### 3.1 배치 작업
- `POST /api/batch/prds` - 여러 PRD 일괄 생성/업데이트
- `POST /api/batch/tasks` - 여러 작업 일괄 생성/업데이트
- `POST /api/batch/documents` - 여러 문서 일괄 생성/업데이트

#### 3.2 연결 관리
- `GET /api/connections` - 엔티티 간 연결 관계 조회
- `POST /api/connections` - 엔티티 간 연결 생성
- `DELETE /api/connections/{id}` - 연결 삭제

## 🔧 기술적 요구사항

### API 표준
- **REST API**: HTTP/1.1 기반 RESTful 인터페이스
- **JSON 포맷**: 모든 요청/응답은 JSON 형식
- **HTTP 상태 코드**: 표준 HTTP 상태 코드 사용
- **API 버전**: URL 경로에 버전 포함 (`/api/v1/`)

### 응답 형식 표준화
```json
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "작업 완료",
  "timestamp": "2025-09-11T10:30:00Z",
  "version": "1.0"
}
```

### 에러 처리
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "필수 필드가 누락되었습니다",
    "details": ["title 필드는 필수입니다"]
  },
  "timestamp": "2025-09-11T10:30:00Z"
}
```

## 🛡️ 보안 요구사항

### 인증/인가
- **현재 단계**: 인증 없음 (로컬 개발 환경)
- **추후 확장**: API 키 기반 인증 준비

### 데이터 보호
- **입력 검증**: 모든 API 입력에 대한 유효성 검사
- **SQL 인젝션 방지**: Prepared Statement 사용
- **XSS 방지**: 출력 데이터 이스케이프 처리

## 📊 성능 요구사항

### 응답 시간
- **단일 조회**: 100ms 이하
- **목록 조회**: 300ms 이하
- **복합 작업**: 500ms 이하
- **배치 작업**: 2초 이하

### 동시성
- **동시 API 호출**: 50개 이상 처리 가능
- **데이터베이스 연결**: Connection pooling 적용
- **메모리 사용**: 힙 메모리 500MB 이하

## 🔗 통합 요구사항

### 기존 시스템 연동
- **MCP 서버**: 기존 MCP 도구와 완전 호환
- **SQLite 데이터베이스**: 기존 스키마 유지
- **웹 대시보드**: 기존 대시보드와 동일한 데이터 접근

### 확장성
- **새 MCP 도구**: 자동 API 엔드포인트 생성
- **플러그인 아키텍처**: 새 기능 모듈 쉽게 추가
- **API 문서**: Swagger/OpenAPI 자동 생성

## ⚠️ 제약사항 및 고려사항

### 기술적 제약
- **기존 코드 수정 금지**: 기존 구현은 유지, 추가 구현만 진행
- **SQLite 데이터베이스**: 현재 스토리지 시스템 유지
- **Node.js 환경**: 기존 런타임 환경 유지

### 비즈니스 제약
- **하위 호환성**: 기존 MCP 도구 동작에 영향 없음
- **성능 영향**: 대시보드 성능 저하 없음
- **데이터 일관성**: 기존 데이터 무결성 유지

## 🎯 우선순위

### Phase 1 (High Priority)
1. **기존 API 분석**: 현재 구현된 API 엔드포인트 파악
2. **핵심 CRUD API**: PRD, Task, Document 기본 CRUD 완성
3. **API 표준화**: 응답 형식 및 에러 처리 통일

### Phase 2 (Medium Priority)
1. **고급 기능 API**: 검색, 분석, 대시보드 데이터
2. **배치 작업 API**: 일괄 처리 기능
3. **실시간 업데이트**: SSE 또는 WebSocket

### Phase 3 (Low Priority)
1. **API 문서화**: Swagger 문서 자동 생성
2. **성능 최적화**: 캐싱 및 최적화
3. **확장 기능**: 플러그인 아키텍처

## 📈 성공 기준

### 기능적 성공 기준
- [ ] 모든 대시보드 기능을 API로 수행 가능
- [ ] 기존 MCP 도구와 100% 호환성 유지
- [ ] API 응답 형식 일관성 100%

### 기술적 성공 기준
- [ ] API 응답시간 목표 달성 (500ms 이하)
- [ ] 에러율 1% 이하 유지
- [ ] 기존 시스템 성능 영향 없음

### 사용자 경험 성공 기준
- [ ] 대시보드와 API 간 기능 동등성
- [ ] 직관적인 API 인터페이스
- [ ] 명확한 에러 메시지 및 가이드

---

**작성일**: 2025-09-11  
**작성자**: 요구사항 분석가 (Claude Code)  
**승인자**: 프로젝트 관리자  
**버전**: 1.0  
**상태**: 초안 완료