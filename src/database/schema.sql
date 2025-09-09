-- WorkflowMCP SQLite Database Schema
-- Phase 2.5: JSON to SQLite Migration
-- Created: 2025-09-05

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =============================================
-- Core Tables
-- =============================================

-- Projects (Phase 3 addition)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('planning', 'active', 'on_hold', 'completed')) DEFAULT 'planning',
    priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    start_date TEXT, -- ISO string
    end_date TEXT, -- ISO string
    created_at TEXT NOT NULL,
    updated_at TEXT,
    created_by TEXT DEFAULT 'system',
    manager TEXT, -- Project manager
    tags TEXT, -- JSON array as text
    progress INTEGER DEFAULT 0, -- 0-100%
    notes TEXT
);

-- PRDs (Product Requirements Documents)
CREATE TABLE IF NOT EXISTS prds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT, -- JSON array as text
    priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT CHECK(status IN ('draft', 'review', 'approved', 'archived')) DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT,
    
    -- Project relationship
    project_id TEXT REFERENCES projects(id),
    
    -- Metadata
    version INTEGER DEFAULT 1,
    created_by TEXT,
    tags TEXT -- JSON array as text
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'done', 'blocked')) DEFAULT 'pending',
    priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    assignee TEXT,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    due_date TEXT, -- ISO string
    created_at TEXT NOT NULL,
    updated_at TEXT,
    
    -- Phase 2 additions
    plan_id TEXT, -- Foreign key to plans
    prd_id TEXT, -- Foreign key to PRDs (직접 연결)
    
    -- Project relationship
    project_id TEXT REFERENCES projects(id),
    
    -- Metadata
    version INTEGER DEFAULT 1,
    created_by TEXT,
    tags TEXT, -- JSON array as text
    notes TEXT,
    
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
    start_date TEXT, -- ISO string
    end_date TEXT, -- ISO string
    created_at TEXT NOT NULL,
    updated_at TEXT,
    
    -- Phase 2 additions
    prd_id TEXT, -- Foreign key to prds
    
    -- Progress tracking (calculated fields)
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    in_progress_tasks INTEGER DEFAULT 0,
    todo_tasks INTEGER DEFAULT 0,
    blocked_tasks INTEGER DEFAULT 0,
    progress_percentage REAL DEFAULT 0.0,
    last_sync_at TEXT,
    estimated_completion_date TEXT,
    
    -- Metadata
    version INTEGER DEFAULT 1,
    created_by TEXT,
    tags TEXT, -- JSON array as text
    
    FOREIGN KEY (prd_id) REFERENCES prds(id) ON DELETE SET NULL
);

-- Milestones (separated from plans for better normalization)
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT, -- ISO string
    completed BOOLEAN DEFAULT FALSE,
    completed_at TEXT, -- ISO string
    created_at TEXT NOT NULL,
    updated_at TEXT,
    sort_order INTEGER DEFAULT 0,
    
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

-- =============================================
-- Relationship Tables (Many-to-Many)
-- =============================================

-- Task Dependencies (self-referencing many-to-many)
CREATE TABLE IF NOT EXISTS task_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dependent_task_id TEXT NOT NULL, -- The task that depends on another
    prerequisite_task_id TEXT NOT NULL, -- The task that must be completed first
    created_at TEXT NOT NULL,
    created_by TEXT,
    
    UNIQUE(dependent_task_id, prerequisite_task_id),
    FOREIGN KEY (dependent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Prevent self-dependency
    CHECK (dependent_task_id != prerequisite_task_id)
);

