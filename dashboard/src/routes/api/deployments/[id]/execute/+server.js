import { json } from '@sveltejs/kit';
import { DevOpsManager } from '../../../../../lib/server/DevOpsManager.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
  try {
    const deploymentId = params.id;
    const requestData = await request.json();
    const devOpsManager = new DevOpsManager();
    
    // 배포 실행 - 상태를 completed로 변경하고 실행 시간 기록
    const updateData = {
      status: 'completed',
      executed_at: new Date().toISOString(),
      execution_log: requestData.execution_log || 'Deployment executed via dashboard',
      actual_duration: requestData.actual_duration || null
    };
    
    const result = await devOpsManager.updateDeployment(deploymentId, updateData);
    
    if (result.success) {
      return json({ 
        success: true, 
        deployment: result.deployment,
        message: '배포가 성공적으로 실행되었습니다'
      });
    } else {
      console.error('Error executing deployment:', result.error);
      return json({ 
        success: false,
        error: result.error || 'Failed to execute deployment' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error executing deployment:', error);
    return json({ 
      success: false,
      error: 'Failed to execute deployment' 
    }, { status: 500 });
  }
}