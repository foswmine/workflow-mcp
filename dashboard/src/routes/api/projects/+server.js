import { json } from '@sveltejs/kit';
import { ProjectManager } from '$lib/server/ProjectManager.js';

// ProjectManager 인스턴스 생성
const projectManager = new ProjectManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const status = url.searchParams.get('status');
    const sortBy = url.searchParams.get('sort') || 'updated_desc';
    
    const result = await projectManager.listProjects(status, sortBy);
    return json(result.projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const data = await request.json();
    
    const result = await projectManager.createProject(data);
    return json({ id: result.project.id, message: result.message }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}