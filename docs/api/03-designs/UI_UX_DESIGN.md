# 🎨 UI/UX 설계 - WorkflowMCP Dashboard API

## 🎯 설계 원칙

1. **기존 사용자 경험 보존**: 현재 대시보드 사용자에게 영향 없음
2. **점진적 확장**: 기존 기능 위에 API 기능 레이어 추가
3. **하위 호환성**: 기존 API 사용자에게 변경 사항 미반영
4. **자기 설명적**: 새 사용자도 쉽게 학습 가능
5. **개발자 우선**: API 사용성과 개발자 경험 최우선

## 🔄 기존 시스템 호환성 전략

### 1. 기존 API 보존 방식

#### 현재 상태 분석 필요
```javascript
// 구현 전 기존 API 조사 필수
const existingApiAudit = {
  // 1. 현재 대시보드가 사용하는 API 엔드포인트 식별
  currentEndpoints: [
    // 예: '/api/prds', '/api/tasks' 등이 이미 존재할 수 있음
  ],
  
  // 2. 현재 API 응답 형식 분석
  currentResponseFormats: {
    // 기존 형식이 있다면 동일하게 유지
  },
  
  // 3. 현재 URL 라우팅 패턴 확인
  currentRouting: {
    // 기존 라우팅과 충돌하지 않도록
  }
};
```

#### 호환성 보장 전략
```javascript
// 기존 API 래핑 패턴
class BackwardCompatibilityLayer {
  constructor() {
    this.legacyFormatMap = new Map();
    this.versionDetection = new Map();
  }
  
  // 기존 API 호출 감지 및 기존 형식으로 응답
  detectLegacyRequest(req) {
    // User-Agent, Headers, URL 패턴으로 기존 사용자 감지
    if (req.headers['user-agent']?.includes('SvelteKit') ||
        req.headers['x-legacy-client'] === 'true') {
      return true;
    }
    return false;
  }
  
  formatResponse(data, isLegacy = false) {
    if (isLegacy) {
      // 기존 형식 유지
      return data;
    } else {
      // 새로운 표준 형식
      return {
        success: true,
        data: data,
        links: this.generateHateoasLinks(),
        timestamp: new Date().toISOString()
      };
    }
  }
}
```

### 2. 점진적 마이그레이션 계획

#### Phase 1: 새 엔드포인트만 추가
```
기존 유지:
- /api/prds (기존 형식)
- /api/tasks (기존 형식)
- /api/documents (기존 형식)

새로 추가:
- /api/v1/prds (새 표준 형식)
- /api/v1/tasks (새 표준 형식)
- /api/v1/documents (새 표준 형식)
- /api/help/* (완전 신규)
- /api/discovery/* (완전 신규)
```

#### Phase 2: 기존 API 점진적 확장 (선택사항)
```javascript
// 기존 엔드포인트에 선택적 기능 추가
app.get('/api/prds', (req, res) => {
  // 기존 로직 유지
  const legacyResult = await existingPrdHandler(req);
  
  // 새로운 클라이언트 요청 시에만 확장 기능 제공
  if (req.query.include_links === 'true') {
    legacyResult.links = generateHateoasLinks();
  }
  
  if (req.query.include_help === 'true') {
    legacyResult.help = '/api/help/prds';
  }
  
  res.json(legacyResult);
});
```

### 3. 기존 대시보드 영향도 최소화

#### 대시보드 API 사용 패턴 보존
```javascript
// 대시보드 전용 미들웨어
const dashboardCompatibility = (req, res, next) => {
  // 대시보드에서 오는 요청 감지
  if (req.headers['referer']?.includes('localhost:3301') ||
      req.headers['x-dashboard-client'] === 'true') {
    
    // 대시보드용 응답 형식 유지
    req.useLegacyFormat = true;
    req.skipHateoas = true;
  }
  next();
};

// 대시보드 요청은 기존 형식 유지
app.use('/api', dashboardCompatibility);
```

## 🖥️ API 사용성 설계

### 1. 개발자 경험 (DX) 최적화

