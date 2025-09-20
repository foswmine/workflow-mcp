// SQLite 서버 기능 테스트
import { SimpleSQLiteStorage } from './src/database/SimpleSQLiteStorage.js';

console.log('🔍 Testing SQLite Server functionality...\n');

async function testSQLiteServer() {
  const storage = new SimpleSQLiteStorage();
  
  try {
    // 1. 초기화
    console.log('📊 Initializing SQLite storage...');
    await storage.initialize();
    console.log('✅ SQLite storage initialized successfully\n');
    
    // 2. 데이터 존재 확인
    console.log('🔍 Checking migrated data...');
    const prds = await storage.listAllPRDs();
    const tasks = await storage.listAllTasks();
    const plans = await storage.listAllPlans();
    
    console.log(`📋 PRDs found: ${prds.length}`);
    console.log(`✅ Tasks found: ${tasks.length}`);
    console.log(`📅 Plans found: ${plans.length}\n`);
    
    // 3. 데이터 상세 확인
    if (prds.length > 0) {
      console.log('📋 Sample PRD:');
      console.log(`  - Title: ${prds[0].title}`);
      console.log(`  - ID: ${prds[0].id}`);
      console.log(`  - Status: ${prds[0].status}\n`);
    }
    
    if (tasks.length > 0) {
      console.log('✅ Sample Task:');
      console.log(`  - Title: ${tasks[0].title}`);
      console.log(`  - ID: ${tasks[0].id}`);
      console.log(`  - Status: ${tasks[0].status}`);
      console.log(`  - Dependencies: ${tasks[0].dependencies.length}\n`);
    }
    
    if (plans.length > 0) {
      console.log('📅 Sample Plan:');
      console.log(`  - Title: ${plans[0].title}`);
      console.log(`  - ID: ${plans[0].id}`);
      console.log(`  - Progress: ${plans[0].progress.percentage}%\n`);
    }
    
    // 4. 대시보드 테스트
    console.log('📊 Testing dashboard...');
    const stats = await storage.getDashboardStats();
    console.log(`Dashboard stats: PRDs=${stats.total_prds}, Tasks=${stats.total_tasks}, Plans=${stats.total_plans}\n`);
    
    // 5. 테이블 존재 확인
    console.log('🗄️ Checking database tables...');
    const tables = await storage.getTables();
    console.log(`Tables created: ${tables.join(', ')}\n`);
    
    console.log('✅ All SQLite functionality tests passed!');
    
  } catch (error) {
    console.error('❌ SQLite test failed:', error);
    throw error;
  } finally {
    await storage.cleanup();
  }
}

testSQLiteServer()
  .then(() => {
    console.log('\n🎉 SQLite server test completed successfully!');
    console.log('\n📍 Ready for Phase 2.6 (SvelteKit Dashboard)');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 SQLite server test failed:', error.message);
    process.exit(1);
  });