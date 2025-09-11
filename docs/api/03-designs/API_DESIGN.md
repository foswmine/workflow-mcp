# 🔌 API 설계 - WorkflowMCP Dashboard API

## 🎯 API 설계 원칙

1. **자기 설명적**: API 자체에서 사용법과 구조 제공
2. **RESTful**: REST 아키텍처 원칙 준수
3. **HATEOAS**: 응답에 관련 링크 포함
4. **세션 친화적**: 새 세션에서도 쉽게 탐색 가능
5. **기존 시스템 무수정**: MCP 도구 래핑만 수행

## 🗺️ 전체 API 맵

### Root Discovery API
```
GET /api
{
  "name": "WorkflowMCP Dashboard API",
  "version": "1.0.0",
  "description": "Complete REST API for WorkflowMCP system",
  "base_url": "http://localhost:3301/api",
  "documentation": "http://localhost:3301/api/docs",
  "help": {
    "getting_started": "/api/help/getting-started",
    "api_reference": "/api/help/reference",
    "examples": "/api/help/examples"
  },
  "discovery": {
    "categories": "/api/discovery/categories",
    "endpoints": "/api/discovery/endpoints",
    "schemas": "/api/discovery/schemas"
  },
  "categories": {
    "prds": {
      "name": "PRD Management", 
      "base": "/api/prds",
      "help": "/api/help/prds"
    },
    "tasks": {
      "name": "Task Management",
      "base": "/api/tasks", 
      "help": "/api/help/tasks"
    },
    "documents": {
      "name": "Document Management",
      "base": "/api/documents",
      "help": "/api/help/documents"
    },
    "analytics": {
      "name": "Analytics & Reports",
      "base": "/api/analytics",
      "help": "/api/help/analytics"
    },
    "system": {
      "name": "System Management",
      "base": "/api/system",
      "help": "/api/help/system"
    }
  },
  "tools": {
    "api_console": "/api/console",
    "health_check": "/api/health",
    "openapi_spec": "/api/openapi.json"
  }
}
```

## 🔍 Discovery & Help API 상세 설계

### 1. Discovery API 시스템

#### GET /api/discovery/categories
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "prds",
        "display_name": "PRD Management",
        "description": "Product Requirements Document management",
        "endpoint_count": 12,
        "base_path": "/api/prds",
        "help_path": "/api/help/prds",
        "examples_path": "/api/help/prds/examples"
      },
      {
        "name": "tasks", 
        "display_name": "Task Management",
        "description": "Task creation, tracking, and dependency management",
        "endpoint_count": 15,
        "base_path": "/api/tasks",
        "help_path": "/api/help/tasks",
        "examples_path": "/api/help/tasks/examples"
      }
    ]
  },
  "links": {
    "self": "/api/discovery/categories",
    "endpoints": "/api/discovery/endpoints",
    "help": "/api/help/discovery"
  }
}
```

#### GET /api/discovery/endpoints
```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "path": "/api/prds",
        "methods": ["GET", "POST"],
        "category": "prds",
        "description": "PRD collection operations",
        "schema": "/api/schemas/prds",
        "help": "/api/help/prds/collection"
      },
      {
        "path": "/api/prds/{id}",
        "methods": ["GET", "PUT", "DELETE"],
        "category": "prds", 
        "description": "Individual PRD operations",
        "schema": "/api/schemas/prd",
        "help": "/api/help/prds/individual"
      }
    ]
  },
  "grouping": {
    "by_category": "/api/discovery/endpoints?group=category",
    "by_method": "/api/discovery/endpoints?group=method"
  }
}
```

### 2. Help API 계층 구조

#### 관리 메뉴별 Help 구조
```
/api/help/
├── getting-started           # 전체 API 시작 가이드
├── authentication           # 인증 (향후 확장)
├── rate-limits              # 사용량 제한
├── errors                   # 에러 처리 가이드
├── prds/                   # PRD 관리 Help
│   ├── overview            # PRD 기능 개요
│   ├── collection          # 목록 관리 (/api/prds)
│   ├── individual          # 개별 관리 (/api/prds/{id})
│   ├── linking             # 문서 연결
│   ├── examples            # 실제 사용 예제
│   └── troubleshooting     # 문제 해결
├── tasks/                  # Task 관리 Help
│   ├── overview
│   ├── collection
│   ├── individual
│   ├── dependencies        # 의존성 관리
│   ├── status-workflow     # 상태 변경 흐름
│   ├── examples
│   └── troubleshooting
├── documents/              # Document 관리 Help
│   ├── overview
│   ├── collection
│   ├── individual
│   ├── search              # 검색 기능
│   ├── types               # 문서 타입 가이드
│   ├── fts                 # 전문 검색
│   ├── examples
│   └── troubleshooting
├── analytics/              # Analytics Help
│   ├── overview
│   ├── dashboards          # 대시보드 데이터
│   ├── metrics             # 메트릭 정의
│   ├── charts              # 차트 데이터 형식
│   └── examples
└── system/                 # System 관리 Help
    ├── overview
    ├── health              # 헬스 체크
    ├── batch               # 배치 작업
    ├── events              # 실시간 이벤트
    ├── caching             # 캐시 관리
    └── monitoring          # 모니터링
