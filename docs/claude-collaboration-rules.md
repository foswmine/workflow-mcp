# Claude Code 협업 자동화 규칙

## 🤖 자동 협업 워크플로

### 세션 관리
```javascript
// 프로젝트 시작 시 자동 실행
const SESSION_CONFIG = {
  project_id: getProjectName(),
  agent_type: detectRole(), // "developer" 또는 "supervisor"
  agent_name: `Claude ${getRole()} ${getInstanceId()}`,
  auto_heartbeat: true,
  heartbeat_interval: 60000 // 1분
};

// 세션 시작 (첫 작업 요청 시 자동)
global.COLLABORATION_SESSION = await mcp__workflow-mcp__start_agent_session(SESSION_CONFIG);
```

### 지능형 협업 트리거

#### 1. 파일 수정 시 자동 알림
```javascript
// 파일 수정 후 자동 실행 조건:
// - 3개 이상 파일 변경
// - 100+ 라인 변경  
// - 중요 파일 변경 (package.json, schema, config 등)

await mcp__workflow-mcp__update_task_progress({
  task_id: getCurrentTaskId(),
  agent_session_id: global.COLLABORATION_SESSION.session_id,
  work_description: getWorkSummary(),
  files_modified: getModifiedFiles(),
  progress_percentage: estimateProgress()
});

// 팀에게 브로드캐스트
await smartSendMessage({
  message_type: "progress_update",
  subject: `진행: ${getCurrentTask()}`,
  content: getDetailedProgress()
});
```

#### 2. 승인 요청 자동화
```javascript
// 다음 경우 자동 승인 요청:
// - 새 의존성 추가
// - 데이터베이스 스키마 변경
// - API 인터페이스 변경
// - 아키텍처 수정

const APPROVAL_TRIGGERS = [
  /package\.json/,
  /schema\.sql/,
  /\.env/,
  /docker/i,
  /config/i
];

if (shouldRequestApproval(modifiedFiles)) {
  await mcp__workflow-mcp__request_approval({
    requester_session_id: global.COLLABORATION_SESSION.session_id,
    workflow_type: determineWorkflowType(changes),
    title: `승인 요청: ${summarizeChanges()}`,
    description: getDetailedChangeDescription()
  });
}
```

#### 3. 슈퍼바이저 부재 시 대체 전략
```javascript
async function smartCollaboration() {
  const teamStatus = await mcp__workflow-mcp__get_active_sessions({});
  const supervisors = teamStatus.sessions.filter(s => s.agent_type === 'supervisor');
  
  if (supervisors.length === 0) {
    // 전략 1: 피어 리뷰 모드
    const developers = teamStatus.sessions.filter(s => 
      s.agent_type === 'developer' && 
      s.id !== global.COLLABORATION_SESSION.session_id
    );
    
    if (developers.length > 0) {
      console.log("👥 피어 리뷰 모드 활성화");
      global.REVIEW_MODE = "peer";
      global.REVIEWER_ID = selectBestReviewer(developers);
      return;
    }
    
    // 전략 2: 자동 승인 + 로깅
    console.log("🤖 자율 개발 모드 (로깅 강화)");
    global.REVIEW_MODE = "autonomous";
    global.ENHANCED_LOGGING = true;
  } else {
    // 전략 3: 표준 계층적 협업
    console.log("👨‍💼 슈퍼바이저 협업 모드");
    global.REVIEW_MODE = "hierarchical";
    global.SUPERVISOR_ID = supervisors[0].id;
  }
}
```

#### 4. 다중 개발자 지원
```javascript
// N명의 개발자 + 1명의 슈퍼바이저 패턴
class TeamCollaboration {
  async broadcastProgress(workDescription) {
    const team = await mcp__workflow-mcp__get_active_sessions({
      project_id: SESSION_CONFIG.project_id
    });
    
    // 모든 팀원에게 진행상황 브로드캐스트
    await mcp__workflow-mcp__send_message({
      from_session_id: global.COLLABORATION_SESSION.session_id,
      to_session_id: null, // 브로드캐스트
      message_type: "progress_update",
      subject: `${SESSION_CONFIG.agent_name}: ${getCurrentTask()}`,
      content: workDescription,
      priority: "normal"
    });
  }
  
  async checkForConflicts(files) {
    // 동시 수정 파일 충돌 감지
    const recentActivity = await mcp__workflow-mcp__get_collaboration_dashboard({
      project_id: SESSION_CONFIG.project_id,
      time_range: "1hour"
    });
    
    const conflictingFiles = detectFileConflicts(files, recentActivity);
    
    if (conflictingFiles.length > 0) {
      await mcp__workflow-mcp__send_message({
        message_type: "status_alert",
        subject: "⚠️ 파일 충돌 감지",
        content: `다음 파일들이 동시 수정 중입니다: ${conflictingFiles.join(', ')}`,
        priority: "urgent"
      });
    }
  }
}
```

### 역할별 자동화 패턴

#### Developer Claude 행동:
1. **작업 시작**: 자동 세션 시작 + 팀 알림
2. **코딩 중**: 주기적 진행상황 업데이트  
3. **중요 변경**: 자동 승인 요청
4. **완료**: 최종 승인 요청 + 세션 정리
5. **오류 시**: 즉시 도움 요청

#### Supervisor Claude 행동:
1. **모니터링**: 팀 상태 주기적 확인
2. **메시지 처리**: 승인 요청 신속 처리
3. **개입**: 필요시 방향 제시
4. **품질 관리**: 코드 품질 검토
5. **팀 조율**: 작업 분배 및 우선순위 조정

### 스마트 트리거 조건
- **즉시 알림**: critical/urgent 상황
- **정기 업데이트**: 30분마다 진행상황
- **승인 요청**: 중요 변경사항 발생 시
- **충돌 감지**: 동시 파일 수정 시
- **완료 보고**: 작업 단위 완료 시

### 설정 최적화
```javascript
// 환경별 설정
const COLLABORATION_CONFIG = {
  development: {
    message_frequency: "high",
    approval_threshold: "medium", 
    auto_approve_minor: true
  },
  production: {
    message_frequency: "critical_only",
    approval_threshold: "low",
    auto_approve_minor: false
  }
};
```