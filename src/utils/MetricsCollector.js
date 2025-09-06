/**
 * Metrics Collector - 성능 메트릭 수집 유틸리티
 * 도구 사용량, 응답 시간, 에러율 등을 추적
 */

export class MetricsCollector {
  constructor() {
    this.metrics = {
      toolUsage: new Map(),
      responseTimes: [],
      errorCount: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
  }

  /**
   * 도구 사용량 기록
   * @param {string} toolName - 도구 이름
   * @param {number} duration - 실행 시간 (ms)
   * @param {string} status - 실행 상태 (success/error)
   */
  recordToolUsage(toolName, duration, status) {
    if (!this.metrics.toolUsage.has(toolName)) {
      this.metrics.toolUsage.set(toolName, {
        count: 0,
        totalDuration: 0,
        successCount: 0,
        errorCount: 0,
        avgDuration: 0
      });
    }

    const tool = this.metrics.toolUsage.get(toolName);
    tool.count++;
    tool.totalDuration += duration;
    
    if (status === 'success') {
      tool.successCount++;
    } else {
      tool.errorCount++;
      this.metrics.errorCount++;
    }
    
    tool.avgDuration = tool.totalDuration / tool.count;
    this.metrics.totalRequests++;

    // 응답 시간 기록 (최근 100개만 유지)
    this.metrics.responseTimes.push(duration);
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }

    // console.log(`Metric recorded: ${toolName} - ${duration}ms - ${status}`);
  }

  /**
   * 현재 메트릭 요약 조회
   * @returns {Object} 메트릭 요약
   */
  getMetricsSummary() {
    const uptime = Date.now() - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    const toolStats = {};
    for (const [toolName, stats] of this.metrics.toolUsage) {
      toolStats[toolName] = {
        ...stats,
        successRate: stats.count > 0 ? (stats.successCount / stats.count * 100).toFixed(2) : 0
      };
    }

    return {
      uptime: Math.floor(uptime / 1000), // seconds
      totalRequests: this.metrics.totalRequests,
      errorCount: this.metrics.errorCount,
      errorRate: this.metrics.totalRequests > 0 
        ? (this.metrics.errorCount / this.metrics.totalRequests * 100).toFixed(2)
        : 0,
      avgResponseTime: Math.round(avgResponseTime),
      toolStats: toolStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 성능 임계값 확인
   * @returns {Object} 알림이 필요한 항목들
   */
  checkPerformanceThresholds() {
    const alerts = [];
    const summary = this.getMetricsSummary();

    // 평균 응답 시간이 500ms 초과
    if (summary.avgResponseTime > 500) {
      alerts.push({
        type: 'performance',
        message: `Average response time is ${summary.avgResponseTime}ms (threshold: 500ms)`,
        severity: 'warning'
      });
    }

    // 에러율이 5% 초과
    if (parseFloat(summary.errorRate) > 5) {
      alerts.push({
        type: 'error_rate',
        message: `Error rate is ${summary.errorRate}% (threshold: 5%)`,
        severity: 'warning'
      });
    }

    // 개별 도구 성능 확인
    for (const [toolName, stats] of Object.entries(summary.toolStats)) {
      if (parseFloat(stats.successRate) < 95) {
        alerts.push({
          type: 'tool_reliability',
          message: `Tool ${toolName} success rate is ${stats.successRate}% (threshold: 95%)`,
          severity: 'warning'
        });
      }
    }

    return alerts;
  }

  /**
   * 메트릭 데이터 리셋
   */
  resetMetrics() {
    this.metrics = {
      toolUsage: new Map(),
      responseTimes: [],
      errorCount: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
    // console.log('Metrics reset completed');
  }
}