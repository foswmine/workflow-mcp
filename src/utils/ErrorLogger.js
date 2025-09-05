/**
 * Error Logger - 에러 로깅 및 추적 유틸리티
 * 에러 발생 시 로그 저장 및 분석 기능 제공
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ErrorLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../data/logs');
    this.errorLogFile = path.join(this.logDir, 'errors.json');
    this.maxLogEntries = 1000; // 최대 로그 엔트리 수
    this.initializeLogger();
  }

  async initializeLogger() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      
      // 로그 파일이 없으면 생성
      try {
        await fs.access(this.errorLogFile);
      } catch (error) {
        await fs.writeFile(this.errorLogFile, JSON.stringify({ logs: [] }, null, 2));
      }
    } catch (error) {
      console.error('Failed to initialize ErrorLogger:', error);
    }
  }

  /**
   * 에러 로그 기록
   * @param {string} toolName - 에러가 발생한 도구명
   * @param {string} errorMessage - 에러 메시지
   * @param {Object} context - 에러 발생 컨텍스트
   */
  async logError(toolName, errorMessage, context = {}) {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      toolName: toolName,
      message: errorMessage,
      context: context,
      stack: context.stack || new Error().stack,
      severity: this.determineSeverity(errorMessage),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
      }
    };

    try {
      await this.saveErrorLog(errorEntry);
      console.error(`Error logged [${errorEntry.id}]: ${toolName} - ${errorMessage}`);
    } catch (saveError) {
      console.error('Failed to save error log:', saveError);
    }
  }

  /**
   * 에러 로그 저장
   */
  async saveErrorLog(errorEntry) {
    try {
      const logData = JSON.parse(await fs.readFile(this.errorLogFile, 'utf8'));
      
      // 새 에러 추가
      logData.logs.unshift(errorEntry);
      
      // 최대 엔트리 수 제한
      if (logData.logs.length > this.maxLogEntries) {
        logData.logs = logData.logs.slice(0, this.maxLogEntries);
      }
      
      await fs.writeFile(this.errorLogFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  /**
   * 에러 로그 조회
   * @param {Object} filters - 필터 조건
   * @returns {Array} 에러 로그 목록
   */
  async getErrorLogs(filters = {}) {
    try {
      const logData = JSON.parse(await fs.readFile(this.errorLogFile, 'utf8'));
      let logs = logData.logs;

      // 필터 적용
      if (filters.toolName) {
        logs = logs.filter(log => log.toolName === filters.toolName);
      }
      
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }
      
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        logs = logs.filter(log => new Date(log.timestamp) >= fromDate);
      }
      
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }

      return logs;
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  /**
   * 에러 통계 조회
   * @returns {Object} 에러 통계 데이터
   */
  async getErrorStatistics() {
    try {
      const logs = await this.getErrorLogs();
      
      const stats = {
        totalErrors: logs.length,
        errorsByTool: {},
        errorsBySeverity: {},
        recentErrors: logs.slice(0, 10),
        errorTrends: this.calculateErrorTrends(logs)
      };

      // 도구별 에러 수
      logs.forEach(log => {
        stats.errorsByTool[log.toolName] = (stats.errorsByTool[log.toolName] || 0) + 1;
      });

      // 심각도별 에러 수
      logs.forEach(log => {
        stats.errorsBySeverity[log.severity] = (stats.errorsBySeverity[log.severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get error statistics:', error);
      return {
        totalErrors: 0,
        errorsByTool: {},
        errorsBySeverity: {},
        recentErrors: [],
        errorTrends: []
      };
    }
  }

  /**
   * 심각한 에러 알림 확인
   * @returns {Array} 알림이 필요한 에러 목록
   */
  async getCriticalErrorAlerts() {
    const recentLogs = await this.getErrorLogs({
      severity: 'critical',
      limit: 10
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCriticalErrors = recentLogs.filter(log => 
      new Date(log.timestamp) > oneHourAgo
    );

    return recentCriticalErrors.map(log => ({
      id: log.id,
      toolName: log.toolName,
      message: log.message,
      timestamp: log.timestamp,
      alertType: 'critical_error'
    }));
  }

  /**
   * 로그 파일 정리
   */
  async cleanupLogs() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const logs = await this.getErrorLogs();
      
      const recentLogs = logs.filter(log => 
        new Date(log.timestamp) > thirtyDaysAgo
      );

      await fs.writeFile(this.errorLogFile, JSON.stringify({ logs: recentLogs }, null, 2));
      
      console.log(`Log cleanup completed. Kept ${recentLogs.length} recent logs.`);
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }

  // 유틸리티 메서드들

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  determineSeverity(errorMessage) {
    const criticalKeywords = ['fatal', 'critical', 'security', 'corruption'];
    const warningKeywords = ['validation', 'timeout', 'network'];
    
    const lowerMessage = errorMessage.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    } else if (warningKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'warning';
    }
    
    return 'error';
  }

  calculateErrorTrends(logs) {
    // 최근 7일간의 일별 에러 수
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayErrors = logs.filter(log => 
        log.timestamp.startsWith(dateString)
      ).length;
      
      trends.push({
        date: dateString,
        errorCount: dayErrors
      });
    }
    
    return trends;
  }
}