-- PRD-Plan connections (many-to-many, though typically one-to-many)
CREATE TABLE IF NOT EXISTS prd_plan_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prd_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT,
    
    UNIQUE(prd_id, plan_id),
    FOREIGN KEY (prd_id) REFERENCES prds(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

-- Plan-Task connections (many-to-many)
CREATE TABLE IF NOT EXISTS plan_task_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT,
    
    UNIQUE(plan_id, task_id),
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- PRD-Task direct connections (many-to-many)
CREATE TABLE IF NOT EXISTS prd_task_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prd_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    link_type TEXT CHECK(link_type IN ('direct', 'derived', 'related')) DEFAULT 'direct',
    created_at TEXT NOT NULL,
    created_by TEXT,
    notes TEXT, -- Optional notes about the connection
    
    UNIQUE(prd_id, task_id),
    FOREIGN KEY (prd_id) REFERENCES prds(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Core entity indexes
CREATE INDEX IF NOT EXISTS idx_prds_status ON prds(status);
CREATE INDEX IF NOT EXISTS idx_prds_priority ON prds(priority);
CREATE INDEX IF NOT EXISTS idx_prds_created_at ON prds(created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_prd_id ON plans(prd_id);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at);

CREATE INDEX IF NOT EXISTS idx_milestones_plan_id ON milestones(plan_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_task_deps_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_prerequisite ON task_dependencies(prerequisite_task_id);

CREATE INDEX IF NOT EXISTS idx_prd_plan_prd ON prd_plan_links(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_plan_plan ON prd_plan_links(plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_task_plan ON plan_task_links(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_task_task ON plan_task_links(task_id);

CREATE INDEX IF NOT EXISTS idx_prd_task_prd ON prd_task_links(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_task_task ON prd_task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_prd_task_type ON prd_task_links(link_type);

-- =============================================
-- Views for Common Queries
-- =============================================

-- Tasks with their plan and PRD information
CREATE VIEW IF NOT EXISTS tasks_with_context AS
SELECT 
    t.*,
    p.title AS plan_title,
    p.status AS plan_status,
    pr.title AS prd_title,
    pr.status AS prd_status
FROM tasks t
LEFT JOIN plans p ON t.plan_id = p.id
LEFT JOIN prds pr ON p.prd_id = pr.id;

-- Plans with progress summary
CREATE VIEW IF NOT EXISTS plans_with_progress AS
SELECT 
    p.*,
    pr.title AS prd_title,
    pr.status AS prd_status,
    COUNT(t.id) AS actual_total_tasks,
    COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS actual_completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS actual_in_progress_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) AS actual_todo_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) AS actual_blocked_tasks,
    CASE 
        WHEN COUNT(t.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN t.status = 'done' THEN 1 END) * 100.0) / COUNT(t.id), 2)
        ELSE 0 
    END AS actual_progress_percentage
FROM plans p
LEFT JOIN prds pr ON p.prd_id = pr.id
LEFT JOIN tasks t ON t.plan_id = p.id
GROUP BY p.id;

-- Task dependency chain view
CREATE VIEW IF NOT EXISTS task_dependency_chain AS
SELECT 
    td.dependent_task_id,
    td.prerequisite_task_id,
    t1.title AS dependent_task_title,
    t1.status AS dependent_task_status,
    t2.title AS prerequisite_task_title,
    t2.status AS prerequisite_task_status,
    td.created_at
FROM task_dependencies td
JOIN tasks t1 ON td.dependent_task_id = t1.id
JOIN tasks t2 ON td.prerequisite_task_id = t2.id;

-- Dashboard summary view
CREATE VIEW IF NOT EXISTS dashboard_summary AS
SELECT 
    'overview' AS section,
    COUNT(DISTINCT pr.id) AS total_prds,
    COUNT(DISTINCT p.id) AS total_plans,
    COUNT(DISTINCT t.id) AS total_tasks,
    COUNT(DISTINCT m.id) AS total_milestones,
    COUNT(DISTINCT CASE WHEN pr.status = 'approved' THEN pr.id END) AS approved_prds,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) AS active_plans,
    COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'blocked' THEN t.id END) AS blocked_tasks,
    COUNT(DISTINCT CASE WHEN m.completed = 1 THEN m.id END) AS completed_milestones
FROM prds pr, plans p, tasks t, milestones m;

-- =============================================
-- Triggers for Data Integrity and Automation
-- =============================================

-- Update plans.updated_at when tasks are modified
CREATE TRIGGER IF NOT EXISTS update_plan_timestamp_on_task_change
    AFTER UPDATE ON tasks
    WHEN OLD.plan_id IS NOT NULL OR NEW.plan_id IS NOT NULL
BEGIN
    UPDATE plans 
    SET updated_at = datetime('now')
    WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
END;

-- Update plan progress when task status changes
CREATE TRIGGER IF NOT EXISTS update_plan_progress_on_task_status_change
    AFTER UPDATE ON tasks
    WHEN OLD.status != NEW.status AND NEW.plan_id IS NOT NULL
BEGIN
    UPDATE plans SET
        total_tasks = (
            SELECT COUNT(*) FROM tasks WHERE plan_id = NEW.plan_id
        ),
        completed_tasks = (
            SELECT COUNT(*) FROM tasks WHERE plan_id = NEW.plan_id AND status = 'done'
        ),
        in_progress_tasks = (
            SELECT COUNT(*) FROM tasks WHERE plan_id = NEW.plan_id AND status = 'in_progress'
        ),
        todo_tasks = (
            SELECT COUNT(*) FROM tasks WHERE plan_id = NEW.plan_id AND status = 'pending'
        ),
        blocked_tasks = (
            SELECT COUNT(*) FROM tasks WHERE plan_id = NEW.plan_id AND status = 'blocked'
        ),
        progress_percentage = (
            SELECT CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(CASE WHEN status = 'done' THEN 1 END) * 100.0) / COUNT(*), 2)
                ELSE 0 
            END
            FROM tasks WHERE plan_id = NEW.plan_id
        ),
        last_sync_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = NEW.plan_id;
