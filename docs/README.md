# 📚 WorkflowMCP 문서 인덱스

WorkflowMCP v2.9의 모든 문서가 카테고리별로 정리되어 있습니다.

## 🚀 **독립형 워크플로우 시스템** ⭐ NEW!

**MCP 설치 없이도 폴더 구조만으로 SDLC 체험 가능!**

- **[📁 독립형 워크플로우 시스템 가이드](STANDALONE_WORKFLOW_SYSTEM.md)** - 완전 자립형 프로젝트 관리
- **[🔄 워크플로우 체험 가이드](WORKFLOW_EXPERIENCE_GUIDE.md)** - 실제 개발 프로세스 체험

### 📂 워크플로우 폴더 구조
```
프로젝트명/
├── 01-projects/        # 📊 프로젝트 계획
├── 02-requirements/    # 📋 요구사항 정의  
├── 03-designs/         # 🎨 시스템 설계
├── 04-tasks/           # ✅ 작업 관리
├── 05-tests/           # 🧪 테스트 관리
├── 06-environments/    # 🌐 환경 관리
├── 07-deployments/     # 🚀 배포 관리
├── 08-operations/      # 🛠️ 운영 관리
└── 09-documents/       # 📝 통합 문서
```

## 📂 기존 문서 구조

### 📖 사용자 가이드 (`/docs/guides/`)
- **[사용자 가이드](guides/USER_GUIDE.md)** - 전체 시스템 사용법
- **[DevOps 운영 관리 가이드](guides/DEVOPS_OPERATIONS_GUIDE.md)** - 인시던트, 환경, 배포 관리
- **[WorkflowMCP 사용자 가이드](guides/workflowmcp-user-guide.md)** - 기본 사용법

### 🧪 테스트 문서 (`/docs/testing/`)
- **[Phase 2.9 테스트 가이드](testing/MCP_PHASE_2_9_TESTING_GUIDE.md)** - 최신 테스트 가이드
- **[빠른 테스트 체크리스트](testing/QUICK_TEST_CHECKLIST.md)** - 핵심 기능 검증
- **테스트 결과 리포트들** - 각 Phase별 상세 테스트 결과

### 🛠️ 개발 문서 (`/docs/development/`)
- **[개발 진행 상황](development/DEVELOPMENT_PROGRESS.md)** - 프로젝트 진행 현황
- **[MCP 서버 트러블슈팅](development/MCP_SERVER_TROUBLESHOOTING_GUIDE.md)** - 서버 문제 해결
- **시스템 설계 문서들** - 아키텍처 및 설계 관련 문서

### 🔧 API 문서 (`/docs/api/`)
- MCP 도구 API 문서 (예정)
- REST API 문서 (예정)
- 데이터베이스 스키마 문서 (예정)

## 🔗 빠른 시작 가이드

### 🆕 독립형 시스템으로 시작 (추천!)
1. **[독립형 워크플로우 가이드](STANDALONE_WORKFLOW_SYSTEM.md)** 읽기
2. 프로젝트 폴더에 9개 디렉토리 생성
3. 각 폴더의 README.md 참고하여 진행
4. 순서대로 문서 작성하며 개발 진행

### 🛠️ MCP 시스템으로 시작
1. **[사용자 가이드](guides/USER_GUIDE.md)** - 시스템 전체 개요
2. **[빠른 테스트](testing/QUICK_TEST_CHECKLIST.md)** - 설치 후 기본 검증

### 🎯 기능별 가이드
- **PRD 관리**: [사용자 가이드 PRD 섹션](guides/USER_GUIDE.md#prd-관리)
- **작업 관리**: [사용자 가이드 작업 섹션](guides/USER_GUIDE.md#작업-관리)  
- **DevOps 운영**: [DevOps 운영 가이드](guides/DEVOPS_OPERATIONS_GUIDE.md)

### 🔧 문제 해결
- **MCP 연결 문제**: [MCP 서버 트러블슈팅](development/MCP_SERVER_TROUBLESHOOTING_GUIDE.md)
- **테스트 실패**: [Phase 2.9 테스트 가이드](testing/MCP_PHASE_2_9_TESTING_GUIDE.md)

## 💡 **활용 시나리오**

### A. **학습 목적**
독립형 워크플로우 → 체계적인 SDLC 학습

### B. **실제 프로젝트**  
독립형 워크플로우 → 프로젝트 문서 관리

### C. **팀 협업**
MCP 시스템 → AI 통합 프로젝트 관리

### D. **기업 도입**
MCP 시스템 → 완전한 DevOps 플랫폼

## 📝 문서 작성 가이드

새로운 문서 추가 시 적절한 카테고리에 배치:
- **워크플로우 체험** → `01-projects/` ~ `09-documents/`
- **사용자 중심 가이드** → `guides/`
- **테스트 관련** → `testing/`  
- **개발/기술 문서** → `development/`
- **API 문서** → `api/`

---
**WorkflowMCP v2.9** - *독립형 워크플로우 시스템으로 누구나 쉽게 SDLC 체험!* 🚀