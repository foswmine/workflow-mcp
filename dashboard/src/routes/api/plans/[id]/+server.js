import { json } from '@sveltejs/kit';
import { getPlanById, updatePlan, deletePlan } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const plan = await getPlanById(params.id);
    if (!plan) {
      return json({ error: 'Plan not found' }, { status: 404 });
    }
    return json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const plan = await request.json();
    await updatePlan(params.id, plan);
    return json({ success: true });
  } catch (error) {
    console.error('Error updating plan:', error);
    return json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

/** @type {import'./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    await deletePlan(params.id);
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}