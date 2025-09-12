/**
 * DevOps Manager - DevOps 관리 클래스 
 * 환경, 배포, 인시던트, 시스템 상태 관리
 */

import { v4 as uuidv4 } from 'uuid';
import { SQLiteDevOpsStorage } from './SQLiteDevOpsStorage.js';

// Environment 타입 enum
export const EnvironmentType = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TESTING: 'testing'
};

// Environment 상태 enum
export const EnvironmentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance'
};

// Deployment 타입 enum
export const DeploymentType = {
  BLUE_GREEN: 'blue_green',
  ROLLING: 'rolling',
  CANARY: 'canary',
  HOTFIX: 'hotfix'
};

// Deployment 상태 enum
export const DeploymentStatus = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back'
};

// Incident 심각도 enum
export const IncidentSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Incident 타입 enum
export const IncidentType = {
  OUTAGE: 'outage',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  DATA: 'data',
  DEPLOYMENT: 'deployment'
};

// Incident 상태 enum
export const IncidentStatus = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  IDENTIFIED: 'identified',
  MONITORING: 'monitoring',
  RESOLVED: 'resolved'
};

export class DevOpsManager {
  constructor() {
    this.storage = new SQLiteDevOpsStorage();
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.storage.initialize();
      this.initialized = true;
    }
  }

  // =============================================
  // Environment Management
  // =============================================

  /**
   * 새로운 Environment 생성
   * @param {Object} environmentData - Environment 기본 데이터
   * @returns {Object} 생성된 Environment 객체
   */
  async createEnvironment(environmentData) {
    await this.ensureInitialized();

    const environment = {
      id: uuidv4(),
      name: environmentData.name,
      environment_type: environmentData.environment_type,
      description: environmentData.description || null,
      url: environmentData.url || null,
      status: environmentData.status || EnvironmentStatus.ACTIVE,
      tags: environmentData.tags || [],
      project_id: environmentData.project_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await this.storage.createEnvironment(environment);
    return {
      success: true,
      environment: result,
      message: `환경 '${environment.name}' 생성 완료`
    };
  }

  /**
   * Environment 목록 조회
   * @param {string} environment_type - 환경 타입 필터
   * @param {string} status - 상태 필터  
   * @param {string} project_id - 프로젝트 ID 필터
   * @returns {Array} Environment 목록
   */
  async listEnvironments(environment_type = null, status = null, project_id = null) {
    await this.ensureInitialized();

    const environments = await this.storage.listEnvironments(environment_type, status, project_id);
    
    return {
      success: true,
      environments,
      total: environments.length,
      message: `환경 ${environments.length}개 조회`
    };
  }

  /**
   * Environment 상세 조회
   * @param {string} environmentId - Environment ID
   * @returns {Object} Environment 상세 정보
   */
  async getEnvironmentStatus(environmentId) {
    await this.ensureInitialized();

    const environment = await this.storage.getEnvironment(environmentId);
    if (!environment) {
      return {
        success: false,
        error: `환경 ID ${environmentId}를 찾을 수 없습니다`
      };
    }

    return {
      success: true,
      environment,
      message: `환경 '${environment.name}' 조회 완료`
    };
  }

  /**
   * Environment 업데이트
   * @param {string} environmentId - Environment ID
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Object} 업데이트 결과
   */
  async updateEnvironment(environmentId, updates) {
    await this.ensureInitialized();

    const existing = await this.storage.getEnvironment(environmentId);
    if (!existing) {
      return {
        success: false,
        error: `환경 ID ${environmentId}를 찾을 수 없습니다`
      };
    }

    const updatedEnvironment = await this.storage.updateEnvironment(environmentId, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      environment: updatedEnvironment,
      message: `환경 '${existing.name}' 업데이트 완료`
    };
  }

  // =============================================
  // Deployment Management
  // =============================================

  /**
   * 새로운 Deployment 생성
   * @param {Object} deploymentData - Deployment 기본 데이터
   * @returns {Object} 생성된 Deployment 객체
   */
  async createDeployment(deploymentData) {
    await this.ensureInitialized();

    const deployment = {
      id: uuidv4(),
      title: deploymentData.title,
      description: deploymentData.description,
      environment_id: deploymentData.environment_id,
      version: deploymentData.version,
      deployment_type: deploymentData.deployment_type || DeploymentType.ROLLING,
      status: deploymentData.status || DeploymentStatus.PLANNED,
      deployment_config: deploymentData.deployment_config || {},
      scheduled_at: deploymentData.scheduled_at || new Date().toISOString(),
      rollback_version: deploymentData.rollback_version || null,
      project_id: deploymentData.project_id || null,
      tags: deploymentData.tags || [],
      notes: deploymentData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await this.storage.createDeployment(deployment);
    return {
      success: true,
      deployment: result,
      message: `배포 '${deployment.title}' 생성 완료`
    };
  }

  /**
   * Deployment 목록 조회
   * @param {string} environment_id - 환경 ID 필터
   * @param {string} status - 상태 필터
   * @param {string} deployment_type - 배포 타입 필터
   * @param {string} project_id - 프로젝트 ID 필터
   * @param {string} sort_by - 정렬 방식
   * @returns {Array} Deployment 목록
   */
  async listDeployments(environment_id = null, status = null, deployment_type = null, project_id = null, sort_by = 'scheduled_desc') {
    await this.ensureInitialized();

    const deployments = await this.storage.listDeployments(environment_id, status, deployment_type, project_id, sort_by);
    
    return {
      success: true,
      deployments,
      total: deployments.length,
      message: `배포 ${deployments.length}개 조회`
    };
  }

  /**
   * Deployment 상세 조회
   * @param {string} deploymentId - Deployment ID
   * @returns {Object} Deployment 상세 정보
   */
  async getDeployment(deploymentId) {
    await this.ensureInitialized();

    const deployment = await this.storage.getDeployment(deploymentId);
    if (!deployment) {
      return {
        success: false,
        error: `배포 ID ${deploymentId}를 찾을 수 없습니다`
      };
    }

    return {
      success: true,
      deployment,
      message: `배포 '${deployment.title}' 조회 완료`
    };
  }

  /**
   * Deployment 업데이트
   * @param {string} deploymentId - Deployment ID
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Object} 업데이트 결과
   */
  async updateDeployment(deploymentId, updates) {
    await this.ensureInitialized();

    const existing = await this.storage.getDeployment(deploymentId);
    if (!existing) {
      return {
        success: false,
        error: `배포 ID ${deploymentId}를 찾을 수 없습니다`
      };
    }

    const updatedDeployment = await this.storage.updateDeployment(deploymentId, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      deployment: updatedDeployment,
      message: `배포 '${existing.title}' 업데이트 완료`
    };
  }

  // =============================================
  // Incident Management
  // =============================================

  /**
   * 새로운 Incident 생성
   * @param {Object} incidentData - Incident 기본 데이터
   * @returns {Object} 생성된 Incident 객체
   */
  async createIncident(incidentData) {
    await this.ensureInitialized();

    const incident = {
      id: uuidv4(),
      title: incidentData.title,
      description: incidentData.description,
      severity: incidentData.severity,
      incident_type: incidentData.incident_type,
      status: incidentData.status || IncidentStatus.OPEN,
      affected_services: incidentData.affected_services || [],
      environment_id: incidentData.environment_id || null,
      project_id: incidentData.project_id || null,
      tags: incidentData.tags || [],
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await this.storage.createIncident(incident);
    return {
      success: true,
      incident: result,
      message: `인시던트 '${incident.title}' 생성 완료`
    };
  }

  /**
   * Incident 목록 조회
   * @param {string} severity - 심각도 필터
   * @param {string} status - 상태 필터
   * @param {string} incident_type - 인시던트 타입 필터
   * @param {string} environment_id - 환경 ID 필터
   * @param {string} sort_by - 정렬 방식
   * @returns {Array} Incident 목록
   */
  async listIncidents(severity = null, status = null, incident_type = null, environment_id = null, sort_by = 'created_desc') {
    await this.ensureInitialized();

    const incidents = await this.storage.listIncidents(severity, status, incident_type, environment_id, sort_by);
    
    return {
      success: true,
      incidents,
      total: incidents.length,
      message: `인시던트 ${incidents.length}개 조회`
    };
  }

  /**
   * Incident 상세 조회
   * @param {string} incidentId - Incident ID
   * @returns {Object} Incident 상세 정보
   */
  async getIncident(incidentId) {
    await this.ensureInitialized();

    const incident = await this.storage.getIncident(incidentId);
    if (!incident) {
      return {
        success: false,
        error: `인시던트 ID ${incidentId}를 찾을 수 없습니다`
      };
    }

    return {
      success: true,
      incident,
      message: `인시던트 '${incident.title}' 조회 완료`
    };
  }

  /**
   * Incident 업데이트
   * @param {string} incidentId - Incident ID
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Object} 업데이트 결과
   */
  async updateIncident(incidentId, updates) {
    await this.ensureInitialized();

    const existing = await this.storage.getIncident(incidentId);
    if (!existing) {
      return {
        success: false,
        error: `인시던트 ID ${incidentId}를 찾을 수 없습니다`
      };
    }

    const updatedIncident = await this.storage.updateIncident(incidentId, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      incident: updatedIncident,
      message: `인시던트 '${existing.title}' 업데이트 완료`
    };
  }

  /**
   * Incident 삭제
   * @param {string} incidentId - Incident ID
   * @returns {Object} 삭제 결과
   */
  async deleteIncident(incidentId) {
    await this.ensureInitialized();

    const existing = await this.storage.getIncident(incidentId);
    if (!existing) {
      return {
        success: false,
        error: `인시던트 ID ${incidentId}를 찾을 수 없습니다`
      };
    }

    await this.storage.deleteIncident(incidentId);

    return {
      success: true,
      message: `인시던트 '${existing.title}' 삭제 완료`
    };
  }

  // =============================================
  // System Health
  // =============================================

  /**
   * 시스템 상태 조회
   * @param {string} environment_id - 환경 ID 필터 (선택적)
   * @param {boolean} include_details - 상세 메트릭 포함 여부
   * @returns {Object} 시스템 상태 정보
   */
  async getSystemHealth(environment_id = null, include_details = false) {
    await this.ensureInitialized();

    const systemHealth = await this.storage.getSystemHealth(environment_id, include_details);
    
    return {
      success: true,
      system_health: systemHealth,
      message: environment_id ? `환경 ${environment_id} 시스템 상태 조회` : '전체 시스템 상태 조회'
    };
  }
}