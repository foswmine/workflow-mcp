import { json } from '@sveltejs/kit';
import { getPRDById, updatePRD, deletePRD } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const prd = await getPRDById(params.id);
    if (!prd) {
      return json({ error: 'PRD not found' }, { status: 404 });
    }
    return json(prd);
  } catch (error) {
    console.error('Error fetching PRD:', error);
    return json({ error: 'Failed to fetch PRD' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const prd = await request.json();
    await updatePRD(params.id, prd);
    return json({ success: true });
  } catch (error) {
    console.error('Error updating PRD:', error);
    return json({ error: 'Failed to update PRD' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    await deletePRD(params.id);
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting PRD:', error);
    return json({ error: 'Failed to delete PRD' }, { status: 500 });
  }
}