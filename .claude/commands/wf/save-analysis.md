코드 분석이나 기술 분석 결과를 WorkflowMCP에 저장: $ARGUMENTS

@workflow-doc-manager를 호출하여 분석 문서를 전문적으로 생성합니다:

Steps:
1. 분석 내용을 'analysis' 문서 유형으로 분류
2. 기술적 내용에 맞는 태그 생성 (예: frontend, backend, performance, security)
3. 분석 결과를 구조화된 마크다운으로 포맷팅
4. 관련 PRD나 Task와 연결 가능하면 링크 설정
5. WorkflowMCP에 저장하고 전문 검색 인덱스에 추가

특화 기능:
- 코드 리뷰 결과
- 성능 분석 보고서
- 보안 취약점 분석
- 아키텍처 분석