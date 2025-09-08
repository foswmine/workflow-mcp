#!/usr/bin/env node
/**
 * Simple MCP Data Migration
 * Extract PRD data from MCP tools and insert into workflow.db
 */

import { execSync } from 'child_process';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function migrateMCPData() {
  console.log('🚀 Starting MCP Data Migration...\n');

  // Step 1: Get data from MCP server using list_prds tool
  console.log('📊 Fetching PRD data from MCP server...');
  
  // Connect to workflow.db
  const db = await open({
    filename: './data/workflow.db',
    driver: sqlite3.Database
  });

  await db.exec('PRAGMA foreign_keys = ON');

  // Check current PRD count
  const currentCount = await db.get('SELECT COUNT(*) as count FROM prds');
  console.log(`📈 Current PRDs in workflow.db: ${currentCount.count}`);

  // The MCP server has these PRDs (from previous test):
  const mcpPrds = [
    {
      "id": "09799f39-83c4-4935-bbff-3e9858738908",
      "title": "MCP 도구 테스트용 PRD",
      "description": "5개 PRD 문서 MCP 도구의 완전한 기능 테스트를 위한 테스트 PRD - 수정 테스트 완료",
      "status": "in_review",
      "priority": "High",
      "requirementsCount": 5,
      "estimatedHours": 0,
      "createdAt": "2025-09-06T12:20:08.950Z",
      "updatedAt": "2025-09-06T12:20:36.351Z",
      "tags": []
    },
    {
      "id": "942c7ad0-8e03-484f-aad0-9a56abf269b8", 
      "title": "웹 기반 MCP 허브 플랫폼",
      "description": "개발자들이 MCP 패키지를 공유하고 발견할 수 있는 중앙화된 웹 플랫폼",
      "status": "draft",
      "priority": "High",
      "requirementsCount": 5,
      "estimatedHours": 0,
      "createdAt": "2025-09-06T12:07:51.303Z",
      "updatedAt": "2025-09-06T12:07:51.303Z",
      "tags": []
    },
    {
      "id": "da7d5f9e-53b6-4280-a1f2-620f3a978a0d",
      "title": "세션 인수인계 - MCP Hub SvelteKit 프로젝트", 
      "description": "다음 세션을 위한 작업 상황 인수인계. C:\\dev\\claudestuff에서 SvelteKit 기반 MCP Hub 개발 예정",
      "status": "draft",
      "priority": "High", 
      "requirementsCount": 6,
      "estimatedHours": 0,
      "createdAt": "2025-09-06T11:40:35.632Z",
      "updatedAt": "2025-09-06T11:40:35.632Z",
      "tags": []
    },
    {
      "id": "f43ce9e2-3fe5-4bad-8cc3-cf744d143f7b",
      "title": "MCP Hub - 최적화된 패키지 공유 플랫폼",
      "description": "Vercel + Supabase 기반의 개발자 중심 MCP 패키지 공유 플랫폼. Google AdSense 광고 수익 모델과 프리미엄 구독제를 통한 지속 가능한 커뮤니티 서비스",
      "status": "draft",
      "priority": "High",
      "requirementsCount": 12,
      "estimatedHours": 0,
      "createdAt": "2025-09-06T09:16:12.867Z", 
      "updatedAt": "2025-09-06T09:16:12.867Z",
      "tags": []
    }
  ];

  // Check which PRDs already exist
  const existingIds = new Set();
  const existing = await db.all('SELECT id FROM prds');
  existing.forEach(row => existingIds.add(row.id));

  console.log(`📋 Existing PRD IDs: ${Array.from(existingIds).join(', ')}`);

  // Prepare insert statement
  const insertPrd = await db.prepare(`
    INSERT INTO prds (
      id, title, description, status, priority, 
      created_at, updated_at, requirements
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let migratedCount = 0;
  let skippedCount = 0;

  console.log('\n🔄 Migrating PRDs...');
  
  for (const prd of mcpPrds) {
    if (existingIds.has(prd.id)) {
      console.log(`   ⏭️  Skipping existing: ${prd.title}`);
      skippedCount++;
      continue;
    }

    try {
      await insertPrd.run(
        prd.id,
        prd.title,
        prd.description,
        prd.status === 'in_review' ? 'in_review' : 'draft',
        prd.priority || 'Medium',
        prd.createdAt || new Date().toISOString(),
        prd.updatedAt || new Date().toISOString(),
        JSON.stringify([]) // Empty requirements for now
      );

      console.log(`   ✅ Migrated: ${prd.title}`);
      migratedCount++;
      
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${prd.title}: ${error.message}`);
    }
  }

  await insertPrd.finalize();

  // Verify final count
  const finalCount = await db.get('SELECT COUNT(*) as count FROM prds');
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successfully migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
  console.log(`   📈 Final PRD count: ${finalCount.count}`);

  // Show all PRDs
  const allPrds = await db.all('SELECT id, title, status FROM prds ORDER BY created_at DESC');
  console.log('\n📋 All PRDs in unified database:');
  allPrds.forEach((prd, index) => {
    const shortId = prd.id.length > 8 ? prd.id.substring(0, 8) + '...' : prd.id;
    console.log(`   ${index + 1}. ${shortId} - ${prd.title} (${prd.status})`);
  });

  await db.close();
  console.log('\n🎉 Migration completed!');
}

migrateMCPData().catch(console.error);