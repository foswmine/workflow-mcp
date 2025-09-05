/**
 * PRD Manager - Product Requirements Document 관리 클래스
 * PRD의 생성, 조회, 수정, 삭제 및 비즈니스 로직 처리
 */

import { v4 as uuidv4 } from 'uuid';
import { validatePRD, validateRequirement, PRDStatus, PriorityLevels, MoscowPriority } from '../../schemas/prd-schema.js';
import { FileStorage } from '../utils/FileStorage.js';

export class PRDManager {
  constructor() {
    this.storage = new FileStorage('prds');
    this.initializeStorage();
  }

  async initializeStorage() {
    await this.storage.initialize();
  }

  /**
   * 새로운 PRD 생성
   * @param {Object} prdData - PRD 기본 데이터
   * @returns {Object} 생성된 PRD 객체
   */
  async createPRD(prdData) {
    try {
      // 기본 PRD 구조 생성
      const prd = {
        id: uuidv4(),
        title: prdData.title,
        description: prdData.description,
        version: '1.0.0',
        status: PRDStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: prdData.createdBy || 'system',
        lastModifiedBy: prdData.createdBy || 'system',
        businessObjective: prdData.businessObjective || 'Business objective to be defined',
        targetUsers: prdData.targetUsers || ['General users'],
        successCriteria: prdData.successCriteria || ['Success criteria to be defined'],
        epics: [],
        requirements: [],
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
              priority: prdData.priority || PriorityLevels.MEDIUM,
              moscow: MoscowPriority.MUST,
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
              priority: req.priority || PriorityLevels.MEDIUM,
              moscow: req.moscow || MoscowPriority.MUST,
              acceptanceCriteria: req.acceptanceCriteria || [],
              dependencies: req.dependencies || [],
              estimatedHours: req.estimatedHours || 0,
              tags: req.tags || []
            };
          }
        });
      }

      // PRD 유효성 검사
      const validation = validatePRD(prd);
      if (!validation.isValid) {
        throw new Error(`PRD 유효성 검사 실패: ${JSON.stringify(validation.errors)}`);
      }

      // PRD 저장
      await this.storage.save(prd.id, validation.value);

      return {
        success: true,
        prd: validation.value,
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
  async listPRDs(status = null) {
    try {
      const allPRDs = await this.storage.listAll();
      
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
        createdAt: prd.createdAt,
        updatedAt: prd.updatedAt,
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
    try {
      const prd = await this.storage.load(prdId);
      if (!prd) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      return {
        success: true,
        prd: prd,
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
    try {
      const existingPRD = await this.storage.load(prdId);
      if (!existingPRD) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      // 업데이트 적용
      const updatedPRD = {
        ...existingPRD,
        ...updates,
        id: prdId, // ID는 변경 불가
        updatedAt: new Date(),
        lastModifiedBy: updates.lastModifiedBy || 'system'
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

      // 유효성 검사
      const validation = validatePRD(updatedPRD);
      if (!validation.isValid) {
        throw new Error(`PRD 유효성 검사 실패: ${JSON.stringify(validation.errors)}`);
      }

      // 저장
      await this.storage.save(prdId, validation.value);

      return {
        success: true,
        prd: validation.value,
        message: `PRD "${validation.value.title}" 업데이트 완료`
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
    try {
      const prd = await this.storage.load(prdId);
      if (!prd) {
        throw new Error(`PRD를 찾을 수 없습니다: ${prdId}`);
      }

      const requirement = {
        id: uuidv4(),
        ...requirementData,
        tags: requirementData.tags || []
      };

      // 요구사항 유효성 검사
      const validation = validateRequirement(requirement);
      if (!validation.isValid) {
        throw new Error(`요구사항 유효성 검사 실패: ${JSON.stringify(validation.errors)}`);
      }

      // PRD에 요구사항 추가
      prd.requirements.push(validation.value);
      prd.updatedAt = new Date();
      
      await this.storage.save(prdId, prd);

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
    if (!prd.requirements || prd.requirements.length === 0) return 'Medium';
    
    const priorities = prd.requirements.map(req => req.priority);
    if (priorities.includes(PriorityLevels.HIGH)) return PriorityLevels.HIGH;
    if (priorities.includes(PriorityLevels.MEDIUM)) return PriorityLevels.MEDIUM;
    return PriorityLevels.LOW;
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
}