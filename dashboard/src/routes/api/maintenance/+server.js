import { json } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = './data/workflow.db';

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
    const status = url.searchParams.get('status');
    const maintenance_type = url.searchParams.get('maintenance_type');
    const environment_id = url.searchParams.get('environment_id');
    const upcoming_only = url.searchParams.get('upcoming_only');
    const sort_by = url.searchParams.get('sort_by') || 'scheduled_desc';
    
    let query = 'SELECT * FROM maintenance_schedules WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (maintenance_type) {
      query += ' AND maintenance_type = ?';
      params.push(maintenance_type);
    }
    
    if (environment_id) {
      query += ' AND environment_id = ?';
      params.push(environment_id);
    }
    
    if (upcoming_only === 'true') {
      query += ' AND scheduled_start >= datetime("now")';
    }
    
    // Add sorting
    switch (sort_by) {
      case 'scheduled_asc':
        query += ' ORDER BY scheduled_start ASC';
        break;
      case 'created_desc':
        query += ' ORDER BY created_at DESC';
        break;
      case 'created_asc':
        query += ' ORDER BY created_at ASC';
        break;
      case 'status':
        query += ' ORDER BY status, scheduled_start ASC';
        break;
      case 'duration_desc':
        query += ' ORDER BY estimated_duration DESC';
        break;
      default: // scheduled_desc
        query += ' ORDER BY scheduled_start DESC NULLS LAST';
    }
    
    const maintenanceSchedules = await db.all(query, params);
    
    // Get summary statistics
    const summary = await db.get(`
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN scheduled_start >= datetime("now") THEN 1 END) as upcoming,
        COUNT(CASE WHEN scheduled_start < datetime("now") AND status = 'scheduled' THEN 1 END) as overdue
      FROM maintenance_schedules
    `);
    
    // Get upcoming maintenance (next 7 days)
    const upcomingMaintenance = await db.all(`
      SELECT *
      FROM maintenance_schedules 
      WHERE scheduled_start BETWEEN datetime("now") AND datetime("now", "+7 days")
        AND status IN ('scheduled', 'in_progress')
      ORDER BY scheduled_start ASC
      LIMIT 10
    `);
    
    await db.close();
    
    return json({
      maintenance_schedules: maintenanceSchedules,
      summary: summary,
      upcoming: upcomingMaintenance
    });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    return json({ 
      maintenance_schedules: [], 
      summary: { total_schedules: 0, scheduled: 0, in_progress: 0, completed: 0, cancelled: 0, upcoming: 0, overdue: 0 },
      upcoming: []
    }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const maintenanceData = await request.json();
    const db = await getDatabase();
    
    const maintenanceId = crypto.randomUUID();
    await db.run(`
      INSERT INTO maintenance_schedules (
        id, title, description, maintenance_type, status, environment_id,
        scheduled_start, scheduled_end, estimated_duration, actual_start,
        actual_end, impact_level, notification_sent, tags, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      maintenanceId, 
      maintenanceData.title,
      maintenanceData.description || null,
      maintenanceData.maintenance_type || 'planned',
      maintenanceData.status || 'scheduled',
      maintenanceData.environment_id || null,
      maintenanceData.scheduled_start,
      maintenanceData.scheduled_end || null,
      maintenanceData.estimated_duration || null,
      maintenanceData.actual_start || null,
      maintenanceData.actual_end || null,
      maintenanceData.impact_level || 'medium',
      maintenanceData.notification_sent !== undefined ? (maintenanceData.notification_sent ? 1 : 0) : 0,
      JSON.stringify(maintenanceData.tags || []),
      maintenanceData.notes || null
    ]);

    const maintenance = await db.get('SELECT * FROM maintenance_schedules WHERE id = ?', [maintenanceId]);
    await db.close();
    
    return json(maintenance, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance schedule:', error);
    return json({ error: 'Failed to create maintenance schedule' }, { status: 500 });
  }
}