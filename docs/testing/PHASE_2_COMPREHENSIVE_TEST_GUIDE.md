# 🧪 WorkflowMCP Phase 2 종합 테스트 가이드

**테스트 대상**: WorkflowMCP Phase 2 완성 버전 (26개 MCP 도구)  
**테스트 소요시간**: 약 25-30분  
**테스트 환경**: 새로운 Claude Code 세션에서 실행

---

## ⚠️ **중요 사전 조건**

### 🚨 **필수: 새 세션 시작 요구사항**

**기존 테스트 세션은 반드시 재시작해야 합니다!**

**이유:**
- MCP 서버 소스코드가 Phase 2로 대폭 확장됨 (26개 도구)
- Claude Code는 시작 시에만 MCP 서버를 로드
- 기존 세션은 이전 버전의 서버를 계속 사용 중
- 새로운 Phase 2 도구들이 인식되지 않음

**필수 절차:**
1. ✅ 현재 모든 Claude Code 세션 **완전 종료**
2. ✅ 새로운 터미널에서 `claude` 실행  
3. ✅ 첫 번째 명령어: `/mcp` (연결 확인)

---

## 📋 **테스트 절차 (순서대로 실행)**

### 1️⃣ **연결 확인 및 도구 수 검증 (필수 첫 단계)**

**실행 명령:**
```
/mcp
```

**기대 결과:**
- `workflow-mcp ✓ Connected` 표시
- **중요**: 도구 개수가 26개인지 확인 (Phase 1: 15개 → Phase 2: 26개)

**실패 시:** Claude Code 재시작 후 다시 확인

---

### 2️⃣ **기존 데이터 현황 확인 (기준점 설정)**

**실행 명령:**
```
다음 3개 도구를 사용해서 현재 저장된 데이터 현황을 확인해주세요:
1. list_prds - PRD 목록
2. list_tasks - Task 목록  
3. list_plans - Plan 목록

각각의 개수와 ID를 기록해두겠습니다.
```

**목적:** 기존 데이터 현황 파악 및 테스트 기준점 설정

---

### 3️⃣ **Phase 2-1: 안전한 삭제 기능 테스트**

#### 3-1. 새 테스트 데이터 생성
**실행 명령:**
```
Phase 2 삭제 기능 테스트를 위해 다음 테스트 데이터를 생성해주세요:

1. create_prd로 테스트용 PRD 생성:
{
  "title": "삭제 테스트용 PRD",
  "description": "Phase 2 삭제 기능 테스트를 위한 임시 PRD입니다",
  "requirements": ["기본 기능", "테스트 완료"],
  "priority": "Low"
}

2. create_task로 테스트용 Task 생성:
{
  "title": "삭제 테스트용 Task",
  "description": "Phase 2 삭제 기능 테스트를 위한 임시 Task입니다",
  "priority": "Low",
  "assignee": "테스터",
  "estimatedHours": 1
}

생성된 ID들을 기록해주세요.
```

#### 3-2. 삭제 기능 테스트
**실행 명령:**
```
방금 생성한 테스트 데이터를 사용해서 삭제 기능을 테스트해주세요:

1. delete_prd 도구로 방금 생성한 PRD 삭제
2. delete_task 도구로 방금 생성한 Task 삭제

각 삭제 작업이 성공 메시지와 함께 완료되는지 확인해주세요.
```

**검증 포인트:**
- ✅ 삭제 성공 메시지가 한글로 표시됨
- ✅ 의존성 체크가 정상 작동함
- ✅ 삭제 후 목록에서 제거됨

---

### 4️⃣ **Phase 2-2: 데이터 연결 시스템 테스트**

