# Claude-to-Claude 협업 시스템 테스트 가이드

협업 시스템의 모든 기능을 체계적으로 테스트하기 위한 완전한 가이드와 체크리스트입니다.

## 🎯 테스트 개요

### 테스트 목표
- 실시간 협업 기능의 정상 동작 확인
- 다중 세션 간 메시징 시스템 검증
- 폴백 메커니즘과 오류 처리 검증
- 데이터베이스 무결성과 성능 확인

### 필요 환경
- **최소**: 2개의 Claude Code 인스턴스 (개발자 1 + 슈퍼바이저 1)
- **권장**: 3개의 Claude Code 인스턴스 (개발자 2 + 슈퍼바이저 1)
- **완전**: 4개의 Claude Code 인스턴스 (개발자 3 + 슈퍼바이저 1)

---

## 📋 사전 준비 체크리스트

### ✅ 환경 설정 확인
```bash
# 1. workflow-mcp 서버 실행 확인
cd C:\dev\workflow-mcp
npm start  # 별도 터미널에서 실행

# 2. 데이터베이스 테이블 존재 확인
# SQLite MCP를 통해 확인
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%collaboration%';
```

**확인할 테이블들:**
- [ ] `agent_sessions`
- [ ] `collaboration_messages`
- [ ] `supervisor_interventions`
- [ ] `task_progress_snapshots`
- [ ] `approval_workflows`

### ✅ MCP 도구 연결 확인
```javascript
// 각 Claude Code 인스턴스에서 실행
console.log("Available MCP tools for collaboration:");
// 다음 도구들이 사용 가능해야 함:
```

**필수 MCP 도구들:**
- [ ] `mcp__workflow-mcp__start_agent_session`
- [ ] `mcp__workflow-mcp__send_message`
- [ ] `mcp__workflow-mcp__get_messages`
- [ ] `mcp__workflow-mcp__send_intervention`
- [ ] `mcp__workflow-mcp__request_approval`
- [ ] `mcp__workflow-mcp__update_task_progress`

---

## 🧪 기능별 테스트 시나리오

### 1️⃣ 세션 관리 테스트

#### 테스트 1.1: 기본 세션 생성
**Claude Code 인스턴스 1 (슈퍼바이저)**
```javascript
// 슈퍼바이저 세션 시작
const supervisor = await mcp__workflow-mcp__start_agent_session({
  agent_type: "supervisor",
  agent_name: "Claude Supervisor Test"
});

console.log("Supervisor session:", supervisor);
// 예상 결과: success: true, session_id: "session_..."
```

**Claude Code 인스턴스 2 (개발자 1)**
```javascript
// 개발자 세션 시작
const developer1 = await mcp__workflow-mcp__start_agent_session({
  agent_type: "developer", 
  agent_name: "Claude Developer 1"
});

console.log("Developer 1 session:", developer1);
```

**Claude Code 인스턴스 3 (개발자 2)**
```javascript
// 개발자 세션 시작
const developer2 = await mcp__workflow-mcp__start_agent_session({
  agent_type: "developer",
  agent_name: "Claude Developer 2"  
});

console.log("Developer 2 session:", developer2);
```

**✅ 검증 포인트:**
- [ ] 각 세션이 고유한 session_id를 받음
- [ ] 세션이 'active' 상태로 생성됨
- [ ] 데이터베이스에 세션 정보가 올바르게 저장됨

#### 테스트 1.2: 활성 세션 조회
**모든 인스턴스에서 실행**
```javascript
const activeSessions = await mcp__workflow-mcp__get_active_sessions();
console.log("Active sessions:", activeSessions);
```

**✅ 검증 포인트:**
- [ ] 생성된 모든 세션이 조회됨
- [ ] 각 세션의 agent_type이 올바르게 표시됨
- [ ] last_heartbeat가 최근 시간으로 설정됨

### 2️⃣ 실시간 메시징 테스트

#### 테스트 2.1: 개발자 → 슈퍼바이저 메시지
**개발자 1 인스턴스**
```javascript
// 개발자가 슈퍼바이저에게 메시지 전송
const message = await mcp__workflow-mcp__send_message({
  from_session_id: "developer1_session_id", // 실제 세션 ID 사용
  to_session_id: "supervisor_session_id",   // 실제 세션 ID 사용
  message_type: "progress_update",
  subject: "인증 모듈 개발 완료",
  content: "JWT 기반 사용자 인증 모듈 구현을 완료했습니다. 테스트도 통과했습니다.",
  priority: "high",
  response_required: true
});

console.log("Message sent:", message);
```

