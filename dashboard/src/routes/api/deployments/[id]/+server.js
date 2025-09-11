import { jsonResponse } from '../../../../lib/server/utils.js';
import { DevOpsManager } from '../../../../lib/server/DevOpsManager.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const devOpsManager = new DevOpsManager();
    const deploymentId = params.id;
    
    const result = await devOpsManager.getDeployment(deploymentId);
    
    if (result.success) {
      return jsonResponse(result.deployment);
    } else {
      console.error('Error fetching deployment:', result.error);
      return jsonResponse({ error: result.error || 'Deployment not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching deployment:', error);
    return jsonResponse({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const deploymentId = params.id;
    
    // UTF-8 인코딩을 명시적으로 처리
    const arrayBuffer = await request.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const textData = decoder.decode(arrayBuffer);
    const updateData = JSON.parse(textData);
    
    const devOpsManager = new DevOpsManager();
    const result = await devOpsManager.updateDeployment(deploymentId, updateData);
    
    if (result.success) {
      return jsonResponse(result.deployment);
    } else {
      console.error('Error updating deployment:', result.error);
      return jsonResponse({ error: result.error || 'Failed to update deployment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating deployment:', error);
    return jsonResponse({ error: 'Failed to update deployment' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    const deploymentId = params.id;
    const devOpsManager = new DevOpsManager();
    
    // DevOpsManager에 deleteDeployment 메서드가 있는지 확인 후 호출
    const result = await devOpsManager.deleteDeployment(deploymentId);
    
    if (result.success) {
      return jsonResponse({ 
        success: true, 
        message: result.message || `배포 "${deploymentId}" 삭제 완료` 
      });
    } else {
      console.error('Error deleting deployment:', result.error);
      return jsonResponse({ error: result.error || 'Failed to delete deployment' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting deployment:', error);
    return jsonResponse({ error: 'Failed to delete deployment' }, { status: 500 });
  }
}