#### 4-1. 연결 테스트용 데이터 생성
**실행 명령:**
```
데이터 연결 시스템 테스트를 위해 다음을 생성해주세요:

1. create_prd로 연결 테스트용 PRD:
{
  "title": "연결 시스템 테스트 PRD",
  "description": "Phase 2 데이터 연결 기능을 테스트하기 위한 PRD",
  "requirements": ["Plan 연결", "Task 연결", "진행률 동기화"],
  "priority": "Medium"
}

2. create_plan으로 연결 테스트용 Plan:
{
  "title": "연결 테스트 Plan",
  "description": "PRD와 Task를 연결하는 테스트 Plan",
  "milestones": [
    {
      "title": "연결 테스트 마일스톤 1",
      "description": "첫 번째 연결 테스트",
      "dueDate": "2025-10-01T09:00:00.000Z",
      "completed": false
    },
    {
      "title": "연결 테스트 마일스톤 2", 
      "description": "두 번째 연결 테스트",
      "dueDate": "2025-10-15T09:00:00.000Z",
      "completed": true
    }
  ],
  "startDate": "2025-09-05T09:00:00.000Z",
  "endDate": "2025-10-15T09:00:00.000Z"
}

3. create_task로 연결 테스트용 Task:
{
  "title": "연결 테스트 Task",
  "description": "Plan과 연결될 테스트 Task",
  "priority": "Medium", 
  "assignee": "연결테스터",
  "estimatedHours": 8,
  "status": "done"
}

생성된 모든 ID를 기록해주세요.
```

#### 4-2. 연결 기능 테스트
**실행 명령:**
```
생성한 데이터들을 사용해서 연결 시스템을 테스트해주세요:

1. link_prd_to_plan 도구로 PRD와 Plan 연결
2. link_plan_to_tasks 도구로 Plan과 Task 연결
3. get_linked_data 도구로 연결된 데이터 전체 조회
4. sync_plan_progress 도구로 Plan 진행률 동기화 (Task가 done이므로 100%가 되어야 함)
```

**검증 포인트:**
- ✅ PRD-Plan 연결이 양방향으로 정상 설정됨
- ✅ Plan-Task 연결이 정상 설정됨
- ✅ get_linked_data에서 모든 연결 관계가 표시됨
- ✅ sync_plan_progress로 진행률이 자동 계산됨

---

### 5️⃣ **Phase 2-3: 의존성 관리 시스템 테스트**

#### 5-1. 의존성 테스트용 Task 생성
**실행 명령:**
```
의존성 관리 시스템 테스트를 위해 3개의 Task를 생성해주세요:

1. create_task - 선행 Task:
{
  "title": "의존성 테스트 - 선행 Task",
  "description": "다른 Task들의 선행 조건이 되는 Task",
  "priority": "High",
  "assignee": "의존성테스터",
  "estimatedHours": 4,
  "status": "done"
}

2. create_task - 중간 Task:
{
  "title": "의존성 테스트 - 중간 Task", 
  "description": "선행 Task에 의존하고 후행 Task의 선행 조건이 되는 Task",
  "priority": "High",
  "assignee": "의존성테스터",
  "estimatedHours": 6,
  "status": "todo"
}

3. create_task - 후행 Task:
{
  "title": "의존성 테스트 - 후행 Task",
  "description": "중간 Task에 의존하는 최종 Task", 
  "priority": "Medium",
  "assignee": "의존성테스터",
  "estimatedHours": 3,
  "status": "todo"
}

생성된 3개 Task ID를 기록해주세요.
```

#### 5-2. 의존성 설정 및 검증
**실행 명령:**
```
생성한 3개 Task로 의존성 체인을 만들어주세요:

1. add_task_dependency로 중간 Task가 선행 Task에 의존하도록 설정
2. add_task_dependency로 후행 Task가 중간 Task에 의존하도록 설정
3. get_task_dependencies로 각 Task의 의존성 확인
4. validate_workflow로 전체 워크플로 검증

순환 의존성도 테스트해주세요:
5. add_task_dependency로 선행 Task가 후행 Task에 의존하도록 설정 시도 (실패해야 함)
```

**검증 포인트:**
- ✅ 정상적인 의존성 설정이 성공함
- ✅ 의존성 체인이 올바르게 표시됨
- ✅ 순환 의존성 시도 시 오류 메시지와 함께 차단됨
- ✅ validate_workflow에서 워크플로 상태가 정확히 분석됨

#### 5-3. 자동 상태 업데이트 테스트
**실행 명령:**
```
의존성 기반 자동 상태 업데이트를 테스트해주세요:

1. auto_update_task_status 도구를 실행하여 현재 상태 분석
2. update_task로 중간 Task의 상태를 "done"으로 변경
3. auto_update_task_status를 다시 실행하여 상태 변화 확인

자동화가 올바르게 작동하는지 확인해주세요.
```

**검증 포인트:**
- ✅ 선행 Task 완료에 따른 종속 Task 상태 변화 감지
- ✅ 시작 가능한 Task 자동 식별
- ✅ 상태 업데이트 권고사항 정확히 제시

---

