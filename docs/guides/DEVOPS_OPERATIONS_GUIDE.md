# 🚀 DevOps 운영 관리 가이드

WorkflowMCP v2.9의 DevOps 운영 관리 시스템 완전 사용 가이드입니다.

## 📋 목차

- [📊 개요](#-개요)
- [🛠️ 인시던트 관리](#️-인시던트-관리)
- [🌐 환경 관리](#-환경-관리)
- [🚀 배포 관리](#-배포-관리)
- [📊 시스템 상태 모니터링](#-시스템-상태-모니터링)
- [🔧 MCP 도구 사용법](#-mcp-도구-사용법)
- [🌐 웹 대시보드 사용법](#-웹-대시보드-사용법)

## 📊 개요

### 지원 기능

| 기능 | MCP 도구 | 웹 대시보드 | CRUD 지원 |
|------|----------|-------------|----------|
| **인시던트 관리** | ✅ | ✅ | Create, Read, Update, Delete |
| **환경 관리** | ✅ | ✅ | Create, Read, Update |
| **배포 관리** | ✅ | ✅ | Create, Read, Update |
| **시스템 상태** | ✅ | ✅ | Read |

### 아키텍처

```
Claude Code (MCP 도구) ↔ MCP 서버 ↔ SQLite DB ↔ 웹 대시보드
```

## 🛠️ 인시던트 관리

### 인시던트 타입

- **outage**: 서비스 중단
- **performance**: 성능 이슈
- **security**: 보안 문제
- **data**: 데이터 관련 이슈
- **deployment**: 배포 관련 문제

### 심각도 수준

- **critical**: 심각 (서비스 전체 중단)
- **high**: 높음 (주요 기능 영향)
- **medium**: 보통 (일부 기능 영향)
- **low**: 낮음 (경미한 문제)

### 상태 관리

- **open**: 신규 접수
- **investigating**: 조사 중
- **identified**: 원인 파악
- **monitoring**: 모니터링 중
- **resolved**: 해결 완료

### MCP 도구로 인시던트 관리

#### 인시던트 생성
```javascript
mcp__workflow-mcp__create_incident({
  title: "API 서버 응답 지연",
  description: "결제 API 응답 시간이 10초 이상 소요됨",
  severity: "high",
  incident_type: "performance",
  status: "open",
  affected_services: ["payment-api", "checkout-service"],
  tags: ["api", "performance", "payment"],
  environment_id: "prod-env-123"
})
```

#### 인시던트 목록 조회
```javascript
// 모든 인시던트
mcp__workflow-mcp__list_incidents()

// 필터링 조회
mcp__workflow-mcp__list_incidents({
  severity: "critical",
  status: "open",
  incident_type: "outage"
})
```

#### 인시던트 업데이트
```javascript
// API를 통한 업데이트
PUT /api/incidents/{id}
{
  "status": "resolved",
  "resolution_notes": "서버 용량 증설로 해결"
}
```

### 웹 대시보드 사용법

1. **운영 관리 페이지 접속**: `http://localhost:3301/operations`
2. **인시던트 생성**: "새 인시던트 생성" 버튼 클릭
3. **인시던트 상세**: 목록에서 항목 클릭 → 상세보기 페이지
4. **인시던트 수정**: 상세 페이지에서 "수정" 버튼 → 모달에서 편집

## 🌐 환경 관리

### 환경 타입

- **development**: 개발 환경
- **staging**: 스테이징 환경
- **production**: 프로덕션 환경
- **testing**: 테스트 환경

### 환경 상태

- **active**: 활성
- **inactive**: 비활성
- **maintenance**: 점검 중

### MCP 도구로 환경 관리

#### 환경 생성
```javascript
mcp__workflow-mcp__create_environment({
  name: "프로덕션 API 서버",
  environment_type: "production",
  description: "메인 API 서비스 프로덕션 환경",
  url: "https://api.company.com",
  status: "active",
  tags: ["api", "production", "critical"]
})
```

#### 환경 목록 조회
```javascript
// 모든 환경
mcp__workflow-mcp__list_environments()

// 타입별 필터링
mcp__workflow-mcp__list_environments({
  environment_type: "production",
  status: "active"
})
```

#### 환경 상태 조회
```javascript
mcp__workflow-mcp__get_environment_status({
  environment_id: "env-123"
})
```

#### 환경 업데이트
```javascript
mcp__workflow-mcp__update_environment({
  environment_id: "env-123",
  updates: {
    status: "maintenance",
    description: "점검을 위한 임시 중단"
  }
})
```

### 웹 대시보드 사용법

1. **환경 관리 페이지**: `http://localhost:3301/environments`
2. **환경 생성**: "새 환경 추가" 버튼
3. **환경 수정**: 환경 카드에서 "편집" 버튼
4. **상태 모니터링**: 각 환경의 실시간 상태 확인

## 🚀 배포 관리

### 배포 타입

- **blue_green**: 블루-그린 배포
- **rolling**: 순차 배포
- **canary**: 카나리 배포
- **hotfix**: 핫픽스 배포

### 배포 상태

- **planned**: 계획됨
- **in_progress**: 진행 중
- **completed**: 완료
- **failed**: 실패
- **rolled_back**: 롤백됨

### MCP 도구로 배포 관리

#### 배포 생성
```javascript
mcp__workflow-mcp__create_deployment({
  title: "API v2.1.0 프로덕션 배포",
  description: "새로운 결제 시스템 및 성능 개선 사항 배포",
  environment_id: "prod-env-123",
  version: "v2.1.0",
  deployment_type: "blue_green",
  status: "planned",
  deployment_config: {
    instances: 3,
    rollout_percentage: 25,
    health_check_url: "/health"
  },
  scheduled_at: "2025-01-15T02:00:00Z",
  rollback_version: "v2.0.5",
  tags: ["api", "payment", "performance"]
})
```

#### 배포 목록 조회
```javascript
// 모든 배포
mcp__workflow-mcp__list_deployments()

// 환경별 필터링
mcp__workflow-mcp__list_deployments({
  environment_id: "prod-env-123",
  status: "planned",
  sort_by: "scheduled_desc"
})
```

#### 배포 상세 조회
```javascript
mcp__workflow-mcp__get_deployment({
  deployment_id: "deploy-456"
})
```

### 웹 대시보드 사용법

1. **배포 관리 페이지**: `http://localhost:3301/deployments`
2. **배포 계획**: "새 배포 계획" 버튼
3. **배포 실행**: 계획된 배포에서 "실행" 버튼
4. **배포 모니터링**: 실시간 배포 진행 상황 추적
5. **롤백**: 문제 발생 시 "롤백" 버튼으로 이전 버전 복원

## 📊 시스템 상태 모니터링

### MCP 도구로 시스템 상태 조회

```javascript
// 전체 시스템 상태
mcp__workflow-mcp__get_system_health()

// 특정 환경 상태
mcp__workflow-mcp__get_system_health({
  environment_id: "prod-env-123",
  include_details: true
})
```

### 반환 데이터 구조

```json
{
  "success": true,
  "system_health": {
    "summary": {
      "total_environments": 5,
      "healthy_environments": 4,
      "warning_environments": 1,
      "critical_environments": 0,
      "last_check": "2025-01-10T10:30:00Z"
    },
    "recent_checks": [
      {
        "environment_id": "prod-env-123",
        "status": "healthy",
        "response_time": 45,
        "checked_at": "2025-01-10T10:30:00Z"
      }
    ],
    "detailed_metrics": {
      "cpu_usage": 65,
      "memory_usage": 78,
      "disk_usage": 45,
      "network_latency": 12
    }
  }
}
```

## 🔧 MCP 도구 사용법

### 기본 설정

1. **MCP 서버 시작**:
   ```bash
   npm start
   ```

2. **Claude Code에서 연결 확인**:
   ```bash
   /mcp
   ```

### 일반적인 워크플로우

#### 1. 인시던트 대응 시나리오

```javascript
// 1. 인시던트 생성
const incident = await mcp__workflow-mcp__create_incident({
  title: "프로덕션 DB 연결 실패",
  severity: "critical",
  incident_type: "outage",
  affected_services: ["user-service", "order-service"]
})

// 2. 상태 업데이트
await updateIncidentStatus(incident.id, "investigating")

// 3. 해결 후 종료
await updateIncidentStatus(incident.id, "resolved")
```

#### 2. 배포 시나리오

```javascript
// 1. 배포 계획 생성
const deployment = await mcp__workflow-mcp__create_deployment({
  title: "긴급 보안 패치 배포",
  environment_id: "prod-env-123",
  deployment_type: "hotfix",
  version: "v2.0.6-security"
})

// 2. 배포 실행 모니터링
const status = await mcp__workflow-mcp__get_deployment({
  deployment_id: deployment.id
})

// 3. 시스템 상태 확인
const health = await mcp__workflow-mcp__get_system_health({
  environment_id: "prod-env-123"
})
```

## 🌐 웹 대시보드 사용법

### 메인 운영 대시보드

**URL**: `http://localhost:3301/operations`

#### 주요 섹션

1. **인시던트 현황**
   - 심각도별 인시던트 수
   - 최근 인시던트 목록
   - 해결 시간 통계

2. **환경 상태**
   - 각 환경별 상태 요약
   - 헬스 체크 결과
   - 성능 메트릭

3. **최근 배포**
   - 진행 중인 배포
   - 완료된 배포 목록
   - 배포 성공률

### 페이지별 기능

#### 인시던트 페이지 (`/operations`)

- **인시던트 생성**: 상세 정보 입력 폼
- **인시던트 목록**: 필터링 및 정렬 기능
- **인시던트 상세**: 상태 변경 및 노트 추가
- **인시던트 수정**: 모든 필드 편집 가능

#### 환경 페이지 (`/environments`)

- **환경 추가**: 타입, URL, 상태 설정
- **환경 목록**: 카드 형태로 표시
- **환경 편집**: 인라인 편집 지원
- **상태 모니터링**: 실시간 상태 표시

#### 배포 페이지 (`/deployments`)

- **배포 계획**: 상세 배포 설정
- **배포 목록**: 시간순 정렬
- **배포 실행**: 원클릭 실행
- **배포 추적**: 실시간 진행 상황

## 🎯 모범 사례

### 인시던트 관리

1. **신속한 보고**: 문제 발견 즉시 인시던트 생성
2. **정확한 분류**: 심각도와 타입을 정확히 설정
3. **상세한 기록**: 조사 과정과 해결 방법 문서화
4. **사후 분석**: 해결 후 원인 분석 및 예방책 수립

### 환경 관리

1. **명확한 명명**: 환경별 명확한 이름과 설명
2. **태그 활용**: 관련 서비스 및 팀 태그 추가
3. **상태 업데이트**: 점검 시 상태를 적절히 변경
4. **URL 관리**: 정확한 접속 URL 유지

### 배포 관리

1. **점진적 배포**: 프로덕션은 단계적 배포 선택
2. **롤백 준비**: 항상 롤백 버전 설정
3. **헬스 체크**: 배포 후 시스템 상태 확인
4. **문서화**: 배포 내용과 변경 사항 기록

## 🚨 트러블슈팅

### 일반적인 문제

#### MCP 서버 연결 안됨

```bash
# 서버 상태 확인
ps aux | grep "node src/index.js"

# 서버 재시작
npm start

# Claude Code 재시작 후 /mcp 명령어로 연결 확인
```

#### 웹 대시보드 접속 안됨

```bash
# 대시보드 서버 확인
cd dashboard
npm run dev

# 포트 충돌 확인
netstat -an | findstr :3301
```

#### 데이터 동기화 문제

1. **SQLite 데이터베이스 확인**: `data/workflow.db` 파일 존재 여부
2. **데이터베이스 마이그레이션**: `node src/database/simple-migrate.js`
3. **서버 재시작**: MCP 서버와 웹 서버 모두 재시작

### 로그 확인

- **MCP 서버 로그**: 콘솔 출력 확인
- **웹 서버 로그**: 브라우저 개발자 도구 → Network 탭
- **데이터베이스 로그**: SQLite 에러 메시지 확인

## 📚 관련 문서

- [USER_GUIDE.md](USER_GUIDE.md) - 전체 시스템 사용 가이드
- [../README.md](../README.md) - 프로젝트 개요 및 설치
- [MCP_PHASE_2_9_TESTING_GUIDE.md](MCP_PHASE_2_9_TESTING_GUIDE.md) - DevOps 기능 테스트 가이드

---

**WorkflowMCP v2.9 DevOps 운영 관리 시스템**으로 효율적이고 안정적인 운영 관리를 경험해보세요! 🚀