```

#### 예제: GET /api/help/prds/overview
```json
{
  "success": true,
  "data": {
    "title": "PRD Management API Overview",
    "description": "Complete guide for managing Product Requirements Documents",
    "quick_start": {
      "steps": [
        {
          "step": 1,
          "action": "List existing PRDs",
          "endpoint": "GET /api/prds",
          "example": "curl http://localhost:3301/api/prds"
        },
        {
          "step": 2,
          "action": "Create a new PRD",
          "endpoint": "POST /api/prds",
          "example": "curl -X POST http://localhost:3301/api/prds -H 'Content-Type: application/json' -d '{\"title\":\"New PRD\",\"description\":\"Description\"}'"
        }
      ]
    },
    "available_operations": {
      "collection": {
        "list": "GET /api/prds",
        "create": "POST /api/prds",
        "batch_create": "POST /api/batch/prds"
      },
      "individual": {
        "get": "GET /api/prds/{id}",
        "update": "PUT /api/prds/{id}",
        "delete": "DELETE /api/prds/{id}"
      },
      "relationships": {
        "list_documents": "GET /api/prds/{id}/documents",
        "link_document": "POST /api/prds/{id}/documents",
        "unlink_document": "DELETE /api/prds/{id}/documents/{doc_id}"
      }
    },
    "data_model": {
      "required_fields": ["title", "description"],
      "optional_fields": ["requirements", "acceptance_criteria", "priority", "status", "project_id"],
      "field_types": {
        "title": "string (1-200 chars)",
        "description": "string (1-5000 chars)",
        "priority": "enum: high|medium|low",
        "status": "enum: draft|review|approved|completed"
      }
    },
    "common_workflows": [
      {
        "name": "Create PRD with linked documents",
        "description": "Complete workflow for PRD creation with documentation",
        "steps": [
          "Create PRD: POST /api/prds",
          "Create related document: POST /api/documents", 
          "Link document to PRD: POST /api/prds/{id}/documents"
        ]
      }
    ],
    "navigation": {
      "parent": "/api/help/prds",
      "siblings": [
        "/api/help/prds/collection",
        "/api/help/prds/individual", 
        "/api/help/prds/examples"
      ],
      "related": [
        "/api/help/documents/overview",
        "/api/help/tasks/overview"
      ]
    }
  },
  "links": {
    "self": "/api/help/prds/overview",
    "examples": "/api/help/prds/examples",
    "schema": "/api/schemas/prd",
    "try_it": "/api/console#prds"
  }
}
```

## 📋 PRD Management API

### Collection Operations

#### GET /api/prds - PRD 목록 조회
```
Query Parameters:
- status (string, optional): draft|review|approved|completed
- project_id (string, optional): 프로젝트 ID 필터
- priority (string, optional): high|medium|low
- sort (string, optional): created_desc|created_asc|updated_desc|title_asc
- limit (integer, optional): 결과 수 제한 (기본: 50, 최대: 200)
- offset (integer, optional): 결과 시작 위치 (기본: 0)
- search (string, optional): 제목/설명 검색

