// SQLite 연결 테스트
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing SQLite connection...');

const dbPath = path.join(__dirname, 'data', 'test.db');
console.log(`Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ SQLite connection successful!');
    
    // 간단한 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY,
      message TEXT
    )`, (err) => {
      if (err) {
        console.error('❌ Table creation failed:', err.message);
      } else {
        console.log('✅ Test table created!');
        
        // 테스트 데이터 삽입
        db.run('INSERT INTO test (message) VALUES (?)', ['Hello SQLite!'], (err) => {
          if (err) {
            console.error('❌ Data insertion failed:', err.message);
          } else {
            console.log('✅ Test data inserted!');
            
            // 데이터 조회
            db.get('SELECT * FROM test ORDER BY id DESC LIMIT 1', (err, row) => {
              if (err) {
                console.error('❌ Data query failed:', err.message);
              } else {
                console.log(`✅ Query result: ${row.message}`);
              }
              
              db.close((err) => {
                if (err) {
                  console.error('❌ Database close failed:', err.message);
                } else {
                  console.log('✅ Database connection closed');
                }
                process.exit(0);
              });
            });
          }
        });
      }
    });
  }
});