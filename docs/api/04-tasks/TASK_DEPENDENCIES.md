# Task Dependencies Matrix
# WorkflowMCP API 구현 작업 의존성 관리

## 📋 개요

API 구현 프로젝트의 모든 작업 간 의존성을 매트릭스 형태로 정의하여 병렬 작업 가능성을 최대화하고 블로킹 요소를 사전에 식별합니다.

## 🎯 의존성 관계 정의

### 의존성 유형
- **🔴 Critical Path**: 이 작업이 지연되면 전체 일정 영향
- **🟡 Sequential**: 순차적 진행 필요
- **🟢 Parallel**: 병렬 진행 가능  
- **🔵 Optional**: 선택적 구현

### 작업 코드 정의
- **A**: Analysis (분석)
- **D**: Development (개발)  
- **T**: Testing (테스트)
- **I**: Integration (통합)
- **Doc**: Documentation (문서화)

## 📊 Phase 1: 기존 API 분석 및 Gap 식별 (Day 1-5)

### Day 1 작업 의존성

| Task ID | 작업명 | 의존성 | 타입 | 후속 작업 |
|---------|--------|---------|------|-----------|
| A1.1 | API 응답 형식 분석 | 없음 | 🔴 Critical | A1.2, D2.1 |
| A1.2 | MCP vs API 매핑 | A1.1 | 🔴 Critical | A1.3, 모든 D 작업 |
| A1.3 | Document Relations 분석 | A1.2 | 🟡 Sequential | D2.1 |
| A1.4 | Connection Management 분석 | A1.2 | 🟢 Parallel | D2.3 |

### 병렬 처리 가능성
- A1.3과 A1.4는 병렬 진행 가능
- A1.1 → A1.2는 순차 필수

## 📊 Phase 2: 누락 기능 구현 (Day 2-5)

### Day 2-3 작업 의존성

| Task ID | 작업명 | 의존성 | 타입 | 병렬 그룹 |
|---------|--------|---------|------|-----------|
| D2.1 | Document Link API | A1.1, A1.3 | 🔴 Critical | Group A |
| D2.2 | PRD Document API | A1.1, A1.3 | 🟡 Sequential | Group A |
| D2.3 | Test Summary API | A1.1 | 🟢 Parallel | Group B |
| D2.4 | Test Coverage API | A1.1 | 🟢 Parallel | Group B |
| D2.5 | Test Connection API | A1.1, A1.4 | 🟢 Parallel | Group C |

### 병렬 처리 전략
```
Day 2: Group A (Document APIs) - 순차 진행
├── D2.1 (2시간) → D2.2 (1.5시간)

Day 3: Group B + C (Test APIs) - 병렬 진행  
├── D2.3 + D2.4 (2시간, 병렬)
└── D2.5 (1.5시간, 독립)
```

### Day 4-5 작업 의존성

| Task ID | 작업명 | 의존성 | 타입 | 리스크 |
|---------|--------|---------|------|--------|
| D2.6 | Task Connection Enhancement | A1.4, 기존 API 분석 | 🟡 Sequential | 중간 |
| D2.7 | Cross-Entity Connections | D2.6 | 🟡 Sequential | 높음 |
| D2.8 | Project Analytics Enhancement | A1.1 | 🟢 Parallel | 낮음 |
| D2.9 | Environment Status | A1.1 | 🟢 Parallel | 낮음 |

### 리스크 기반 우선순위
1. **High Risk → 우선 구현**: D2.6, D2.7 (기존 API 수정 위험)
2. **Low Risk → 후순위**: D2.8, D2.9 (독립적 구현)

## 📊 Phase 3: 자기설명적 API 시스템 (Day 6-10)

### Express 서버 vs SvelteKit API 의존성