Response:
{
  "success": true,
  "data": {
    "prds": [
      {
        "id": "prd-123",
        "title": "User Authentication System",
        "description": "Complete user auth with JWT",
        "status": "approved",
        "priority": "high",
        "project_id": "proj-456",
        "created_at": "2025-09-11T10:00:00Z",
        "updated_at": "2025-09-11T10:30:00Z",
        "requirements_count": 5,
        "linked_documents_count": 3,
        "linked_tasks_count": 8
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 50,
      "offset": 0,
      "has_next": true,
      "has_prev": false,
      "next_offset": 50,
      "prev_offset": null
    },
    "filters_applied": {
      "status": "approved",
      "project_id": "proj-456"
    }
  },
  "links": {
    "self": "/api/prds?status=approved&project_id=proj-456",
    "next": "/api/prds?status=approved&project_id=proj-456&offset=50",
    "first": "/api/prds?status=approved&project_id=proj-456&offset=0",
    "help": "/api/help/prds/collection",
    "create": "POST /api/prds",
    "schema": "/api/schemas/prd-collection"
  }
}
```

#### POST /api/prds - PRD 생성
```
Request Body:
{
  "title": "User Authentication System",
  "description": "Implement comprehensive user authentication with JWT tokens",
  "requirements": [
    "Login with email/password",
    "JWT token generation",
    "Password reset functionality",
    "User registration"
  ],
  "acceptance_criteria": [
    "User can log in with valid credentials",
    "Invalid credentials show error message",
    "JWT tokens expire after 24 hours",
    "Password reset sends email notification"
  ],
  "priority": "high",
  "status": "draft",
  "project_id": "proj-456"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": "prd-789",
    "title": "User Authentication System",
    "description": "Implement comprehensive user authentication with JWT tokens",
    "requirements": [...],
    "acceptance_criteria": [...],
    "priority": "high",
    "status": "draft",
    "project_id": "proj-456",
    "created_at": "2025-09-11T11:00:00Z",
    "updated_at": "2025-09-11T11:00:00Z"
  },
  "links": {
    "self": "/api/prds/prd-789",
    "update": "PUT /api/prds/prd-789",
    "delete": "DELETE /api/prds/prd-789",
    "documents": "/api/prds/prd-789/documents",
    "create_document": "POST /api/documents",
    "help": "/api/help/prds/individual"
  },
  "message": "PRD created successfully"
}
```

### Individual Operations

#### GET /api/prds/{id} - PRD 상세 조회
```
Response:
{
  "success": true,
  "data": {
    "id": "prd-789",
    "title": "User Authentication System",
    "description": "Implement comprehensive user authentication...",
    "requirements": [...],
    "acceptance_criteria": [...],
    "priority": "high",
    "status": "approved",
    "project_id": "proj-456",
    "created_at": "2025-09-11T11:00:00Z",
    "updated_at": "2025-09-11T11:30:00Z",
    "linked_documents": [
      {
        "id": "doc-101",
        "title": "Auth API Specification",
        "doc_type": "specification",
        "link_type": "specification"
      }
    ],
    "linked_tasks": [
      {
        "id": "task-201", 
        "title": "Implement JWT middleware",
        "status": "in_progress"
      }
    ],
    "statistics": {
      "requirements_count": 4,
      "acceptance_criteria_count": 4,
      "linked_documents_count": 1,
      "linked_tasks_count": 1,
      "completion_percentage": 25
    }
  },
  "links": {
    "self": "/api/prds/prd-789",
    "update": "PUT /api/prds/prd-789",
    "delete": "DELETE /api/prds/prd-789",
    "documents": "/api/prds/prd-789/documents",
    "tasks": "/api/tasks?prd_id=prd-789",
    "project": "/api/projects/proj-456",
    "help": "/api/help/prds/individual",
    "collection": "/api/prds"
  }
}
```

## 📝 Task Management API

### Collection Operations

#### GET /api/tasks - Task 목록 조회
```
Query Parameters:
- status (string, optional): pending|in_progress|done|blocked|cancelled
- priority (string, optional): high|medium|low
- assignee (string, optional): 담당자 필터
- project_id (string, optional): 프로젝트 ID
- prd_id (string, optional): 연결된 PRD ID
- due_date_from (string, optional): 마감일 시작 (YYYY-MM-DD)
- due_date_to (string, optional): 마감일 종료 (YYYY-MM-DD)
- tags (string, optional): 태그 필터 (쉼표 구분)
- sort (string, optional): created_desc|due_date_asc|priority_desc
- limit (integer, optional): 기본 50, 최대 200
- offset (integer, optional): 페이징 오프셋

