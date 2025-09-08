import { json } from '@sveltejs/kit';
import { TestManager } from '$lib/server/TestManager.js';

const testManager = new TestManager();

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { testCaseId, taskId } = await request.json();
    
    if (!testCaseId || !taskId) {
      return json({ error: 'testCaseId and taskId are required' }, { status: 400 });
    }

    // 테스트 케이스 업데이트 (task_id 연결)
    const result = await testManager.updateTestCase(testCaseId, { task_id: taskId });
    
    return json(result);
  } catch (error) {
    console.error('Error linking test case to task:', error);
    return json({ error: 'Failed to link test case to task' }, { status: 500 });
  }
}