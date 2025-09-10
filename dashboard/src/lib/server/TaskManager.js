/**
 * Task Manager - 작업 관리 클래스 (완전 구현)
 * 작업의 생성, 조회, 수정, 삭제 및 비즈니스 로직 처리
 */

import { v4 as uuidv4 } from 'uuid';
import { SQLiteTaskStorage } from './SQLiteTaskStorage.js';

// Task 상태 enum
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  DONE: 'done',
  BLOCKED: 'blocked'
};

// 우선순위 enum
export const TaskPriority = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export class TaskManager {
  constructor() {
    this.storage = new SQLiteTaskStorage();
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  /**
   * 우선순위 값을 표준 형식으로 정규화
   * @param {string} priority - 입력 우선순위 ('high', 'High', 'HIGH' 등)
   * @returns {string} 정규화된 우선순위 ('High', 'Medium', 'Low')
   */
  normalizePriority(priority) {
    if (!priority) return null;
    const normalized = priority.toLowerCase();
    switch (normalized) {
      case 'high':
        return TaskPriority.HIGH;
      case 'medium':
        return TaskPriority.MEDIUM;
      case 'low':
        return TaskPriority.LOW;
      default:
        return null;
    }
  }

  /**
   * 새로운 Task 생성
   * @param {Object} taskData - Task 기본 데이터
   * @returns {Object} 생성된 Task 객체
   */
  async createTask(taskData) {
    await this.ensureInitialized();
    try {
      // 기본 Task 구조 생성
      const task = {
        id: uuidv4(),
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || TaskStatus.PENDING,
        priority: this.normalizePriority(taskData.priority) || TaskPriority.MEDIUM,
        assignee: taskData.assignee || null,
        estimatedHours: taskData.estimatedHours || taskData.estimated_hours || 0,
        actualHours: taskData.actualHours || taskData.actual_hours || 0,
        dueDate: taskData.dueDate || taskData.due_date || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        planId: taskData.planId || taskData.design_id || null,
        prd_id: taskData.prd_id || null, // PRD 연결 정보 추가
        version: 1,
        createdBy: taskData.createdBy || taskData.created_by || 'system',
        tags: taskData.tags || [],
        notes: taskData.notes || '',
        // 추가 메타데이터
        details: taskData.details || '',
        acceptanceCriteria: taskData.acceptanceCriteria || taskData.acceptance_criteria || [],
        testStrategy: taskData.testStrategy || taskData.test_strategy || '',
        dependencies: []
      };

      // 필수 필드 검증
      if (!task.title || task.title.trim().length === 0) {
        throw new Error('제목은 필수입니다');
      }

      // 우선순위 검증
      if (!Object.values(TaskPriority).includes(task.priority)) {
        task.priority = TaskPriority.MEDIUM;
      }

      // 상태 검증
      if (!Object.values(TaskStatus).includes(task.status)) {
        task.status = TaskStatus.PENDING;
      }

      // Task 저장
      await this.storage.saveTask(task);

      // PRD 연결 정보가 있으면 prd_task_links 테이블에 저장
      if (task.prd_id) {
        await this.createPrdTaskLink(task.prd_id, task.id, 'direct', task.createdBy);
      }

      return {
        success: true,
        task: task,
        message: `Task "${task.title}" 생성 완료`
      };

    } catch (error) {
      throw new Error(`Task 생성 실패: ${error.message}`);
    }
  }

  /**
   * Task 목록 조회
   * @param {string} status - 필터링할 상태 (옵션)
   * @param {string} assignee - 담당자 필터 (옵션)
   * @returns {Array} Task 목록
   */
  async listTasks(status = null, assignee = null, sortBy = 'updated_desc') {
    await this.ensureInitialized();
    try {
      const allTasks = await this.storage.listAllTasks();
      
      let filteredTasks = allTasks;
      if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
      }
      if (assignee) {
        filteredTasks = filteredTasks.filter(task => task.assignee === assignee);
      }

      // 정렬 적용
      switch (sortBy) {
        case 'updated_asc':
          filteredTasks.sort((a, b) => new Date(a.updatedAt || a.updated_at) - new Date(b.updatedAt || b.updated_at));
          break;
        case 'created_desc':
          filteredTasks.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
          break;
        case 'created_asc':
          filteredTasks.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
          break;
        case 'title_asc':
          filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'title_desc':
          filteredTasks.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case 'updated_desc':
        default:
          filteredTasks.sort((a, b) => new Date(b.updatedAt || b.updated_at) - new Date(a.updatedAt || a.updated_at));
          break;
      }

      // 요약 정보와 함께 반환
      const tasksWithSummary = filteredTasks.map(task => ({
        ...task,
        summary: {
          isOverdue: this.isTaskOverdue(task),
          daysRemaining: this.calculateDaysRemaining(task),
          completionPercentage: this.calculateCompletionPercentage(task),
          dependentTasksCount: task.dependencies ? task.dependencies.length : 0
        }
      }));

      return {
        success: true,
        tasks: tasksWithSummary,
        total: tasksWithSummary.length,
        statusBreakdown: this.getStatusBreakdown(tasksWithSummary),
        sortBy,
        message: `Task ${tasksWithSummary.length}개 조회 완료 (정렬: ${sortBy})`
      };

    } catch (error) {
      throw new Error(`Task 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 Task 상세 조회
   * @param {string} taskId - Task ID
   * @returns {Object} Task 상세 정보
   */
  async getTask(taskId) {
    await this.ensureInitialized();
    try {
      const task = await this.storage.getTask(taskId);
      if (!task) {
        throw new Error(`Task를 찾을 수 없습니다: ${taskId}`);
      }

      // 의존성 작업 정보 조회
      const dependencyTasks = [];
      if (task.dependencies && task.dependencies.length > 0) {
        for (const depId of task.dependencies) {
          const depTask = await this.storage.getTask(depId);
          if (depTask) {
            dependencyTasks.push({
              id: depTask.id,
              title: depTask.title,
              status: depTask.status
            });
          }
        }
      }

      return {
        success: true,
        task: {
          ...task,
          dependencyTasks: dependencyTasks,
          analytics: {
            isOverdue: this.isTaskOverdue(task),
            daysRemaining: this.calculateDaysRemaining(task),
            completionPercentage: this.calculateCompletionPercentage(task),
            timeTracking: {
              estimated: task.estimatedHours,
              actual: task.actualHours,
              variance: task.actualHours - task.estimatedHours
            }
          }
        },
        message: `Task "${task.title}" 조회 완료`
      };

    } catch (error) {
      throw new Error(`Task 조회 실패: ${error.message}`);
    }
  }

  /**
   * Task 업데이트
   * @param {string} taskId - Task ID
   * @param {Object} updates - 업데이트할 필드들
   * @returns {Object} 업데이트된 Task
   */
  async updateTask(taskId, updates) {
    await this.ensureInitialized();
    try {
      const existingTask = await this.storage.getTask(taskId);
      if (!existingTask) {
        throw new Error(`Task를 찾을 수 없습니다: ${taskId}`);
      }

      // 업데이트된 Task 생성
      const updatedTask = {
        ...existingTask,
        ...updates,
        id: taskId, // ID는 변경 불가
        updatedAt: new Date().toISOString(),
        version: existingTask.version + 1
      };

      // 상태가 변경된 경우 추가 로직
      if (updates.status && updates.status !== existingTask.status) {
        updatedTask.statusChangedAt = new Date().toISOString();
        
        // 완료 상태로 변경 시 완료 시간 기록
        if (updates.status === TaskStatus.DONE) {
          updatedTask.completedAt = new Date().toISOString();
        }
      }

      // 검증
      if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
        throw new Error('제목은 비어있을 수 없습니다');
      }

      // 저장
      await this.storage.saveTask(updatedTask);

      // PRD 연결 정보가 변경되었으면 prd_task_links 테이블 업데이트
      if (updates.prd_id !== undefined && updates.prd_id !== existingTask.prd_id) {
        // 기존 연결 삭제
        if (existingTask.prd_id) {
          await this.deletePrdTaskLink(existingTask.prd_id, taskId);
        }
        // 새 연결 생성
        if (updates.prd_id) {
          await this.createPrdTaskLink(updates.prd_id, taskId, 'direct', 'dashboard');
        }
      }

      return {
        success: true,
        task: updatedTask,
        message: `Task "${updatedTask.title}" 업데이트 완료`
      };

    } catch (error) {
      throw new Error(`Task 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * Task 삭제
   * @param {string} taskId - Task ID
   * @returns {Object} 삭제 결과
   */
  async deleteTask(taskId) {
    await this.ensureInitialized();
    try {
      const existingTask = await this.storage.getTask(taskId);
      if (!existingTask) {
        throw new Error(`Task를 찾을 수 없습니다: ${taskId}`);
      }

      // 의존성 체크 - 다른 Task가 이 Task에 의존하는지 확인
      const allTasks = await this.storage.listAllTasks();
      const dependentTasks = allTasks.filter(task => 
        task.dependencies && task.dependencies.includes(taskId)
      );

      if (dependentTasks.length > 0) {
        const dependentTitles = dependentTasks.map(t => t.title).join(', ');
        throw new Error(`이 Task에 의존하는 다른 Task가 있어 삭제할 수 없습니다: ${dependentTitles}`);
      }

      // 삭제 수행
      const deleted = await this.storage.deleteTask(taskId);
      if (!deleted) {
        throw new Error('Task 삭제 중 오류가 발생했습니다');
      }

      return {
        success: true,
        deletedTask: existingTask.title,
        message: `Task "${existingTask.title}"이 성공적으로 삭제되었습니다`
      };

    } catch (error) {
      throw new Error(`Task 삭제 실패: ${error.message}`);
    }
  }

  /**
   * Task 의존성 추가
   * @param {string} taskId - 의존하는 Task ID
   * @param {string} prerequisiteTaskId - 선행 Task ID
   * @returns {Object} 결과
   */
  async addTaskDependency(taskId, prerequisiteTaskId) {
    await this.ensureInitialized();
    try {
      const task = await this.storage.getTask(taskId);
      const prerequisite = await this.storage.getTask(prerequisiteTaskId);

      if (!task) throw new Error(`Task를 찾을 수 없습니다: ${taskId}`);
      if (!prerequisite) throw new Error(`선행 Task를 찾을 수 없습니다: ${prerequisiteTaskId}`);

      // 순환 의존성 체크
      if (await this.wouldCreateCircularDependency(taskId, prerequisiteTaskId)) {
        throw new Error('순환 의존성이 발생합니다');
      }

      // 의존성 추가
      if (!task.dependencies) task.dependencies = [];
      if (!task.dependencies.includes(prerequisiteTaskId)) {
        task.dependencies.push(prerequisiteTaskId);
        await this.storage.saveTask(task);
      }

      return {
        success: true,
        message: `Task "${task.title}"에 선행 작업 "${prerequisite.title}" 의존성이 추가되었습니다`
      };

    } catch (error) {
      throw new Error(`의존성 추가 실패: ${error.message}`);
    }
  }

  // 유틸리티 메서드들

  /**
   * Task가 기한을 넘겼는지 확인
   */
  isTaskOverdue(task) {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date();
  }

  /**
   * 남은 일수 계산
   */
  calculateDaysRemaining(task) {
    if (!task.dueDate || task.status === TaskStatus.DONE) return null;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 완성도 계산 (실제 시간 기준)
   */
  calculateCompletionPercentage(task) {
    if (task.status === TaskStatus.DONE) return 100;
    if (task.status === TaskStatus.PENDING) return 0;
    if (task.estimatedHours === 0) return task.status === TaskStatus.IN_PROGRESS ? 50 : 0;
    
    const percentage = Math.min((task.actualHours / task.estimatedHours) * 100, 95);
    return Math.round(percentage);
  }

  /**
   * 상태별 분류
   */
  getStatusBreakdown(tasks) {
    const breakdown = {};
    Object.values(TaskStatus).forEach(status => {
      breakdown[status] = tasks.filter(task => task.status === status).length;
    });
    return breakdown;
  }

  /**
   * 순환 의존성 체크
   */
  async wouldCreateCircularDependency(taskId, prerequisiteTaskId) {
    // 간단한 구현: prerequisite의 의존성들을 확인
    const prerequisite = await this.storage.getTask(prerequisiteTaskId);
    if (!prerequisite.dependencies) return false;
    
    // 직접적인 순환 체크
    if (prerequisite.dependencies.includes(taskId)) return true;
    
    // 간접적인 순환 체크 (1단계만)
    for (const depId of prerequisite.dependencies) {
      const dep = await this.storage.getTask(depId);
      if (dep && dep.dependencies && dep.dependencies.includes(taskId)) return true;
    }
    
    return false;
  }

  /**
   * PRD-Task 연결 생성
   * @param {string} prdId - PRD ID
   * @param {string} taskId - Task ID
   * @param {string} linkType - 연결 타입 ('direct', 'derived', 'related')
   * @param {string} createdBy - 생성자
   */
  async createPrdTaskLink(prdId, taskId, linkType = 'direct', createdBy = 'system') {
    try {
      await this.storage.createPrdTaskLink(prdId, taskId, linkType, createdBy);
    } catch (error) {
      console.error('PRD-Task 연결 생성 오류:', error);
      // 연결 생성 실패는 메인 작업 실패로 이어지지 않도록 로그만 남김
    }
  }

  /**
   * PRD-Task 연결 삭제
   * @param {string} prdId - PRD ID
   * @param {string} taskId - Task ID
   */
  async deletePrdTaskLink(prdId, taskId) {
    try {
      await this.storage.deletePrdTaskLink(prdId, taskId);
    } catch (error) {
      console.error('PRD-Task 연결 삭제 오류:', error);
      // 연결 삭제 실패는 메인 작업 실패로 이어지지 않도록 로그만 남김
    }
  }

  /**
   * Task의 PRD 연결 정보 조회
   * @param {string} taskId - Task ID
   * @returns {Array} PRD 연결 목록
   */
  async getTaskPrdLinks(taskId) {
    try {
      return await this.storage.getTaskPrdLinks(taskId);
    } catch (error) {
      console.error('Task PRD 연결 정보 조회 오류:', error);
      return [];
    }
  }

  /**
   * 특정 PRD에 연결된 모든 작업 조회 (직접 + 간접 연결)
   * @param {string} prdId - PRD ID
   * @returns {Object} 연결된 작업 목록
   */
  async getTasksByPRD(prdId) {
    await this.ensureInitialized();
    try {
      // 1. 직접 연결된 작업 조회 (prd_task_links 테이블)
      const directTasks = await this.storage.getTasksByPRDDirect(prdId);
      
      // 2. 간접 연결된 작업 조회 (PRD -> 설계 -> 작업)
      const indirectTasks = await this.storage.getTasksByPRDIndirect(prdId);
      
      // 3. 연결 타입 정보 추가
      const allTasks = [
        ...directTasks.map(task => ({ ...task, linkType: 'direct' })),
        ...indirectTasks.map(task => ({ ...task, linkType: 'indirect' }))
      ];
      
      // 4. 중복 제거 (같은 작업이 직접/간접 모두에 연결된 경우)
      const uniqueTasks = [];
      const seenTaskIds = new Set();
      
      for (const task of allTasks) {
        if (!seenTaskIds.has(task.id)) {
          uniqueTasks.push(task);
          seenTaskIds.add(task.id);
        }
      }
      
      // 5. 요약 정보와 함께 반환
      const tasksWithSummary = uniqueTasks.map(task => ({
        ...task,
        summary: {
          isOverdue: this.isTaskOverdue(task),
          daysRemaining: this.calculateDaysRemaining(task),
          completionPercentage: this.calculateCompletionPercentage(task)
        }
      }));

      return {
        success: true,
        tasks: tasksWithSummary,
        total: tasksWithSummary.length,
        statusBreakdown: this.getStatusBreakdown(tasksWithSummary),
        message: `PRD "${prdId}"에 연결된 작업 ${tasksWithSummary.length}개 조회 완료`
      };

    } catch (error) {
      throw new Error(`PRD별 작업 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 작업의 추가 연결들을 업데이트
   * @param {string} taskId - 작업 ID
   * @param {Array} additionalConnections - 추가 연결 배열
   * @returns {Object} 성공 여부
   */
  async updateAdditionalConnections(taskId, additionalConnections) {
    await this.ensureInitialized();
    
    try {
      // 기존 추가 연결들 삭제 (직접 컬럼 제외)
      await this.storage.deleteAdditionalConnections(taskId);
      
      // 새 연결들 추가
      for (const connection of additionalConnections) {
        if (connection.entity_type && connection.entity_id) {
          await this.storage.addAdditionalConnection(taskId, connection);
        }
      }
      
      return {
        success: true,
        message: '추가 연결 업데이트 완료'
      };
    } catch (error) {
      throw new Error(`추가 연결 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 작업의 추가 연결들을 조회
   * @param {string} taskId - 작업 ID
   * @returns {Array} 추가 연결 배열
   */
  async getAdditionalConnections(taskId) {
    await this.ensureInitialized();
    
    try {
      return await this.storage.getAdditionalConnections(taskId);
    } catch (error) {
      throw new Error(`추가 연결 조회 실패: ${error.message}`);
    }
  }
}