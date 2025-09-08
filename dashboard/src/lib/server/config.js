/**
 * 공통 설정 파일
 * 데이터베이스 경로 및 기타 설정을 중앙 집중식으로 관리
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 중앙 집중식 데이터베이스 경로 설정
// dashboard/src/lib/server/ -> project root (4 levels up) -> data/workflow.db
export const DATABASE_PATH = path.resolve(__dirname, '../../../../data/workflow.db');

// 기타 공통 설정
export const config = {
  database: {
    path: DATABASE_PATH,
    timeout: 30000,
    busyTimeout: 30000
  },
  
  // 로깅 설정
  logging: {
    enabled: true,
    level: 'info'
  },
  
  // 캐시 설정
  cache: {
    enabled: false,
    ttl: 300000 // 5분
  }
};

// 디버그용 로그
console.log('📁 Database Config:', {
  path: DATABASE_PATH,
  exists: existsSync(DATABASE_PATH)
});