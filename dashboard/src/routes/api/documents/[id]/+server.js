import { json } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';

const dbPath = join(process.cwd(), '../data/workflow.db');

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		const db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		const { id } = params;

		const document = await db.get(`
			SELECT d.*, 
					 GROUP_CONCAT(
						 dl.linked_entity_type || ':' || dl.linked_entity_id || ':' || dl.link_type, 
						 '|'
					 ) as links
			FROM documents d
			LEFT JOIN document_links dl ON d.id = dl.document_id
			WHERE d.id = ?
			GROUP BY d.id
		`, [id]);

		await db.close();

		if (!document) {
			return json({ error: 'Document not found' }, { status: 404 });
		}

		// 태그와 링크 파싱
		const tags = document.tags ? JSON.parse(document.tags) : [];
		const links = document.links ? document.links.split('|').map(link => {
			const [type, id, linkType] = link.split(':');
			return { type, id, linkType };
		}) : [];

		const result = {
			...document,
			tags,
			links
		};

		return json(result);

	} catch (error) {
		console.error('Error fetching document:', error);
		return json({ error: 'Failed to fetch document' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
	try {
		const db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		const { id } = params;
		const updates = await request.json();

		// 문서 존재 확인
		const existing = await db.get('SELECT id FROM documents WHERE id = ?', [id]);
		if (!existing) {
			await db.close();
			return json({ error: 'Document not found' }, { status: 404 });
		}

		// 업데이트 쿼리 동적 생성
		const updateFields = [];
		const params_array = [];

		if (updates.title !== undefined) { updateFields.push('title = ?'); params_array.push(updates.title); }
		if (updates.content !== undefined) { updateFields.push('content = ?'); params_array.push(updates.content); }
		if (updates.summary !== undefined) { updateFields.push('summary = ?'); params_array.push(updates.summary); }
		if (updates.status !== undefined) { updateFields.push('status = ?'); params_array.push(updates.status); }
		if (updates.tags !== undefined) { updateFields.push('tags = ?'); params_array.push(JSON.stringify(updates.tags)); }
		
		updateFields.push('updated_at = CURRENT_TIMESTAMP');
		updateFields.push('version = version + 1');
		params_array.push(id);

		const sql = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`;
		await db.run(sql, params_array);

		await db.close();

		return json({
			success: true,
			message: 'Document updated successfully'
		});

	} catch (error) {
		console.error('Error updating document:', error);
		return json({ error: 'Failed to update document' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
	try {
		const db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		const { id } = params;

		// 문서 존재 확인
		const existing = await db.get('SELECT title FROM documents WHERE id = ?', [id]);
		if (!existing) {
			await db.close();
			return json({ error: 'Document not found' }, { status: 404 });
		}

		// 문서 삭제
		await db.run('DELETE FROM documents WHERE id = ?', [id]);

		await db.close();

		return json({
			success: true,
			message: 'Document deleted successfully'
		});

	} catch (error) {
		console.error('Error deleting document:', error);
		return json({ error: 'Failed to delete document' }, { status: 500 });
	}
}