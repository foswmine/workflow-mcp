import { json } from '@sveltejs/kit';
import { DevOpsManager } from '../../../lib/server/DevOpsManager.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const devOpsManager = new DevOpsManager();
    
    const environment_type = url.searchParams.get('environment_type');
    const status = url.searchParams.get('status');
    const project_id = url.searchParams.get('project_id');
    
    const result = await devOpsManager.listEnvironments(environment_type, status, project_id);
    
    if (result.success) {
      return json(result.environments);
    } else {
      console.error('Error fetching environments:', result.message);
      return json([], { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching environments:', error);
    return json([], { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const envData = await request.json();
    const devOpsManager = new DevOpsManager();
    
    const result = await devOpsManager.createEnvironment(envData);
    
    if (result.success) {
      return json(result.environment, { status: 201 });
    } else {
      console.error('Error creating environment:', result.message || result.error);
      return json({ error: result.message || result.error || 'Failed to create environment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating environment:', error);
    return json({ error: 'Failed to create environment' }, { status: 500 });
  }
}