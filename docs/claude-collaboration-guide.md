# Claude-to-Claude 실시간 협업 시스템 가이드

## 📖 개요

WorkflowMCP의 Claude-to-Claude 협업 시스템을 통해 두 개의 Claude Code 인스턴스가 실시간으로 소통하고 협업할 수 있습니다. 한 Claude는 개발자 역할을, 다른 Claude는 감독자/관리자 역할을 수행하며, 실시간 메시징, 작업 모니터링, 승인 워크플로를 통해 체계적인 협업이 가능합니다.

## 🏗️ 시스템 아키텍처

### 핵심 구성요소

1. **Agent Sessions (에이전트 세션)**
   - 각 Claude Code 인스턴스를 추적
   - 역할: `developer` 또는 `supervisor`
   - 실시간 상태 및 활동 모니터링

2. **Real-time Messaging (실시간 메시징)**
   - Claude 간 즉석 메시지 교환
   - 메시지 타입: 진행상황 업데이트, 질문, 피드백, 승인요청 등
   - 읽음 상태 및 응답 추적

3. **Supervisor Interventions (감독자 개입)**
   - 감독자가 개발 과정에 개입
   - 피드백, 방향 변경, 승인/거부, 우선순위 변경 등
   - 즉각적인 알림 및 응답 시스템

4. **Progress Monitoring (진척 모니터링)**
   - 실시간 작업 진행 상황 추적
   - 코드 변경사항, 테스트 결과, 완료 예상시간 등
   - 신뢰도 및 장애물 보고

5. **Approval Workflows (승인 워크플로)**
   - 구조화된 승인 프로세스
   - 작업 완료, 코드 변경, 아키텍처 결정 등에 대한 승인
   - 조건부 승인 및 거부 사유 관리

## 🚀 설치 및 설정

### 1. 데이터베이스 마이그레이션

기존 workflow-mcp 데이터베이스에 협업 테이블을 추가합니다:

```bash
cd C:\dev\workflow-mcp

# 기본 마이그레이션 (권장)
npm run migrate:collaboration

# 백업과 함께 마이그레이션 (안전)
npm run migrate:collaboration:backup
```

### 2. MCP 서버 설정 확인

`.mcp.json` 파일에 workflow-mcp가 설정되어 있는지 확인:

```json
{
  "mcpServers": {
    "workflow-mcp": {
      "command": "node",
      "args": ["src/index.js"],
      "type": "stdio",
      "cwd": "C:\\dev\\workflow-mcp"
    }
  }
}
```

### 3. 서버 재시작

마이그레이션 후 새로운 협업 도구를 사용하려면 Claude Code를 재시작합니다.

## 🎯 사용 방법

### 기본 협업 워크플로

#### 1. 개발자 세션 시작 (Claude Code #1)

```javascript
// 개발자 에이전트 세션 시작
await mcp__workflow-mcp__start_agent_session({
  agent_type: "developer",
  agent_name: "Claude Developer",
  project_id: "my-project"
});

// 결과: { success: true, session_id: "session_1704..." }
```

#### 2. 감독자 세션 시작 (Claude Code #2)

```javascript
// 감독자 에이전트 세션 시작
await mcp__workflow-mcp__start_agent_session({
  agent_type: "supervisor", 
  agent_name: "Claude Supervisor",
  project_id: "my-project"
});

// 결과: { success: true, session_id: "session_1705..." }
```

#### 3. 활성 세션 확인

```javascript
// 현재 활성화된 모든 세션 조회
await mcp__workflow-mcp__get_active_sessions({});

// 특정 프로젝트의 세션만 조회
await mcp__workflow-mcp__get_active_sessions({
  project_id: "my-project"
});
```

### 실시간 메시징

#### 메시지 전송

```javascript
// 개발자 → 감독자 진행상황 업데이트
await mcp__workflow-mcp__send_message({
  from_session_id: "session_1704...",
  to_session_id: "session_1705...",
  message_type: "progress_update",
  subject: "인증 시스템 구현 진행중",
  content: "JWT 토큰 생성 완료, 미들웨어 구현 중입니다.",
  priority: "normal",
  related_task_id: "task-123"
});

// 감독자 → 개발자 질문
await mcp__workflow-mcp__send_message({
  from_session_id: "session_1705...",
  to_session_id: "session_1704...", 
  message_type: "question",
  subject: "보안 검토 필요",
  content: "토큰 만료 시간은 어떻게 설정했나요?",
  response_required: true,
  response_deadline: "2025-01-15T18:00:00Z"
});
```

#### 메시지 확인 및 응답

