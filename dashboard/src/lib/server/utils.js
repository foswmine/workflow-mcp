import { json } from '@sveltejs/kit';

/**
 * UTF-8 charset가 포함된 JSON 응답을 생성하는 유틸리티 함수
 * SvelteKit의 기본 json() 헬퍼가 charset을 설정하지 않는 문제를 해결
 * 
 * @param {any} data - JSON으로 직렬화할 데이터
 * @param {Object} options - 추가 옵션 (status, headers 등)
 * @returns {Response} UTF-8 charset이 포함된 JSON 응답
 */
export function jsonResponse(data, options = {}) {
	return json(data, {
		...options,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			...options.headers
		}
	});
}