**슈퍼바이저 인스턴스**
```javascript
// 슈퍼바이저가 메시지 확인
const messages = await mcp__workflow-mcp__get_messages({
  session_id: "supervisor_session_id", // 실제 세션 ID 사용
  unread_only: true
});

console.log("Received messages:", messages);
```

**✅ 검증 포인트:**
- [ ] 메시지가 성공적으로 전송됨
- [ ] 슈퍼바이저가 메시지를 올바르게 수신함
- [ ] 메시지 내용과 메타데이터가 정확함
- [ ] unread_only 필터가 올바르게 작동함

#### 테스트 2.2: 슈퍼바이저 → 개발자 응답
**슈퍼바이저 인스턴스**
```javascript
// 받은 메시지에 응답
const response = await mcp__workflow-mcp__respond_to_message({
  original_message_id: 1, // 실제 메시지 ID 사용
  from_session_id: "supervisor_session_id",
  response_content: "훌륭합니다! 코드 리뷰 후 다음 단계로 진행하겠습니다."
});

console.log("Response sent:", response);
```

**개발자 1 인스턴스**
```javascript
// 응답 메시지 확인
const responses = await mcp__workflow-mcp__get_messages({
  session_id: "developer1_session_id",
  unread_only: true
});

console.log("Received responses:", responses);
```

**✅ 검증 포인트:**
- [ ] 응답이 올바른 개발자에게 전달됨
- [ ] 원본 메시지와 응답이 연결됨
- [ ] responded 플래그가 업데이트됨

#### 테스트 2.3: 브로드캐스트 메시지
**슈퍼바이저 인스턴스**
```javascript
// 모든 개발자에게 브로드캐스트
const broadcast = await mcp__workflow-mcp__send_message({
  from_session_id: "supervisor_session_id",
  to_session_id: null, // null = 브로드캐스트
  message_type: "status_alert",
  subject: "🚨 긴급: 배포 중단 알림",
  content: "프로덕션 이슈로 인해 모든 배포를 중단합니다. 현재 작업을 저장하고 대기해주세요.",
  priority: "urgent"
});

console.log("Broadcast sent:", broadcast);
```

**모든 개발자 인스턴스**
```javascript
// 각 개발자가 브로드캐스트 메시지 수신 확인
const broadcastMessages = await mcp__workflow-mcp__get_messages({
  session_id: "developer_session_id", // 각각의 세션 ID 사용
  message_type: "status_alert",
  unread_only: true
});

console.log("Broadcast received:", broadcastMessages);
```

**✅ 검증 포인트:**
- [ ] 모든 활성 개발자가 브로드캐스트 메시지를 받음
- [ ] 메시지 우선순위가 올바르게 설정됨
- [ ] 브로드캐스트 메시지가 중복으로 전송되지 않음

### 3️⃣ 슈퍼바이저 개입 테스트

#### 테스트 3.1: 개발 방향 수정
**슈퍼바이저 인스턴스**
```javascript
// 개발자에게 방향 수정 개입
const intervention = await mcp__workflow-mcp__send_intervention({
  supervisor_session_id: "supervisor_session_id",
  developer_session_id: "developer1_session_id",
  intervention_type: "direction_change",
  title: "API 설계 방향 수정",
  message: "RESTful API 대신 GraphQL로 변경해주세요. 프론트엔드 팀과의 협의 결과입니다.",
  priority: "high",
  requires_immediate_action: true
});

console.log("Intervention sent:", intervention);
```

**개발자 1 인스턴스**
```javascript
// 개입 알림 확인
const interventions = await mcp__workflow-mcp__get_pending_interventions({
  developer_session_id: "developer1_session_id"
});

console.log("Pending interventions:", interventions);

// 개입 인정 및 응답
const acknowledgment = await mcp__workflow-mcp__acknowledge_intervention({
  intervention_id: interventions[0].id, // 실제 개입 ID 사용
  developer_session_id: "developer1_session_id", 
  response: "이해했습니다. GraphQL 스키마 설계를 시작하겠습니다."
});

console.log("Intervention acknowledged:", acknowledgment);
```

