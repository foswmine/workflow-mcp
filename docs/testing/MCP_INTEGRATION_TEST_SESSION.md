# MCP 통합 테스트 세션 재시작 가이드

## 🎯 테스트 목적
프로젝트→요구사항→설계→작업→테스트까지 전체 워크플로우의 **연결된 항목들 관리** 중심 통합 테스트

## 📋 현재 상황
- 대시보드 테스트 관리 기능 분석 완료
- MCP 테스트 도구 개선 완료 (정렬 기능, 연결 관리 도구 3개 추가)
- 데이터베이스 관리 기능 분석 완료 (추가 MCP 도구 불필요 결론)
- **MCP 서버 연결 문제로 통합 테스트 중단됨**

## 🔧 MCP 서버 설정 확인사항
- `.mcp.json` 파일 위치: `C:\dev\workflow-mcp\.mcp.json`
- workflow-mcp 서버 설정:
  ```json
  {
    "mcpServers": {
      "workflow-mcp": {
        "command": "node",
        "args": ["./src/index.js"],
        "type": "stdio",
        "env": {}
      }
    }
  }
  ```

## 🧪 필요한 통합 테스트 시나리오

### 1단계: MCP 서버 연결 확인
```javascript
// Claude Code 재시작 후 즉시 실행
ListMcpResourcesTool() // workflow-mcp 서버 확인
```

### 2단계: 프로젝트-PRD 연결 테스트
```javascript
// 1. PRD 생성
mcp__workflow-mcp__create_prd({
  title: "통합 테스트 프로젝트 PRD",
  description: "프로젝트부터 테스트까지 전체 워크플로우 연결 관리 테스트",
  requirements: ["사용자 인증", "데이터 관리", "API 연동", "테스트 자동화"],
  priority: "High"
})

// 2. 프로젝트 생성 (만약 관련 도구가 있다면)
// 또는 기존 프로젝트와 연결
```

### 3단계: 설계-PRD 연결 테스트
```javascript
// PRD ID를 사용해서 설계 생성
mcp__workflow-mcp__create_design({
  title: "사용자 인증 시스템 설계",
  description: "JWT 기반 인증 시스템 설계",
  design_type: "system",
  requirement_id: "[위에서 생성한 PRD ID]",
  priority: "High"
})
```

### 4단계: 작업-설계 연결 테스트
```javascript
// 설계 ID를 사용해서 작업 생성
mcp__workflow-mcp__create_task({
  title: "JWT 토큰 생성 API 구현",
  description: "사용자 인증용 JWT 토큰 생성 API 개발",
  design_id: "[위에서 생성한 설계 ID]",
  prd_id: "[PRD ID]",
  priority: "High",
  status: "pending"
})
```

### 5단계: 테스트-전체 연결 테스트
```javascript
// 모든 연결을 포함한 테스트 케이스 생성
mcp__workflow-mcp__create_test_case({
  title: "JWT 토큰 생성 API 테스트",
  description: "JWT 토큰 생성 및 검증 테스트",
  type: "integration",
  task_id: "[위에서 생성한 작업 ID]",
  design_id: "[설계 ID]",
  prd_id: "[PRD ID]",
  priority: "High"
})
```

### 6단계: 연결 관리 도구 테스트
```javascript
// 새로 구현한 연결 관리 도구들 테스트
mcp__workflow-mcp__get_test_connections({ test_case_id: "[테스트 케이스 ID]" })
mcp__workflow-mcp__add_test_connection({ test_case_id: "[ID]", entity_type: "task", entity_id: "[작업 ID]" })
mcp__workflow-mcp__remove_test_connection({ test_case_id: "[ID]", entity_type: "design", entity_id: "[설계 ID]" })
```

### 7단계: 대시보드 검증
브라우저에서 다음 페이지들 확인:
- http://localhost:3301/prds - PRD 목록에서 생성된 항목 확인
- http://localhost:3301/designs - 설계 목록에서 PRD 연결 확인
- http://localhost:3301/tasks - 작업 목록에서 설계 연결 확인  
- http://localhost:3301/tests - 테스트 목록에서 모든 연결 확인
- http://localhost:3301/network - 네트워크 뷰에서 연결 관계 시각화 확인

## 🎯 테스트 성공 기준
1. **MCP 도구 작동**: 모든 생성/연결 도구가 정상 작동
2. **연결 관계 저장**: 데이터베이스에 올바른 연결 관계 저장
3. **대시보드 동기화**: 대시보드에서 연결 관계 시각화 확인
4. **새 연결 도구 작동**: get_test_connections, add_test_connection, remove_test_connection 정상 작동

## 🚨 예상되는 문제점
1. MCP 서버 연결 이슈 - Claude Code 재시작 필요
2. 데이터베이스 동기화 문제 - npm start 프로세스 재시작 필요
3. 대시보드 업데이트 지연 - 브라우저 새로고침 필요

## 📝 테스트 결과 기록
테스트 완료 후 `docs/MCP_INTEGRATION_TEST_RESULTS.md` 파일에 결과 기록 예정

---
**⚠️ 중요**: 이 문서는 Claude Code 재시작 후 첫 번째로 읽어야 할 문서입니다.