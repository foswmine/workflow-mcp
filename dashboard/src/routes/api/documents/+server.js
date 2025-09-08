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
		const limit = parseInt(url.searchParams.get('limit') || '50');

		let sql = 'SELECT * FROM documents WHERE 1=1'; // document_overview view가 없을 수 있으므로 직접 테이블 사용
		const params = [];

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

		return json(documents);
		
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