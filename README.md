# 🚀 WorkflowMCP - AI-Integrated Project Management Platform

완전한 소프트웨어 개발 생명주기(SDLC)를 관리하는 AI 통합 프로젝트 관리 플랫폼입니다.

[![Version](https://img.shields.io/badge/version-2.7.0-blue.svg)](https://github.com/foswmine/workflow-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Claude](https://img.shields.io/badge/Claude%20Code-Integrated-orange.svg)](https://claude.ai/code)

## 🎯 **Phase 2.7 완성 - 완전한 프로젝트 관리 플랫폼**

### ✅ **핵심 시스템 구성**

| 시스템 | 상태 | 설명 |
|--------|------|------|
| **🗄️ MCP 서버** | ✅ 완성 | 35개 AI 통합 관리 도구 |
| **🌐 웹 대시보드** | ✅ 완성 | SvelteKit 기반 실시간 UI |
| **📊 시각화** | ✅ 완성 | Chart.js + D3.js 대시보드 |
| **📝 문서 관리** | ✅ 완성 | SQLite 기반 중앙화 시스템 |
| **🔄 워크플로우** | ✅ 완성 | Kanban + 의존성 관리 |

### 🛠️ **완전한 MCP 도구 세트 (35개)**

#### **📋 PRD 관리 (8개)**
```javascript
create_prd()           // PRD 생성
list_prds()           // PRD 목록 조회
get_prd()             // PRD 상세 조회
update_prd()          // PRD 업데이트
delete_prd()          // PRD 삭제
validate_prd()        // PRD 유효성 검사
link_prd_to_plan()    // PRD-Plan 연결
get_linked_data()     // 연결 데이터 조회
```

#### **📋 작업 관리 (10개)**
```javascript
create_task()         // 작업 생성
list_tasks()          // 작업 목록 조회
get_task()            // 작업 상세 조회
update_task()         // 작업 업데이트
delete_task()         // 작업 삭제
add_task_dependency() // 작업 의존성 추가
remove_task_dependency() // 의존성 제거
get_task_dependencies() // 의존성 조회
auto_update_task_status() // 자동 상태 업데이트
validate_workflow()   // 워크플로우 검증
```

#### **📅 계획 관리 (8개)**
```javascript
create_plan()         // 계획 생성
list_plans()          // 계획 목록 조회
get_plan()            // 계획 상세 조회
update_plan()         // 계획 업데이트
delete_plan()         // 계획 삭제
link_plan_to_tasks()  // 계획-작업 연결
sync_plan_progress()  // 진행률 동기화
get_progress_timeline() // 진행 타임라인
```

#### **📄 문서 관리 (9개) - Phase 2.7 신규**
```javascript
create_document()     // 문서 생성
list_documents()      // 문서 목록 조회
get_document()        // 문서 상세 조회
update_document()     // 문서 업데이트
delete_document()     // 문서 삭제
search_documents()    // 문서 검색 (FTS)
link_documents()      // 문서 간 링크
get_document_relations() // 문서 관계 조회
get_document_summary() // 문서 요약
```

### 🌐 **웹 대시보드 - 완전한 CRUD 인터페이스**

**접속**: `http://localhost:3301`

#### **📊 메인 대시보드**
- 프로젝트 개요 및 통계
- 작업 활동 차트 (Chart.js)
- 우선순위 분포도
- 프로젝트 타임라인 (D3.js 간트 차트)

#### **📋 관리 페이지들**
- **PRD 관리** (`/prds`) - 요구사항 문서 카드 뷰
- **작업 관리** (`/tasks`) - Kanban 보드 (3단계 워크플로우)
- **계획 관리** (`/plans`) - 진행률 추적 시스템
- **데이터베이스** (`/database`) - 직접 데이터 관리

#### **🔧 생성 페이지들**
- **새 PRD 작성** (`/prds/new`) - 요구사항/인수조건 관리
- **새 작업 추가** (`/tasks/new`) - 계획 연결 및 미리보기
- **새 계획 작성** (`/plans/new`) - 일정 및 진행률 설정

## 🚀 **빠른 시작**

### 1. 환경 설정
```bash
git clone https://github.com/foswmine/workflow-mcp.git
cd workflow-mcp

# MCP 서버 의존성 설치
npm install

# 웹 대시보드 의존성 설치
cd dashboard
npm install
```

### 2. 데이터베이스 초기화
```bash
# SQLite 데이터베이스 스키마 생성
cd src/database
node simple-migrate.js
```

### 3. MCP 서버 등록
`.mcp.json` 설정:
```json
{
  "mcpServers": {
    "workflow-mcp": {
      "command": "node",
      "args": ["src/index.js"],
      "type": "stdio",
      "env": {}
    }
  }
}
```

### 4. 웹 대시보드 실행
```bash
cd dashboard
npm run dev
# 접속: http://localhost:3301
```

### 5. Claude Code에서 MCP 사용
```bash
# Claude Code 세션에서
/mcp  # MCP 서버 연결 확인

# 기본 사용 예시
create_prd({
  "title": "사용자 인증 시스템", 
  "description": "JWT 기반 로그인 시스템"
})

get_project_dashboard()
```

## 📖 **주요 특징**

### 🤖 **AI 기반 워크플로우**
- **Claude Code 완전 통합**: 자연어로 프로젝트 관리
- **MCP 기반 자동화**: 35개 전문 도구 제공
- **지능형 의존성 관리**: 순환 의존성 자동 탐지
- **AI 문서 분석**: 요구사항 자동 추출 및 구조화

### 🏗️ **엔터프라이즈급 아키텍처**
- **SQLite 데이터베이스**: ACID 트랜잭션 보장
- **SvelteKit 프론트엔드**: 현대적 반응형 UI
- **RESTful API**: 완전한 CRUD 인터페이스  
- **실시간 동기화**: 멀티 세션 안전성

### 📊 **고급 시각화**
- **Chart.js 통합**: 작업 활동, 우선순위 차트
- **D3.js 간트 차트**: 프로젝트 타임라인 시각화
- **Kanban 보드**: 드래그 앤 드롭 작업 관리
- **진행률 추적**: 실시간 프로젝트 상태 모니터링

### 📝 **통합 문서 관리**
- **중앙화된 저장소**: 모든 프로젝트 문서 한곳에
- **Full-Text Search**: SQLite FTS 기반 고속 검색
- **문서 관계**: 문서 간 링크 및 의존성 추적
- **버전 관리**: 문서 히스토리 및 변경 추적

## 🎯 **완전한 SDLC 워크플로우**

### 📋 **1. 요구사항 관리**
```mermaid
graph LR
    A[PRD 작성] --> B[요구사항 정의]
    B --> C[인수조건 설정]
    C --> D[우선순위 결정]
    D --> E[검증 완료]
```

### 📅 **2. 프로젝트 계획**  
```mermaid
graph LR
    A[계획 생성] --> B[마일스톤 설정]
    B --> C[일정 계획]
    C --> D[리소스 할당]
    D --> E[진행률 추적]
```

### ✅ **3. 작업 실행**
```mermaid
graph LR
    A[작업 생성] --> B[의존성 설정]
    B --> C[상태 관리]
    C --> D[진행 추적]
    D --> E[완료 확인]
```

### 📊 **4. 모니터링 & 분석**
```mermaid
graph LR
    A[실시간 대시보드] --> B[성과 분석]
    B --> C[병목 탐지]
    C --> D[최적화 제안]
    D --> E[지속 개선]
```

## 🛠️ **실제 사용 시나리오**

### 시나리오 1: 새 프로젝트 시작
```javascript
// 1. PRD 생성
create_prd({
  title: "이커머스 플랫폼",
  description: "B2C 온라인 쇼핑몰 구축",
  requirements: [
    "사용자 회원가입/로그인",
    "상품 카탈로그 관리", 
    "장바구니 및 주문 처리",
    "결제 시스템 연동"
  ],
  acceptance_criteria: [
    "동시 사용자 1000명 처리",
    "페이지 로딩 시간 3초 이내",
    "99.9% 업타임 보장"
  ],
  priority: "high"
})

// 2. 계획 수립
create_plan({
  title: "이커머스 개발 계획 Q1",
  description: "1분기 MVP 출시 목표",
  start_date: "2025-01-01",
  end_date: "2025-03-31",
  status: "active"
})

// 3. PRD와 계획 연결
link_prd_to_plan({
  prd_id: "prd_xxx",
  plan_id: "plan_xxx"
})
```

### 시나리오 2: 작업 관리 및 의존성
```javascript
// 백엔드 작업 생성
create_task({
  title: "사용자 인증 API 개발",
  description: "JWT 기반 인증 시스템",
  priority: "high",
  status: "pending",
  due_date: "2025-01-15",
  plan_id: "plan_xxx"
})

// 프론트엔드 작업 생성  
create_task({
  title: "로그인 페이지 개발",
  description: "React 기반 로그인 UI",
  priority: "medium", 
  status: "pending",
  due_date: "2025-01-20"
})

// 의존성 설정 (프론트엔드는 백엔드 완료 후 가능)
add_task_dependency({
  dependent_task_id: "task_frontend_xxx",
  prerequisite_task_id: "task_backend_xxx"
})

// 백엔드 완료 시 자동으로 프론트엔드 작업 활성화
auto_update_task_status()
```

### 시나리오 3: 문서 관리 및 지식 축적
```javascript
// 기술 문서 생성
create_document({
  title: "API 설계 명세서",
  content: "RESTful API 설계 가이드라인과 엔드포인트 명세...",
  doc_type: "technical",
  category: "architecture", 
  tags: "api,rest,backend"
})

// 문서 검색
search_documents({
  query: "authentication JWT",
  doc_type: "technical"
})

// 문서 간 관계 설정
link_documents(doc1_id, doc2_id, "references")
```

## 📊 **데이터 모델**

### SQLite 스키마
```sql
-- PRDs (프로젝트 요구사항 문서)
CREATE TABLE prds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,  -- JSON array
    acceptance_criteria TEXT,  -- JSON array
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks (작업)
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    plan_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Plans (계획)
CREATE TABLE plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents (문서) - Phase 2.7 신규
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-Text Search 지원
CREATE VIRTUAL TABLE documents_fts USING fts5(
    title, content, tags
);
```

## 🧪 **테스트 & 품질 보증**

### Phase 2.7 테스트 결과
- ✅ **100% 테스트 통과** (45분 종합 테스트)
- ✅ **0개 실패**, **0개 부분 통과** 
- ✅ **우수한 성능**: 페이지 로딩 511ms (기준 3초 대비 83% 우수)
- ✅ **완전한 기능**: 35개 MCP 도구 모두 정상 작동

### 성능 지표
```
🚀 페이지 로딩: 511ms (기준: 3초) - 83% 우수
⚡ API 응답: <50ms (기준: 1초) - 95% 우수  
🔗 MCP 연결: 232ms (기준: 1초) - 77% 우수
💻 메모리 사용: 정상 범위
🔄 동시 접속: 안정적 처리
```

### 테스트 문서
- `docs/PHASE_2.7_FINAL_TEST_REPORT.md` - 최종 테스트 보고서
- `claudedocs/phase-2.7-comprehensive-test-document.md` - 종합 테스트 가이드  
- `claudedocs/workflowmcp-user-guide.md` - 사용자 매뉴얼

## 📁 **프로젝트 구조**

```
workflow-mcp/
├── src/
│   ├── index.js                 # 🎯 메인 MCP 서버 (4,500+ 라인)
│   ├── database/
│   │   ├── schema.sql           # SQLite 스키마 정의
│   │   └── simple-migrate.js    # 데이터베이스 마이그레이션
│   └── utils/
│       └── FileStorage.js       # JSON 백업 저장소
├── dashboard/                   # 🌐 SvelteKit 웹 대시보드
│   ├── src/
│   │   ├── routes/              # 페이지 라우트
│   │   │   ├── +page.svelte    # 메인 대시보드
│   │   │   ├── prds/           # PRD 관리
│   │   │   ├── tasks/          # 작업 관리 (Kanban)
│   │   │   ├── plans/          # 계획 관리
│   │   │   └── database/       # DB 직접 관리
│   │   ├── lib/
│   │   │   ├── components/     # Svelte 컴포넌트
│   │   │   └── server/         # 서버 로직
│   │   └── app.html
│   ├── static/                 # 정적 자원
│   └── package.json
├── data/
│   ├── workflow.db             # 🗄️ SQLite 데이터베이스
│   ├── prds/                   # PRD JSON 백업
│   ├── tasks/                  # Task JSON 백업
│   └── plans/                  # Plan JSON 백업
├── docs/                       # 📚 문서
│   └── PHASE_2.7_FINAL_TEST_REPORT.md
├── claudedocs/                 # 📖 사용자 가이드
│   ├── workflowmcp-user-guide.md
│   └── phase-2.7-comprehensive-test-document.md
└── schemas/
    └── prd-schema.js           # 데이터 검증 스키마
```

## 🔮 **향후 계획**

### Phase 3: Migration & Integration
- **데이터 마이그레이션 도구**: GitHub Issues, Jira, Trello 연동
- **API 통합 레이어**: 외부 시스템 연동 인터페이스
- **하이브리드 모드**: 기존 도구와 동시 사용
- **웹훅 시스템**: 실시간 외부 시스템 동기화

### Phase 4: Enterprise Features  
- **멀티 프로젝트**: 포트폴리오 레벨 관리
- **팀 협업**: 실시간 댓글, @멘션, 알림
- **고급 분석**: 번다운 차트, 속도 측정, 예측 분석
- **보안 강화**: SSO, 감사 로그, 권한 관리

## 🏆 **기존 도구 대비 장점**

| 기능 | WorkflowMCP | Jira | GitHub Issues | Notion |
|------|------------|------|---------------|--------|
| **AI 통합** | ✅ Claude 완전 연동 | ❌ | ❌ | 🟡 일부 |
| **설치 복잡도** | ✅ 간단 (로컬) | ❌ 복잡 | ✅ 불필요 | ✅ 불필요 |
| **커스터마이징** | ✅ 완전 자유 | 🟡 제한적 | 🟡 제한적 | 🟡 제한적 |
| **문서 통합** | ✅ 내장 시스템 | 🟡 별도 도구 | 🟡 Wiki | ✅ 강력 |
| **비용** | ✅ 무료 | ❌ 유료 | 🟡 제한적 무료 | 🟡 제한적 무료 |
| **데이터 소유권** | ✅ 완전 통제 | ❌ 벤더 락인 | 🟡 제한적 | ❌ 벤더 락인 |
| **개발자 친화적** | ✅ 코드 기반 | 🟡 보통 | ✅ 우수 | 🟡 보통 |

## 🤝 **기여하기**

### 개발 환경 설정
```bash
git clone https://github.com/foswmine/workflow-mcp.git
cd workflow-mcp

# 백엔드 개발
npm install
npm run dev

# 프론트엔드 개발  
cd dashboard
npm install
npm run dev
```

### 기여 방법
1. Fork this repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`  
5. Open Pull Request

## 📝 **라이선스**

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 🙋‍♂️ **지원 & 커뮤니티**

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **문서**: `claudedocs/workflowmcp-user-guide.md`
- **테스트 가이드**: `claudedocs/phase-2.7-comprehensive-test-document.md`
- **API 문서**: MCP 서버 내장 help 시스템

---

## 🎉 **성과 요약**

**WorkflowMCP v2.7**은 단순한 도구에서 **완전한 AI 통합 프로젝트 관리 플랫폼**으로 발전했습니다:

### 🏆 **주요 달성 사항**
- ✅ **35개 완전 기능 MCP 도구** - 모든 SDLC 단계 커버  
- ✅ **100% 테스트 통과** - 프로덕션 준비 완료
- ✅ **웹 대시보드 완성** - 현대적 UI/UX 제공
- ✅ **SQLite 통합** - 엔터프라이즈급 데이터 관리
- ✅ **AI 워크플로우** - Claude Code 완전 통합
- ✅ **우수한 성능** - 페이지 로딩 511ms
- ✅ **완전한 문서화** - 종합 사용자 가이드 제공

### 🎯 **사용 사례**
- **개인 개발자**: AI 기반 프로젝트 관리
- **소규모 팀**: 경량화된 협업 플랫폼  
- **스타트업**: 민첩한 개발 프로세스
- **기업팀**: 기존 도구 대체 솔루션

**이제 WorkflowMCP로 더 스마트하고 효율적인 프로젝트 관리를 경험해보세요!** 🚀

---

**Made with ❤️ and Claude Code - The Future of AI-Integrated Development**