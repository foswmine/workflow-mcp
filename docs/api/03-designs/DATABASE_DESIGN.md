# 🗄️ 데이터베이스 설계 - WorkflowMCP Dashboard API

## 🎯 설계 원칙

1. **기존 스키마 보존**: 현재 SQLite 스키마 수정 없이 확장만
2. **API 메타데이터 지원**: Help, Schema, Example 데이터 저장
3. **성능 최적화**: API 응답 속도 향상을 위한 인덱스 추가
4. **확장성**: 향후 기능 추가를 위한 유연한 구조

## 📊 기존 스키마 분석

### 현재 핵심 테이블 (유지)
```sql
-- 기존 테이블들 (수정 없음)
prds (id, title, description, requirements, acceptance_criteria, priority, status, project_id, created_at, updated_at)
tasks (id, title, description, status, priority, assignee, due_date, estimated_hours, actual_hours, tags, project_id, created_at, updated_at)
documents (id, title, content, doc_type, category, summary, tags, status, project_id, created_at, updated_at)
document_links (id, document_id, entity_type, entity_id, link_type, created_at)
task_dependencies (id, task_id, depends_on_task_id, dependency_type, created_at)

-- FTS 테이블 (유지)
documents_fts (document_id, title, content, category, tags)
```

### 기존 인덱스 (유지)
```sql
-- 성능 인덱스들 (기존)
CREATE INDEX idx_prds_status ON prds(status);
CREATE INDEX idx_prds_project_id ON prds(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_documents_category ON documents(category);
```

## 🆕 API 확장 테이블

### 1. API 메타데이터 테이블

#### api_schemas - API 스키마 정보
```sql
CREATE TABLE api_schemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint VARCHAR(255) NOT NULL UNIQUE,          -- '/api/prds', '/api/tasks' 등
    method VARCHAR(10) NOT NULL,                    -- 'GET', 'POST', 'PUT', 'DELETE'
    category VARCHAR(100) NOT NULL,                 -- 'prds', 'tasks', 'documents' 등
    input_schema TEXT,                              -- JSON Schema for request body
    output_schema TEXT,                             -- JSON Schema for response
    description TEXT,                               -- API 엔드포인트 설명
    deprecated BOOLEAN DEFAULT FALSE,               -- 폐기 예정 여부
    version VARCHAR(20) DEFAULT 'v1',               -- API 버전
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_api_schemas_endpoint ON api_schemas(endpoint);
CREATE INDEX idx_api_schemas_category ON api_schemas(category);
CREATE INDEX idx_api_schemas_method ON api_schemas(method);
```

#### api_examples - API 사용 예제
```sql
CREATE TABLE api_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schema_id INTEGER NOT NULL,                     -- api_schemas.id 참조
    name VARCHAR(255) NOT NULL,                     -- 예제 이름
    description TEXT,                               -- 예제 설명
    request_example TEXT,                           -- 요청 예제 (JSON)
    response_example TEXT,                          -- 응답 예제 (JSON)
    curl_example TEXT,                              -- cURL 명령어 예제
    scenario VARCHAR(100),                          -- 'basic', 'advanced', 'error' 등
    order_index INTEGER DEFAULT 0,                 -- 표시 순서
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schema_id) REFERENCES api_schemas(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_api_examples_schema_id ON api_examples(schema_id);
CREATE INDEX idx_api_examples_scenario ON api_examples(scenario);
```

#### api_help_content - Help 컨텐츠
```sql
CREATE TABLE api_help_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path VARCHAR(255) NOT NULL UNIQUE,              -- '/help/prds/overview' 등
    title VARCHAR(255) NOT NULL,                    -- 도움말 제목
    content TEXT NOT NULL,                          -- 도움말 내용 (Markdown)
    category VARCHAR(100) NOT NULL,                 -- 'prds', 'tasks', 'getting-started' 등
    subcategory VARCHAR(100),                       -- 'overview', 'examples', 'troubleshooting' 등
    tags TEXT,                                      -- 검색용 태그 (JSON array)
    order_index INTEGER DEFAULT 0,                 -- 표시 순서
    parent_path VARCHAR(255),                       -- 상위 도움말 경로
    version VARCHAR(20) DEFAULT 'v1',               -- 도움말 버전
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_api_help_path ON api_help_content(path);
CREATE INDEX idx_api_help_category ON api_help_content(category);
CREATE INDEX idx_api_help_parent ON api_help_content(parent_path);

-- FTS for help content search
CREATE VIRTUAL TABLE api_help_fts USING fts5(
    help_id UNINDEXED,
    title, 
    content, 
    category,
    tags,
    content='api_help_content',
    content_rowid='id'
);

-- FTS 트리거
CREATE TRIGGER api_help_fts_insert AFTER INSERT ON api_help_content BEGIN
    INSERT INTO api_help_fts(help_id, title, content, category, tags) 
    VALUES (new.id, new.title, new.content, new.category, new.tags);
END;

CREATE TRIGGER api_help_fts_update AFTER UPDATE ON api_help_content BEGIN
    UPDATE api_help_fts SET title = new.title, content = new.content, 
                           category = new.category, tags = new.tags 
    WHERE help_id = new.id;
END;

CREATE TRIGGER api_help_fts_delete AFTER DELETE ON api_help_content BEGIN
    DELETE FROM api_help_fts WHERE help_id = old.id;
END;
```