Response:
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-201",
        "title": "Implement JWT middleware",
        "description": "Create Express middleware for JWT validation",
        "status": "in_progress",
        "priority": "high",
        "assignee": "john.doe",
        "due_date": "2025-09-15",
        "estimated_hours": 8,
        "actual_hours": 5,
        "tags": ["backend", "security", "jwt"],
        "project_id": "proj-456",
        "created_at": "2025-09-11T09:00:00Z",
        "updated_at": "2025-09-11T14:00:00Z",
        "dependencies_count": 2,
        "dependent_tasks_count": 3
      }
    ],
    "summary": {
      "total_tasks": 245,
      "by_status": {
        "pending": 89,
        "in_progress": 45,
        "done": 98,
        "blocked": 13
      },
      "by_priority": {
        "high": 34,
        "medium": 156,
        "low": 55
      }
    }
  },
  "links": {
    "self": "/api/tasks",
    "create": "POST /api/tasks",
    "dependencies": "/api/tasks/dependencies",
    "help": "/api/help/tasks/collection"
  }
}
```

### Task Dependencies

#### GET /api/tasks/{id}/dependencies - 의존성 조회
```
Response:
{
  "success": true,
  "data": {
    "task_id": "task-201",
    "dependencies": {
      "depends_on": [
        {
          "id": "task-199",
          "title": "Setup authentication database",
          "status": "done",
          "dependency_type": "blocking"
        }
      ],
      "dependent_tasks": [
        {
          "id": "task-203", 
          "title": "Create login API endpoint",
          "status": "pending",
          "dependency_type": "blocking"
        }
      ]
    },
    "dependency_graph": {
      "can_start": true,
      "blocking_dependencies": [],
      "ready_to_start": ["task-203", "task-204"]
    }
  },
  "links": {
    "self": "/api/tasks/task-201/dependencies",
    "add_dependency": "POST /api/tasks/task-201/dependencies",
    "task": "/api/tasks/task-201",
    "help": "/api/help/tasks/dependencies"
  }
}
```

#### POST /api/tasks/{id}/dependencies - 의존성 추가
```
Request Body:
{
  "depends_on_task_id": "task-199",
  "dependency_type": "blocking"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "dependency_id": "dep-456",
    "task_id": "task-201",
    "depends_on_task_id": "task-199", 
    "dependency_type": "blocking",
    "created_at": "2025-09-11T15:00:00Z"
  },
  "message": "Dependency added successfully",
  "validation": {
    "circular_dependency_check": "passed",
    "task_existence_check": "passed"
  }
}
```

## 📄 Document Management API

### Collection & Search

#### GET /api/documents - 문서 목록 조회
```
Query Parameters:
- doc_type (string, optional): test_guide|analysis|report|specification|meeting_notes
- category (string, optional): 카테고리 필터
- status (string, optional): draft|review|approved|archived
- tags (string, optional): 태그 필터 (쉼표 구분)
- project_id (string, optional): 프로젝트 ID
- entity_type (string, optional): 연결된 엔티티 타입 (prd|task|plan)
- entity_id (string, optional): 연결된 엔티티 ID
- search (string, optional): 전문 검색
- sort (string, optional): created_desc|updated_desc|title_asc
- limit/offset: 페이징

