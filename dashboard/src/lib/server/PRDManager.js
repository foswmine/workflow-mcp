/**
 * PRD Manager - Product Requirements Document 관리 클래스
 * PRD의 생성, 조회, 수정, 삭제 및 비즈니스 로직 처리
 */

import { v4 as uuidv4 } from 'uuid';
// 대시보드 중심 접근: 복잡한 스키마 검증 제거
import { SQLitePRDStorage } from './SQLitePRDStorage.js';

// 상수 정의
const PriorityLevels = {
  HIGH: 'high',
  MEDIUM: 'medium', 
  LOW: 'low'
};

const MoscowPriority = {
  MUST: 'must',
  SHOULD: 'should',
  COULD: 'could',
  WONT: 'wont'
};

const PRDStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  REVIEW: 'review', 
  APPROVED: 'approved',
  COMPLETED: 'completed'
};

export class PRDManager {
  constructor() {
    this.storage = new SQLitePRDStorage();
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  /**
   * 새로운 PRD 생성
   * @param {Object} prdData - PRD 기본 데이터
   * @returns {Object} 생성된 PRD 객체
   */
  async createPRD(prdData) {
    await this.ensureInitialized();
    try {
      // 기본 PRD 구조 생성
      const prd = {
        id: uuidv4(),
        title: prdData.title,
        description: prdData.description,
        version: '1.0.0',
        status: prdData.status || PRDStatus.ACTIVE,
        priority: prdData.priority || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: prdData.createdBy || 'system',
        lastModifiedBy: prdData.createdBy || 'system',
        businessObjective: prdData.businessObjective || 'Business objective to be defined',
        targetUsers: prdData.targetUsers || ['General users'],
        successCriteria: prdData.successCriteria || ['Success criteria to be defined'],
        epics: [],
        requirements: [],
        acceptance_criteria: [],
        userStories: [],
        technicalConstraints: prdData.technicalConstraints || [],
        assumptions: prdData.assumptions || [],
        risks: [],
        timeline: {},
        qualityGates: [],
        tags: prdData.tags || [],
        attachments: []
      };

      // 요구사항 처리
      if (prdData.requirements && Array.isArray(prdData.requirements)) {
        prd.requirements = prdData.requirements.map(req => {
          if (typeof req === 'string') {
            // 문자열 요구사항을 객체로 변환
            return {
              id: uuidv4(),
              title: req.substring(0, 100),
              description: req,
              type: 'functional',
              priority: prdData.priority || 'medium',
              moscow: 'must',
              acceptanceCriteria: [`${req} 기능이 정상적으로 동작해야 함`],
              dependencies: [],
              estimatedHours: 0,
              tags: []
            };
          } else {
            // 이미 구조화된 요구사항
            return {
              id: req.id || uuidv4(),
              title: req.title,
              description: req.description,
              type: req.type || 'functional',
              priority: req.priority || 'medium',
              moscow: req.moscow || 'must',
              acceptanceCriteria: req.acceptanceCriteria || [],
              dependencies: req.dependencies || [],
              estimatedHours: req.estimatedHours || 0,
              tags: req.tags || []
            };
          }
        });
      }

      // 인수조건 처리
      if (prdData.acceptance_criteria && Array.isArray(prdData.acceptance_criteria)) {
        prd.acceptance_criteria = prdData.acceptance_criteria;
      }

      // 간단한 기본 검증
      if (!prd.title || prd.title.trim().length === 0) {
        throw new Error('제목은 필수입니다');
      }

      // PRD 저장
      await this.storage.savePRD(prd);

      return {
        success: true,
        prd: prd,
        message: `PRD "${prd.title}" 생성 완료`
      };

    } catch (error) {
      throw new Error(`PRD 생성 실패: ${error.message}`);
    }
  }

  /**
   * PRD 목록 조회
   * @param {string} status - 필터링할 상태 (옵션)
   * @returns {Array} PRD 요약 목록
   */
  async listPRDs(status = null, sortBy = 'created_desc') {
    await this.ensureInitialized();
    try {
      const allPRDs = await this.storage.listAllPRDs(sortBy);
      
      let filteredPRDs = allPRDs;
      if (status) {
        filteredPRDs = allPRDs.filter(prd => prd.status === status);
      }

      // 요약 정보만 반환
      const summaries = filteredPRDs.map(prd => ({
        id: prd.id,
        title: prd.title,
        description: prd.description.substring(0, 150) + '...',
        status: prd.status,
        priority: this.calculateOverallPriority(prd),
        requirementsCount: prd.requirements.length,
        estimatedHours: this.calculateTotalHours(prd),
        created_at: prd.createdAt,
        updated_at: prd.updatedAt,
        tags: prd.tags
      }));

      return {
        success: true,
        prds: summaries,
        total: summaries.length,
        message: status ? `상태 "${status}" PRD ${summaries.length}개 조회` : `전체 PRD ${summaries.length}개 조회`
      };

    } catch (error) {
      throw new Error(`PRD 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 PRD 상세 조회
   * @param {string} prdId - PRD ID
   * @returns {Object} PRD 상세 정보
   */
  async getPRD(prdId) {
    await this.ensureInitialized();
    try {
      const prd = await this.storage.getPRD(prdId);
      if (!prd) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      return {
        success: true,
        prd: {
          ...prd,
          created_at: prd.createdAt,
          updated_at: prd.updatedAt
        },
        analytics: {
          totalRequirements: prd.requirements.length,
          requirementsByType: this.groupRequirementsByType(prd.requirements),
          requirementsByPriority: this.groupRequirementsByPriority(prd.requirements),
          estimatedHours: this.calculateTotalHours(prd),
          completionRate: this.calculateCompletionRate(prd)
        },
        message: `PRD "${prd.title}" 조회 완료`
      };

    } catch (error) {
      throw new Error(`PRD 조회 실패: ${error.message}`);
    }
  }

  /**
   * PRD 업데이트
   * @param {string} prdId - PRD ID
   * @param {Object} updates - 업데이트할 필드들
   * @returns {Object} 업데이트된 PRD
   */
  async updatePRD(prdId, updates) {
    await this.ensureInitialized();
    try {
      const existingPRD = await this.storage.getPRD(prdId);
      if (!existingPRD) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      // 대시보드 호환 업데이트 적용 (기존 구조 유지)
      const updatedPRD = {
        ...existingPRD,
        ...updates,
        id: prdId, // ID는 변경 불가
        updated_at: new Date().toISOString(), // 대시보드 형식
        last_modified_by: updates.lastModifiedBy || 'system'
      };

      // 버전 관리
      if (updates.title !== existingPRD.title || 
          updates.requirements !== existingPRD.requirements) {
        const versionParts = existingPRD.version.split('.');
        const major = parseInt(versionParts[0]);
        const minor = parseInt(versionParts[1]);
        const patch = parseInt(versionParts[2]);
        
        updatedPRD.version = `${major}.${minor}.${patch + 1}`;
      }

      // 대시보드 호환 검증
      if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
        throw new Error('제목은 비어있을 수 없습니다');
      }
      
      // requirements가 문자열 배열인 경우 그대로 유지 (대시보드 형식)
      if (updates.requirements && Array.isArray(updates.requirements)) {
        // 대시보드 형식 유지
      }

      // 저장 (updatedPRD 사용)
      await this.storage.savePRD(updatedPRD);

      return {
        success: true,
        prd: updatedPRD,
        message: `PRD "${updatedPRD.title}" 업데이트 완료`
      };

    } catch (error) {
      throw new Error(`PRD 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 요구사항 추가
   * @param {string} prdId - PRD ID
   * @param {Object} requirementData - 요구사항 데이터
   * @returns {Object} 추가된 요구사항
   */
  async addRequirement(prdId, requirementData) {
    await this.ensureInitialized();
    try {
      const prd = await this.storage.getPRD(prdId);
      if (!prd) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      const requirement = {
        id: uuidv4(),
        ...requirementData,
        tags: requirementData.tags || []
      };

      // 간단한 요구사항 검증
      if (!requirement || typeof requirement !== 'object' || !requirement.title) {
        throw new Error('요구사항에 제목이 필요합니다');
      }

      // PRD에 요구사항 추가
      prd.requirements.push(requirement);
      prd.updatedAt = new Date();
      
      await this.storage.savePRD(prd);

      return {
        success: true,
        requirement: validation.value,
        message: `요구사항 "${requirement.title}" 추가 완료`
      };

    } catch (error) {
      throw new Error(`요구사항 추가 실패: ${error.message}`);
    }
  }

  // 유틸리티 메서드들

  /**
   * PRD의 전체 우선순위 계산
   */
  calculateOverallPriority(prd) {
    if (!prd.requirements || prd.requirements.length === 0) return 'medium';
    
    const priorities = prd.requirements.map(req => req.priority);
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * 총 예상 시간 계산
   */
  calculateTotalHours(prd) {
    if (!prd.requirements) return 0;
    return prd.requirements.reduce((total, req) => total + (req.estimatedHours || 0), 0);
  }

  /**
   * 완성률 계산 (향후 Task 연동 시 사용)
   */
  calculateCompletionRate(prd) {
    // 현재는 기본값 반환, 향후 Task와 연동 시 실제 계산
    return 0;
  }

  /**
   * 요구사항을 타입별로 그룹화
   */
  groupRequirementsByType(requirements) {
    const grouped = {};
    requirements.forEach(req => {
      if (!grouped[req.type]) grouped[req.type] = 0;
      grouped[req.type]++;
    });
    return grouped;
  }

  /**
   * 요구사항을 우선순위별로 그룹화
   */
  groupRequirementsByPriority(requirements) {
    const grouped = {};
    requirements.forEach(req => {
      if (!grouped[req.priority]) grouped[req.priority] = 0;
      grouped[req.priority]++;
    });
    return grouped;
  }

  /**
   * PRD 삭제
   * @param {string} prdId - PRD ID
   * @returns {Object} 삭제 결과
   */
  async deletePRD(prdId) {
    await this.ensureInitialized();
    try {
      const existingPRD = await this.storage.getPRD(prdId);
      if (!existingPRD) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      // PRD 삭제
      await this.storage.deletePRD(prdId);

      return {
        success: true,
        message: `PRD "${existingPRD.title}" 삭제 완료`
      };

    } catch (error) {
      throw new Error(`PRD 삭제 실패: ${error.message}`);
    }
  }
}