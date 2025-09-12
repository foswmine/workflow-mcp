# Git 저장 전 데이터베이스 초기화 체크리스트

Git에 변경사항을 커밋하기 전에 데이터베이스 초기화 스크립트가 최신 스키마를 반영하고 있는지 확인하는 체크리스트입니다.

## 🚨 중요사항

**Git 커밋 전에 반드시 확인해야 할 사항들:**
- 새로운 테이블이 추가된 경우
- 스키마가 변경된 경우  
- 협업 기능이나 다른 기능이 추가된 경우

## 📋 체크리스트

### ✅ 1. 스키마 파일 확인
- [ ] `src/database/schema.sql` - 기본 스키마 파일
- [ ] `src/database/collaboration-schema.sql` - 협업 테이블 스키마
- [ ] 두 스키마가 모두 최신 상태인지 확인

### ✅ 2. init-database.js 업데이트 확인

#### 현재 문제점:
```javascript
// ❌ 현재: 기본 스키마만 적용
const SCHEMA_PATH = join(__dirname, 'src', 'database', 'schema.sql');
```

#### 필요한 수정:
```javascript
// ✅ 수정 필요: 협업 스키마도 함께 적용
const MAIN_SCHEMA_PATH = join(__dirname, 'src', 'database', 'schema.sql');
const COLLABORATION_SCHEMA_PATH = join(__dirname, 'src', 'database', 'collaboration-schema.sql');
```

### ✅ 3. 협업 테이블 포함 확인

다음 협업 테이블들이 `init-database.js`에서 생성되는지 확인:
- [ ] `agent_sessions` - Claude 세션 관리
- [ ] `collaboration_messages` - 실시간 메시징  
- [ ] `supervisor_interventions` - 슈퍼바이저 개입
- [ ] `task_progress_snapshots` - 작업 진행상황
- [ ] `approval_workflows` - 승인 워크플로

### ✅ 4. 데이터 카운트 확인

`init-database.js`의 데이터 카운트 섹션에 협업 테이블 추가:
```javascript
// 현재 누락된 테이블들
db.get('SELECT COUNT(*) as count FROM agent_sessions'),
db.get('SELECT COUNT(*) as count FROM collaboration_messages'),
db.get('SELECT COUNT(*) as count FROM supervisor_interventions'),
db.get('SELECT COUNT(*) as count FROM task_progress_snapshots'),
db.get('SELECT COUNT(*) as count FROM approval_workflows')
```

### ✅ 5. 테스트 스크립트 실행

Git 커밋 전에 다음 명령어들을 실행해서 확인:

```bash
# 1. 기존 데이터베이스 백업 (있는 경우)
cp data/workflow.db data/workflow-backup-$(date +%Y%m%d-%H%M%S).db

# 2. 테스트용 새 데이터베이스 생성
rm -f data/workflow-test.db

# 3. 수정된 init-database.js로 테스트 데이터베이스 초기화
node init-database.js

# 4. 협업 테이블 존재 확인
echo "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%collaboration%' OR name LIKE '%agent_%' OR name LIKE '%approval_%';" | sqlite3 data/workflow.db

# 5. 예상 결과: 
# agent_sessions
# collaboration_messages  
# supervisor_interventions
# task_progress_snapshots
# approval_workflows
```

## 🔧 수정해야 할 파일들

### 1. init-database.js 수정 필요사항

#### A. 스키마 파일 경로 수정
```javascript
// 기존 코드
const SCHEMA_PATH = join(__dirname, 'src', 'database', 'schema.sql');

// 수정된 코드  
const MAIN_SCHEMA_PATH = join(__dirname, 'src', 'database', 'schema.sql');
const COLLABORATION_SCHEMA_PATH = join(__dirname, 'src', 'database', 'collaboration-schema.sql');
```

#### B. 스키마 적용 로직 수정
```javascript
// 기존 코드
console.log('📄 Reading schema file...');
const schemaSQL = readFileSync(SCHEMA_PATH, 'utf8');

// 수정된 코드
console.log('📄 Reading schema files...');
const mainSchemaSQL = readFileSync(MAIN_SCHEMA_PATH, 'utf8');
const collaborationSchemaSQL = readFileSync(COLLABORATION_SCHEMA_PATH, 'utf8');
const combinedSQL = mainSchemaSQL + '\n\n' + collaborationSchemaSQL;
```

