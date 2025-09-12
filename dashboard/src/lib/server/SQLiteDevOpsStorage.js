/**
 * SQLite DevOps Storage - DevOps 데이터를 위한 SQLite 저장소
 * Environment, Deployment, Incident, System Health 관리
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { DATABASE_PATH } from './config.js';

export class SQLiteDevOpsStorage {
  constructor() {
    this.dbPath = DATABASE_PATH;
    this.db = null;
    console.log('SQLite DevOps Storage - Database path:', this.dbPath);
  }

  async getDatabase() {
    if (!this.db) {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      await this.db.exec('PRAGMA foreign_keys = ON');
    }
    return this.db;
  }

  async initialize() {
    await this.getDatabase();
    console.log(`✅ SQLiteDevOpsStorage initialized: ${this.dbPath}`);
  }

  // =============================================
  // Environment Management
  // =============================================

  /**
   * Environment 저장
   * @param {Object} environment - 저장할 환경 데이터
   */
  async createEnvironment(environment) {
    console.log('🔄 SQLiteDevOpsStorage.createEnvironment called:', environment.id, environment.name);
    const db = await this.getDatabase();
    
    await db.run(`
      INSERT INTO environments (
        id, name, environment_type, description, url, status, tags, project_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      environment.id,
      environment.name,
      environment.environment_type,
      environment.description,
      environment.url,
      environment.status,
      JSON.stringify(environment.tags),
      environment.project_id,
      environment.created_at,
      environment.updated_at
    ]);

    console.log('✅ Environment saved successfully:', environment.id);
    return environment;
  }

  /**
   * Environment 목록 조회
   * @param {string} environment_type - 환경 타입 필터
   * @param {string} status - 상태 필터
   * @param {string} project_id - 프로젝트 ID 필터
   */
  async listEnvironments(environment_type = null, status = null, project_id = null) {
    const db = await this.getDatabase();
    
    let query = 'SELECT * FROM environments WHERE 1=1';
    const params = [];

    if (environment_type) {
      query += ' AND environment_type = ?';
      params.push(environment_type);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (project_id) {
      query += ' AND project_id = ?';
      params.push(project_id);
    }

    query += ' ORDER BY created_at DESC';
    
    const environments = await db.all(query, params);
    
    return environments.map(env => ({
      ...env,
      tags: env.tags ? JSON.parse(env.tags) : []
    }));
  }

  /**
   * Environment 조회
   * @param {string} environmentId - Environment ID
   */
  async getEnvironment(environmentId) {
    const db = await this.getDatabase();
    
    const environment = await db.get('SELECT * FROM environments WHERE id = ?', [environmentId]);
    
    if (!environment) {
      return null;
    }

    return {
      ...environment,
      tags: environment.tags ? JSON.parse(environment.tags) : []
    };
  }

  /**
   * Environment 업데이트
   * @param {string} environmentId - Environment ID
   * @param {Object} updates - 업데이트할 데이터
   */
  async updateEnvironment(environmentId, updates) {
    const db = await this.getDatabase();
    
    const updateFields = [];
    const params = [];

    if (updates.name !== undefined) { updateFields.push('name = ?'); params.push(updates.name); }
    if (updates.description !== undefined) { updateFields.push('description = ?'); params.push(updates.description); }
    if (updates.url !== undefined) { updateFields.push('url = ?'); params.push(updates.url); }
    if (updates.status !== undefined) { updateFields.push('status = ?'); params.push(updates.status); }
    if (updates.tags !== undefined) { updateFields.push('tags = ?'); params.push(JSON.stringify(updates.tags)); }
    if (updates.updated_at !== undefined) { updateFields.push('updated_at = ?'); params.push(updates.updated_at); }

    params.push(environmentId);

    if (updateFields.length === 0) {
      return await this.getEnvironment(environmentId);
    }

    const sql = `UPDATE environments SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.run(sql, params);

    return await this.getEnvironment(environmentId);
  }

  // =============================================
  // Deployment Management
  // =============================================

  /**
   * Deployment 저장
   * @param {Object} deployment - 저장할 배포 데이터
   */
  async createDeployment(deployment) {
    console.log('🔄 SQLiteDevOpsStorage.createDeployment called:', deployment.id, deployment.title);
    const db = await this.getDatabase();
    
    await db.run(`
      INSERT INTO deployments (
        id, title, description, environment_id, version, deployment_type, status, 
        deployment_config, scheduled_at, rollback_version, project_id, tags, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deployment.id,
      deployment.title,
      deployment.description,
      deployment.environment_id,
      deployment.version,
      deployment.deployment_type,
      deployment.status,
      JSON.stringify(deployment.deployment_config),
      deployment.scheduled_at,
      deployment.rollback_version,
      deployment.project_id,
      JSON.stringify(deployment.tags),
      deployment.notes,
      deployment.created_at,
      deployment.updated_at
    ]);

    console.log('✅ Deployment saved successfully:', deployment.id);
    return deployment;
  }

  /**
   * Deployment 목록 조회
   * @param {string} environment_id - 환경 ID 필터
   * @param {string} status - 상태 필터
   * @param {string} deployment_type - 배포 타입 필터
   * @param {string} project_id - 프로젝트 ID 필터
   * @param {string} sort_by - 정렬 방식
   */
  async listDeployments(environment_id = null, status = null, deployment_type = null, project_id = null, sort_by = 'scheduled_desc') {
    const db = await this.getDatabase();
    
    let query = 'SELECT * FROM deployments WHERE 1=1';
    const params = [];

    if (environment_id) {
      query += ' AND environment_id = ?';
      params.push(environment_id);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (deployment_type) {
      query += ' AND deployment_type = ?';
      params.push(deployment_type);
    }
    
    if (project_id) {
      query += ' AND project_id = ?';
      params.push(project_id);
    }

    // 정렬 조건 추가
    switch (sort_by) {
      case 'scheduled_asc':
        query += ' ORDER BY scheduled_at ASC';
        break;
      case 'created_desc':
        query += ' ORDER BY created_at DESC';
        break;
      case 'created_asc':
        query += ' ORDER BY created_at ASC';
        break;
      case 'status':
        query += ' ORDER BY status, scheduled_at DESC';
        break;
      default: // 'scheduled_desc'
        query += ' ORDER BY scheduled_at DESC';
    }
    
    const deployments = await db.all(query, params);
    
    return deployments.map(deployment => ({
      ...deployment,
      tags: deployment.tags ? JSON.parse(deployment.tags) : [],
      deployment_config: deployment.deployment_config ? JSON.parse(deployment.deployment_config) : {}
    }));
  }

  /**
   * Deployment 조회
   * @param {string} deploymentId - Deployment ID
   */
  async getDeployment(deploymentId) {
    const db = await this.getDatabase();
    
    const deployment = await db.get('SELECT * FROM deployments WHERE id = ?', [deploymentId]);
    
    if (!deployment) {
      return null;
    }

    return {
      ...deployment,
      tags: deployment.tags ? JSON.parse(deployment.tags) : [],
      deployment_config: deployment.deployment_config ? JSON.parse(deployment.deployment_config) : {}
    };
  }

  /**
   * Deployment 업데이트
   * @param {string} deploymentId - Deployment ID
   * @param {Object} updates - 업데이트할 데이터
   */
  async updateDeployment(deploymentId, updates) {
    console.log('🔄 SQLiteDevOpsStorage.updateDeployment called:', deploymentId, Object.keys(updates));
    const db = await this.getDatabase();
    
    // 기존 배포 정보 조회
    const existing = await this.getDeployment(deploymentId);
    if (!existing) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }
    
    // 업데이트할 필드들 준비
    const updateFields = [];
    const updateValues = [];
    
    // 각 필드별로 업데이트 처리
    Object.keys(updates).forEach(key => {
      if (key !== 'id') { // ID는 업데이트하지 않음
        updateFields.push(`${key} = ?`);
        
        // JSON 타입 필드들은 문자열로 변환
        if (key === 'tags' || key === 'deployment_config') {
          updateValues.push(JSON.stringify(updates[key]));
        } else {
          updateValues.push(updates[key]);
        }
      }
    });
    
    updateValues.push(deploymentId);
    
    const updateQuery = `
      UPDATE deployments 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await db.run(updateQuery, updateValues);
    
    console.log('✅ Deployment updated successfully:', deploymentId);
    
    // 업데이트된 배포 정보 반환
    return await this.getDeployment(deploymentId);
  }

  // =============================================
  // Incident Management
  // =============================================

  /**
   * Incident 저장
   * @param {Object} incident - 저장할 인시던트 데이터
   */
  async createIncident(incident) {
    console.log('🔄 SQLiteDevOpsStorage.createIncident called:', incident.id, incident.title);
    const db = await this.getDatabase();
    
    await db.run(`
      INSERT INTO incidents (
        id, title, description, severity, incident_type, status, 
        affected_systems, environment_id, project_id, tags, detected_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      incident.id,
      incident.title,
      incident.description,
      incident.severity,
      incident.incident_type,
      incident.status,
      JSON.stringify(incident.affected_services), // maps to affected_systems column
      incident.environment_id,
      incident.project_id,
      JSON.stringify(incident.tags),
      incident.detected_at,
      incident.created_at,
      incident.updated_at
    ]);

    console.log('✅ Incident saved successfully:', incident.id);
    return incident;
  }

  /**
   * Incident 목록 조회
   * @param {string} severity - 심각도 필터
   * @param {string} status - 상태 필터
   * @param {string} incident_type - 인시던트 타입 필터
   * @param {string} environment_id - 환경 ID 필터
   * @param {string} sort_by - 정렬 방식
   */
  async listIncidents(severity = null, status = null, incident_type = null, environment_id = null, sort_by = 'created_desc') {
    const db = await this.getDatabase();
    
    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (incident_type) {
      query += ' AND incident_type = ?';
      params.push(incident_type);
    }
    
    if (environment_id) {
      query += ' AND environment_id = ?';
      params.push(environment_id);
    }

    // 정렬 조건 추가
    switch (sort_by) {
      case 'created_asc':
        query += ' ORDER BY created_at ASC';
        break;
      case 'updated_desc':
        query += ' ORDER BY updated_at DESC';
        break;
      case 'severity':
        query += ' ORDER BY CASE severity WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, created_at DESC';
        break;
      case 'status':
        query += ' ORDER BY status, created_at DESC';
        break;
      default: // 'created_desc'
        query += ' ORDER BY created_at DESC';
    }
    
    const incidents = await db.all(query, params);
    
    return incidents.map(incident => ({
      ...incident,
      affected_services: incident.affected_systems ? JSON.parse(incident.affected_systems) : [],
      tags: incident.tags ? JSON.parse(incident.tags) : []
    }));
  }

  /**
   * 개별 Incident 조회
   * @param {string} incidentId - Incident ID
   * @returns {Object} Incident 상세 정보
   */
  async getIncident(incidentId) {
    console.log('🔄 SQLiteDevOpsStorage.getIncident called:', incidentId);
    const db = await this.getDatabase();
    
    const incident = await db.get('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    
    if (!incident) {
      return null;
    }
    
    return {
      ...incident,
      affected_services: incident.affected_systems ? JSON.parse(incident.affected_systems) : [],
      tags: incident.tags ? JSON.parse(incident.tags) : []
    };
  }

  /**
   * Incident 업데이트
   * @param {string} incidentId - Incident ID  
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Object} 업데이트된 Incident
   */
  async updateIncident(incidentId, updates) {
    console.log('🔄 SQLiteDevOpsStorage.updateIncident called:', incidentId, updates);
    const db = await this.getDatabase();
    
    // 업데이트할 필드들 구성
    const updateFields = [];
    const updateParams = [];
    
    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(updates.title);
    }
    
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(updates.description);
    }
    
    if (updates.severity !== undefined) {
      updateFields.push('severity = ?');
      updateParams.push(updates.severity);
    }
    
    if (updates.incident_type !== undefined) {
      updateFields.push('incident_type = ?');
      updateParams.push(updates.incident_type);
    }
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(updates.status);
    }
    
    
    if (updates.affected_services !== undefined) {
      updateFields.push('affected_systems = ?');
      updateParams.push(JSON.stringify(updates.affected_services));
    }
    
    if (updates.tags !== undefined) {
      updateFields.push('tags = ?');
      updateParams.push(JSON.stringify(updates.tags));
    }
    
    if (updates.environment_id !== undefined) {
      updateFields.push('environment_id = ?');
      updateParams.push(updates.environment_id);
    }
    
    if (updates.updated_at !== undefined) {
      updateFields.push('updated_at = ?');
      updateParams.push(updates.updated_at);
    }
    
    // ID 파라미터 추가
    updateParams.push(incidentId);
    
    if (updateFields.length === 0) {
      throw new Error('업데이트할 필드가 없습니다');
    }
    
    const updateQuery = `UPDATE incidents SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.run(updateQuery, updateParams);
    
    // 업데이트된 인시던트 반환
    return await this.getIncident(incidentId);
  }

  /**
   * Incident 삭제
   * @param {string} incidentId - Incident ID
   */
  async deleteIncident(incidentId) {
    console.log('🔄 SQLiteDevOpsStorage.deleteIncident called:', incidentId);
    const db = await this.getDatabase();
    
    await db.run('DELETE FROM incidents WHERE id = ?', [incidentId]);
  }

  // =============================================
  // System Health
  // =============================================

  /**
   * 시스템 상태 조회
   * @param {string} environment_id - 환경 ID 필터
   * @param {boolean} include_details - 상세 메트릭 포함 여부
   */
  async getSystemHealth(environment_id = null, include_details = false) {
    const db = await this.getDatabase();
    
    // 기본 시스템 상태 정보
    let healthQuery = 'SELECT * FROM system_health WHERE 1=1';
    const healthParams = [];

    if (environment_id) {
      healthQuery += ' AND environment_id = ?';
      healthParams.push(environment_id);
    }

    healthQuery += ' ORDER BY checked_at DESC LIMIT 10';
    
    const healthRecords = await db.all(healthQuery, healthParams);

    // 상세 정보가 필요한 경우 추가 메트릭 조회
    let detailMetrics = null;
    if (include_details) {
      let metricsQuery = 'SELECT * FROM performance_metrics WHERE 1=1';
      const metricsParams = [];

      if (environment_id) {
        metricsQuery += ' AND environment_id = ?';
        metricsParams.push(environment_id);
      }

      metricsQuery += ' ORDER BY timestamp DESC LIMIT 50';
      
      detailMetrics = await db.all(metricsQuery, metricsParams);
    }

    // 시스템 상태 요약
    const summary = {
      total_environments: 0,
      healthy_environments: 0,
      warning_environments: 0,
      critical_environments: 0,
      last_check: null
    };

    if (healthRecords.length > 0) {
      summary.last_check = healthRecords[0].checked_at;
      
      // 환경별 상태 계산
      const envStatuses = {};
      healthRecords.forEach(record => {
        const envId = record.environment_id || 'global';
        if (!envStatuses[envId] || record.checked_at > envStatuses[envId].checked_at) {
          envStatuses[envId] = record;
        }
      });

      summary.total_environments = Object.keys(envStatuses).length;
      Object.values(envStatuses).forEach(status => {
        switch (status.status) {
          case 'healthy':
            summary.healthy_environments++;
            break;
          case 'warning':
            summary.warning_environments++;
            break;
          case 'critical':
            summary.critical_environments++;
            break;
        }
      });
    }

    return {
      summary,
      recent_checks: healthRecords,
      detailed_metrics: detailMetrics
    };
  }
}