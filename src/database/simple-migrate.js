#!/usr/bin/env node

/**
 * Simple Document Management System Migration
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

async function simpleMigrate() {
    console.log('🚀 Simple Document Management Migration...');
    
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database not found:', DB_PATH);
        process.exit(1);
    }

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
    
    try {
        await db.exec('PRAGMA foreign_keys = ON');
        
        console.log('🔧 Creating documents table...');
        
        // Create documents table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                doc_type TEXT NOT NULL,
                category TEXT,
                file_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                version INTEGER DEFAULT 1,
                created_by TEXT,
                tags TEXT,
                summary TEXT,
                status TEXT DEFAULT 'draft'
            )
        `);
        
        console.log('🔧 Creating document_links table...');
        
        // Create document_links table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS document_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                linked_entity_type TEXT NOT NULL,
                linked_entity_id TEXT NOT NULL,
                link_type TEXT DEFAULT 'notes',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        `);
        
        console.log('📊 Verifying tables...');
        
        const tables = await db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE '%document%'
        `);
        
        console.log('📋 Created tables:');
        tables.forEach(table => {
            console.log(`  ✅ ${table.name}`);
        });
        
        console.log('📁 Importing test documents...');
        
        // Import documents
        const testGuidePath = path.resolve(__dirname, '../../docs/PHASE_2.6_TEST_GUIDE.md');
        if (fs.existsSync(testGuidePath)) {
            const content = fs.readFileSync(testGuidePath, 'utf8');
            
            const result = await db.run(`
                INSERT INTO documents (title, content, doc_type, category, file_path, tags, summary, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Phase 2.6 SvelteKit Dashboard 테스트 가이드',
                content,
                'test_guide',
                'phase_2.6',
                testGuidePath,
                JSON.stringify(['testing', 'sveltekit', 'phase_2.6', 'dashboard']),
                'SvelteKit 웹 대시보드의 모든 기능을 검증하고 SQLite 데이터베이스와의 연동 테스트',
                'approved',
                'migration'
            ]);
            
            console.log(`✅ Imported test guide (ID: ${result.lastID})`);
        }
        
        // Import test results
        const testResultsPath = path.resolve(__dirname, '../../docs/PHASE_2.6_TEST_RESULTS.md');
        if (fs.existsSync(testResultsPath)) {
            const content = fs.readFileSync(testResultsPath, 'utf8');
            
            const result = await db.run(`
                INSERT INTO documents (title, content, doc_type, category, file_path, tags, summary, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Phase 2.6 SvelteKit Dashboard 테스트 결과 보고서',
                content,
                'test_results',
                'phase_2.6',
                testResultsPath,
                JSON.stringify(['testing', 'results', 'phase_2.6', 'sveltekit']),
                '통과율 85.7%로 핵심 기능이 모두 정상 작동하는 것을 확인',
                'approved',
                'migration'
            ]);
            
            console.log(`✅ Imported test results (ID: ${result.lastID})`);
        }
        
        // Import checklist
        const checklistPath = path.resolve(__dirname, '../../docs/QUICK_TEST_CHECKLIST.md');
        if (fs.existsSync(checklistPath)) {
            const content = fs.readFileSync(checklistPath, 'utf8');
            
            const result = await db.run(`
                INSERT INTO documents (title, content, doc_type, category, file_path, tags, summary, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Phase 2.6 빠른 테스트 체크리스트',
                content,
                'checklist',
                'phase_2.6',
                checklistPath,
                JSON.stringify(['testing', 'checklist', 'quick_test']),
                '5분 내 핵심 기능 확인을 위한 10개 체크포인트',
                'approved',
                'migration'
            ]);
            
            console.log(`✅ Imported checklist (ID: ${result.lastID})`);
        }
        
        // Show final count
        const count = await db.get('SELECT COUNT(*) as total FROM documents');
        console.log(`📊 Total documents: ${count.total}`);
        
        console.log('🎉 Document management system ready!');
        
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return false;
    } finally {
        await db.close();
    }
}

simpleMigrate().catch(console.error);
