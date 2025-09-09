# Direct Requirement-Task Linking System Design

**Project**: WorkflowMCP Task Management Enhancement  
**Version**: 1.0  
**Date**: 2025-09-08  
**Author**: System Architect

## Executive Summary

This design document outlines the implementation of direct PRD requirement-to-task linking in WorkflowMCP, enabling flexible connection patterns for different development workflows while maintaining backward compatibility with existing plan-based structures.

## Current System Analysis

### Existing Architecture
```
PRDs → Plans → Tasks (current primary path)
PRDs → Designs → Test Cases (limited connection)
Documents ← → PRDs/Tasks/Plans (generic linking)
```

### Current Limitations
1. **Rigid Workflow**: Tasks can only connect to PRDs through plans
2. **Workflow Mismatch**: Simple features/bugs don't need full project planning
3. **Missing Direct Traceability**: No direct requirement → implementation mapping
4. **Limited Flexibility**: Cannot support agile/incremental development patterns

## Proposed Solution Architecture

### New Connection Patterns
```
1. Direct Path:     Requirements → Tasks (simple features, bugs)
2. Design Path:     Requirements → Design → Tasks (complex features)  
3. Planning Path:   Requirements → Plan → Tasks (project management)
4. Hybrid Path:     Requirements → Plan + Design → Tasks (enterprise)
```

### Core Design Principles
- **Backward Compatibility**: Existing plan-based workflows continue unchanged
- **Flexible Relationships**: Support multiple concurrent connection types
- **Data Integrity**: Prevent orphaned tasks and circular dependencies
- **Performance Optimization**: Efficient queries for complex relationship traversals
- **UI/UX Consistency**: Seamless integration with existing dashboard patterns

## Database Schema Changes

### New Tables

#### 1. prd_task_links (Direct Requirement-Task Connections)
```sql
CREATE TABLE IF NOT EXISTS prd_task_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prd_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    requirement_index INTEGER, -- Which specific requirement (0-based index into PRD requirements array)
    requirement_text TEXT,     -- Denormalized for quick access
    link_type TEXT CHECK(link_type IN ('direct', 'derived', 'related')) DEFAULT 'direct',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system',
    notes TEXT,
    
    UNIQUE(prd_id, task_id, requirement_index),
    FOREIGN KEY (prd_id) REFERENCES prds(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

#### 2. requirement_design_links (Requirement-Design Connections)
```sql
CREATE TABLE IF NOT EXISTS requirement_design_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prd_id TEXT NOT NULL,
    design_id TEXT NOT NULL,
    requirement_index INTEGER,
    requirement_text TEXT,
    design_section TEXT, -- Which part of design addresses this requirement
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system',
    
    UNIQUE(prd_id, design_id, requirement_index),
    FOREIGN KEY (prd_id) REFERENCES prds(id) ON DELETE CASCADE,
    FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE
);
```

### Enhanced Tables

#### Updated tasks table
```sql
-- Add new fields to existing tasks table
ALTER TABLE tasks ADD COLUMN connection_pattern TEXT 
    CHECK(connection_pattern IN ('plan', 'direct', 'design', 'hybrid')) DEFAULT 'plan';
ALTER TABLE tasks ADD COLUMN primary_prd_id TEXT;
ALTER TABLE tasks ADD COLUMN design_id TEXT;

