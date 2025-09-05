-- WorkflowMCP SQLite Database Schema
-- Phase 2.5: JSON to SQLite Migration
-- Created: 2025-09-05

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =============================================
-- Core Tables
-- =============================================

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