```javascript
// 미읽은 메시지 조회
await mcp__workflow-mcp__get_messages({
  session_id: "session_1704...",
  unread_only: true
});

// 메시지를 읽은 것으로 표시
await mcp__workflow-mcp__mark_message_read({
  message_id: 123,
  session_id: "session_1704..."
});

// 메시지에 응답
await mcp__workflow-mcp__respond_to_message({
  original_message_id: 123,
  from_session_id: "session_1704...",
  response_content: "토큰 만료시간은 24시간으로 설정했습니다. 환경 변수로 조정 가능합니다."
});
```

### 감독자 개입 시스템

#### 개입 전송 (감독자)

```javascript
// 피드백 제공
await mcp__workflow-mcp__send_intervention({
  supervisor_session_id: "session_1705...",
  developer_session_id: "session_1704...",
  intervention_type: "feedback",
  title: "코드 리뷰 피드백",
  message: "인증 로직이 잘 구현되었습니다. 다만 에러 핸들링을 보완해주세요.",
  related_task_id: "task-123",
  priority: "normal"
});

// 방향 변경 지시
await mcp__workflow-mcp__send_intervention({
  supervisor_session_id: "session_1705...",
  developer_session_id: "session_1704...",
  intervention_type: "direction_change",
  title: "아키텍처 변경 요청",
  message: "OAuth 2.0 대신 SAML 인증을 사용해주세요.",
  requires_immediate_action: true,
  priority: "urgent"
});
```

#### 개입 확인 및 응답 (개발자)

```javascript
// 대기 중인 개입 조회
await mcp__workflow-mcp__get_pending_interventions({
  developer_session_id: "session_1704..."
});

// 개입 승인
await mcp__workflow-mcp__acknowledge_intervention({
  intervention_id: 456,
  developer_session_id: "session_1704...",
  response: "네, SAML 인증으로 변경하겠습니다. 예상 소요시간은 2일입니다."
});
```

### 작업 진척 모니터링

#### 진행 상황 업데이트

```javascript
// 상세한 작업 진척 기록
await mcp__workflow-mcp__update_task_progress({
  task_id: "task-123",
  agent_session_id: "session_1704...",
  progress_percentage: 75,
  work_description: "SAML 인증 미들웨어 구현 완료",
  files_modified: [
    "src/auth/saml-middleware.js",
    "src/config/auth-config.js",
    "tests/auth/saml.test.js"
  ],
  code_changes_summary: "SAML 제공업체 설정, 토큰 검증 로직, 단위 테스트 추가",
  tests_added: true,
  tests_passed: true,
  estimated_completion_time: 480, // 8시간 (분 단위)
  confidence_level: 8,
  blockers_encountered: [],
  needs_review: true
});
```

#### 진척 이력 조회

```javascript
// 특정 작업의 진행 이력 조회
await mcp__workflow-mcp__get_task_progress_history({
  task_id: "task-123",
  limit: 10
});
```

### 승인 워크플로

#### 승인 요청 (개발자)

```javascript
// 코드 변경 승인 요청
await mcp__workflow-mcp__request_approval({
  requester_session_id: "session_1704...",
  approver_session_id: "session_1705...", // 특정 감독자에게
  workflow_type: "code_change",
  title: "SAML 인증 구현 승인 요청",
  description: "SAML 2.0 인증 시스템 구현이 완료되었습니다. 코드 리뷰 및 배포 승인을 요청합니다.",
  related_task_id: "task-123",
  approval_deadline: "2025-01-16T17:00:00Z"
});
```

#### 승인 처리 (감독자)

```javascript
// 대기 중인 승인 조회
await mcp__workflow-mcp__get_pending_approvals({
  approver_session_id: "session_1705...",
  workflow_type: "code_change"
});

// 승인
await mcp__workflow-mcp__approve_request({
  approval_id: 789,
  approver_session_id: "session_1705...",
  conditions: "스테이징 환경에서 통합 테스트 통과 후 배포"
});

// 거부
await mcp__workflow-mcp__reject_request({
  approval_id: 789,
  approver_session_id: "session_1705...",
  rejection_reason: "보안 검토가 더 필요합니다. OWASP 가이드라인 준수 확인 후 재신청해주세요."
});
```

## 📊 모니터링 및 분석

### 활성 개발 모니터링

```javascript
// 현재 진행 중인 모든 개발 활동 모니터링
await mcp__workflow-mcp__monitor_active_development({
  project_id: "my-project"
});

// 결과 예시:
{
  success: true,
  active_sessions: [
    {
      id: "session_1704...",
      agent_name: "Claude Developer",
      agent_type: "developer",
      status: "active",
      current_activity: "SAML 인증 구현 중",
      current_task_title: "사용자 인증 시스템",
      unread_messages: 2,
      pending_interventions: 0
    }
  ],
  count: 1
}
```

