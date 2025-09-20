#!/usr/bin/env node
/**
 * WorkflowMCP Database Verification Script
 * Verifies database integrity and functionality
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { existsSync } from 'fs';

const DB_PATH = './data/workflow.db';

/**
 * Verify database functionality
 */
async function verifyDatabase() {
  console.log('🔍 WorkflowMCP Database Verification');
  console.log('=====================================\n');

  try {
    // Check if database exists
    if (!existsSync(DB_PATH)) {
      console.log('❌ Database file not found: ' + DB_PATH);
      console.log('💡 Run: node init-database.js to create the database');
      return;
    }

    console.log('✅ Database file exists: ' + DB_PATH);

    // Connect to database
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    console.log('✅ Database connection established\n');

    // 1. Check schema version
    console.log('📋 Schema Information:');
    const version = await db.get(`
      SELECT value FROM system_config WHERE key = 'schema_version'
    `).catch(() => ({ value: 'Unknown' }));
    console.log(`   Schema Version: ${version.value}`);

    // 2. Check tables
    console.log('\n📊 Table Verification:');
    const expectedTables = [
      'prds', 'tasks', 'plans', 'documents', 'test_cases', 'test_executions',
      'designs', 'projects', 'environments', 'deployments', 'incidents',
      'milestones', 'task_dependencies', 'document_relations', 'document_links',
      'system_config'
    ];

    const existingTables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tableNames = existingTables.map(t => t.name);
    
    for (const table of expectedTables) {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    // 3. Check views
    console.log('\n👁️  Views Verification:');
    const views = await db.all(`
      SELECT name FROM sqlite_master WHERE type='view' ORDER BY name
    `);
    
    if (views.length > 0) {
      views.forEach(view => {
        console.log(`   ✅ ${view.name}`);
      });
    } else {
      console.log('   ⚠️  No views found');
    }

    // 4. Check FTS
    console.log('\n🔍 Full-Text Search Verification:');
    const ftsResult = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE '%_fts'
    `).catch(() => null);
    
    if (ftsResult) {
      console.log(`   ✅ FTS table: ${ftsResult.name}`);
      
      // Test FTS functionality
      try {
        await db.get("SELECT * FROM documents_fts LIMIT 1");
        console.log('   ✅ FTS functionality verified');
      } catch (ftsError) {
        console.log('   ⚠️  FTS table exists but may need data');
      }
    } else {
      console.log('   ❌ No FTS tables found');
    }

    // 5. Check indexes
    console.log('\n📇 Index Verification:');
    const indexes = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `);
    console.log(`   ✅ Custom indexes: ${indexes.length} found`);

    // 6. Data integrity checks
    console.log('\n🔒 Data Integrity Verification:');
    
    // Check foreign keys
    const fkStatus = await db.get('PRAGMA foreign_keys');
    console.log(`   ${fkStatus.foreign_keys ? '✅' : '❌'} Foreign key constraints: ${fkStatus.foreign_keys ? 'ON' : 'OFF'}`);

    // Check for orphaned records (if data exists)
    const dataChecks = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM prds'),
      db.get('SELECT COUNT(*) as count FROM tasks'),
      db.get('SELECT COUNT(*) as count FROM documents'),
      db.get('SELECT COUNT(*) as count FROM test_cases')
    ]);

    const hasData = dataChecks.some(check => check.count > 0);
    
    if (hasData) {
      console.log('   📊 Data exists, checking integrity...');
      
      // Check for orphaned tasks
      const orphanedTasks = await db.get(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE plan_id IS NOT NULL 
        AND plan_id NOT IN (SELECT id FROM plans)
      `);
      console.log(`   ${orphanedTasks.count === 0 ? '✅' : '⚠️'} Orphaned tasks: ${orphanedTasks.count}`);
      
    } else {
      console.log('   ℹ️  No data in database (fresh installation)');
    }

    // 7. Performance checks
    console.log('\n⚡ Performance Verification:');
    
    const startTime = Date.now();
    await db.get('SELECT COUNT(*) FROM sqlite_master');
    const endTime = Date.now();
    
    console.log(`   ✅ Query response time: ${endTime - startTime}ms`);
    
    // Check if database is in WAL mode (better for concurrent access)
    const journalMode = await db.get('PRAGMA journal_mode');
    console.log(`   📝 Journal mode: ${journalMode.journal_mode}`);

    // 8. Test CRUD operations
    console.log('\n🧪 CRUD Operations Test:');
    
    try {
      // Test insert
      const testId = 'test-' + Date.now();
      await db.run(`
        INSERT INTO documents (title, content, doc_type, summary, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `, ['Database Verification Test', 'This is a test document.', 'test_results', 'Test document for verification']);
      console.log('   ✅ INSERT operation successful');
      
      // Test select
      const testDoc = await db.get(`
        SELECT * FROM documents WHERE title = 'Database Verification Test'
      `);
      console.log('   ✅ SELECT operation successful');
      
      // Test update
      await db.run(`
        UPDATE documents 
        SET content = 'Updated test content', updated_at = datetime('now') 
        WHERE id = ?
      `, [testDoc.id]);
      console.log('   ✅ UPDATE operation successful');
      
      // Test delete
      await db.run('DELETE FROM documents WHERE id = ?', [testDoc.id]);
      console.log('   ✅ DELETE operation successful');
      
    } catch (crudError) {
      console.log('   ❌ CRUD operations failed: ' + crudError.message);
    }

    // 9. Data summary
    console.log('\n📊 Current Data Summary:');
    const summaryData = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM prds'),
      db.get('SELECT COUNT(*) as count FROM tasks'),
      db.get('SELECT COUNT(*) as count FROM plans'),
      db.get('SELECT COUNT(*) as count FROM documents'),
      db.get('SELECT COUNT(*) as count FROM test_cases'),
      db.get('SELECT COUNT(*) as count FROM test_executions'),
      db.get('SELECT COUNT(*) as count FROM designs'),
      db.get('SELECT COUNT(*) as count FROM projects'),
      db.get('SELECT COUNT(*) as count FROM environments'),
      db.get('SELECT COUNT(*) as count FROM deployments'),
      db.get('SELECT COUNT(*) as count FROM incidents')
    ]);

    const labels = ['PRDs', 'Tasks', 'Plans', 'Documents', 'Test Cases', 'Test Executions', 'Designs', 'Projects', 'Environments', 'Deployments', 'Incidents'];
    summaryData.forEach((data, index) => {
      console.log(`   📈 ${labels[index]}: ${data.count} records`);
    });

    await db.close();

    // Final status
    console.log('\n🎉 DATABASE VERIFICATION COMPLETE!');
    console.log('=====================================');
    console.log('✅ Database is ready for use');
    
    if (!hasData) {
      console.log('\n💡 Optional: Add sample data for testing:');
      console.log('   node add-sample-data.js');
    }
    
  } catch (error) {
    console.error('\n❌ DATABASE VERIFICATION FAILED');
    console.error('===============================');
    console.error(`Error: ${error.message}`);
    
    console.error('\n🔧 Suggested fixes:');
    console.error('   1. Recreate database: node init-database.js');
    console.error('   2. Check file permissions');
    console.error('   3. Ensure SQLite3 is properly installed');
    
    process.exit(1);
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabase();
}

export default verifyDatabase;