**✅ 검증 포인트:**
- [ ] 개입이 올바른 개발자에게 전달됨
- [ ] 개입 우선순위와 즉시 조치 플래그가 반영됨
- [ ] 개발자의 인정과 응답이 올바르게 기록됨
- [ ] 개입 상태가 'acknowledged'로 업데이트됨

### 4️⃣ 작업 진행상황 추적 테스트

#### 테스트 4.1: 상세 진행상황 업데이트
**개발자 1 인스턴스**
```javascript
// 작업 진행상황 스냅샷 생성
const progress = await mcp__workflow-mcp__update_task_progress({
  task_id: "task_auth_001",
  agent_session_id: "developer1_session_id",
  progress_percentage: 75,
  work_description: "JWT 토큰 검증 로직 구현 및 미들웨어 연동 완료",
  files_modified: [
    "src/auth/jwt-middleware.js",
    "src/auth/token-validator.js", 
    "tests/auth/jwt.test.js"
  ],
  code_changes_summary: "토큰 검증 미들웨어 추가, 만료 시간 확인 로직 구현",
  tests_added: true,
  tests_passed: true,
  estimated_completion_time: 30, // 30분 남음
  confidence_level: 8,
  needs_review: true
});

console.log("Progress updated:", progress);
```

**슈퍼바이저 인스턴스**
```javascript
// 전체 개발 활동 모니터링
const development = await mcp__workflow-mcp__monitor_active_development();
console.log("Active development:", development);

// 특정 작업 진행 히스토리 확인
const history = await mcp__workflow-mcp__get_task_progress_history({
  task_id: "task_auth_001",
  limit: 5
});

console.log("Task progress history:", history);
```

**✅ 검증 포인트:**
- [ ] 진행상황이 올바른 형식으로 저장됨
- [ ] 파일 변경 내역이 JSON 배열로 저장됨
- [ ] 테스트 상태가 정확히 기록됨
- [ ] 신뢰도와 완료 예상 시간이 저장됨
- [ ] 슈퍼바이저가 실시간으로 진행상황을 볼 수 있음

### 5️⃣ 승인 워크플로 테스트

#### 테스트 5.1: 코드 변경 승인 요청
**개발자 2 인스턴스**
```javascript
// 코드 변경 승인 요청
const approval = await mcp__workflow-mcp__request_approval({
  requester_session_id: "developer2_session_id",
  workflow_type: "code_change",
  title: "데이터베이스 스키마 변경 승인",
  description: `사용자 프로필 확장을 위한 DB 스키마 변경:
  - users 테이블에 profile_image_url, bio, social_links 컬럼 추가
  - user_preferences 테이블 신규 생성
  - 기존 데이터 마이그레이션 스크립트 포함`,
  related_task_id: "task_profile_002",
  approval_deadline: new Date(Date.now() + 2*60*60*1000).toISOString() // 2시간 후
});

console.log("Approval requested:", approval);
```

**슈퍼바이저 인스턴스**
```javascript
// 대기 중인 승인 요청 확인
const pendingApprovals = await mcp__workflow-mcp__get_pending_approvals();
console.log("Pending approvals:", pendingApprovals);

// 승인 처리
const approvalDecision = await mcp__workflow-mcp__approve_request({
  approval_id: pendingApprovals[0].id, // 실제 승인 ID 사용
  approver_session_id: "supervisor_session_id",
  conditions: "테스트 환경에서 먼저 검증 후 적용해주세요."
});

console.log("Approval granted:", approvalDecision);
```

**✅ 검증 포인트:**
- [ ] 승인 요청이 올바르게 생성됨
- [ ] 슈퍼바이저가 승인 요청을 확인할 수 있음
- [ ] 승인 처리 시 상태가 'approved'로 변경됨
- [ ] 승인 조건이 올바르게 기록됨
- [ ] 승인 시간이 자동으로 기록됨

#### 테스트 5.2: 승인 거부
**슈퍼바이저 인스턴스**
```javascript
// 다른 승인 요청 거부
const rejection = await mcp__workflow-mcp__reject_request({
  approval_id: pendingApprovals[1].id, // 다른 승인 ID 사용
  approver_session_id: "supervisor_session_id",
  rejection_reason: "보안 검토가 완료되지 않았습니다. 보안팀 승인 후 재요청해주세요."
});

console.log("Approval rejected:", rejection);
```

**✅ 검증 포인트:**
- [ ] 거부 처리 시 상태가 'rejected'로 변경됨
- [ ] 거부 사유가 올바르게 기록됨
- [ ] 거부 시간이 자동으로 기록됨

