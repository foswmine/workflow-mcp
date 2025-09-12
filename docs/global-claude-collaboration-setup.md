# 전역 Claude Code 협업 설정 가이드

이 파일을 `C:\Users\fosw\.claude\CLAUDE.md` (또는 사용자별 경로)에 추가하면, 모든 프로젝트에서 Claude-to-Claude 협업 기능을 자동으로 사용할 수 있습니다.

## 전역 CLAUDE.md에 추가할 내용

```markdown
# Claude-to-Claude 협업 자동화 규칙

## 🤝 협업 모드 감지 및 자동 활성화

### 협업 프로젝트 감지 조건
다음 조건 중 하나라도 만족하면 협업 모드를 자동 활성화:

1. 프로젝트에 `.mcp.json`에서 `workflow-mcp` 서버 발견
2. 프로젝트 CLAUDE.md에 "협업" 또는 "collaboration" 키워드 발견
3. 사용자가 명시적으로 협업 모드 요청

### 🚀 협업 모드 자동 워크플로

#### Phase 1: 세션 초기화 (프로젝트 시작 시)
```javascript
// 자동 실행: 첫 번째 작업 요청 시
if (isCollaborationProject()) {
  const sessionId = await mcp__workflow-mcp__start_agent_session({
    agent_type: determineRole(), // 컨텍스트 기반 역할 결정
    agent_name: generateAgentName(),
    project_id: getProjectId()
  });
  
  // 세션 ID 메모리에 저장
  storeSessionId(sessionId);
}
```

#### Phase 2: 작업 중 자동 알림 (모든 주요 작업 시)
```javascript
// 파일 수정 후 자동 실행
await mcp__workflow-mcp__update_task_progress({
  task_id: getCurrentTaskId(),
  agent_session_id: getStoredSessionId(),
  work_description: summarizeWork(),
  files_modified: getModifiedFiles(),
  progress_percentage: estimateProgress()
});

// 다른 Claude에게 알림
await mcp__workflow-mcp__send_message({
  from_session_id: getStoredSessionId(),
  message_type: "progress_update",
  subject: `진행: ${getCurrentTask()}`,
  content: getWorkSummary()
});
```

#### Phase 3: 의사결정 승인 (중요 변경 시)
```javascript
// 아키텍처 변경, 새 의존성 추가, 중요 리팩토링 시 자동 실행
if (isSignificantChange()) {
  await mcp__workflow-mcp__request_approval({
    requester_session_id: getStoredSessionId(),
    workflow_type: getChangeType(),
    title: `승인 요청: ${getChangeDescription()}`,
    description: getDetailedReason()
  });
}
```

#### Phase 4: 정리 (세션 종료 시)
```javascript
// 작업 완료 또는 Claude Code 종료 시 자동 실행
await mcp__workflow-mcp__end_agent_session({
  session_id: getStoredSessionId()
});
```

### 📋 역할별 자동화 패턴

#### Developer Claude 자동 동작:
1. **코드 작성 전**: `send_message(progress_update)`
2. **파일 수정 후**: `update_task_progress()`
3. **중요 결정 시**: `request_approval()`
4. **오류 발생 시**: `send_message(status_alert)`
5. **완료 시**: `request_approval(task_completion)`

#### Supervisor Claude 자동 동작:
1. **세션 시작**: `get_active_sessions()` 및 모니터링 시작
2. **정기 체크**: `get_messages(unread_only=true)`
3. **승인 요청**: `get_pending_approvals()` 확인
4. **필요시 개입**: `send_intervention()`

### 🎯 스마트 트리거 조건

다음 조건에서 자동으로 협업 도구 사용:

1. **파일 생성/수정**: 3개 이상 파일 또는 100+ 라인 변경
2. **새 의존성**: package.json, requirements.txt 등 수정
3. **설정 변경**: 환경 변수, 설정 파일 수정
4. **스키마 변경**: 데이터베이스, API 스키마 수정
5. **테스트 실패**: 테스트 실행 결과 실패 시

### 💡 지능형 컨텍스트 인식

```javascript
// 컨텍스트 기반 자동 결정
function determineRole() {
  const context = analyzeContext();
  
  if (context.hasExistingActiveSessions) {
    return 'developer'; // 이미 활성 세션이 있으면 개발자로
  }
  
  if (context.userRequestsSupervisor) {
    return 'supervisor';
  }
  
  if (context.isComplexArchitecturalTask) {
    return 'supervisor'; // 복잡한 아키텍처 작업은 감독자
  }
  
  return 'developer'; // 기본값
}
```

### 🔧 환경별 설정

#### 개발 환경
```javascript
const config = {
  auto_collaboration: true,
  message_frequency: 'high',
  approval_threshold: 'medium',
  session_timeout: '2hours'
};
```

#### 프로덕션 환경
```javascript
const config = {
  auto_collaboration: true,
  message_frequency: 'critical_only',
  approval_threshold: 'low', // 모든 것 승인 요청
  session_timeout: '30minutes'
};
```
```

## 설정 방법

1. 위 내용을 사용자의 전역 CLAUDE.md 파일에 추가
2. Claude Code 재시작
3. workflow-mcp가 설치된 프로젝트에서 자동 활성화 확인

## 테스트 방법

```bash
# 1. 협업 프로젝트로 이동
cd C:\dev\workflow-mcp

# 2. Claude Code 시작
claude

# 3. 간단한 작업 요청 (자동으로 협업 모드 활성화되어야 함)
"README.md 파일을 수정해주세요"
```

이제 Claude Code가 자동으로 협업 워크플로를 따르게 됩니다!