#### API 탐색 인터페이스
```html
<!-- /api/console - 내장 API 탐색 도구 -->
<!DOCTYPE html>
<html>
<head>
    <title>WorkflowMCP API Console</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .api-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
        .get { background: #4CAF50; }
        .post { background: #2196F3; }
        .put { background: #FF9800; }
        .delete { background: #F44336; }
        .try-button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .response-area { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin-top: 10px; }
        .help-link { color: #007bff; text-decoration: none; margin-left: 10px; }
        .help-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 WorkflowMCP API Console</h1>
        <p>Interactive API exploration tool. No authentication required for local development.</p>
        
        <!-- API Discovery Section -->
        <div class="api-section">
            <h2>🔍 Start Here - API Discovery</h2>
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api</strong>
                <span> - Complete API overview</span>
                <a href="/api/help/getting-started" class="help-link">📖 Getting Started Guide</a>
                <br>
                <button class="try-button" onclick="tryEndpoint('/api')">Try It</button>
            </div>
        </div>

        <!-- PRD Management Section -->
        <div class="api-section">
            <h2>📋 PRD Management</h2>
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/prds</strong>
                <span> - List all PRDs</span>
                <a href="/api/help/prds/collection" class="help-link">📖 Help</a>
                <br>
                <button class="try-button" onclick="tryEndpoint('/api/prds')">Try It</button>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <strong>/api/prds</strong>
                <span> - Create new PRD</span>
                <a href="/api/help/prds/examples" class="help-link">📝 Examples</a>
                <br>
                <button class="try-button" onclick="showCreateForm('prd')">Create PRD</button>
            </div>
        </div>

        <!-- Task Management Section -->
        <div class="api-section">
            <h2>📝 Task Management</h2>
            <div class="endpoint">
                <span class="method get">GET</span>
                <strong>/api/tasks</strong>
                <span> - List all tasks</span>
                <a href="/api/help/tasks/collection" class="help-link">📖 Help</a>
                <br>
                <button class="try-button" onclick="tryEndpoint('/api/tasks')">Try It</button>
            </div>
        </div>

        <!-- Response Area -->
        <div class="api-section">
            <h3>📤 API Response</h3>
            <div id="response-area" class="response-area">
                <p><em>Click "Try It" on any endpoint above to see the response here.</em></p>
            </div>
        </div>

        <!-- Quick Help -->
        <div class="api-section">
            <h3>🆘 Quick Help</h3>
            <ul>
                <li><a href="/api/help/getting-started">Getting Started Guide</a> - New to the API? Start here!</li>
                <li><a href="/api/discovery/categories">Browse by Category</a> - Explore API by functional area</li>
                <li><a href="/api/health">System Health</a> - Check if everything is running smoothly</li>
                <li><a href="/api/help/errors">Error Reference</a> - Common errors and solutions</li>
            </ul>
        </div>
    </div>

    <script>
        async function tryEndpoint(endpoint) {
            const responseArea = document.getElementById('response-area');
            responseArea.innerHTML = '<p><em>Loading...</em></p>';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                responseArea.innerHTML = `
                    <h4>Response (${response.status})</h4>
                    <pre style="white-space: pre-wrap; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                `;
            } catch (error) {
                responseArea.innerHTML = `
                    <h4>Error</h4>
                    <p style="color: red;">${error.message}</p>
                `;
            }
        }

        function showCreateForm(type) {
            const responseArea = document.getElementById('response-area');
            const examples = {
                prd: {
                    title: "User Authentication System",
                    description: "Implement JWT-based user authentication",
                    priority: "high",
                    status: "draft"
                }
            };
            
            responseArea.innerHTML = `
                <h4>Create ${type.toUpperCase()}</h4>
                <textarea id="create-data" style="width: 100%; height: 200px; font-family: monospace;">
${JSON.stringify(examples[type], null, 2)}
                </textarea>
                <br><br>
                <button class="try-button" onclick="submitCreate('${type}')">Submit</button>
                <a href="/api/help/${type}s/examples" class="help-link">📝 More Examples</a>
            `;
        }

        async function submitCreate(type) {
            const data = document.getElementById('create-data').value;
            const responseArea = document.getElementById('response-area');
            
            try {
                const response = await fetch(`/api/${type}s`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data
                });
                const result = await response.json();
                
                responseArea.innerHTML = `
                    <h4>Create Response (${response.status})</h4>
                    <pre style="white-space: pre-wrap;">${JSON.stringify(result, null, 2)}</pre>
                `;
            } catch (error) {
                responseArea.innerHTML = `
                    <h4>Error</h4>
                    <p style="color: red;">${error.message}</p>
                `;
            }
        }
    </script>
</body>
</html>
```

### 2. 점진적 학습 경험

#### 학습 경로 설계
```
Level 1: 기본 탐색
┌─────────────────┐
│ GET /api        │ ← 시작점
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 카테고리 선택    │ 
│ (prds/tasks)    │
└─────────────────┘

Level 2: 기능 이해  
┌─────────────────┐
│ /api/help/prds/ │ ← 도움말 확인
│ overview        │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ 예제 확인        │
│ /help/examples  │
└─────────────────┘

