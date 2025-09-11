import { ProjectManager } from '$lib/server/ProjectManager.js';
import { jsonResponse } from '$lib/server/utils.js';

// ProjectManager 인스턴스 생성
const projectManager = new ProjectManager();

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const status = url.searchParams.get('status');
    const sortBy = url.searchParams.get('sort') || 'updated_desc';
    
    const result = await projectManager.listProjects(status, sortBy);
    return jsonResponse(result.projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return jsonResponse({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // UTF-8 인코딩을 명시적으로 처리
    const arrayBuffer = await request.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const textData = decoder.decode(arrayBuffer);
    const data = JSON.parse(textData);
    
    const result = await projectManager.createProject(data);
    return jsonResponse({ id: result.project.id, message: result.message }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return jsonResponse({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}