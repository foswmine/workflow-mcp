import { json } from '@sveltejs/kit';
import { TaskManager } from '$lib/server/TaskManager.js';

const taskManager = new TaskManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const result = await taskManager.listTasks();
    const tasks = result && result.tasks ? result.tasks : [];
    return json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return json([]);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const taskData = await request.json();
    const result = await taskManager.createTask(taskData);
    return json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return json({ error: 'Failed to create task' }, { status: 500 });
  }
}