END;

-- Prevent circular dependencies
CREATE TRIGGER IF NOT EXISTS prevent_circular_dependency
    BEFORE INSERT ON task_dependencies
BEGIN
    SELECT CASE
        WHEN EXISTS (
            WITH RECURSIVE dependency_chain(task_id, level) AS (
                SELECT NEW.prerequisite_task_id, 0
                UNION ALL
                SELECT td.prerequisite_task_id, level + 1
                FROM task_dependencies td
                JOIN dependency_chain dc ON td.dependent_task_id = dc.task_id
                WHERE level < 100  -- Prevent infinite recursion
            )
            SELECT 1 FROM dependency_chain 
            WHERE task_id = NEW.dependent_task_id
        )
        THEN RAISE(ABORT, '순환 의존성이 감지되었습니다. 이 의존성을 추가할 수 없습니다.')
    END;
END;

-- =============================================
-- Initial Data and Configuration
-- =============================================

-- Create system configuration table
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
);

-- Insert initial configuration
INSERT OR IGNORE INTO system_config (key, value, description, updated_at) VALUES
    ('schema_version', '2.5.0', 'Database schema version', datetime('now')),
    ('migration_from', 'json_files', 'Original data source', datetime('now')),
    ('created_at', datetime('now'), 'Database creation timestamp', datetime('now')),
    ('last_backup', '', 'Last backup timestamp', datetime('now'));

-- =============================================
-- Analysis and Reporting Functions
-- =============================================

-- Note: SQLite doesn't support stored procedures, but we can create views for common analyses

-- Blocked tasks analysis
CREATE VIEW IF NOT EXISTS blocked_tasks_analysis AS
SELECT 
    t.id,
    t.title,
    t.assignee,
    t.plan_id,
    p.title AS plan_title,
    GROUP_CONCAT(t2.title, '; ') AS blocking_tasks,
    COUNT(td.prerequisite_task_id) AS blocking_count
FROM tasks t
LEFT JOIN plans p ON t.plan_id = p.id
LEFT JOIN task_dependencies td ON t.id = td.dependent_task_id
LEFT JOIN tasks t2 ON td.prerequisite_task_id = t2.id AND t2.status != 'done'
WHERE t.status = 'blocked'
GROUP BY t.id;

-- Project velocity analysis (tasks completed per time period)
CREATE VIEW IF NOT EXISTS project_velocity AS
SELECT 
    DATE(t.updated_at) AS completion_date,
    COUNT(*) AS tasks_completed,
    AVG(t.actual_hours) AS avg_hours_per_task,
    SUM(t.actual_hours) AS total_hours
