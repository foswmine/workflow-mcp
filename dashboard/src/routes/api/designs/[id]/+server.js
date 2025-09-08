import { json } from '@sveltejs/kit';
import { DesignManager } from '$lib/server/DesignManager.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const designManager = new DesignManager();
    const result = await designManager.getDesign(params.id);
    if (!result.success) {
      return json({ error: 'Design not found' }, { status: 404 });
    }
    return json(result.design);
  } catch (error) {
    console.error('Error fetching design:', error);
    return json({ error: 'Failed to fetch design' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const designManager = new DesignManager();
    const updates = await request.json();
    const result = await designManager.updateDesign(params.id, updates);
    if (!result.success) {
      return json({ error: result.message || 'Failed to update design' }, { status: 400 });
    }
    return json({ success: true });
  } catch (error) {
    console.error('Error updating design:', error);
    return json({ error: 'Failed to update design' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const designManager = new DesignManager();
    const result = await designManager.deleteDesign(params.id);
    if (!result.success) {
      return json({ error: result.message || 'Failed to delete design' }, { status: 400 });
    }
    return json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error deleting design:', error);
    return json({ error: 'Failed to delete design' }, { status: 500 });
  }
}