### 6️⃣ **Phase 2-4: 기본 대시보드 시스템 테스트**

#### 6-1. 종합 대시보드 테스트
**실행 명령:**
```
Phase 2-4 대시보드 시스템을 테스트해주세요:

1. get_project_dashboard 도구를 기본 옵션으로 실행
2. get_project_dashboard를 include_details: true 옵션으로 실행하여 상세 정보 확인
3. get_workflow_status 도구로 현재 워크플로 상태 분석
4. get_progress_timeline을 time_period: "30days" 옵션으로 실행

각 도구의 결과가 현재 데이터 상황을 정확히 반영하는지 확인해주세요.
```

**검증 포인트:**
- ✅ 대시보드에서 PRD/Task/Plan 개수가 실제와 일치함
- ✅ 상태별/우선순위별 통계가 정확함
- ✅ 워크플로 상태에서 차단된 Task와 시작 가능한 Task가 정확히 분석됨
- ✅ 진행 타임라인에서 완료된 작업과 다가오는 마감일이 표시됨

#### 6-2. 실시간 분석 검증
**실행 명령:**
```
대시보드의 실시간 분석 기능을 검증해주세요:

1. update_task로 아무 Task나 하나의 상태를 변경
2. get_workflow_status를 다시 실행하여 변경사항 반영 확인
3. get_project_dashboard로 통계 변화 확인

실시간으로 변화가 반영되는지 확인해주세요.
```

---

### 7️⃣ **통합 워크플로 검증 테스트**

**실행 명령:**
```
Phase 2의 모든 시스템이 통합적으로 잘 작동하는지 최종 검증해주세요:

1. 전체 데이터 현황 파악:
   - list_prds, list_tasks, list_plans로 현재 상태 확인
   - get_metrics로 전체 통계 확인

2. 연결된 워크플로 테스트:
   - get_linked_data로 모든 연결 관계 확인
   - validate_workflow로 전체 워크플로 상태 검증

3. 최종 대시보드:
   - get_project_dashboard (include_details: true)로 전체 프로젝트 현황 확인
   - export_data (format: "summary", dataType: "all")로 최종 요약 리포트 생성

모든 데이터가 일관성 있게 관리되고 있는지 확인해주세요.
```

**검증 포인트:**
- ✅ 모든 생성된 데이터가 정확하게 저장되어 있음
- ✅ 연결 관계가 모두 유지되고 있음
- ✅ 의존성 체인이 올바르게 설정되어 있음
- ✅ 대시보드 통계가 실제 데이터와 일치함
- ✅ 요약 리포트에 모든 도메인 데이터가 완전히 포함됨

---

## 📊 **테스트 완료 기준**

### ✅ **Phase 2 성공 기준 체크리스트**

#### 연결 및 도구 인식
- [ ] MCP 서버 정상 연결 (`workflow-mcp ✓ Connected`)
- [ ] **26개 도구** 모두 인식 및 실행 가능 (Phase 1: 15개 + Phase 2: 11개)

#### Phase 2-1: 안전한 삭제
- [ ] delete_prd, delete_task, delete_plan 모두 정상 작동
- [ ] 의존성 체크 기능 정상 작동
- [ ] 삭제 후 데이터 정리 완료

#### Phase 2-2: 데이터 연결 시스템
- [ ] PRD-Plan 연결 정상 작동
- [ ] Plan-Task 연결 정상 작동  
- [ ] get_linked_data로 연결 관계 조회 성공
- [ ] sync_plan_progress로 진행률 자동 계산 성공

#### Phase 2-3: 의존성 관리
- [ ] Task 의존성 추가/제거 성공
- [ ] 순환 의존성 탐지 및 차단 성공
- [ ] 워크플로 검증 기능 정상 작동
- [ ] 자동 상태 업데이트 기능 정상 작동

#### Phase 2-4: 기본 대시보드
- [ ] 종합 프로젝트 대시보드 정상 표시
- [ ] 워크플로 상태 분석 정상 작동
- [ ] 진행 타임라인 생성 성공
- [ ] 실시간 데이터 반영 확인

#### 데이터 무결성
- [ ] 모든 생성 데이터가 FileStorage에 정확하게 저장
- [ ] 연결 관계 양방향 무결성 유지
- [ ] 의존성 체인 정확성 유지
- [ ] ID 생성 규칙 일관성 유지

