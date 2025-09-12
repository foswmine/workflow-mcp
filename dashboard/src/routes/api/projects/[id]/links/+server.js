import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/database.js';

// SQLite 연결 없이 직접 getDatabase 사용

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
  try {
    const { entity_type, entity_id, link_type = 'direct' } = await request.json();
    
    if (!entity_type || !entity_id) {
      return json({ error: 'entity_type과 entity_id는 필수입니다' }, { status: 400 });
    }

    if (!['prd', 'task', 'design', 'document', 'test'].includes(entity_type)) {
      return json({ error: 'entity_type은 prd, task, design, document, test 중 하나여야 합니다' }, { status: 400 });
    }

    const database = await getDatabase();

    // 중복 연결 체크
    const existingLink = await database.get(`
      SELECT id FROM project_links 
      WHERE project_id = ? AND entity_type = ? AND entity_id = ?
    `, [params.id, entity_type, entity_id]);

    if (existingLink) {
      return json({ error: '이미 연결된 항목입니다' }, { status: 409 });
    }

    // 연결 생성
    const result = await database.run(`
      INSERT INTO project_links (project_id, entity_type, entity_id, link_type)
      VALUES (?, ?, ?, ?)
    `, [params.id, entity_type, entity_id, link_type]);

    return json({ 
      success: true,
      linkId: result.lastID,
      message: `${entity_type} 연결 완료`
    });

  } catch (error) {
    console.error('Error creating project link:', error);
    return json({ error: error.message || '프로젝트 연결 실패' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const database = await getDatabase();

    // 프로젝트의 모든 연결된 항목 조회
    const links = await database.all(`
      SELECT 
        pl.id as link_id,
        pl.entity_type,
        pl.entity_id,
        pl.link_type,
        pl.created_at as linked_at,
        CASE 
          WHEN pl.entity_type = 'prd' THEN p.title
          WHEN pl.entity_type = 'task' THEN t.title  
          WHEN pl.entity_type = 'design' THEN d.title
          WHEN pl.entity_type = 'document' THEN doc.title
          WHEN pl.entity_type = 'test' THEN tc.title
        END as title,
        CASE 
          WHEN pl.entity_type = 'prd' THEN p.description
          WHEN pl.entity_type = 'task' THEN t.description
          WHEN pl.entity_type = 'design' THEN d.description
          WHEN pl.entity_type = 'document' THEN doc.summary
          WHEN pl.entity_type = 'test' THEN tc.description
        END as description,
        CASE 
          WHEN pl.entity_type = 'prd' THEN p.status
          WHEN pl.entity_type = 'task' THEN t.status
          WHEN pl.entity_type = 'design' THEN d.status
          WHEN pl.entity_type = 'document' THEN doc.status
          WHEN pl.entity_type = 'test' THEN tc.status
        END as status,
        CASE 
          WHEN pl.entity_type = 'prd' THEN p.priority
          WHEN pl.entity_type = 'task' THEN t.priority
          WHEN pl.entity_type = 'design' THEN d.priority
          WHEN pl.entity_type = 'document' THEN NULL
          WHEN pl.entity_type = 'test' THEN tc.priority
        END as priority,
        CASE 
          WHEN pl.entity_type = 'document' THEN doc.doc_type
          WHEN pl.entity_type = 'test' THEN tc.type
          ELSE NULL
        END as doc_type,
        CASE 
          WHEN pl.entity_type = 'document' THEN doc.summary
          WHEN pl.entity_type = 'test' THEN tc.expected_result
          ELSE NULL
        END as summary,
        CASE 
          WHEN pl.entity_type = 'test' THEN tc.estimated_duration
          ELSE NULL
        END as estimated_duration
      FROM project_links pl
      LEFT JOIN prds p ON pl.entity_type = 'prd' AND pl.entity_id = p.id
      LEFT JOIN tasks t ON pl.entity_type = 'task' AND pl.entity_id = t.id  
      LEFT JOIN designs d ON pl.entity_type = 'design' AND pl.entity_id = d.id
      LEFT JOIN documents doc ON pl.entity_type = 'document' AND pl.entity_id = doc.id
      LEFT JOIN test_cases tc ON pl.entity_type = 'test' AND pl.entity_id = tc.id
      WHERE pl.project_id = ?
      ORDER BY pl.entity_type, pl.created_at DESC
    `, [params.id]);

    // 타입별로 그룹화
    const groupedLinks = {
      prds: links.filter(link => link.entity_type === 'prd'),
      tasks: links.filter(link => link.entity_type === 'task'),
      designs: links.filter(link => link.entity_type === 'design'),
      documents: links.filter(link => link.entity_type === 'document'),
      tests: links.filter(link => link.entity_type === 'test')
    };

    return json({
      success: true,
      links: groupedLinks,
      total: links.length,
      message: `프로젝트 연결 항목 ${links.length}개 조회`
    });

  } catch (error) {
    console.error('Error fetching project links:', error);
    return json({ error: error.message || '프로젝트 연결 조회 실패' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, request, url }) {
  try {
    const database = await getDatabase();
    
    // URL 경로에 'all'이 포함된 경우 전체 삭제
    if (url.pathname.endsWith('/all')) {
      const result = await database.run(`
        DELETE FROM project_links 
        WHERE project_id = ?
      `, [params.id]);

      return json({
        success: true,
        deletedCount: result.changes,
        message: `프로젝트의 모든 연결 해제 완료 (${result.changes}개)`
      });
    }
    
    // 개별 연결 삭제 (기존 로직)
    const { entity_type, entity_id } = await request.json();
    
    if (!entity_type || !entity_id) {
      return json({ error: 'entity_type과 entity_id는 필수입니다' }, { status: 400 });
    }

    const result = await database.run(`
      DELETE FROM project_links 
      WHERE project_id = ? AND entity_type = ? AND entity_id = ?
    `, [params.id, entity_type, entity_id]);

    if (result.changes === 0) {
      return json({ error: '연결을 찾을 수 없습니다' }, { status: 404 });
    }

    return json({
      success: true,
      message: `${entity_type} 연결 해제 완료`
    });

  } catch (error) {
    console.error('Error deleting project link:', error);
    return json({ error: error.message || '프로젝트 연결 해제 실패' }, { status: 500 });
  }
}