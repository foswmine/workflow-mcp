# WorkflowMCP Phase 2.9 DevOps MCP 도구 테스트 가이드

## 📋 개요

이 문서는 Phase 2.9에서 새로 추가된 18개의 DevOps MCP 도구들을 테스트하기 위한 가이드입니다.

## 🚨 현재 상황

**2025-09-10 세션에서 완료된 작업:**
- ✅ 데이터베이스 스키마에 Phase 2.9 테이블 8개 추가 (schema.sql)
- ✅ MCP 서버에 18개 DevOps 도구 구현 완료 (src/index.js)
- ✅ 웹 대시보드 3개 페이지 구현 완료 (/deployments, /operations, /environments)
- ✅ API 엔드포인트 7개 구현 완료
- ✅ 네비게이션 메뉴 업데이트 완료

**🔄 다음 세션에서 해야 할 작업:**
1. **MCP 서버 연결 확인** - Claude Code 재시작 필요
2. **데이터베이스 스키마 적용** - 직접 SQLite 접근
3. **18개 MCP 도구 실제 동작 테스트**

## 🛠 Phase 2.9 추가된 MCP 도구 목록

### 배포 관리 도구 (6개)
| 도구명 | 기능 | 테스트 우선순위 |
|--------|------|----------------|
| `create_deployment` | 배포 생성 | 🔴 HIGH |
| `list_deployments` | 배포 목록 조회 | 🔴 HIGH |
| `get_deployment` | 배포 상세 정보 | 🟡 MEDIUM |
| `execute_deployment` | 배포 실행 | 🟡 MEDIUM |
| `rollback_deployment` | 배포 롤백 | 🟢 LOW |
| `get_deployment_status` | 배포 상태 조회 | 🟢 LOW |

### 운영 & 모니터링 도구 (8개)
| 도구명 | 기능 | 테스트 우선순위 |
|--------|------|----------------|
| `get_system_health` | 시스템 상태 조회 | 🔴 HIGH |
| `create_incident` | 인시던트 생성 | 🔴 HIGH |
| `list_incidents` | 인시던트 목록 | 🔴 HIGH |
| `get_performance_metrics` | 성능 메트릭 조회 | 🟡 MEDIUM |
| `create_alert_rule` | 알림 규칙 생성 | 🟡 MEDIUM |
| `list_alerts` | 알림 목록 | 🟡 MEDIUM |
| `create_maintenance` | 유지보수 일정 생성 | 🟢 LOW |
| `get_operational_reports` | 운영 보고서 조회 | 🟢 LOW |

### 환경 관리 도구 (4개)
| 도구명 | 기능 | 테스트 우선순위 |
|--------|------|----------------|
| `create_environment` | 환경 생성 | 🔴 HIGH |
| `list_environments` | 환경 목록 조회 | 🔴 HIGH |
| `get_environment_status` | 환경 상태 조회 | 🟡 MEDIUM |
| `update_environment` | 환경 정보 업데이트 | 🟢 LOW |

## 🔧 테스트 준비 단계

### 1단계: Claude Code 재시작
```bash
# Claude Code 완전 종료 후 재시작
# 이유: 새로운 MCP 도구가 등록되려면 재시작 필요
```

### 2단계: MCP 서버 연결 확인
```bash
# MCP 서버가 실행 중인지 확인
npm start  # MCP 서버 실행

# 새 Claude Code 세션에서 MCP 연결 확인
ListMcpResourcesTool 또는 /mcp 명령어로 workflow-mcp 서버 연결 확인
```

### 3단계: 데이터베이스 스키마 적용
```bash
# Phase 2.9 테이블이 실제로 생성되었는지 확인
mcp__sqlite__list_tables

# 만약 Phase 2.9 테이블들이 없다면 SQLite로 직접 생성
mcp__sqlite__create_table  # 각 테이블별로 실행 필요
```

**Phase 2.9 테이블 목록 (확인 필요):**
- deployments
- incidents  
- performance_metrics
- alert_rules
- maintenance_schedules
- environments
- environment_configs
- system_health

## 📝 체계적 테스트 시나리오

### 🔴 HIGH 우선순위 테스트 (필수)

#### 1. 환경 관리 테스트
```javascript
// 1-1. 환경 목록 조회 (빈 목록 확인)
mcp__workflow-mcp__list_environments()

// 1-2. 개발 환경 생성
mcp__workflow-mcp__create_environment({
  name: "development",
  environment_type: "development", 
  description: "개발 환경",
  url: "https://dev.example.com",
  status: "active"
})

// 1-3. 프로덕션 환경 생성  
mcp__workflow-mcp__create_environment({
  name: "production",
  environment_type: "production",
  description: "운영 환경", 
  url: "https://prod.example.com",
  status: "active"
})

// 1-4. 환경 목록 재조회 (2개 환경 확인)
mcp__workflow-mcp__list_environments()
```

