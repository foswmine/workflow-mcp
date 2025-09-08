import { json } from '@sveltejs/kit';
import { DesignManager } from '$lib/server/DesignManager.js';

// DesignManager 인스턴스 생성
const designManager = new DesignManager();

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const result = await designManager.listDesigns();
    // PRD 패턴과 일치하게 수정: result.designs를 반환하되, 확실히 배열로 반환
    const designs = result && result.designs ? result.designs : [];
    return json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    // 에러 발생시에도 빈 배열을 반환하여 프론트엔드 에러 방지
    return json([]);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const design = await request.json();
    const result = await designManager.createDesign(design);
    return json({ success: true, id: result.design.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating design:', error);
    return json({ error: 'Failed to create design' }, { status: 500 });
  }
}