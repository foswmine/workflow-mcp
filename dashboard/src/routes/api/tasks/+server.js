import { TaskManager } from '$lib/server/TaskManager.js';
import { jsonResponse } from '$lib/server/utils.js';

const taskManager = new TaskManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const result = await taskManager.listTasks();
    const tasks = result && result.tasks ? result.tasks : [];
    return jsonResponse(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return jsonResponse([]);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // UTF-8 인코딩을 명시적으로 처리
    const arrayBuffer = await request.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const textData = decoder.decode(arrayBuffer);
    const taskData = JSON.parse(textData);
    
    const result = await taskManager.createTask(taskData);
    return jsonResponse(result, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return jsonResponse({ error: 'Failed to create task' }, { status: 500 });
  }
}