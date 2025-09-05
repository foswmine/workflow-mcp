import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDB() {
  const db = await open({
    filename: path.resolve(__dirname, '../../data/workflow.db'),
    driver: sqlite3.Database
  });
  
  const docs = await db.all('SELECT id, title, doc_type FROM documents LIMIT 3');
  console.log('📚 Documents in database:');
  docs.forEach(doc => {
    console.log(`  ${doc.id}: ${doc.title} (${doc.doc_type})`);
  });
  
  await db.close();
  console.log('✅ Database test complete!');
}

testDB().catch(console.error);
