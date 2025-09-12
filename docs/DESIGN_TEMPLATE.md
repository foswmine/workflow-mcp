# 🎯 프로젝트 설계 가이드 템플릿

> **목적**: Claude Code와 협업 시 일관성 확보 및 실수 방지  
> **사용법**: 프로젝트 시작 전 이 템플릿을 복사하여 작성

## 📋 **1. 프로젝트 기본 정보**

### 프로젝트명
`[프로젝트명]`

### 프로젝트 유형
- [ ] MVP/프로토타입 (빠른 개발 우선)
- [ ] 프로덕션 (품질/확장성 우선)
- [ ] 개인 프로젝트 
- [ ] 팀 프로젝트
- [ ] 클라이언트 프로젝트

### 개발 기간
- **시작일**: YYYY-MM-DD
- **목표 완료일**: YYYY-MM-DD  
- **예상 기간**: N주

---

## 🛠️ **2. 기술 스택 (FIXED - 절대 변경 금지)**

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite3 (sqlite3 패키지만 사용)
- **ORM/쿼리**: 직접 SQL 쿼리
- **인증**: JWT

### Frontend (해당시)
- **Framework**: React/Vue/Vanilla
- **빌드 도구**: Vite/Webpack
- **스타일링**: CSS/Tailwind

### 개발 도구
- **패키지 관리자**: npm
- **코드 품질**: ESLint + Prettier
- **테스트**: Jest (필요시)

---

## 📏 **3. 코딩 규칙 (MANDATORY - 반드시 준수)**

### 네이밍 컨벤션
- **데이터베이스**: snake_case (created_at, updated_at, user_id)
- **JavaScript 변수**: camelCase (userId, createdAt)
- **파일명**: kebab-case (user-controller.js)
- **API 엔드포인트**: kebab-case (/api/user-profile)

### 데이터베이스 규칙
- **Primary Key**: 항상 `id` (INTEGER PRIMARY KEY)
- **타임스탬프**: created_at, updated_at (DATETIME)
- **외래키**: [table]_id (user_id, post_id)
- **Boolean**: 0/1 (is_active, is_deleted)

### API 응답 형식
```javascript
// 성공 응답
{
  "success": true,
  "data": { ... }
}

// 에러 응답  
{
  "success": false,
  "error": "에러 메시지"
}
```

### 에러 처리
- **모든 async 함수**: try-catch 필수
- **데이터베이스 에러**: 로깅 + 사용자 친화적 메시지
- **404 에러**: 명확한 메시지 제공

---

## 🚫 **4. 금지사항 (FORBIDDEN - 절대 사용 금지)**

### 패키지 금지
- ❌ `better-sqlite3` (sqlite3만 사용)
- ❌ `sequelize`, `prisma` (직접 SQL만)
- ❌ `mongoose` (MongoDB 사용 안 함)

### 네이밍 금지
- ❌ camelCase 데이터베이스 컬럼 (CreateAt, UserId 등)
- ❌ 대문자 시작 변수명 (CreateUser, GetData 등)
- ❌ 약어 남용 (usr, prd, usr_id 대신 user_id)

### 코딩 패턴 금지
- ❌ 직접 데이터베이스 접근 (컨트롤러에서 직접 쿼리)
- ❌ 글로벌 변수 사용
- ❌ console.log 프로덕션 코드에 남기기
- ❌ 하드코딩된 설정값

---

## 🏗️ **5. 아키텍처 설계 (SuperClaude 패턴 적용)**

### 폴더 구조
```
프로젝트/
├── src/
│   ├── controllers/     # API 엔드포인트 로직
│   ├── models/         # 데이터 모델 및 DB 접근
│   ├── middleware/     # 인증, 로깅 등
│   ├── utils/          # 헬퍼 함수
│   └── routes/         # 라우팅 설정
├── database/
│   ├── schema.sql      # 테이블 정의
│   └── migrations/     # DB 변경사항
├── tests/              # 테스트 파일
└── docs/               # 설계 문서
```

### API 설계 원칙
- **RESTful**: GET, POST, PUT, DELETE 의미 준수
- **응답 형식 통일**: 위 API 응답 형식 사용
- **HTTP 상태코드**: 200, 201, 400, 401, 404, 500 적절히 사용
- **에러 처리**: 일관된 에러 응답 구조

### 데이터베이스 설계 원칙  
- **정규화**: 3NF까지 정규화 적용
- **인덱스**: 자주 검색되는 컬럼에 인덱스 생성
- **제약조건**: NOT NULL, UNIQUE, FOREIGN KEY 적절히 사용

---

## ✅ **6. 검증 체크리스트 (Validation)**

### 설계 검증
- [ ] 요구사항이 기술 스택으로 구현 가능한가?
- [ ] 코딩 규칙이 명확히 정의되었는가?
- [ ] 금지사항이 구체적으로 명시되었는가?
- [ ] API 설계가 RESTful 원칙을 따르는가?
- [ ] 데이터베이스 스키마가 정규화되었는가?

### 유지보수성 검증
- [ ] 6개월 후에도 이해할 수 있는 구조인가?
- [ ] 새로운 개발자가 쉽게 이해할 수 있는가?
- [ ] 확장 시 기존 코드 수정을 최소화할 수 있는가?

### Claude Code 협업 검증
- [ ] Claude가 헷갈릴 수 있는 부분이 명시되었는가?
- [ ] 이전 실수들이 금지사항에 포함되었는가?
- [ ] 일관성 있는 패턴이 정의되었는가?

---

## 🤖 **7. Claude Code 협업 가이드**

### 작업 시작 전 반드시 확인
1. "이 프로젝트의 설계 문서를 먼저 읽어주세요"
2. "기존 패턴과 일치하는지 확인해주세요"
3. "금지사항을 위반하지 않았는지 체크해주세요"

### 새로운 기능 추가 시
1. 기존 파일 구조 확인
2. 네이밍 컨벤션 준수 확인
3. API 응답 형식 일치 확인
4. 에러 처리 패턴 일치 확인

### 문제 발생 시
1. 설계 문서 다시 확인
2. 기존 구현된 비슷한 기능 참조
3. 패턴 일관성 우선 고려

---

## 📝 **8. 변경 이력**

| 날짜 | 버전 | 변경 내용 | 담당자 |
|------|------|-----------|--------|
| YYYY-MM-DD | 1.0 | 초기 설계 | [이름] |
| | | | |

---

**🎯 이 문서는 Claude Code와의 협업에서 일관성 확보와 실수 방지를 위한 핵심 가이드입니다.**  
**프로젝트 시작 전 반드시 작성하고, 작업 중 수시로 참조하세요!**