Level 3: 실제 사용
┌─────────────────┐
│ 스키마 확인      │
│ /api/schemas    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ API 호출        │
│ POST /api/prds  │
└─────────────────┘
```

#### 상황별 가이드 제공
```json
// GET /api/help/getting-started?context=new_session
{
  "title": "New Session Quick Start",
  "estimated_time": "5 minutes",
  "steps": [
    {
      "step": 1,
      "title": "Explore the API structure",
      "action": "GET /api",
      "why": "Understand what's available and where to find it"
    },
    {
      "step": 2, 
      "title": "Choose your area of interest",
      "options": [
        {"area": "PRD Management", "start": "/api/help/prds/overview"},
        {"area": "Task Management", "start": "/api/help/tasks/overview"},
        {"area": "Document Management", "start": "/api/help/documents/overview"}
      ]
    },
    {
      "step": 3,
      "title": "Try a simple operation",
      "suggestion": "GET /api/prds - List existing PRDs (safe, read-only)"
    }
  ],
  "shortcuts": {
    "api_console": "/api/console",
    "common_examples": "/api/help/examples/common",
    "troubleshooting": "/api/help/troubleshooting"
  }
}
```

### 3. 에러 경험 개선

#### 친화적 에러 메시지
```json
// 400 에러 응답 예시
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "We couldn't process your request due to some validation issues",
    "user_friendly_message": "It looks like some required information is missing. Let me help you fix this!",
    "details": [
      "The 'title' field is required and cannot be empty",
      "The 'priority' field must be one of: high, medium, low"
    ],
    "how_to_fix": {
      "title": "Add a descriptive title like 'User Authentication System'",
      "priority": "Set priority to 'high', 'medium', or 'low'"
    },
    "helpful_links": {
      "examples": "/api/help/prds/examples",
      "schema": "/api/schemas/prd",
      "help": "/api/help/prds/troubleshooting"
    }
  },
  "request_id": "req-123",
  "timestamp": "2025-09-11T16:00:00Z"
}
```

#### 에러 복구 가이드
```json
// GET /api/help/errors/validation
{
  "title": "Validation Error Solutions",
  "common_scenarios": [
    {
      "error": "Field 'title' is required",
      "cause": "Empty or missing title in request body",
      "solution": "Add a title property with a non-empty string value",
      "example": {
        "wrong": "{}",
        "correct": "{\"title\": \"My PRD Title\"}"
      }
    },
    {
      "error": "Invalid priority value",
      "cause": "Priority field contains invalid value", 
      "solution": "Use only 'high', 'medium', or 'low'",
      "example": {
        "wrong": "{\"priority\": \"urgent\"}",
        "correct": "{\"priority\": \"high\"}"
      }
    }
  ],
  "prevention_tips": [
    "Always check the schema first: GET /api/schemas/prd",
    "Use the API console for testing: /api/console",
    "Review examples: /api/help/prds/examples"
  ]
}
```

## 📱 다양한 클라이언트 지원

### 1. 클라이언트별 최적화

#### 웹 대시보드 (기존 유지)
```javascript
// 대시보드는 기존 패턴 유지
const dashboardApiClient = {
  // 기존 형식으로 계속 호출
  async getPrds() {
    const response = await fetch('/api/prds', {
      headers: { 'X-Dashboard-Client': 'true' }
    });
    return response.json(); // 기존 형식 응답
  }
};
```

#### Claude Code 세션 (신규 최적화)
```javascript
// Claude Code용 최적화된 응답
const claudeApiClient = {
  async discoverApi() {
    // 자기 설명적 응답
    const response = await fetch('/api', {
      headers: { 'User-Agent': 'Claude-Code-Session' }
    });
    return response.json(); // 새 표준 형식
  },

  async getHelp(topic) {
    const response = await fetch(`/api/help/${topic}`);
    return response.json(); // 구조화된 도움말
  }
};
```

#### 모바일/써드파티 (향후 지원)
```javascript
// 모바일 친화적 응답
app.get('/api/*', (req, res, next) => {
  if (req.headers['user-agent']?.includes('Mobile')) {
    req.mobileOptimized = true; // 간소화된 응답
  }
  next();
});
```

### 2. 응답 형식 적응

#### 컨텍스트별 응답 조정
```javascript
class ResponseFormatter {
  formatForClient(data, clientType) {
    switch (clientType) {
      case 'dashboard':
        // 기존 형식 유지
        return data;
        
      case 'claude-code':
        // 자기 설명적 형식
        return {
          success: true,
          data: data,
          links: this.generateHelpLinks(),
          guidance: this.generateGuidance(data),
          timestamp: new Date().toISOString()
        };
        
      case 'mobile':
        // 최소화된 형식
        return {
          data: data,
          has_more: data.length >= this.limit
        };
        
      default:
        // 표준 형식
        return this.standardFormat(data);
    }
  }
  
