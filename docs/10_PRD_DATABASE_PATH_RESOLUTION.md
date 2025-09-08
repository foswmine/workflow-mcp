# PRD 데이터베이스 경로 문제 해결 방안

## 문제 상황
- **오류**: `SQLITE_CANTOPEN: unable to open database file`
- **원인**: MCP 서버와 대시보드가 서로 다른 실행 위치에서 동일한 SQLitePRDStorage.js 사용
- **현재 경로 설정**: `path.resolve(process.cwd(), '..', 'data', 'workflow.db')`

## 경로 분석 결과

### 현재 실행 환경별 경로
```
MCP 서버 (프로젝트 루트 실행):
- CWD: C:\dev\workflow-mcp  
- 계산된 DB 경로: C:\dev\data\workflow.db ❌ (존재하지 않음)

대시보드 (dashboard 디렉토리 실행):
- CWD: C:\dev\workflow-mcp\dashboard
- 계산된 DB 경로: C:\dev\workflow-mcp\data\workflow.db ✅ (정상)
```

## 해결 방안

### Zero Configuration 원칙 적용
**현재 파일 위치 기준 상대경로 사용**

```javascript
// dashboard/src/lib/server/SQLitePRDStorage.js
constructor() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // dashboard/src/lib/server/ -> project root (4단계 상위)
  this.dbPath = path.resolve(__dirname, '../../../../data/workflow.db');
  this.db = null;
  console.log('SQLite PRD Storage - Database path:', this.dbPath);
}
```

### 장점
- ✅ MCP 서버/대시보드 양쪽에서 동일하게 작동
- ✅ GitHub 클론 후 별도 설정 없이 즉시 실행
- ✅ 프로젝트 폴더 이동 시에도 자동 대응
- ✅ Docker/배포 환경에서 안정적 동작

## 적용 대상
- **파일**: `dashboard/src/lib/server/SQLitePRDStorage.js`
- **사용처**: MCP 서버 (`src/index.js`) 및 대시보드 공통 사용

## 검증 완료
- MCP 서버 경로: `dashboard/src/lib/server/PRDManager.js` → `SQLitePRDStorage.js`
- 대시보드 경로: 동일 파일 사용
- 양쪽 환경에서 정확한 DB 경로 계산 확인 완료