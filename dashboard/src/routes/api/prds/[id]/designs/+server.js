import { json } from '@sveltejs/kit';
import { DesignManager } from '$lib/server/DesignManager.js';

const designManager = new DesignManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const prdId = params.id;
    
    // PRD에 연결된 설계 목록 조회
    const result = await designManager.getDesignsByRequirement(prdId);
    
    if (!result.success) {
      return json({ error: result.error || 'Failed to fetch linked designs' }, { status: 500 });
    }
    
    return json({
      success: true,
      designs: result.designs || [],
      total: result.designs ? result.designs.length : 0,
      message: `PRD ${prdId}에 연결된 설계 ${result.designs ? result.designs.length : 0}개 조회 완료`
    });
    
  } catch (error) {
    console.error('Error fetching PRD linked designs:', error);
    return json({ error: 'Failed to fetch linked designs' }, { status: 500 });
  }
}