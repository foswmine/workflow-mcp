# 기존 WorkflowMCP 소스 분석
# MCP 도구와 대시보드 메뉴 매핑

## 📋 개요

기존 WorkflowMCP 시스템의 MCP 도구와 대시보드 메뉴를 분석하여 API 구현 범위를 정확히 파악합니다.

## 🛠️ 발견된 MCP 도구 (58개)

### 1. PRD Management (4개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_prd` | PRD 생성 | `/prds/new` | `POST /api/prds` |
| `list_prds` | PRD 목록 조회 | `/prds` | `GET /api/prds` |
| `get_prd` | PRD 상세 조회 | `/prds/[id]` | `GET /api/prds/:id` |
| `update_prd` | PRD 업데이트 | `/prds/[id]/edit` | `PUT /api/prds/:id` |

**Manager**: `PRDManager.js` (dashboard/src/lib/server/, src/models/)

### 2. Design Management (5개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_design` | 디자인 생성 | `/designs/new` | `POST /api/designs` |
| `list_designs` | 디자인 목록 | `/designs` | `GET /api/designs` |
| `get_design` | 디자인 상세 | `/designs/[id]` | `GET /api/designs/:id` |
| `update_design` | 디자인 업데이트 | `/designs/[id]/edit` | `PUT /api/designs/:id` |
| `delete_design` | 디자인 삭제 | - | `DELETE /api/designs/:id` |

**Manager**: `DesignManager.js` (dashboard/src/lib/server/, src/models/)

### 3. Task Management (5개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_task` | 태스크 생성 | `/tasks/new` | `POST /api/tasks` |
| `list_tasks` | 태스크 목록 | `/tasks`, `/kanban` | `GET /api/tasks` |
| `get_task` | 태스크 상세 | `/tasks/[id]` | `GET /api/tasks/:id` |
| `update_task` | 태스크 업데이트 | `/tasks/[id]/edit` | `PUT /api/tasks/:id` |
| `delete_task` | 태스크 삭제 | - | `DELETE /api/tasks/:id` |

**Manager**: `TaskManager.js` (dashboard/src/lib/server/, src/models/)

### 4. Document Management (13개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_document` | 문서 생성 | - | `POST /api/documents` |
| `search_documents` | 문서 검색 | `/documents` | `GET /api/documents/search` |
| `get_document` | 문서 상세 | `/documents/[id]` | `GET /api/documents/:id` |
| `update_document` | 문서 업데이트 | - | `PUT /api/documents/:id` |
| `delete_document` | 문서 삭제 | - | `DELETE /api/documents/:id` |
| `list_documents` | 문서 목록 | `/documents` | `GET /api/documents` |
| `link_document` | 문서 링크 | - | `POST /api/documents/:id/links` |
| `get_document_categories` | 카테고리 조회 | - | `GET /api/documents/categories` |
| `create_prd_document` | PRD 문서 생성 | - | `POST /api/prds/:id/documents` |
| `get_prd_documents` | PRD 문서 목록 | - | `GET /api/prds/:id/documents` |
| `search_prd_documents` | PRD 문서 검색 | - | `GET /api/prds/:id/documents/search` |
| `update_prd_document` | PRD 문서 업데이트 | - | `PUT /api/documents/:id/prd` |
| `link_document_to_prd` | PRD 문서 링크 | - | `POST /api/prds/:id/links` |

**Manager**: `DocumentManager.js` (src/models/)

### 5. Test Management (10개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_test_case` | 테스트 케이스 생성 | `/tests/new` | `POST /api/test-cases` |
| `list_test_cases` | 테스트 케이스 목록 | `/tests` | `GET /api/test-cases` |
| `get_test_case` | 테스트 케이스 상세 | `/tests/[id]` | `GET /api/test-cases/:id` |
| `update_test_case` | 테스트 케이스 업데이트 | `/tests/[id]/edit` | `PUT /api/test-cases/:id` |
| `delete_test_case` | 테스트 케이스 삭제 | - | `DELETE /api/test-cases/:id` |
| `execute_test_case` | 테스트 실행 | - | `POST /api/test-cases/:id/execute` |
| `get_test_executions` | 테스트 실행 결과 | - | `GET /api/test-cases/:id/executions` |
| `get_test_summary` | 테스트 요약 | - | `GET /api/test-summary` |
| `get_test_coverage` | 테스트 커버리지 | - | `GET /api/test-coverage` |
| `link_test_to_task` | 테스트-태스크 링크 | - | `POST /api/test-cases/:id/link-task` |

**Manager**: `TestManager.js` (dashboard/src/lib/server/, src/models/)

