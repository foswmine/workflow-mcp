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
    const metric_name = url.searchParams.get('metric_name');
    const time_range = url.searchParams.get('time_range') || '24h';
    const aggregation = url.searchParams.get('aggregation') || 'latest';
    
    let timeFilter = '';
    switch (time_range) {
      case '1h':
        timeFilter = 'timestamp >= datetime("now", "-1 hour")';
        break;
      case '6h':
        timeFilter = 'timestamp >= datetime("now", "-6 hours")';
        break;
      case '7d':
        timeFilter = 'timestamp >= datetime("now", "-7 days")';
        break;
      case '30d':
        timeFilter = 'timestamp >= datetime("now", "-30 days")';
        break;
      default: // 24h
        timeFilter = 'timestamp >= datetime("now", "-24 hours")';
    }
    
    let query;
    const params = [];
    
    if (aggregation === 'latest') {
      // Get latest metrics for each environment and metric name
      query = `
        SELECT 
          pm.*,
          ROW_NUMBER() OVER (PARTITION BY environment_id, metric_name ORDER BY timestamp DESC) as rn
        FROM performance_metrics pm 
        WHERE ${timeFilter}
      `;
      
      if (environment_id) {
        query += ' AND environment_id = ?';
        params.push(environment_id);
      }
      
      if (metric_name) {
        query += ' AND metric_name = ?';
        params.push(metric_name);
      }
      
      query = `SELECT * FROM (${query}) WHERE rn = 1 ORDER BY metric_name, environment_id`;
      
    } else {
      // Aggregated metrics
      let aggregateFunc = 'AVG';
      switch (aggregation) {
        case 'sum':
          aggregateFunc = 'SUM';
          break;
        case 'max':
          aggregateFunc = 'MAX';
          break;
        case 'min':
          aggregateFunc = 'MIN';
          break;
        case 'count':
          aggregateFunc = 'COUNT';
          break;
        default:
          aggregateFunc = 'AVG';
      }
      
      query = `
        SELECT 
          environment_id,
          metric_name,
          ${aggregateFunc}(metric_value) as aggregated_value,
          unit,
          MIN(timestamp) as first_recorded,
          MAX(timestamp) as last_recorded,
          COUNT(*) as data_points
        FROM performance_metrics 
        WHERE ${timeFilter}
      `;
      
      if (environment_id) {
        query += ' AND environment_id = ?';
        params.push(environment_id);
      }
      
      if (metric_name) {
        query += ' AND metric_name = ?';
        params.push(metric_name);
      }
      
      query += ' GROUP BY environment_id, metric_name ORDER BY metric_name, environment_id';
    }
    
    const metrics = await db.all(query, params);
    
    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT environment_id) as total_environments,
        COUNT(DISTINCT metric_name) as total_metrics,
        COUNT(*) as total_data_points,
        MIN(timestamp) as earliest_data,
        MAX(timestamp) as latest_data
      FROM performance_metrics 
      WHERE ${timeFilter}
    `;
    
    const summary = await db.get(summaryQuery);
    await db.close();
    
    return json({
      metrics: metrics,
      summary: summary,
      filters: {
        time_range,
        aggregation,
        environment_id,
        metric_name
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return json({ 
      metrics: [], 
      summary: { total_environments: 0, total_metrics: 0, total_data_points: 0 },
      filters: {}
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const metricData = await request.json();
    const db = await getDatabase();
    
    const metricId = crypto.randomUUID();
    await db.run(`
      INSERT INTO performance_metrics (
        id, environment_id, metric_name, metric_value, unit, 
        tags, threshold_warning, threshold_critical, 
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      metricId, 
      metricData.environment_id,
      metricData.metric_name,
      metricData.metric_value,
      metricData.unit || null, 
      JSON.stringify(metricData.tags || {}),
      metricData.threshold_warning || null,
      metricData.threshold_critical || null
    ]);

    const metric = await db.get('SELECT * FROM performance_metrics WHERE id = ?', [metricId]);
    await db.close();
    
    return json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating performance metric:', error);
    return json({ error: 'Failed to create performance metric' }, { status: 500 });
  }
}