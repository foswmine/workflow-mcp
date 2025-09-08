import { json } from '@sveltejs/kit';
import { TestManager } from '$lib/server/TestManager.js';

const testManager = new TestManager();

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
  try {
    const executionData = await request.json();
    const result = await testManager.executeTestCase(params.id, executionData);
    return json(result, { status: 201 });
  } catch (error) {
    console.error('Error executing test case:', error);
    return json({ error: 'Failed to execute test case' }, { status: 500 });
  }
}