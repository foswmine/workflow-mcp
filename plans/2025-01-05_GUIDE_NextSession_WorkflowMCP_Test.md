# 다음 세션 작업 가이드: WorkflowMCP 실제 테스트

**문서 정보**
- 문서 타입: GUIDE (작업 이어가기 가이드)
- 작성일: 2025-01-05
- 목적: 새 Claude Code 세션에서 WorkflowMCP 도구 테스트 계속하기

---

## 🎯 현재 상황 요약

### ✅ 완료된 작업 (현재 세션)
1. **WorkflowMCP Phase 1 구현 완료**
   - MCP 서버 엔트리포인트
   - PRD JSON 스키마 및 검증
   - PRD Manager 클래스  
   - 파일 기반 저장소
   - 성능 메트릭 & 에러 로깅
   - 포괄적인 테스트 케이스

2. **MCP 연결 설정 완료**
   - 테스트 서버 생성: `C:\dev\juk\edit\workflow-mcp\src\test-server.js`
   - MCP 설정 파일 생성: `C:\dev\juk\edit\.mcp.json`

3. **프로젝트 아이디어 확정**
   - **MCP Hub**: MCP 패키지 공유 및 평가 플랫폼
   - **기술 스택**: SvelteKit + Supabase + Cloudflare Pages
   - **목적**: WorkflowMCP 실제 사용 테스트

### ⏳ 대기 중인 작업
**MCP 서버가 현재 세션에서 연결되지 않아 다음 세션에서 계속해야 함**

---

## 🚀 다음 세션 즉시 실행 단계

### Step 1: MCP 연결 확인
```bash
# 새 세션 시작 후 첫 번째 명령
/mcp
```

**예상 결과**: `workflow-mcp` 서버가 목록에 나타나야 함

### Step 2: WorkflowMCP 도구 테스트
다음 두 도구가 사용 가능해야 함:
- `create_prd` - PRD 생성
- `list_prds` - PRD 목록 조회

### Step 3: MCP Hub PRD 생성 (실제 테스트)
아래 내용으로 `create_prd` 도구 호출:

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
  ]
}
```

### Step 4: 생성 결과 확인
`list_prds` 도구로 생성된 PRD 확인

---

## 🔧 기술 스택 세부사항

### 핵심 요구사항
- **Frontend**: SvelteKit (Next.js 대신 선택됨)
- **Backend**: Supabase (빠른 구현을 위해 Cloudflare Workers 대신)
- **인증**: Google OAuth (Supabase Auth 통합)
- **배포**: Cloudflare Pages
- **데이터베이스**: Supabase PostgreSQL
- **스타일링**: Tailwind CSS
- **광고**: Google AdSense

### 성능 목표
- 초기 로딩 3초 이하
- Lighthouse 90점 이상
- 월 활성 사용자 1000명 목표

---

## 📂 파일 위치 참조

### WorkflowMCP 파일들
```
C:\dev\juk\edit\workflow-mcp\
├── src\
│   ├── test-server.js          # 테스트용 MCP 서버 (현재 활성화)
│   ├── index.js               # 완전한 MCP 서버 (Phase 1 완료)
│   └── models\PRDManager.js   # PRD 관리 클래스
├── .mcp.json                  # MCP 서버 설정
└── package.json
```

### 계획 문서들
```
C:\dev\juk\edit\plans\
├── 2025-01-05_RESULT_WorkflowMCP_KeyAchievements.md     # Phase 1 성과
├── 2025-01-05_TASK_WorkflowMCP_DetailedBreakdown.md    # 상세 작업 분해
└── 2025-01-05_PRD_WorkflowMCP_DetailedRequirements.md  # WorkflowMCP PRD
```

---

## ⚠️ 문제 해결 가이드

### MCP 서버가 연결되지 않는 경우
1. `.mcp.json` 파일 경로 확인
2. Node.js 경로 확인
3. 디버그 모드로 실행: `claude --debug`

### 도구 호출 실패하는 경우
1. JSON 형식 확인
2. 필수 파라미터 누락 여부 확인
3. 테스트 서버 로그 확인

### 백업 계획
MCP 연결이 실패하면 수동으로 PRD 작성 후 나중에 full MCP 서버로 테스트

---

## 🎯 다음 세션 목표

1. **WorkflowMCP 도구 실제 테스트** ✅
2. **MCP Hub PRD 완전 생성** ✅  
3. **PRD 기반 Task 분해 테스트** (Phase 2 기능 부분 구현 필요)
4. **실사용성 검증 및 피드백** ✅

---

## 💡 추가 테스트 아이디어

생성한 PRD가 잘 동작하면 추가로 테스트할 수 있는 것들:
1. 복잡한 요구사항을 가진 다른 PRD 생성
2. 한국어 vs 영어 PRD 비교
3. 잘못된 입력에 대한 에러 처리
4. 생성된 PRD의 완성도 평가

---

**다음 세션 첫 명령어**: `/mcp` → `create_prd` 도구 테스트 시작! 🚀

**중요**: 이 가이드 문서를 꼭 먼저 읽고 시작하세요!