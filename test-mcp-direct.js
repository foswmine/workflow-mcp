#!/usr/bin/env node
/**
 * MCP 서버와 직접 통신 테스트
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPServer() {
  console.log('Testing MCP server direct communication...');
  
  const serverPath = join(__dirname, 'src', 'test-server.js');
  console.log(`Server path: ${serverPath}`);
  
  const child = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Test initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  child.stdin.write(JSON.stringify(initRequest) + '\n');
  
  child.stdout.on('data', (data) => {
    console.log('Server response:', data.toString());
  });
  
  child.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString());
  });
  
  setTimeout(() => {
    child.kill();
    console.log('Test completed');
  }, 3000);
}

testMCPServer().catch(console.error);