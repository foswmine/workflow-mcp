import { json } from '@sveltejs/kit';
import { ProjectManager } from '$lib/server/ProjectManager.js';

// ProjectManager 인스턴스 생성
const projectManager = new ProjectManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const result = await projectManager.getProject(params.id);
    return json(result.project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return json({ error: error.message || 'Failed to fetch project' }, { status: 404 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const data = await request.json();
    
    const result = await projectManager.updateProject(params.id, data);
    return json({ message: result.message, project: result.project });
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request }) {
  try {
    const data = await request.json();
    
    const result = await projectManager.updateProject(params.id, data);
    return json({ message: result.message, project: result.project });
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const result = await projectManager.deleteProject(params.id);
    return json({ message: result.message });
  } catch (error) {
    console.error('Error deleting project:', error);
    return json({ error: error.message || 'Failed to delete project' }, { status: 500 });
  }
}