| Task ID | 작업명 | 의존성 | 서버 타입 | 블로킹 요소 |
|---------|--------|---------|-----------|-------------|
| D3.1 | Express 서버 설정 | 없음 | Express | 포트 충돌 |
| D3.2 | Discovery API | D3.1 | Express | SvelteKit 호환성 |
| D3.3 | Help Database | Phase 2 완료 | SQLite | 스키마 충돌 |
| D3.4 | Help API | D3.1, D3.3 | Express | 데이터 동기화 |
| D3.5 | HATEOAS Middleware | Phase 2 완료 | SvelteKit | 기존 API 수정 |

### 서버 간 의존성 관리
```
Express 서버 작업 (독립)          SvelteKit 작업 (의존적)
├── D3.1 Express 설정             ├── D3.5 HATEOAS (Phase 2 후)
├── D3.2 Discovery API            │
├── D3.3 Help Database            │
└── D3.4 Help API                 │
```

### 통합 시점 관리
- **Day 9-10**: Express + SvelteKit 통합 테스트 필수
- **프록시 설정**: 두 서버 간 API 라우팅

## 📊 Critical Path 분석

### 전체 프로젝트 Critical Path
```
A1.1 → A1.2 → Phase 2 핵심 API → D3.5 HATEOAS → 통합 테스트
(1시간) (1시간)   (12시간)        (2시간)      (1일)
```

### 총 Critical Path: **16.5시간** (전체 35시간 중 47%)

### 병렬 처리로 단축 가능한 작업
- **Phase 2**: 8시간 → 6시간 (25% 단축)
- **Phase 3**: 8시간 → 6시간 (25% 단축)
- **전체**: 35시간 → 28시간 (20% 단축)

## 🚨 위험 의존성 및 대응책

### High Risk Dependencies

#### 1. 기존 API 호환성 (🔴 Critical)
**의존 작업**: D2.1~D2.9 → D3.5  
**위험**: 기존 API 변경 시 대시보드 영향  
**대응책**:
- 매일 회귀 테스트 실행
- API 버전 관리 시스템 도입
- Rollback 계획 수립

#### 2. Express-SvelteKit 통합 (🟡 Sequential)
**의존 작업**: D3.1~D3.4 → D3.5  
**위험**: 서버 간 프록시 충돌  
**대응책**:
- 포트 분리 (Express: 3302, SvelteKit: 3301)
- Nginx 또는 프록시 미들웨어 사용
- 독립 테스트 환경 구성

#### 3. 데이터베이스 스키마 충돌 (🟡 Sequential)
**의존 작업**: A1.2 → D3.3  
**위험**: Help 테이블이 기존 스키마와 충돌  
**대응책**:
- 별도 스키마 네임스페이스 사용
- 마이그레이션 스크립트 사전 테스트
- 백업 및 복구 계획

### Medium Risk Dependencies

#### 4. Manager 클래스 확장 (🟡 Sequential)
**의존 작업**: Phase 2 전체  
**위험**: 기존 Manager 메서드 수정 필요  
**대응책**:
- Wrapper 패턴으로 기존 코드 보존
- 새 메서드만 추가, 기존 메서드 수정 금지
- 단위 테스트로 기존 기능 검증

#### 5. API 응답 형식 표준화 (🟡 Sequential)
**의존 작업**: A1.1 → 모든 D 작업  
**위험**: 기존 API 응답 형식과 충돌  
**대응책**:
- 기존 형식 유지, 새 필드만 추가
- 점진적 형식 통일
- 클라이언트 호환성 테스트

## 📋 의존성 매트릭스

### Phase 1 Dependencies Matrix
```
      A1.1  A1.2  A1.3  A1.4
A1.1   -     ✓     ✓     ✓
A1.2   -     -     ✓     ✓  
A1.3   -     -     -     ⚡
A1.4   -     -     ⚡     -

✓ = 의존함, ⚡ = 병렬 가능
```

