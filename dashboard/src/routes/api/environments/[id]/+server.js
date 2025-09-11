import { error } from '@sveltejs/kit';
import { jsonResponse } from '../../../../lib/server/utils.js';
import { DevOpsManager } from '../../../../lib/server/DevOpsManager.js';

const devOpsManager = new DevOpsManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		const result = await devOpsManager.getEnvironmentStatus(params.id);
		
		if (!result.success) {
			throw error(404, result.error);
		}

		return jsonResponse(result.environment);
	} catch (e) {
		console.error('Environment detail API error:', e);
		throw error(500, `환경 조회 중 오류 발생: ${e.message}`);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
	try {
		// UTF-8 인코딩을 명시적으로 처리
		const arrayBuffer = await request.arrayBuffer();
		const decoder = new TextDecoder('utf-8');
		const textData = decoder.decode(arrayBuffer);
		const updates = JSON.parse(textData);
		
		const result = await devOpsManager.updateEnvironment(params.id, updates);
		
		if (!result.success) {
			throw error(404, result.error);
		}

		return jsonResponse(result.environment);
	} catch (e) {
		console.error('Environment update API error:', e);
		throw error(500, `환경 업데이트 중 오류 발생: ${e.message}`);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request }) {
	try {
		// UTF-8 인코딩을 명시적으로 처리
		const arrayBuffer = await request.arrayBuffer();
		const decoder = new TextDecoder('utf-8');
		const textData = decoder.decode(arrayBuffer);
		const updates = JSON.parse(textData);
		
		const result = await devOpsManager.updateEnvironment(params.id, updates);
		
		if (!result.success) {
			throw error(404, result.error);
		}

		return jsonResponse(result.environment);
	} catch (e) {
		console.error('Environment patch API error:', e);
		throw error(500, `환경 상태 변경 중 오류 발생: ${e.message}`);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
	try {
		const environmentId = params.id;
		const result = await devOpsManager.deleteEnvironment(environmentId);
		
		if (!result.success) {
			throw error(404, result.error);
		}

		return jsonResponse({ 
			success: true, 
			message: result.message || `환경 "${environmentId}" 삭제 완료` 
		});
	} catch (e) {
		console.error('Environment delete API error:', e);
		throw error(500, `환경 삭제 중 오류 발생: ${e.message}`);
	}
}