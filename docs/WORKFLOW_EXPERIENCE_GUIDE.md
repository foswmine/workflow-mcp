# 🚀 WorkflowMCP 워크플로우 체험 가이드

## 🎯 **실제 소프트웨어 개발 생명주기 체험**

이 문서 시스템을 통해 실제 SDLC(소프트웨어 개발 생명주기)를 단계별로 체험할 수 있습니다.

## 📂 **워크플로우 순서**

### 1. 📊 **프로젝트 시작** (`/projects/`)
```javascript
// Claude Code에서 실행
create_project({
  "name": "새로운 웹 애플리케이션",
  "description": "사용자 관리 시스템 개발",
  "priority": "high"
})
```
- **생성할 문서**: 프로젝트 계획서, 팀 구성도
- **웹 페이지**: http://localhost:3301/projects

### 2. 📋 **요구사항 정의** (`/requirements/`)
```javascript
create_prd({
  "title": "사용자 관리 시스템 PRD",
  "description": "회원가입, 로그인, 프로필 관리 기능",
  "requirements": ["회원가입 기능", "로그인 인증", "프로필 수정"]
})
```
- **생성할 문서**: PRD, 기능 명세서, 사용자 스토리
- **웹 페이지**: http://localhost:3301/prds

### 3. 🎨 **시스템 설계** (`/designs/`)
```javascript
create_design({
  "title": "사용자 관리 API 설계",
  "design_type": "api",
  "description": "RESTful API 설계 및 데이터베이스 스키마"
})
```
- **생성할 문서**: 아키텍처 설계서, API 명세서, DB 설계서
- **웹 페이지**: http://localhost:3301/designs

### 4. ✅ **작업 분할** (`/tasks/`)
```javascript
create_task({
  "title": "회원가입 API 개발",
  "description": "POST /api/users 엔드포인트 구현",
  "priority": "high",
  "status": "pending"
})
```
- **생성할 문서**: 작업 분할 계획서(WBS), 스프린트 계획
- **웹 페이지**: http://localhost:3301/tasks

### 5. 🧪 **테스트 계획** (`/tests/`)
```javascript
create_test_case({
  "title": "회원가입 API 테스트",
  "description": "회원가입 성공/실패 시나리오 테스트",
  "type": "integration",
  "test_steps": ["API 호출", "응답 검증", "DB 저장 확인"]
})
```
- **생성할 문서**: 테스트 계획서, 테스트 케이스
- **웹 페이지**: http://localhost:3301/tests

### 6. 🌐 **환경 구성** (`/environments/`)
```javascript
create_environment({
  "name": "개발 환경",
  "environment_type": "development",
  "url": "https://dev.example.com",
  "status": "active"
})
```
- **생성할 문서**: 환경 구성 가이드, 인프라 설정
- **웹 페이지**: http://localhost:3301/environments

### 7. 🚀 **배포 계획** (`/deployments/`)
```javascript
create_deployment({
  "title": "사용자 관리 v1.0 배포",
  "description": "첫 번째 프로덕션 배포",
  "deployment_type": "blue_green",
  "version": "v1.0.0"
})
```
- **생성할 문서**: 배포 계획서, 롤백 계획서
- **웹 페이지**: http://localhost:3301/deployments

### 8. 🛠️ **운영 관리** (`/operations/`)
```javascript
create_incident({
  "title": "로그인 API 응답 지연",
  "description": "로그인 API 응답 시간이 5초 이상 소요",
  "severity": "high",
  "incident_type": "performance"
})
```
- **생성할 문서**: 인시던트 대응 매뉴얼, 모니터링 보고서
- **웹 페이지**: http://localhost:3301/operations

### 9. 📝 **문서 통합 관리** (`/documents/`)
```javascript
create_document({
  "title": "프로젝트 회고록",
  "content": "프로젝트 완료 후 배운 점과 개선사항",
  "doc_type": "report",
  "linked_entity_type": "project",
  "linked_entity_id": "project-123"
})
```
- **생성할 문서**: 회의록, 기술 문서, 사후 분석 보고서
- **웹 페이지**: http://localhost:3301/documents

## 🔄 **실제 체험 방법**

### A. **Claude Code 활용**
1. 각 단계별로 MCP 도구 사용
2. 해당 폴더에 관련 문서 저장
3. 다음 단계로 진행

### B. **웹 대시보드 활용**
1. 각 페이지에서 UI를 통해 생성
2. 실시간으로 데이터 확인
3. 시각화된 진행 상황 모니터링

### C. **하이브리드 접근**
1. Claude Code로 빠른 생성
2. 웹 대시보드로 시각적 확인
3. 문서 폴더로 상세 기록 관리

## 📊 **체험 완료 후 얻는 것**

- ✅ **실제 SDLC 프로세스 이해**
- ✅ **AI 도구 활용 경험**
- ✅ **체계적 문서 관리 방법**
- ✅ **DevOps 운영 프로세스 체험**
- ✅ **실무에 적용 가능한 워크플로우**

---

**WorkflowMCP v2.9로 완전한 소프트웨어 개발 생명주기를 체험해보세요!** 🚀