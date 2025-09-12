# 16. 작업 편집 페이지 데이터 로딩 문제 해결 가이드

## 문제 상황

작업관리에서 새 작업 추가 후 편집 페이지로 이동 시, 다음 필드들이 편집 화면에 표시되지 않음:
- 우선순위 (priority)
- 마감일자 (dueDate) 
- 연결된 설계 (designId)
- 예상 소요 시간 (estimatedHours)

## 근본 원인

### 1. 필드명 불일치 (snake_case vs camelCase)
- **작업 생성 폼**: `due_date`, `design_id`, `estimated_hours`, `actual_hours` (snake_case)
- **작업 편집 폼**: `dueDate`, `designId`, `estimatedHours`, `actualHours` (camelCase)
- **TaskManager**: camelCase만 처리

### 2. 우선순위 값 불일치
- **폼 전송**: `'high'`, `'medium'`, `'low'` (소문자)
- **TaskPriority enum**: `'High'`, `'Medium'`, `'Low'` (첫 글자 대문자)
- **매핑 실패 시**: 기본값 `'Medium'`으로 저장됨

### 3. 설계 ID 필드명 변경
- **이전**: `planId` 사용
- **현재**: `design_id` → `designId` 매핑 필요

## 해결 방안

### 1. TaskManager.js 수정 - 필드 매핑 개선

```javascript
// TaskManager.js의 createTask 메서드에서
const task = {
  // 기존 필드들...
  priority: this.normalizePriority(taskData.priority) || TaskPriority.MEDIUM,
  estimatedHours: taskData.estimatedHours || taskData.estimated_hours || 0,
  actualHours: taskData.actualHours || taskData.actual_hours || 0,
  dueDate: taskData.dueDate || taskData.due_date || null,
  planId: taskData.planId || taskData.design_id || null,
  createdBy: taskData.createdBy || taskData.created_by || 'system',
  acceptanceCriteria: taskData.acceptanceCriteria || taskData.acceptance_criteria || [],
  testStrategy: taskData.testStrategy || taskData.test_strategy || ''
};
```

### 2. 우선순위 정규화 메서드 추가

```javascript
normalizePriority(priority) {
  if (!priority) return null;
  const normalized = priority.toLowerCase();
  switch (normalized) {
    case 'high':
      return TaskPriority.HIGH; // 'High'
    case 'medium':
      return TaskPriority.MEDIUM; // 'Medium'
    case 'low':
      return TaskPriority.LOW; // 'Low'
    default:
      return null;
  }
}
```

### 3. 편집 페이지 데이터 로딩 개선

```javascript
// edit/+page.svelte의 데이터 매핑 부분
form = {
  // 기존 필드들...
  priority: task.priority?.toLowerCase() || 'medium',
  designId: task.designId || task.planId || null, // 백업 처리
  // 나머지 필드들...
};
```

## 핵심 패턴

### 1. 양방향 호환성
```javascript
// 새 필드 || 기존 필드 || 기본값
field: newFormat || oldFormat || defaultValue
```

### 2. 케이스 정규화
```javascript
// 대소문자 구분 없는 매핑
priority: this.normalizePriority(input?.toLowerCase())
```

### 3. 필드명 마이그레이션
```javascript
// 점진적 마이그레이션 지원
planId: taskData.planId || taskData.design_id || null
```

## 테스트 절차

### 1. 작업 생성 테스트
```
1. /tasks/new 페이지 이동
2. 모든 필드 입력 (제목, 우선순위=high, 설계 선택, 마감일자, 예상시간)
3. 작업 생성 버튼 클릭
4. 작업 목록으로 이동 확인
```

### 2. 편집 페이지 데이터 로딩 테스트
```
1. 생성된 작업의 편집 버튼 클릭
2. 편집 페이지에서 모든 필드 값 확인:
   - 제목: 입력한 값
   - 우선순위: 'high' (설정한 값)
   - 마감일자: 설정한 날짜
   - 연결된 설계: 선택한 설계
   - 예상시간: 설정한 시간
```

### 3. API 응답 확인
```javascript
// 브라우저 콘솔에서 실행
fetch('/api/tasks/{task-id}')
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)));
```

## 예방 조치

### 1. 일관된 필드명 사용
- 새로운 폼 생성 시 기존 API와 동일한 필드명 사용
- camelCase로 통일 권장

### 2. 데이터 검증 강화
- 필드 매핑 후 값 검증 로직 추가
- 기본값 처리 명시적으로 정의

### 3. 통합 테스트
- 생성→편집→저장 전체 플로우 테스트
- 다양한 데이터 조합으로 테스트

## 관련 파일

- `dashboard/src/lib/server/TaskManager.js` - 핵심 비즈니스 로직
- `dashboard/src/routes/tasks/new/+page.svelte` - 작업 생성 폼
- `dashboard/src/routes/tasks/[id]/edit/+page.svelte` - 작업 편집 폼
- `dashboard/src/routes/api/tasks/+server.js` - 작업 CRUD API

## 성공 기준

✅ 작업 생성 시 모든 필드가 DB에 올바르게 저장됨
✅ 편집 페이지에서 모든 필드가 올바르게 로드됨  
✅ 우선순위가 설정한 값으로 정확히 표시됨
✅ 연결된 설계가 올바르게 표시됨
✅ 마감일자와 예상시간이 설정한 값으로 표시됨