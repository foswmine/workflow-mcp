#!/usr/bin/env node
/**
 * WorkflowMCP Database Initialization Script
 * Creates and initializes SQLite database with current schema
 * Version: 3.0.0 (Core Project Management Features + Test Management + Documents + Designs)
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const DB_PATH = join(DATA_DIR, 'workflow.db');
const MAIN_SCHEMA_PATH = join(__dirname, 'src', 'database', 'schema.sql');

/**
 * Initialize the WorkflowMCP database
 */
async function initializeDatabase() {
  console.log('🚀 WorkflowMCP Database Initialization');
  console.log('=====================================\n');

  try {
    // 1. Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      console.log('📁 Creating data directory...');
      mkdirSync(DATA_DIR, { recursive: true });
      console.log('   ✅ Data directory created: ' + DATA_DIR);
    } else {
      console.log('📁 Data directory exists: ' + DATA_DIR);
    }

    // 2. Check if database already exists
    const dbExists = existsSync(DB_PATH);
    if (dbExists) {
      console.log('⚠️  Database already exists: ' + DB_PATH);
      console.log('   This script will apply schema updates if needed.\n');
    } else {
      console.log('🆕 Creating new database: ' + DB_PATH + '\n');
    }

    // 3. Read schema files
    if (!existsSync(MAIN_SCHEMA_PATH)) {
      throw new Error(`Main schema file not found: ${MAIN_SCHEMA_PATH}`);
    }

    console.log('📄 Reading schema file...');
    const schemaSQL = readFileSync(MAIN_SCHEMA_PATH, 'utf8');
    console.log('   ✅ Main schema loaded (' + schemaSQL.length + ' characters)');

    // 4. Connect to database
    console.log('\n🔌 Connecting to database...');
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.default.Database
    });
    console.log('   ✅ Database connection established');

    // 5. Apply schema
    console.log('\n📊 Applying database schema...');
    await db.exec(schemaSQL);
    console.log('   ✅ Schema applied successfully');

    // 6. Verify schema version
    const versionResult = await db.get(`
      SELECT value as version FROM system_config WHERE key = 'schema_version'
    `);
    console.log(`   📋 Schema Version: ${versionResult?.version || 'Not set'}`);

    // 7. Check table creation
    console.log('\n🔍 Verifying table creation...');
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' 
      ORDER BY name
    `);

    console.log('   📊 Created tables:');
    tables.forEach((table, index) => {
      console.log(`      ${index + 1}. ${table.name}`);
    });

    // 8. Check views
    const views = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='view' 
      ORDER BY name
    `);
    
    if (views.length > 0) {
      console.log('   👁️ Created views:');
      views.forEach((view, index) => {
        console.log(`      ${index + 1}. ${view.name}`);
      });
    }

    // 9. Check FTS tables
    const fts = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND sql LIKE '%fts5%'
      ORDER BY name
    `);

    if (fts.length > 0) {
      console.log('   🔍 FTS search tables:');
      fts.forEach((table, index) => {
        console.log(`      ${index + 1}. ${table.name}`);
      });
    }

    // 10. Show data counts
    console.log('\n📊 Current data counts:');
    const counts = await Promise.all([
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

    const countLabels = [
      'PRDs', 'Tasks', 'Plans', 'Documents', 'Test Cases', 'Test Executions',
      'Designs', 'Projects', 'Environments', 'Deployments', 'Incidents'
    ];
    counts.forEach((result, index) => {
      console.log(`   📈 ${countLabels[index]}: ${result.count} records`);
    });

    // 11. Test database functionality
    console.log('\n🧪 Testing database functionality...');
    
    // Test basic query
    const testQuery = await db.get('SELECT datetime("now") as current_time');
    console.log(`   ⏰ Database time: ${testQuery.current_time}`);

    // Test foreign key constraints
    const fkResult = await db.get('PRAGMA foreign_keys');
    console.log(`   🔗 Foreign keys: ${fkResult.foreign_keys ? 'ON' : 'OFF'}`);

    // Test if indexes exist
    const indexCount = await db.get(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `);
    console.log(`   📇 Custom indexes: ${indexCount.count} created`);

    // 12. Close database connection
    await db.close();
    console.log('\n✅ Database connection closed');

    // 13. Success summary
    console.log('\n🎉 DATABASE INITIALIZATION COMPLETE!');
    console.log('=====================================');
    console.log(`📁 Database location: ${DB_PATH}`);
    console.log(`📊 Schema version: ${versionResult?.version || 'Not set'}`);
    console.log(`📋 Tables created: ${tables.length}`);
    console.log(`👁️ Views created: ${views.length}`);
    console.log(`🔍 FTS tables: ${fts.length}`);
    console.log('\n🚀 Your WorkflowMCP database is ready to use!');

    console.log('\n📋 Next steps:');
    console.log('   1. Start MCP server: npm start');
    console.log('   2. Start dashboard: cd dashboard && npm run dev');
    console.log('   3. Access dashboard: http://localhost:3301');
    console.log('   4. (Optional) Add sample data: node add-sample-data.js');

  } catch (error) {
    console.error('\n❌ DATABASE INITIALIZATION FAILED');
    console.error('==================================');
    console.error(`Error: ${error.message}`);
    
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure Node.js ≥18.0.0 is installed');
    console.error('   2. Check file permissions for data directory');
    console.error('   3. Verify sqlite3 package is installed: npm install');
    console.error('   4. Check schema.sql file exists and is valid');
    
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export default initializeDatabase;