import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'workflow.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Check tables
db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
    if (err) {
        console.error('Error getting tables:', err);
        return;
    }
    console.log('Tables:', tables.map(t => t.name));
    
    // Check documents
    db.all('SELECT id, title, doc_type, category, status FROM documents LIMIT 5', (err, docs) => {
        if (err) {
            console.error('Error getting documents:', err);
        } else {
            console.log('Documents found:', docs.length);
            docs.forEach(doc => {
                console.log(`- [${doc.id}] ${doc.title} (${doc.doc_type}/${doc.category}) - ${doc.status}`);
            });
        }
        db.close();
    });
});