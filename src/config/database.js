/**
 * 중앙 집중식 데이터베이스 설정
 * 모든 Storage 클래스에서 동일한 데이터베이스 경로 사용
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP 서버용 데이터베이스 경로 설정
// src/config/ -> project root (2 levels up) -> data/workflow.db
export const DATABASE_PATH = path.resolve(__dirname, '../../data/workflow.db');

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
  }
};

// 디버그용 로그
console.log('🗄️ MCP Server Database Config:', {
  path: DATABASE_PATH,
  exists: existsSync(DATABASE_PATH)
});