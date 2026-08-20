import { getDb } from './db';
import type {
  Job,
  Application,
  AppStatus,
  Interview,
  JobInput,
  CompanyApplication,
  NotificationItem,
  NotificationType,
  ApplicationDetail,
} from './types';

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('workzen:notifications_updated'));
  }
}

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

export async function fetchApplicationById(
  userId: string,
  applicationId: string
): Promise<ApplicationDetail | null> {
  const db = await getDb();
  const result = await db.query(
    `SELECT 
       a.id AS app_id,
       a.user_id AS app_user_id,
       a.job_id AS app_job_id,
       a.status AS app_status,
       a.applied_days_ago,
       a.created_at AS app_created_at,
       a.updated_at AS app_updated_at,
       u.full_name AS candidate_name,
       u.email AS candidate_email,
       j.id AS job_id,
       j.title AS job_title,
       j.company AS job_company,
       j.logo AS job_logo,
       j.location AS job_location,
       j.description AS job_description,
       j.remote AS job_remote,
       j.type AS job_type,
       j.salary_min AS job_salary_min,
       j.salary_max AS job_salary_max,
       j.tags AS job_tags,
       j.posted_days_ago AS job_posted_days_ago,
       j.company_id AS job_company_id,
       i.id AS interview_id,
       i.date AS interview_date,
       i.time AS interview_time,
       i.format AS interview_format,
       i.with_name AS interview_with_name,
       i.with_role AS interview_with_role,
       i.in_days AS interview_in_days
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN users u ON a.user_id = u.id
     LEFT JOIN interviews i ON i.user_id = a.user_id AND i.job_id = a.job_id
     WHERE a.id = $1 AND (a.user_id = $2 OR j.company_id = $2)`,
    [applicationId, userId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;

  const job: Job = {
    id: row.job_id,
    title: row.job_title,
    company: row.job_company,
    logo: row.job_logo,
    location: row.job_location,
    remote: Boolean(row.job_remote),
    type: row.job_type as Job['type'],
    salaryMin: row.job_salary_min,
    salaryMax: row.job_salary_max,
    postedDaysAgo: row.job_posted_days_ago,
    tags: row.job_tags ?? [],
    description: row.job_description,
    companyId: row.job_company_id,
  };

  const interview: Interview | null = row.interview_id
    ? {
        id: row.interview_id,
        jobId: row.job_id,
        jobTitle: row.job_title,
        company: row.job_company,
        date: row.interview_date,
        time: row.interview_time,
        format: row.interview_format,
        withName: row.interview_with_name,
        withRole: row.interview_with_role,
        inDays: row.interview_in_days,
      }
    : null;

  return {
    id: row.app_id,
    userId: row.app_user_id,
    jobId: row.app_job_id,
    status: row.app_status as AppStatus,
    appliedDaysAgo: row.applied_days_ago,
    createdAt: row.app_created_at
      ? new Date(row.app_created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: row.app_updated_at
      ? new Date(row.app_updated_at).toISOString()
      : undefined,
    candidateName: row.candidate_name,
    candidateEmail: row.candidate_email,
    job,
    interview,
  };
}


export async function fetchAppliedJobIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const result = await db.query('SELECT job_id FROM applications WHERE user_id = $1', [userId]);
  return (result.rows as any[]).map((r) => r.job_id);
}

export async function applyToJob(userId: string, jobId: string): Promise<void> {
  const db = await getDb();
  const appId = 'a' + Date.now();
  await db.query(
    'INSERT INTO applications (id, user_id, job_id, status, applied_days_ago) VALUES ($1, $2, $3, $4, $5)',
    [appId, userId, jobId, 'pending', 0]
  );

  try {
    const jobRes = await db.query('SELECT title, company FROM jobs WHERE id = $1', [jobId]);
    const job = jobRes.rows[0] as any;
    const jobTitle = job?.title || 'Role';
    const company = job?.company || 'Company';

    const notifId = 'n' + Date.now();
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, related_application_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, now())`,
      [
        notifId,
        userId,
        'application_submitted',
        'Application Submitted',
        `Your application for ${jobTitle} at ${company} was submitted successfully.`,
        appId,
      ]
    );
    notifyChange();
  } catch (err) {
    console.error('Failed to create application_submitted notification:', err);
  }
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
    `SELECT a.id, a.user_id, j.title, j.company
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1 AND j.company_id = $2`,
    [applicationId, companyUserId]
  );

  if (!ownedApplication.rows.length) {
    throw new Error('You can only review applications for your own jobs.');
  }

  const appRow = ownedApplication.rows[0] as any;

  await db.query(
    'UPDATE applications SET status = $1, updated_at = now() WHERE id = $2',
    [status, applicationId]
  );

  try {
    const notifId = 'n' + Date.now();
    const title = status === 'accepted' ? 'Application Accepted! 🎉' : 'Application Status Update';
    const message = status === 'accepted'
      ? `Congratulations! Your application for ${appRow.title} at ${appRow.company} was accepted.`
      : `Thank you for your interest in the ${appRow.title} role at ${appRow.company}. The team has decided to move forward with other candidates.`;
    const type: NotificationType = status === 'accepted' ? 'application_accepted' : 'application_rejected';

    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, related_application_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, now())`,
      [notifId, appRow.user_id, type, title, message, applicationId]
    );
    notifyChange();
  } catch (err) {
    console.error('Failed to create status change notification:', err);
  }
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

export async function scheduleInterview(
  userId: string,
  jobId: string,
  details: {
    date: string;
    time: string;
    format: 'Video call' | 'On-site' | 'Phone screen';
    withName: string;
    withRole: string;
    inDays: number;
  }
): Promise<string> {
  const db = await getDb();
  const interviewId = 'i' + Date.now();
  await db.query(
    `INSERT INTO interviews (id, user_id, job_id, date, time, format, with_name, with_role, in_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      interviewId,
      userId,
      jobId,
      details.date,
      details.time,
      details.format,
      details.withName,
      details.withRole,
      details.inDays,
    ]
  );

  try {
    const jobRes = await db.query('SELECT title, company FROM jobs WHERE id = $1', [jobId]);
    const job = jobRes.rows[0] as any;
    const jobTitle = job?.title || 'Role';
    const company = job?.company || 'Company';

    const notifId = 'n' + Date.now();
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, related_interview_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, now())`,
      [
        notifId,
        userId,
        'interview_scheduled',
        'Interview Scheduled',
        `Upcoming ${details.format.toLowerCase()} for ${jobTitle} at ${company} on ${details.date} at ${details.time}.`,
        interviewId,
      ]
    );
    notifyChange();
  } catch (err) {
    console.error('Failed to create interview_scheduled notification:', err);
  }

  return interviewId;
}