### 협업 대시보드

```javascript
// 종합 협업 현황 조회
await mcp__workflow-mcp__get_collaboration_dashboard({
  project_id: "my-project",
  time_range: "1day"
});

// 특정 세션 분석
await mcp__workflow-mcp__get_session_analytics({
  session_id: "session_1704..."
});
```

## 🎨 실전 시나리오 예시

### 시나리오 1: 기능 개발 협업

**상황**: 새로운 사용자 인증 기능 개발

1. **감독자**: 요구사항 정의 및 작업 할당
2. **개발자**: 구현 시작, 진행상황 업데이트
3. **감독자**: 중간 검토, 방향성 피드백
4. **개발자**: 피드백 반영, 완료 승인 요청
5. **감독자**: 코드 리뷰, 승인/거부 결정

### 시나리오 2: 긴급 버그 수정

**상황**: 프로덕션 환경 critical 버그 발생

```javascript
// 감독자: 긴급 개입
await mcp__workflow-mcp__send_intervention({
  supervisor_session_id: "session_supervisor",
  developer_session_id: "session_developer", 
  intervention_type: "blocking",
  title: "긴급: 프로덕션 버그 수정 우선",
  message: "현재 작업을 중단하고 로그인 오류 버그를 즉시 수정해주세요.",
  priority: "critical",
  requires_immediate_action: true
});

// 개발자: 즉시 응답 및 작업 전환
await mcp__workflow-mcp__acknowledge_intervention({
  intervention_id: 999,
  developer_session_id: "session_developer",
  response: "즉시 현재 작업을 중단하고 버그 수정에 집중하겠습니다."
});
```

## 🔧 고급 기능

### 하트비트 시스템

```javascript
// 세션 활성 상태 유지 (주기적 실행)
await mcp__workflow-mcp__send_heartbeat({
  session_id: "session_1704..."
});
```

### 세션 상태 업데이트

```javascript
// 현재 활동 상태 업데이트
await mcp__workflow-mcp__update_agent_status({
  session_id: "session_1704...",
  status: "active",
  current_activity: "데이터베이스 스키마 설계 중",
  current_task_id: "task-456",
  progress_notes: "ERD 완성, 마이그레이션 스크립트 작성 중"
});
```

### 세션 종료

```javascript
// 작업 완료 후 세션 정리
await mcp__workflow-mcp__end_agent_session({
  session_id: "session_1704..."
});
```

## 🎯 모범 사례

### 1. 효과적인 커뮤니케이션

- **명확한 제목**: 메시지와 개입에 구체적인 제목 사용
- **우선순위 설정**: critical/urgent/normal/low 적절히 활용
- **관련 작업 연결**: related_task_id로 컨텍스트 제공

### 2. 진행 상황 추적

- **정기적 업데이트**: 주요 진전이 있을 때마다 진척 상황 기록
- **정확한 예상 시간**: 현실적인 완료 예상 시간 제공
- **장애물 보고**: 차단 요소는 즉시 보고

### 3. 승인 워크플로

- **명확한 기준**: 승인 조건과 기대사항 명시
- **적절한 마감일**: 합리적인 검토 시간 제공
- **상세한 피드백**: 거부 시 구체적인 개선 방안 제시

## 🚨 주의사항

1. **세션 관리**: 작업 완료 후 반드시 세션 정리
2. **메시지 과부하**: 너무 많은 메시지로 인한 집중력 분산 방지
3. **우선순위 남용**: critical/urgent 등급 신중히 사용
4. **응답 시간**: 중요한 메시지에는 신속한 응답

## 🔍 트러블슈팅

### 일반적인 문제들

**Q: 협업 도구가 보이지 않아요**
- Claude Code 재시작 후 MCP 연결 확인
- workflow-mcp 서버가 정상 실행 중인지 확인

**Q: 메시지가 전달되지 않아요**
- 세션 ID가 올바른지 확인
- 수신자 세션이 활성 상태인지 확인

**Q: 데이터베이스 오류가 발생해요**
- 마이그레이션이 완료되었는지 확인
- 데이터베이스 권한 확인

### 로그 확인

```bash
# 서버 로그 확인
cd C:\dev\workflow-mcp
node src/index.js  # 콘솔에서 직접 실행하여 로그 확인
```

## 📚 추가 리소스

- [WorkflowMCP 메인 문서](./README.md)
- [데이터베이스 스키마](../src/database/collaboration-schema.sql)
- [MCP 도구 정의](../src/collaboration-tools.js)
- [마이그레이션 스크립트](../src/database/migrate-collaboration.js)

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-01-12  
**작성자**: Claude Code Collaboration System