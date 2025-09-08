import { json } from '@sveltejs/kit';
import { TestManager } from '$lib/server/TestManager.js';

const testManager = new TestManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const result = await testManager.getTestCase(params.id);
    if (result && result.testCase) {
      return json(result.testCase);
    } else {
      return json({ error: 'Test case not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching test case:', error);
    return json({ error: 'Failed to fetch test case' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const updates = await request.json();
    const result = await testManager.updateTestCase(params.id, updates);
    return json(result);
  } catch (error) {
    console.error('Error updating test case:', error);
    return json({ error: 'Failed to update test case' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const result = await testManager.deleteTestCase(params.id);
    return json(result);
  } catch (error) {
    console.error('Error deleting test case:', error);
    return json({ error: 'Failed to delete test case' }, { status: 500 });
  }
}