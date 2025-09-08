import { json } from '@sveltejs/kit';
import { PRDManager } from '$lib/server/PRDManager.js';

// PRDManager 인스턴스 생성
const prdManager = new PRDManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const sortBy = url.searchParams.get('sort') || 'created_desc';
    const result = await prdManager.listPRDs(null, sortBy);
    return json(result.prds);
  } catch (error) {
    console.error('Error fetching PRDs:', error);
    return json({ error: 'Failed to fetch PRDs' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const data = await request.json();
    
    const result = await prdManager.createPRD(data);
    return json({ id: result.prd.id, message: result.message }, { status: 201 });
  } catch (error) {
    console.error('Error creating PRD:', error);
    return json({ error: 'Failed to create PRD' }, { status: 500 });
  }
}