  generateGuidance(data) {
    // 데이터 기반 다음 단계 제안
    if (Array.isArray(data) && data.length === 0) {
      return {
        suggestion: "No items found. Would you like to create one?",
        next_action: "POST " + this.getCreateEndpoint()
      };
    }
    return null;
  }
}
```

## 🔧 개발 도구 및 유틸리티

### 1. API 검증 도구

#### 자동 호환성 검사기
```javascript
// GET /api/compatibility/check
class CompatibilityChecker {
  async checkBackwardCompatibility() {
    const results = {
      dashboard_compatibility: await this.testDashboardEndpoints(),
      mcp_compatibility: await this.testMcpIntegration(),
      breaking_changes: await this.detectBreakingChanges()
    };
    
    return {
      status: results.breaking_changes.length === 0 ? 'compatible' : 'warnings',
      results: results,
      recommendations: this.generateRecommendations(results)
    };
  }
  
  async testDashboardEndpoints() {
    // 대시보드가 사용하는 모든 엔드포인트 테스트
    const dashboardEndpoints = ['/api/prds', '/api/tasks', '/api/documents'];
    const results = [];
    
    for (const endpoint of dashboardEndpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'X-Dashboard-Client': 'true' }
        });
        results.push({
          endpoint,
          status: response.status,
          compatible: response.ok
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'error',
          compatible: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}
```

### 2. 마이그레이션 도구

#### 점진적 업그레이드 도우미
```javascript
// GET /api/migration/status
class MigrationHelper {
  checkCurrentUsage() {
    return {
      legacy_endpoints_usage: this.analyzeLegacyUsage(),
      new_endpoints_adoption: this.analyzeNewEndpointUsage(),
      migration_readiness: this.assessMigrationReadiness()
    };
  }
  
  generateMigrationPlan() {
    return {
      phases: [
        {
          phase: 1,
          description: "Add new v1 endpoints alongside existing",
          impact: "Zero - existing functionality unchanged",
          duration: "1 day"
        },
        {
          phase: 2,
          description: "Enhance existing endpoints with optional features",
          impact: "Minimal - opt-in only",
          duration: "2 days"
        },
        {
          phase: 3,
          description: "Deprecate old formats (optional)",
          impact: "Planned migration required",
          duration: "Planned timeline"
        }
      ]
    };
  }
}
```

## 📊 사용성 메트릭

### 1. API 사용 패턴 분석

#### 사용성 지표 수집
```javascript
class UsabilityMetrics {
  trackApiDiscovery(session) {
    return {
      discovery_path: session.endpoints_visited,
      time_to_first_success: session.first_successful_call_time,
      help_usage: session.help_endpoints_accessed,
      error_recovery_rate: session.errors_resolved / session.total_errors
    };
  }
  
  generateUsabilityReport() {
    return {
      top_entry_points: [
        { endpoint: '/api', usage_count: 1245 },
        { endpoint: '/api/help/getting-started', usage_count: 892 }
      ],
      common_user_journeys: [
        ['GET /api', 'GET /api/help/prds', 'GET /api/prds', 'POST /api/prds'],
        ['GET /api/console', 'Try PRD creation', 'GET /api/help/prds/examples']
      ],
      drop_off_points: [
        { endpoint: '/api/prds', reason: 'validation_errors' }
      ]
    };
  }
}
```

### 2. 피드백 수집 시스템

#### 사용자 경험 피드백
```json
// POST /api/feedback
{
  "type": "usability",
  "rating": 4,
  "category": "api_discovery",
  "feedback": "Help system is very useful, but could use more examples",
  "context": {
    "user_journey": ["GET /api", "GET /api/help/prds", "POST /api/prds"],
    "session_duration": 1200,
    "successful_operations": 3,
    "errors_encountered": 1
  },
  "suggestions": [
    "More real-world examples in help docs",
    "Interactive tutorials"
  ]
}
```

## 🎯 성공 지표

### 개발자 경험 KPI
- **Time to First Success**: 신규 사용자가 첫 API 호출 성공까지 시간 (목표: 5분 이내)
- **Help System Usage**: 도움말 시스템 사용률 (목표: 신규 사용자 80% 이상)
- **Error Recovery Rate**: 에러 발생 후 성공적 해결률 (목표: 90% 이상)
- **API Discovery Success**: `/api` 진입 후 원하는 기능 찾기 성공률 (목표: 95% 이상)

### 호환성 지표  
- **Legacy Compatibility**: 기존 시스템 호환성 (목표: 100%)
- **Zero Breaking Changes**: 기존 사용자 영향도 (목표: 0%)
- **Performance Impact**: 기존 시스템 성능 영향 (목표: <5% 증가)

---

**작성일**: 2025-09-11  
**작성자**: UX 설계자 (Claude Code)  
**검토자**: 프론트엔드 개발자, 기존 시스템 관리자  
**버전**: 1.0  
**상태**: 기술 스택 문서 대기