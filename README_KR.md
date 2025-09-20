# 🚀 WorkflowMCP - AI-Integrated Project Management Platform

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/foswmine/workflow-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Claude](https://img.shields.io/badge/Claude%20Code-Integrated-orange.svg)](https://claude.ai/code)

**AI 통합 DevOps 플랫폼** - 완전한 소프트웨어 개발 생명주기(SDLC) 관리

> 💡 **다중 AI 에이전트 협업이 필요하신가요?**
> WorkflowMCP와 함께 [Claude Swarm](https://github.com/anthropics/claude-swarm)을 사용하여 실제 다중 에이전트 오케스트레이션을 구현하세요!

## 🎯 **핵심 기능**

| 기능 | 도구 수 | 설명 |
|------|---------|------|
| **📊 프로젝트 관리** | 6개 | 프로젝트 생성, 분석, 진행률 추적 |
| **📋 요구사항 관리** | 5개 | PRD 작성, 요구사항 추적 |
| **🎨 설계 관리** | 5개 | 시스템 설계, 아키텍처 문서화 |
| **✅ 작업 관리** | 8개 | 작업 생성, 의존성, 진행 추적 |
| **🧪 테스트 관리** | 9개 | 테스트 케이스, 실행, 결과 관리 |
| **📝 문서 관리** | 10개 | 통합 문서 저장, 검색, 연결 |
| **🚀 DevOps 운영** | 12개 | 인시던트, 환경, 배포 관리 |

**총 55개+ MCP 도구** + **SvelteKit 웹 대시보드**

## 🎯 **3가지 사용 방식 선택**

WorkflowMCP는 다음 3가지 방식으로 사용할 수 있습니다. **필요에 따라 선택하세요:**

### 🤖 **1. MCP 도구 방식** (AI 통합)
**추천 대상**: Claude Code 사용자, AI 기반 자동화 선호  
**장점**: AI 네이티브 통합, 자동화, 실시간 처리  
**사용법**: 
```bash
npm start  # MCP 서버 실행
# Claude Code에서 MCP 도구 사용
```
- **[MCP 도구 가이드](docs/guides/USER_GUIDE.md)** - 55개+ MCP 도구 상세 사용법

### 🌐 **2. Dashboard API 방식** (웹 인터페이스)  
**추천 대상**: 팀 협업, 시각적 관리, 브라우저 기반 작업 선호  
**장점**: 웹 UI, 팀 협업, 시각화, 실시간 동기화  
**사용법**:
```bash
npm start                    # MCP 서버 실행 (백그라운드)
cd dashboard && npm run dev  # 웹 대시보드 실행
# http://localhost:3301 접속
```
- **[Dashboard API 가이드](docs/DASHBOARD_API_GUIDE.md)** - 웹 인터페이스 완전 가이드

### 📁 **3. 폴더/파일 구조 방식** (독립형)
**추천 대상**: 개인 프로젝트, 완전 독립성, 오프라인 작업 선호  
**장점**: 외부 의존성 없음, Git 버전 관리, 오프라인 가능  
**사용법**: 
```bash
# 폴더 구조 복사하여 사용 (서버 불필요)
```
- **[폴더 구조 가이드](docs/STANDALONE_WORKFLOW_SYSTEM.md)** - 독립형 워크플로우 시스템
- **[실습 예제](docs/api/)** - `docs/api/` 폴더에서 바로 시작

---

## 📚 **문서 가이드**

### 🚀 빠른 시작
- **[설치 및 설정](docs/guides/USER_GUIDE.md#설치-및-설정)** - 환경 설정 및 시작하기
- **[빠른 테스트](docs/testing/QUICK_TEST_CHECKLIST.md)** - 설치 후 기본 검증

### 📖 사용자 가이드  
- **[완전 사용자 가이드](docs/guides/USER_GUIDE.md)** - MCP 도구 모든 기능 상세 사용법
- **[Dashboard API 가이드](docs/DASHBOARD_API_GUIDE.md)** - 웹 인터페이스 완전 가이드
- **[폴더 구조 가이드](docs/STANDALONE_WORKFLOW_SYSTEM.md)** - 독립형 워크플로우 시스템
- **[DevOps 운영 관리](docs/guides/DEVOPS_OPERATIONS_GUIDE.md)** - 인시던트, 환경, 배포 관리
- **[문서 인덱스](docs/README.md)** - 모든 문서 목록 및 구조

### 🛠️ 개발자 가이드
- **[MCP 서버 트러블슈팅](docs/development/MCP_SERVER_TROUBLESHOOTING_GUIDE.md)** - 서버 문제 해결
- **[개발 진행 상황](docs/development/DEVELOPMENT_PROGRESS.md)** - 프로젝트 현황
- **[테스트 가이드](docs/testing/MCP_PHASE_2_9_TESTING_GUIDE.md)** - 전체 시스템 테스트

## 🚀 **빠른 시작**

### 1. 설치 및 실행
```bash
# 의존성 설치
npm install

# MCP 서버 시작 (Claude Code 연동)
npm start

# 웹 대시보드 시작 (별도 터미널)
cd dashboard && npm install && npm run dev
```

### 2. 접속 확인
- **Claude Code**: MCP 서버 연결 - `/mcp` 명령 확인  
- **웹 대시보드**: http://localhost:3301
- **데이터베이스**: `data/workflow.db` 자동 생성

### 3. 첫 사용
```javascript
// Claude Code에서 실행
create_project({
  "name": "첫 번째 프로젝트",
  "description": "WorkflowMCP 테스트 프로젝트"
})

get_project_dashboard()  // 대시보드 확인
```

## 🌐 **웹 대시보드**

### 📋 관리 페이지
- **프로젝트** (`/projects`) - 프로젝트 개요 및 관리
- **PRD 관리** (`/prds`) - 요구사항 문서 카드 뷰
- **작업 관리** (`/tasks`) - Kanban 보드 워크플로우
- **계획 관리** (`/plans`) - 진행률 추적 시스템
- **운영 관리** (`/operations`) - 인시던트 관리 및 상세보기
- **환경 관리** (`/environments`) - 환경 생성 및 상태 관리  
- **배포 관리** (`/deployments`) - 배포 계획 및 실행 관리

### 🔧 생성 페이지
- **새 PRD** (`/prds/new`) - 요구사항/인수조건 관리
- **새 작업** (`/tasks/new`) - 계획 연결 및 미리보기
- **새 계획** (`/plans/new`) - 일정 및 진행률 설정
- **새 환경** (`/environments/new`) - 개발/스테이징/프로덕션 환경 설정
- **새 배포** (`/deployments/create`) - 배포 전략 및 일정 관리

## 🔧 **기술 스택**

- **Backend**: Node.js 18+, SQLite, MCP SDK
- **Frontend**: SvelteKit, Chart.js, D3.js
- **AI Integration**: Claude Code MCP Tools
- **Database**: SQLite (ACID 트랜잭션, FTS 검색)

## 📄 **라이선스**

MIT License - 자유롭게 사용하세요!

---

**WorkflowMCP v3.0.0** - *AI 기반 DevOps 통합 플랫폼*
더 자세한 내용은 **[문서 인덱스](docs/README.md)**를 확인하세요.