### 6. Connection Management (6개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `get_test_connections` | 테스트 연결 조회 | - | `GET /api/test-cases/:id/connections` |
| `add_test_connection` | 테스트 연결 추가 | - | `POST /api/test-cases/:id/connections` |
| `remove_test_connection` | 테스트 연결 제거 | - | `DELETE /api/test-cases/:id/connections/:connId` |
| `get_task_connections` | 태스크 연결 조회 | `/network` | `GET /api/tasks/:id/connections` |
| `add_task_connection` | 태스크 연결 추가 | - | `POST /api/tasks/:id/connections` |
| `remove_task_connection` | 태스크 연결 제거 | - | `DELETE /api/tasks/:id/connections/:connId` |

### 7. Project Management (6개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_project` | 프로젝트 생성 | `/projects/new` | `POST /api/projects` |
| `list_projects` | 프로젝트 목록 | `/projects` | `GET /api/projects` |
| `get_project` | 프로젝트 상세 | `/projects/[id]` | `GET /api/projects/:id` |
| `update_project` | 프로젝트 업데이트 | `/projects/[id]/edit` | `PUT /api/projects/:id` |
| `delete_project` | 프로젝트 삭제 | - | `DELETE /api/projects/:id` |
| `get_project_analytics` | 프로젝트 분석 | `/gantt` | `GET /api/projects/:id/analytics` |

**Manager**: `ProjectManager.js` (dashboard/src/lib/server/)

### 8. Environment Management (4개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_environment` | 환경 생성 | `/environments/new` | `POST /api/environments` |
| `list_environments` | 환경 목록 | `/environments` | `GET /api/environments` |
| `get_environment_status` | 환경 상태 | `/environments/[id]` | `GET /api/environments/:id/status` |
| `update_environment` | 환경 업데이트 | - | `PUT /api/environments/:id` |

### 9. DevOps Management (6개 도구)
| MCP 도구 | 기능 | 대시보드 페이지 | API 엔드포인트 |
|----------|------|-----------------|----------------|
| `create_deployment` | 배포 생성 | `/deployments/create` | `POST /api/deployments` |
| `list_deployments` | 배포 목록 | `/deployments` | `GET /api/deployments` |
| `get_deployment` | 배포 상세 | `/deployments/[id]` | `GET /api/deployments/:id` |
| `create_incident` | 인시던트 생성 | - | `POST /api/incidents` |
| `list_incidents` | 인시던트 목록 | `/incidents/[id]` | `GET /api/incidents` |
| `get_system_health` | 시스템 상태 | `/operations` | `GET /api/system-health` |

**Manager**: `DevOpsManager.js` (dashboard/src/lib/server/)

## 📊 대시보드 메뉴 구조 분석

### 주요 메뉴별 페이지
1. **Home** (`/`) - 대시보드 홈
2. **PRDs** (`/prds`) - PRD 관리
3. **Tasks** (`/tasks`, `/kanban`) - 태스크 관리 및 칸반
4. **Designs** (`/designs`) - 디자인 관리
5. **Tests** (`/tests`) - 테스트 관리
6. **Projects** (`/projects`, `/gantt`) - 프로젝트 관리 및 간트
7. **Documents** (`/documents`) - 문서 관리
8. **Environments** (`/environments`) - 환경 관리
9. **Deployments** (`/deployments`) - 배포 관리
10. **Operations** (`/operations`) - 운영 관리
11. **Network** (`/network`) - 네트워크 관계도
12. **Database** (`/database`) - 데이터베이스 관리

### 특별 페이지
- **Kanban** (`/kanban`) - 태스크 칸반 보드
- **Gantt** (`/gantt`) - 프로젝트 간트 차트
- **Network** (`/network`) - 관계 네트워크 시각화
- **Database** (`/database`) - 데이터베이스 직접 접근

## 🎯 API 구현 우선순위

### High Priority (MVP) - 42개 API
1. **PRD Management** (4개): 핵심 요구사항 관리
2. **Task Management** (5개): 작업 관리
3. **Project Management** (6개): 프로젝트 관리
4. **Document Management** (13개): 문서 저장소
5. **Test Management** (10개): 품질 관리
6. **Connection Management** (4개): 관계 관리

### Medium Priority - 10개 API
1. **Design Management** (5개): 설계 관리
2. **Environment Management** (4개): 환경 관리
3. **특별 페이지 지원**: Kanban, Gantt API

### Low Priority - 6개 API
1. **DevOps Management** (6개): 운영 관리

## 📁 Manager 클래스 위치 매핑

### Dashboard Manager (dashboard/src/lib/server/)
- `PRDManager.js`
- `TaskManager.js` 
- `DesignManager.js`
- `TestManager.js`
- `ProjectManager.js`
- `DevOpsManager.js`

