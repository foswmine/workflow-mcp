import { json } from '@sveltejs/kit';
import { TaskManager } from '$lib/server/TaskManager.js';

const taskManager = new TaskManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const result = await taskManager.getTask(params.id);
    if (!result.success || !result.task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }
    return json(result.task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const taskData = await request.json();
    const result = await taskManager.updateTask(params.id, taskData);
    if (!result.success) {
      return json({ error: result.error || 'Failed to update task' }, { status: 500 });
    }
    return json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request }) {
  try {
    const { status } = await request.json();
    const result = await taskManager.updateTask(params.id, { status });
    if (!result.success) {
      return json({ error: result.error || 'Failed to update task status' }, { status: 500 });
    }
    return json(result);
  } catch (error) {
    console.error('Error updating task status:', error);
    return json({ error: 'Failed to update task status' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const result = await taskManager.deleteTask(params.id);
    if (!result.success) {
      return json({ error: result.error || 'Failed to delete task' }, { status: 500 });
    }
    return json(result);
  } catch (error) {
    console.error('Error deleting task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
}