### 2. API 사용 통계 테이블

#### api_usage_stats - API 사용 통계
```sql
CREATE TABLE api_usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint VARCHAR(255) NOT NULL,                 -- API 엔드포인트
    method VARCHAR(10) NOT NULL,                    -- HTTP 메서드
    status_code INTEGER NOT NULL,                   -- HTTP 상태 코드
    response_time_ms INTEGER,                       -- 응답 시간 (밀리초)
    request_size INTEGER,                           -- 요청 크기 (bytes)
    response_size INTEGER,                          -- 응답 크기 (bytes)
    user_agent TEXT,                                -- User-Agent
    session_id VARCHAR(100),                        -- 세션 ID
    error_message TEXT,                             -- 에러 메시지 (실패 시)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 (성능 분석용)
CREATE INDEX idx_api_usage_endpoint ON api_usage_stats(endpoint);
CREATE INDEX idx_api_usage_status ON api_usage_stats(status_code);
CREATE INDEX idx_api_usage_created ON api_usage_stats(created_at);
CREATE INDEX idx_api_usage_session ON api_usage_stats(session_id);
```

#### api_rate_limits - Rate Limiting
```sql
CREATE TABLE api_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier VARCHAR(255) NOT NULL,               -- IP 주소 또는 API 키
    endpoint VARCHAR(255),                          -- 특정 엔드포인트 (NULL이면 전체)
    request_count INTEGER DEFAULT 0,               -- 현재 요청 수
    window_start DATETIME NOT NULL,                -- 윈도우 시작 시간
    window_duration INTEGER DEFAULT 900,           -- 윈도우 지속시간 (초, 기본 15분)
    max_requests INTEGER DEFAULT 1000,             -- 최대 요청 수
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(identifier, endpoint, window_start)
);

-- 인덱스
CREATE INDEX idx_rate_limits_identifier ON api_rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON api_rate_limits(window_start);
```

### 3. 실시간 통신 테이블

#### sse_connections - SSE 연결 관리
```sql
CREATE TABLE sse_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(100) NOT NULL UNIQUE,       -- 세션 ID
    connection_id VARCHAR(100) NOT NULL,           -- 연결 ID
    filters TEXT,                                   -- 이벤트 필터 (JSON)
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 인덱스
CREATE INDEX idx_sse_session ON sse_connections(session_id);
CREATE INDEX idx_sse_active ON sse_connections(is_active);
```

#### sse_events - SSE 이벤트 큐
```sql
CREATE TABLE sse_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type VARCHAR(100) NOT NULL,              -- 'prd:created', 'task:updated' 등
    entity_type VARCHAR(50) NOT NULL,              -- 'prd', 'task', 'document'
    entity_id VARCHAR(100) NOT NULL,               -- 엔티티 ID
    event_data TEXT,                                -- 이벤트 데이터 (JSON)
    session_filters TEXT,                          -- 대상 세션 필터 (JSON array)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,                         -- 처리 완료 시간
    is_processed BOOLEAN DEFAULT FALSE
);

-- 인덱스
CREATE INDEX idx_sse_events_type ON sse_events(event_type);
CREATE INDEX idx_sse_events_processed ON sse_events(is_processed);
CREATE INDEX idx_sse_events_created ON sse_events(created_at);
```

### 4. API 캐시 테이블

