import { json } from '@sveltejs/kit';
import { getDashboardStats, getTaskActivity, getPriorityDistribution } from '$lib/server/database.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const type = url.searchParams.get('type');
    
    switch (type) {
      case 'stats':
        const stats = await getDashboardStats();
        return json(stats);
      
      case 'activity':
        const days = parseInt(url.searchParams.get('days') || '30');
        const activity = await getTaskActivity(days);
        return json(activity);
      
      case 'priority':
        const priority = await getPriorityDistribution();
        return json(priority);
      
      default:
        // Return all dashboard data
        const [dashStats, taskActivity, priorityDist] = await Promise.all([
          getDashboardStats(),
          getTaskActivity(30),
          getPriorityDistribution()
        ]);
        
        return json({
          stats: dashStats,
          activity: taskActivity,
          priority: priorityDist
        });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}