### 6️⃣ 폴백 메커니즘 테스트

#### 테스트 6.1: 슈퍼바이저 오프라인 시나리오
**준비 단계**
```javascript
// 슈퍼바이저 세션을 'offline'으로 변경
const offlineStatus = await mcp__workflow-mcp__update_agent_status({
  session_id: "supervisor_session_id",
  status: "offline"
});
```

**개발자 1 인스턴스 (자율 모드 테스트)**
```javascript
// 슈퍼바이저가 오프라인일 때 긴급 작업 수행
const emergencyWork = await mcp__workflow-mcp__send_message({
  from_session_id: "developer1_session_id",
  to_session_id: null, // 브로드캐스트
  message_type: "status_alert",
  subject: "🚨 긴급: 프로덕션 DB 연결 오류 수정",
  content: "자율 모드로 긴급 수정 작업을 수행합니다. 슈퍼바이저 복귀 시 검토 요청드립니다.",
  priority: "urgent"
});

console.log("Emergency work notification:", emergencyWork);
```

**개발자 2 인스턴스 (피어 리뷰 모드)**
```javascript
// 다른 개발자의 긴급 작업에 피어 리뷰 제공
const peerReview = await mcp__workflow-mcp__respond_to_message({
  original_message_id: emergencyWork.message_id, // 실제 메시지 ID
  from_session_id: "developer2_session_id",
  response_content: "DB 연결 수정 코드를 확인했습니다. 로직이 올바르며 테스트도 통과했습니다. 승인합니다."
});

console.log("Peer review provided:", peerReview);
```

**✅ 검증 포인트:**
- [ ] 슈퍼바이저 부재가 감지됨
- [ ] 개발자들이 자율적으로 협업 가능
- [ ] 피어 리뷰 시스템이 작동함
- [ ] 긴급 작업이 기록됨

### 7️⃣ 성능 및 안정성 테스트

#### 테스트 7.1: 동시 메시지 처리
**모든 인스턴스에서 동시 실행**
```javascript
// 여러 인스턴스에서 동시에 메시지 전송
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(mcp__workflow-mcp__send_message({
    from_session_id: "current_session_id", // 각자의 세션 ID
    to_session_id: null,
    message_type: "progress_update",
    subject: `동시성 테스트 메시지 ${i}`,
    content: `동시성 테스트용 메시지입니다. 번호: ${i}`,
    priority: "normal"
  }));
}

const results = await Promise.all(promises);
console.log("Concurrent messages sent:", results.length);
```

**✅ 검증 포인트:**
- [ ] 모든 메시지가 성공적으로 전송됨
- [ ] 데이터베이스 무결성이 유지됨
- [ ] 메시지 순서가 보장됨
- [ ] 중복 메시지가 없음

#### 테스트 7.2: 장기 세션 테스트
```javascript
// 5분 동안 하트비트 전송
const sessionTest = setInterval(async () => {
  const heartbeat = await mcp__workflow-mcp__send_heartbeat({
    session_id: "current_session_id"
  });
  console.log("Heartbeat sent at:", new Date().toISOString());
}, 60000); // 1분마다

// 5분 후 정지
setTimeout(() => {
  clearInterval(sessionTest);
  console.log("Long session test completed");
}, 300000); // 5분
```

**✅ 검증 포인트:**
- [ ] 하트비트가 정기적으로 전송됨
- [ ] 세션 상태가 'active'로 유지됨
- [ ] last_heartbeat 시간이 업데이트됨

---

## 📊 종합 테스트 체크리스트

### 🔧 기능 테스트 체크리스트

#### 세션 관리
- [ ] 슈퍼바이저 세션 생성
- [ ] 여러 개발자 세션 생성  
- [ ] 활성 세션 목록 조회
- [ ] 세션 상태 업데이트
- [ ] 세션 종료

#### 메시징 시스템
- [ ] 1:1 메시지 전송 (개발자 → 슈퍼바이저)
- [ ] 1:1 메시지 전송 (슈퍼바이저 → 개발자)
- [ ] 브로드캐스트 메시지
- [ ] 메시지 읽음 처리
- [ ] 메시지 응답 기능
- [ ] 우선순위별 메시지 필터링
- [ ] 읽지 않은 메시지만 조회

