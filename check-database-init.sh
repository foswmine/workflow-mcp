#!/bin/bash
# check-database-init.sh
# Git 커밋 전 데이터베이스 초기화 스크립트 검증 도구

echo "🔍 데이터베이스 초기화 체크 시작..."
echo "=================================="

# 1. 필수 파일 존재 확인
echo ""
echo "📁 필수 파일 확인..."

if [ ! -f "src/database/schema.sql" ]; then
    echo "❌ src/database/schema.sql 파일이 없습니다"
    exit 1
fi
echo "   ✅ schema.sql 존재"

if [ ! -f "src/database/collaboration-schema.sql" ]; then
    echo "❌ src/database/collaboration-schema.sql 파일이 없습니다"
    exit 1
fi
echo "   ✅ collaboration-schema.sql 존재"

if [ ! -f "init-database.js" ]; then
    echo "❌ init-database.js 파일이 없습니다"
    exit 1
fi
echo "   ✅ init-database.js 존재"

# 2. 협업 스키마 포함 확인
echo ""
echo "🤝 협업 스키마 포함 여부 확인..."
if grep -q "collaboration-schema" init-database.js; then
    echo "   ✅ init-database.js에 협업 스키마 포함됨"
else
    echo "   ❌ init-database.js에 협업 스키마 누락됨"
    echo "   📝 수정이 필요합니다!"
    exit 1
fi

if grep -q "COLLABORATION_SCHEMA_PATH" init-database.js; then
    echo "   ✅ COLLABORATION_SCHEMA_PATH 변수 정의됨"
else
    echo "   ❌ COLLABORATION_SCHEMA_PATH 변수 누락됨"
    exit 1
fi

# 3. 데이터 디렉토리 확인 및 생성
echo ""
echo "📂 데이터 디렉토리 확인..."
if [ ! -d "data" ]; then
    echo "   📁 data 디렉토리 생성 중..."
    mkdir -p data
fi
echo "   ✅ data 디렉토리 준비됨"

# 4. 기존 데이터베이스 백업 (있는 경우)
if [ -f "data/workflow.db" ]; then
    echo ""
    echo "💾 기존 데이터베이스 백업 중..."
    backup_name="data/workflow-backup-$(date +%Y%m%d-%H%M%S).db"
    cp "data/workflow.db" "$backup_name"
    echo "   ✅ 백업 완료: $backup_name"
fi

# 5. 테스트 데이터베이스 생성
echo ""
echo "🧪 테스트 데이터베이스 생성..."
rm -f data/workflow-test.db

# 임시로 테스트 DB 경로를 사용하도록 환경변수 설정
export DB_TEST_MODE=true
if node init-database.js > init-test-output.log 2>&1; then
    echo "   ✅ 테스트 데이터베이스 생성 성공"
else
    echo "   ❌ 테스트 데이터베이스 생성 실패"
    echo "   📄 로그 내용:"
    cat init-test-output.log
    rm -f init-test-output.log data/workflow-test.db
    exit 1
fi

# 6. 협업 테이블 존재 확인
echo ""
echo "📊 협업 테이블 존재 확인..."

# 필수 협업 테이블 목록
required_tables=(
    "agent_sessions"
    "collaboration_messages"
    "supervisor_interventions"
    "task_progress_snapshots"
    "approval_workflows"
)

missing_tables=()
for table in "${required_tables[@]}"; do
    if sqlite3 data/workflow.db "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" | grep -q "$table"; then
        echo "   ✅ $table 테이블 존재"
    else
        echo "   ❌ $table 테이블 누락"
        missing_tables+=($table)
    fi
done

if [ ${#missing_tables[@]} -gt 0 ]; then
    echo ""
    echo "❌ 누락된 협업 테이블: ${missing_tables[*]}"
    echo "   init-database.js 스크립트를 다시 확인해주세요"
    rm -f init-test-output.log
    exit 1
fi

# 7. 뷰 테이블 확인
echo ""
echo "👁️ 협업 뷰 테이블 확인..."
collaboration_views=$(sqlite3 data/workflow.db "SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND (name LIKE '%collaboration%' OR name LIKE '%active_%' OR name LIKE '%pending_%');")
echo "   📊 협업 관련 뷰: $collaboration_views 개"

# 8. 인덱스 확인
echo ""
echo "📇 협업 인덱스 확인..."
collaboration_indexes=$(sqlite3 data/workflow.db "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' AND (name LIKE '%collab_%' OR name LIKE '%agent_%' OR name LIKE '%intervention_%' OR name LIKE '%progress_%' OR name LIKE '%approval_%');")
echo "   📈 협업 관련 인덱스: $collaboration_indexes 개"

# 9. 스키마 버전 확인
echo ""
echo "🏷️ 스키마 버전 확인..."
schema_version=$(sqlite3 data/workflow.db "SELECT value FROM system_config WHERE key = 'schema_version';" 2>/dev/null || echo "버전 정보 없음")
echo "   📋 스키마 버전: $schema_version"

# 10. 전체 테이블 수 확인
echo ""
echo "📊 전체 테이블 통계..."
total_tables=$(sqlite3 data/workflow.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
total_views=$(sqlite3 data/workflow.db "SELECT COUNT(*) FROM sqlite_master WHERE type='view';")
total_indexes=$(sqlite3 data/workflow.db "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';")

echo "   📋 테이블: $total_tables 개"
echo "   👁️ 뷰: $total_views 개"  
echo "   📇 인덱스: $total_indexes 개"

# 11. 정리
rm -f init-test-output.log

echo ""
echo "🎉 데이터베이스 초기화 체크 완료!"
echo "=================================="
echo "✅ 모든 체크 항목 통과"
echo "✅ 협업 테이블 모두 존재"
echo "✅ Git 커밋 준비 완료"
echo ""
echo "📋 다음 단계:"
echo "   1. git add ."
echo "   2. git commit -m \"feat: add collaboration system with complete database schema\""
echo "   3. git push origin main"
echo ""
echo "🚀 새로운 사용자는 다음 명령어로 데이터베이스를 초기화할 수 있습니다:"
echo "   node init-database.js"