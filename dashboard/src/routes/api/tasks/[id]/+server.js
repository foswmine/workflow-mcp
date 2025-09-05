import { json } from '@sveltejs/kit';
import { getTaskById, updateTask, updateTaskStatus, deleteTask } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const task = await getTaskById(params.id);
    if (!task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }
    return json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const task = await request.json();
    await updateTask(params.id, task);
    return json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request }) {
  try {
    const { status } = await request.json();
    await updateTaskStatus(params.id, status);
    return json({ success: true });
  } catch (error) {
    console.error('Error updating task status:', error);
    return json({ error: 'Failed to update task status' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    await deleteTask(params.id);
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
}