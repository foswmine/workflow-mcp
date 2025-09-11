# 📁 독립형 워크플로우 시스템

## 🎯 **목적**
MCP 설치 없이 폴더 구조만으로 소프트웨어 개발 생명주기(SDLC)를 체계적으로 관리하는 시스템

## 📂 **폴더 구조 및 순서**

```
프로젝트명/
├── 01-projects/        # 프로젝트 계획 및 개요
├── 02-requirements/    # 요구사항 정의 (PRD)
├── 03-designs/         # 시스템 설계 및 아키텍처
├── 04-tasks/          # 작업 분할 및 관리
├── 05-tests/          # 테스트 계획 및 결과
├── 06-environments/   # 환경 설정 및 관리
├── 07-deployments/    # 배포 계획 및 실행
├── 08-operations/     # 운영 및 인시던트 관리
└── 09-documents/      # 회의록 및 기타 문서
```

## 🔄 **워크플로우 순서**

1. **프로젝트 시작** → `01-projects/`
2. **요구사항 정의** → `02-requirements/`
3. **시스템 설계** → `03-designs/`
4. **작업 분할** → `04-tasks/`
5. **테스트 계획** → `05-tests/`
6. **환경 구성** → `06-environments/`
7. **배포 준비** → `07-deployments/`
8. **운영 관리** → `08-operations/`
9. **문서 정리** → `09-documents/`

## 📋 **각 폴더 상세 정보**

### 01-projects/ - 프로젝트 계획
**목적**: 프로젝트 전체 개요 및 계획 수립
**필수 파일**:
- `PROJECT_OVERVIEW.md` - 프로젝트 개요
- `TEAM_STRUCTURE.md` - 팀 구성 및 역할
- `TIMELINE.md` - 전체 일정 계획
- `BUDGET_RESOURCES.md` - 예산 및 리소스

**작성 요령**:
- 프로젝트 목표 명확히 정의
- 성공 기준 설정
- 주요 이해관계자 식별
- 리스크 요소 파악

### 02-requirements/ - 요구사항 정의
**목적**: 기능/비기능 요구사항 상세 정의
**필수 파일**:
- `PRD.md` - Product Requirements Document
- `FUNCTIONAL_REQUIREMENTS.md` - 기능 요구사항
- `NON_FUNCTIONAL_REQUIREMENTS.md` - 비기능 요구사항
- `USER_STORIES.md` - 사용자 스토리
- `ACCEPTANCE_CRITERIA.md` - 인수 조건

**작성 요령**:
- 사용자 관점에서 기능 정의
- 성능, 보안, 확장성 요구사항 포함
- 우선순위 설정
- 측정 가능한 기준 제시

### 03-designs/ - 시스템 설계
**목적**: 기술적 아키텍처 및 설계 문서화
**필수 파일**:
- `SYSTEM_ARCHITECTURE.md` - 전체 시스템 아키텍처
- `DATABASE_DESIGN.md` - 데이터베이스 설계
- `API_DESIGN.md` - API 명세서
- `UI_UX_DESIGN.md` - UI/UX 설계
- `TECH_STACK.md` - 기술 스택 선택 근거

**작성 요령**:
- 확장 가능한 아키텍처 설계
- 보안 고려사항 포함
- 성능 최적화 방안
- 기술 선택 근거 명시

### 04-tasks/ - 작업 관리
**목적**: 개발 작업 분할 및 진행 상황 추적
**필수 파일**:
- `WBS.md` - Work Breakdown Structure
- `SPRINT_PLAN.md` - 스프린트 계획
- `TASK_DEPENDENCIES.md` - 작업 의존성
- `PROGRESS_TRACKING.md` - 진행 상황 추적

**작성 요령**:
- 작업을 측정 가능한 단위로 분할
- 의존성 관계 명확히 정의
- 담당자 및 마감일 설정
- 정기적인 진행 상황 업데이트

### 05-tests/ - 테스트 관리
**목적**: 테스트 계획 수립 및 품질 보증
**필수 파일**:
- `TEST_PLAN.md` - 테스트 계획서
- `TEST_CASES.md` - 테스트 케이스
- `TEST_RESULTS.md` - 테스트 결과
- `BUG_REPORTS.md` - 버그 리포트
- `COVERAGE_ANALYSIS.md` - 테스트 커버리지

**작성 요령**:
- 단위/통합/시스템 테스트 계획
- 자동화 테스트 전략
- 성능 테스트 시나리오
- 회귀 테스트 계획

### 06-environments/ - 환경 관리
**목적**: 개발/스테이징/프로덕션 환경 구성
**필수 파일**:
- `ENV_SETUP_GUIDE.md` - 환경 설정 가이드
- `INFRASTRUCTURE.md` - 인프라 구성
- `CONFIG_MANAGEMENT.md` - 설정 관리
- `MONITORING_SETUP.md` - 모니터링 설정

