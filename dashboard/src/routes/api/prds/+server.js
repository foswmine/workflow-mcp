import { json } from '@sveltejs/kit';
import { getAllPRDs, createPRD, getDashboardStats } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const prds = await getAllPRDs();
    return json(prds);
  } catch (error) {
    console.error('Error fetching PRDs:', error);
    return json({ error: 'Failed to fetch PRDs' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const data = await request.json();
    
    // 유효성 검사
    if (!data.title?.trim()) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    const prd = {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      requirements: data.requirements || [],
      acceptance_criteria: data.acceptance_criteria || [],
      priority: data.priority || 'medium',
      status: data.status || 'active'
    };

    const id = await createPRD(prd);
    return json({ id, message: 'PRD created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating PRD:', error);
    return json({ error: 'Failed to create PRD' }, { status: 500 });
  }
}