#### api_cache - API 응답 캐시
```sql
CREATE TABLE api_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key VARCHAR(255) NOT NULL UNIQUE,        -- 캐시 키 (endpoint + params hash)
    endpoint VARCHAR(255) NOT NULL,                -- API 엔드포인트
    params_hash VARCHAR(64),                       -- 파라미터 해시값
    response_data TEXT NOT NULL,                   -- 캐시된 응답 (JSON)
    content_type VARCHAR(100) DEFAULT 'application/json',
    expires_at DATETIME NOT NULL,                  -- 만료 시간
    hit_count INTEGER DEFAULT 0,                   -- 히트 횟수
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX idx_api_cache_endpoint ON api_cache(endpoint);
```

## 🔧 성능 최적화 인덱스

### 1. API 조회 성능 향상 인덱스
```sql
-- PRD API 성능 인덱스
CREATE INDEX idx_prds_status_project ON prds(status, project_id);
CREATE INDEX idx_prds_created_desc ON prds(created_at DESC);
CREATE INDEX idx_prds_updated_desc ON prds(updated_at DESC);

-- Task API 성능 인덱스  
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- Document API 성능 인덱스
CREATE INDEX idx_documents_type_status ON documents(doc_type, status);
CREATE INDEX idx_documents_category_type ON documents(category, doc_type);
CREATE INDEX idx_documents_project_type ON documents(project_id, doc_type);

-- 연결 관계 성능 인덱스
CREATE INDEX idx_document_links_entity ON document_links(entity_type, entity_id);
CREATE INDEX idx_document_links_document ON document_links(document_id, link_type);
CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON task_dependencies(depends_on_task_id);
```

### 2. 복합 쿼리 최적화 인덱스
```sql
-- 대시보드 쿼리 최적화
CREATE INDEX idx_prds_project_status_created ON prds(project_id, status, created_at DESC);
CREATE INDEX idx_tasks_project_status_created ON tasks(project_id, status, created_at DESC);
CREATE INDEX idx_documents_project_type_created ON documents(project_id, doc_type, created_at DESC);

-- 통계 쿼리 최적화
CREATE INDEX idx_usage_stats_endpoint_date ON api_usage_stats(endpoint, DATE(created_at));
CREATE INDEX idx_usage_stats_status_date ON api_usage_stats(status_code, DATE(created_at));
```

## 📈 데이터 마이그레이션 전략

### 1. 기존 데이터 호환성 보장
```sql
-- 기존 데이터 검증 쿼리
SELECT 
    'prds' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(updated_at) as latest_update
FROM prds
UNION ALL
SELECT 'tasks', COUNT(*), MIN(created_at), MAX(updated_at) FROM tasks
UNION ALL  
SELECT 'documents', COUNT(*), MIN(created_at), MAX(updated_at) FROM documents;
```

### 2. API 메타데이터 초기 데이터
```sql
-- API 스키마 기본 데이터 삽입
INSERT INTO api_schemas (endpoint, method, category, description, input_schema, output_schema) VALUES
-- PRD API 스키마
('/api/prds', 'GET', 'prds', 'List all PRDs with optional filtering', 
 '{"type": "object", "properties": {"status": {"type": "string"}, "project_id": {"type": "string"}}}',
 '{"type": "object", "properties": {"success": {"type": "boolean"}, "data": {"type": "array"}}}'),

('/api/prds', 'POST', 'prds', 'Create a new PRD',
 '{"type": "object", "required": ["title", "description"], "properties": {"title": {"type": "string"}, "description": {"type": "string"}}}',
 '{"type": "object", "properties": {"success": {"type": "boolean"}, "data": {"type": "object"}}}'),

-- Task API 스키마
('/api/tasks', 'GET', 'tasks', 'List all tasks with optional filtering',
 '{"type": "object", "properties": {"status": {"type": "string"}, "assignee": {"type": "string"}}}',
 '{"type": "object", "properties": {"success": {"type": "boolean"}, "data": {"type": "array"}}}'),

('/api/tasks', 'POST', 'tasks', 'Create a new task',
 '{"type": "object", "required": ["title", "description"], "properties": {"title": {"type": "string"}, "description": {"type": "string"}}}',
 '{"type": "object", "properties": {"success": {"type": "boolean"}, "data": {"type": "object"}}}');
```

