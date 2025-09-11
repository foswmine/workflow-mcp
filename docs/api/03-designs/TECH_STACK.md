# 기술 스택 선택 및 근거

## 📋 개요

WorkflowMCP Dashboard API 구현을 위한 기술 스택 선택과 근거를 문서화합니다. 
기존 시스템과의 호환성을 최우선으로 하며, 확장성과 유지보수성을 고려한 기술 선택을 제시합니다.

## 🎯 핵심 원칙

### 1. 기존 호환성 우선 (Backward Compatibility First)
- 기존 MCP 도구와 대시보드 기능 보존
- 기존 SQLite 스키마 변경 최소화
- 기존 API 엔드포인트 보존

### 2. 점진적 확장 (Progressive Enhancement)
- 기존 시스템에 기능 추가
- 기존 코드 수정 대신 래퍼/프록시 패턴 사용
- 버전 관리를 통한 안전한 업그레이드

### 3. 자기설명적 API (Self-Descriptive API)
- 새 세션에서 빠른 API 탐색 지원
- 컨텍스트 없이도 API 사용 가능
- 자동화된 문서화 및 도움말

## 🏗️ 아키텍처 스택

### Backend Framework
**선택**: Express.js (기존 사용 중)
**근거**:
- 기존 대시보드에서 이미 사용 중
- MCP 서버와 동일한 Node.js 생태계
- 기존 개발자 경험 보존
- 빠른 구현 가능

**대안 고려**:
- Fastify: 성능상 이점이 있으나 기존 코드 변경 필요
- NestJS: 구조화된 접근이지만 오버헤드 존재

### 데이터베이스
**선택**: SQLite (기존 유지) + 확장 테이블
**근거**:
- 기존 스키마 및 데이터 완전 보존
- 단일 파일 배포의 단순성
- 기존 MCP 도구와 동일한 데이터 접근
- Zero-config 환경

**확장 전략**:
```sql
-- 기존 테이블은 변경하지 않음
-- API 메타데이터용 새 테이블만 추가
CREATE TABLE api_schemas (...);
CREATE TABLE api_examples (...);
CREATE TABLE api_help_content (...);
```

### API 레이어
**선택**: RESTful API + HATEOAS + OpenAPI 3.0
**근거**:
- 표준 REST 패턴으로 학습 곡선 최소화
- HATEOAS로 자기설명적 API 구현
- OpenAPI로 자동 문서화
- Claude Code 세션에서 탐색 용이

**API 버전 관리**:
```
/api/v1/prds        # 기존 API 보존
/api/v2/prds        # 새 기능 추가
/api/prds           # 최신 버전 리다이렉트
```

## 🔧 구현 기술

### 1. API 구현 레이어

#### Express Router + Service Layer
```javascript
// Service Wrapper Pattern
class PRDServiceWrapper {
  constructor(prdManager) {
    this.prdManager = prdManager; // 기존 MCP Manager 재사용
  }
  
  async createPRD(data) {
    // 기존 create_prd MCP 도구 래핑
    return await this.prdManager.createPRD(data);
  }
}
```

**근거**:
- 기존 MCP Manager 코드 재사용
- 비즈니스 로직 중복 방지
- 테스트된 기존 로직 보존

#### 미들웨어 스택
```javascript
app.use(helmet());              // 보안
app.use(cors(corsOptions));     // CORS
app.use(compression());         // 압축
app.use(rateLimit(rateLimitOptions)); // 속도 제한
```

### 2. Help & Discovery API

#### 자기설명적 엔드포인트
**선택**: JSON-LD + HAL (Hypertext Application Language)
**근거**:
- 링크를 통한 API 탐색 지원
- 세션에서 컨텍스트 없이 사용 가능
- 표준 하이퍼미디어 형식

```json
{
  "data": { ... },
  "_links": {
    "self": { "href": "/api/prds/123" },
    "tasks": { "href": "/api/prds/123/tasks" },
    "help": { "href": "/api/help/prds" }
  }
}
```

#### Dynamic Help System
**선택**: 데이터베이스 기반 도움말 + 템플릿 엔진
```javascript
// 런타임 도움말 생성
app.get('/api/help/:category', async (req, res) => {
  const help = await helpService.getHelp(req.params.category);
  res.json(help);
});
```

### 3. 실시간 통신

#### Server-Sent Events (SSE)
**선택**: SSE over WebSocket
**근거**:
- 단방향 통신으로 충분 (대시보드 업데이트)
- WebSocket 대비 단순한 구현
- 기존 HTTP 인프라 재사용
- 자동 재연결 기능

```javascript
app.get('/api/stream/updates', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
});
```

## 📦 의존성 관리

### 새로운 종속성 최소화
**핵심 추가 패키지**:
```json
{
  "helmet": "^7.0.0",           // 보안
  "express-rate-limit": "^6.0.0", // 속도 제한
  "swagger-jsdoc": "^6.0.0",    // API 문서화
  "swagger-ui-express": "^4.0.0" // API 콘솔
}
```

**기존 패키지 재사용**:
- sqlite3: 기존 데이터베이스
- joi: 기존 유효성 검사
- 기존 MCP Manager 클래스들

## 🔒 보안 스택