### MCP Server Manager (src/models/)
- `PRDManager.js`
- `TaskManager.js`
- `DesignManager.js` 
- `TestManager.js`
- `DocumentManager.js`

## 🔧 기술적 고려사항

### 1. Manager 클래스 중복
- Dashboard와 MCP Server에 동일한 Manager가 존재
- API 래퍼는 기존 MCP Server Manager를 우선 사용
- 필요시 Dashboard Manager와 통합 고려

### 2. 데이터베이스 접근
- 모든 Manager가 동일한 SQLite 데이터베이스 사용 (`data/workflow.db`)
- API 래퍼에서 직접 DB 접근보다는 Manager 메서드 활용

### 3. 기존 API 엔드포인트
대시보드에 일부 API가 이미 구현되어 있을 수 있음:
- `/api/projects/[id]/links/+server.js`
- `/api/documents/+server.js`
- `/api/documents/[id]/+server.js`

### 4. 실시간 업데이트
기존 대시보드는 페이지 새로고침 방식이므로 API에서 SSE 추가 시 호환성 고려 필요

## 📋 다음 단계

1. **기존 API 엔드포인트 조사** - 중복 방지
2. **Manager 클래스 통합 전략 수립** - Dashboard vs MCP Server
3. **API 래퍼 구현 순서 결정** - High Priority 우선
4. **테스트 전략 수립** - 기존 기능 회귀 방지
5. **대시보드 통합 계획** - 점진적 API 적용

## 🚨 중요 발견: 기존 API 엔드포인트 (34개)

**결론**: 이미 상당수의 API가 SvelteKit 형태로 구현되어 있음!

### 기존 구현된 API 엔드포인트
| 기능 영역 | 기존 엔드포인트 | HTTP 메서드 | 상태 |
|-----------|-----------------|-------------|------|
| **Dashboard** | `/api/dashboard` | GET | ✅ 구현됨 |
| **PRDs** | `/api/prds` | GET, POST | ✅ 구현됨 |
| **PRDs** | `/api/prds/[id]` | GET, PUT, DELETE | ✅ 구현됨 |
| **PRDs Relations** | `/api/prds/[id]/designs` | GET | ✅ 구현됨 |
| **PRDs Relations** | `/api/prds/[id]/tasks` | GET | ✅ 구현됨 |
| **Designs** | `/api/designs` | GET, POST | ✅ 구현됨 |
| **Designs** | `/api/designs/[id]` | GET, PUT, DELETE | ✅ 구현됨 |
| **Tasks** | `/api/tasks` | GET, POST | ✅ 구현됨 |
| **Tasks** | `/api/tasks/[id]` | GET, PUT, DELETE | ✅ 구현됨 |
| **Tasks Relations** | `/api/tasks/[id]/connections` | GET, POST, DELETE | ✅ 구현됨 |
| **Tasks Relations** | `/api/tasks/[id]/tests` | GET | ✅ 구현됨 |
| **Tests** | `/api/tests` | GET, POST | ✅ 구현됨 |
| **Tests** | `/api/tests/[id]` | GET, PUT, DELETE | ✅ 구현됨 |
| **Tests** | `/api/tests/[id]/execute` | POST | ✅ 구현됨 |
| **Tests** | `/api/tests/[id]/executions` | GET | ✅ 구현됨 |
| **Tests** | `/api/tests/link-task` | POST | ✅ 구현됨 |
| **Projects** | `/api/projects` | GET, POST | ✅ 구현됨 |
| **Projects** | `/api/projects/[id]` | GET, PUT, DELETE | ✅ 구현됨 |
| **Projects** | `/api/projects/[id]/links` | GET, POST | ✅ 구현됨 |
| **Documents** | `/api/documents` | GET, POST | ✅ 구현됨 |
| **Documents** | `/api/documents/[id]` | GET, PUT, DELETE | ✅ 구현됨 |
| **Documents** | `/api/document-categories` | GET | ✅ 구현됨 |
| **Environments** | `/api/environments` | GET, POST | ✅ 구현됨 |
| **Environments** | `/api/environments/[id]` | GET, PUT | ✅ 구현됨 |
| **Deployments** | `/api/deployments` | GET, POST | ✅ 구현됨 |
| **Deployments** | `/api/deployments/[id]` | GET | ✅ 구현됨 |
| **Deployments** | `/api/deployments/[id]/execute` | POST | ✅ 구현됨 |
| **Deployments** | `/api/deployments/[id]/rollback` | POST | ✅ 구현됨 |
| **DevOps** | `/api/system-health` | GET | ✅ 구현됨 |
| **DevOps** | `/api/performance-metrics` | GET | ✅ 구현됨 |
| **DevOps** | `/api/alert-rules` | GET, POST | ✅ 구현됨 |
| **DevOps** | `/api/incidents` | GET, POST | ✅ 구현됨 |
| **DevOps** | `/api/incidents/[id]` | GET | ✅ 구현됨 |
| **Maintenance** | `/api/maintenance` | GET, POST | ✅ 구현됨 |
| **Relationships** | `/api/relationships` | GET | ✅ 구현됨 |

