분석이나 작업 결과를 WorkflowMCP에 문서로 저장: $ARGUMENTS

@workflow-doc-manager를 호출하여 다음 작업을 수행합니다:

Steps:
1. 제공된 내용을 분석하여 적절한 문서 유형 결정 (analysis, report, specification 등)
2. 내용에 기반한 관련 태그와 카테고리 자동 생성
3. 전문적인 마크다운 형식으로 구조화
4. WorkflowMCP 데이터베이스에 저장하여 검색 가능하게 만들기
5. 문서 ID와 저장 위치 확인 및 보고

사용 예시:
- `/save-doc 코드 리뷰 결과를 저장해줘`
- `/save-doc 성능 분석 리포트 작성`
- `/save-doc 프로젝트 진행 상황 정리`