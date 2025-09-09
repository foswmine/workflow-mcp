import { json } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';

const dbPath = join(process.cwd(), '../data/workflow.db');

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		
		// 쿼리 파라미터 파싱
		const doc_type = url.searchParams.get('doc_type');
		const category = url.searchParams.get('category');
		const status = url.searchParams.get('status');
		const linked_entity_type = url.searchParams.get('linked_entity_type');
		const linked_entity_id = url.searchParams.get('linked_entity_id');
		const limit = parseInt(url.searchParams.get('limit') || '50');

		let sql, params = [];

		// 연결된 엔티티로 필터링하는 경우
		if (linked_entity_type && linked_entity_id) {
			sql = `SELECT d.*, dl.link_type 
				   FROM documents d 
				   LEFT JOIN document_links dl ON d.id = dl.document_id 
				   WHERE dl.entity_type = ? AND dl.entity_id = ?`;
			params.push(linked_entity_type, linked_entity_id);
		} else {
			sql = 'SELECT * FROM documents WHERE 1=1';
		}

		if (doc_type) {
			sql += ' AND doc_type = ?';
			params.push(doc_type);
		}

		if (category) {
			sql += ' AND category = ?';
			params.push(category);
		}

		if (status) {
			sql += ' AND status = ?';
			params.push(status);
		}

		sql += ' ORDER BY updated_at DESC LIMIT ?';
		params.push(limit);

		const documents = await db.all(sql, params);
		
		await db.close();

		return json({ documents });
		
	} catch (error) {
		console.error('Error fetching documents:', error);
		return json({ error: 'Failed to fetch documents' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		const data = await request.json();

		const { title, content, doc_type, category, tags, summary } = data;

		const result = await db.run(`
			INSERT INTO documents (title, content, doc_type, category, tags, summary, created_by)
			VALUES (?, ?, ?, ?, ?, ?, 'dashboard-user')
		`, [
			title,
			content,
			doc_type,
			category || null,
			tags ? JSON.stringify(tags) : null,
			summary || null
		]);

		await db.close();

		return json({
			success: true,
			id: result.lastInsertRowid,
			message: 'Document created successfully'
		});

	} catch (error) {
		console.error('Error creating document:', error);
		return json({ error: 'Failed to create document' }, { status: 500 });
	}
}