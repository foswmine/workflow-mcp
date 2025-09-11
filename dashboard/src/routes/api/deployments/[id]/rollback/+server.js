import { json } from '@sveltejs/kit';
import { DevOpsManager } from '../../../../../lib/server/DevOpsManager.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
  try {
    const deploymentId = params.id;
    const requestData = await request.json();
    const devOpsManager = new DevOpsManager();
    
    // 배포 롤백 - 상태를 rolled_back로 변경하고 롤백 정보 기록
    const updateData = {
      status: 'rolled_back',
      rollback_reason: requestData.rollback_reason || 'Rollback requested via dashboard',
      rollback_notes: requestData.rollback_notes || 'Rollback executed via dashboard',
      rollback_executed_at: new Date().toISOString()
    };
    
    const result = await devOpsManager.updateDeployment(deploymentId, updateData);
    
    if (result.success) {
      return json({ 
        success: true, 
        deployment: result.deployment,
        message: '배포가 성공적으로 롤백되었습니다'
      });
    } else {
      console.error('Error rolling back deployment:', result.error);
      return json({ 
        success: false,
        error: result.error || 'Failed to rollback deployment' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error rolling back deployment:', error);
    return json({ 
      success: false,
      error: 'Failed to rollback deployment' 
    }, { status: 500 });
  }
}