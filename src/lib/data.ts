import { getDb } from './db';
import type { Job, Application, AppStatus, Interview } from './types';

export async function fetchJobs(): Promise<Job[]> {
  const db = await getDb();
  const result = await db.query('SELECT * FROM jobs ORDER BY created_at DESC');
  return (result.rows as any[]).map(mapJob);
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const db = await getDb();
  const result = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return mapJob(result.rows[0] as any);
}

export async function fetchApplications(userId: string): Promise<Application[]> {
  const db = await getDb();
  const result = await db.query(
    `SELECT a.*, j.title, j.company, j.logo, j.location, j.description, j.remote, j.type, j.salary_min, j.salary_max, j.tags, j.posted_days_ago
     FROM applications a JOIN jobs j ON a.job_id = j.id
     WHERE a.user_id = $1 ORDER BY a.created_at DESC`,
    [userId]
  );
  return (result.rows as any[]).map((row) => ({
    id: row.id,
    job: mapJobFromRow(row),
    status: row.status as AppStatus,
    appliedDaysAgo: row.applied_days_ago,
  }));
}

export async function fetchAppliedJobIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const result = await db.query('SELECT job_id FROM applications WHERE user_id = $1', [userId]);
  return (result.rows as any[]).map((r) => r.job_id);
}

export async function applyToJob(userId: string, jobId: string): Promise<void> {
  const db = await getDb();
  await db.query(
    'INSERT INTO applications (id, user_id, job_id, status, applied_days_ago) VALUES ($1, $2, $3, $4, $5)',
    ['a' + Date.now(), userId, jobId, 'pending', 0]
  );
}

export async function fetchInterviews(userId: string): Promise<Interview[]> {
  const db = await getDb();
  const result = await db.query(
    `SELECT i.*, j.title as job_title, j.company
     FROM interviews i JOIN jobs j ON i.job_id = j.id
     WHERE i.user_id = $1 ORDER BY i.in_days ASC`,
    [userId]
  );
  return (result.rows as any[]).map((row) => ({
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    company: row.company,
    date: row.date,
    time: row.time,
    format: row.format,
    withName: row.with_name,
    withRole: row.with_role,
    inDays: row.in_days,
  }));
}
export async function fetchInterviewById(
  userId: string,
  interviewId: string
): Promise<Interview | null> {
  const db = await getDb();
  const result = await db.query(
    `SELECT i.*, j.title AS job_title, j.company
     FROM interviews i
     JOIN jobs j ON i.job_id = j.id
     WHERE i.id = $1 AND i.user_id = $2`,
    [interviewId, userId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;

  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    company: row.company,
    date: row.date,
    time: row.time,
    format: row.format,
    withName: row.with_name,
    withRole: row.with_role,
    inDays: row.in_days,
  };
}
function mapJob(row: any): Job {
  return mapJobFromRow(row);
}

function mapJobFromRow(row: any): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    logo: row.logo,
    location: row.location,
    remote: row.remote,
    type: row.type as Job['type'],
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    postedDaysAgo: row.posted_days_ago,
    tags: row.tags ?? [],
    description: row.description,
  };
}
