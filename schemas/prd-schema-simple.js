/**
 * Simplified PRD Schema for Dashboard-centric approach
 * Matches the actual database structure used by the dashboard
 */

import Joi from 'joi';

// Simplified PRD Schema based on dashboard structure
export const DashboardPRDSchema = Joi.object({
  // Required fields
  id: Joi.string().optional().description('PRD 고유 식별자 (자동생성)'),
  title: Joi.string().required().min(1).max(500).description('PRD 제목'),
  description: Joi.string().allow('', null).description('프로젝트 설명'),
  
  // Simple arrays as JSON strings (matching dashboard format)
  requirements: Joi.array().items(Joi.string()).default([]).description('요구사항 목록'),
  
  // Simple enum values
  priority: Joi.string().valid('low', 'medium', 'high').default('medium').description('우선순위'),
  status: Joi.string().valid('active', 'draft', 'inactive', 'completed', 'in_review').default('draft').description('상태'),
  
  // Optional fields that can be null (matching database)
  version: Joi.string().allow(null).default('1.0.0').description('PRD 버전'),
  created_by: Joi.string().allow(null).description('작성자'),
  last_modified_by: Joi.string().allow(null).description('최종 수정자'),
  business_objective: Joi.string().allow(null, '').description('비즈니스 목표'),
  target_users: Joi.string().allow(null).description('대상 사용자 (JSON 문자열)'),
  success_criteria: Joi.string().allow(null).description('성공 기준 (JSON 문자열)'),
  epics: Joi.string().allow(null).description('Epic 목록 (JSON 문자열)'),
  user_stories: Joi.string().allow(null).description('사용자 스토리 (JSON 문자열)'),
  technical_constraints: Joi.string().allow(null).description('기술적 제약사항 (JSON 문자열)'),
  assumptions: Joi.string().allow(null).description('가정사항 (JSON 문자열)'),
  risks: Joi.string().allow(null).description('위험 요소 (JSON 문자열)'),
  timeline: Joi.string().allow(null).description('일정 (JSON 문자열)'),
  quality_gates: Joi.string().allow(null).description('품질 게이트 (JSON 문자열)'),
  tags: Joi.string().allow(null).description('태그 (JSON 문자열)'),
  attachments: Joi.string().allow(null).description('첨부파일 (JSON 문자열)'),
  
  // Timestamps (handled by database)
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional()
}).description('Dashboard-compatible PRD Schema');

// 업데이트용 스키마 (모든 필드 optional)
export const DashboardPRDUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(500).optional(),
  description: Joi.string().allow('', null).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  status: Joi.string().valid('active', 'draft', 'inactive', 'completed', 'in_review').optional(),
  version: Joi.string().allow(null).optional(),
  created_by: Joi.string().allow(null).optional(),
  last_modified_by: Joi.string().allow(null).optional(),
  business_objective: Joi.string().allow(null, '').optional(),
  target_users: Joi.string().allow(null).optional(),
  success_criteria: Joi.string().allow(null).optional(),
  epics: Joi.string().allow(null).optional(),
  user_stories: Joi.string().allow(null).optional(),
  technical_constraints: Joi.string().allow(null).optional(),
  assumptions: Joi.string().allow(null).optional(),
  risks: Joi.string().allow(null).optional(),
  timeline: Joi.string().allow(null).optional(),
  quality_gates: Joi.string().allow(null).optional(),
  tags: Joi.string().allow(null).optional(),
  attachments: Joi.string().allow(null).optional()
}).min(1).description('PRD Update Schema');

// 검증 함수
export const validateDashboardPRD = (prdData) => {
  const { error, value } = DashboardPRDSchema.validate(prdData, { 
    abortEarly: false,
    allowUnknown: true,  // 대시보드 호환성을 위해 unknown fields 허용
    stripUnknown: false
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    return { isValid: false, errors };
  }
  
  return { isValid: true, value };
};

export const validateDashboardPRDUpdate = (updateData) => {
  const { error, value } = DashboardPRDUpdateSchema.validate(updateData, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    return { isValid: false, errors };
  }
  
  return { isValid: true, value };
};