Response:
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-101",
        "title": "Auth API Specification",
        "summary": "Complete API specification for authentication endpoints",
        "doc_type": "specification",
        "category": "backend",
        "status": "approved",
        "tags": ["api", "auth", "specification"],
        "project_id": "proj-456",
        "word_count": 2456,
        "created_at": "2025-09-11T08:00:00Z",
        "updated_at": "2025-09-11T12:00:00Z",
        "linked_entities": [
          {"type": "prd", "id": "prd-789", "title": "User Authentication System"}
        ]
      }
    ],
    "search_info": {
      "query": "authentication API",
      "total_matches": 12,
      "search_time_ms": 23
    }
  },
  "links": {
    "self": "/api/documents",
    "search": "/api/documents/search",
    "create": "POST /api/documents", 
    "help": "/api/help/documents/collection"
  }
}
```

#### GET /api/documents/search - 전문 검색
```
Query Parameters:
- q (string, required): 검색어
- doc_type (string, optional): 문서 타입 필터
- category (string, optional): 카테고리 필터
- highlight (boolean, optional): 검색어 하이라이팅 (기본: true)
- limit (integer, optional): 결과 수 (기본: 20, 최대: 100)

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "doc-101",
        "title": "Auth API Specification",
        "summary": "Complete API specification for **authentication** endpoints",
        "doc_type": "specification",
        "relevance_score": 0.89,
        "highlights": [
          "JWT **authentication** middleware implementation",
          "**API** endpoint security requirements"
        ],
        "matched_fields": ["title", "content", "tags"]
      }
    ],
    "search_metadata": {
      "query": "authentication API",
      "total_results": 12,
      "search_time_ms": 15,
      "suggestions": ["auth API", "authentication endpoints"],
      "filters_applied": {
        "doc_type": "specification"
      }
    }
  },
  "links": {
    "self": "/api/documents/search?q=authentication+API",
    "related_searches": "/api/documents/search/suggestions?q=authentication+API",
    "help": "/api/help/documents/search"
  }
}
```

## 📊 Analytics & Dashboard API

### Dashboard Data

#### GET /api/analytics/dashboard - 전체 대시보드 데이터
```
Query Parameters:
- project_id (string, optional): 특정 프로젝트
- time_range (string, optional): 7d|30d|90d|1y (기본: 30d)
- include_charts (boolean, optional): 차트 데이터 포함 (기본: true)

Response:
{
  "success": true,
  "data": {
    "overview": {
      "total_prds": 156,
      "total_tasks": 1245,
      "total_documents": 892,
      "active_projects": 23,
      "completion_rate": 0.78
    },
    "recent_activity": [
      {
        "type": "prd_created",
        "entity_id": "prd-789",
        "title": "User Authentication System",
        "timestamp": "2025-09-11T11:00:00Z",
        "user": "john.doe"
      }
    ],
    "charts": {
      "task_status_distribution": {
        "type": "pie",
        "data": [
          {"label": "Completed", "value": 456, "color": "#4CAF50"},
          {"label": "In Progress", "value": 234, "color": "#2196F3"},
          {"label": "Pending", "value": 345, "color": "#FF9800"},
          {"label": "Blocked", "value": 67, "color": "#F44336"}
        ]
      },
      "completion_timeline": {
        "type": "line",
        "data": {
          "labels": ["2025-09-04", "2025-09-05", "2025-09-06", "2025-09-07"],
          "datasets": [
            {
              "label": "Tasks Completed",
              "data": [12, 15, 8, 22],
              "borderColor": "#4CAF50"
            }
          ]
        }
      }
    }
  },
  "links": {
    "self": "/api/analytics/dashboard",
    "project_specific": "/api/analytics/projects/{project_id}/dashboard",
    "help": "/api/help/analytics/dashboards"
  }
}
```

## 🔄 System Management API

### Health Check & Status

#### GET /api/health - 시스템 상태 체크
```
Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-11T15:30:00Z",
    "version": "1.0.0",
    "uptime_seconds": 86400,
    "checks": {
      "database": {
        "status": "healthy",
        "response_time_ms": 5,
        "last_check": "2025-09-11T15:30:00Z"
      },
      "mcp_server": {
        "status": "healthy",
        "response_time_ms": 12,
        "last_check": "2025-09-11T15:30:00Z"
      },
      "file_system": {
        "status": "healthy",
        "available_space_mb": 15680,
        "last_check": "2025-09-11T15:30:00Z"
      }
    },
    "statistics": {
      "api_calls_last_hour": 1245,
      "average_response_time_ms": 89,
      "error_rate_percentage": 0.2
    }
  },
  "links": {
    "self": "/api/health",
    "detailed": "/api/system/status",
    "metrics": "/api/system/metrics"
  }
}
```

### Batch Operations

#### POST /api/batch/prds - PRD 일괄 처리
```
Request Body:
{
  "operation": "create",
  "items": [
    {
      "title": "PRD 1",
      "description": "Description 1",
      "priority": "high"
    },
    {
      "title": "PRD 2", 
      "description": "Description 2",
      "priority": "medium"
    }
  ],
  "options": {
    "stop_on_error": true,
    "return_details": true
  }
}

