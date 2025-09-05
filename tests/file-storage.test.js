/**
 * FileStorage 테스트
 * 파일 기반 저장소의 기본 기능 테스트
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { FileStorage } from '../src/utils/FileStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileStorage', () => {
  let storage;
  let testDataDir;

  beforeEach(async () => {
    testDataDir = path.join(__dirname, '../data/test-storage');
    storage = new FileStorage('test-storage');
    await storage.initialize();
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // 디렉토리가 없는 경우 무시
    }
  });

  describe('initialize', () => {
    it('should create data directory and index file', async () => {
      const newStorage = new FileStorage('test-init');
      await newStorage.initialize();

      const dataDir = path.join(__dirname, '../data/test-init');
      const indexFile = path.join(dataDir, 'index.json');

      // 디렉토리와 인덱스 파일 존재 확인
      await assert.doesNotReject(fs.access(dataDir));
      await assert.doesNotReject(fs.access(indexFile));

      // 정리
      await fs.rm(dataDir, { recursive: true, force: true });
    });
  });

  describe('save and load', () => {
    it('should save and load data correctly', async () => {
      const testData = {
        id: 'test-1',
        title: 'Test Data',
        description: 'This is test data',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 데이터 저장
      await storage.save('test-1', testData);

      // 데이터 로드
      const loadedData = await storage.load('test-1');

      assert.strictEqual(loadedData.id, 'test-1');
      assert.strictEqual(loadedData.title, 'Test Data');
      assert.strictEqual(loadedData.description, 'This is test data');
    });

    it('should return null for non-existent data', async () => {
      const result = await storage.load('non-existent');
      assert.strictEqual(result, null);
    });

    it('should update index when saving data', async () => {
      const testData = {
        id: 'index-test',
        title: 'Index Test',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage.save('index-test', testData);

      const index = await storage.loadIndex();
      assert.ok(index.items['index-test']);
      assert.strictEqual(index.items['index-test'].title, 'Index Test');
      assert.strictEqual(index.items['index-test'].status, 'active');
    });
  });

  describe('listAll', () => {
    it('should return empty array when no data exists', async () => {
      const result = await storage.listAll();
      assert.strictEqual(Array.isArray(result), true);
      assert.strictEqual(result.length, 0);
    });

    it('should list all saved data', async () => {
      const testData1 = {
        id: 'list-test-1',
        title: 'First Item',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      const testData2 = {
        id: 'list-test-2',
        title: 'Second Item',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      };

      await storage.save('list-test-1', testData1);
      await storage.save('list-test-2', testData2);

      const result = await storage.listAll();

      assert.strictEqual(result.length, 2);
      // 생성일시 역순 정렬 확인 (최신이 먼저)
      assert.strictEqual(result[0].id, 'list-test-2');
      assert.strictEqual(result[1].id, 'list-test-1');
    });
  });

  describe('delete', () => {
    it('should delete data and remove from index', async () => {
      const testData = {
        id: 'delete-test',
        title: 'Delete Test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 데이터 저장
      await storage.save('delete-test', testData);

      // 존재 확인
      let loadedData = await storage.load('delete-test');
      assert.ok(loadedData);

      // 삭제
      await storage.delete('delete-test');

      // 삭제 확인
      loadedData = await storage.load('delete-test');
      assert.strictEqual(loadedData, null);

      // 인덱스에서도 제거되었는지 확인
      const index = await storage.loadIndex();
      assert.strictEqual(index.items['delete-test'], undefined);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const testData = [
        {
          id: 'search-1',
          title: 'User Authentication System',
          description: 'Login and registration functionality',
          createdAt: new Date()
        },
        {
          id: 'search-2',
          title: 'Payment Processing',
          description: 'Credit card and PayPal integration',
          createdAt: new Date()
        },
        {
          id: 'search-3',
          title: 'User Dashboard',
          description: 'Dashboard for user account management',
          createdAt: new Date()
        }
      ];

      for (const data of testData) {
        await storage.save(data.id, data);
      }
    });

    it('should search by title', async () => {
      const results = await storage.search('user', ['title']);
      assert.strictEqual(results.length, 2);
      assert.ok(results.some(r => r.id === 'search-1'));
      assert.ok(results.some(r => r.id === 'search-3'));
    });

    it('should search by description', async () => {
      const results = await storage.search('paypal', ['description']);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'search-2');
    });

    it('should search in multiple fields', async () => {
      const results = await storage.search('user', ['title', 'description']);
      assert.strictEqual(results.length, 2);
    });
  });

  describe('filter', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const testData = [
        {
          id: 'filter-1',
          title: 'High Priority Task',
          priority: 'high',
          status: 'active',
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'filter-2',
          title: 'Low Priority Task',
          priority: 'low',
          status: 'completed',
          createdAt: new Date('2024-01-02')
        },
        {
          id: 'filter-3',
          title: 'Medium Priority Task',
          priority: 'medium',
          status: 'active',
          createdAt: new Date('2024-01-03')
        }
      ];

      for (const data of testData) {
        await storage.save(data.id, data);
      }
    });

    it('should filter by single field', async () => {
      const results = await storage.filter({ priority: 'high' });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'filter-1');
    });

    it('should filter by multiple fields', async () => {
      const results = await storage.filter({ status: 'active', priority: 'medium' });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'filter-3');
    });

    it('should filter by array values', async () => {
      const results = await storage.filter({ priority: ['high', 'low'] });
      assert.strictEqual(results.length, 2);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      // 테스트 데이터 생성
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const testData = [
        {
          id: 'stats-1',
          title: 'Today Item',
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'stats-2',
          title: 'Yesterday Item',
          createdAt: yesterday,
          updatedAt: yesterday
        }
      ];

      for (const data of testData) {
        await storage.save(data.id, data);
      }

      const stats = await storage.getStatistics();

      assert.strictEqual(stats.totalItems, 2);
      assert.strictEqual(stats.createdToday, 1);
      assert.ok(stats.lastUpdated);
    });
  });

  describe('createBackup', () => {
    it('should create backup file', async () => {
      // 테스트 데이터 저장
      const testData = {
        id: 'backup-test',
        title: 'Backup Test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage.save('backup-test', testData);

      // 백업 생성
      const backupFile = await storage.createBackup();

      // 백업 파일 존재 확인
      await assert.doesNotReject(fs.access(backupFile));

      // 백업 파일 내용 확인
      const backupContent = JSON.parse(await fs.readFile(backupFile, 'utf8'));
      assert.strictEqual(backupContent.type, storage.dataType);
      assert.strictEqual(backupContent.items.length, 1);
      assert.strictEqual(backupContent.items[0].id, 'backup-test');

      // 백업 파일 정리
      await fs.unlink(backupFile);
    });
  });
});