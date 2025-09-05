// 마이그레이션 실행 테스트
import { SimpleMigrator } from './src/database/simple-migrate.js';

console.log('🚀 Starting migration test...');

const migrator = new SimpleMigrator();

try {
  await migrator.migrate();
  console.log('\n🎉 Migration test completed successfully!');
} catch (error) {
  console.error('\n💥 Migration test failed:', error);
  console.error(error.stack);
}

process.exit(0);