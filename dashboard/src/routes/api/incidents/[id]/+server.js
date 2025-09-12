import { json } from '@sveltejs/kit';
import { DevOpsManager } from '$lib/server/DevOpsManager.js';

// DevOpsManager 인스턴스 생성
const devOpsManager = new DevOpsManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const result = await devOpsManager.getIncident(params.id);
    
    if (!result.success) {
      return json({ error: result.error }, { status: 404 });
    }
    
    return json(result.incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    return json({ error: 'Failed to fetch incident' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const updateData = await request.json();
    console.log('🔄 PUT /api/incidents/[id] - ID:', params.id);
    console.log('🔄 PUT /api/incidents/[id] - Data:', JSON.stringify(updateData, null, 2));
    
    const result = await devOpsManager.updateIncident(params.id, updateData);
    console.log('🔄 PUT /api/incidents/[id] - Result:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (!result.success) {
      console.error('🔄 PUT /api/incidents/[id] - Error:', result.error);
      return json({ error: result.error }, { status: 404 });
    }
    
    return json({ message: result.message, incident: result.incident });
  } catch (error) {
    console.error('🔄 PUT /api/incidents/[id] - Exception:', error);
    console.error('🔄 PUT /api/incidents/[id] - Stack:', error.stack);
    return json({ error: 'Failed to update incident', details: error.message }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const result = await devOpsManager.deleteIncident(params.id);
    
    if (!result.success) {
      return json({ error: result.error }, { status: 404 });
    }
    
    return json({ message: result.message });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}