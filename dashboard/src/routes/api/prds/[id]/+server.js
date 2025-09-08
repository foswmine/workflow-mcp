import { json } from '@sveltejs/kit';
import { PRDManager } from '$lib/server/PRDManager.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const prdManager = new PRDManager();
    const result = await prdManager.getPRD(params.id);
    if (!result.success) {
      return json({ error: 'PRD not found' }, { status: 404 });
    }
    return json(result.prd);
  } catch (error) {
    console.error('Error fetching PRD:', error);
    return json({ error: 'Failed to fetch PRD' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const prdManager = new PRDManager();
    const updates = await request.json();
    const result = await prdManager.updatePRD(params.id, updates);
    if (!result.success) {
      return json({ error: result.message || 'Failed to update PRD' }, { status: 400 });
    }
    return json({ success: true });
  } catch (error) {
    console.error('Error updating PRD:', error);
    return json({ error: 'Failed to update PRD' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const prdManager = new PRDManager();
    const result = await prdManager.deletePRD(params.id);
    if (!result.success) {
      return json({ error: result.message || 'Failed to delete PRD' }, { status: 400 });
    }
    return json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error deleting PRD:', error);
    return json({ error: 'Failed to delete PRD' }, { status: 500 });
  }
}