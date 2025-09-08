import sqlite3 from 'sqlite3';

console.log('=== 데이터베이스 현재 상태 확인 ===');

const db = new sqlite3.Database('./data/workflow.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  
  // PRD 개수 확인
  db.get('SELECT COUNT(*) as count FROM prds', (err, result) => {
    if (err) {
      console.error('PRD count error:', err);
    } else {
      console.log('📊 Total PRDs in database:', result.count);
    }
    
    // 최신 PRD 확인
    db.all('SELECT id, title, created_at FROM prds ORDER BY created_at DESC LIMIT 5', (err, rows) => {
      if (err) {
        console.error('Recent PRDs error:', err);
      } else {
        console.log('\n📋 Recent PRDs:');
        rows.forEach((row, i) => {
          const shortId = row.id.substring(0, 8);
          const date = new Date(row.created_at).toLocaleString();
          console.log(`  ${i+1}. ${shortId}... - ${row.title}`);
          console.log(`     Created: ${date}`);
        });
      }
      
      db.close();
    });
  });
});