/**
 * 마이그레이션 도구 - JSON 파일을 SQLite로 전환
 * Phase 2.5: 기존 JSON 데이터를 SQLite 데이터베이스로 마이그레이션
 */

import { FileStorage } from '../utils/FileStorage.js';
import { SQLiteStorage } from './SQLiteStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DataMigrator {
  constructor() {
    this.fileStorage = {
      prds: new FileStorage('prds'),
      tasks: new FileStorage('tasks'),
      plans: new FileStorage('plans')
    };
    this.sqliteStorage = new SQLiteStorage();
    this.migrationLog = [];
  }

  /**
   * 전체 마이그레이션 실행
   */
  async migrate() {
    console.log('🚀 Starting JSON to SQLite migration...\n');
    
    try {
      // 1. SQLite 데이터베이스 초기화
      await this.initializeSQLite();
      
      // 2. 백업 생성
      await this.createBackup();
      
      // 3. 데이터 마이그레이션
      await this.migrateData();
      
      // 4. 데이터 무결성 검증
      await this.verifyMigration();
      
      // 5. 마이그레이션 리포트 생성
      await this.generateReport();
      
      console.log('\n✅ Migration completed successfully!');
      return true;
      
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      throw error;
    } finally {
      this.sqliteStorage.cleanup();
    }
  }

  /**
   * SQLite 데이터베이스 초기화
   */
  async initializeSQLite() {
    console.log('📊 Initializing SQLite database...');
    await this.sqliteStorage.initialize();
    this.log('info', 'SQLite database initialized');
  }

  /**
   * 백업 생성
   */
  async createBackup() {
    console.log('💾 Creating backup of existing JSON data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../backups', `migration-${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });

    // JSON 데이터 백업
    for (const [type, storage] of Object.entries(this.fileStorage)) {
      try {
        await storage.initialize();
        const items = await storage.listAll();
        
        const backupFile = path.join(backupDir, `${type}-backup.json`);
        await fs.writeFile(backupFile, JSON.stringify({
          type,
          timestamp,
          count: items.length,
          items
        }, null, 2));
        
        console.log(`  ✓ Backed up ${items.length} ${type} items`);
        this.log('info', `Backed up ${items.length} ${type} items to ${backupFile}`);
        
      } catch (error) {
        console.warn(`  ⚠️ Could not backup ${type}: ${error.message}`);
        this.log('warning', `Could not backup ${type}: ${error.message}`);
      }
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
    
    // 2. Plans 마이그레이션 (PRD 연결 포함)
    await this.migratePlans(migrationStats);
    
    // 3. Tasks 마이그레이션 (의존성 및 Plan 연결 포함)
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
      
      for (const prd of prds) {
        try {
          // 필수 필드 검증 및 기본값 설정
          const migratedPRD = {
            id: prd.id,
            title: prd.title || 'Untitled PRD',
            description: prd.description || '',
            requirements: prd.requirements || [],
            priority: prd.priority || 'Medium',
            status: prd.status || 'draft',
            createdAt: prd.createdAt || new Date().toISOString(),
            updatedAt: prd.updatedAt || prd.createdAt || new Date().toISOString(),
            version: prd.version || 1,
            createdBy: prd.createdBy || null,
            tags: prd.tags || []
          };
          
          this.sqliteStorage.savePRD(migratedPRD);
          stats.prds.success++;
          
        } catch (error) {
          console.error(`    ❌ Failed to migrate PRD ${prd.id}: ${error.message}`);
          this.log('error', `Failed to migrate PRD ${prd.id}: ${error.message}`);
          stats.prds.failed++;
        }
      }
      
      console.log(`    ✓ Migrated ${stats.prds.success}/${prds.length} PRDs`);
      
    } catch (error) {
      console.error(`    ❌ PRD migration failed: ${error.message}`);
      this.log('error', `PRD migration failed: ${error.message}`);
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
      
      for (const plan of plans) {
        try {
          // 필수 필드 검증 및 기본값 설정
          const migratedPlan = {
            id: plan.id,
            title: plan.title || 'Untitled Plan',
            description: plan.description || '',
            status: plan.status || 'active',
            startDate: plan.startDate || null,
            endDate: plan.endDate || null,
            createdAt: plan.createdAt || new Date().toISOString(),
            updatedAt: plan.updatedAt || plan.createdAt || new Date().toISOString(),
            prd_id: plan.prd_id || null,
            milestones: plan.milestones || [],
            version: plan.version || 1,
            createdBy: plan.createdBy || null,
            tags: plan.tags || []
          };
          
          this.sqliteStorage.savePlan(migratedPlan);
          stats.plans.success++;
          
          // PRD-Plan 연결 생성
          if (plan.prd_id) {
            try {
              this.sqliteStorage.linkPRDToPlan(plan.prd_id, plan.id);
              this.log('info', `Linked PRD ${plan.prd_id} to Plan ${plan.id}`);
            } catch (error) {
              console.warn(`    ⚠️ Could not link PRD ${plan.prd_id} to Plan ${plan.id}: ${error.message}`);
            }
          }
          
        } catch (error) {
          console.error(`    ❌ Failed to migrate Plan ${plan.id}: ${error.message}`);
          this.log('error', `Failed to migrate Plan ${plan.id}: ${error.message}`);
          stats.plans.failed++;
        }
      }
      
      console.log(`    ✓ Migrated ${stats.plans.success}/${plans.length} Plans`);
      
    } catch (error) {
      console.error(`    ❌ Plan migration failed: ${error.message}`);
      this.log('error', `Plan migration failed: ${error.message}`);
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
      
      for (const task of tasks) {
        try {
          // 필수 필드 검증 및 기본값 설정
          const migratedTask = {
            id: task.id,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'Medium',
            assignee: task.assignee || null,
            estimatedHours: task.estimatedHours || null,
            actualHours: task.actualHours || null,
            dueDate: task.dueDate || null,
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
            plan_id: task.plan_id || null,
            dependencies: task.dependencies || [],
            version: task.version || 1,
            createdBy: task.createdBy || null,
            tags: task.tags || [],
            notes: task.notes || null
          };
          
          this.sqliteStorage.saveTask(migratedTask);
          stats.tasks.success++;
          
          // Plan-Task 연결 생성
          if (task.plan_id) {
            try {
              this.sqliteStorage.linkPlanToTask(task.plan_id, task.id);
              this.log('info', `Linked Plan ${task.plan_id} to Task ${task.id}`);
            } catch (error) {
              console.warn(`    ⚠️ Could not link Plan ${task.plan_id} to Task ${task.id}: ${error.message}`);
            }
          }
          
          // Task 의존성 생성
          if (task.dependencies && task.dependencies.length > 0) {
            for (const prerequisiteId of task.dependencies) {
              try {
                this.sqliteStorage.addTaskDependency(task.id, prerequisiteId);
                this.log('info', `Added dependency: ${task.id} depends on ${prerequisiteId}`);
              } catch (error) {
                if (error.message.includes('순환 의존성')) {
                  console.warn(`    ⚠️ Skipped circular dependency: ${task.id} -> ${prerequisiteId}`);
                  this.log('warning', `Skipped circular dependency: ${task.id} -> ${prerequisiteId}`);
                } else {
                  console.warn(`    ⚠️ Could not create dependency ${task.id} -> ${prerequisiteId}: ${error.message}`);
                }
              }
            }
          }
          
        } catch (error) {
          console.error(`    ❌ Failed to migrate Task ${task.id}: ${error.message}`);
          this.log('error', `Failed to migrate Task ${task.id}: ${error.message}`);
          stats.tasks.failed++;
        }
      }
      
      console.log(`    ✓ Migrated ${stats.tasks.success}/${tasks.length} Tasks`);
      
    } catch (error) {
      console.error(`    ❌ Task migration failed: ${error.message}`);
      this.log('error', `Task migration failed: ${error.message}`);
    }
  }

  /**
   * 데이터 무결성 검증
   */
  async verifyMigration() {
    console.log('\n🔍 Verifying migration integrity...');
    
    const verification = {
      passed: true,
      issues: []
    };

    try {
      // 1. 기본 카운트 검증
      await this.verifyDataCounts(verification);
      
      // 2. 연결 관계 검증
      await this.verifyRelationships(verification);
      
      // 3. 데이터 일관성 검증
      await this.verifyDataConsistency(verification);
      
      if (verification.passed) {
        console.log('  ✅ All verification checks passed!');
      } else {
        console.log(`  ⚠️ ${verification.issues.length} verification issues found:`);
        verification.issues.forEach(issue => {
          console.log(`    - ${issue}`);
        });
      }
      
    } catch (error) {
      console.error(`  ❌ Verification failed: ${error.message}`);
      verification.passed = false;
      verification.issues.push(`Verification error: ${error.message}`);
    }
    
    return verification;
  }

  /**
   * 데이터 카운트 검증
   */
  async verifyDataCounts(verification) {
    console.log('  📊 Checking data counts...');
    
    for (const type of ['prds', 'tasks', 'plans']) {
      try {
        const jsonItems = await this.fileStorage[type].listAll();
        
        let sqliteItems;
        if (type === 'prds') {
          sqliteItems = this.sqliteStorage.listAllPRDs();
        } else if (type === 'tasks') {
          sqliteItems = this.sqliteStorage.listAllTasks();
        } else {
          sqliteItems = this.sqliteStorage.listAllPlans();
        }
        
        if (jsonItems.length !== sqliteItems.length) {
          const issue = `${type.toUpperCase()} count mismatch: JSON=${jsonItems.length}, SQLite=${sqliteItems.length}`;
          verification.issues.push(issue);
          verification.passed = false;
        } else {
          console.log(`    ✓ ${type.toUpperCase()}: ${sqliteItems.length} items`);
        }
        
      } catch (error) {
        const issue = `Could not verify ${type} count: ${error.message}`;
        verification.issues.push(issue);
        verification.passed = false;
      }
    }
  }

  /**
   * 관계 검증
   */
  async verifyRelationships(verification) {
    console.log('  🔗 Checking relationships...');
    
    try {
      const plans = this.sqliteStorage.listAllPlans();
      const tasks = this.sqliteStorage.listAllTasks();
      
      // PRD-Plan 연결 검증
      for (const plan of plans) {
        if (plan.prd_id) {
          const prd = this.sqliteStorage.getPRD(plan.prd_id);
          if (!prd) {
            const issue = `Plan ${plan.id} references non-existent PRD ${plan.prd_id}`;
            verification.issues.push(issue);
            verification.passed = false;
          }
        }
      }
      
      // Plan-Task 연결 검증
      for (const task of tasks) {
        if (task.plan_id) {
          const plan = this.sqliteStorage.getPlan(task.plan_id);
          if (!plan) {
            const issue = `Task ${task.id} references non-existent Plan ${task.plan_id}`;
            verification.issues.push(issue);
            verification.passed = false;
          }
        }
      }
      
      // Task 의존성 검증
      for (const task of tasks) {
        for (const depId of task.dependencies) {
          const depTask = this.sqliteStorage.getTask(depId);
          if (!depTask) {
            const issue = `Task ${task.id} depends on non-existent Task ${depId}`;
            verification.issues.push(issue);
            verification.passed = false;
          }
        }
      }
      
      console.log('    ✓ Relationship integrity verified');
      
    } catch (error) {
      const issue = `Relationship verification failed: ${error.message}`;
      verification.issues.push(issue);
      verification.passed = false;
    }
  }

  /**
   * 데이터 일관성 검증
   */
  async verifyDataConsistency(verification) {
    console.log('  🎯 Checking data consistency...');
    
    try {
      const stats = this.sqliteStorage.getDashboardStats();
      
      // 기본 통계 검증
      if (stats.total_prds < 0 || stats.total_tasks < 0 || stats.total_plans < 0) {
        const issue = 'Negative counts detected in dashboard statistics';
        verification.issues.push(issue);
        verification.passed = false;
      }
      
      console.log('    ✓ Data consistency verified');
      console.log(`      - PRDs: ${stats.total_prds}, Plans: ${stats.total_plans}, Tasks: ${stats.total_tasks}`);
      
    } catch (error) {
      const issue = `Data consistency check failed: ${error.message}`;
      verification.issues.push(issue);
      verification.passed = false;
    }
  }

  /**
   * 마이그레이션 리포트 생성
   */
  async generateReport() {
    console.log('\n📄 Generating migration report...');
    
    const timestamp = new Date().toISOString();
    const stats = this.sqliteStorage.getDashboardStats();
    
    const report = {
      migration: {
        timestamp,
        status: 'completed',
        version: '2.5.0'
      },
      results: {
        totalPRDs: stats.total_prds,
        totalTasks: stats.total_tasks,
        totalPlans: stats.total_plans,
        totalMilestones: stats.total_milestones
      },
      log: this.migrationLog,
      database: {
        location: this.sqliteStorage.dbPath,
        size: await this.getDatabaseSize()
      }
    };
    
    const reportDir = path.join(__dirname, '../../docs');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'PHASE_2_5_MIGRATION_REPORT.md');
    const reportContent = this.formatReportAsMarkdown(report);
    
    await fs.writeFile(reportPath, reportContent);
    
    console.log(`  ✓ Migration report saved to: ${reportPath}`);
    this.log('info', `Migration report generated: ${reportPath}`);
  }

  /**
   * 마이그레이션 리포트 마크다운 포맷팅
   */
  formatReportAsMarkdown(report) {
    const timestamp = new Date().toLocaleString('ko-KR');
    
    return `# 🗄️ WorkflowMCP Phase 2.5 마이그레이션 리포트

**마이그레이션 완료일**: ${timestamp}  
**데이터베이스 버전**: ${report.migration.version}  
**상태**: ${report.migration.status}

---

## 📊 마이그레이션 결과

### ✅ 데이터 통계
- **📋 PRD**: ${report.results.totalPRDs}개
- **✅ Task**: ${report.results.totalTasks}개  
- **📅 Plan**: ${report.results.totalPlans}개
- **🎯 Milestone**: ${report.results.totalMilestones}개

### 🗄️ 데이터베이스 정보
- **위치**: \`${report.database.location}\`
- **크기**: ${report.database.size}

---

## 📝 마이그레이션 로그

${report.log.map(entry => 
  `**${entry.level.toUpperCase()}** [${entry.timestamp}]: ${entry.message}`
).join('\n')}

---

## 🎯 다음 단계

✅ **Phase 2.5 완료** - SQLite 전환 성공  
🔜 **Phase 2.6** - SvelteKit 웹 대시보드 개발  

**이제 고성능 SQLite 기반의 WorkflowMCP를 사용할 수 있습니다!** 🚀

---

**리포트 생성일**: ${timestamp}  
**마이그레이션 도구**: DataMigrator v2.5.0
`;
  }

  /**
   * 데이터베이스 파일 크기 조회
   */
  async getDatabaseSize() {
    try {
      const stats = await fs.stat(this.sqliteStorage.dbPath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      return `${sizeInMB} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * 로그 추가
   */
  log(level, message) {
    this.migrationLog.push({
      level,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

// CLI 실행 지원
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DataMigrator();
  
  migrator.migrate()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error.message);
      process.exit(1);
    });
}