#### 2. 배포 관리 테스트
```javascript
// 2-1. 배포 목록 조회 (빈 목록 확인)
mcp__workflow-mcp__list_deployments()

// 2-2. 배포 생성 (development 환경에)
mcp__workflow-mcp__create_deployment({
  title: "Phase 2.9 배포",
  description: "DevOps 기능 배포",
  environment_id: "[환경ID]", // 1-2에서 생성된 development 환경 ID
  version: "2.9.0",
  deployment_type: "rolling",
  status: "planned"
})

// 2-3. 배포 목록 재조회 (1개 배포 확인)
mcp__workflow-mcp__list_deployments()
```

#### 3. 인시던트 관리 테스트
```javascript
// 3-1. 인시던트 목록 조회 (빈 목록 확인)
mcp__workflow-mcp__list_incidents()

// 3-2. 테스트 인시던트 생성
mcp__workflow-mcp__create_incident({
  title: "API 응답 지연",
  description: "사용자 API 평균 응답시간이 5초 이상 발생",
  severity: "high",
  incident_type: "performance", 
  status: "open"
})

// 3-3. 인시던트 목록 재조회 (1개 인시던트 확인)
mcp__workflow-mcp__list_incidents()
```

#### 4. 시스템 상태 조회 테스트
```javascript
// 4-1. 시스템 상태 조회 (빈 목록일 수 있음)
mcp__workflow-mcp__get_system_health()
```

### 🟡 MEDIUM 우선순위 테스트 (중요)

#### 5. 성능 메트릭 테스트
```javascript
// 5-1. 성능 메트릭 조회
mcp__workflow-mcp__get_performance_metrics()
```

#### 6. 알림 규칙 테스트  
```javascript
// 6-1. 알림 규칙 목록 조회
mcp__workflow-mcp__list_alerts()

// 6-2. 알림 규칙 생성
mcp__workflow-mcp__create_alert_rule({
  name: "API 응답시간 알림",
  description: "API 응답시간이 3초 이상일 때 알림",
  rule_type: "threshold",
  condition_expression: "response_time > 3000",
  severity: "warning"
})
```

### 🟢 LOW 우선순위 테스트 (선택적)

#### 7. 유지보수 일정 테스트
```javascript
// 7-1. 유지보수 일정 생성
mcp__workflow-mcp__create_maintenance({
  title: "정기 시스템 점검",
  description: "월간 정기 점검",
  maintenance_type: "planned",
  scheduled_start: "2025-09-15T02:00:00Z",
  estimated_duration: 120 // 분 단위
})
```

## 🌐 웹 대시보드 검증

### 테스트 완료 후 대시보드 확인:
1. **배포 센터**: `http://localhost:3302/deployments`
   - 생성된 배포가 표시되는지 확인
   - 필터링 및 정렬 기능 동작 확인

2. **운영 대시보드**: `http://localhost:3302/operations`  
   - 생성된 인시던트가 표시되는지 확인
   - 시스템 상태 표시 확인

3. **환경 관리**: `http://localhost:3302/environments`
   - 생성된 환경들이 표시되는지 확인
   - 환경별 상태 정보 확인

## 🐛 예상되는 문제점과 해결책

### 문제 1: MCP 도구가 인식되지 않는 경우
**해결**: Claude Code 완전 재시작 후 다시 시도

### 문제 2: 데이터베이스 테이블이 없는 경우
**해결**: SQLite MCP 도구로 수동 테이블 생성
```javascript
mcp__sqlite__create_table({
  query: "CREATE TABLE deployments (id TEXT PRIMARY KEY, ...)"
})
```

### 문제 3: MCP 도구 실행 시 오류 발생
**해결**: 
1. 데이터베이스 연결 확인
2. 테이블 존재 여부 확인  
3. 필수 필드 누락 여부 확인

### 문제 4: 웹 대시보드에 데이터가 표시되지 않는 경우
**해결**:
1. API 엔드포인트 응답 확인
2. 데이터베이스에 데이터 실제 저장 여부 확인
3. 브라우저 캐시 클리어

## ✅ 테스트 완료 체크리스트

- [ ] MCP 서버 연결 확인 완료
- [ ] Phase 2.9 테이블 생성 확인 완료  
- [ ] 환경 관리 도구 4개 테스트 완료
- [ ] 배포 관리 도구 6개 테스트 완료
- [ ] 운영 모니터링 도구 8개 테스트 완료
- [ ] 웹 대시보드 3개 페이지 동작 확인 완료
- [ ] API 엔드포인트 7개 응답 확인 완료

## 📊 테스트 결과 기록

테스트 완료 후 다음 정보를 기록해주세요:

**성공한 도구들:**
- [ ] create_environment
- [ ] list_environments  
- [ ] create_deployment
- [ ] list_deployments
- [ ] create_incident
- [ ] list_incidents
- [ ] get_system_health
- [ ] (기타 도구들...)

**실패한 도구들과 오류 내용:**
- [ ] 도구명: 오류 내용
- [ ] 도구명: 오류 내용

**웹 대시보드 동작 상태:**
- [ ] /deployments 페이지: 정상/오류
- [ ] /operations 페이지: 정상/오류  
- [ ] /environments 페이지: 정상/오류

---

이 가이드를 따라 체계적으로 테스트하면 Phase 2.9 DevOps 기능의 완전한 동작을 검증할 수 있습니다.