export async function rescheduleInterview(
  userId: string,
  interviewId: string,
  details: {
    date: string;
    time: string;
    format?: 'Video call' | 'On-site' | 'Phone screen';
    inDays?: number;
  }
): Promise<void> {
  const db = await getDb();
  const existing = await db.query(
    `SELECT i.*, j.title as job_title, j.company
     FROM interviews i JOIN jobs j ON i.job_id = j.id
     WHERE i.id = $1 AND i.user_id = $2`,
    [interviewId, userId]
  );

  if (!existing.rows.length) {
    throw new Error('Interview not found');
  }

  const row = existing.rows[0] as any;
  const format = details.format ?? row.format;
  const inDays = details.inDays ?? row.in_days;

  await db.query(
    `UPDATE interviews
     SET date = $1, time = $2, format = $3, in_days = $4
     WHERE id = $5 AND user_id = $6`,
    [details.date, details.time, format, inDays, interviewId, userId]
  );

  try {
    const notifId = 'n' + Date.now();
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, related_interview_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, now())`,
      [
        notifId,
        userId,
        'interview_rescheduled',
        'Interview Rescheduled',
        `Your interview for ${row.job_title} at ${row.company} was rescheduled to ${details.date} at ${details.time}.`,
        interviewId,
      ]
    );
    notifyChange();
  } catch (err) {
    console.error('Failed to create interview_rescheduled notification:', err);
  }
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const db = await getDb();
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return (result.rows as any[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedApplicationId: row.related_application_id,
    relatedInterviewId: row.related_interview_id,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }));
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const db = await getDb();
  const result = await db.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt((result.rows[0] as any)?.count || '0', 10);
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const db = await getDb();
  await db.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  notifyChange();
}

export async function markNotificationAsUnread(userId: string, notificationId: string): Promise<void> {
  const db = await getDb();
  await db.query(
    `UPDATE notifications SET is_read = false WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  notifyChange();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const db = await getDb();
  await db.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1`,
    [userId]
  );
  notifyChange();
}

export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  const db = await getDb();
  await db.query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  notifyChange();
}

export async function createNotification(
  userId: string,
  item: {
    type: NotificationType | string;
    title: string;
    message: string;
    relatedApplicationId?: string | null;
    relatedInterviewId?: string | null;
  }
): Promise<string> {
  const db = await getDb();
  const notifId = 'n' + Date.now();
  await db.query(
    `INSERT INTO notifications (id, user_id, type, title, message, related_application_id, related_interview_id, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, false, now())`,
    [
      notifId,
      userId,
      item.type,
      item.title,
      item.message,
      item.relatedApplicationId ?? null,
      item.relatedInterviewId ?? null,
    ]
  );
  notifyChange();
  return notifId;
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

