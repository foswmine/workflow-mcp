# 🚨 CRITICAL: WorkflowMCP 연결 상태 및 다음 세션 실행 가이드

**문서 정보**
- 문서 타입: CRITICAL STATUS (즉시 실행 필요)
- 작성일: 2025-01-05 15:30
- 상황: WorkflowMCP Phase 1 개발 완료, 연결 테스트 단계
- 긴급도: 🔴 HIGH - Claude Code 재시작 후 즉시 실행 필요

---

## 🎯 **현재 상황 요약**

### ✅ **성공한 작업들**
1. **WorkflowMCP Phase 1 완전 개발 완료**
   - `src/index.js` - 완전한 MCP 서버
   - `src/test-server.js` - 테스트용 간단 서버
   - `src/models/PRDManager.js` - PRD 관리 시스템
   - `schemas/prd-schema.js` - 완전한 검증 스키마
   - 모든 유틸리티 클래스 (FileStorage, MetricsCollector, ErrorLogger)
   - 포괄적인 테스트 케이스

2. **MCP 서버 등록 성공**
   ```bash
   # 다음 명령어로 성공적으로 등록됨
   claude mcp add workflow-mcp --scope user -- node "C:\\dev\\juk\\edit\\workflow-mcp\\src\\test-server.js"
   ```
   - User 스코프에 정상 등록
   - `claude mcp list`에서 workflow-mcp 확인됨

3. **파일 구조 완벽 준비**
   - 모든 의존성 설치 완료 (`npm install`)
   - ES Modules 설정 완료
   - 경로 설정 정확

### ⚠️ **핵심 문제 (해결됨)**
- **현재 실행 중인 Claude Code 세션이 새로 추가된 MCP 서버를 인식하지 못함**
- 디버그 로그에 workflow-mcp 관련 로그가 전혀 없음
- Claude Code는 시작 시점의 설정만 로드하고 runtime 추가 서버는 미인식

**원인:** Claude Code의 MCP 서버 로딩 방식 - 시작 시에만 설정 읽음

---

## 🚀 **다음 세션 즉시 실행 단계**

### Step 1: Claude Code 완전 재시작 (필수)
```bash
# 현재 Claude 세션 완전 종료
# 새로운 터미널에서 시작
cd C:\dev\juk\edit
claude
```

### Step 2: MCP 연결 즉시 확인 (첫 번째 명령어)
```bash
/mcp
```

**예상 결과:** workflow-mcp가 ✓ Connected 상태로 나타나야 함

### Step 3: WorkflowMCP 도구 테스트
다음 도구들이 사용 가능해야 함:
- `mcp__workflow_mcp__create_prd` - PRD 생성
- `mcp__workflow_mcp__list_prds` - PRD 목록 조회

### Step 4: MCP Hub PRD 생성 (실전 테스트)
`create_prd` 도구를 다음 JSON으로 호출:

```json
{
  "title": "MCP Hub - MCP 패키지 공유 및 평가 플랫폼",
  "description": "개발자들이 MCP(Model Context Protocol) 패키지와 사용자 정의 명령어를 공유하고 평가할 수 있는 커뮤니티 플랫폼. SvelteKit + Supabase 기반으로 빠르고 간단한 구현을 목표로 함.",
  "requirements": [
    "사용자는 Google OAuth를 통해 로그인할 수 있어야 함",
    "MCP 패키지를 GitHub 링크로 등록할 수 있어야 함", 
    "사용자 정의 명령어(슬래시 커맨드)를 공유할 수 있어야 함",
    "패키지에 대한 별점 평가 및 리뷰 작성이 가능해야 함",
    "태그 기반 검색 및 필터링 기능이 있어야 함",
    "패키지 사용량 통계를 표시해야 함",
    "Google AdSense 광고가 통합되어야 함",
    "Cloudflare Pages에 배포 가능해야 함",
    "Supabase를 통한 실시간 데이터 동기화가 지원되어야 함",
    "반응형 웹 디자인이 적용되어야 함"
  ],
  "priority": "High"
}
```

### Step 5: 성공 검증
`list_prds` 도구로 생성된 PRD 확인

---

## 🔧 **기술적 세부사항**

### 등록된 MCP 서버 정보
```json
{
  "workflow-mcp": {
    "type": "stdio",
    "command": "node",
    "args": ["C:\\dev\\juk\\edit\\workflow-mcp\\src\\test-server.js"],
    "env": {}
  }
}
```

### 구현된 MCP 도구 목록
1. **create_prd** - 새 PRD 생성
2. **list_prds** - PRD 목록 조회 (상태별 필터 지원)
3. **get_prd** - 특정 PRD 상세 조회
4. **update_prd** - PRD 업데이트

### 파일 위치 참조
```
C:\dev\juk\edit\workflow-mcp\
├── src\
│   ├── test-server.js          # 현재 등록된 테스트 서버
│   ├── index.js               # 완전한 MCP 서버 (Phase 1 완료)
│   └── models\PRDManager.js   # PRD 관리 클래스
├── schemas\prd-schema.js       # PRD 스키마 정의
└── package.json               # 의존성 설정
```

---

## 🚨 **실패 시 문제해결**

### MCP 연결 실패 시
```bash
# 설정 확인
claude mcp list

# 재등록 (필요시)
claude mcp remove workflow-mcp
claude mcp add workflow-mcp --scope user -- node "C:\\dev\\juk\\edit\\workflow-mcp\\src\\test-server.js"
```

### 서버 직접 테스트
```bash
# 서버 파일 직접 실행 확인
cd C:\dev\juk\edit\workflow-mcp
node src/test-server.js
```

### 디버그 모드
```bash
# 상세한 연결 로그 확인
claude --debug
```

---

## 🎯 **성공 기준**

1. ✅ `/mcp` 명령어에서 workflow-mcp가 ✓ Connected로 표시
2. ✅ `create_prd` 도구로 MCP Hub PRD 생성 성공
3. ✅ `list_prds` 도구로 생성된 PRD 조회 성공
4. ✅ 도구 응답이 올바른 JSON 형식으로 반환

**성공하면:** WorkflowMCP Phase 1 완전 검증 완료, Phase 2 개발 시작 가능

---

## 📋 **다음 세션 체크리스트**

- [ ] Claude Code 재시작
- [ ] `/mcp` 명령어로 workflow-mcp 연결 확인
- [ ] `create_prd` 도구로 MCP Hub PRD 생성
- [ ] `list_prds` 도구로 PRD 목록 확인
- [ ] 성공 시 Phase 2 개발 계획 수립

---

**⚡ 중요:** 이 문서의 단계들은 순서대로 정확히 실행해야 합니다. 특히 Claude Code 재시작이 핵심입니다!

**📞 연락처:** 문제 발생 시 이 문서의 "실패 시 문제해결" 섹션 참조