### 1. 입력 검증
**선택**: Joi (기존 사용 중) + express-validator
**근거**:
- 기존 스키마 정의 재사용
- 일관된 검증 로직
- SQL Injection 방지

### 2. 보안 헤더
**선택**: Helmet.js
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));
```

### 3. 속도 제한
**선택**: express-rate-limit + 메모리 저장소
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 요청 제한
  message: "Too many requests"
});
```

## 📊 모니터링 & 로깅

### 로깅 전략
**선택**: 기존 ErrorLogger 확장
**근거**:
- 기존 로깅 시스템과 일관성
- 추가 종속성 없음
- 통합된 로그 관리

```javascript
// 기존 ErrorLogger 확장
class APILogger extends ErrorLogger {
  logAPICall(req, res, duration) {
    this.log('API_CALL', {
      method: req.method,
      url: req.url,
      duration,
      status: res.statusCode
    });
  }
}
```

### 메트릭 수집
**선택**: 기존 MetricsCollector 확장
```javascript
class APIMetrics extends MetricsCollector {
  recordAPICall(endpoint, duration, status) {
    this.increment(`api.calls.${endpoint}.${status}`);
    this.timing(`api.duration.${endpoint}`, duration);
  }
}
```

## 🧪 테스트 스택

### API 테스트
**선택**: Jest + Supertest
**근거**:
- 기존 테스트 프레임워크와 일관성
- HTTP API 테스트에 특화
- 기존 테스트 인프라 재사용

```javascript
describe('PRD API', () => {
  test('GET /api/prds should return all PRDs', async () => {
    const response = await request(app)
      .get('/api/prds')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
    expect(response.body._links).toHaveProperty('self');
  });
});
```

### 호환성 테스트
**선택**: 기존 MCP 도구 테스트 재사용
```javascript
describe('Backward Compatibility', () => {
  test('MCP tools should work unchanged', async () => {
    // 기존 MCP 도구 테스트 실행
    const result = await mcpServer.handleRequest('create_prd', data);
    expect(result).toBeDefined();
  });
});
```

## 📚 문서화 스택

### API 문서
**선택**: OpenAPI 3.0 + Swagger UI
**근거**:
- 표준 API 문서화
- 인터랙티브 테스트 가능
- 자동 클라이언트 코드 생성

```javascript
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WorkflowMCP Dashboard API',
    version: '1.0.0',
    description: 'Self-descriptive API for WorkflowMCP'
  }
};
```

### 도움말 시스템
**선택**: 동적 HTML + JSON 기반 도움말
```javascript
app.get('/api/help/:category', (req, res) => {
  const help = helpSystem.generateHelp(req.params.category);
  res.json(help);
});
```

## 🚀 배포 전략

### 개발 환경
**기존 스크립트 확장**:
```json
{
  "scripts": {
    "dev": "node src/index.js",
    "dev:api": "NODE_ENV=development node src/api-server.js",
    "dev:dashboard": "cd dashboard && npm run dev",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:api\" \"npm run dev:dashboard\""
  }
}
```

### 프로덕션 배포
**선택**: 기존 배포 방식 유지 + API 서버 추가
- MCP 서버: 기존 방식 유지
- 대시보드: 기존 SvelteKit 빌드
- API 서버: Express.js 추가

## 🔄 마이그레이션 전략

### 단계별 배포
1. **Phase 1**: API 서버 추가 (기존 시스템 변경 없음)
2. **Phase 2**: Help/Discovery API 구현
3. **Phase 3**: 기존 대시보드에 API 콘솔 추가
4. **Phase 4**: 모니터링 및 최적화

### 롤백 계획
```javascript
// API 서버 비활성화 옵션
const API_ENABLED = process.env.API_ENABLED !== 'false';

if (API_ENABLED) {
  app.use('/api', apiRouter);
}
```

## 📈 성능 고려사항

### 캐싱 전략
**선택**: In-Memory 캐싱 + ETag
```javascript
app.use(etag());
app.use('/api', cache('5 minutes'));
```

### 데이터베이스 최적화
**선택**: 기존 인덱스 활용 + 필요시 추가
```sql
-- API 성능을 위한 추가 인덱스
CREATE INDEX idx_api_created_at ON prds(created_at);
CREATE INDEX idx_api_status ON tasks(status);
```

## 🔮 확장성 고려사항

### 플러그인 아키텍처
```javascript
class APIPlugin {
  register(app, options) {
    // 플러그인 등록
  }
}

// 미래 확장을 위한 플러그인 시스템
app.use(pluginSystem.load('additional-features'));
```

### 마이크로서비스 준비
- 모듈화된 서비스 레이어
- 독립적인 API 라우터
- 분리 가능한 도메인 로직

## ✅ 결론

선택된 기술 스택은 다음 원칙을 충족합니다:

1. **기존 호환성**: 모든 기존 기능 보존
2. **점진적 확장**: 기존 코드 변경 최소화
3. **자기설명적**: 세션에서 쉬운 API 탐색
4. **유지보수성**: 기존 패턴과 일관성
5. **확장성**: 미래 요구사항 대응 가능

이 기술 스택을 통해 기존 WorkflowMCP 시스템의 안정성을 유지하면서 
강력한 API 기능을 추가할 수 있습니다.