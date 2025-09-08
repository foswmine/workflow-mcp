import { json } from '@sveltejs/kit';
import { TestManager } from '$lib/server/TestManager.js';

const testManager = new TestManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const result = await testManager.listTestCases();
    
    if (result && result.testCases) {
      // 특정 task_id와 연결된 테스트 케이스만 필터링
      const linkedTests = result.testCases.filter(testCase => 
        testCase.task_id === params.id
      );
      
      return json(linkedTests);
    } else {
      return json([]);
    }
  } catch (error) {
    console.error('Error fetching tests for task:', error);
    return json([]);
  }
}