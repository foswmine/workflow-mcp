/**
 * PRD JSON Schema Definition using Joi
 * Defines the structure and validation rules for Product Requirements Documents
 */

import Joi from 'joi';

// 요구사항 유형 enum
const RequirementTypes = {
  FUNCTIONAL: 'functional',
  NON_FUNCTIONAL: 'non_functional', 
  TECHNICAL: 'technical',
  BUSINESS: 'business',
  USER_STORY: 'user_story'
};

// 우선순위 enum  
const PriorityLevels = {
  HIGH: 'High',
  MEDIUM: 'Medium', 
  LOW: 'Low'
};

// MoSCoW 우선순위
const MoscowPriority = {
  MUST: 'Must',
  SHOULD: 'Should', 
  COULD: 'Could',
  WONT: 'Won\'t'
};

// PRD 상태
const PRDStatus = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved', 
  IN_DEVELOPMENT: 'in_development',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 개별 요구사항 스키마
export const RequirementSchema = Joi.object({
  id: Joi.string().required().description('요구사항 고유 ID'),
  title: Joi.string().required().min(5).max(200).description('요구사항 제목'),
  description: Joi.string().required().min(10).max(2000).description('상세 설명'),
  type: Joi.string().valid(...Object.values(RequirementTypes)).required()
    .description('요구사항 유형'),
  priority: Joi.string().valid(...Object.values(PriorityLevels)).required()
    .description('우선순위'),
  moscow: Joi.string().valid(...Object.values(MoscowPriority)).required()
    .description('MoSCoW 분류'),
  acceptanceCriteria: Joi.array().items(Joi.string().min(5)).min(1)
    .description('허용 기준 목록'),
  dependencies: Joi.array().items(Joi.string()).default([])
    .description('의존성 요구사항 ID 목록'),
  estimatedHours: Joi.number().min(0).default(0)
    .description('예상 개발 시간'),
  tags: Joi.array().items(Joi.string()).default([])
    .description('태그 목록')
}).description('개별 요구사항');

// 사용자 스토리 스키마
export const UserStorySchema = Joi.object({
  id: Joi.string().required().description('사용자 스토리 ID'),
  title: Joi.string().required().min(5).max(200).description('스토리 제목'),
  asA: Joi.string().required().description('사용자 역할'),
  iWant: Joi.string().required().description('원하는 기능'),
  soThat: Joi.string().required().description('목적/가치'),
  acceptanceCriteria: Joi.array().items(Joi.string().min(5)).min(1)
    .description('허용 기준'),
  priority: Joi.string().valid(...Object.values(PriorityLevels)).required(),
  storyPoints: Joi.number().min(1).max(21).description('스토리 포인트'),
  relatedRequirements: Joi.array().items(Joi.string()).default([])
    .description('관련 요구사항 ID 목록')
}).description('사용자 스토리');

// Epic 스키마
export const EpicSchema = Joi.object({
  id: Joi.string().required().description('Epic ID'),
  title: Joi.string().required().min(5).max(200).description('Epic 제목'),
  description: Joi.string().required().min(20).max(1000).description('Epic 설명'),
  businessValue: Joi.string().required().min(10).max(500)
    .description('비즈니스 가치'),
  successMetrics: Joi.array().items(Joi.string()).min(1)
    .description('성공 지표 목록'),
  userStories: Joi.array().items(Joi.string()).default([])
    .description('포함된 사용자 스토리 ID 목록'),
  estimatedHours: Joi.number().min(0).default(0)
    .description('전체 예상 시간')
}).description('Epic');

// 메인 PRD 스키마
export const PRDSchema = Joi.object({
  // 기본 정보
  id: Joi.string().required().description('PRD 고유 식별자'),
  title: Joi.string().required().min(5).max(200).description('PRD 제목'),
  description: Joi.string().required().min(20).max(2000)
    .description('프로젝트 개요'),
  version: Joi.string().default('1.0.0').description('PRD 버전'),
  status: Joi.string().valid(...Object.values(PRDStatus)).default(PRDStatus.DRAFT)
    .description('PRD 상태'),
  
  // 메타데이터
  createdAt: Joi.date().default(() => new Date()).description('생성일시'),
  updatedAt: Joi.date().default(() => new Date()).description('수정일시'),
  createdBy: Joi.string().default('system').description('작성자'),
  lastModifiedBy: Joi.string().default('system').description('최종 수정자'),
  
  // 프로젝트 상세 정보
  businessObjective: Joi.string().required().min(20).max(1000)
    .description('비즈니스 목표'),
  targetUsers: Joi.array().items(Joi.string()).min(1)
    .description('대상 사용자 그룹'),
  successCriteria: Joi.array().items(Joi.string()).min(1)
    .description('성공 기준 목록'),
  
  // 기능 요구사항
  epics: Joi.array().items(EpicSchema).default([])
    .description('Epic 목록'),
  requirements: Joi.array().items(RequirementSchema).min(1)
    .description('상세 요구사항 목록'), 
  userStories: Joi.array().items(UserStorySchema).default([])
    .description('사용자 스토리 목록'),
    
  // 기술적 제약사항
  technicalConstraints: Joi.array().items(Joi.string()).default([])
    .description('기술적 제약사항'),
  assumptions: Joi.array().items(Joi.string()).default([])
    .description('가정사항'),
  risks: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      description: Joi.string().required(),
      probability: Joi.string().valid('Low', 'Medium', 'High').required(),
      impact: Joi.string().valid('Low', 'Medium', 'High').required(),
      mitigation: Joi.string().required()
    })
  ).default([]).description('위험 요소'),
  
  // 일정 및 예산
  timeline: Joi.object({
    startDate: Joi.date().description('시작 예정일'),
    endDate: Joi.date().description('완료 예정일'),
    phases: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        deliverables: Joi.array().items(Joi.string()).default([])
      })
    ).default([])
  }).default({}),
  
  // 품질 기준
  qualityGates: Joi.array().items(
    Joi.object({
      phase: Joi.string().required(),
      criteria: Joi.array().items(Joi.string()).required(),
      metrics: Joi.array().items(Joi.string()).default([])
    })
  ).default([]).description('품질 게이트'),
  
  // 추가 메타데이터
  tags: Joi.array().items(Joi.string()).default([])
    .description('분류 태그'),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      url: Joi.string().uri().required(),
      description: Joi.string().default('')
    })
  ).default([]).description('첨부파일 목록')
  
}).description('Product Requirements Document');

// 스키마 유효성 검사 헬퍼 함수
export const validatePRD = (prdData) => {
  const { error, value } = PRDSchema.validate(prdData, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
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

// 요구사항만 검증하는 헬퍼 함수
export const validateRequirement = (requirementData) => {
  const { error, value } = RequirementSchema.validate(requirementData, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { isValid: false, errors };
  }
  
  return { isValid: true, value };
};

// Export enums for use in other modules
export { RequirementTypes, PriorityLevels, MoscowPriority, PRDStatus };