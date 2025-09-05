import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

// Database path - reference the main workflow-mcp database using file location
// dashboard/src/lib/server -> ../../../../data/workflow.db 
const DB_PATH = path.resolve(__dirname, '../../../../data/workflow.db');

import fs from 'fs';

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Enable WAL mode for better concurrent access
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

// PRD operations
export async function getAllPRDs() {
  const database = await getDatabase();
  return await database.all(`
    SELECT p.*, 
           COUNT(DISTINCT t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM prds p
    LEFT JOIN plans pl ON p.id = pl.prd_id
    LEFT JOIN tasks t ON pl.id = t.plan_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
}

export async function getPRDById(id) {
  const database = await getDatabase();
  return await database.get('SELECT * FROM prds WHERE id = ?', id);
}

export async function createPRD(prd) {
  const database = await getDatabase();
  const result = await database.run(
    'INSERT INTO prds (title, description, requirements, acceptance_criteria, priority, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [prd.title, prd.description, JSON.stringify(prd.requirements), JSON.stringify(prd.acceptance_criteria), prd.priority, prd.status]
  );
  return result.lastID;
}

export async function updatePRD(id, prd) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE prds SET title = ?, description = ?, requirements = ?, acceptance_criteria = ?, priority = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
    [prd.title, prd.description, JSON.stringify(prd.requirements), JSON.stringify(prd.acceptance_criteria), prd.priority, prd.status, id]
  );
}

export async function deletePRD(id) {
  const database = await getDatabase();
  return await database.run('DELETE FROM prds WHERE id = ?', id);
}

// Task operations
export async function getAllTasks() {
  const database = await getDatabase();
  return await database.all(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN plans pl ON t.plan_id = pl.id
    LEFT JOIN prds p ON pl.prd_id = p.id
    ORDER BY t.created_at DESC
  `);
}

export async function getTaskById(id) {
  const database = await getDatabase();
  return await database.get(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN plans pl ON t.plan_id = pl.id
    LEFT JOIN prds p ON pl.prd_id = p.id
    WHERE t.id = ?
  `, id);
}

export async function getTasksByPRDId(prdId) {
  const database = await getDatabase();
  return await database.all(`
    SELECT t.*, pl.title as plan_title, p.title as prd_title
    FROM tasks t
    LEFT JOIN plans pl ON t.plan_id = pl.id
    LEFT JOIN prds p ON pl.prd_id = p.id
    WHERE p.id = ?
    ORDER BY t.created_at ASC
  `, prdId);
}

export async function createTask(task) {
  const database = await getDatabase();
  const result = await database.run(
    'INSERT INTO tasks (title, description, status, priority, due_date, plan_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [task.title, task.description, task.status, task.priority, task.due_date, task.plan_id]
  );
  return result.lastID;
}

export async function updateTask(id, task) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, plan_id = ?, updated_at = datetime("now") WHERE id = ?',
    [task.title, task.description, task.status, task.priority, task.due_date, task.plan_id, id]
  );
}

export async function updateTaskStatus(id, status) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ?',
    [status, id]
  );
}

export async function deleteTask(id) {
  const database = await getDatabase();
  return await database.run('DELETE FROM tasks WHERE id = ?', id);
}

// Plan operations
export async function getAllPlans() {
  const database = await getDatabase();
  return await database.all(`
    SELECT p.*, 
           COUNT(DISTINCT t.id) as task_count,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM plans p
    LEFT JOIN tasks t ON p.id = t.plan_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
}

export async function getPlanById(id) {
  const database = await getDatabase();
  return await database.get('SELECT * FROM plans WHERE id = ?', id);
}

export async function createPlan(plan) {
  const database = await getDatabase();
  const result = await database.run(
    'INSERT INTO plans (title, description, timeline, milestones, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
    [plan.title, plan.description, JSON.stringify(plan.timeline), JSON.stringify(plan.milestones), plan.status]
  );
  return result.lastID;
}

export async function updatePlan(id, plan) {
  const database = await getDatabase();
  return await database.run(
    'UPDATE plans SET title = ?, description = ?, timeline = ?, milestones = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
    [plan.title, plan.description, JSON.stringify(plan.timeline), JSON.stringify(plan.milestones), plan.status, id]
  );
}

export async function deletePlan(id) {
  const database = await getDatabase();
  return await database.run('DELETE FROM plans WHERE id = ?', id);
}

// Dashboard statistics
export async function getDashboardStats() {
  const database = await getDatabase();
  
  const stats = await database.get(`
    SELECT 
      COUNT(DISTINCT p.id) as total_prds,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT pl.id) as total_plans,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
      COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_prds,
      COUNT(CASE WHEN pl.status = 'active' THEN 1 END) as active_plans
    FROM prds p
    LEFT JOIN plans pl ON p.id = pl.prd_id
    LEFT JOIN tasks t ON pl.id = t.plan_id
  `);
  
  return stats;
}

// Task activity timeline
export async function getTaskActivity(days = 30) {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      DATE(updated_at) as date,
      COUNT(*) as task_count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
    FROM tasks
    WHERE updated_at >= datetime('now', '-${days} days')
    GROUP BY DATE(updated_at)
    ORDER BY date ASC
  `);
}

// Priority distribution
export async function getPriorityDistribution() {
  const database = await getDatabase();
  return await database.all(`
    SELECT 
      priority,
      COUNT(*) as count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
    FROM tasks
    GROUP BY priority
  `);
}