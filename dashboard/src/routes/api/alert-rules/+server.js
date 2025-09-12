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
    const enabled = url.searchParams.get('enabled');
    const severity = url.searchParams.get('severity');
    const rule_type = url.searchParams.get('rule_type');
    const environment_id = url.searchParams.get('environment_id');
    const sort_by = url.searchParams.get('sort_by') || 'created_desc';
    
    let query = 'SELECT * FROM alert_rules WHERE 1=1';
    const params = [];
    
    if (enabled !== null) {
      query += ' AND enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
    }
    
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    
    if (rule_type) {
      query += ' AND rule_type = ?';
      params.push(rule_type);
    }
    
    if (environment_id) {
      query += ' AND environment_id = ?';
      params.push(environment_id);
    }
    
    // Add sorting
    switch (sort_by) {
      case 'created_asc':
        query += ' ORDER BY created_at ASC';
        break;
      case 'name_asc':
        query += ' ORDER BY name ASC';
        break;
      case 'name_desc':
        query += ' ORDER BY name DESC';
        break;
      case 'severity_desc':
        query += ' ORDER BY CASE severity WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 WHEN "low" THEN 4 END';
        break;
      case 'updated_desc':
        query += ' ORDER BY updated_at DESC';
        break;
      default: // created_desc
        query += ' ORDER BY created_at DESC';
    }
    
    const alertRules = await db.all(query, params);
    
    // Get summary statistics
    const summary = await db.get(`
      SELECT 
        COUNT(*) as total_rules,
        COUNT(CASE WHEN enabled = 1 THEN 1 END) as enabled_rules,
        COUNT(CASE WHEN enabled = 0 THEN 1 END) as disabled_rules,
        COUNT(CASE WHEN severity = 'critical' AND enabled = 1 THEN 1 END) as critical_active,
        COUNT(CASE WHEN severity = 'high' AND enabled = 1 THEN 1 END) as high_active,
        COUNT(CASE WHEN severity = 'medium' AND enabled = 1 THEN 1 END) as medium_active,
        COUNT(CASE WHEN severity = 'low' AND enabled = 1 THEN 1 END) as low_active
      FROM alert_rules
    `);
    
    await db.close();
    
    return json({
      alert_rules: alertRules,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return json({ 
      alert_rules: [], 
      summary: { total_rules: 0, enabled_rules: 0, disabled_rules: 0, critical_active: 0, high_active: 0, medium_active: 0, low_active: 0 }
    }, { status: 500 });
  }
}

/** @type {import './$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const ruleData = await request.json();
    const db = await getDatabase();
    
    const ruleId = crypto.randomUUID();
    await db.run(`
      INSERT INTO alert_rules (
        id, name, description, rule_type, condition_expression, 
        severity, environment_id, threshold_value, notification_channels, 
        enabled, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      ruleId, 
      ruleData.name,
      ruleData.description || null,
      ruleData.rule_type || 'threshold',
      ruleData.condition_expression,
      ruleData.severity || 'medium', 
      ruleData.environment_id || null,
      ruleData.threshold_value || null,
      JSON.stringify(ruleData.notification_channels || []),
      ruleData.enabled !== undefined ? (ruleData.enabled ? 1 : 0) : 1,
      JSON.stringify(ruleData.tags || [])
    ]);

    const alertRule = await db.get('SELECT * FROM alert_rules WHERE id = ?', [ruleId]);
    await db.close();
    
    return json(alertRule, { status: 201 });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    return json({ error: 'Failed to create alert rule' }, { status: 500 });
  }
}