FROM tasks t
WHERE t.status = 'done' 
    AND t.updated_at >= date('now', '-30 days')
GROUP BY DATE(t.updated_at)
ORDER BY completion_date DESC;

-- =============================================
-- Document Management System (Phase 2.7)
-- =============================================

-- Documents table for storing all project documents
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK(doc_type IN ('test_guide', 'test_results', 'analysis', 'report', 'checklist', 'specification', 'meeting_notes', 'decision_log')),
    category TEXT, -- 'phase_2.6', 'testing', 'development', etc.
    file_path TEXT, -- Original file path if imported from file
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Project relationship
    project_id TEXT REFERENCES projects(id),
    
    -- Metadata
    version INTEGER DEFAULT 1,
    created_by TEXT,
    tags TEXT, -- JSON array: ["testing", "sveltekit", "phase_2.6"]
    summary TEXT, -- Brief summary for quick reference
    status TEXT CHECK(status IN ('draft', 'review', 'approved', 'archived')) DEFAULT 'draft'
);

-- Document Relations - for linking documents to each other
CREATE TABLE IF NOT EXISTS document_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_doc_id INTEGER NOT NULL,
    child_doc_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL CHECK(relation_type IN ('reference', 'supersedes', 'related', 'follow_up', 'implements')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_doc_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (child_doc_id) REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Prevent self-references and duplicate relations
    UNIQUE(parent_doc_id, child_doc_id, relation_type),
    CHECK(parent_doc_id != child_doc_id)
);

-- Document Links - for linking documents to PRDs, Tasks, Plans
CREATE TABLE IF NOT EXISTS document_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    linked_entity_type TEXT NOT NULL CHECK(linked_entity_type IN ('prd', 'task', 'plan')),
    linked_entity_id TEXT NOT NULL,
    link_type TEXT CHECK(link_type IN ('specification', 'test_plan', 'result', 'analysis', 'notes')) DEFAULT 'notes',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Ensure unique links
    UNIQUE(document_id, linked_entity_type, linked_entity_id, link_type)
);

-- Document Search Index for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    title,
    content,
    summary,
    tags,
    content=documents,
    content_rowid=id
);

-- Triggers to maintain FTS index
CREATE TRIGGER IF NOT EXISTS documents_fts_insert AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(rowid, title, content, summary, tags) 
    VALUES (new.id, new.title, new.content, new.summary, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_update AFTER UPDATE ON documents BEGIN
    UPDATE documents_fts 
    SET title = new.title, content = new.content, summary = new.summary, tags = new.tags
    WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_delete AFTER DELETE ON documents BEGIN
    DELETE FROM documents_fts WHERE rowid = old.id;
END;

-- Document management views
CREATE VIEW IF NOT EXISTS document_overview AS
SELECT 
    d.id,
    d.title,
    d.doc_type,
    d.category,
    d.summary,
    d.status,
    d.created_at,
    d.updated_at,
    COUNT(DISTINCT dr1.child_doc_id) as related_docs_count,
    COUNT(DISTINCT dl.linked_entity_id) as linked_entities_count,
    GROUP_CONCAT(DISTINCT json_extract(d.tags, '$[*]')) as tag_list
FROM documents d
LEFT JOIN document_relations dr1 ON d.id = dr1.parent_doc_id
LEFT JOIN document_links dl ON d.id = dl.document_id
GROUP BY d.id
ORDER BY d.updated_at DESC;

-- =============================================
-- Test Management System (Phase 3.0)
-- =============================================

-- Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('unit', 'integration', 'system', 'acceptance', 'regression')) DEFAULT 'unit',
    status TEXT CHECK(status IN ('draft', 'ready', 'active', 'deprecated')) DEFAULT 'draft',
    priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    
    -- Connection relationships
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    design_id TEXT REFERENCES designs(id) ON DELETE SET NULL,
    prd_id TEXT REFERENCES prds(id) ON DELETE SET NULL,
    
    -- Project relationship
    project_id TEXT REFERENCES projects(id),
    
    -- Test details
    preconditions TEXT,
    test_steps TEXT, -- JSON array of steps
    expected_result TEXT,
    test_data TEXT, -- JSON object for test data
    
    -- Metadata
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system',
    version INTEGER DEFAULT 1,
    tags TEXT, -- JSON array
    
    -- Execution info
    estimated_duration INTEGER DEFAULT 0, -- minutes
    complexity TEXT CHECK(complexity IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    automation_status TEXT CHECK(automation_status IN ('manual', 'automated', 'semi_automated')) DEFAULT 'manual'
);