Response (202 Accepted):
{
  "success": true,
  "data": {
    "batch_id": "batch-123",
    "status": "processing",
    "total_items": 2,
    "processed_items": 0,
    "failed_items": 0,
    "estimated_completion": "2025-09-11T15:35:00Z",
    "created_items": []
  },
  "links": {
    "self": "/api/batch/prds/batch-123",
    "status": "/api/batch/status/batch-123",
    "help": "/api/help/system/batch"
  }
}
```

### Real-time Events (SSE)

#### GET /api/events/stream - 실시간 이벤트 스트림
```
Headers:
Accept: text/event-stream
Cache-Control: no-cache

Query Parameters:
- entity_types (string, optional): prd,task,document (쉼표 구분)
- project_id (string, optional): 특정 프로젝트 이벤트만
- session_id (string, optional): 세션 식별

Response (SSE Stream):
data: {"type":"connection","data":{"session_id":"sess-456","message":"Connected"}}

data: {"type":"prd:created","data":{"id":"prd-789","title":"New PRD","project_id":"proj-456"}}

data: {"type":"task:updated","data":{"id":"task-201","status":"done","updated_by":"john.doe"}}

data: {"type":"heartbeat","data":{"timestamp":"2025-09-11T15:35:00Z","connected_clients":5}}
```

## 🔧 Error Handling & Status Codes

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data provided",
    "details": [
      "Field 'title' is required",
      "Field 'priority' must be one of: high, medium, low"
    ],
    "field_errors": {
      "title": "This field is required",
      "priority": "Invalid value"
    }
  },
  "links": {
    "help": "/api/help/errors/validation",
    "schema": "/api/schemas/prd",
    "examples": "/api/help/prds/examples"
  },
  "timestamp": "2025-09-11T15:40:00Z",
  "request_id": "req-789"
}
```

### HTTP Status Code Usage
- **200 OK**: 성공적인 조회/업데이트
- **201 Created**: 리소스 생성 성공
- **202 Accepted**: 비동기 작업 시작 (배치 처리)
- **204 No Content**: 성공적인 삭제
- **400 Bad Request**: 잘못된 요청 데이터
- **401 Unauthorized**: 인증 필요 (향후)
- **403 Forbidden**: 권한 없음 (향후)
- **404 Not Found**: 리소스 없음
- **409 Conflict**: 중복 또는 충돌 (순환 의존성 등)
- **422 Unprocessable Entity**: 유효하지만 처리 불가능한 요청
- **429 Too Many Requests**: Rate limit 초과
- **500 Internal Server Error**: 서버 오류
- **503 Service Unavailable**: 서비스 일시 중단

## 🔗 HATEOAS Links

### 모든 응답에 포함되는 표준 링크
```json
{
  "links": {
    "self": "/api/prds/123",           // 현재 리소스
    "collection": "/api/prds",         // 컬렉션으로 돌아가기
    "help": "/api/help/prds",          // 관련 도움말
    "schema": "/api/schemas/prd",      // 데이터 스키마
    "examples": "/api/help/prds/examples", // 사용 예제
    "related": {                       // 관련 리소스들
      "documents": "/api/prds/123/documents",
      "tasks": "/api/tasks?prd_id=123"
    },
    "actions": {                       // 수행 가능한 작업들
      "update": "PUT /api/prds/123",
      "delete": "DELETE /api/prds/123"
    }
  }
}
```

---

**작성일**: 2025-09-11  
**작성자**: 시스템 설계자 (Claude Code)  
**검토자**: API 아키텍트, 프론트엔드 개발자  
**버전**: 1.0  
**상태**: UI/UX 설계 대기