import { json } from '@sveltejs/kit';
import { TestManager } from '$lib/server/TestManager.js';

const testManager = new TestManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const result = await testManager.getTestExecutions(params.id);
    const executions = result && result.executions ? result.executions : [];
    return json(executions);
  } catch (error) {
    console.error('Error fetching test executions:', error);
    return json([]);
  }
}