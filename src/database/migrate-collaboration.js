#!/usr/bin/env node

/**
 * Database Migration Script for Collaboration Features
 * 
 * This script adds collaboration tables and features to existing workflow-mcp databases.
 * It safely applies schema changes from collaboration-schema.sql to your existing database.
 * 
 * Usage:
 *   node src/database/migrate-collaboration.js
 *   node src/database/migrate-collaboration.js --backup
 */

import sqlite3 from 'sqlite3';
const { verbose } = sqlite3;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CollaborationMigrator {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/workflow.db');
    this.backupPath = path.join(__dirname, '../../data/workflow-backup-' + Date.now() + '.db');
    this.schemaPath = path.join(__dirname, 'collaboration-schema.sql');
    this.db = null;
  }

  async migrate(createBackup = false) {
    console.log('🚀 Starting Collaboration Features Migration');
    
    try {
      // 1. Check if database exists
      if (!fs.existsSync(this.dbPath)) {
        console.log('❌ Database not found at:', this.dbPath);
        console.log('   Please run workflow-mcp server first to create the database');
        process.exit(1);
      }

      // 2. Create backup if requested
      if (createBackup) {
        await this.createBackup();
      }

      // 3. Connect to database
      await this.connect();

      // 4. Check current schema version
      const currentVersion = await this.getCurrentSchemaVersion();
      console.log(`📊 Current schema version: ${currentVersion}`);

      if (currentVersion >= 3.0) {
        console.log('✅ Collaboration features already installed!');
        await this.disconnect();
        return;
      }

      // 5. Apply collaboration schema
      await this.applyCollaborationSchema();

      // 6. Update schema version
      await this.updateSchemaVersion('3.0.0');

      // 7. Verify installation
      await this.verifyInstallation();

      console.log('✅ Collaboration features migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      
      if (createBackup && fs.existsSync(this.backupPath)) {
        console.log('💾 Backup available at:', this.backupPath);
        console.log('   You can restore it if needed');
      }
      
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }

  async createBackup() {
    console.log('💾 Creating database backup...');
    
    try {
      fs.copyFileSync(this.dbPath, this.backupPath);
      console.log(`✅ Backup created: ${this.backupPath}`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new verbose().Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to database: ${err.message}`));
        } else {
          console.log('📂 Connected to database');
          resolve();
        }
      });
    });
  }

  async disconnect() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Warning: Error closing database:', err.message);
          }
          resolve();
        });
      });
    }
  }

  async getCurrentSchemaVersion() {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT value FROM metadata WHERE key = 'schema_version'",
        (err, row) => {
          if (err) {
            // If metadata table doesn't exist, assume version 1.0
            resolve(1.0);
          } else if (row) {
            resolve(parseFloat(row.value));
          } else {
            resolve(1.0);
          }
        }
      );
    });
  }

  async updateSchemaVersion(version) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES ('schema_version', ?, datetime('now'))",
        [version],
        (err) => {
          if (err) {
            reject(new Error(`Failed to update schema version: ${err.message}`));
          } else {
            console.log(`📝 Schema version updated to: ${version}`);
            resolve();
          }
        }
      );
    });
  }

  async applyCollaborationSchema() {
    console.log('📋 Applying collaboration schema...');
    
    // Read collaboration schema file
    if (!fs.existsSync(this.schemaPath)) {
      throw new Error(`Schema file not found: ${this.schemaPath}`);
    }

    const schemaSQL = fs.readFileSync(this.schemaPath, 'utf8');
    
    // Split SQL statements (basic splitting by semicolons outside of quotes)
    const statements = this.splitSQLStatements(schemaSQL);
    
    let appliedCount = 0;
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      
      if (!trimmedStatement || trimmedStatement.startsWith('--')) {
        continue; // Skip empty lines and comments
      }
      
      try {
        await this.executeStatement(trimmedStatement);
        appliedCount++;
        
        // Show progress for major operations
        if (trimmedStatement.toLowerCase().includes('create table')) {
          const match = trimmedStatement.match(/create table (?:if not exists )?([a-zA-Z_]+)/i);
          if (match) {
            console.log(`  ✓ Created table: ${match[1]}`);
          }
        } else if (trimmedStatement.toLowerCase().includes('create index')) {
          const match = trimmedStatement.match(/create index (?:if not exists )?([a-zA-Z_]+)/i);
          if (match) {
            console.log(`  ✓ Created index: ${match[1]}`);
          }
        } else if (trimmedStatement.toLowerCase().includes('create view')) {
          const match = trimmedStatement.match(/create view (?:if not exists )?([a-zA-Z_]+)/i);
          if (match) {
            console.log(`  ✓ Created view: ${match[1]}`);
          }
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          // Ignore "already exists" errors for IF NOT EXISTS statements
          continue;
        }
        throw new Error(`Failed to execute statement: ${error.message}\n\nStatement: ${trimmedStatement.substring(0, 200)}...`);
      }
    }
    
    console.log(`✅ Applied ${appliedCount} schema statements`);
  }

  splitSQLStatements(sql) {
    // Basic SQL statement splitter that handles quotes
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const prevChar = i > 0 ? sql[i - 1] : '';
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      } else if (!inString && char === ';') {
        current = current.trim();
        if (current) {
          statements.push(current);
        }
        current = '';
        continue;
      }
      
      current += char;
    }
    
    // Add final statement if exists
    current = current.trim();
    if (current) {
      statements.push(current);
    }
    
    return statements;
  }

  async executeStatement(statement) {
    return new Promise((resolve, reject) => {
      this.db.run(statement, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async verifyInstallation() {
    console.log('🔍 Verifying installation...');
    
    const expectedTables = [
      'agent_sessions',
      'collaboration_messages', 
      'supervisor_interventions',
      'task_progress_snapshots',
      'approval_workflows'
    ];
    
    const expectedViews = [
      'active_collaboration_sessions',
      'pending_approvals_summary',
      'recent_collaboration_activity'
    ];
    
    // Check tables
    for (const table of expectedTables) {
      const exists = await this.tableExists(table);
      if (!exists) {
        throw new Error(`Table ${table} was not created properly`);
      }
      console.log(`  ✓ Table: ${table}`);
    }
    
    // Check views
    for (const view of expectedViews) {
      const exists = await this.viewExists(view);
      if (!exists) {
        throw new Error(`View ${view} was not created properly`);
      }
      console.log(`  ✓ View: ${view}`);
    }
    
    console.log('✅ All collaboration components verified successfully');
  }

  async tableExists(tableName) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }

  async viewExists(viewName) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT name FROM sqlite_master WHERE type='view' AND name=?",
        [viewName],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const createBackup = args.includes('--backup') || args.includes('-b');
  
  console.log('');
  console.log('==================================================');
  console.log('  Workflow MCP - Collaboration Features Migration');
  console.log('==================================================');
  console.log('');
  
  const migrator = new CollaborationMigrator();
  await migrator.migrate(createBackup);
  
  console.log('');
  console.log('🎉 Migration completed! You can now use collaboration features:');
  console.log('   1. Start two Claude Code instances');
  console.log('   2. Use workflow-mcp tools for agent sessions and messaging');
  console.log('   3. Check the dashboard at http://localhost:3301 for monitoring');
  console.log('');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  });
}

export { CollaborationMigrator };