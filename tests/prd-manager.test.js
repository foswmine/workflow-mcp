/**
 * PRD Manager 테스트
 * Node.js 내장 테스트 프레임워크 사용
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { PRDManager } from '../src/models/PRDManager.js';
import { FileStorage } from '../src/utils/FileStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PRDManager', () => {
  let prdManager;
  let testDataDir;

  beforeEach(async () => {
    // 테스트용 데이터 디렉토리 생성
    testDataDir = path.join(__dirname, '../data/test-prds');
    prdManager = new PRDManager();
    prdManager.storage = new FileStorage('test-prds');
    await prdManager.initializeStorage();
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // 디렉토리가 없는 경우 무시
    }
  });

  describe('createPRD', () => {
    it('should create a PRD with basic information', async () => {
      const prdData = {
        title: 'Test PRD',
        description: 'This is a test PRD for unit testing',
        requirements: [
          'User should be able to login',
          'System should validate user credentials'
        ],
        priority: 'High'
      };

      const result = await prdManager.createPRD(prdData);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.prd.title, 'Test PRD');
      assert.strictEqual(result.prd.description, 'This is a test PRD for unit testing');
      assert.strictEqual(result.prd.requirements.length, 2);
      assert.strictEqual(result.prd.status, 'draft');
      assert.ok(result.prd.id);
      assert.ok(result.prd.createdAt);
    });

    it('should create structured requirements from string array', async () => {
      const prdData = {
        title: 'Requirements Test PRD',
        description: 'Testing requirement conversion',
        requirements: [
          'User authentication system',
          'Data validation module'
        ]
      };

      const result = await prdManager.createPRD(prdData);
      const requirements = result.prd.requirements;

      assert.strictEqual(requirements.length, 2);
      assert.ok(requirements[0].id);
      assert.strictEqual(requirements[0].type, 'functional');
      assert.strictEqual(requirements[0].moscow, 'Must');
      assert.ok(Array.isArray(requirements[0].acceptanceCriteria));
    });

    it('should handle structured requirement objects', async () => {
      const prdData = {
        title: 'Structured Requirements PRD',
        description: 'Testing structured requirements',
        requirements: [{
          title: 'Authentication System',
          description: 'Complete user authentication with JWT',
          type: 'technical',
          priority: 'High',
          acceptanceCriteria: [
            'Users can login with email/password',
            'JWT tokens are generated on successful login'
          ]
        }]
      };

      const result = await prdManager.createPRD(prdData);
      const requirement = result.prd.requirements[0];

      assert.strictEqual(requirement.title, 'Authentication System');
      assert.strictEqual(requirement.type, 'technical');
      assert.strictEqual(requirement.priority, 'High');
      assert.strictEqual(requirement.acceptanceCriteria.length, 2);
    });

    it('should validate PRD data', async () => {
      const invalidData = {
        title: '', // 빈 제목 - 유효하지 않음
        description: 'Test description'
      };

      try {
        await prdManager.createPRD(invalidData);
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert.ok(error.message.includes('유효성 검사 실패'));
      }
    });
  });

  describe('listPRDs', () => {
    it('should return empty list when no PRDs exist', async () => {
      const result = await prdManager.listPRDs();
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.prds.length, 0);
      assert.strictEqual(result.total, 0);
    });

    it('should list existing PRDs with summary information', async () => {
      // 테스트 PRD 생성
      const prdData = {
        title: 'Test List PRD',
        description: 'Testing PRD listing functionality',
        requirements: ['Requirement 1', 'Requirement 2']
      };

      await prdManager.createPRD(prdData);
      
      const result = await prdManager.listPRDs();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.prds.length, 1);
      assert.strictEqual(result.prds[0].title, 'Test List PRD');
      assert.strictEqual(result.prds[0].requirementsCount, 2);
      assert.ok(result.prds[0].id);
      assert.ok(result.prds[0].createdAt);
    });

    it('should filter PRDs by status', async () => {
      // 다른 상태의 PRD들 생성
      const draftPRD = {
        title: 'Draft PRD',
        description: 'Draft status PRD',
        requirements: ['Draft requirement']
      };

      const result1 = await prdManager.createPRD(draftPRD);
      
      // PRD 상태를 approved로 변경
      await prdManager.updatePRD(result1.prd.id, { status: 'approved' });

      const allPRDs = await prdManager.listPRDs();
      const approvedPRDs = await prdManager.listPRDs('approved');

      assert.strictEqual(allPRDs.prds.length, 1);
      assert.strictEqual(approvedPRDs.prds.length, 1);
      assert.strictEqual(approvedPRDs.prds[0].status, 'approved');
    });
  });

  describe('getPRD', () => {
    it('should retrieve PRD by ID', async () => {
      const prdData = {
        title: 'Get Test PRD',
        description: 'Testing PRD retrieval',
        requirements: ['Test requirement']
      };

      const createResult = await prdManager.createPRD(prdData);
      const prdId = createResult.prd.id;

      const getResult = await prdManager.getPRD(prdId);

      assert.strictEqual(getResult.success, true);
      assert.strictEqual(getResult.prd.id, prdId);
      assert.strictEqual(getResult.prd.title, 'Get Test PRD');
      assert.ok(getResult.analytics);
      assert.strictEqual(getResult.analytics.totalRequirements, 1);
    });

    it('should throw error for non-existent PRD', async () => {
      const fakeId = 'non-existent-id';

      try {
        await prdManager.getPRD(fakeId);
        assert.fail('Should have thrown error for non-existent PRD');
      } catch (error) {
        assert.ok(error.message.includes('PRD를 찾을 수 없습니다'));
      }
    });
  });

  describe('updatePRD', () => {
    it('should update PRD with new information', async () => {
      const prdData = {
        title: 'Original Title',
        description: 'Original description',
        requirements: ['Original requirement']
      };

      const createResult = await prdManager.createPRD(prdData);
      const prdId = createResult.prd.id;

      const updates = {
        title: 'Updated Title',
        description: 'Updated description with sufficient length'
      };

      const updateResult = await prdManager.updatePRD(prdId, updates);

      assert.strictEqual(updateResult.success, true);
      assert.strictEqual(updateResult.prd.title, 'Updated Title');
      assert.strictEqual(updateResult.prd.description, 'Updated description with sufficient length');
      assert.notEqual(updateResult.prd.updatedAt, updateResult.prd.createdAt);
    });

    it('should increment version on significant changes', async () => {
      const prdData = {
        title: 'Version Test PRD',
        description: 'Testing version management',
        requirements: ['Test requirement']
      };

      const createResult = await prdManager.createPRD(prdData);
      const prdId = createResult.prd.id;
      const originalVersion = createResult.prd.version; // "1.0.0"

      const updates = {
        title: 'New Title' // 제목 변경은 버전 증가 트리거
      };

      const updateResult = await prdManager.updatePRD(prdId, updates);

      assert.notEqual(updateResult.prd.version, originalVersion);
    });
  });

  describe('addRequirement', () => {
    it('should add new requirement to existing PRD', async () => {
      const prdData = {
        title: 'Add Requirement Test PRD',
        description: 'Testing requirement addition',
        requirements: ['Initial requirement']
      };

      const createResult = await prdManager.createPRD(prdData);
      const prdId = createResult.prd.id;

      const newRequirement = {
        title: 'New Requirement',
        description: 'This is a new requirement',
        type: 'functional',
        priority: 'Medium',
        moscow: 'Should',
        acceptanceCriteria: ['Acceptance criterion 1 should be met']
      };

      const addResult = await prdManager.addRequirement(prdId, newRequirement);

      assert.strictEqual(addResult.success, true);
      assert.strictEqual(addResult.requirement.title, 'New Requirement');
      assert.ok(addResult.requirement.id);

      // PRD에서 요구사항 확인
      const getResult = await prdManager.getPRD(prdId);
      assert.strictEqual(getResult.prd.requirements.length, 2);
    });
  });

  describe('utility methods', () => {
    it('should calculate overall priority correctly', async () => {
      const prdData = {
        title: 'Priority Test PRD',
        description: 'Testing priority calculation',
        requirements: [
          { title: 'High req', description: 'High priority', type: 'functional', priority: 'High', moscow: 'Must', acceptanceCriteria: ['test acceptance criteria'] },
          { title: 'Low req', description: 'Low priority', type: 'functional', priority: 'Low', moscow: 'Could', acceptanceCriteria: ['test acceptance criteria'] }
        ]
      };

      const result = await prdManager.createPRD(prdData);
      const priority = prdManager.calculateOverallPriority(result.prd);

      assert.strictEqual(priority, 'High');
    });

    it('should calculate total hours correctly', async () => {
      const prdData = {
        title: 'Hours Test PRD',
        description: 'Testing hours calculation',
        requirements: [
          { title: 'Req 1', description: 'First requirement', type: 'functional', priority: 'High', moscow: 'Must', acceptanceCriteria: ['test acceptance criteria'], estimatedHours: 5 },
          { title: 'Req 2', description: 'Second requirement', type: 'functional', priority: 'Medium', moscow: 'Should', acceptanceCriteria: ['test acceptance criteria'], estimatedHours: 3 }
        ]
      };

      const result = await prdManager.createPRD(prdData);
      const totalHours = prdManager.calculateTotalHours(result.prd);

      assert.strictEqual(totalHours, 8);
    });
  });
});