#### 슈퍼바이저 개입
- [ ] 개발 방향 수정
- [ ] 작업 우선순위 변경
- [ ] 작업 차단/해제
- [ ] 피드백 제공
- [ ] 개입 인정 및 응답

#### 진행상황 추적  
- [ ] 작업 진행률 업데이트
- [ ] 파일 변경 내역 기록
- [ ] 테스트 상태 기록
- [ ] 예상 완료 시간 업데이트
- [ ] 진행 히스토리 조회
- [ ] 전체 개발 활동 모니터링

#### 승인 워크플로
- [ ] 코드 변경 승인 요청
- [ ] 아키텍처 결정 승인 요청
- [ ] 배포 승인 요청
- [ ] 승인 처리
- [ ] 승인 거부
- [ ] 대기 중인 승인 조회

#### 협업 분석
- [ ] 협업 대시보드 데이터
- [ ] 세션 분석 정보
- [ ] 팀 성과 메트릭

### 🛡️ 안정성 테스트 체크리스트

#### 오류 처리
- [ ] 잘못된 세션 ID 처리
- [ ] 존재하지 않는 메시지 ID 처리
- [ ] 권한 없는 작업 시도 차단
- [ ] 네트워크 오류 처리
- [ ] 데이터베이스 연결 오류 처리

#### 동시성 처리
- [ ] 여러 세션의 동시 메시지 전송
- [ ] 동시 승인 요청 처리
- [ ] 동시 상태 업데이트
- [ ] 데이터베이스 락 처리

#### 성능 테스트
- [ ] 대량 메시지 처리 (100+ 메시지)
- [ ] 장시간 세션 유지 (1시간+)
- [ ] 메모리 누수 확인
- [ ] 응답 시간 측정

#### 폴백 메커니즘
- [ ] 슈퍼바이저 오프라인 감지
- [ ] 자율 모드 활성화
- [ ] 피어 리뷰 모드 전환
- [ ] 긴급 모드 처리
- [ ] 슈퍼바이저 복귀 시 동기화

### 🔍 데이터 무결성 체크리스트

#### 데이터베이스 확인
```sql
-- 테스트 후 실행할 검증 쿼리들

-- 1. 세션 데이터 무결성
SELECT COUNT(*) FROM agent_sessions WHERE status = 'active';

-- 2. 메시지 전송/수신 무결성  
SELECT COUNT(*) FROM collaboration_messages WHERE read_status = FALSE;

-- 3. 개입 처리 상태
SELECT COUNT(*) FROM supervisor_interventions WHERE acknowledged = TRUE;

-- 4. 승인 워크플로 상태
SELECT workflow_type, status, COUNT(*) 
FROM approval_workflows 
GROUP BY workflow_type, status;

-- 5. 진행상황 스냅샷 수
SELECT COUNT(*) FROM task_progress_snapshots;

-- 6. 외래키 제약 조건 확인
PRAGMA foreign_key_check;
```

#### 확인 항목
- [ ] 모든 외래키 제약 조건 만족
- [ ] 세션 상태 일관성
- [ ] 메시지 전송/수신 쌍 일치
- [ ] 타임스탬프 정확성
- [ ] JSON 필드 형식 유효성

---

## 🚀 자동화된 테스트 스크립트

### 기본 테스트 시퀀스 실행 스크립트
```javascript
// test-collaboration-basic.js
async function runBasicCollaborationTest() {
  console.log("🧪 Starting basic collaboration test...");
  
  try {
    // 1. 세션 생성
    const supervisor = await mcp__workflow-mcp__start_agent_session({
      agent_type: "supervisor",
      agent_name: "Test Supervisor"
    });
    
    const developer = await mcp__workflow-mcp__start_agent_session({
      agent_type: "developer", 
      agent_name: "Test Developer"
    });
    
    console.log("✅ Sessions created");
    
    // 2. 메시지 교환
    await mcp__workflow-mcp__send_message({
      from_session_id: developer.session_id,
      to_session_id: supervisor.session_id,
      message_type: "progress_update",
      subject: "테스트 메시지",
      content: "협업 시스템 테스트 메시지입니다.",
      priority: "normal"
    });
    
    const messages = await mcp__workflow-mcp__get_messages({
      session_id: supervisor.session_id,
      unread_only: true
    });
    
    console.log("✅ Message exchange successful");
    
    // 3. 승인 워크플로
    const approval = await mcp__workflow-mcp__request_approval({
      requester_session_id: developer.session_id,
      workflow_type: "code_change",
      title: "테스트 승인",
      description: "테스트용 승인 요청입니다."
    });
    
    await mcp__workflow-mcp__approve_request({
      approval_id: approval.approval_id,
      approver_session_id: supervisor.session_id
    });
    
    console.log("✅ Approval workflow successful");
    
    console.log("🎉 Basic collaboration test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// 실행
runBasicCollaborationTest();
```

