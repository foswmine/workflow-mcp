#!/usr/bin/env node
/**
 * MCP Server Data Migration to Unified Database
 * 
 * Purpose: Migrate all PRD data from MCP server's internal storage 
 * to the unified workflow.db database
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import MCP server to access its data
import { PRDManager } from './src/models/PRDManager.js';

class DatabaseMigration {
  constructor() {
    this.sourceManager = new PRDManager(); // MCP server's PRD manager
    this.targetDbPath = path.resolve(__dirname, 'data/workflow.db');
    this.targetDb = null;
  }

  async initialize() {
    console.log('🚀 Starting MCP Server to Unified Database Migration...\n');
    
    // Initialize target database connection
    this.targetDb = await open({
      filename: this.targetDbPath,
      driver: sqlite3.Database
    });
    
    await this.targetDb.exec('PRAGMA foreign_keys = ON');
    console.log('✅ Connected to target database:', this.targetDbPath);
  }

  async backupCurrentData() {
    console.log('\n📁 Backing up current workflow.db data...');
    
    const existingPrds = await this.targetDb.all('SELECT * FROM prds ORDER BY created_at');
    console.log(`📊 Current PRDs in workflow.db: ${existingPrds.length}`);
    
    existingPrds.forEach((prd, index) => {
      console.log(`   ${index + 1}. ${prd.id} - ${prd.title}`);
    });
    
    return existingPrds;
  }

  async getMCPServerData() {
    console.log('\n🔍 Extracting data from MCP Server...');
    
    // Get all PRDs from MCP server
    const mcpPrds = await this.sourceManager.listAllPRDs();
    console.log(`📊 PRDs in MCP Server: ${mcpPrds.length}`);
    
    mcpPrds.forEach((prd, index) => {
      console.log(`   ${index + 1}. ${prd.id} - ${prd.title} (${prd.status})`);
    });
    
    return mcpPrds;
  }

  async migrateData(mcpPrds, existingPrds) {
    console.log('\n🔄 Migrating PRD data...');
    
    // Create a set of existing IDs for quick lookup
    const existingIds = new Set(existingPrds.map(prd => prd.id));
    
    // Prepare insert statement
    const insertPrd = await this.targetDb.prepare(`
      INSERT INTO prds (
        id, title, description, status, priority, version,
        created_at, updated_at, created_by, last_modified_by,
        business_objective, target_users, success_criteria,
        epics, requirements, user_stories, technical_constraints,
        assumptions, risks, timeline, quality_gates, tags, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const mcpPrd of mcpPrds) {
      if (existingIds.has(mcpPrd.id)) {
        console.log(`   ⏭️  Skipping existing PRD: ${mcpPrd.id} - ${mcpPrd.title}`);
        skippedCount++;
        continue;
      }

      try {
        // Convert MCP PRD format to database format
        const dbPrd = this.convertMCPPrdToDbFormat(mcpPrd);
        
        await insertPrd.run(
          dbPrd.id, dbPrd.title, dbPrd.description, dbPrd.status, dbPrd.priority, 
          dbPrd.version, dbPrd.created_at, dbPrd.updated_at, dbPrd.created_by, 
          dbPrd.last_modified_by, dbPrd.business_objective, 
          JSON.stringify(dbPrd.target_users), JSON.stringify(dbPrd.success_criteria),
          JSON.stringify(dbPrd.epics), JSON.stringify(dbPrd.requirements), 
          JSON.stringify(dbPrd.user_stories), JSON.stringify(dbPrd.technical_constraints),
          JSON.stringify(dbPrd.assumptions), JSON.stringify(dbPrd.risks), 
          JSON.stringify(dbPrd.timeline), JSON.stringify(dbPrd.quality_gates),
          JSON.stringify(dbPrd.tags), JSON.stringify(dbPrd.attachments)
        );

        console.log(`   ✅ Migrated: ${mcpPrd.id} - ${mcpPrd.title}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate ${mcpPrd.id}: ${error.message}`);
        errorCount++;
      }
    }

    await insertPrd.finalize();
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    return { migratedCount, skippedCount, errorCount };
  }

  convertMCPPrdToDbFormat(mcpPrd) {
    // Map MCP PRD format to database schema format
    return {
      id: mcpPrd.id,
      title: mcpPrd.title || '',
      description: mcpPrd.description || '',
      status: this.mapStatus(mcpPrd.status),
      priority: this.mapPriority(mcpPrd.priority),
      version: mcpPrd.version || '1.0.0',
      created_at: mcpPrd.createdAt || new Date().toISOString(),
      updated_at: mcpPrd.updatedAt || new Date().toISOString(),
      created_by: mcpPrd.createdBy || 'system',
      last_modified_by: mcpPrd.lastModifiedBy || 'system',
      business_objective: mcpPrd.businessObjective || 'Business objective to be defined',
      target_users: mcpPrd.targetUsers || ['General users'],
      success_criteria: mcpPrd.successCriteria || ['Success criteria to be defined'],
      epics: mcpPrd.epics || [],
      requirements: mcpPrd.requirements || [],
      user_stories: mcpPrd.userStories || [],
      technical_constraints: mcpPrd.technicalConstraints || [],
      assumptions: mcpPrd.assumptions || [],
      risks: mcpPrd.risks || [],
      timeline: mcpPrd.timeline || { phases: [] },
      quality_gates: mcpPrd.qualityGates || [],
      tags: mcpPrd.tags || [],
      attachments: mcpPrd.attachments || []
    };
  }

  mapStatus(mcpStatus) {
    // Map MCP status to database status values
    const statusMap = {
      'draft': 'draft',
      'in_review': 'in_review', 
      'review': 'in_review',
      'approved': 'approved',
      'in_development': 'in_development',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    
    return statusMap[mcpStatus] || 'draft';
  }

  mapPriority(mcpPriority) {
    // Ensure priority is valid
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    return validPriorities.includes(mcpPriority) ? mcpPriority : 'Medium';
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    const finalCount = await this.targetDb.get('SELECT COUNT(*) as count FROM prds');
    console.log(`📊 Final PRD count in workflow.db: ${finalCount.count}`);
    
    const recentPrds = await this.targetDb.all(
      'SELECT id, title, status FROM prds ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log('📋 Recent PRDs in database:');
    recentPrds.forEach((prd, index) => {
      const shortId = prd.id.length > 8 ? prd.id.substring(0, 8) + '...' : prd.id;
      console.log(`   ${index + 1}. ${shortId} - ${prd.title} (${prd.status})`);
    });
  }

  async cleanup() {
    if (this.targetDb) {
      await this.targetDb.close();
      console.log('\n✅ Database connection closed');
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Step 1: Backup current data
      const existingPrds = await this.backupCurrentData();
      
      // Step 2: Get MCP server data
      const mcpPrds = await this.getMCPServerData();
      
      // Step 3: Migrate data
      const result = await this.migrateData(mcpPrds, existingPrds);
      
      // Step 4: Verify migration
      await this.verifyMigration();
      
      console.log('\n🎉 Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update MCP server to use unified database');
      console.log('2. Update SQLite MCP configuration'); 
      console.log('3. Test all systems with unified database');
      
      return result;
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new DatabaseMigration();
  migration.run().catch(console.error);
}

export { DatabaseMigration };