### 3. Help 컨텐츠 초기 데이터
```sql
-- 기본 Help 컨텐츠 삽입
INSERT INTO api_help_content (path, title, content, category, subcategory, order_index) VALUES
('/help/getting-started', 'WorkflowMCP API 시작하기', 
 '# API 시작 가이드\n\n1. GET /api - 전체 API 구조 파악\n2. GET /api/help/getting-started - 이 가이드 읽기\n3. 원하는 카테고리 선택\n4. 예제 확인 후 사용',
 'getting-started', 'overview', 1),

('/help/prds/overview', 'PRD 관리 API 개요',
 '# PRD Management API\n\nProduct Requirements Document를 관리하는 완전한 API입니다.\n\n## 기본 작업\n- GET /api/prds - PRD 목록\n- POST /api/prds - PRD 생성\n- GET /api/prds/{id} - PRD 조회',
 'prds', 'overview', 1),

('/help/tasks/overview', 'Task 관리 API 개요',
 '# Task Management API\n\n작업을 생성, 관리, 추적하는 API입니다.\n\n## 기본 작업\n- GET /api/tasks - 작업 목록\n- POST /api/tasks - 작업 생성\n- PUT /api/tasks/{id} - 작업 수정',
 'tasks', 'overview', 1);
```

## 🔄 자동 유지보수 프로시저

### 1. 캐시 정리 프로시저
```sql
-- 만료된 캐시 정리 (cron job으로 실행)
CREATE TRIGGER cleanup_expired_cache
AFTER INSERT ON api_cache
BEGIN
    DELETE FROM api_cache 
    WHERE expires_at < datetime('now', '-1 hour');
END;
```

### 2. 사용 통계 집계 프로시저
```sql
-- 일일 사용 통계 집계 (매일 실행)
CREATE VIEW daily_api_stats AS
SELECT 
    DATE(created_at) as date,
    endpoint,
    method,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time
FROM api_usage_stats
GROUP BY DATE(created_at), endpoint, method;
```

### 3. 실시간 이벤트 정리
```sql
-- 처리된 이벤트 정리 (1일 후)
CREATE TRIGGER cleanup_processed_events
AFTER UPDATE ON sse_events
WHEN NEW.is_processed = TRUE
BEGIN
    DELETE FROM sse_events 
    WHERE is_processed = TRUE 
    AND processed_at < datetime('now', '-1 day');
END;
```

## 📊 데이터베이스 모니터링

### 1. 성능 모니터링 뷰
```sql
-- API 성능 모니터링
CREATE VIEW api_performance_monitor AS
SELECT 
    endpoint,
    method,
    COUNT(*) as requests_last_hour,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND(100.0 * COUNT(CASE WHEN status_code < 400 THEN 1 END) / COUNT(*), 2) as success_rate
FROM api_usage_stats 
WHERE created_at > datetime('now', '-1 hour')
GROUP BY endpoint, method;
```

### 2. 데이터베이스 건강성 체크
```sql
-- 테이블 크기 및 성장률 모니터링
CREATE VIEW db_health_check AS
SELECT 
    name as table_name,
    COUNT(*) as row_count,
    AVG(LENGTH(title || description || content)) as avg_content_size
FROM sqlite_master m
JOIN (
    SELECT 'prds' as name, COUNT(*) as cnt FROM prds
    UNION ALL
    SELECT 'tasks' as name, COUNT(*) as cnt FROM tasks
    UNION ALL
    SELECT 'documents' as name, COUNT(*) as cnt FROM documents
    UNION ALL
    SELECT 'api_schemas' as name, COUNT(*) as cnt FROM api_schemas
    UNION ALL
    SELECT 'api_help_content' as name, COUNT(*) as cnt FROM api_help_content
) t ON m.name = t.name
WHERE m.type = 'table';
```

## 🎯 확장성 고려사항

### 1. 향후 테이블 확장 준비
```sql
-- 플러그인 시스템을 위한 확장 테이블 (향후)
CREATE TABLE IF NOT EXISTS api_plugins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    endpoints TEXT,                                 -- JSON array of endpoints
    schema_definitions TEXT,                        -- JSON object of schemas
    help_content TEXT,                              -- JSON object of help content
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 멀티테넌시 준비 (향후)
```sql
-- 멀티테넌시 지원을 위한 테넌트 테이블 (향후)
CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    api_quota INTEGER DEFAULT 10000,              -- 월간 API 호출 한도
    storage_quota INTEGER DEFAULT 1000,           -- MB 단위 저장소 한도
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

**작성일**: 2025-09-11  
**작성자**: 시스템 설계자 (Claude Code)  
**검토자**: 데이터베이스 관리자, 백엔드 개발자  
**버전**: 1.0  
**상태**: API 상세 설계 대기