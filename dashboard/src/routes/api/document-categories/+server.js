import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { json } from '@sveltejs/kit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터베이스 연결
async function getDatabase() {
    // 절대 경로로 데이터베이스 접근
    const dbPath = 'C:/dev/workflow-mcp/data/workflow.db';
    console.log('Database path:', dbPath);
    
    // 파일 존재 확인
    try {
        await import('fs/promises').then(fs => fs.access(dbPath));
        console.log('Database file exists');
    } catch (err) {
        console.error('Database file does not exist:', err);
        throw err;
    }
    
    return await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const db = await getDatabase();

        const [docTypes, categories, allTags] = await Promise.all([
            // 사용된 doc_type 목록
            db.all(`
                SELECT doc_type, COUNT(*) as count
                FROM documents 
                WHERE doc_type IS NOT NULL 
                GROUP BY doc_type
                ORDER BY count DESC, doc_type
            `),

            // 사용된 category 목록  
            db.all(`
                SELECT category, COUNT(*) as count
                FROM documents 
                WHERE category IS NOT NULL 
                GROUP BY category
                ORDER BY count DESC, category
            `),

            // 사용된 tags 목록
            db.all(`
                SELECT tags
                FROM documents 
                WHERE tags IS NOT NULL AND tags != '[]'
            `)
        ]);

        // tags 추출 및 집계
        const tagsMap = new Map();
        allTags.forEach(row => {
            try {
                const tags = JSON.parse(row.tags || '[]');
                tags.forEach(tag => {
                    tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
                });
            } catch (e) {
                // JSON 파싱 에러 무시
            }
        });

        const tags = Array.from(tagsMap.entries())
            .map(([tag, count]) => ({ value: tag, count }))
            .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

        await db.close();

        return json({
            success: true,
            doc_types: docTypes.map(row => ({
                value: row.doc_type,
                count: row.count
            })),
            categories: categories.map(row => ({
                value: row.category, 
                count: row.count
            })),
            tags: tags,
            total_documents: docTypes.reduce((sum, row) => sum + row.count, 0)
        });
    } catch (error) {
        console.error('Error fetching document categories:', error);
        return json(
            { 
                success: false, 
                error: 'Failed to fetch document categories',
                doc_types: [],
                categories: [],
                tags: [],
                total_documents: 0
            },
            { status: 500 }
        );
    }
}