#### C. 데이터 카운트 섹션 확장
```javascript
// 기존 코드에 추가
const counts = await Promise.all([
  db.get('SELECT COUNT(*) as count FROM prds'),
  db.get('SELECT COUNT(*) as count FROM tasks'),
  db.get('SELECT COUNT(*) as count FROM plans'),  
  db.get('SELECT COUNT(*) as count FROM documents'),
  db.get('SELECT COUNT(*) as count FROM test_cases'),
  db.get('SELECT COUNT(*) as count FROM test_executions'),
  // 협업 테이블 추가
  db.get('SELECT COUNT(*) as count FROM agent_sessions'),
  db.get('SELECT COUNT(*) as count FROM collaboration_messages'),
  db.get('SELECT COUNT(*) as count FROM supervisor_interventions'),
  db.get('SELECT COUNT(*) as count FROM task_progress_snapshots'),
  db.get('SELECT COUNT(*) as count FROM approval_workflows')
]);

const countLabels = [
  'PRDs', 'Tasks', 'Plans', 'Documents', 'Test Cases', 'Test Executions',
  'Agent Sessions', 'Collaboration Messages', 'Supervisor Interventions', 
  'Task Progress', 'Approval Workflows'
];
```

#### D. 버전 정보 업데이트
```javascript
// 파일 상단 주석 수정
/**
 * WorkflowMCP Database Initialization Script
 * Creates and initializes SQLite database with current schema
 * Version: 3.1.0 (Latest with Collaboration Features + Test Management + Documents + Designs)
 */
```

## 🚀 자동화 스크립트

다음 스크립트를 실행해서 자동으로 확인:

```bash
#!/bin/bash
# check-database-init.sh

echo "🔍 데이터베이스 초기화 체크 시작..."

# 1. 필수 파일 존재 확인
echo "📁 필수 파일 확인..."
if [ ! -f "src/database/schema.sql" ]; then
    echo "❌ schema.sql 파일이 없습니다"
    exit 1
fi

if [ ! -f "src/database/collaboration-schema.sql" ]; then
    echo "❌ collaboration-schema.sql 파일이 없습니다"
    exit 1
fi

if [ ! -f "init-database.js" ]; then
    echo "❌ init-database.js 파일이 없습니다"
    exit 1
fi

echo "✅ 모든 필수 파일 존재"

# 2. 협업 스키마 포함 확인
echo "🤝 협업 스키마 포함 여부 확인..."
if grep -q "collaboration-schema" init-database.js; then
    echo "✅ init-database.js에 협업 스키마 포함됨"
else
    echo "❌ init-database.js에 협업 스키마 누락됨"
    echo "   수정이 필요합니다!"
    exit 1
fi

# 3. 테스트 데이터베이스 생성
echo "🧪 테스트 데이터베이스 생성..."
rm -f data/workflow-test.db
DB_PATH="data/workflow-test.db" node init-database.js > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 테스트 데이터베이스 생성 성공"
else
    echo "❌ 테스트 데이터베이스 생성 실패"
    exit 1
fi

# 4. 협업 테이블 존재 확인
echo "📊 협업 테이블 존재 확인..."
collaboration_tables=$(echo "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND (name LIKE '%collaboration%' OR name LIKE '%agent_%' OR name LIKE '%approval_%' OR name LIKE '%progress%');" | sqlite3 data/workflow-test.db)

if [ "$collaboration_tables" -ge "5" ]; then
    echo "✅ 협업 테이블 $collaboration_tables 개 존재"
else
    echo "❌ 협업 테이블 부족: $collaboration_tables 개 (최소 5개 필요)"
    exit 1
fi

# 5. 정리
rm -f data/workflow-test.db
echo "🎉 데이터베이스 초기화 체크 완료!"
echo "   Git 커밋 준비 완료 ✅"
```

## 📋 Git 커밋 전 최종 체크리스트

**커밋하기 전에 다음을 확인하세요:**

```bash
# 1. 체크 스크립트 실행
chmod +x check-database-init.sh
./check-database-init.sh

# 2. 수동 확인
node init-database.js

# 3. 협업 테이블 존재 확인  
echo "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" | sqlite3 data/workflow.db | grep -E "(agent_|collaboration_|supervisor_|approval_|progress_)"

# 4. 예상 출력:
# agent_sessions
# approval_workflows  
# collaboration_messages
# supervisor_interventions
# task_progress_snapshots
```

**모든 체크가 통과하면 Git 커밋 진행:**
```bash
git add .
git commit -m "feat: add collaboration system with complete database schema

- Add Claude-to-Claude collaboration features
- Include all collaboration tables in init-database.js  
- Update database schema with agent sessions, messaging, interventions
- Add comprehensive documentation and testing guides"
```

## ⚠️ 주의사항

1. **기존 데이터베이스가 있는 경우**: 백업 후 진행
2. **스키마 변경 시**: 마이그레이션 스크립트도 함께 업데이트
3. **테스트 환경**: 프로덕션 환경과 동일한 스키마 확인
4. **문서 업데이트**: 스키마 변경 시 관련 문서도 업데이트

---

**이 체크리스트를 따라하면 Git 커밋 후에도 새로운 사용자가 올바른 데이터베이스 구조로 시작할 수 있습니다!**