import { json } from '@sveltejs/kit';
import { TestManager } from '$lib/server/TestManager.js';

const testManager = new TestManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    
    const result = await testManager.listTestCases(status, type);
    const testCases = result && result.testCases ? result.testCases : [];
    return json(testCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return json([]);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const testCaseData = await request.json();
    const result = await testManager.createTestCase(testCaseData);
    return json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating test case:', error);
    return json({ error: 'Failed to create test case' }, { status: 500 });
  }
}