### Phase 2 Dependencies Matrix
```
      D2.1  D2.2  D2.3  D2.4  D2.5  D2.6  D2.7  D2.8  D2.9
D2.1   -     ✓     ⚡     ⚡     ⚡     ⚡     ⚡     ⚡     ⚡
D2.2   -     -     ⚡     ⚡     ⚡     ⚡     ⚡     ⚡     ⚡
D2.3   -     -     -     ⚡     ⚡     ⚡     ⚡     ⚡     ⚡
D2.4   -     -     -     -     ⚡     ⚡     ⚡     ⚡     ⚡
D2.5   -     -     -     -     -     ⚡     ⚡     ⚡     ⚡
D2.6   -     -     -     -     -     -     ✓     ⚡     ⚡
D2.7   -     -     -     -     -     -     -     ⚡     ⚡
D2.8   -     -     -     -     -     -     -     -     ⚡
D2.9   -     -     -     -     -     -     -     -     -
```

### Phase 3 Dependencies Matrix
```
      D3.1  D3.2  D3.3  D3.4  D3.5
D3.1   -     ✓     ⚡     ✓     ⚡
D3.2   -     -     ⚡     ⚡     ⚡
D3.3   -     -     -     ✓     ⚡
D3.4   -     -     -     -     ⚡
D3.5   -     -     -     -     -
```

## ⚡ 병렬 처리 최적화 계획

### Day 1 (분석) - Sequential 필수
```
Timeline: A1.1 (1h) → A1.2 (1h) → A1.3 || A1.4 (1.5h parallel)
Total: 3.5시간 (병렬화로 0.5시간 단축)
```

### Day 2-3 (개발) - Mixed
```
Day 2: D2.1 (2h) → D2.2 (1.5h) = 3.5h sequential
Day 3: D2.3 || D2.4 (2h parallel) + D2.5 (1.5h) = 3.5h mixed
Total: 7시간 (병렬화로 1시간 단축)
```

### Day 6-8 (Express) - High Parallel
```
Day 6: D3.1 (2h) → D3.2 (1h) = 3h sequential
Day 7: D3.2 continue (2h) || D3.3 prep (1h) = 3h parallel
Day 8: D3.3 (2h) → D3.4 (1h) = 3h sequential
Total: 9시간 (병렬화로 1시간 단축)
```

## 📅 일정 압축 시나리오

### 시나리오 1: 2주 압축 (35시간 → 28시간)
**전략**: 최대 병렬화 + 선택적 기능 제외
- Phase 3의 Help API 간소화
- 실시간 기능 제외
- 문서화 최소화

### 시나리오 2: 핵심 기능만 (35시간 → 20시간)  
**전략**: Discovery API만 구현
- Help API 제외
- HATEOAS 제외  
- 모니터링 제외

### 시나리오 3: 긴급 상황 (35시간 → 12시간)
**전략**: 누락 API만 구현
- Phase 2만 진행
- 자기설명적 기능 모두 제외

## 🔧 의존성 관리 도구

### 일일 체크리스트
각 작업일 시작 전:
- [ ] 의존 작업 완료 상태 확인
- [ ] 블로킹 이슈 해결 여부 점검
- [ ] 병렬 작업 가능성 재평가
- [ ] 리스크 요소 모니터링

### 진행 상황 추적
- **Green**: 계획대로 진행 중
- **Yellow**: 경미한 지연, 조정 가능
- **Red**: 심각한 지연, 의존 작업 영향

### 의존성 변경 관리
- 의존성 변경 시 즉시 매트릭스 업데이트
- 영향 받는 모든 후속 작업 일정 재조정
- 팀 내 변경 사항 공유

## ✅ 성공 지표

### 의존성 관리 KPI
- **병렬화 효율**: 35시간 → 28시간 (20% 향상)
- **블로킹 최소화**: 전체 작업 중 블로킹 시간 < 10%
- **리스크 관리**: High Risk 의존성 0건
- **일정 준수**: 각 Phase별 계획 대비 ±10% 이내

### 위험 신호
- 2일 연속 의존 작업 지연
- Critical Path 작업 20% 이상 지연
- High Risk 의존성에서 문제 발생
- 병렬 작업 간 충돌 발생

이러한 상황 발생 시 즉시 대응 계획 활성화 및 일정 재조정을 실시합니다.