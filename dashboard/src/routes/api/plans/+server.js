import { json } from '@sveltejs/kit';
import { getAllPlans, createPlan } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const plans = await getAllPlans();
    return json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return json({ error: 'Failed to fetch plans' }, { status: 500 });
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

    const plan = {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      status: data.status || 'active',
      priority: data.priority || 'medium',
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      completion_percentage: Math.min(100, Math.max(0, parseInt(data.completion_percentage) || 0))
    };

    const id = await createPlan(plan);
    return json({ id, message: 'Plan created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return json({ error: 'Failed to create plan' }, { status: 500 });
  }
}