### 구현 패턴 분석

#### 1. Manager 클래스 사용 패턴
```javascript
// PRD API 예시
import { PRDManager } from '$lib/server/PRDManager.js';
const prdManager = new PRDManager();

export async function GET({ url }) {
  const result = await prdManager.listPRDs(null, sortBy);
  return json(result.prds);
}
```

#### 2. 직접 데이터베이스 접근 패턴
```javascript
// Documents API 예시
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPath = 'C:/dev/workflow-mcp/data/workflow.db';

export async function GET({ url }) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  // 직접 SQL 쿼리 실행
}
```

## 🎯 API 통합 전략 재검토

### 현재 상황
1. **SvelteKit API**: 34개 엔드포인트 이미 구현
2. **MCP 도구**: 58개 도구 존재
3. **격차**: MCP 도구의 일부만 API로 노출됨

### 새로운 접근 방식
🔄 **기존 계획 수정**: 완전히 새로운 API 서버 대신 기존 SvelteKit API 확장

#### Option A: SvelteKit API 확장 (권장)
- **장점**: 기존 코드 재사용, 빠른 구현, 대시보드와 완전 통합
- **단점**: SvelteKit 종속성
- **구현**: 기존 `/api/` 라우트에 누락된 MCP 도구 추가

#### Option B: 별도 Express API 서버
- **장점**: 독립적 API, 유연한 구조
- **단점**: 코드 중복, 별도 포트 필요
- **구현**: 기존 계획대로 Express.js 서버

#### Option C: 하이브리드 접근
- **기존 API**: SvelteKit에서 계속 제공
- **확장 API**: Express.js에서 누락된 기능 제공
- **자기설명적 API**: Express.js에서 Discovery/Help 시스템

## 📊 MCP vs API 매핑 업데이트

### 이미 API로 구현된 MCP 도구 (약 30개)
✅ **완전 구현**:
- PRD: `create_prd`, `list_prds`, `get_prd`, `update_prd`
- Design: `create_design`, `list_designs`, `get_design`, `update_design`, `delete_design`
- Task: `create_task`, `list_tasks`, `get_task`, `update_task`, `delete_task`
- Test: `create_test_case`, `list_test_cases`, `get_test_case`, `update_test_case`, `delete_test_case`, `execute_test_case`, `get_test_executions`
- Project: `create_project`, `list_projects`, `get_project`, `update_project`, `delete_project`
- Document: `create_document`, `list_documents`, `get_document`, `update_document`, `delete_document`
- Environment: `create_environment`, `list_environments`, `update_environment`
- Deployment: `create_deployment`, `list_deployments`, `get_deployment`

### API로 미구현된 MCP 도구 (약 28개)
❌ **누락된 기능**:
- `get_document_categories` → 부분 구현됨 (`/api/document-categories`)
- `link_document`, `create_prd_document`, `get_prd_documents` 등 문서 연결 기능
- `get_test_summary`, `get_test_coverage`, `link_test_to_task` 등 테스트 관리
- `get_task_connections`, `add_task_connection` 등 연결 관리 
- `get_project_analytics` 등 분석 기능
- `get_environment_status` 등 상태 조회
- `create_incident`, `list_incidents`, `get_system_health` 등 운영 관리

## 🔧 수정된 구현 계획

### Phase 1: 기존 API 분석 및 보강 (1주)
1. **Gap Analysis**: MCP vs API 상세 매핑
2. **누락 기능 구현**: SvelteKit API 라우트 추가
3. **API 표준화**: 응답 형식 통일

### Phase 2: 자기설명적 API 추가 (1주)  
1. **Discovery API**: Express.js로 별도 구현
2. **Help System**: API 탐색 도구
3. **HATEOAS**: 기존 API에 링크 추가

### Phase 3: 통합 및 최적화 (1주)
1. **API Gateway**: 통합 엔드포인트
2. **문서화**: OpenAPI 스펙
3. **모니터링**: 사용량 추적

## 🔍 추가 조사 필요 사항

1. ✅ **기존 API 라우트**: 34개 엔드포인트 분석 완료
2. **Manager 메서드**: 각 Manager 클래스의 public 메서드 목록
3. **데이터베이스 스키마**: 테이블 구조 및 관계 확인
4. **대시보드 API 호출**: 기존 fetch/API 호출 패턴 분석
5. **API 응답 형식**: 기존 응답 구조 분석