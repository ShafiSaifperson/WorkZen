import { getDb } from './db';
import type {
  Job,
  Application,
  AppStatus,
  Interview,
  JobInput,
  CompanyApplication,
} from './types';

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
export async function fetchCompanyJobs(companyUserId: string): Promise<Job[]> {
  const db = await getDb();
  const result = await db.query(
    'SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC',
    [companyUserId]
  );

  return (result.rows as any[]).map(mapJob);
}

export async function createCompanyJob(
  companyUserId: string,
  input: JobInput
): Promise<void> {
  const db = await getDb();
  const logo = input.logo?.trim() || (input.company ? input.company.slice(0, 2).toUpperCase() : 'WZ');

  await db.query(
    `INSERT INTO jobs (
      id, title, company, logo, location, description, remote, type,
      salary_min, salary_max, tags, posted_days_ago, company_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )`,
    [
      `j${crypto.randomUUID()}`,
      input.title,
      input.company,
      logo,
      input.location,
      input.description,
      input.remote,
      input.type,
      input.salaryMin,
      input.salaryMax,
      input.tags,
      0,
      companyUserId,
    ]
  );
}

export async function updateCompanyJob(
  companyUserId: string,
  jobId: string,
  input: JobInput
): Promise<void> {
  const db = await getDb();
  const logo = input.logo?.trim() || (input.company ? input.company.slice(0, 2).toUpperCase() : 'WZ');

  const result = await db.query(
    `UPDATE jobs
     SET title = $1, company = $2, logo = $3, location = $4,
         description = $5, remote = $6, type = $7,
         salary_min = $8, salary_max = $9, tags = $10
     WHERE id = $11 AND company_id = $12
     RETURNING id`,
    [
      input.title,
      input.company,
      logo,
      input.location,
      input.description,
      input.remote,
      input.type,
      input.salaryMin,
      input.salaryMax,
      input.tags,
      jobId,
      companyUserId,
    ]
  );

  if (!result.rows.length) {
    throw new Error('You can only update your own job listings.');
  }
}

export async function deleteCompanyJob(
  companyUserId: string,
  jobId: string
): Promise<void> {
  const db = await getDb();

  const result = await db.query(
    'DELETE FROM jobs WHERE id = $1 AND company_id = $2 RETURNING id',
    [jobId, companyUserId]
  );

  if (!result.rows.length) {
    throw new Error('You can only delete your own job listings.');
  }
}

export async function fetchCompanyApplications(
  companyUserId: string
): Promise<CompanyApplication[]> {
  const db = await getDb();

  const result = await db.query(
    `SELECT
       a.id AS application_id,
       a.status,
       a.applied_days_ago,
       u.full_name AS candidate_name,
       u.email AS candidate_email,
       j.*
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN users u ON u.id = a.user_id
     WHERE j.company_id = $1
     ORDER BY a.created_at DESC`,
    [companyUserId]
  );

  return (result.rows as any[]).map((row) => ({
    id: row.application_id,
    status: row.status as AppStatus,
    appliedDaysAgo: row.applied_days_ago,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    job: mapJobFromRow(row),
  }));
}

export async function updateCompanyApplicationStatus(
  companyUserId: string,
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<void> {
  const db = await getDb();

  const ownedApplication = await db.query(
    `SELECT a.id
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1 AND j.company_id = $2`,
    [applicationId, companyUserId]
  );

  if (!ownedApplication.rows.length) {
    throw new Error('You can only review applications for your own jobs.');
  }

  await db.query(
    'UPDATE applications SET status = $1 WHERE id = $2',
    [status, applicationId]
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
    companyId: row.company_id,
  };
}
