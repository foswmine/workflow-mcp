/**
 * Design Manager - 설계 관리 클래스 (완전 구현)
 * 시스템/UI/DB/API 설계 생성, 조회, 수정, 삭제 및 비즈니스 로직 처리
 */

import { v4 as uuidv4 } from 'uuid';
import { SQLiteDesignStorage } from './SQLiteDesignStorage.js';

// Design 상태 enum
export const DesignStatus = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  IMPLEMENTED: 'implemented'
};

// 설계 타입 enum  
export const DesignType = {
  SYSTEM: 'system',
  ARCHITECTURE: 'architecture',
  UI_UX: 'ui_ux',
  DATABASE: 'database',
  API: 'api'
};

// 우선순위 enum
export const DesignPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

export class DesignManager {
  constructor() {
    this.storage = new SQLiteDesignStorage();
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  /**
   * 새로운 Design 생성
   * @param {Object} designData - Design 기본 데이터
   * @returns {Object} 생성된 Design 객체
   */
  async createDesign(designData) {
    await this.ensureInitialized();
    try {
      // 기본 Design 구조 생성
      const design = {
        id: uuidv4(),
        title: designData.title,
        description: designData.description || '',
        requirement_id: designData.requirement_id || null,
        status: designData.status || DesignStatus.DRAFT,
        design_type: designData.design_type || DesignType.SYSTEM,
        priority: this.normalizePriority(designData.priority),
        design_details: designData.details || designData.design_details || '',
        diagrams: designData.diagrams || '',
        acceptance_criteria: designData.acceptance_criteria || '[]',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: designData.created_by || 'system',
        version: 1,
        tags: designData.tags || '[]',
        notes: designData.notes || ''
      };

      // 필수 필드 검증
      if (!design.title || design.title.trim().length === 0) {
        throw new Error('제목은 필수입니다');
      }

      // 상태 검증
      if (!Object.values(DesignStatus).includes(design.status)) {
        design.status = DesignStatus.DRAFT;
      }

      // 타입 검증
      if (!Object.values(DesignType).includes(design.design_type)) {
        design.design_type = DesignType.SYSTEM;
      }

      // 우선순위 검증
      if (!Object.values(DesignPriority).includes(design.priority)) {
        design.priority = DesignPriority.MEDIUM;
      }

      // Design 저장
      await this.storage.saveDesign(design);

      return {
        success: true,
        design: design,
        message: `설계 "${design.title}" 생성 완료`
      };

    } catch (error) {
      throw new Error(`설계 생성 실패: ${error.message}`);
    }
  }

  /**
   * Design 목록 조회
   * @param {string} status - 필터링할 상태 (옵션)
   * @param {string} design_type - 설계 타입 필터 (옵션)
   * @returns {Array} Design 목록
   */
  async listDesigns(status = null, design_type = null) {
    await this.ensureInitialized();
    try {
      const allDesigns = await this.storage.listAllDesigns();
      
      let filteredDesigns = allDesigns;
      if (status) {
        filteredDesigns = filteredDesigns.filter(design => design.status === status);
      }
      if (design_type) {
        filteredDesigns = filteredDesigns.filter(design => design.design_type === design_type);
      }

      // 요약 정보와 함께 반환
      const designsWithSummary = filteredDesigns.map(design => ({
        ...design,
        summary: {
          hasRequirement: !!design.requirement_id,
          hasDiagrams: !!design.diagrams,
          acceptanceCriteriaCount: this.getAcceptanceCriteriaCount(design),
          tagCount: this.getTagCount(design)
        }
      }));

      return {
        success: true,
        designs: designsWithSummary,
        total: designsWithSummary.length,
        statusBreakdown: this.getStatusBreakdown(designsWithSummary),
        typeBreakdown: this.getTypeBreakdown(designsWithSummary),
        message: `설계 ${designsWithSummary.length}개 조회 완료`
      };

    } catch (error) {
      throw new Error(`설계 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 Design 상세 조회
   * @param {string} designId - Design ID
   * @returns {Object} Design 상세 정보
   */
  async getDesign(designId) {
    await this.ensureInitialized();
    try {
      const design = await this.storage.getDesign(designId);
      if (!design) {
        throw new Error(`설계를 찾을 수 없습니다: ${designId}`);
      }

      // 연관 요구사항 정보 조회 (만약 있다면)
      let requirementInfo = null;
      if (design.requirement_id) {
        // 추후 PRDManager와 연동하여 요구사항 정보 조회
        requirementInfo = {
          id: design.requirement_id,
          title: '연관 요구사항', // 실제로는 PRD에서 조회
          status: 'unknown'
        };
      }

      return {
        success: true,
        design: {
          ...design,
          requirementInfo: requirementInfo,
          analytics: {
            hasRequirement: !!design.requirement_id,
            hasDiagrams: !!design.diagrams,
            acceptanceCriteriaCount: this.getAcceptanceCriteriaCount(design),
            tagCount: this.getTagCount(design),
            completionPercentage: this.calculateCompletionPercentage(design)
          }
        },
        message: `설계 "${design.title}" 조회 완료`
      };

    } catch (error) {
      throw new Error(`설계 조회 실패: ${error.message}`);
    }
  }

  /**
   * Design 업데이트
   * @param {string} designId - Design ID
   * @param {Object} updates - 업데이트할 필드들
   * @returns {Object} 업데이트된 Design
   */
  async updateDesign(designId, updates) {
    await this.ensureInitialized();
    try {
      const existingDesign = await this.storage.getDesign(designId);
      if (!existingDesign) {
        throw new Error(`설계를 찾을 수 없습니다: ${designId}`);
      }

      // 우선순위 정규화 처리
      if (updates.priority) {
        updates.priority = this.normalizePriority(updates.priority);
      }

      // 업데이트된 Design 생성
      const updatedDesign = {
        ...existingDesign,
        ...updates,
        id: designId, // ID는 변경 불가
        updated_at: new Date().toISOString(),
        version: existingDesign.version + 1
      };

      // 상태가 변경된 경우 추가 로직
      if (updates.status && updates.status !== existingDesign.status) {
        updatedDesign.statusChangedAt = new Date().toISOString();
        
        // 승인 상태로 변경 시 승인 시간 기록
        if (updates.status === DesignStatus.APPROVED) {
          updatedDesign.approvedAt = new Date().toISOString();
        }
        
        // 구현 완료 상태로 변경 시 완료 시간 기록
        if (updates.status === DesignStatus.IMPLEMENTED) {
          updatedDesign.implementedAt = new Date().toISOString();
        }
      }

      // 검증
      if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
        throw new Error('제목은 비어있을 수 없습니다');
      }

      // 저장
      await this.storage.saveDesign(updatedDesign);

      return {
        success: true,
        design: updatedDesign,
        message: `설계 "${updatedDesign.title}" 업데이트 완료`
      };

    } catch (error) {
      throw new Error(`설계 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * Design 삭제
   * @param {string} designId - Design ID
   * @returns {Object} 삭제 결과
   */
  async deleteDesign(designId) {
    await this.ensureInitialized();
    try {
      const existingDesign = await this.storage.getDesign(designId);
      if (!existingDesign) {
        throw new Error(`설계를 찾을 수 없습니다: ${designId}`);
      }

      // 의존성 체크 - Task가 이 Design에 의존하는지 확인 
      // 추후 TaskManager와 연동하여 확인
      // const dependentTasks = await this.checkDependentTasks(designId);
      // if (dependentTasks.length > 0) {
      //   throw new Error(`이 설계에 의존하는 작업이 있어 삭제할 수 없습니다`);
      // }

      // 삭제 수행
      const deleted = await this.storage.deleteDesign(designId);
      if (!deleted) {
        throw new Error('설계 삭제 중 오류가 발생했습니다');
      }

      return {
        success: true,
        deletedDesign: existingDesign.title,
        message: `설계 "${existingDesign.title}"이 성공적으로 삭제되었습니다`
      };

    } catch (error) {
      throw new Error(`설계 삭제 실패: ${error.message}`);
    }
  }

  // 유틸리티 메서드들

  /**
   * 승인 기준 개수 계산
   */
  getAcceptanceCriteriaCount(design) {
    try {
      const criteria = JSON.parse(design.acceptance_criteria || '[]');
      return Array.isArray(criteria) ? criteria.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 태그 개수 계산
   */
  getTagCount(design) {
    try {
      const tags = JSON.parse(design.tags || '[]');
      return Array.isArray(tags) ? tags.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 완성도 계산
   */
  calculateCompletionPercentage(design) {
    if (design.status === DesignStatus.IMPLEMENTED) return 100;
    if (design.status === DesignStatus.APPROVED) return 80;
    if (design.status === DesignStatus.REVIEW) return 60;
    if (design.status === DesignStatus.DRAFT) {
      // 기본 정보 완성도 기준
      let completion = 20; // 기본 제목+설명
      if (design.design_details && design.design_details !== '{}') completion += 20;
      if (design.diagrams) completion += 20;
      if (this.getAcceptanceCriteriaCount(design) > 0) completion += 20;
      if (design.requirement_id) completion += 20;
      return Math.min(completion, 50); // draft 상태에서는 최대 50%
    }
    return 0;
  }

  /**
   * 상태별 분류
   */
  getStatusBreakdown(designs) {
    const breakdown = {};
    Object.values(DesignStatus).forEach(status => {
      breakdown[status] = designs.filter(design => design.status === status).length;
    });
    return breakdown;
  }

  /**
   * 타입별 분류
   */
  getTypeBreakdown(designs) {
    const breakdown = {};
    Object.values(DesignType).forEach(type => {
      breakdown[type] = designs.filter(design => design.design_type === type).length;
    });
    return breakdown;
  }

  /**
   * 특정 요구사항(PRD)에 연결된 설계 목록 조회
   * @param {string} requirementId - PRD ID
   * @returns {Object} 연결된 설계 목록
   */
  async getDesignsByRequirement(requirementId) {
    await this.ensureInitialized();
    try {
      const designs = await this.storage.getDesignsByRequirement(requirementId);
      
      // 각 설계에 추가 정보 추가 (타입별 아이콘, 상태별 색상 등)
      const enrichedDesigns = designs.map(design => ({
        ...design,
        typeIcon: this.getTypeIcon(design.design_type),
        statusColor: this.getStatusColor(design.status),
        daysFromLastUpdate: this.calculateDaysFromDate(design.updated_at)
      }));

      return {
        success: true,
        designs: enrichedDesigns,
        total: enrichedDesigns.length,
        statusBreakdown: this.getStatusBreakdown(enrichedDesigns),
        typeBreakdown: this.getTypeBreakdown(enrichedDesigns),
        message: `요구사항 "${requirementId}"에 연결된 설계 ${enrichedDesigns.length}개 조회 완료`
      };

    } catch (error) {
      throw new Error(`요구사항별 설계 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 설계 타입별 아이콘 반환
   */
  getTypeIcon(designType) {
    const icons = {
      [DesignType.SYSTEM]: '⚙️',
      [DesignType.ARCHITECTURE]: '🏗️', 
      [DesignType.UI_UX]: '🎨',
      [DesignType.DATABASE]: '🗄️',
      [DesignType.API]: '🔌'
    };
    return icons[designType] || '📋';
  }

  /**
   * 상태별 색상 반환
   */
  getStatusColor(status) {
    const colors = {
      [DesignStatus.DRAFT]: 'gray',
      [DesignStatus.REVIEW]: 'yellow',
      [DesignStatus.APPROVED]: 'green',
      [DesignStatus.IMPLEMENTED]: 'blue'
    };
    return colors[status] || 'gray';
  }

  /**
   * 날짜로부터 경과 일수 계산
   */
  calculateDaysFromDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today - date;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 우선순위 정규화 (대소문자 구분 없이 소문자로 변환)
   * @param {string} priority - 우선순위 값
   * @returns {string} 정규화된 소문자 우선순위 (high, medium, low)
   */
  normalizePriority(priority) {
    console.log('🔄 DesignManager.normalizePriority called with:', priority);
    if (!priority) {
      console.log('📝 No priority provided, returning default:', DesignPriority.MEDIUM);
      return DesignPriority.MEDIUM;
    }
    
    const normalizedValue = priority.toLowerCase();
    console.log('📝 Normalized value:', normalizedValue);
    
    // 소문자로 받은 우선순위를 설계 형식으로 변환
    switch (normalizedValue) {
      case 'high':
        console.log('📝 Converting to HIGH:', DesignPriority.HIGH);
        return DesignPriority.HIGH;
      case 'medium':
        console.log('📝 Converting to MEDIUM:', DesignPriority.MEDIUM);
        return DesignPriority.MEDIUM;
      case 'low':
        console.log('📝 Converting to LOW:', DesignPriority.LOW);
        return DesignPriority.LOW;
      default:
        console.log('📝 Unknown priority, returning default:', DesignPriority.MEDIUM);
        return DesignPriority.MEDIUM;
    }
  }
}