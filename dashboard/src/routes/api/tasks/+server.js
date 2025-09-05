import { json } from '@sveltejs/kit';
import { getAllTasks, createTask, getTasksByPRDId } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const prdId = url.searchParams.get('prd_id');
    let tasks;
    
    if (prdId) {
      tasks = await getTasksByPRDId(prdId);
    } else {
      tasks = await getAllTasks();
    }
    
    return json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const task = await request.json();
    const id = await createTask(task);
    return json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return json({ error: 'Failed to create task' }, { status: 500 });
  }
}