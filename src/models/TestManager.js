/**
 * TestManager - Test Case and Test Execution Management
 * 
 * Manages test cases, test executions, and test defects with full CRUD operations.
 * Supports test-task linking, test reporting, and analytics.
 * 
 * Key Features:
 * - Test case lifecycle management
 * - Test execution tracking
 * - Defect management
 * - Test coverage analysis
 * - Integration with tasks, PRDs, and designs
 */

import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestManager {
    constructor() {
        const dbPath = path.resolve(__dirname, '../../data/workflow.db');
        this.dbPath = dbPath;
        this.db = null;
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

    // Test case priorities and statuses
    TestCasePriority = {
        HIGH: 'High',
        MEDIUM: 'Medium', 
        LOW: 'Low'
    };
    
    TestCaseStatus = {
        DRAFT: 'draft',
        READY: 'ready',
        ACTIVE: 'active',
        DEPRECATED: 'deprecated'
    };
    
    TestCaseType = {
        UNIT: 'unit',
        INTEGRATION: 'integration',
        SYSTEM: 'system',
        ACCEPTANCE: 'acceptance',
        REGRESSION: 'regression'
    };
    
    TestExecutionStatus = {
        PASS: 'pass',
        FAIL: 'fail',
        BLOCKED: 'blocked',
        SKIPPED: 'skipped',
        PENDING: 'pending'
    };
    
    DefectSeverity = {
        CRITICAL: 'Critical',
        HIGH: 'High',
        MEDIUM: 'Medium',
        LOW: 'Low'
    };

    // =============================================
    // Test Case Management
    // =============================================

    /**
     * Create a new test case
     */
    async createTestCase(testCaseData) {
        try {
            const db = await this.getDatabase();
            const id = testCaseData.id || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            // Normalize and validate data
            const normalizedData = {
                id,
                title: testCaseData.title || '',
                description: testCaseData.description || '',
                type: this.normalizeTestType(testCaseData.type),
                status: this.normalizeTestStatus(testCaseData.status),
                priority: this.normalizePriority(testCaseData.priority),
                task_id: testCaseData.task_id || null,
                design_id: testCaseData.design_id || null,
                prd_id: testCaseData.prd_id || null,
                preconditions: testCaseData.preconditions || '',
                test_steps: JSON.stringify(testCaseData.test_steps || []),
                expected_result: testCaseData.expected_result || '',
                test_data: JSON.stringify(testCaseData.test_data || {}),
                estimated_duration: testCaseData.estimated_duration || 0,
                complexity: testCaseData.complexity || 'Medium',
                automation_status: testCaseData.automation_status || 'manual',
                tags: JSON.stringify(testCaseData.tags || []),
                created_at: now,
                updated_at: now,
                created_by: testCaseData.created_by || 'system',
                version: 1
            };

            // Validate required fields
            if (!normalizedData.title.trim()) {
                throw new Error('테스트 케이스 제목은 필수입니다.');
            }

            const result = await db.run(`
                INSERT INTO test_cases (
                    id, title, description, type, status, priority,
                    task_id, design_id, prd_id, preconditions, test_steps,
                    expected_result, test_data, estimated_duration, complexity,
                    automation_status, tags, created_at, updated_at, created_by, version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                normalizedData.id, normalizedData.title, normalizedData.description,
                normalizedData.type, normalizedData.status, normalizedData.priority,
                normalizedData.task_id, normalizedData.design_id, normalizedData.prd_id,
                normalizedData.preconditions, normalizedData.test_steps,
                normalizedData.expected_result, normalizedData.test_data,
                normalizedData.estimated_duration, normalizedData.complexity,
                normalizedData.automation_status, normalizedData.tags,
                normalizedData.created_at, normalizedData.updated_at,
                normalizedData.created_by, normalizedData.version
            ]);

            if (result.changes === 1) {
                const getResult = await this.getTestCase(id);
                if (getResult.success) {
                    return {
                        success: true,
                        testCase: getResult.testCase,
                        message: `테스트 케이스 "${normalizedData.title}" 생성 완료`
                    };
                } else {
                    return getResult;
                }
            } else {
                throw new Error('테스트 케이스 생성에 실패했습니다.');
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 케이스 생성 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Get test case by ID
     */
    async getTestCase(testCaseId) {
        try {
            const db = await this.getDatabase();
            const testCase = await db.get(`
                SELECT tc.*,
                       COUNT(te.id) AS total_executions,
                       COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
                       COUNT(CASE WHEN te.status = 'fail' THEN 1 END) AS failed_executions,
                       MAX(te.execution_date) AS last_execution_date,
                       (SELECT status FROM test_executions WHERE test_case_id = tc.id ORDER BY execution_date DESC LIMIT 1) AS last_execution_status
                FROM test_cases tc
                LEFT JOIN test_executions te ON tc.id = te.test_case_id
                WHERE tc.id = ?
                GROUP BY tc.id
            `, [testCaseId]);
            
            if (!testCase) {
                return {
                    success: false,
                    error: '테스트 케이스를 찾을 수 없습니다.',
                    message: `ID "${testCaseId}"에 해당하는 테스트 케이스가 없습니다.`
                };
            }

            // Parse JSON fields
            testCase.test_steps = this.parseJSON(testCase.test_steps, []);
            testCase.test_data = this.parseJSON(testCase.test_data, {});
            testCase.tags = this.parseJSON(testCase.tags, []);

            // Add execution analytics
            testCase.analytics = {
                total_executions: testCase.total_executions || 0,
                passed_executions: testCase.passed_executions || 0,
                failed_executions: testCase.failed_executions || 0,
                pass_rate: testCase.total_executions > 0 
                    ? Math.round((testCase.passed_executions / testCase.total_executions) * 100)
                    : 0,
                last_execution_date: testCase.last_execution_date,
                last_execution_status: testCase.last_execution_status
            };

            return {
                success: true,
                testCase,
                message: `테스트 케이스 "${testCase.title}" 조회 완료`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 케이스 조회 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * List test cases with optional filtering
     */
    async listTestCases(options = {}) {
        try {
            const db = await this.getDatabase();
            let query = `
                SELECT tc.*,
                       COUNT(te.id) AS total_executions,
                       COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
                       MAX(te.execution_date) AS last_execution_date,
                       (SELECT status FROM test_executions WHERE test_case_id = tc.id ORDER BY execution_date DESC LIMIT 1) AS last_execution_status
                FROM test_cases tc
                LEFT JOIN test_executions te ON tc.id = te.test_case_id
            `;

            const conditions = [];
            const params = [];

            // Apply filters
            if (options.status) {
                conditions.push('tc.status = ?');
                params.push(options.status);
            }
            if (options.type) {
                conditions.push('tc.type = ?');
                params.push(options.type);
            }
            if (options.priority) {
                conditions.push('tc.priority = ?');
                params.push(options.priority);
            }
            if (options.task_id) {
                conditions.push('tc.task_id = ?');
                params.push(options.task_id);
            }
            if (options.design_id) {
                conditions.push('tc.design_id = ?');
                params.push(options.design_id);
            }
            if (options.prd_id) {
                conditions.push('tc.prd_id = ?');
                params.push(options.prd_id);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' GROUP BY tc.id ORDER BY tc.updated_at DESC';

            const testCases = await db.all(query, params);

            // Process each test case
            testCases.forEach(testCase => {
                testCase.test_steps = this.parseJSON(testCase.test_steps, []);
                testCase.test_data = this.parseJSON(testCase.test_data, {});
                testCase.tags = this.parseJSON(testCase.tags, []);
                
                testCase.analytics = {
                    total_executions: testCase.total_executions || 0,
                    passed_executions: testCase.passed_executions || 0,
                    pass_rate: testCase.total_executions > 0 
                        ? Math.round((testCase.passed_executions / testCase.total_executions) * 100)
                        : 0,
                    last_execution_status: testCase.last_execution_status
                };
            });

            // Generate summary statistics
            const statusBreakdown = testCases.reduce((acc, testCase) => {
                acc[testCase.status] = (acc[testCase.status] || 0) + 1;
                return acc;
            }, {});

            const typeBreakdown = testCases.reduce((acc, testCase) => {
                acc[testCase.type] = (acc[testCase.type] || 0) + 1;
                return acc;
            }, {});

            return {
                success: true,
                testCases,
                total: testCases.length,
                statusBreakdown,
                typeBreakdown,
                message: `테스트 케이스 ${testCases.length}개 조회 완료`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 케이스 목록 조회 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Update test case
     */
    async updateTestCase(testCaseId, updates) {
        try {
            // Check if test case exists
            const existingResult = await this.getTestCase(testCaseId);
            if (!existingResult.success) {
                return existingResult;
            }

            const now = new Date().toISOString();
            const updateFields = [];
            const params = [];

            // Build dynamic update query
            if (updates.title !== undefined) {
                updateFields.push('title = ?');
                params.push(updates.title);
            }
            if (updates.description !== undefined) {
                updateFields.push('description = ?');
                params.push(updates.description);
            }
            if (updates.type !== undefined) {
                updateFields.push('type = ?');
                params.push(this.normalizeTestType(updates.type));
            }
            if (updates.status !== undefined) {
                updateFields.push('status = ?');
                params.push(this.normalizeTestStatus(updates.status));
            }
            if (updates.priority !== undefined) {
                updateFields.push('priority = ?');
                params.push(this.normalizePriority(updates.priority));
            }
            if (updates.task_id !== undefined) {
                updateFields.push('task_id = ?');
                params.push(updates.task_id);
            }
            if (updates.design_id !== undefined) {
                updateFields.push('design_id = ?');
                params.push(updates.design_id);
            }
            if (updates.prd_id !== undefined) {
                updateFields.push('prd_id = ?');
                params.push(updates.prd_id);
            }
            if (updates.preconditions !== undefined) {
                updateFields.push('preconditions = ?');
                params.push(updates.preconditions);
            }
            if (updates.test_steps !== undefined) {
                updateFields.push('test_steps = ?');
                params.push(JSON.stringify(updates.test_steps));
            }
            if (updates.expected_result !== undefined) {
                updateFields.push('expected_result = ?');
                params.push(updates.expected_result);
            }
            if (updates.test_data !== undefined) {
                updateFields.push('test_data = ?');
                params.push(JSON.stringify(updates.test_data));
            }
            if (updates.estimated_duration !== undefined) {
                updateFields.push('estimated_duration = ?');
                params.push(updates.estimated_duration);
            }
            if (updates.complexity !== undefined) {
                updateFields.push('complexity = ?');
                params.push(updates.complexity);
            }
            if (updates.automation_status !== undefined) {
                updateFields.push('automation_status = ?');
                params.push(updates.automation_status);
            }
            if (updates.tags !== undefined) {
                updateFields.push('tags = ?');
                params.push(JSON.stringify(updates.tags));
            }

            // Always update timestamp and version
            updateFields.push('updated_at = ?');
            params.push(now);
            updateFields.push('version = version + 1');

            params.push(testCaseId);

            const db = await this.getDatabase();
            const query = `UPDATE test_cases SET ${updateFields.join(', ')} WHERE id = ?`;
            const result = await db.run(query, params);

            if (result.changes === 1) {
                const getResult = await this.getTestCase(testCaseId);
                if (getResult.success) {
                    return {
                        success: true,
                        testCase: getResult.testCase,
                        message: `테스트 케이스 업데이트 완료`
                    };
                } else {
                    return getResult;
                }
            } else {
                throw new Error('테스트 케이스 업데이트에 실패했습니다.');
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 케이스 업데이트 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Delete test case
     */
    async deleteTestCase(testCaseId) {
        try {
            // Check if test case exists
            const existingResult = await this.getTestCase(testCaseId);
            if (!existingResult.success) {
                return existingResult;
            }

            const testCaseTitle = existingResult.testCase.title;

            // Check if there are executions - warn user
            const db = await this.getDatabase();
            const executionCount = await db.get(
                'SELECT COUNT(*) as count FROM test_executions WHERE test_case_id = ?', 
                [testCaseId]
            );

            if (executionCount.count > 0) {
                console.warn(`Warning: Deleting test case with ${executionCount.count} executions`);
            }

            const result = await db.run('DELETE FROM test_cases WHERE id = ?', [testCaseId]);

            if (result.changes === 1) {
                return {
                    success: true,
                    deletedTestCase: testCaseTitle,
                    message: `테스트 케이스 "${testCaseTitle}"이 성공적으로 삭제되었습니다`
                };
            } else {
                throw new Error('테스트 케이스 삭제에 실패했습니다.');
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 케이스 삭제 중 오류가 발생했습니다.'
            };
        }
    }

    // =============================================
    // Test Execution Management
    // =============================================

    /**
     * Execute a test case and record results
     */
    async executeTestCase(testCaseId, executionData) {
        try {
            // Verify test case exists
            const testCaseResult = await this.getTestCase(testCaseId);
            if (!testCaseResult.success) {
                return testCaseResult;
            }

            const id = executionData.id || `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();

            const normalizedData = {
                id,
                test_case_id: testCaseId,
                execution_date: executionData.execution_date || now,
                executed_by: executionData.executed_by || 'system',
                environment: executionData.environment || 'development',
                status: this.normalizeExecutionStatus(executionData.status),
                actual_result: executionData.actual_result || '',
                notes: executionData.notes || '',
                defects_found: JSON.stringify(executionData.defects_found || []),
                actual_duration: executionData.actual_duration || 0,
                started_at: executionData.started_at || null,
                completed_at: executionData.completed_at || null,
                attachments: JSON.stringify(executionData.attachments || []),
                created_at: now,
                updated_at: now
            };

            const db = await this.getDatabase();
            const result = await db.run(`
                INSERT INTO test_executions (
                    id, test_case_id, execution_date, executed_by, environment,
                    status, actual_result, notes, defects_found, actual_duration,
                    started_at, completed_at, attachments, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                normalizedData.id, normalizedData.test_case_id,
                normalizedData.execution_date, normalizedData.executed_by,
                normalizedData.environment, normalizedData.status,
                normalizedData.actual_result, normalizedData.notes,
                normalizedData.defects_found, normalizedData.actual_duration,
                normalizedData.started_at, normalizedData.completed_at,
                normalizedData.attachments, normalizedData.created_at,
                normalizedData.updated_at
            ]);

            if (result.changes === 1) {
                const getResult = await this.getTestExecution(id);
                if (getResult.success) {
                    return {
                        success: true,
                        execution: getResult.execution,
                        message: `테스트 실행 완료 - 결과: ${normalizedData.status}`
                    };
                } else {
                    return getResult;
                }
            } else {
                throw new Error('테스트 실행 기록에 실패했습니다.');
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 실행 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Get test execution by ID
     */
    async getTestExecution(executionId) {
        try {
            const db = await this.getDatabase();
            const execution = await db.get(`
                SELECT te.*, tc.title AS test_case_title, tc.type AS test_case_type
                FROM test_executions te
                LEFT JOIN test_cases tc ON te.test_case_id = tc.id
                WHERE te.id = ?
            `, [executionId]);
            
            if (!execution) {
                return {
                    success: false,
                    error: '테스트 실행 기록을 찾을 수 없습니다.',
                    message: `ID "${executionId}"에 해당하는 실행 기록이 없습니다.`
                };
            }

            // Parse JSON fields
            execution.defects_found = this.parseJSON(execution.defects_found, []);
            execution.attachments = this.parseJSON(execution.attachments, []);

            return {
                success: true,
                execution,
                message: `테스트 실행 기록 조회 완료`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 실행 기록 조회 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Get test execution history for a test case
     */
    async getTestExecutions(testCaseId, options = {}) {
        try {
            const db = await this.getDatabase();
            let query = `
                SELECT te.*, tc.title AS test_case_title
                FROM test_executions te
                LEFT JOIN test_cases tc ON te.test_case_id = tc.id
                WHERE te.test_case_id = ?
            `;

            const params = [testCaseId];

            if (options.environment) {
                query += ' AND te.environment = ?';
                params.push(options.environment);
            }

            query += ' ORDER BY te.execution_date DESC';

            if (options.limit) {
                query += ' LIMIT ?';
                params.push(options.limit);
            }

            const executions = await db.all(query, params);

            executions.forEach(execution => {
                execution.defects_found = this.parseJSON(execution.defects_found, []);
                execution.attachments = this.parseJSON(execution.attachments, []);
            });

            return {
                success: true,
                executions,
                total: executions.length,
                message: `테스트 실행 기록 ${executions.length}개 조회 완료`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 실행 기록 조회 중 오류가 발생했습니다.'
            };
        }
    }

    // =============================================
    // Test Reporting and Analytics
    // =============================================

    /**
     * Get test summary report
     */
    async getTestSummary(options = {}) {
        try {
            const db = await this.getDatabase();
            // Overall statistics
            const overall = await db.get(`
                SELECT 
                    COUNT(DISTINCT tc.id) AS total_test_cases,
                    COUNT(DISTINCT CASE WHEN tc.status = 'active' THEN tc.id END) AS active_test_cases,
                    COUNT(DISTINCT te.id) AS total_executions,
                    COUNT(DISTINCT CASE WHEN te.status = 'pass' THEN te.id END) AS passed_executions,
                    COUNT(DISTINCT CASE WHEN te.status = 'fail' THEN te.id END) AS failed_executions,
                    COUNT(DISTINCT td.id) AS total_defects,
                    COUNT(DISTINCT CASE WHEN td.status = 'open' THEN td.id END) AS open_defects
                FROM test_cases tc
                LEFT JOIN test_executions te ON tc.id = te.test_case_id
                LEFT JOIN test_defects td ON tc.id = td.test_case_id
            `);

            // Test case breakdown by status
            const statusBreakdown = await db.all(`
                SELECT status, COUNT(*) as count
                FROM test_cases
                GROUP BY status
            `);

            // Test case breakdown by type
            const typeBreakdown = await db.all(`
                SELECT type, COUNT(*) as count
                FROM test_cases
                GROUP BY type
            `);

            // Recent executions
            const recentExecutions = await db.all(`
                SELECT te.*, tc.title AS test_case_title
                FROM test_executions te
                LEFT JOIN test_cases tc ON te.test_case_id = tc.id
                ORDER BY te.execution_date DESC
                LIMIT 10
            `);

            // Calculate pass rate
            const passRate = overall.total_executions > 0 
                ? Math.round((overall.passed_executions / overall.total_executions) * 100)
                : 0;

            return {
                success: true,
                summary: {
                    overview: {
                        ...overall,
                        pass_rate: passRate,
                        generated_at: new Date().toISOString()
                    },
                    breakdowns: {
                        status: statusBreakdown,
                        type: typeBreakdown
                    },
                    recent_executions: recentExecutions
                },
                message: '테스트 요약 보고서 생성 완료'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 요약 보고서 생성 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Get test coverage by task
     */
    async getTestCoverage(options = {}) {
        try {
            const db = await this.getDatabase();
            const coverage = await db.all(`
                SELECT 
                    t.id AS task_id,
                    t.title AS task_title,
                    t.status AS task_status,
                    COUNT(tc.id) AS test_cases_count,
                    COUNT(CASE WHEN tc.status = 'active' THEN 1 END) AS active_test_cases,
                    COUNT(DISTINCT te.id) AS total_executions,
                    COUNT(CASE WHEN te.status = 'pass' THEN 1 END) AS passed_executions,
                    CASE 
                        WHEN COUNT(tc.id) > 0 THEN 
                            ROUND((COUNT(CASE WHEN tc.status = 'active' THEN 1 END) * 100.0) / COUNT(tc.id), 2)
                        ELSE 0 
                    END AS test_readiness_percentage
                FROM tasks t
                LEFT JOIN test_cases tc ON t.id = tc.task_id
                LEFT JOIN test_executions te ON tc.id = te.test_case_id
                GROUP BY t.id
                HAVING COUNT(tc.id) > 0
                ORDER BY test_readiness_percentage DESC
            `);

            return {
                success: true,
                coverage,
                total: coverage.length,
                message: `테스트 커버리지 분석 완료 - ${coverage.length}개 작업 분석`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트 커버리지 분석 중 오류가 발생했습니다.'
            };
        }
    }

    // =============================================
    // Test-Task Linking
    // =============================================

    /**
     * Link test case to task
     */
    async linkTestToTask(testCaseId, taskId) {
        try {
            const updateResult = await this.updateTestCase(testCaseId, { task_id: taskId });
            
            if (updateResult.success) {
                return {
                    success: true,
                    message: `테스트 케이스가 작업에 연결되었습니다`
                };
            } else {
                return updateResult;
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '테스트-작업 연결 중 오류가 발생했습니다.'
            };
        }
    }

    /**
     * Get tests by task
     */
    async getTestsByTask(taskId) {
        try {
            return await this.listTestCases({ task_id: taskId });
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '작업별 테스트 조회 중 오류가 발생했습니다.'
            };
        }
    }

    // =============================================
    // Utility Methods
    // =============================================

    normalizePriority(priority) {
        if (!priority) return this.TestCasePriority.MEDIUM;
        
        const normalized = priority.toLowerCase();
        switch (normalized) {
            case 'high': case 'urgent': case 'critical':
                return this.TestCasePriority.HIGH;
            case 'low': case 'minor':
                return this.TestCasePriority.LOW;
            case 'medium': case 'normal': default:
                return this.TestCasePriority.MEDIUM;
        }
    }

    normalizeTestStatus(status) {
        if (!status) return this.TestCaseStatus.DRAFT;
        
        const normalized = status.toLowerCase();
        switch (normalized) {
            case 'ready': return this.TestCaseStatus.READY;
            case 'active': return this.TestCaseStatus.ACTIVE;
            case 'deprecated': case 'inactive': return this.TestCaseStatus.DEPRECATED;
            case 'draft': default: return this.TestCaseStatus.DRAFT;
        }
    }

    normalizeTestType(type) {
        if (!type) return this.TestCaseType.UNIT;
        
        const normalized = type.toLowerCase();
        switch (normalized) {
            case 'integration': return this.TestCaseType.INTEGRATION;
            case 'system': case 'e2e': return this.TestCaseType.SYSTEM;
            case 'acceptance': case 'uat': return this.TestCaseType.ACCEPTANCE;
            case 'regression': return this.TestCaseType.REGRESSION;
            case 'unit': default: return this.TestCaseType.UNIT;
        }
    }

    normalizeExecutionStatus(status) {
        if (!status) return this.TestExecutionStatus.PENDING;
        
        const normalized = status.toLowerCase();
        switch (normalized) {
            case 'pass': case 'passed': case 'success': return this.TestExecutionStatus.PASS;
            case 'fail': case 'failed': case 'failure': return this.TestExecutionStatus.FAIL;
            case 'blocked': return this.TestExecutionStatus.BLOCKED;
            case 'skipped': case 'skip': return this.TestExecutionStatus.SKIPPED;
            case 'pending': default: return this.TestExecutionStatus.PENDING;
        }
    }

    parseJSON(jsonString, fallback = null) {
        try {
            return JSON.parse(jsonString || 'null') || fallback;
        } catch {
            return fallback;
        }
    }
}

export default TestManager;