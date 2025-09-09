import { json } from '@sveltejs/kit';
import { TaskManager } from '$lib/server/TaskManager.js';

const taskManager = new TaskManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const connections = await taskManager.getAdditionalConnections(params.id);
    return json(connections);
  } catch (error) {
    console.error('Error fetching task connections:', error);
    return json({ error: 'Failed to fetch task connections' }, { status: 500 });
  }
}