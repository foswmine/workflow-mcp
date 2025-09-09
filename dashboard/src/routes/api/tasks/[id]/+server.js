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
    
    // additionalConnections 처리
    if (taskData.additionalConnections) {
      const additionalConnections = taskData.additionalConnections;
      delete taskData.additionalConnections;
      
      const result = await taskManager.updateTask(params.id, taskData);
      if (!result.success) {
        return json({ error: result.error || 'Failed to update task' }, { status: 500 });
      }
      
      // 추가 연결들을 prd_task_links 테이블에 저장
      if (additionalConnections && additionalConnections.length > 0) {
        await taskManager.updateAdditionalConnections(params.id, additionalConnections);
      }
      
      return json(result);
    } else {
      const result = await taskManager.updateTask(params.id, taskData);
      if (!result.success) {
        return json({ error: result.error || 'Failed to update task' }, { status: 500 });
      }
      return json(result);
    }
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