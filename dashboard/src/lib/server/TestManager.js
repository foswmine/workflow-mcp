/**
 * Test Manager - 테스트 관리 클래스 (Dashboard용)
 * 테스트 케이스의 생성, 조회, 수정, 삭제 및 비즈니스 로직 처리
 */

import { v4 as uuidv4 } from 'uuid';
import { SQLiteTestStorage } from './SQLiteTestStorage.js';

// Test 상태 enum
export const TestCaseStatus = {
  DRAFT: 'draft',
  READY: 'ready',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated'
};

// 우선순위 enum
export const TestCasePriority = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

// Test 유형 enum
export const TestCaseType = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  SYSTEM: 'system',
  ACCEPTANCE: 'acceptance',
  REGRESSION: 'regression'
};

// Test 실행 상태 enum
export const TestExecutionStatus = {
  PASS: 'pass',
  FAIL: 'fail',
  BLOCKED: 'blocked',
  SKIPPED: 'skipped',
  PENDING: 'pending'
};

export class TestManager {
  constructor() {
    this.storage = new SQLiteTestStorage();
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
   */
  normalizePriority(priority) {
    if (!priority) return TestCasePriority.MEDIUM;
    const normalized = priority.toLowerCase();
    switch (normalized) {
      case 'high':
        return TestCasePriority.HIGH;
      case 'medium':
        return TestCasePriority.MEDIUM;
      case 'low':
        return TestCasePriority.LOW;
      default:
        return TestCasePriority.MEDIUM;
    }
  }

  /**
   * Test 상태 정규화
   */
  normalizeStatus(status) {
    if (!status) return TestCaseStatus.DRAFT;
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'ready': return TestCaseStatus.READY;
      case 'active': return TestCaseStatus.ACTIVE;
      case 'deprecated': return TestCaseStatus.DEPRECATED;
      case 'draft': 
      default: return TestCaseStatus.DRAFT;
    }
  }

  /**
   * Test 유형 정규화
   */
  normalizeType(type) {
    if (!type) return TestCaseType.UNIT;
    const normalized = type.toLowerCase();
    switch (normalized) {
      case 'integration': return TestCaseType.INTEGRATION;
      case 'system': return TestCaseType.SYSTEM;
      case 'acceptance': return TestCaseType.ACCEPTANCE;
      case 'regression': return TestCaseType.REGRESSION;
      case 'unit':
      default: return TestCaseType.UNIT;
    }
  }

  /**
   * 새로운 Test Case 생성
   */
  async createTestCase(testCaseData) {
    await this.ensureInitialized();
    try {
      const testCase = {
        id: uuidv4(),
        title: testCaseData.title,
        description: testCaseData.description || '',
        type: this.normalizeType(testCaseData.type),
        status: this.normalizeStatus(testCaseData.status),
        priority: this.normalizePriority(testCaseData.priority),
        task_id: testCaseData.task_id || null,
        design_id: testCaseData.design_id || null,
        prd_id: testCaseData.prd_id || null,
        preconditions: testCaseData.preconditions || '',
        test_steps: testCaseData.test_steps || [],
        expected_result: testCaseData.expected_result || '',
        test_data: testCaseData.test_data || {},
        estimated_duration: testCaseData.estimated_duration || 0,
        complexity: testCaseData.complexity || 'Medium',
        automation_status: testCaseData.automation_status || 'manual',
        tags: testCaseData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: testCaseData.created_by || 'dashboard',
        version: 1
      };

      // 필수 필드 검증
      if (!testCase.title || testCase.title.trim().length === 0) {
        throw new Error('제목은 필수입니다');
      }

      // Test Case 저장
      await this.storage.saveTestCase(testCase);

      return {
        success: true,
        testCase: await this.storage.getTestCase(testCase.id),
        message: `Test Case "${testCase.title}" 생성 완료`
      };

    } catch (error) {
      throw new Error(`Test Case 생성 실패: ${error.message}`);
    }
  }