-- Test Executions Table
CREATE TABLE IF NOT EXISTS test_executions (
    id TEXT PRIMARY KEY,
    test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    
    -- Execution info
    execution_date TEXT DEFAULT (datetime('now')),
    executed_by TEXT DEFAULT 'system',
    environment TEXT DEFAULT 'development', -- development, staging, production
    
    -- Result info
    status TEXT CHECK(status IN ('pass', 'fail', 'blocked', 'skipped', 'pending')) NOT NULL,
    actual_result TEXT,
    notes TEXT,
    defects_found TEXT, -- JSON array of defect IDs
    
    -- Time tracking
    actual_duration INTEGER, -- minutes
    started_at TEXT,
    completed_at TEXT,
    
    -- Attachments (screenshots, logs, etc.)
    attachments TEXT, -- JSON array
    
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Test Defects/Issues Table
CREATE TABLE IF NOT EXISTS test_defects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed', 'deferred')) DEFAULT 'open',
    
    -- Connection relationships
    test_case_id TEXT REFERENCES test_cases(id) ON DELETE SET NULL,
    test_execution_id TEXT REFERENCES test_executions(id) ON DELETE SET NULL,
    related_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL, -- Task for fixing this defect
    
    -- Metadata
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system',
    assigned_to TEXT,
    resolved_at TEXT,
    
    -- Additional info
    steps_to_reproduce TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    workaround TEXT,
    tags TEXT -- JSON array
);

-- Test Case Dependencies (similar to task dependencies)
CREATE TABLE IF NOT EXISTS test_case_dependencies (
    id TEXT PRIMARY KEY,
    test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    depends_on_test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    dependency_type TEXT CHECK(dependency_type IN ('prerequisite', 'blocks', 'related')) DEFAULT 'prerequisite',
    created_at TEXT DEFAULT (datetime('now')),
    
    -- Prevent self-dependency
    CHECK (test_case_id != depends_on_test_case_id),
    UNIQUE(test_case_id, depends_on_test_case_id)
);

-- Test Suites (groups of test cases)
CREATE TABLE IF NOT EXISTS test_suites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('smoke', 'regression', 'integration', 'acceptance')) DEFAULT 'regression',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system'
);

-- Test Suite-Case relationships
CREATE TABLE IF NOT EXISTS test_suite_cases (
    id TEXT PRIMARY KEY,
    test_suite_id TEXT NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    execution_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    
    UNIQUE(test_suite_id, test_case_id)
);

-- =============================================
-- Test Management Indexes
-- =============================================

