#!/usr/bin/env node

/**
 * Document Management System Migration
 * Adds document tables to existing WorkflowMCP SQLite database
 * Usage: node migrate-documents.js
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.resolve(__dirname, '../../data/workflow.db');
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

async function migrateDocuments() {
    console.log('🚀 Starting Document Management System Migration...');
    
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database not found:', DB_PATH);
        process.exit(1);
    }

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
    
    try {
        // Enable foreign keys
        await db.exec('PRAGMA foreign_keys = ON');
        
        console.log('📋 Reading schema file...');
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        
        // Extract document-related DDL from schema
        const documentSchemaStart = schema.indexOf('-- Document Management System');
        const documentSchema = schema.substring(documentSchemaStart);
        
        // Split into individual statements
        const statements = documentSchema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--'));

        console.log('🔧 Creating document management tables...');
        
        // Execute each statement
        for (const [index, stmt] of statements.entries()) {
            try {
                if (stmt.trim()) {
                    await db.exec(stmt + ';');
                    console.log(`✅ Statement ${index + 1} executed successfully`);
                }
            } catch (error) {
                console.warn(`⚠️  Statement ${index + 1} skipped (might already exist):`, error.message);
            }
        }
        
        console.log('📊 Verifying table creation...');
        
        // Check if tables were created
        const tables = await db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE '%document%'
        `);
        
        console.log('📋 Document tables created:');
        tables.forEach(table => {
            console.log(`  ✅ ${table.name}`);
        });
        
        // Check if FTS table exists
        const ftsCheck = await db.get(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='documents_fts'
        `);
        
        if (ftsCheck) {
            console.log('🔍 Full-text search index created successfully');
        }
        
        console.log('🎉 Document Management System migration completed successfully!');
        
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    } finally {
        db.close();
    }
}

// Import existing test documents
async function importExistingDocs() {
    console.log('📁 Importing existing test documents...');
    
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
    
    try {
        const insertDoc = await db.prepare(`
            INSERT INTO documents (title, content, doc_type, category, file_path, tags, summary, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Import Phase 2.6 test guide
        const testGuidePath = path.resolve(__dirname, '../../docs/PHASE_2.6_TEST_GUIDE.md');
        if (fs.existsSync(testGuidePath)) {
            const testGuideContent = fs.readFileSync(testGuidePath, 'utf8');
            await insertDoc.run(
                'Phase 2.6 SvelteKit Dashboard 테스트 가이드',
                testGuideContent,
                'test_guide',
                'phase_2.6',
                testGuidePath,
                JSON.stringify(['testing', 'sveltekit', 'phase_2.6', 'dashboard']),
                'SvelteKit 웹 대시보드의 모든 기능을 검증하고 SQLite 데이터베이스와의 연동 테스트',
                'approved'
            );
            console.log('✅ Imported: Phase 2.6 Test Guide');
        }
        
        // Import test results
        const testResultsPath = path.resolve(__dirname, '../../docs/PHASE_2.6_TEST_RESULTS.md');
        if (fs.existsSync(testResultsPath)) {
            const testResultsContent = fs.readFileSync(testResultsPath, 'utf8');
            await insertDoc.run(
                'Phase 2.6 SvelteKit Dashboard 테스트 결과 보고서',
                testResultsContent,
                'test_results',
                'phase_2.6',
                testResultsPath,
                JSON.stringify(['testing', 'results', 'phase_2.6', 'sveltekit']),
                '통과율 85.7%로 핵심 기능이 모두 정상 작동하는 것을 확인',
                'approved'
            );
            console.log('✅ Imported: Phase 2.6 Test Results');
        }
        
        // Import quick checklist
        const checklistPath = path.resolve(__dirname, '../../docs/QUICK_TEST_CHECKLIST.md');
        if (fs.existsSync(checklistPath)) {
            const checklistContent = fs.readFileSync(checklistPath, 'utf8');
            await insertDoc.run(
                'Phase 2.6 빠른 테스트 체크리스트',
                checklistContent,
                'checklist',
                'phase_2.6',
                checklistPath,
                JSON.stringify(['testing', 'checklist', 'quick_test']),
                '5분 내 핵심 기능 확인을 위한 10개 체크포인트',
                'approved'
            );
            console.log('✅ Imported: Quick Test Checklist');
        }
        
        // Show import results
        const docCount = await db.get('SELECT COUNT(*) as count FROM documents');
        console.log(`📊 Total documents in database: ${docCount.count}`);
        
        return true;
    } catch (error) {
        console.error('❌ Document import failed:', error);
        return false;
    } finally {
        db.close();
    }
}

// Main execution
async function main() {
    const migrationSuccess = await migrateDocuments();
    if (migrationSuccess) {
        await importExistingDocs();
        console.log('\n🎯 Next steps:');
        console.log('1. Update sqlite-server.js to include document management tools');
        console.log('2. Add document management UI to SvelteKit dashboard');
        console.log('3. Test document CRUD operations');
    }
}

main().catch(console.error);