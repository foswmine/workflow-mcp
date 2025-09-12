import { json } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';

const DB_PATH = '../data/workflow.db';

async function getDatabase() {
  return await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const db = await getDatabase();
    
    // Get query parameters for filtering
    const environment_id = url.searchParams.get('environment_id');
    const status = url.searchParams.get('status');
    const metric_type = url.searchParams.get('metric_type');
    const time_range = url.searchParams.get('time_range') || '24h';
    
    let query = 'SELECT * FROM system_health WHERE 1=1';
    const params = [];
    
    if (environment_id) {
      query += ' AND environment_id = ?';
      params.push(environment_id);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (metric_type) {
      query += ' AND metric_type = ?';
      params.push(metric_type);
    }
    
    // Add time range filter
    switch (time_range) {
      case '1h':
        query += ' AND checked_at >= datetime("now", "-1 hour")';
        break;
      case '6h':
        query += ' AND checked_at >= datetime("now", "-6 hours")';
        break;
      case '7d':
        query += ' AND checked_at >= datetime("now", "-7 days")';
        break;
      case '30d':
        query += ' AND checked_at >= datetime("now", "-30 days")';
        break;
      default: // 24h
        query += ' AND checked_at >= datetime("now", "-24 hours")';
    }
    
    query += ' ORDER BY checked_at DESC';
    
    const healthData = await db.all(query, params);
    
    // Get environment summary
    const envSummary = await db.all(`
      SELECT 
        environment_id,
        status,
        cpu_usage,
        response_time,
        MAX(checked_at) as last_check
      FROM system_health 
      WHERE checked_at >= datetime("now", "-1 hour")
      GROUP BY environment_id
      ORDER BY environment_id
    `);
    
    await db.close();
    
    return json({
      environments: envSummary,
      metrics: healthData,
      summary: {
        total_environments: envSummary.length,
        healthy: envSummary.filter(e => e.status === 'healthy').length,
        warning: envSummary.filter(e => e.status === 'warning').length,
        critical: envSummary.filter(e => e.status === 'critical').length,
        avg_uptime: envSummary.length > 0 
          ? envSummary.reduce((acc, e) => acc + (e.cpu_usage || 0), 0) / envSummary.length 
          : 0,
        avg_response_time: envSummary.length > 0 
          ? envSummary.reduce((acc, e) => acc + (e.response_time || 0), 0) / envSummary.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return json({ 
      environments: [], 
      metrics: [], 
      summary: { total_environments: 0, healthy: 0, warning: 0, critical: 0, avg_uptime: 0, avg_response_time: 0 }
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const healthData = await request.json();
    const db = await getDatabase();
    
    const healthId = crypto.randomUUID();
    await db.run(`
      INSERT INTO system_health (
        id, environment_id, status, cpu_usage, response_time, 
        cpu_usage, memory_usage, disk_usage, error_rate, 
        metric_type, metric_data, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      healthId, 
      healthData.environment_id,
      healthData.status || 'unknown',
      healthData.cpu_usage || null,
      healthData.response_time || null, 
      healthData.cpu_usage || null,
      healthData.memory_usage || null,
      healthData.disk_usage || null,
      healthData.error_rate || null,
      healthData.metric_type || 'general',
      JSON.stringify(healthData.metric_data || {})
    ]);

    const health = await db.get('SELECT * FROM system_health WHERE id = ?', [healthId]);
    await db.close();
    
    return json(health, { status: 201 });
  } catch (error) {
    console.error('Error creating system health record:', error);
    return json({ error: 'Failed to create system health record' }, { status: 500 });
  }
}