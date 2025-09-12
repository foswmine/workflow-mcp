# MCP 서버 연결 문제 해결 가이드

**중요도: 🔴 CRITICAL** - MCP 서버 개발 시 반드시 참조할 문서

## 발견된 핵심 문제

### 🚨 **Entry Point Check 문제**

**증상:**
- `claude mcp list`에서 "✗ Failed to connect" 표시
- MCP 서버 코드는 정상이고 직접 실행도 가능
- 다른 모든 설정은 올바름

**원인:**
```javascript
// ❌ 문제가 되는 코드
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
```

Windows 환경에서 이 조건문이 **false**로 평가되어 `main()` 함수가 실행되지 않음.

**해결책:**
```javascript
// ✅ 올바른 코드
main().catch(console.error);
```

단순히 조건 없이 `main()` 함수를 직접 호출.

---

## 문제 해결 과정

### 1단계: 최소 MCP 서버 생성
```javascript
// minimal-test.js - 연결만 확인하는 기본 서버
const server = new Server({
  name: 'minimal-test',
  version: '0.1.0'
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [] };
});

main().catch(console.error); // 조건 없이 바로 실행
```

### 2단계: 단계별 기능 추가
- 기본 서버가 연결되는 것을 확인한 후
- 하나씩 기능을 추가하면서 어디서 문제가 생기는지 확인

### 3단계: 차이점 비교
```bash
diff src/test-server.js src/minimal-test.js
```

---

## 자주 발생하는 MCP 서버 연결 문제들

### 1. Entry Point Check 문제 ⭐ **가장 흔함**
```javascript
// ❌ Windows에서 문제 발생
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// ✅ 항상 작동
main().catch(console.error);
```

### 2. Arguments Destructuring 문제
```javascript
// ❌ 잠재적 문제
const { name, arguments: args } = request.params;

// ✅ 안전한 방법
const { name } = request.params;
const args = request.params.arguments || {};
```

### 3. Package.json 설정 누락
```json
{
  "type": "module",  // ES Modules 사용 시 필수
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0"
  }
}
```

### 4. 잘못된 경로 등록
```bash
# ❌ 상대경로 사용
claude mcp add test-server -- node src/test-server.js

# ✅ 절대경로 사용 (Windows)
claude mcp add test-server -- node "C:\\full\\path\\to\\src\\test-server.js"
```

---

## 확실한 MCP 서버 템플릿

```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'your-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'your_tool',
        description: 'Your tool description',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const args = request.params.arguments || {};

  if (name === 'your_tool') {
    return {
      content: [
        {
          type: 'text',
          text: 'Tool response'
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server started');
}

// ⭐ 핵심: 조건 없이 바로 실행
main().catch(console.error);
```

---

## 디버깅 절차

### 1. 기본 연결 확인
```bash
claude mcp list
# 해당 서버가 ✓ Connected인지 확인
```

### 2. 서버 직접 실행 테스트
```bash
cd /path/to/mcp/server
node src/your-server.js
# 에러 메시지 없이 시작되는지 확인
```

### 3. 최소 서버로 점진적 테스트
- 최소한의 기능만 있는 서버부터 시작
- 하나씩 기능 추가하며 어디서 문제 발생하는지 확인

### 4. 경로 및 권한 확인
```bash
# Windows 절대경로 사용
claude mcp add server-name -- node "C:\\full\\path\\to\\server.js"
```

---

## 경험 기반 팁

1. **MCP 서버 개발 시 가장 먼저 확인할 것:**
   - Entry point check 제거
   - 절대경로로 등록
   - `type: "module"` 설정 확인

2. **문제 발생 시 접근 방법:**
   - 최소 서버부터 시작
   - 단계적으로 기능 추가
   - diff로 차이점 비교

3. **재시작이 필요한 경우:**
   - MCP 서버 등록 후 Claude Code 재시작 필요할 수 있음
   - 특히 새로 등록한 서버의 도구가 보이지 않을 때

---

**저장일:** 2025-01-05  
**발견 세션:** 3번째 MCP 서버 개발 중  
**중요도:** CRITICAL - 모든 MCP 서버 개발 시 필수 참조