-- Test cases indexes
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_type ON test_cases(type);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_task_id ON test_cases(task_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_design_id ON test_cases(design_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_prd_id ON test_cases(prd_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON test_cases(created_at);

-- Test executions indexes
CREATE INDEX IF NOT EXISTS idx_test_executions_test_case_id ON test_executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_execution_date ON test_executions(execution_date);
CREATE INDEX IF NOT EXISTS idx_test_executions_environment ON test_executions(environment);

-- Test defects indexes
CREATE INDEX IF NOT EXISTS idx_test_defects_status ON test_defects(status);
CREATE INDEX IF NOT EXISTS idx_test_defects_severity ON test_defects(severity);
CREATE INDEX IF NOT EXISTS idx_test_defects_test_case_id ON test_defects(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_defects_assigned_to ON test_defects(assigned_to);

-- =============================================
-- Test Management Views
-- =============================================

-- Test cases with execution summary
CREATE VIEW IF NOT EXISTS test_cases_with_stats AS
SELECT 
    tc.*,
    COUNT(te.id) AS total_executions,
    COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
    COUNT(CASE WHEN te.status = 'fail' THEN 1 END) AS failed_executions,
    COUNT(CASE WHEN te.status = 'blocked' THEN 1 END) AS blocked_executions,
    MAX(te.execution_date) AS last_execution_date,
    (SELECT status FROM test_executions WHERE test_case_id = tc.id ORDER BY execution_date DESC LIMIT 1) AS last_execution_status,
    CASE 
        WHEN COUNT(te.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN te.status = 'pass' THEN 1 END) * 100.0) / COUNT(te.id), 2)
        ELSE 0 
    END AS pass_rate_percentage
FROM test_cases tc
LEFT JOIN test_executions te ON tc.id = te.test_case_id
GROUP BY tc.id;

-- Test execution summary by date
CREATE VIEW IF NOT EXISTS test_execution_summary AS
SELECT 
    DATE(execution_date) AS execution_date,
    environment,
    COUNT(*) AS total_executions,
    COUNT(CASE WHEN status = 'pass' THEN 1 END) AS passed,
    COUNT(CASE WHEN status = 'fail' THEN 1 END) AS failed,
    COUNT(CASE WHEN status = 'blocked' THEN 1 END) AS blocked,
    COUNT(CASE WHEN status = 'skipped' THEN 1 END) AS skipped,
    ROUND((COUNT(CASE WHEN status = 'pass' THEN 1 END) * 100.0) / COUNT(*), 2) AS pass_rate
FROM test_executions
GROUP BY DATE(execution_date), environment
ORDER BY execution_date DESC;

-- Test coverage by task
CREATE VIEW IF NOT EXISTS test_coverage_by_task AS
SELECT 
    t.id AS task_id,
    t.title AS task_title,
    t.status AS task_status,
    COUNT(tc.id) AS test_cases_count,
    COUNT(CASE WHEN tc.status = 'active' THEN 1 END) AS active_test_cases,
    COUNT(DISTINCT te.id) AS total_executions,
    COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
    CASE 
        WHEN COUNT(tc.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN tc.status = 'active' THEN 1 END) * 100.0) / COUNT(tc.id), 2)
        ELSE 0 
    END AS test_readiness_percentage
FROM tasks t
LEFT JOIN test_cases tc ON t.id = tc.task_id
LEFT JOIN test_executions te ON tc.id = te.test_case_id
GROUP BY t.id
ORDER BY test_readiness_percentage DESC;

-- Active defects summary
CREATE VIEW IF NOT EXISTS active_defects_summary AS
SELECT 
    td.*,
    tc.title AS test_case_title,
    tc.type AS test_case_type,
    t.title AS related_task_title,
    t.assignee AS task_assignee
FROM test_defects td
LEFT JOIN test_cases tc ON td.test_case_id = tc.id
LEFT JOIN tasks t ON td.related_task_id = t.id
WHERE td.status IN ('open', 'in_progress')
ORDER BY 
    CASE td.severity 
        WHEN 'Critical' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
    END, td.created_at DESC;

-- =============================================
-- Test Management Triggers
-- =============================================

-- Update test case timestamp when executions are added
CREATE TRIGGER IF NOT EXISTS update_test_case_on_execution
    AFTER INSERT ON test_executions
BEGIN
    UPDATE test_cases 
    SET updated_at = datetime('now')
    WHERE id = NEW.test_case_id;
END;

-- Automatically resolve defects when related task is completed
CREATE TRIGGER IF NOT EXISTS auto_resolve_defects_on_task_completion
    AFTER UPDATE ON tasks
    WHEN OLD.status != 'done' AND NEW.status = 'done'
BEGIN
    UPDATE test_defects 
    SET status = 'resolved', 
        resolved_at = datetime('now'),
        updated_at = datetime('now')
    WHERE related_task_id = NEW.id 
      AND status IN ('open', 'in_progress');
END;

-- Update schema version for test management
UPDATE system_config SET value = '3.0.0', updated_at = datetime('now') WHERE key = 'schema_version';