/**
 * 간단한 마이그레이션 도구 - JSON 파일을 SQLite로 전환
 * Phase 2.5: 기존 JSON 데이터를 SQLite 데이터베이스로 마이그레이션
 */

import { FileStorage } from '../utils/FileStorage.js';
import { SimpleSQLiteStorage } from './SimpleSQLiteStorage.js';

export class SimpleMigrator {
  constructor() {
    this.fileStorage = {
      prds: new FileStorage('prds'),
      tasks: new FileStorage('tasks'),
      plans: new FileStorage('plans')
    };
    this.sqliteStorage = new SimpleSQLiteStorage();
    this.migrationLog = [];
  }

  /**
   * 전체 마이그레이션 실행
   */
  async migrate() {
    console.log('🚀 Starting JSON to SQLite migration...\n');
    
    try {
      // 1. SQLite 데이터베이스 초기화
      console.log('📊 Initializing SQLite database...');
      await this.sqliteStorage.initialize();
      
      // 2. 데이터 마이그레이션
      await this.migrateData();
      
      // 3. 간단한 검증
      await this.verifyMigration();
      
      console.log('\n✅ Migration completed successfully!');
      return true;
      
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      throw error;
    } finally {
      await this.sqliteStorage.cleanup();
    }
  }

  /**
   * 데이터 마이그레이션 실행
   */
  async migrateData() {
    console.log('\n🔄 Migrating data from JSON to SQLite...');
    
    const migrationStats = {
      prds: { success: 0, failed: 0 },
      tasks: { success: 0, failed: 0 },
      plans: { success: 0, failed: 0 }
    };

    // 1. PRDs 마이그레이션
    await this.migratePRDs(migrationStats);
    
    // 2. Plans 마이그레이션
    await this.migratePlans(migrationStats);
    
    // 3. Tasks 마이그레이션
    await this.migrateTasks(migrationStats);
    
    console.log('\n📈 Migration Statistics:');
    for (const [type, stats] of Object.entries(migrationStats)) {
      console.log(`  ${type.toUpperCase()}: ${stats.success} successful, ${stats.failed} failed`);
    }
  }

  /**
   * PRD 마이그레이션
   */
  async migratePRDs(stats) {
    console.log('  📋 Migrating PRDs...');
    
    try {
      await this.fileStorage.prds.initialize();
      const prds = await this.fileStorage.prds.listAll();
      console.log(`    Found ${prds.length} PRDs to migrate`);
      
      for (const prd of prds) {
        try {
          const migratedPRD = {
            id: prd.id,
            title: prd.title || 'Untitled PRD',
            description: prd.description || '',
            requirements: prd.requirements || [],
            priority: prd.priority || 'Medium',
            status: prd.status || 'draft',
            createdAt: prd.createdAt || new Date().toISOString(),
            updatedAt: prd.updatedAt || prd.createdAt || new Date().toISOString()
          };
          
          await this.sqliteStorage.savePRD(migratedPRD);
          stats.prds.success++;
          console.log(`    ✓ Migrated PRD: ${prd.title}`);
          
        } catch (error) {
          console.error(`    ❌ Failed to migrate PRD ${prd.id}: ${error.message}`);
          stats.prds.failed++;
        }
      }
      
    } catch (error) {
      console.error(`    ❌ PRD migration failed: ${error.message}`);
    }
  }

  /**
   * Plan 마이그레이션
   */
  async migratePlans(stats) {
    console.log('  📅 Migrating Plans...');
    
    try {
      await this.fileStorage.plans.initialize();
      const plans = await this.fileStorage.plans.listAll();
      console.log(`    Found ${plans.length} Plans to migrate`);
      
      for (const plan of plans) {
        try {
          const migratedPlan = {
            id: plan.id,
            title: plan.title || 'Untitled Plan',
            description: plan.description || '',
            status: plan.status || 'active',
            startDate: plan.startDate || null,
            endDate: plan.endDate || null,
            createdAt: plan.createdAt || new Date().toISOString(),
            updatedAt: plan.updatedAt || plan.createdAt || new Date().toISOString(),
            prd_id: plan.prd_id || null
          };
          
          await this.sqliteStorage.savePlan(migratedPlan);
          stats.plans.success++;
          console.log(`    ✓ Migrated Plan: ${plan.title}`);
          
        } catch (error) {
          console.error(`    ❌ Failed to migrate Plan ${plan.id}: ${error.message}`);
          stats.plans.failed++;
        }
      }
      
    } catch (error) {
      console.error(`    ❌ Plan migration failed: ${error.message}`);
    }
  }

  /**
   * Task 마이그레이션
   */
  async migrateTasks(stats) {
    console.log('  ✅ Migrating Tasks...');
    
    try {
      await this.fileStorage.tasks.initialize();
      const tasks = await this.fileStorage.tasks.listAll();
      console.log(`    Found ${tasks.length} Tasks to migrate`);
      
      for (const task of tasks) {
        try {
          const migratedTask = {
            id: task.id,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'Medium',
            assignee: task.assignee || null,
            estimatedHours: task.estimatedHours || null,
            dueDate: task.dueDate || null,
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
            plan_id: task.plan_id || null
          };
          
          await this.sqliteStorage.saveTask(migratedTask);
          stats.tasks.success++;
          console.log(`    ✓ Migrated Task: ${task.title}`);
          
          // Task 의존성 마이그레이션
          if (task.dependencies && task.dependencies.length > 0) {
            for (const prerequisiteId of task.dependencies) {
              try {
                await this.sqliteStorage.addTaskDependency(task.id, prerequisiteId);
                console.log(`      → Added dependency: ${task.id} depends on ${prerequisiteId}`);
              } catch (error) {
                console.warn(`      ⚠️ Could not create dependency ${task.id} -> ${prerequisiteId}: ${error.message}`);
              }
            }
          }
          
        } catch (error) {
          console.error(`    ❌ Failed to migrate Task ${task.id}: ${error.message}`);
          stats.tasks.failed++;
        }
      }
      
    } catch (error) {
      console.error(`    ❌ Task migration failed: ${error.message}`);
    }
  }

  /**
   * 간단한 데이터 검증
   */
  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    try {
      const stats = await this.sqliteStorage.getDashboardStats();
      console.log('  📊 SQLite Data Summary:');
      console.log(`    - PRDs: ${stats.total_prds}`);
      console.log(`    - Tasks: ${stats.total_tasks}`);
      console.log(`    - Plans: ${stats.total_plans}`);
      
      const tables = await this.sqliteStorage.getTables();
      console.log(`  🗄️ Created Tables: ${tables.join(', ')}`);
      
      console.log('  ✅ Verification completed');
      
    } catch (error) {
      console.error(`  ❌ Verification failed: ${error.message}`);
    }
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new SimpleMigrator();
  
  migrator.migrate()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📍 Next Steps:');
      console.log('  1. Test the SQLite database');
      console.log('  2. Update MCP server to use SQLite');
      console.log('  3. Verify all 26 MCP tools work correctly');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error.message);
      process.exit(1);
    });
}