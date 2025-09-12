# 📚 WorkflowMCP 완전 사용자 가이드

**WorkflowMCP v2.7** - AI 통합 프로젝트 관리 플랫폼 완전 사용 설명서

---

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [웹 대시보드 완전 가이드](#웹-대시보드-완전-가이드)
3. [MCP 서버 사용법](#mcp-서버-사용법)
4. [실무 워크플로우](#실무-워크플로우)
5. [고급 기능](#고급-기능)
6. [문제 해결](#문제-해결)

---

## 🚀 빠른 시작

### 1. 시스템 요구사항
- **Node.js**: v18.0.0 이상
- **SQLite3**: 자동 설치됨
- **브라우저**: Chrome, Firefox, Safari (최신 버전)
- **Claude Code**: MCP 연동용 (선택사항)

### 2. 설치 및 실행
```bash
# 1. 저장소 클론
git clone https://github.com/foswmine/workflow-mcp.git
cd workflow-mcp

# 2. 의존성 설치
npm install

# 3. 데이터베이스 초기화
cd src/database
node simple-migrate.js
cd ../..

# 4. 웹 대시보드 설치 및 실행
cd dashboard
npm install
npm run dev
```

### 3. 접속 확인
- **웹 대시보드**: http://localhost:3301
- **MCP 서버**: `npm start` (Claude Code 연동시)

---

## 🌐 웹 대시보드 완전 가이드

WorkflowMCP 웹 대시보드는 11개의 주요 메뉴로 구성되어 있습니다.

### 📊 1. 대시보드 (`/`)

**메인 허브 - 프로젝트 전체 현황 한눈에 보기**

#### 주요 기능
- **📈 핵심 지표 카드**
  - **전체 PRD**: 생성된 요구사항 문서 수와 활성 PRD 개수
  - **전체 작업**: 총 작업 수와 완료율 퍼센티지
  - **진행중 작업**: 현재 진행 중인 작업과 대기 중인 작업 수
  - **전체 계획**: 생성된 계획 수와 활성 계획 개수

- **📊 시각화 차트**
  - **작업 활동 추이 (30일)**: 최근 30일간 작업 생성/완료 트렌드 라인 차트
  - **우선순위별 작업 분포**: High/Medium/Low 우선순위별 도넛 차트
    - 🔴 높음 (High): 빨간색
    - 🟡 보통 (Medium): 주황색  
    - 🟢 낮음 (Low): 초록색
    - 🔴 긴급 (Critical): 진한 빨간색

- **⚡ 빠른 실행 버튼**
  - 📋 새 PRD 작성
  - ✅ 새 작업 추가
  - 📅 새 계획 생성

- **📋 최근 활동**
  - 최근 7일간 일별 작업 생성/완료 현황

#### 사용법
1. 대시보드 접속 시 자동으로 최신 데이터 로드
2. 각 지표 카드 클릭 시 해당 상세 페이지로 이동
3. 차트를 통한 시각적 트렌드 분석
4. 빠른 실행으로 새 항목 즉시 생성

---

### 🏗️ 2. 프로젝트 (`/projects`)

**프로젝트 중심의 통합 관리**

#### 주요 기능
- **프로젝트 생성 및 관리**
  - 프로젝트 제목, 설명, 상태 설정
  - 시작일/종료일 일정 관리
  - 프로젝트별 진행률 추적

- **프로젝트 상세 페이지** (`/projects/[id]`)
  - 연결된 PRD, 작업, 설계 목록 표시
  - 프로젝트 타임라인 및 마일스톤
  - 팀 멤버 할당 및 역할 관리

- **프로젝트 편집** (`/projects/[id]/edit`)
  - 프로젝트 정보 수정
  - 상태 변경 (계획중, 진행중, 완료, 보류)
  - 우선순위 조정

#### 사용법
1. **새 프로젝트 생성**: `/projects/new`에서 기본 정보 입력
2. **프로젝트 관리**: 목록에서 프로젝트 선택하여 상세보기
3. **진행 추적**: 프로젝트 대시보드에서 실시간 진행률 확인
4. **연결 관리**: PRD, 작업, 설계를 프로젝트에 연결

---

### 📋 3. 요구사항 (`/prds`)

**PRD (Product Requirements Document) 관리**

#### 주요 기능
- **PRD 카드 뷰 목록**
  - 제목, 상태, 우선순위, 생성일 표시
  - 상태별 색상 코딩 (초안/검토중/승인됨/완료)
  - 빠른 필터링 및 정렬

- **PRD 상세보기** (`/prds/[id]`)
  - **기본 정보**: 제목, 설명, 버전, 상태, 우선순위
  - **요구사항 목록**: 기능별 상세 요구사항
  - **인수 조건**: 완료 기준 및 검증 방법
  - **추가 정보**: 비즈니스 목표, 대상 사용자, 성공 지표
  - **연결된 작업**: 이 PRD와 연관된 작업 목록
  - **첨부 파일**: 관련 문서 및 이미지

- **PRD 편집** (`/prds/[id]/edit`)
  - 모든 PRD 정보 수정 가능
  - 요구사항 추가/삭제/수정
  - 인수 조건 관리
  - 버전 관리 (자동 버전 증가)

- **새 PRD 작성** (`/prds/new`)
  - **1단계**: 기본 정보 입력 (제목, 설명, 우선순위)
  - **2단계**: 상세 요구사항 작성
  - **3단계**: 인수 조건 정의
  - **4단계**: 검토 및 저장

#### 사용법
1. **PRD 생성 워크플로우**:
   ```
   `/prds/new` → 기본정보 → 요구사항 → 인수조건 → 저장
   ```

2. **PRD 관리 사이클**:
   ```
   초안 → 검토중 → 승인됨 → 구현중 → 완료
   ```

3. **실무 팁**:
   - 요구사항은 구체적이고 측정 가능하게 작성
   - 인수 조건은 테스트 가능한 형태로 정의
   - 우선순위는 비즈니스 임팩트 기준으로 설정

---

### 🏗️ 4. 설계 (`/designs`)

**시스템 설계 및 아키텍처 관리**

#### 주요 기능
- **설계 문서 관리**
  - 시스템 아키텍처, UI/UX 설계, API 설계 등
  - 설계 타입별 분류 및 필터링
  - PRD와의 연결 관리

- **설계 상세보기** (`/designs/[id]`)
  - 설계 제목, 타입, 상태, 우선순위
  - 상세 설계 내용 (마크다운 지원)
  - 연결된 PRD 정보
  - 관련 작업 목록

- **설계 편집** (`/designs/[id]/edit`)
  - 설계 정보 전체 수정
  - 설계 타입 변경
  - PRD 연결 수정

#### 설계 타입
- **system**: 시스템 아키텍처
- **ui_ux**: 사용자 인터페이스 설계
- **database**: 데이터베이스 설계
- **api**: API 설계
- **architecture**: 전체 아키텍처

#### 사용법
1. **설계 생성**: 연결할 PRD 선택 → 설계 타입 선택 → 내용 작성
2. **설계 관리**: 상태별 필터링으로 진행 중인 설계 추적
3. **PRD 연동**: 요구사항에서 설계로 자연스러운 흐름

---

### ✅ 5. 작업 (`/tasks`)

**태스크 관리 및 실행 추적**

#### 주요 기능
- **작업 목록 뷰**
  - 카드 형태의 작업 표시
  - 상태별 필터링 (대기중/진행중/완료/차단됨)
  - 우선순위별 정렬
  - 담당자별 필터링

- **작업 상세보기** (`/tasks/[id]`)
  - **기본 정보**: 제목, 설명, 상태, 우선순위, 마감일
  - **연결 정보**: 연결된 프로젝트, 설계
  - **진행 상황**: 진행률 및 시간 추적
  - **의존성**: 선행 작업 및 후속 작업
  - **댓글**: 작업 관련 소통 기록

- **작업 편집** (`/tasks/[id]/edit`)
  - 모든 작업 정보 수정
  - 상태 변경 및 진행률 업데이트
  - 담당자 변경
  - 마감일 조정

- **새 작업 생성** (`/tasks/new`)
  - 제목, 설명, 우선순위 설정
  - 프로젝트/설계 연결
  - 마감일 및 담당자 지정
  - 의존성 설정

#### 작업 상태
- **pending**: 대기중 (작업 준비 완료, 시작 대기)
- **in_progress**: 진행중 (현재 작업 중)
- **completed**: 완료 (작업 완료 및 검증됨)
- **blocked**: 차단됨 (외부 요인으로 진행 불가)
- **deferred**: 연기됨 (우선순위 변경으로 연기)

#### 사용법
1. **일일 작업 관리**:
   ```
   대기중 작업 선택 → 진행중으로 변경 → 작업 수행 → 완료로 변경
   ```

2. **의존성 관리**:
   - 선행 작업 완료 후 자동으로 후속 작업 활성화
   - 순환 의존성 자동 탐지 및 경고

3. **팀 협업**:
   - 담당자별 작업 할당
   - 댓글을 통한 실시간 소통

---

### 🧪 6. 테스트 (`/tests`)

**테스트 케이스 관리 및 실행 추적**

#### 주요 기능
- **테스트 케이스 목록**
  - 테스트 타입별 분류 (단위/통합/시스템/인수)
  - 실행 상태 추적 (대기/실행중/통과/실패)
  - 자동화 상태 표시

- **테스트 상세보기** (`/tests/[id]`)
  - **테스트 정보**: 제목, 타입, 복잡도, 예상 소요시간
  - **실행 단계**: 상세한 테스트 단계별 절차
  - **예상 결과**: 예상되는 테스트 결과
  - **실행 기록**: 과거 실행 결과 히스토리
  - **연결 정보**: 관련 작업 및 설계

- **테스트 편집** (`/tests/[id]/edit`)
  - 테스트 케이스 전체 수정
  - 실행 단계 추가/수정/삭제
  - 자동화 설정 변경

#### 테스트 타입
- **unit**: 단위 테스트
- **integration**: 통합 테스트
- **system**: 시스템 테스트
- **acceptance**: 인수 테스트
- **regression**: 회귀 테스트

#### 자동화 상태
- **manual**: 수동 테스트
- **automated**: 자동화 완료
- **semi_automated**: 부분 자동화

#### 사용법
1. **테스트 생성**: 관련 작업 → 테스트 케이스 생성 → 실행 단계 정의
2. **테스트 실행**: 테스트 선택 → 실행 → 결과 기록
3. **자동화**: 수동 테스트 → 자동화 스크립트 연결 → 자동 실행

---

### 📄 7. 문서 (`/documents`)

**중앙화된 문서 관리 시스템**

#### 주요 기능
- **문서 목록**
  - 문서 타입별 필터링
  - 카테고리별 분류
  - 태그 기반 검색
  - 생성일/수정일 정렬

- **전문 검색 시스템**
  - **Full-Text Search**: 문서 내용 전체 검색
  - **태그 검색**: 관련 태그로 빠른 필터링
  - **카테고리 검색**: 프로젝트별, 단계별 분류
  - **복합 검색**: 여러 조건 동시 적용

- **문서 상세보기** (`/documents/[id]`)
  - **문서 내용**: 마크다운 렌더링 지원
  - **메타데이터**: 타입, 카테고리, 태그, 버전
  - **연결 정보**: 관련 PRD, 작업, 설계
  - **변경 기록**: 문서 수정 히스토리

- **문서 편집** (`/documents/[id]/edit`)
  - 마크다운 에디터
  - 실시간 미리보기
  - 태그 관리
  - 버전 관리 (자동 증가)

#### 문서 타입
- **test_guide**: 테스트 가이드 및 매뉴얼
- **test_results**: 테스트 실행 결과 보고서
- **analysis**: 분석 리포트 및 연구 문서
- **report**: 일반 보고서 및 요약
- **checklist**: 체크리스트 및 검증 목록
- **specification**: 기술 사양서
- **meeting_notes**: 회의록 및 논의사항
- **decision_log**: 의사결정 기록 및 근거

#### 사용법
1. **문서 생성 워크플로우**:
   ```
   문서 타입 선택 → 제목/내용 작성 → 태그 추가 → 연결 설정 → 저장
   ```

2. **검색 활용법**:
   - **키워드 검색**: 제목, 내용에서 키워드 찾기
   - **태그 검색**: 프로젝트명, 기술 스택 등으로 필터링
   - **복합 검색**: "테스트 AND 결과 AND phase_2.6"

3. **버전 관리**:
   - 문서 수정 시 자동으로 버전 증가
   - 이전 버전과의 변경사항 추적

---

### 📋 8. 칸반 보드 (`/kanban`)

**시각적 작업 흐름 관리**

#### 주요 기능
- **드래그 앤 드롭**
  - 작업 카드를 상태 간 자유롭게 이동
  - 실시간 상태 업데이트
  - 시각적 작업 흐름 관리

- **3단계 워크플로우**
  - **📋 대기중 (To Do)**: 계획된 작업들
  - **🔄 진행중 (In Progress)**: 현재 진행 중인 작업
  - **✅ 완료 (Done)**: 완료된 작업들

- **작업 카드 정보**
  - 작업 제목 및 설명
  - 우선순위 색상 표시
  - 담당자 아바타
  - 마감일 표시
  - 태그 및 라벨

#### 사용법
1. **일일 스탠드업**: 칸반 보드로 팀 현황 공유
2. **작업 이동**: 드래그로 작업 상태 변경
3. **병목 지점 파악**: 특정 단계에 작업이 몰리는 현상 모니터링
4. **팀 균형**: 담당자별 작업 분배 현황 확인

---

### 📊 9. 간트 차트 (`/gantt`)

**프로젝트 타임라인 시각화**

#### 주요 기능
- **D3.js 기반 간트 차트**
  - 작업별 시작/종료일 시각화
  - 의존성 관계 화살표 표시
  - 마일스톤 표시
  - 진행률 바 표시

- **상호작용 기능**
  - 줌 인/아웃으로 기간 조절
  - 작업 클릭 시 상세 정보 표시
  - 드래그로 일정 조정
  - 실시간 업데이트

- **타임라인 관리**
  - 주/월/분기별 뷰 전환
  - 오늘 날짜 하이라이트
  - 지연 작업 색상 경고
  - 크리티컬 패스 표시

#### 사용법
1. **프로젝트 계획**: 전체 프로젝트 타임라인 수립
2. **일정 관리**: 작업 간 의존성 및 순서 조정
3. **진행 모니터링**: 실시간 진행률 추적
4. **리소스 계획**: 담당자별 작업 분배 계획

---

### 🔗 10. 관계도 (`/network`)

**프로젝트 엔티티 간 관계 시각화**

#### 주요 기능
- **Vis.js 기반 네트워크 그래프**
  - PRD, 설계, 작업, 테스트 간의 관계 시각화
  - 노드 타입별 색상 구분
  - 엣지를 통한 관계 표현
  - 상호작용 가능한 그래프

- **필터링 및 검색**
  - **타입 필터**: 특정 엔티티 타입만 표시
  - **프로젝트 필터**: 특정 프로젝트 범위 내 관계
  - **검색 기능**: 노드명으로 빠른 찾기
  - **레이아웃 변경**: 물리 시뮬레이션 vs 계층형

- **통계 정보**
  - 전체 노드/엣지 수
  - 연결된 엔티티 비율
  - 고립된 노드 탐지

#### 레이아웃 옵션
- **물리 시뮬레이션**: 자연스러운 배치, 연관성 기반 클러스터링
- **계층형**: 엔티티 타입별 레이어 구조

#### 사용법
1. **관계 분석**: 프로젝트 내 엔티티 간 연결 상태 파악
2. **의존성 추적**: 작업 간 의존성 시각적 확인
3. **영향도 분석**: 특정 변경사항의 영향 범위 분석
4. **고립 엔티티 발견**: 연결되지 않은 작업/문서 탐지

---

### 🗄️ 11. DB 관리 (`/database`)

**데이터베이스 직접 관리 인터페이스**

#### 주요 기능
- **테이블 목록**
  - 모든 데이터베이스 테이블 표시
  - 테이블별 레코드 수 표시
  - 테이블 스키마 정보

- **데이터 조회**
  - 테이블별 데이터 브라우징
  - 페이지네이션 지원
  - 정렬 및 필터링
  - SQL 쿼리 실행

- **데이터 편집**
  - 레코드 직접 편집
  - 새 레코드 추가
  - 레코드 삭제
  - 일괄 작업

- **시스템 관리**
  - 데이터베이스 백업
  - 스키마 정보 확인
  - 인덱스 상태 모니터링

#### 주요 테이블
- **prds**: 요구사항 문서
- **designs**: 설계 문서
- **tasks**: 작업 항목
- **test_cases**: 테스트 케이스
- **documents**: 문서 저장소
- **projects**: 프로젝트 정보

#### 사용법
1. **데이터 정리**: 불필요한 레코드 정리
2. **백업 관리**: 중요 데이터 정기 백업
3. **성능 모니터링**: 테이블 크기 및 쿼리 성능 확인
4. **데이터 분석**: SQL 쿼리로 심화 분석

---

## 🤖 MCP 서버 사용법

WorkflowMCP는 Claude Code와 완전히 통합된 35개의 MCP 도구를 제공합니다.

### MCP 서버 시작
```bash
# MCP 서버 실행
npm start

# 또는 개발 모드
npm run dev
```

### Claude Code 연동 설정
`.mcp.json` 파일에 다음 설정 추가:
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

### 35개 MCP 도구 전체 목록

#### 📋 PRD 관리 (8개 도구)
```javascript
// 1. PRD 생성
create_prd({
  title: "사용자 인증 시스템",
  description: "JWT 기반 로그인/회원가입 시스템",
  requirements: ["회원가입", "로그인", "비밀번호 재설정"],
  acceptance_criteria: ["보안 테스트 통과", "성능 테스트 통과"],
  priority: "high"
})

// 2. PRD 목록 조회
list_prds()

// 3. PRD 상세 조회
get_prd({ prd_id: "prd_123" })

// 4. PRD 업데이트
update_prd({
  prd_id: "prd_123",
  updates: { status: "approved" }
})

// 5. PRD 삭제
delete_prd({ prd_id: "prd_123" })

// 6. PRD 검증
validate_prd({ prd_id: "prd_123" })

// 7. PRD-계획 연결
link_prd_to_plan({ prd_id: "prd_123", plan_id: "plan_456" })

// 8. 연결 데이터 조회
get_linked_data({ entity_type: "prd", entity_id: "prd_123" })
```

#### ✅ 작업 관리 (10개 도구)
```javascript
// 1. 작업 생성
create_task({
  title: "로그인 API 개발",
  description: "JWT 토큰 기반 인증 API",
  priority: "high",
  status: "pending",
  due_date: "2025-01-15",
  assignee: "개발자A"
})

// 2. 작업 목록 조회
list_tasks({ status: "pending", priority: "high" })

// 3. 작업 상세 조회
get_task({ task_id: "task_123" })

// 4. 작업 업데이트
update_task({
  task_id: "task_123",
  updates: { status: "in_progress", progress: 50 }
})

// 5. 작업 삭제
delete_task({ task_id: "task_123" })

// 6. 작업 의존성 추가
add_task_dependency({
  dependent_task_id: "task_456",
  prerequisite_task_id: "task_123"
})

// 7. 의존성 제거
remove_task_dependency({
  dependent_task_id: "task_456",
  prerequisite_task_id: "task_123"
})

// 8. 의존성 조회
get_task_dependencies({ task_id: "task_123" })

// 9. 자동 상태 업데이트
auto_update_task_status()

// 10. 워크플로우 검증
validate_workflow()
```

#### 📅 계획 관리 (8개 도구)
```javascript
// 1. 계획 생성
create_plan({
  title: "Q1 개발 계획",
  description: "1분기 주요 기능 개발",
  start_date: "2025-01-01",
  end_date: "2025-03-31",
  status: "active"
})

// 2. 계획 목록 조회
list_plans({ status: "active" })

// 3. 계획 상세 조회
get_plan({ plan_id: "plan_123" })

// 4. 계획 업데이트
update_plan({
  plan_id: "plan_123",
  updates: { status: "completed", completion_percentage: 100 }
})

// 5. 계획 삭제
delete_plan({ plan_id: "plan_123" })

// 6. 계획-작업 연결
link_plan_to_tasks({
  plan_id: "plan_123",
  task_ids: ["task_456", "task_789"]
})

// 7. 진행률 동기화
sync_plan_progress({ plan_id: "plan_123" })

// 8. 진행 타임라인 조회
get_progress_timeline({ plan_id: "plan_123" })
```

#### 📄 문서 관리 (9개 도구)
```javascript
// 1. 문서 생성
create_document({
  title: "API 설계 명세서",
  content: "# API 설계\n\n## 인증 API\n...",
  doc_type: "specification",
  category: "backend",
  tags: ["api", "authentication", "backend"]
})

// 2. 문서 목록 조회
list_documents({ doc_type: "specification", limit: 10 })

// 3. 문서 상세 조회
get_document({ document_id: 123 })

// 4. 문서 업데이트
update_document({
  document_id: 123,
  title: "업데이트된 API 명세서",
  content: "수정된 내용...",
  status: "approved"
})

// 5. 문서 삭제
delete_document({ document_id: 123 })

// 6. 문서 검색 (Full-Text Search)
search_documents({
  query: "authentication API",
  doc_type: "specification",
  limit: 5
})

// 7. 문서 연결
link_documents({
  source_doc_id: 123,
  target_doc_id: 456,
  relationship_type: "references"
})

// 8. 문서 관계 조회
get_document_relations({ document_id: 123 })

// 9. 문서 요약
get_document_summary({ document_id: 123 })
```

---

## 🔄 실무 워크플로우

### 완전한 프로젝트 생명주기

#### 1️⃣ 프로젝트 초기화 단계
```javascript
// Step 1: 프로젝트 생성
create_project({
  name: "이커머스 플랫폼",
  description: "B2C 온라인 쇼핑몰",
  start_date: "2025-01-01",
  end_date: "2025-06-30"
})

// Step 2: PRD 작성
create_prd({
  title: "이커머스 핵심 기능",
  description: "온라인 쇼핑몰 필수 기능 정의",
  requirements: [
    "사용자 회원가입/로그인",
    "상품 카탈로그 관리",
    "장바구니 기능",
    "주문 및 결제 처리"
  ],
  acceptance_criteria: [
    "동시 사용자 1000명 처리",
    "페이지 로딩 3초 이내",
    "99.9% 업타임"
  ]
})

// Step 3: 기본 계획 수립
create_plan({
  title: "Phase 1: 기반 시스템 구축",
  description: "인증 및 기본 CRUD",
  start_date: "2025-01-01",
  end_date: "2025-02-28"
})
```

#### 2️⃣ 설계 및 아키텍처 단계
```javascript
// 시스템 아키텍처 설계
create_design({
  title: "마이크로서비스 아키텍처",
  design_type: "system",
  requirement_id: "prd_123",
  details: `
    # 시스템 아키텍처
    
    ## 서비스 구성
    - Auth Service: 사용자 인증
    - Product Service: 상품 관리
    - Order Service: 주문 처리
    - Payment Service: 결제 처리
    
    ## 기술 스택
    - Backend: Node.js + Express
    - Database: PostgreSQL
    - Cache: Redis
    - Message Queue: RabbitMQ
  `
})

// API 설계
create_design({
  title: "REST API 설계",
  design_type: "api",
  requirement_id: "prd_123",
  details: "API 엔드포인트 및 스키마 정의"
})

// 데이터베이스 설계
create_design({
  title: "데이터베이스 ERD",
  design_type: "database",
  requirement_id: "prd_123",
  details: "테이블 구조 및 관계 정의"
})
```

#### 3️⃣ 작업 분해 및 할당 단계
```javascript
// 인증 서비스 작업들
create_task({
  title: "사용자 모델 및 데이터베이스 스키마",
  description: "User 테이블 생성 및 Sequelize 모델 정의",
  priority: "high",
  design_id: "design_auth",
  estimated_hours: 8
})

create_task({
  title: "JWT 인증 미들웨어 구현",
  description: "토큰 생성, 검증, 갱신 로직",
  priority: "high",
  design_id: "design_auth",
  estimated_hours: 16
})

// 작업 의존성 설정
add_task_dependency({
  dependent_task_id: "task_jwt",
  prerequisite_task_id: "task_user_model"
})

// 프론트엔드 작업
create_task({
  title: "로그인 페이지 UI 구현",
  description: "React 기반 로그인 폼",
  priority: "medium",
  design_id: "design_ui"
})
```

#### 4️⃣ 테스트 계획 수립
```javascript
// 단위 테스트
create_test_case({
  title: "JWT 토큰 검증 테스트",
  type: "unit",
  task_id: "task_jwt",
  test_steps: [
    "유효한 토큰으로 검증 호출",
    "만료된 토큰으로 검증 호출",
    "잘못된 형식 토큰으로 검증 호출"
  ],
  expected_result: "각 경우에 맞는 적절한 응답 반환"
})

// 통합 테스트
create_test_case({
  title: "로그인 플로우 통합 테스트",
  type: "integration",
  complexity: "Medium",
  estimated_duration: 30
})
```

#### 5️⃣ 문서화
```javascript
// 기술 문서
create_document({
  title: "인증 서비스 기술 문서",
  content: `
    # 인증 서비스 문서
    
    ## 개요
    JWT 기반 사용자 인증 시스템
    
    ## API 명세
    - POST /auth/login
    - POST /auth/register
    - POST /auth/refresh
    
    ## 보안 고려사항
    - 토큰 만료 시간: 1시간
    - 리프레시 토큰: 7일
  `,
  doc_type: "specification",
  category: "authentication",
  tags: ["jwt", "auth", "security"]
})

// 테스트 결과
create_document({
  title: "인증 서비스 테스트 결과",
  content: "테스트 실행 결과 및 이슈",
  doc_type: "test_results",
  category: "authentication"
})
```

#### 6️⃣ 진행 모니터링
```javascript
// 진행률 추적
sync_plan_progress({ plan_id: "plan_123" })
get_progress_timeline({ plan_id: "plan_123" })

// 자동 상태 업데이트 (의존성 기반)
auto_update_task_status()

// 전체 프로젝트 대시보드 확인
get_project_dashboard()
```

---

### 일일 개발 워크플로우

#### 🌅 아침 루틴
1. **대시보드 확인**
   ```javascript
   get_project_dashboard()  // 전체 현황 파악
   list_tasks({ status: "in_progress", assignee: "나" })  // 진행중 작업
   ```

2. **오늘의 작업 선택**
   - 칸반 보드(`/kanban`)에서 대기중 작업 확인
   - 우선순위와 의존성 고려하여 작업 선택
   - 작업 상태를 '진행중'으로 변경

#### 🔧 개발 중
3. **작업 진행 업데이트**
   ```javascript
   update_task({
     task_id: "task_current",
     updates: { 
       status: "in_progress",
       progress: 30,
       notes: "API 기본 구조 완성, 테스트 코드 작성 중"
     }
   })
   ```

4. **문서 작성**
   ```javascript
   create_document({
     title: "개발 일지 - 2025-01-10",
     content: "오늘 구현한 기능과 발견한 이슈들",
     doc_type: "meeting_notes",
     category: "daily"
   })
   ```

#### 🌆 마무리
5. **작업 완료 처리**
   ```javascript
   update_task({
     task_id: "task_current",
     updates: { status: "completed", progress: 100 }
   })
   
   // 자동으로 다음 작업 활성화
   auto_update_task_status()
   ```

6. **내일 계획**
   - 간트 차트(`/gantt`)에서 다음 작업 확인
   - 의존성 해결 여부 점검

---

### 팀 협업 워크플로우

#### 📅 주간 회의
```javascript
// 주간 진행률 리포트
get_progress_timeline({ 
  plan_id: "current_plan",
  period: "week"
})

// 팀별 작업 현황
list_tasks({ 
  assignee: "팀원A",
  status: ["in_progress", "blocked"]
})
```

#### 🔄 코드 리뷰 프로세스
```javascript
// 리뷰 요청 작업 생성
create_task({
  title: "인증 API 코드 리뷰",
  description: "JWT 구현 로직 검토 필요",
  priority: "high",
  assignee: "시니어개발자",
  task_type: "review"
})

// 리뷰 결과 문서화
create_document({
  title: "인증 API 코드 리뷰 결과",
  content: "개선사항 및 승인 여부",
  doc_type: "decision_log",
  linked_entity_type: "task",
  linked_entity_id: "task_review"
})
```

---

## 🚀 고급 기능

### 1. 복잡한 의존성 관리

#### 순환 의존성 탐지
```javascript
// 의존성 추가 시 자동으로 순환 의존성 검사
add_task_dependency({
  dependent_task_id: "task_A",
  prerequisite_task_id: "task_B"
})
// → 시스템이 자동으로 순환 구조 탐지 및 경고
```

#### 크리티컬 패스 분석
- 간트 차트에서 프로젝트 완료에 필수적인 작업 경로 하이라이트
- 지연 시 전체 프로젝트에 영향을 주는 작업 식별

### 2. 고급 검색 및 분석

#### Full-Text Search 활용
```javascript
// 복합 검색 쿼리
search_documents({
  query: "authentication AND (JWT OR OAuth) AND security",
  doc_type: ["specification", "analysis"],
  category: "backend"
})

// 태그 기반 연관 문서 찾기
search_documents({
  query: "project:ecommerce phase:development",
  limit: 20
})
```

#### 관계 분석
- 네트워크 그래프(`/network`)로 엔티티 간 숨겨진 연결 발견
- 고립된 요구사항이나 작업 탐지
- 과도하게 연결된 중심 노드 식별

### 3. 자동화 및 효율성

#### 자동 상태 업데이트
```javascript
// 선행 작업 완료 시 자동으로 후속 작업 활성화
auto_update_task_status()

// 계획 진행률 자동 계산
sync_plan_progress({ plan_id: "all" })
```

#### 템플릿 시스템
- 자주 사용하는 PRD 구조를 템플릿으로 저장
- 유사한 프로젝트 구조 재사용
- 표준 테스트 케이스 템플릿

### 4. 대용량 데이터 처리

#### 배치 작업
```javascript
// 여러 작업을 한 번에 생성
create_multiple_tasks([
  { title: "작업1", priority: "high" },
  { title: "작업2", priority: "medium" },
  // ... 더 많은 작업
])

// 대량 업데이트
update_multiple_tasks({
  filter: { status: "pending", priority: "low" },
  updates: { priority: "medium" }
})
```

#### 성능 최적화
- SQLite WAL 모드로 동시 접근 최적화
- 인덱스 기반 빠른 검색
- 페이지네이션으로 대용량 데이터 처리

---

## 🔧 문제 해결

### 일반적인 문제들

#### 1. MCP 서버 연결 안 됨
```bash
# 문제 확인
claude --debug
/mcp

# 해결 방법
cd workflow-mcp
npm start  # MCP 서버 재시작

# .mcp.json 설정 확인
{
  "mcpServers": {
    "workflow-mcp": {
      "command": "node",
      "args": ["src/index.js"],
      "type": "stdio"
    }
  }
}
```

#### 2. 웹 대시보드 접속 안 됨
```bash
# 포트 충돌 확인
netstat -ano | findstr :3301

# 대시보드 재시작
cd dashboard
npm run dev

# 브라우저 캐시 클리어
Ctrl+Shift+R (Chrome/Firefox)
```

#### 3. 데이터베이스 오류
```bash
# 데이터베이스 재초기화
cd src/database
node simple-migrate.js

# 권한 문제 해결
chmod 755 data/
chmod 644 data/workflow.db
```

#### 4. 검색이 작동하지 않음
```sql
-- FTS 테이블 재구성
DROP TABLE IF EXISTS documents_fts;
CREATE VIRTUAL TABLE documents_fts USING fts5(
    title, content, tags
);

-- 기존 데이터 다시 인덱싱
INSERT INTO documents_fts(title, content, tags)
SELECT title, content, tags FROM documents;
```

### 성능 최적화

#### 1. SQLite 최적화
```sql
-- WAL 모드 활성화
PRAGMA journal_mode = WAL;

-- 외래키 제약조건 활성화
PRAGMA foreign_keys = ON;

-- 캐시 크기 증가
PRAGMA cache_size = 10000;
```

#### 2. 웹 대시보드 최적화
- 이미지 최적화: WebP 형식 사용
- 컴포넌트 레이지 로딩
- API 응답 캐싱
- 페이지네이션으로 대용량 데이터 처리

### 데이터 백업 및 복구

#### 정기 백업
```bash
# 데이터베이스 백업
cp data/workflow.db backup/workflow_$(date +%Y%m%d).db

# JSON 파일 백업
tar -czf backup/json_files_$(date +%Y%m%d).tar.gz data/prds/ data/tasks/ data/plans/
```

#### 복구
```bash
# 데이터베이스 복구
cp backup/workflow_20250110.db data/workflow.db

# 서비스 재시작
npm start
cd dashboard && npm run dev
```

---

## 📈 모니터링 및 분석

### 핵심 성과 지표 (KPI)

#### 프로젝트 건강도
- **진행률**: 계획 대비 실제 진행 상황
- **속도**: 주당 완료 작업 수
- **품질**: 테스트 통과율, 버그 발생률
- **예측 정확도**: 예상 vs 실제 소요 시간

#### 팀 생산성
- **개인별 작업 완료량**
- **평균 작업 완료 시간**
- **병목 지점 분석**
- **협업 효율성**: 의존성 대기 시간

### 리포트 생성

#### 주간 리포트
```javascript
// 주간 진행 현황
get_progress_timeline({
  start_date: "2025-01-06",
  end_date: "2025-01-12"
})

// 완료된 작업 목록
list_tasks({
  status: "completed",
  updated_after: "2025-01-06"
})
```

#### 월간 요약
```javascript
// 월간 통계
get_project_dashboard({
  period: "month",
  include_trends: true
})

// 문서화 현황
list_documents({
  created_after: "2025-01-01",
  doc_type: "all"
})
```

---

## 🎯 모범 사례

### PRD 작성 가이드라인
1. **명확한 목표**: 측정 가능한 비즈니스 목표 설정
2. **구체적 요구사항**: 구현 가능한 기능 단위로 분해
3. **검증 가능한 인수조건**: 테스트 가능한 형태로 정의
4. **우선순위 명확화**: 비즈니스 임팩트 기준 우선순위 설정

### 작업 관리 베스트 프랙티스
1. **작은 단위**: 1-3일 내 완료 가능한 크기로 분할
2. **명확한 설명**: 누구나 이해할 수 있는 작업 설명
3. **적절한 의존성**: 꼭 필요한 의존성만 설정
4. **정기적 업데이트**: 진행상황 실시간 반영

### 문서화 전략
1. **표준 템플릿**: 일관된 문서 구조 유지
2. **살아있는 문서**: 코드 변경 시 문서도 함께 업데이트
3. **검색 최적화**: 적절한 태그와 카테고리 사용
4. **버전 관리**: 중요 문서의 변경 이력 추적

---

## 🔮 고급 활용법

### Claude Code와의 통합 개발
```javascript
// Claude Code에서 직접 프로젝트 관리
"새로운 사용자 인증 기능을 위한 PRD를 작성하고, 
관련 작업들을 생성한 다음, 테스트 케이스까지 만들어주세요."

// → Claude가 자동으로:
// 1. create_prd() 호출
// 2. create_task() 여러 번 호출  
// 3. create_test_case() 호출
// 4. add_task_dependency() 호출
```

### 프로젝트 템플릿 시스템
- 성공한 프로젝트 구조를 템플릿으로 저장
- 새 프로젝트 시작 시 템플릿 적용
- 표준화된 워크플로우 구축

### 외부 도구 연동 준비
- GitHub Issues 연동 API 준비
- Jira 티켓 동기화 기능
- Slack 알림 연동
- 이메일 리포트 자동 발송

---

**이제 WorkflowMCP의 모든 기능을 완벽하게 활용할 수 있습니다!** 

이 가이드를 참고하여 효율적인 프로젝트 관리와 개발 워크플로우를 구축해보세요. 🚀

---

**문의사항이나 추가 도움이 필요하시면 GitHub Issues를 통해 연락주세요.**

**Made with ❤️ and Claude Code - The Future of AI-Integrated Development**