#### 한글 지원
- [ ] 모든 Phase 2 기능에서 한글 메시지 정상 표시
- [ ] 한글 데이터 입력 및 저장 정상

---

## 📋 **테스트 보고서 템플릿**

### 테스트 완료 후 다음 형식으로 결과 보고:

```
## WorkflowMCP Phase 2 종합 테스트 결과

**테스트 일시**: [현재 날짜/시간]
**테스트 소요시간**: [분]
**전체 성공률**: [성공한 기능 / 전체 기능 (26개 도구)]

### Phase 2-1: 안전한 삭제 기능
- [ ] delete_prd 성공
- [ ] delete_task 성공  
- [ ] delete_plan 성공
- [ ] 의존성 체크 정상 작동

### Phase 2-2: 데이터 연결 시스템
- [ ] PRD-Plan 연결 성공
- [ ] Plan-Task 연결 성공
- [ ] 연결 데이터 조회 성공
- [ ] 진행률 동기화 성공
- [ ] 연결 해제 성공

### Phase 2-3: 의존성 관리 시스템  
- [ ] 의존성 추가/제거 성공
- [ ] 순환 의존성 탐지 성공
- [ ] 워크플로 검증 성공
- [ ] 자동 상태 업데이트 성공

### Phase 2-4: 기본 대시보드
- [ ] 프로젝트 대시보드 성공
- [ ] 워크플로 상태 분석 성공
- [ ] 진행 타임라인 성공

### 실패한 기능 ❌
- [실패한 기능과 오류 메시지]

### 최종 데이터 현황
- 총 PRD 수: [개] (테스트 전: [개] → 테스트 후: [개])
- 총 Task 수: [개] (테스트 전: [개] → 테스트 후: [개])  
- 총 Plan 수: [개] (테스트 전: [개] → 테스트 후: [개])
- 연결 관계 수: [개]
- 의존성 관계 수: [개]

### 전체 평가
- [ ] Phase 2 목표 100% 달성 - 모든 고급 기능 정상 작동
- [ ] 부분 성공 (구체적 이슈 명시)  
- [ ] 주요 문제로 인한 테스트 실패
```

---

## ❌ **문제 발생 시 체크포인트**

### MCP 연결 문제
- [ ] `/mcp`에서 workflow-mcp가 Connected로 표시되지 않음
- [ ] 도구 개수가 26개가 아님 (이전 버전 서버 사용 중)
- [ ] 특정 Phase 2 도구가 "Unknown tool" 오류 발생
- **해결**: Claude Code 완전 재시작 필요

### Phase 2 기능 오류
- [ ] 삭제 기능 실패 또는 의존성 체크 미작동
- [ ] 연결 시스템 설정 실패
- [ ] 의존성 관리 오류 또는 순환 의존성 미탐지
- [ ] 대시보드 데이터 불일치
- **해결**: 구체적 오류 메시지와 함께 보고

### 데이터 무결성 문제
- [ ] 연결 관계 누락 또는 불일치
- [ ] 의존성 체인 파손
- [ ] 대시보드 통계와 실제 데이터 불일치
- **해결**: FileStorage 상태 및 데이터 일관성 확인 필요

---

## 🎯 **테스트 목적 및 중요성**

이 테스트는 **WorkflowMCP Phase 2의 26개 도구와 4개 고급 시스템이 모두 정상 작동하는지 종합 검증**하는 것입니다.

**테스트 범위:**
- ✅ Phase 1 기능 유지 (15개 기본 도구)
- ✅ Phase 2-1 안전한 삭제 시스템 
- ✅ Phase 2-2 데이터 연결 및 동기화 시스템
- ✅ Phase 2-3 의존성 관리 및 자동화 시스템
- ✅ Phase 2-4 실시간 대시보드 시스템
- ✅ 통합 워크플로 무결성

**성공 시:** Phase 3 개발 착수 가능 또는 실제 프로젝트 적용 가능  
**실패 시:** 문제 수정 후 재테스트 필요

---

**🚨 중요: 이 테스트는 반드시 새로운 Claude Code 세션에서 순서대로 실행해야 합니다!**

**📞 문제 발생 시:** 구체적인 오류 메시지, 실행 단계, 예상 결과와 실제 결과를 상세히 보고해주세요.

---

**테스트 가이드 버전**: Phase 2 Complete  
**문서 작성일**: 2025-09-05  
**총 예상 소요시간**: 25-30분