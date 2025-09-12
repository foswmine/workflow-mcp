# WorkflowMCP 프로젝트 초기 설정 가이드

새로운 환경에서 WorkflowMCP 프로젝트를 설정하고 실행하기 위한 완전한 가이드입니다.

## 📋 사전 요구사항

### 필수 소프트웨어
- **Node.js** ≥18.0.0 ([nodejs.org](https://nodejs.org/) 에서 다운로드)
- **Git** (프로젝트 클론용)
- **Claude Code CLI** (MCP 서버 연동용)

### 시스템 요구사항
- Windows 10+, macOS 10.15+, 또는 Linux Ubuntu 18.04+
- 최소 4GB RAM (권장: 8GB 이상)
- 2GB 이상의 사용 가능한 디스크 공간

## 🚀 1. 프로젝트 설정

### 1.1 저장소 클론
```bash
# GitHub에서 프로젝트 클론
git clone https://github.com/foswmine/workflow-mcp.git
cd workflow-mcp
```

### 1.2 의존성 설치
```bash
# 메인 프로젝트 의존성 설치
npm install

# 대시보드 의존성 설치
cd dashboard
npm install
cd ..
```

## 🗄️ 2. 데이터베이스 초기화 (새로운 방법)

### ⚡ 빠른 초기화 (권장)
```bash
# 완전한 데이터베이스 초기화 (스키마 3.0.0 적용)
node init-database.js
```

이 스크립트는:
- ✅ `data/` 디렉토리 자동 생성
- ✅ 최신 스키마 (3.0.0) 적용
- ✅ 모든 테이블, 뷰, 인덱스, 트리거 생성
- ✅ FTS(전문검색) 인덱스 설정
- ✅ 데이터베이스 무결성 검증
- ✅ 상세한 설정 상태 리포트

### 2.2 초기화 확인
```bash
# 데이터베이스 상태 및 기능 검증
node verify-database.js
```

성공적으로 초기화되면 다음과 같은 출력을 볼 수 있습니다:
```
🎉 DATABASE INITIALIZATION COMPLETE!
=====================================
📁 Database location: ./data/workflow.db  
📊 Schema version: 3.0.0
📋 Tables created: 15
👁️ Views created: 8
🔍 FTS tables: 1
```

### 2.3 샘플 데이터 추가 (선택사항)
```bash
# 테스트용 샘플 데이터 생성
node add-sample-data.js
```

샘플 데이터 포함 내용:
- 📊 **3개 PRD**: 다양한 상태의 제품 요구사항
- 📋 **5개 Task**: 완료/진행중/대기 상태
- 📄 **4개 Document**: 분석, 설계, 테스트 결과 문서
- 🧪 **2개 Test Case**: 통합 테스트 및 성능 테스트

## ⚙️ 3. MCP 서버 설정

### 3.1 MCP 설정 파일 생성
프로젝트 루트에 `.mcp.json` 파일을 생성하거나 기존 예시 파일을 복사하세요:

```bash
# 예시 설정 파일을 실제 설정으로 복사
cp .mcp.json.example .mcp.json
```

### 3.2 MCP 설정 파일 내용
`.mcp.json` 파일에 다음 내용을 추가하세요:

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

### 3.3 Claude Code에서 MCP 서버 등록
Claude Code를 사용하는 경우, 프로젝트 루트에서 다음 명령을 실행하세요:

```bash
# Claude Code의 MCP 설정에 workflow-mcp 서버 추가
claude mcp add workflow-mcp --config .mcp.json
```

## 🖥️ 4. 서버 실행

### 4.1 MCP 서버 실행
새 터미널 창에서:
```bash
# WorkflowMCP MCP 서버 시작 (포트: 기본값)
npm start

# 또는 개발 모드로 실행 (핫 리로드 지원)
npm run dev
```

실행 성공시 다음과 같은 출력을 볼 수 있습니다:
```
🚀 WorkflowMCP Server starting...
📊 Database initialized: data/workflow.db  
✅ MCP Server ready with 35 tools available
```

### 4.2 웹 대시보드 실행
다른 터미널 창에서:
```bash
cd dashboard
npm run dev
```

실행 성공시 다음과 같은 출력을 볼 수 있습니다:
```
> @sveltejs/adapter-auto@1.0.0 dev
> vite dev --port 3301

Local:   http://localhost:3301/
Network: http://192.168.1.100:3301/
```

## 🌐 5. 접속 확인

### 5.1 웹 대시보드 접속
브라우저에서 다음 URL들에 접속하여 정상 작동을 확인하세요:

- **메인 대시보드**: http://localhost:3301/
- **PRD 관리**: http://localhost:3301/prds
- **작업 관리**: http://localhost:3301/tasks  
- **설계 관리**: http://localhost:3301/designs
- **테스트 관리**: http://localhost:3301/tests
- **문서 관리**: http://localhost:3301/documents
- **데이터베이스 뷰어**: http://localhost:3301/database

### 5.2 MCP 도구 확인 (Claude Code 사용자)
Claude Code에서 다음 명령으로 MCP 서버 연결을 확인하세요:

```bash
# 사용 가능한 MCP 도구 목록 확인
/mcp
```

정상 연결시 35개의 WorkflowMCP 도구들이 나열됩니다:

**📊 프로젝트 관리 (6개)**:
- `create_project`, `list_projects`, `get_project`, `update_project`, `delete_project`, `get_project_analytics`

**📋 PRD 관리 (5개)**:  
- `create_prd`, `list_prds`, `get_prd`, `update_prd`, `delete_prd`

**🎨 설계 관리 (5개)**:
- `create_design`, `list_designs`, `get_design`, `update_design`, `delete_design`

**📋 작업 관리 (7개)**:
- `create_task`, `list_tasks`, `get_task`, `update_task`, `delete_task`, `get_task_connections`, `add_task_connection`, `remove_task_connection`

**🧪 테스트 관리 (6개)**:
- `create_test_case`, `list_test_cases`, `get_test_case`, `update_test_case`, `execute_test_case`, `get_test_executions`

**📄 문서 관리 (6개)**:
- `create_document`, `list_documents`, `get_document`, `update_document`, `search_documents`, `link_document`

## 🔧 6. 개발 환경 설정

### 6.1 개발용 스크립트들
```bash
# 데이터베이스 검증
node verify-database.js

# 샘플 데이터 추가 
node add-sample-data.js

# 모든 MCP 서버 도구 테스트
npm test

# 레거시 MCP 서버 (필요시)
npm run legacy
```

### 6.2 포트 설정
기본 포트를 변경하려면:

**MCP 서버 포트 변경** (필요시):
`src/index.js`에서 포트 설정 확인

**대시보드 포트 변경**:
```bash
cd dashboard
# vite.config.js에서 포트 변경하거나 환경 변수 사용
PORT=3303 npm run dev
```

## 🚨 7. 문제 해결

### 7.1 일반적인 문제들

#### 데이터베이스 초기화 실패
```bash
# 기존 데이터베이스 삭제 후 재생성
rm -f data/workflow.db
node init-database.js
```

#### 데이터베이스 권한 오류
```bash
# 데이터 디렉토리 권한 설정
chmod 755 data/
chmod 644 data/workflow.db  # 파일이 있는 경우
```

#### Node.js 버전 문제
```bash
# Node.js 버전 확인
node --version

# 18.0.0 미만인 경우 업그레이드 필요
```

#### 포트 충돌 문제
```bash
# 포트 사용 현황 확인 (Windows)
netstat -ano | findstr :3301

# 포트 사용 현황 확인 (Linux/Mac)
lsof -i :3301
```

### 7.2 MCP 서버 연결 문제
```bash
# MCP 서버 프로세스 확인
ps aux | grep "node src/index.js"

# MCP 서버 재시작
pkill -f "node src/index.js"
npm start
```

### 7.3 대시보드 빌드 오류
```bash
cd dashboard

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run build -- --clean
```

## 📚 8. 주요 명령어 요약

### 일일 개발 워크플로우
```bash
# 1. 데이터베이스 상태 확인 (선택사항)
node verify-database.js

# 2. MCP 서버 시작
npm start

# 3. 대시보드 시작 (새 터미널)
cd dashboard && npm run dev

# 4. 개발 완료 후 종료 (Ctrl+C 각 터미널에서)
```

### 데이터베이스 관리
```bash
# 완전한 데이터베이스 초기화
node init-database.js

# 데이터베이스 상태 확인  
node verify-database.js

# 샘플 데이터 추가
node add-sample-data.js

# 데이터베이스 재생성 (기존 데이터 삭제)
rm -f data/workflow.db && node init-database.js
```

### Git 워크플로우
```bash
# 변경사항 확인
git status

# 모든 변경사항 커밋
git add . && git commit -m "your commit message"

# 원격 저장소 업데이트
git push origin main
```

## 🎯 9. 다음 단계

성공적으로 설정이 완료되면:

1. **웹 대시보드**: http://localhost:3301/ 에서 UI 탐색
2. **MCP 도구**: Claude Code에서 `/mcp` 명령으로 AI 도구 확인
3. **문서 가이드**: Document ID: 76의 "CRUD 메뉴 구현 가이드" 참조
4. **API 테스트**: 각 관리 페이지에서 CRUD 작업 테스트

## ⚠️ 기존 스크립트 사용 중단 안내 (v2.8 업데이트)

**중요**: WorkflowMCP v2.8에서는 다음 기존 스크립트들이 **더 이상 호환되지 않습니다**:

### ❌ 사용 중단된 스크립트들
- ❌ `src/database/simple-migrate.js` - 구식 문서 관리 스키마만 지원
- ❌ `simple-migrate.js` - 루트 레벨의 구식 마이그레이션 스크립트  
- ❌ `check-db-status.js` - 기존 상태 확인 도구
- ❌ `create-fts.js` - FTS 별도 생성 스크립트

### ✅ 새로운 권장 도구들 (v2.8)
- ✅ `node init-database.js` - **완전한 데이터베이스 초기화** (권장)
  - 최신 스키마 3.0.0 적용
  - 프로젝트, PRD, 설계, 작업, 테스트 관리 테이블 생성
  - 연결 관리 시스템 포함
  - FTS 검색 인덱스 자동 구성
- ✅ `node verify-database.js` - **데이터베이스 상태 검증**
- ✅ `node add-sample-data.js` - **샘플 데이터 추가**

### 🚨 마이그레이션 필수 사항
기존 환경에서 v2.8로 업그레이드하는 경우:
```bash
# 1. 기존 데이터베이스 백업 (중요!)
cp data/workflow.db data/workflow.db.backup

# 2. 기존 데이터베이스 제거
rm -f data/workflow.db

# 3. 새 스키마로 초기화
node init-database.js

# 4. (필요시) 샘플 데이터 추가  
node add-sample-data.js
```

## 📞 지원 및 문의

문제가 발생하면:
1. 이 문서의 "문제 해결" 섹션 확인
2. `node verify-database.js`로 데이터베이스 상태 점검
3. GitHub Issues에 버그 리포트 제출
4. 로그 파일 및 에러 메시지와 함께 상세한 설명 제공

---

**중요**: 이 가이드는 WorkflowMCP 프로젝트의 완전한 초기 설정을 다룹니다. 모든 단계를 순서대로 따라하면 완전히 작동하는 개발 환경을 구축할 수 있습니다.

---

## 🤖 Claude Code에서 자동 설치하기

이 프로젝트를 Claude Code에서 자동으로 설정하려면, 이 문서를 Claude에게 전달하고 다음과 같이 요청하세요:

**사용 예시:**
```
이 SETUP.md 파일의 내용에 따라 WorkflowMCP 프로젝트를 설정해주세요. 
의존성 설치부터 데이터베이스 초기화, 서버 실행까지 모든 단계를 진행해주세요.
```

Claude가 이 가이드를 따라 자동으로:
1. ✅ 의존성 설치 (`npm install`)
2. ✅ 데이터베이스 초기화 (`node init-database.js`)  
3. ✅ 샘플 데이터 추가 (`node add-sample-data.js`)
4. ✅ 서버 실행 (`npm start`, `dashboard npm run dev`)
5. ✅ 설정 검증 및 접속 확인

을 수행해드립니다!