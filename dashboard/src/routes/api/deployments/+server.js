import { json } from '@sveltejs/kit';
import { DevOpsManager } from '../../../lib/server/DevOpsManager.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const devOpsManager = new DevOpsManager();
    
    // Get query parameters for filtering
    const status = url.searchParams.get('status');
    const environment_id = url.searchParams.get('environment_id');
    const sort_by = url.searchParams.get('sort_by') || 'scheduled_desc';
    
    const result = await devOpsManager.listDeployments(
      environment_id,
      status,
      null, // deployment_type
      null, // project_id
      sort_by
    );
    
    if (result.success) {
      return json(result.deployments);
    } else {
      console.error('Error fetching deployments:', result.message);
      return json([], { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return json([], { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const deploymentData = await request.json();
    const devOpsManager = new DevOpsManager();
    
    const result = await devOpsManager.createDeployment(deploymentData);
    
    if (result.success) {
      return json(result.deployment, { status: 201 });
    } else {
      console.error('Error creating deployment:', result.message);
      return json({ error: result.message || 'Failed to create deployment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating deployment:', error);
    return json({ error: 'Failed to create deployment' }, { status: 500 });
  }
}