### 스트레스 테스트 스크립트
```javascript
// test-collaboration-stress.js  
async function runStressTest() {
  console.log("🔥 Starting stress test...");
  
  const sessionCount = 5;
  const messageCount = 50;
  
  // 1. 다중 세션 생성
  const sessions = [];
  for (let i = 0; i < sessionCount; i++) {
    const session = await mcp__workflow-mcp__start_agent_session({
      agent_type: i === 0 ? "supervisor" : "developer",
      agent_name: `Test Agent ${i}`
    });
    sessions.push(session);
  }
  
  console.log(`✅ Created ${sessionCount} sessions`);
  
  // 2. 대량 메시지 전송
  const promises = [];
  for (let i = 0; i < messageCount; i++) {
    const fromIdx = Math.floor(Math.random() * sessionCount);
    const toIdx = Math.floor(Math.random() * sessionCount);
    
    if (fromIdx !== toIdx) {
      promises.push(mcp__workflow-mcp__send_message({
        from_session_id: sessions[fromIdx].session_id,
        to_session_id: sessions[toIdx].session_id,
        message_type: "progress_update",
        subject: `스트레스 테스트 메시지 ${i}`,
        content: `메시지 번호: ${i}`,
        priority: "normal"
      }));
    }
  }
  
  await Promise.all(promises);
  console.log(`✅ Sent ${promises.length} messages concurrently`);
  
  console.log("🎉 Stress test completed!");
}

// 실행
runStressTest();
```

---

## 📝 테스트 결과 문서화

### 테스트 실행 로그 템플릿
```markdown
# 협업 시스템 테스트 결과

**테스트 일시**: 2024-01-15 14:30:00
**테스트 환경**: Windows 11, Node.js v20.0.0
**Claude Code 버전**: 1.0.112

## 테스트 요약
- **총 테스트 케이스**: 45개
- **성공**: 43개 ✅  
- **실패**: 2개 ❌
- **전체 성공률**: 95.6%

## 실패한 테스트 케이스
1. **테스트 5.2 승인 거부**
   - 오류: rejection_reason이 NULL로 저장됨
   - 원인: 스키마 제약 조건 누락
   - 해결책: rejection_reason을 NOT NULL로 변경

2. **테스트 7.1 동시 메시지 처리**  
   - 오류: 3개 메시지 중복 처리됨
   - 원인: 동시성 제어 부족
   - 해결책: 메시지 ID 유니크 제약 조건 추가

## 성능 메트릭
- **평균 메시지 전송 시간**: 45ms
- **평균 승인 처리 시간**: 120ms
- **최대 동시 세션 수**: 10개
- **메모리 사용량**: 85MB (안정)

## 권장 사항
1. 데이터베이스 제약 조건 강화 필요
2. 동시성 제어 메커니즘 개선 필요
3. 오류 로깅 시스템 추가 검토
```

---

## 🎯 테스트 완료 후 정리 작업

### 테스트 데이터 정리
```sql
-- 테스트 완료 후 실행할 정리 쿼리
DELETE FROM collaboration_messages WHERE content LIKE '%테스트%' OR content LIKE '%test%';
DELETE FROM agent_sessions WHERE agent_name LIKE '%Test%';  
DELETE FROM supervisor_interventions WHERE title LIKE '%테스트%';
DELETE FROM approval_workflows WHERE title LIKE '%테스트%';
DELETE FROM task_progress_snapshots WHERE work_description LIKE '%테스트%';
```

### 정리 체크리스트
- [ ] 테스트 세션 모두 종료
- [ ] 테스트 메시지 데이터 삭제
- [ ] 테스트 승인 워크플로 삭제
- [ ] 테스트 진행상황 스냅샷 삭제  
- [ ] 데이터베이스 최적화 (VACUUM)
- [ ] 로그 파일 아카이브

이 테스트 가이드를 통해 협업 시스템의 모든 기능을 체계적으로 검증할 수 있습니다.