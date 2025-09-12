import { json } from '@sveltejs/kit';
import { DevOpsManager } from '$lib/server/DevOpsManager.js';

// DevOpsManager 인스턴스 생성
const devOpsManager = new DevOpsManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    // Get query parameters for filtering
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    const incident_type = url.searchParams.get('incident_type');
    const environment_id = url.searchParams.get('environment_id');
    const sort_by = url.searchParams.get('sort_by') || 'created_desc';
    
    const result = await devOpsManager.listIncidents(severity, status, incident_type, environment_id, sort_by);
    return json(result.incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return json([], { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const incidentData = await request.json();
    
    const result = await devOpsManager.createIncident(incidentData);
    return json({ id: result.incident.id, message: result.message }, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return json({ error: 'Failed to create incident' }, { status: 500 });
  }
}