-- Add foreign key constraints
-- Note: These would be added via migration script with proper null handling
```

### Indexes for Performance
```sql
-- Primary relationship indexes
CREATE INDEX IF NOT EXISTS idx_prd_task_links_prd_id ON prd_task_links(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_task_links_task_id ON prd_task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_prd_task_links_requirement_index ON prd_task_links(requirement_index);

-- Design relationship indexes  
CREATE INDEX IF NOT EXISTS idx_requirement_design_links_prd_id ON requirement_design_links(prd_id);
CREATE INDEX IF NOT EXISTS idx_requirement_design_links_design_id ON requirement_design_links(design_id);

-- Enhanced task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_connection_pattern ON tasks(connection_pattern);
CREATE INDEX IF NOT EXISTS idx_tasks_primary_prd_id ON tasks(primary_prd_id);
CREATE INDEX IF NOT EXISTS idx_tasks_design_id ON tasks(design_id);
```

### Views for Complex Queries

#### 1. Task Connection Summary
```sql
CREATE VIEW IF NOT EXISTS task_connections_summary AS
SELECT 
    t.id AS task_id,
    t.title AS task_title,
    t.status AS task_status,
    t.connection_pattern,
    
    -- Plan connection
    p.id AS plan_id,
    p.title AS plan_title,
    
    -- Direct PRD connection
    ptr.prd_id AS direct_prd_id,
    pr1.title AS direct_prd_title,
    COUNT(ptr.id) AS direct_requirement_count,
    
    -- Design connection
    d.id AS design_id,
    d.title AS design_title,
    
    -- Primary PRD (consolidated)
    COALESCE(t.primary_prd_id, p.prd_id, ptr.prd_id) AS primary_prd_id,
    COALESCE(pr2.title, pr3.title, pr1.title) AS primary_prd_title

FROM tasks t
LEFT JOIN plans p ON t.plan_id = p.id
LEFT JOIN prd_task_links ptr ON t.id = ptr.task_id
LEFT JOIN designs d ON t.design_id = d.id
LEFT JOIN prds pr1 ON ptr.prd_id = pr1.id
LEFT JOIN prds pr2 ON t.primary_prd_id = pr2.id  
LEFT JOIN prds pr3 ON p.prd_id = pr3.id
GROUP BY t.id;
```

#### 2. Requirement Traceability Matrix
```sql
CREATE VIEW IF NOT EXISTS requirement_traceability_matrix AS
SELECT 
    pr.id AS prd_id,
    pr.title AS prd_title,
    req_idx.requirement_index,
    req_idx.requirement_text,
    
    -- Direct tasks
    COUNT(DISTINCT ptr.task_id) AS direct_tasks,
    GROUP_CONCAT(DISTINCT t1.title, '; ') AS direct_task_titles,
    
    -- Design connections
    COUNT(DISTINCT rdl.design_id) AS connected_designs,
    GROUP_CONCAT(DISTINCT d.title, '; ') AS design_titles,
    
    -- Plan connections (via tasks)
    COUNT(DISTINCT p.id) AS connected_plans,
    GROUP_CONCAT(DISTINCT p.title, '; ') AS plan_titles,
    
    -- Implementation status
    CASE 
        WHEN COUNT(DISTINCT ptr.task_id) + COUNT(DISTINCT t2.id) = 0 THEN 'unimplemented'
        WHEN COUNT(DISTINCT CASE WHEN t1.status = 'done' THEN t1.id END) + 
             COUNT(DISTINCT CASE WHEN t2.status = 'done' THEN t2.id END) > 0 THEN 'implemented'
        ELSE 'in_progress'
    END AS implementation_status

FROM prds pr
CROSS JOIN (
    -- Explode requirements array into rows (simplified - actual implementation would parse JSON)
    SELECT 0 AS requirement_index, 'Placeholder for JSON parsing' AS requirement_text
    -- This would be enhanced with proper JSON parsing in the actual implementation
) req_idx
LEFT JOIN prd_task_links ptr ON pr.id = ptr.prd_id AND req_idx.requirement_index = ptr.requirement_index
LEFT JOIN tasks t1 ON ptr.task_id = t1.id
LEFT JOIN requirement_design_links rdl ON pr.id = rdl.prd_id AND req_idx.requirement_index = rdl.requirement_index
LEFT JOIN designs d ON rdl.design_id = d.id
LEFT JOIN plans p ON pr.id = p.prd_id
LEFT JOIN tasks t2 ON p.id = t2.plan_id
GROUP BY pr.id, req_idx.requirement_index;
```

## API Modifications

### New MCP Tools

#### 1. Link Task to Requirement
```javascript
{
  name: 'link_task_to_requirement',
  description: 'Create direct link between task and PRD requirement',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: { type: 'string' },
      prd_id: { type: 'string' },
      requirement_index: { type: 'number' },
      link_type: { enum: ['direct', 'derived', 'related'] },
      notes: { type: 'string' }
    },
    required: ['task_id', 'prd_id', 'requirement_index']
  }
}
```

#### 2. Create Task with Requirements
```javascript
{
  name: 'create_task_with_requirements',
  description: 'Create task directly linked to PRD requirements',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      prd_id: { type: 'string' },
      requirement_indices: { 
        type: 'array', 
        items: { type: 'number' } 
      },
      connection_pattern: { enum: ['direct', 'design', 'hybrid'] },
      design_id: { type: 'string' }, // optional for design pattern
      priority: { enum: ['High', 'Medium', 'Low'] }
    },
    required: ['title', 'prd_id', 'requirement_indices']
  }
}
```

#### 3. Get Requirement Traceability
```javascript
{
  name: 'get_requirement_traceability',
  description: 'Get implementation status for all PRD requirements',
  inputSchema: {
    type: 'object',
    properties: {
      prd_id: { type: 'string' },
      include_indirect: { type: 'boolean', default: true }
    },
    required: ['prd_id']
  }
}
```

#### 4. Analyze Connection Patterns
```javascript
{
  name: 'analyze_connection_patterns',
  description: 'Analyze task connection patterns across projects',
  inputSchema: {
    type: 'object',
    properties: {
      prd_id: { type: 'string' }, // optional filter
      pattern: { enum: ['plan', 'direct', 'design', 'hybrid'] } // optional filter
    }
  }
}
```

### Enhanced Existing Tools

#### Updated create_task
```javascript
// Enhanced input schema
{
  // ... existing fields ...
  connection_pattern: { enum: ['plan', 'direct', 'design', 'hybrid'] },
  primary_prd_id: { type: 'string' },
  design_id: { type: 'string' },
  requirement_links: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        prd_id: { type: 'string' },
        requirement_index: { type: 'number' },
        link_type: { enum: ['direct', 'derived', 'related'] }
      }
    }
  }
}
```

## UI/UX Changes

### Task Creation Interface

#### 1. Connection Pattern Selection
```javascript
// New step in task creation wizard
const connectionOptions = [
  {
    id: 'plan',
    title: 'Plan-based Task',
    description: 'Part of existing project plan',
    icon: 'project-diagram',
    suitable_for: 'Large features, scheduled work'
  },
  {
    id: 'direct', 
    title: 'Direct Implementation',
    description: 'Directly implements requirements',
    icon: 'direct-hit',
    suitable_for: 'Simple features, bug fixes'
  },
  {
    id: 'design',
    title: 'Design-driven Task', 
    description: 'Implements designed solution',
    icon: 'pen-ruler',
    suitable_for: 'Complex features, UI work'
  },
  {
    id: 'hybrid',
    title: 'Multi-connection Task',
    description: 'Multiple relationship types',
    icon: 'share-alt',
    suitable_for: 'Integration work, cross-cutting concerns'
  }
];
```

#### 2. Requirement Selection Interface
```svelte
<!-- Enhanced task creation form -->
<script>
  let selectedPRD = null;
  let selectedRequirements = [];
  let connectionPattern = 'direct';
  
  async function loadPRDRequirements(prdId) {
    const prd = await fetch(`/api/prds/${prdId}`);
    return prd.requirements.map((req, index) => ({
      index,
      text: req,
      isLinked: false // check existing links
    }));
  }
