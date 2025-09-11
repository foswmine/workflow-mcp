import { PRDManager } from '$lib/server/PRDManager.js';
import { jsonResponse } from '$lib/server/utils.js';

// PRDManager 인스턴스 생성
const prdManager = new PRDManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const sortBy = url.searchParams.get('sort') || 'created_desc';
    const result = await prdManager.listPRDs(null, sortBy);
    return jsonResponse(result.prds);
  } catch (error) {
    console.error('Error fetching PRDs:', error);
    return jsonResponse({ error: 'Failed to fetch PRDs' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // UTF-8 인코딩을 명시적으로 처리
    const arrayBuffer = await request.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const textData = decoder.decode(arrayBuffer);
    const data = JSON.parse(textData);
    
    const result = await prdManager.createPRD(data);
    return jsonResponse({ id: result.prd.id, message: result.message }, { status: 201 });
  } catch (error) {
    console.error('Error creating PRD:', error);
    return jsonResponse({ error: 'Failed to create PRD' }, { status: 500 });
  }
}