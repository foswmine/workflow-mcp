# 15. 설계관리 JavaScript 오류 수정 완료 (2025-09-07)

## 📋 문제 상황
사용자 보고: **"편집을 하고 저장하면 모든 메뉴 버튼이 먹통이 됩니다"**
- 설계 편집 후 저장 시 페이지가 완전히 작동 중단
- 새로고침을 해야만 메뉴 버튼 사용 가능
- JavaScript 런타임 오류로 인한 페이지 기능 마비

## 🔍 근본 원인 분석

### 1. 데이터베이스 저장 오류
**문제**: SQLiteDesignStorage에서 JSON 데이터를 `[object Object]` 문자열로 저장
```javascript
// 잘못된 저장 방식
design.acceptance_criteria,  // 배열/객체가 "[object Object]"로 변환됨
design.tags,                 // 배열/객체가 "[object Object]"로 변환됨
```

**해결**: 올바른 JSON.stringify() 처리
```javascript
// 수정된 저장 방식
typeof design.acceptance_criteria === 'string' ? design.acceptance_criteria : JSON.stringify(design.acceptance_criteria || []),
typeof design.tags === 'string' ? design.tags : JSON.stringify(design.tags || []),
```

### 2. JavaScript 파싱 오류
**문제**: `"[object Object]"` 문자열을 JSON.parse()하려 할 때 오류
```
"[object Object]" is not valid JSON
```

**해결**: 안전한 JSON 파싱 로직 구현
```javascript
acceptance_criteria: (() => {
    try {
        if (typeof design.acceptance_criteria === 'string') {
            if (design.acceptance_criteria === '[object Object]') return [];
            return JSON.parse(design.acceptance_criteria || '[]');
        }
        return Array.isArray(design.acceptance_criteria) ? design.acceptance_criteria : [];
    } catch {
        return [];
    }
})(),
```

### 3. API 응답 타입 오류
**문제**: API에서 오류 발생 시 빈 배열 대신 다른 타입 반환으로 `designs.filter is not a function` 오류

**해결**: API에서 항상 배열 보장
```javascript
export async function GET() {
  try {
    const result = await designManager.listDesigns();
    const designs = result && result.designs ? result.designs : [];
    return json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return json([]); // 오류 시에도 빈 배열 반환
  }
}
```

## ✅ 수정 완료 파일들

### 1. SQLiteDesignStorage.js
- **위치**: `dashboard/src/lib/server/SQLiteDesignStorage.js`
- **수정 내용**: JSON 데이터 저장 시 올바른 stringify 처리
- **적용**: acceptance_criteria, tags 필드

### 2. 편집 페이지 (edit/+page.svelte)
- **위치**: `dashboard/src/routes/designs/[id]/edit/+page.svelte`
- **수정 내용**: 안전한 JSON 파싱 로직 구현
- **적용**: onMount에서 데이터 로드 시 예외 처리

### 3. API 서버 (+server.js)
- **위치**: `dashboard/src/routes/api/designs/+server.js`
- **수정 내용**: 오류 시에도 배열 반환 보장
- **적용**: GET 엔드포인트 오류 핸들링

## 🧪 CRUD 테스트 결과

### ✅ CREATE (생성)
- 새 설계 생성 정상 작동
- JSON 데이터 올바르게 저장

### ✅ READ (조회)
- 목록 조회 정상
- 상세보기 정상
- 칸반 보드 표시 정상

### ✅ UPDATE (수정) - **핵심 해결**
- **이전**: 편집 후 저장 시 페이지 먹통
- **현재**: 편집 후 저장 완벽 작동
- 상세보기로 정상 리다이렉트
- 모든 메뉴 버튼 정상 작동

### ✅ DELETE (삭제)
- 삭제 기능 정상 작동

## 📚 작업관리 모듈 적용 가이드

### 공통 패턴 문제점
1. **JSON 데이터 저장**: SQLite Storage에서 JSON.stringify() 누락
2. **JSON 데이터 파싱**: `[object Object]` 문자열 파싱 오류
3. **API 오류 처리**: 타입 일관성 없는 응답

### 작업관리 예방 조치
```javascript
// 1. SQLite Storage 패턴
typeof field === 'string' ? field : JSON.stringify(field || [])

// 2. 안전한 JSON 파싱 패턴  
(() => {
    try {
        if (typeof data === 'string') {
            if (data === '[object Object]') return [];
            return JSON.parse(data || '[]');
        }
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
})()

// 3. API 오류 응답 패턴
catch (error) {
    console.error('Error:', error);
    return json([]); // 항상 예상 타입 반환
}
```

## 🎯 다음 세션 체크리스트

### 작업관리 구현 시 필수 확인사항
- [ ] TaskStorage에서 JSON 필드 저장 방식 확인
- [ ] 작업 편집 페이지 JSON 파싱 안전성 확인  
- [ ] API 오류 응답 타입 일관성 확인
- [ ] 편집 후 저장 시 페이지 기능 정상 작동 테스트

### PRD-설계-작업 공통 아키텍처
- **단일 소스 오브 트루스**: SQLite DB 중심
- **MCP 도구 + 대시보드**: 양방향 동기화
- **중앙집중식 설정**: config.js 활용
- **일관된 오류 처리**: 타입 안전성 보장

## 💡 핵심 교훈

**문제의 본질**: 편집 기능의 JavaScript 오류는 대부분 데이터 저장/파싱 과정의 타입 불일치로 발생

**해결의 핵심**: 
1. 데이터 저장 시 올바른 직렬화
2. 데이터 로드 시 안전한 역직렬화  
3. API 응답의 타입 일관성

이 패턴을 작업관리에도 동일하게 적용하면 같은 문제를 예방할 수 있습니다.