</script>

{#if connectionPattern === 'direct' || connectionPattern === 'hybrid'}
  <div class="requirement-selector">
    <label>Select Requirements to Implement:</label>
    {#each prdRequirements as requirement}
      <label class="requirement-checkbox">
        <input 
          type="checkbox" 
          bind:group={selectedRequirements} 
          value={requirement.index}
          disabled={requirement.isLinked}
        />
        <span class="requirement-text">{requirement.text}</span>
        {#if requirement.isLinked}
          <span class="already-linked">Already linked to task</span>
        {/if}
      </label>
    {/each}
  </div>
{/if}
```

### Task Detail View Enhancements

#### 1. Connection Visualization
```svelte
<!-- Task connection panel -->
<div class="task-connections">
  <h3>Task Connections</h3>
  
  <div class="connection-type">
    <span class="badge badge-{task.connection_pattern}">
      {task.connection_pattern.toUpperCase()}
    </span>
  </div>
  
  {#if task.connection_pattern === 'direct' || task.connection_pattern === 'hybrid'}
    <div class="direct-requirements">
      <h4>Implements Requirements:</h4>
      {#each task.direct_requirements as req}
        <div class="requirement-link">
          <a href="/prds/{req.prd_id}#{req.requirement_index}">
            {req.requirement_text}
          </a>
          <span class="link-type">{req.link_type}</span>
        </div>
      {/each}
    </div>
  {/if}
  
  {#if task.plan_id}
    <div class="plan-connection">
      <h4>Part of Plan:</h4>
      <a href="/plans/{task.plan_id}">{task.plan_title}</a>
    </div>
  {/if}
  
  {#if task.design_id}
    <div class="design-connection">
      <h4>Implements Design:</h4>
      <a href="/designs/{task.design_id}">{task.design_title}</a>
    </div>
  {/if}
</div>
```

#### 2. Traceability Matrix View
```svelte
<!-- New route: /prds/{id}/traceability -->
<script>
  let traceabilityMatrix = [];
  
  async function loadTraceability(prdId) {
    const response = await fetch(`/api/prds/${prdId}/traceability`);
    return await response.json();
  }
</script>

<div class="traceability-matrix">
  <h2>Requirement Traceability Matrix</h2>
  
  <table class="matrix-table">
    <thead>
      <tr>
        <th>Requirement</th>
        <th>Direct Tasks</th>
        <th>Design Tasks</th>
        <th>Plan Tasks</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each traceabilityMatrix as item}
        <tr class="requirement-row">
          <td class="requirement-cell">
            <div class="requirement-text">{item.requirement_text}</div>
          </td>
          <td class="tasks-cell">
            {#each item.direct_tasks as task}
              <a href="/tasks/{task.id}" class="task-link status-{task.status}">
                {task.title}
              </a>
            {/each}
          </td>
          <td class="tasks-cell">
            {#each item.design_tasks as task}
              <a href="/tasks/{task.id}" class="task-link status-{task.status}">
                {task.title}
              </a>
            {/each}
          </td>
          <td class="tasks-cell">
            {#each item.plan_tasks as task}
              <a href="/tasks/{task.id}" class="task-link status-{task.status}">
                {task.title}
              </a>
            {/each}
          </td>
          <td class="status-cell">
            <span class="status-badge status-{item.implementation_status}">
              {item.implementation_status}
            </span>
          </td>
          <td class="actions-cell">
            <button on:click={() => createTaskForRequirement(item.requirement_index)}>
              Create Task
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

### Dashboard Enhancements

#### 1. Connection Pattern Analytics
```svelte
<!-- Dashboard widget showing connection patterns -->
<div class="connection-analytics">
  <h3>Task Connection Patterns</h3>
  <canvas bind:this={connectionChart}></canvas>
  
  <div class="pattern-breakdown">
    {#each connectionStats as stat}
      <div class="pattern-stat">
        <span class="pattern-name">{stat.pattern}</span>
        <span class="pattern-count">{stat.count}</span>
        <span class="pattern-percentage">{stat.percentage}%</span>
      </div>
    {/each}
  </div>
</div>
```

#### 2. Implementation Coverage Widget
```svelte
<div class="coverage-widget">
  <h3>Requirement Implementation Coverage</h3>
  {#each coverageByPRD as prd}
    <div class="prd-coverage">
      <h4>{prd.title}</h4>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {prd.coverage_percentage}%"
        ></div>
      </div>
      <span class="coverage-text">
        {prd.implemented_requirements}/{prd.total_requirements} implemented
      </span>
    </div>
  {/each}
</div>
```

## Implementation Plan

### Phase 1: Database Foundation (Week 1)
1. **Schema Updates**
   - Create `prd_task_links` table
   - Create `requirement_design_links` table
   - Add new columns to `tasks` table
   - Create performance indexes
   
2. **Migration Scripts**
   - Data migration for existing tasks (set connection_pattern = 'plan')
   - Validation scripts for data integrity
   - Rollback procedures

3. **Core Views**
   - Implement `task_connections_summary` view
   - Create basic traceability queries

### Phase 2: API Layer (Week 2)
1. **New MCP Tools**
   - `link_task_to_requirement`
   - `create_task_with_requirements` 
   - `get_requirement_traceability`
   - `analyze_connection_patterns`

2. **Enhanced Existing Tools**
   - Update `create_task` with new connection options
   - Enhance `get_task` to include connection details
   - Update `list_tasks` with connection filtering

3. **Validation Logic**
   - Prevent invalid connection combinations
   - Ensure data consistency across connection types
   - Implement business rules for connection patterns

### Phase 3: Frontend Implementation (Week 3)
1. **Task Creation Enhancement**
   - Connection pattern selection wizard
   - Requirement selection interface
   - Design connection interface
   - Validation and error handling

2. **Task Detail Views**
   - Connection visualization components
   - Requirement linking interface
   - Multi-connection display logic

3. **Dashboard Widgets**
   - Connection pattern analytics
   - Implementation coverage tracking
   - Traceability matrix views

### Phase 4: Advanced Features (Week 4)
1. **Traceability Matrix**
   - Full requirement traceability view
   - Export capabilities
   - Real-time status updates

2. **Analytics & Reporting**
   - Connection pattern analysis
   - Implementation velocity metrics
   - Coverage gap identification

3. **Integration Testing**
   - End-to-end workflow testing
   - Performance optimization
   - User acceptance testing

## Risk Assessment

### High Risk Areas

#### 1. Data Migration Complexity
**Risk**: Existing tasks may not map cleanly to new connection patterns
**Mitigation**: 
- Comprehensive migration scripts with rollback capability
- Gradual migration approach with validation checkpoints
- Default all existing tasks to 'plan' connection pattern

#### 2. Performance Impact
**Risk**: Complex queries across multiple relationship tables
**Mitigation**:
- Strategic indexing on all foreign keys
- Materialized views for expensive queries
- Query optimization and caching strategies

#### 3. UI Complexity
**Risk**: Multiple connection types may confuse users
**Mitigation**:
- Progressive disclosure in UI design
- Clear connection pattern descriptions
- Default to most common patterns (plan-based)

### Medium Risk Areas

#### 4. Backward Compatibility
**Risk**: Breaking existing API contracts
**Mitigation**:
- Maintain all existing API endpoints unchanged
- Add new fields as optional with sensible defaults
- Version API changes with deprecation notices

#### 5. Data Consistency
**Risk**: Orphaned relationships or circular dependencies
**Mitigation**:
- Database constraints and triggers
- Validation logic in API layer
- Regular consistency check procedures

### Low Risk Areas

#### 6. Integration Overhead
**Risk**: Additional complexity in existing workflows
**Mitigation**:
- Make new features opt-in initially
- Provide migration path for power users
- Maintain simple workflows for basic use cases

## Success Metrics

### Technical Metrics
- **Migration Success**: 100% data integrity post-migration
- **Performance**: Query response times < 200ms for connection views
- **API Coverage**: All connection patterns supported via MCP tools
- **Test Coverage**: >90% code coverage for new connection logic

### User Experience Metrics
- **Adoption Rate**: >60% of new tasks use non-plan connections within 3 months
- **Error Rate**: <2% task creation failures due to connection issues
- **User Satisfaction**: >8/10 rating for new connection workflows

### Business Impact Metrics
- **Workflow Efficiency**: 25% reduction in time from requirement to implementation
- **Traceability Coverage**: >80% requirements have direct implementation links
- **Feature Velocity**: 15% increase in feature delivery speed

## Dependencies

### Technical Dependencies
- SQLite database migration tools
- MCP SDK updates for new tool schemas
- SvelteKit component library extensions
- Chart.js for analytics visualizations

### External Dependencies
- No breaking changes to existing MCP protocol
- Maintain compatibility with current Claude Code integration
- Support existing JSON backup file formats

### Team Dependencies
- Database administrator for migration oversight
- Frontend developer for UI components
- API developer for MCP tool implementation
- Product owner for connection pattern validation

## Conclusion

The direct requirement-task linking system represents a significant enhancement to WorkflowMCP's flexibility while maintaining backward compatibility. The phased implementation approach minimizes risk while delivering immediate value through improved traceability and workflow flexibility.

The system's design supports multiple development methodologies from simple direct implementation to complex enterprise workflows, positioning WorkflowMCP as a comprehensive solution for diverse development teams.

Key success factors include careful data migration, intuitive UI design, and comprehensive testing across all connection patterns. The analytics and traceability features provide valuable insights for project management and compliance requirements.

---

## Implementation Notes

### Data Field Naming Convention Issue (2025-09-09)
**발견**: 간트 차트 표시 오류 해결 과정에서 데이터 필드명 불일치 확인
- **API 응답**: `createdAt`, `dueDate` (camelCase)
- **UI 컴포넌트**: `created_at`, `due_date` (snake_case) 검색으로 인한 데이터 처리 실패
- **해결방법**: GanttChart 컴포넌트에서 `item.createdAt`, `item.dueDate` 필드명으로 수정
- **교훈**: 프론트엔드-백엔드 간 데이터 필드 명명 규칙 통일 필요성 확인

---

**Document Status**: Draft v1.0  
**Next Review**: Implementation Phase 1 completion  
**Approval Required**: Technical Lead, Product Owner