/**
 * File Storage - 파일 기반 데이터 저장소
 * JSON 파일을 사용하여 PRD, Task, Plan 데이터를 관리
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileStorage {
  constructor(dataType) {
    this.dataType = dataType;
    this.dataDir = path.join(__dirname, '../../data', dataType);
    this.indexFile = path.join(this.dataDir, 'index.json');
  }

  /**
   * 저장소 초기화 - 디렉토리 및 인덱스 파일 생성
   */
  async initialize() {
    try {
      // 데이터 디렉토리 생성
      await fs.mkdir(this.dataDir, { recursive: true });

      // 인덱스 파일이 없으면 생성
      try {
        await fs.access(this.indexFile);
      } catch (error) {
        await fs.writeFile(this.indexFile, JSON.stringify({ items: {}, lastUpdated: new Date().toISOString() }, null, 2));
      }

      console.log(`FileStorage initialized for ${this.dataType} at ${this.dataDir}`);
    } catch (error) {
      throw new Error(`Failed to initialize storage for ${this.dataType}: ${error.message}`);
    }
  }

  /**
   * 데이터 저장
   * @param {string} id - 데이터 ID
   * @param {Object} data - 저장할 데이터
   */
  async save(id, data) {
    try {
      // 개별 데이터 파일 저장
      const filePath = path.join(this.dataDir, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

      // 인덱스 업데이트
      await this.updateIndex(id, data);

      console.log(`Data saved: ${this.dataType}/${id}`);
    } catch (error) {
      throw new Error(`Failed to save ${this.dataType} ${id}: ${error.message}`);
    }
  }

  /**
   * 데이터 로드
   * @param {string} id - 데이터 ID
   * @returns {Object} 로드된 데이터
   */
  async load(id) {
    try {
      const filePath = path.join(this.dataDir, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 파일이 존재하지 않음
      }
      throw new Error(`Failed to load ${this.dataType} ${id}: ${error.message}`);
    }
  }

  /**
   * 모든 데이터 목록 조회
   * @returns {Array} 데이터 목록
   */
  async listAll() {
    try {
      const indexData = await this.loadIndex();
      const items = [];

      for (const [id, metadata] of Object.entries(indexData.items)) {
        try {
          const data = await this.load(id);
          if (data) {
            items.push(data);
          }
        } catch (error) {
          console.warn(`Failed to load ${this.dataType} ${id}: ${error.message}`);
          // 인덱스에서 제거
          await this.removeFromIndex(id);
        }
      }

      // 생성일시 기준 정렬
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return items;
    } catch (error) {
      throw new Error(`Failed to list ${this.dataType}: ${error.message}`);
    }
  }

  /**
   * 데이터 삭제
   * @param {string} id - 데이터 ID
   */
  async delete(id) {
    try {
      const filePath = path.join(this.dataDir, `${id}.json`);
      
      // 파일 삭제
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // 인덱스에서 제거
      await this.removeFromIndex(id);

      console.log(`Data deleted: ${this.dataType}/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete ${this.dataType} ${id}: ${error.message}`);
    }
  }

  /**
   * 검색 기능
   * @param {string} query - 검색 쿼리
   * @param {Array} fields - 검색할 필드 목록
   * @returns {Array} 검색 결과
   */
  async search(query, fields = ['title', 'description']) {
    try {
      const allItems = await this.listAll();
      const searchTerm = query.toLowerCase();

      return allItems.filter(item => {
        return fields.some(field => {
          const value = this.getNestedValue(item, field);
          return value && value.toLowerCase().includes(searchTerm);
        });
      });
    } catch (error) {
      throw new Error(`Failed to search ${this.dataType}: ${error.message}`);
    }
  }

  /**
   * 필터링 기능
   * @param {Object} filters - 필터 조건
   * @returns {Array} 필터링된 결과
   */
  async filter(filters) {
    try {
      const allItems = await this.listAll();

      return allItems.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          const itemValue = this.getNestedValue(item, key);
          
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          } else if (typeof value === 'object' && value !== null) {
            // 날짜 범위 등 복합 조건 처리
            if (value.min !== undefined || value.max !== undefined) {
              const numValue = typeof itemValue === 'string' ? new Date(itemValue) : itemValue;
              if (value.min !== undefined && numValue < value.min) return false;
              if (value.max !== undefined && numValue > value.max) return false;
              return true;
            }
          }
          
          return itemValue === value;
        });
      });
    } catch (error) {
      throw new Error(`Failed to filter ${this.dataType}: ${error.message}`);
    }
  }

  /**
   * 통계 정보 조회
   * @returns {Object} 통계 데이터
   */
  async getStatistics() {
    try {
      const allItems = await this.listAll();
      const indexData = await this.loadIndex();

      return {
        totalItems: allItems.length,
        lastUpdated: indexData.lastUpdated,
        createdToday: allItems.filter(item => {
          const today = new Date().toDateString();
          return new Date(item.createdAt).toDateString() === today;
        }).length,
        updatedToday: allItems.filter(item => {
          const today = new Date().toDateString();
          return new Date(item.updatedAt).toDateString() === today;
        }).length
      };
    } catch (error) {
      throw new Error(`Failed to get statistics for ${this.dataType}: ${error.message}`);
    }
  }

  // 내부 헬퍼 메서드들

  /**
   * 인덱스 파일 로드
   */
  async loadIndex() {
    try {
      const data = await fs.readFile(this.indexFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { items: {}, lastUpdated: new Date().toISOString() };
    }
  }

  /**
   * 인덱스 파일 업데이트
   */
  async updateIndex(id, data) {
    try {
      const index = await this.loadIndex();
      
      index.items[id] = {
        id: id,
        title: data.title || data.name || 'Untitled',
        status: data.status || 'unknown',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
        type: this.dataType
      };
      
      index.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
    } catch (error) {
      console.warn(`Failed to update index for ${id}: ${error.message}`);
    }
  }

  /**
   * 인덱스에서 항목 제거
   */
  async removeFromIndex(id) {
    try {
      const index = await this.loadIndex();
      delete index.items[id];
      index.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
    } catch (error) {
      console.warn(`Failed to remove ${id} from index: ${error.message}`);
    }
  }

  /**
   * 중첩된 객체에서 값 가져오기
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * 백업 생성
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(__dirname, '../../backups', this.dataType);
      await fs.mkdir(backupDir, { recursive: true });

      const allItems = await this.listAll();
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      
      await fs.writeFile(backupFile, JSON.stringify({
        type: this.dataType,
        timestamp: timestamp,
        items: allItems
      }, null, 2));

      return backupFile;
    } catch (error) {
      throw new Error(`Failed to create backup for ${this.dataType}: ${error.message}`);
    }
  }
}