  /**
   * Test Case 목록 조회
   */
  async listTestCases(status = null, type = null, sortBy = null) {
    await this.ensureInitialized();
    try {
      const allTestCases = await this.storage.listAllTestCases();
      
      let filteredTestCases = allTestCases;
      if (status) {
        filteredTestCases = filteredTestCases.filter(testCase => testCase.status === status);
      }
      if (type) {
        filteredTestCases = filteredTestCases.filter(testCase => testCase.type === type);
      }

      // 정렬 처리
      if (sortBy) {
        filteredTestCases.sort((a, b) => {
          switch (sortBy) {
            case 'created_desc':
              return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            case 'created_asc':
              return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            case 'updated_desc':
              return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
            case 'updated_asc':
              return new Date(a.updated_at || 0) - new Date(b.updated_at || 0);
            case 'title_asc':
              return (a.title || '').localeCompare(b.title || '', 'ko-KR');
            case 'title_desc':
              return (b.title || '').localeCompare(a.title || '', 'ko-KR');
            default:
              return 0;
          }
        });
      }

      // 요약 정보와 함께 반환
      const testCasesWithSummary = filteredTestCases.map(testCase => ({
        ...testCase,
        summary: {
          pass_rate: testCase.total_executions > 0 
            ? Math.round((testCase.passed_executions / testCase.total_executions) * 100)
            : 0,
          execution_count: testCase.total_executions,
          last_status: testCase.last_execution_status
        }
      }));

      return {
        success: true,
        testCases: testCasesWithSummary,
        total: testCasesWithSummary.length,
        statusBreakdown: this.getStatusBreakdown(testCasesWithSummary),
        message: `Test Case ${testCasesWithSummary.length}개 조회 완료`
      };

    } catch (error) {
      throw new Error(`Test Case 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 특정 Test Case 상세 조회
   */
  async getTestCase(testCaseId) {
    await this.ensureInitialized();
    try {
      const testCase = await this.storage.getTestCase(testCaseId);
      if (!testCase) {
        throw new Error(`Test Case를 찾을 수 없습니다: ${testCaseId}`);
      }

      return {
        success: true,
        testCase: testCase,
        message: `Test Case "${testCase.title}" 조회 완료`
      };

    } catch (error) {
      throw new Error(`Test Case 조회 실패: ${error.message}`);
    }
  }

  /**
   * Test Case 업데이트
   */
  async updateTestCase(testCaseId, updates) {
    await this.ensureInitialized();
    try {
      const existingTestCase = await this.storage.getTestCase(testCaseId);
      if (!existingTestCase) {
        throw new Error(`Test Case를 찾을 수 없습니다: ${testCaseId}`);
      }

      // 업데이트된 Test Case 생성
      const updatedTestCase = {
        ...existingTestCase,
        ...updates,
        id: testCaseId, // ID는 변경 불가
        updated_at: new Date().toISOString(),
        version: existingTestCase.version + 1
      };

      // 검증
      if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
        throw new Error('제목은 비어있을 수 없습니다');
      }

      // 저장
      await this.storage.saveTestCase(updatedTestCase);


      return {
        success: true,
        testCase: await this.storage.getTestCase(testCaseId),
        message: `Test Case "${updatedTestCase.title}" 업데이트 완료`
      };

    } catch (error) {
      throw new Error(`Test Case 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * Test Case 삭제
   */
  async deleteTestCase(testCaseId) {
    await this.ensureInitialized();
    try {
      const existingTestCase = await this.storage.getTestCase(testCaseId);
      if (!existingTestCase) {
        throw new Error(`Test Case를 찾을 수 없습니다: ${testCaseId}`);
      }

      // 삭제 수행
      const deleted = await this.storage.deleteTestCase(testCaseId);
      if (!deleted) {
        throw new Error('Test Case 삭제 중 오류가 발생했습니다');
      }

      return {
        success: true,
        deletedTestCase: existingTestCase.title,
        message: `Test Case "${existingTestCase.title}"이 성공적으로 삭제되었습니다`
      };

    } catch (error) {
      throw new Error(`Test Case 삭제 실패: ${error.message}`);
    }
  }

  /**
   * Test Case 실행
   */
  async executeTestCase(testCaseId, executionData) {
    await this.ensureInitialized();
    try {
      const testCase = await this.storage.getTestCase(testCaseId);
      if (!testCase) {
        throw new Error(`Test Case를 찾을 수 없습니다: ${testCaseId}`);
      }

      const execution = {
        id: uuidv4(),
        test_case_id: testCaseId,
        execution_date: executionData.execution_date || new Date().toISOString(),
        executed_by: executionData.executed_by || 'dashboard',
        environment: executionData.environment || 'development',
        status: executionData.status || 'pending',
        actual_result: executionData.actual_result || '',
        notes: executionData.notes || '',
        defects_found: executionData.defects_found || [],
        actual_duration: executionData.actual_duration || 0,
        started_at: executionData.started_at || null,
        completed_at: executionData.completed_at || null,
        attachments: executionData.attachments || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.storage.saveTestExecution(execution);

      return {
        success: true,
        execution: execution,
        message: `Test Case 실행 완료 - 결과: ${execution.status}`
      };

    } catch (error) {
      throw new Error(`Test Case 실행 실패: ${error.message}`);
    }
  }

  /**
   * Test execution 목록 조회
   */
  async getTestExecutions(testCaseId) {
    await this.ensureInitialized();
    try {
      const executions = await this.storage.getTestExecutions(testCaseId);
      
      return {
        success: true,
        executions: executions,
        total: executions.length,
        message: `Test 실행 기록 ${executions.length}개 조회 완료`
      };

    } catch (error) {
      throw new Error(`Test 실행 기록 조회 실패: ${error.message}`);
    }
  }


  /**
   * 상태별 분류
   */
  getStatusBreakdown(testCases) {
    const breakdown = {};
    Object.values(TestCaseStatus).forEach(status => {
      breakdown[status] = testCases.filter(testCase => testCase.status === status).length;
    });
    return breakdown;
  }
}