import { json } from '@sveltejs/kit';
import { TaskManager } from '$lib/server/TaskManager.js';

const taskManager = new TaskManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const prdId = params.id;
    
    // PRD에 연결된 작업 목록 조회 (직접 + 간접 연결)
    const result = await taskManager.getTasksByPRD(prdId);
    
    if (!result.success) {
      return json({ error: result.error || 'Failed to fetch linked tasks' }, { status: 500 });
    }
    
    // 직접/간접 연결 분류 및 진행률 계산
    const directTasks = result.tasks.filter(task => task.linkType === 'direct');
    const indirectTasks = result.tasks.filter(task => task.linkType === 'indirect');
    const totalTasks = result.tasks.length;
    const completedTasks = result.tasks.filter(task => 
      task.status === 'done' || task.status === 'completed'
    ).length;
    
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return json({
      success: true,
      tasks: {
        direct: directTasks,
        indirect: indirectTasks,
        all: result.tasks
      },
      statistics: {
        total: totalTasks,
        direct: directTasks.length,
        indirect: indirectTasks.length,
        completed: completedTasks,
        progress: progressPercentage
      },
      statusBreakdown: result.statusBreakdown || {},
      message: `PRD ${prdId}에 연결된 작업 ${totalTasks}개 조회 완료 (진행률: ${progressPercentage}%)`
    });
    
  } catch (error) {
    console.error('Error fetching PRD linked tasks:', error);
    return json({ error: 'Failed to fetch linked tasks' }, { status: 500 });
  }
}