/**
 * Project Manager - 프로젝트 관리 클래스
 * 프로젝트의 생성, 조회, 수정, 삭제 및 비즈니스 로직 처리
 */

import { v4 as uuidv4 } from 'uuid';
import { SQLiteProjectStorage } from './SQLiteProjectStorage.js';

// 상수 정의
const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active', 
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed'
};

const PriorityLevels = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export class ProjectManager {
  constructor() {
    this.storage = new SQLiteProjectStorage();
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  /**
   * 새로운 프로젝트 생성
   * @param {Object} projectData - 프로젝트 기본 데이터
   * @returns {Object} 생성된 프로젝트 객체
   */
  async createProject(projectData) {
    await this.ensureInitialized();
    try {
      // 기본 프로젝트 구조 생성
      const project = {
        id: uuidv4(),
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || ProjectStatus.PLANNING,
        priority: projectData.priority || PriorityLevels.MEDIUM,
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: projectData.created_by || 'system',
        manager: projectData.manager || '',
        tags: projectData.tags || [],
        progress: 0,
        notes: projectData.notes || ''
      };

      // 기본 검증
      if (!project.name || project.name.trim().length === 0) {
        throw new Error('프로젝트 이름은 필수입니다');
      }

      // 프로젝트 저장
      await this.storage.saveProject(project);

      return {
        success: true,
        project: project,
        message: `프로젝트 "${project.name}" 생성 완료`
      };

    } catch (error) {
      throw new Error(`프로젝트 생성 실패: ${error.message}`);
    }
  }

  /**
   * 프로젝트 목록 조회
   * @param {string} status - 필터링할 상태 (옵션)
   * @param {string} sortBy - 정렬 기준
   * @returns {Array} 프로젝트 목록
   */
  async listProjects(status = null, sortBy = 'updated_desc') {
    await this.ensureInitialized();
    try {
      const allProjects = await this.storage.listAllProjects(sortBy);
      
      let filteredProjects = allProjects;
      if (status) {
        filteredProjects = allProjects.filter(project => project.status === status);
      }

      // 각 프로젝트의 요약 통계 정보 계산
      const projectsWithStats = await Promise.all(filteredProjects.map(async (project) => {
        const stats = await this.calculateProjectStats(project.id);
        return {
          ...project,
          ...stats
        };
      }));

      return {
        success: true,
        projects: projectsWithStats,
        total: projectsWithStats.length,
        message: status ? `상태 "${status}" 프로젝트 ${projectsWithStats.length}개 조회` : `전체 프로젝트 ${projectsWithStats.length}개 조회`
      };

    } catch (error) {
      throw new Error(`프로젝트 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 프로젝트 상세 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Object} 프로젝트 상세 정보
   */
  async getProject(projectId) {
    await this.ensureInitialized();
    try {
      const project = await this.storage.getProject(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      // 연관된 데이터 조회
      const relatedData = await this.getProjectRelatedData(projectId);
      
      // 프로젝트 통계 계산
      const stats = await this.calculateProjectStats(projectId);

      return {
        success: true,
        project: project,
        related: relatedData,
        analytics: {
          ...stats,
          progressCalculation: this.calculateDetailedProgress(relatedData),
          timeline: this.calculateProjectTimeline(project, relatedData)
        },
        message: `프로젝트 "${project.name}" 조회 완료`
      };

    } catch (error) {
      throw new Error(`프로젝트 조회 실패: ${error.message}`);
    }
  }

  /**
   * 프로젝트 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} updates - 업데이트할 필드들
   * @returns {Object} 업데이트된 프로젝트
   */
  async updateProject(projectId, updates) {
    await this.ensureInitialized();
    try {
      const existingProject = await this.storage.getProject(projectId);
      if (!existingProject) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      // 업데이트 적용
      const updatedProject = {
        ...existingProject,
        ...updates,
        id: projectId, // ID는 변경 불가
        updated_at: new Date().toISOString()
      };

      // 기본 검증
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new Error('프로젝트 이름은 비어있을 수 없습니다');
      }

      // 진행률이 수동으로 설정되지 않은 경우 자동 계산
      if (updates.progress === undefined) {
        const stats = await this.calculateProjectStats(projectId);
        updatedProject.progress = stats.progress;
      }

      // 저장
      await this.storage.saveProject(updatedProject);

      return {
        success: true,
        project: updatedProject,
        message: `프로젝트 "${updatedProject.name}" 업데이트 완료`
      };

    } catch (error) {
      throw new Error(`프로젝트 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 프로젝트 삭제
   * @param {string} projectId - 프로젝트 ID
   * @returns {Object} 삭제 결과
   */
  async deleteProject(projectId) {
    await this.ensureInitialized();
    try {
      const existingProject = await this.storage.getProject(projectId);
      if (!existingProject) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      // 연관된 데이터가 있는지 확인
      const relatedData = await this.getProjectRelatedData(projectId);
      const hasRelatedData = relatedData.prds.length > 0 || 
                           relatedData.tasks.length > 0 || 
                           relatedData.documents.length > 0;

      if (hasRelatedData) {
        throw new Error('연관된 데이터(PRD, 작업, 문서)가 있는 프로젝트는 삭제할 수 없습니다. 먼저 연관 데이터를 다른 프로젝트로 이동하거나 삭제하세요.');
      }

      // 프로젝트 삭제
      await this.storage.deleteProject(projectId);

      return {
        success: true,
        message: `프로젝트 "${existingProject.name}" 삭제 완료`
      };

    } catch (error) {
      throw new Error(`프로젝트 삭제 실패: ${error.message}`);
    }
  }

  // 유틸리티 메서드들

  /**
   * 프로젝트 관련 데이터 조회
   */
  async getProjectRelatedData(projectId) {
    try {
      await this.ensureInitialized();
      
      // project_links 테이블에서 연결된 항목들 조회
      const links = await this.storage.db.all(`
        SELECT 
          pl.id as link_id,
          pl.entity_type,
          pl.entity_id,
          pl.link_type,
          pl.created_at as linked_at,
          CASE 
            WHEN pl.entity_type = 'prd' THEN p.title
            WHEN pl.entity_type = 'task' THEN t.title  
            WHEN pl.entity_type = 'design' THEN d.title
          END as title,
          CASE 
            WHEN pl.entity_type = 'prd' THEN p.description
            WHEN pl.entity_type = 'task' THEN t.description
            WHEN pl.entity_type = 'design' THEN d.description
          END as description,
          CASE 
            WHEN pl.entity_type = 'prd' THEN p.status
            WHEN pl.entity_type = 'task' THEN t.status
            WHEN pl.entity_type = 'design' THEN d.status
          END as status,
          CASE 
            WHEN pl.entity_type = 'prd' THEN p.priority
            WHEN pl.entity_type = 'task' THEN t.priority
            WHEN pl.entity_type = 'design' THEN d.priority
          END as priority,
          CASE 
            WHEN pl.entity_type = 'prd' THEN p.created_at
            WHEN pl.entity_type = 'task' THEN t.createdAt
            WHEN pl.entity_type = 'design' THEN d.created_at
          END as created_at
        FROM project_links pl
        LEFT JOIN prds p ON pl.entity_type = 'prd' AND pl.entity_id = p.id
        LEFT JOIN tasks t ON pl.entity_type = 'task' AND pl.entity_id = t.id  
        LEFT JOIN designs d ON pl.entity_type = 'design' AND pl.entity_id = d.id
        WHERE pl.project_id = ?
        ORDER BY pl.entity_type, pl.created_at DESC
      `, [projectId]);

      // 타입별로 분리
      const prds = links.filter(link => link.entity_type === 'prd');
      const tasks = links.filter(link => link.entity_type === 'task');
      const designs = links.filter(link => link.entity_type === 'design');

      // 문서는 별도로 조회 (document_links 테이블 사용)
      const documents = await this.storage.db.all(`
        SELECT d.* FROM documents d
        JOIN document_links dl ON d.id = dl.document_id
        WHERE dl.entity_type = 'project' AND dl.entity_id = ?
      `, [projectId]);

      return {
        prds,
        tasks,
        designs,
        documents: documents || []
      };
    } catch (error) {
      console.error('Error getting project related data:', error);
      return { prds: [], tasks: [], designs: [], documents: [] };
    }
  }

  /**
   * 프로젝트 통계 계산
   */
  async calculateProjectStats(projectId) {
    try {
      const relatedData = await this.getProjectRelatedData(projectId);
      
      const totalPrds = relatedData.prds.length;
      const totalTasks = relatedData.tasks.length;
      const completedTasks = relatedData.tasks.filter(task => 
        task.status === 'completed' || task.status === 'done'
      ).length;
      const totalDocuments = relatedData.documents.length;
      
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalPrds,
        totalTasks,
        completedTasks,
        totalDocuments,
        progress,
        tasksInProgress: relatedData.tasks.filter(task => task.status === 'in_progress').length,
        tasksPending: relatedData.tasks.filter(task => task.status === 'pending').length
      };
    } catch (error) {
      console.error('Error calculating project stats:', error);
      return {
        totalPrds: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalDocuments: 0,
        progress: 0,
        tasksInProgress: 0,
        tasksPending: 0
      };
    }
  }

  /**
   * 상세 진행률 계산
   */
  calculateDetailedProgress(relatedData) {
    const { prds, tasks, documents } = relatedData;
    
    // PRD 완료율
    const prdProgress = prds.length > 0 ? 
      prds.filter(prd => prd.status === 'completed' || prd.status === 'approved').length / prds.length * 100 : 0;
    
    // 작업 완료율  
    const taskProgress = tasks.length > 0 ?
      tasks.filter(task => task.status === 'completed' || task.status === 'done').length / tasks.length * 100 : 0;
    
    // 문서 완료율 (approved 상태인 문서)
    const docProgress = documents.length > 0 ?
      documents.filter(doc => doc.status === 'approved').length / documents.length * 100 : 0;

    return {
      prdProgress: Math.round(prdProgress),
      taskProgress: Math.round(taskProgress), 
      docProgress: Math.round(docProgress),
      overall: Math.round((prdProgress + taskProgress + docProgress) / 3)
    };
  }

  /**
   * 프로젝트 타임라인 계산
   */
  calculateProjectTimeline(project, relatedData) {
    const timeline = {
      startDate: project.start_date,
      endDate: project.end_date,
      currentPhase: this.determineCurrentPhase(project, relatedData),
      milestones: [],
      isOnSchedule: true,
      daysRemaining: 0
    };

    if (project.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      timeline.daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      timeline.isOnSchedule = timeline.daysRemaining >= 0;
    }

    return timeline;
  }

  /**
   * 현재 프로젝트 단계 결정
   */
  determineCurrentPhase(project, relatedData) {
    if (project.status === 'planning') return '기획';
    if (project.status === 'completed') return '완료';
    if (project.status === 'on_hold') return '보류';
    
    const { prds, tasks } = relatedData;
    
    if (prds.length === 0) return '요구사항 정의';
    if (tasks.length === 0) return '작업 계획';
    
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    const progressRate = completedTasks / tasks.length;
    
    if (progressRate < 0.3) return '개발 초기';
    if (progressRate < 0.7) return '개발 진행';
    if (progressRate < 1.0) return '개발 완료';
    
    return '검증 및 배포';
  }
}