-- =============================================
-- Claude Collaboration Extension Schema
-- For real-time Claude-to-Claude cooperation
-- =============================================

-- Agent Sessions (Claude Code instances)
CREATE TABLE IF NOT EXISTS agent_sessions (
    id TEXT PRIMARY KEY, -- UUID format
    agent_type TEXT NOT NULL CHECK(agent_type IN ('developer', 'supervisor')),
    agent_name TEXT, -- Optional display name
    status TEXT NOT NULL CHECK(status IN ('active', 'idle', 'offline')) DEFAULT 'active',
    
    -- Current activity tracking
    current_task_id TEXT, -- Currently working on task
    current_activity TEXT, -- Human-readable activity description
    progress_notes TEXT, -- Latest progress update
    
    -- Session metadata
    session_start DATETIME NOT NULL DEFAULT (datetime('now')),
    last_heartbeat DATETIME NOT NULL DEFAULT (datetime('now')),
    last_activity DATETIME NOT NULL DEFAULT (datetime('now')),
    
    -- Configuration
    auto_approve BOOLEAN DEFAULT FALSE, -- Auto-approve minor changes
    notification_preferences TEXT, -- JSON: notification settings
    
    -- Relationships
    project_id TEXT REFERENCES projects(id),
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    
    FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Real-time Messages (Inter-agent communication)
CREATE TABLE IF NOT EXISTS collaboration_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Message routing
    from_session_id TEXT NOT NULL,
    to_session_id TEXT, -- NULL means broadcast to all active sessions
    
    -- Message content
    message_type TEXT NOT NULL CHECK(message_type IN (
        'progress_update', 'question', 'feedback', 'approval_request',
        'direction_change', 'task_assignment', 'status_alert', 'heartbeat'
    )),
    subject TEXT, -- Brief subject line
    content TEXT NOT NULL, -- Main message content
    
    -- Context
    related_task_id TEXT, -- Task this message relates to
    related_prd_id TEXT, -- PRD this message relates to
    priority TEXT CHECK(priority IN ('urgent', 'high', 'normal', 'low')) DEFAULT 'normal',
    
    -- Status tracking
    read_status BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    response_required BOOLEAN DEFAULT FALSE,
    responded BOOLEAN DEFAULT FALSE,
    response_deadline DATETIME,
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    expires_at DATETIME, -- Message expiration (for cleanup)
    
    FOREIGN KEY (from_session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (to_session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (related_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (related_prd_id) REFERENCES prds(id) ON DELETE CASCADE
);

-- Supervisor Interventions (Supervisor actions/decisions)
CREATE TABLE IF NOT EXISTS supervisor_interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Participants
    supervisor_session_id TEXT NOT NULL,
    developer_session_id TEXT NOT NULL,
    
    -- Intervention details
    intervention_type TEXT NOT NULL CHECK(intervention_type IN (
        'feedback', 'direction_change', 'approval', 'rejection',
        'task_reassignment', 'priority_change', 'blocking', 'unblocking'
    )),
    title TEXT NOT NULL, -- Brief intervention title
    message TEXT NOT NULL, -- Detailed intervention message
    
    -- Context
    related_task_id TEXT,
    related_prd_id TEXT,
    previous_status TEXT, -- What status was before intervention
    new_status TEXT, -- What status should be after intervention
    
    -- Priority and urgency
    priority TEXT CHECK(priority IN ('critical', 'urgent', 'normal', 'advisory')) DEFAULT 'normal',
    requires_immediate_action BOOLEAN DEFAULT FALSE,
    
    -- Response tracking
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at DATETIME,
    developer_response TEXT, -- Developer's response to intervention
    resolution_status TEXT CHECK(resolution_status IN ('pending', 'accepted', 'discussed', 'resolved')) DEFAULT 'pending',
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    resolved_at DATETIME,
    
    FOREIGN KEY (supervisor_session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (developer_session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (related_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (related_prd_id) REFERENCES prds(id) ON DELETE CASCADE
);

-- Task Progress Snapshots (Detailed progress tracking)
CREATE TABLE IF NOT EXISTS task_progress_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Basic info
    task_id TEXT NOT NULL,
    agent_session_id TEXT NOT NULL,
    
    -- Progress details
    progress_percentage INTEGER CHECK(progress_percentage >= 0 AND progress_percentage <= 100),
    status_before TEXT,
    status_after TEXT,
    work_description TEXT NOT NULL, -- What work was done
    
    -- Technical details
    files_modified TEXT, -- JSON array of file paths
    code_changes_summary TEXT, -- Brief summary of code changes
    tests_added BOOLEAN DEFAULT FALSE,
    tests_passed BOOLEAN,
    
    -- Quality metrics
    estimated_completion_time INTEGER, -- Minutes remaining
    confidence_level INTEGER CHECK(confidence_level >= 1 AND confidence_level <= 10), -- 1-10 scale
    blockers_encountered TEXT, -- JSON array of blocker descriptions
    
    -- Review status
    needs_review BOOLEAN DEFAULT FALSE,
    review_requested_at DATETIME,
    reviewed_by_session_id TEXT,
    review_feedback TEXT,
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_session_id) REFERENCES agent_sessions(id) ON DELETE SET NULL
);

-- Approval Workflows (Structured approval processes)
CREATE TABLE IF NOT EXISTS approval_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Workflow details
    workflow_type TEXT NOT NULL CHECK(workflow_type IN (
        'task_completion', 'code_change', 'architecture_decision',
        'deployment_approval', 'requirement_change'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Participants
    requester_session_id TEXT NOT NULL,
    approver_session_id TEXT, -- NULL means any supervisor can approve
    
    -- Context
    related_task_id TEXT,
    related_prd_id TEXT,
    
    -- Approval status
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
    approval_deadline DATETIME,
    
    -- Decision details
    approved_at DATETIME,
    rejected_at DATETIME,
    rejection_reason TEXT,
    conditions TEXT, -- Conditions for approval (if any)
    
    -- Metadata
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    
    FOREIGN KEY (requester_session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_session_id) REFERENCES agent_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (related_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (related_prd_id) REFERENCES prds(id) ON DELETE CASCADE
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Agent session indexes
CREATE INDEX IF NOT EXISTS idx_agent_sessions_type ON agent_sessions(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active ON agent_sessions(status, last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_task ON agent_sessions(current_task_id);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_collab_messages_to ON collaboration_messages(to_session_id, read_status);
CREATE INDEX IF NOT EXISTS idx_collab_messages_from ON collaboration_messages(from_session_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_type ON collaboration_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_collab_messages_task ON collaboration_messages(related_task_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_unread ON collaboration_messages(to_session_id, read_status, created_at);

-- Intervention indexes
CREATE INDEX IF NOT EXISTS idx_interventions_developer ON supervisor_interventions(developer_session_id, acknowledged);
CREATE INDEX IF NOT EXISTS idx_interventions_supervisor ON supervisor_interventions(supervisor_session_id);
CREATE INDEX IF NOT EXISTS idx_interventions_task ON supervisor_interventions(related_task_id);
CREATE INDEX IF NOT EXISTS idx_interventions_pending ON supervisor_interventions(resolution_status, created_at);

-- Progress snapshot indexes
CREATE INDEX IF NOT EXISTS idx_progress_task ON task_progress_snapshots(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_progress_agent ON task_progress_snapshots(agent_session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_progress_review ON task_progress_snapshots(needs_review, review_requested_at);

-- Approval workflow indexes
CREATE INDEX IF NOT EXISTS idx_approvals_requester ON approval_workflows(requester_session_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approval_workflows(approver_session_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_pending ON approval_workflows(status, approval_deadline);

-- =============================================
-- Views for Common Queries
-- =============================================

-- Active collaboration sessions
CREATE VIEW IF NOT EXISTS active_collaboration_sessions AS
SELECT 
    a.*,
    t.title AS current_task_title,
    t.status AS current_task_status,
    COUNT(DISTINCT m1.id) AS unread_messages,
    COUNT(DISTINCT i.id) AS pending_interventions
FROM agent_sessions a
LEFT JOIN tasks t ON a.current_task_id = t.id
LEFT JOIN collaboration_messages m1 ON a.id = m1.to_session_id AND m1.read_status = FALSE
LEFT JOIN supervisor_interventions i ON a.id = i.developer_session_id AND i.acknowledged = FALSE
WHERE a.status = 'active'
    AND a.last_heartbeat > datetime('now', '-5 minutes') -- Active within last 5 minutes
GROUP BY a.id;

-- Pending approvals summary
CREATE VIEW IF NOT EXISTS pending_approvals_summary AS
SELECT 
    w.*,
    req.agent_name AS requester_name,
    req.agent_type AS requester_type,
    app.agent_name AS approver_name,
    t.title AS task_title,
    p.title AS prd_title
FROM approval_workflows w
LEFT JOIN agent_sessions req ON w.requester_session_id = req.id
LEFT JOIN agent_sessions app ON w.approver_session_id = app.id
LEFT JOIN tasks t ON w.related_task_id = t.id
LEFT JOIN prds p ON w.related_prd_id = p.id
WHERE w.status = 'pending';

-- Recent collaboration activity
CREATE VIEW IF NOT EXISTS recent_collaboration_activity AS
SELECT 
    'message' AS activity_type,
    m.id,
    m.created_at,
    from_sess.agent_name AS from_agent,
    to_sess.agent_name AS to_agent,
    m.message_type,
    m.subject,
    m.priority,
    m.related_task_id,
    NULL AS intervention_type
FROM collaboration_messages m
LEFT JOIN agent_sessions from_sess ON m.from_session_id = from_sess.id
LEFT JOIN agent_sessions to_sess ON m.to_session_id = to_sess.id
WHERE m.created_at > datetime('now', '-1 hour')

UNION ALL

SELECT 
    'intervention' AS activity_type,
    i.id,
    i.created_at,
    sup.agent_name AS from_agent,
    dev.agent_name AS to_agent,
    NULL AS message_type,
    i.title AS subject,
    i.priority,
    i.related_task_id,
    i.intervention_type
FROM supervisor_interventions i
LEFT JOIN agent_sessions sup ON i.supervisor_session_id = sup.id
LEFT JOIN agent_sessions dev ON i.developer_session_id = dev.id
WHERE i.created_at > datetime('now', '-1 hour')

ORDER BY created_at DESC;

-- =============================================
-- Triggers for Data Integrity and Automation
-- =============================================

-- Update agent session last_activity on any interaction
CREATE TRIGGER IF NOT EXISTS update_agent_activity_on_message
    AFTER INSERT ON collaboration_messages
BEGIN
    UPDATE agent_sessions 
    SET last_activity = datetime('now'), updated_at = datetime('now')
    WHERE id = NEW.from_session_id;
END;

-- Auto-expire old messages
CREATE TRIGGER IF NOT EXISTS expire_old_messages
    AFTER INSERT ON collaboration_messages
    WHEN NEW.message_type IN ('heartbeat', 'status_alert')
BEGIN
    UPDATE collaboration_messages 
    SET expires_at = datetime('now', '+1 hour')
    WHERE id = NEW.id;
END;

-- Update intervention resolution when acknowledged
CREATE TRIGGER IF NOT EXISTS update_intervention_on_ack
    AFTER UPDATE ON supervisor_interventions
    WHEN OLD.acknowledged = FALSE AND NEW.acknowledged = TRUE
BEGIN
    UPDATE supervisor_interventions 
    SET resolution_status = 'accepted', updated_at = datetime('now')
    WHERE id = NEW.id;
END;

-- Auto-update approval workflow status
CREATE TRIGGER IF NOT EXISTS update_approval_status
    AFTER UPDATE ON approval_workflows
    WHEN OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')
BEGIN
    UPDATE approval_workflows 
    SET updated_at = datetime('now'),
        approved_at = CASE WHEN NEW.status = 'approved' THEN datetime('now') ELSE NULL END,
        rejected_at = CASE WHEN NEW.status = 'rejected' THEN datetime('now') ELSE NULL END
    WHERE id = NEW.id;
END;