**작성 요령**:
- 환경별 설정 차이점 명시
- 보안 설정 포함
- 백업 및 복구 절차
- 스케일링 계획

### 07-deployments/ - 배포 관리
**목적**: 배포 계획 및 실행 관리
**필수 파일**:
- `DEPLOYMENT_PLAN.md` - 배포 계획서
- `DEPLOYMENT_CHECKLIST.md` - 배포 체크리스트
- `ROLLBACK_PLAN.md` - 롤백 계획
- `RELEASE_NOTES.md` - 릴리스 노트

**작성 요령**:
- 단계별 배포 절차
- 롤백 시나리오 준비
- 배포 후 검증 방법
- 다운타임 최소화 전략

### 08-operations/ - 운영 관리
**목적**: 서비스 운영 및 인시던트 대응
**필수 파일**:
- `INCIDENT_RESPONSE.md` - 인시던트 대응 매뉴얼
- `MONITORING_DASHBOARD.md` - 모니터링 대시보드
- `MAINTENANCE_SCHEDULE.md` - 정기 점검 일정
- `POSTMORTEM_REPORTS.md` - 사후 분석 보고서

**작성 요령**:
- 장애 대응 절차 명시
- 에스컬레이션 프로세스
- 성능 지표 모니터링
- 예방적 유지보수 계획

### 09-documents/ - 통합 문서
**목적**: 프로젝트 전반의 문서 통합 관리
**필수 파일**:
- `MEETING_NOTES.md` - 회의록
- `DECISION_LOG.md` - 의사결정 기록
- `LESSONS_LEARNED.md` - 교훈 및 개선사항
- `KNOWLEDGE_BASE.md` - 지식 베이스

**작성 요령**:
- 중요 결정사항 문서화
- 문제 해결 과정 기록
- 팀 지식 공유
- 차후 프로젝트 참고자료

## 🚀 **사용 방법**

### 신규 프로젝트 시작
1. 프로젝트명으로 폴더 생성
2. 위 9개 폴더 구조 복사
3. `01-projects/PROJECT_OVERVIEW.md`부터 시작
4. 순서대로 각 단계 진행

### 기존 프로젝트 관리
1. 해당 단계 폴더에서 문서 업데이트
2. 완료된 작업은 `04-tasks/PROGRESS_TRACKING.md`에 기록
3. 문제 발생 시 `08-operations/INCIDENT_RESPONSE.md` 참조
4. 주요 결정사항은 `09-documents/DECISION_LOG.md`에 기록

### 다른 세션에서 활용
1. 각 폴더의 README.md 먼저 확인
2. 현재 단계에 맞는 폴더에서 작업
3. 필요한 정보는 관련 폴더에서 검색
4. 업데이트된 내용은 즉시 해당 파일에 반영

## 🔄 **실제 사용 시작하기**

### 1. 폴더 구조 복사
```bash
# 새 프로젝트 폴더 생성
mkdir 내프로젝트명
cd 내프로젝트명

# 워크플로우 폴더 구조 복사
cp -r /path/to/workflow-mcp/docs/01-projects ./01-projects
cp -r /path/to/workflow-mcp/docs/02-requirements ./02-requirements
# ... (또는 수동으로 9개 폴더 생성)
```

### 2. 첫 번째 문서 작성
```bash
# 프로젝트 개요부터 시작
cd 01-projects
# PROJECT_OVERVIEW.md 작성 시작
```

### 3. 단계별 진행
- 각 폴더의 `README.md` 확인
- 필수 파일 목록대로 문서 작성
- 체크리스트 완료 후 다음 단계

### 🎯 **실습 예제** (API 폴더)
이 문서와 함께 `docs/api/` 폴더에 실제 워크플로우가 준비되어 있습니다:
```
docs/api/
├── 01-projects/     ✅ 실습용 폴더 (README.md 포함)
├── 02-requirements/ ✅ 실습용 폴더 (README.md 포함)
├── 03-designs/      ✅ 실습용 폴더 (README.md 포함)
...
└── 09-documents/    ✅ 실습용 폴더 (README.md 포함)
```

**바로 시작해보세요:**
1. `docs/api/01-projects/README.md` 열기
2. `PROJECT_OVERVIEW.md` 파일 생성
3. 체크리스트 따라 진행

## 💡 **활용 팁**
- 각 폴더에 `README.md` 파일로 현재 상태 요약
- 파일명에 날짜 포함 (예: `MEETING_NOTES_2024-01-15.md`)
- 템플릿 파일 활용으로 일관성 유지
- 정기적인 문서 업데이트 및 정리

이 시스템을 통해 **체계적이고 일관된 프로젝트 관리**를 경험할 수 있습니다!