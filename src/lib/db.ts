import { PGlite } from '@electric-sql/pglite';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'candidate',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);


CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  remote BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'Full-time',
  salary_min INTEGER NOT NULL DEFAULT 0,
  salary_max INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  posted_days_ago INTEGER NOT NULL DEFAULT 0,
  company_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_days_ago INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '45 mins',
  type TEXT NOT NULL DEFAULT 'Google Meet',
  format TEXT NOT NULL DEFAULT 'Google Meet',
  meeting_link TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  with_name TEXT NOT NULL DEFAULT '',
  with_role TEXT NOT NULL DEFAULT '',
  interviewer_name TEXT NOT NULL DEFAULT '',
  interviewer_role TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  in_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cover_letters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'professional',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_application_id TEXT,
  related_interview_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'candidate';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS application_id TEXT REFERENCES applications(id) ON DELETE CASCADE;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS start_time TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS end_time TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS duration TEXT NOT NULL DEFAULT '45 mins';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Google Meet';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meeting_link TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interviewer_role TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_company_id ON interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
`;

const JOB_SEED = `
INSERT INTO jobs (id, title, company, logo, location, description, remote, type, salary_min, salary_max, tags, posted_days_ago) VALUES
  ('j1', 'Frontend Engineer', 'Northwind Labs', 'NL', 'San Francisco, CA', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', true, 'Full-time', 110, 145, ARRAY['React','TypeScript','Design Systems'], 2),
  ('j2', 'Product Design Intern', 'Lumen Studio', 'LS', 'New York, NY', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', false, 'Internship', 35, 45, ARRAY['Figma','Prototyping','UX Research'], 5),
  ('j3', 'Backend Engineer', 'Quanta Systems', 'QS', 'Remote (US)', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', true, 'Full-time', 125, 170, ARRAY['Go','PostgreSQL','Distributed Systems'], 1),
  ('j4', 'Data Analyst Intern', 'Meridian Bank', 'MB', 'Chicago, IL', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', false, 'Internship', 30, 38, ARRAY['SQL','Python','Tableau'], 7),
  ('j5', 'Full-Stack Engineer', 'Orbital Inc', 'OI', 'Austin, TX', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', true, 'Full-time', 120, 155, ARRAY['Node.js','React','AWS'], 3),
  ('j6', 'Marketing Intern', 'Bloom & Co', 'BC', 'Remote (US)', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', true, 'Internship', 25, 32, ARRAY['Content','Social','Analytics'], 4),
  ('j7', 'DevOps Engineer', 'Stratos Cloud', 'SC', 'Seattle, WA', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', true, 'Contract', 90, 120, ARRAY['Kubernetes','Terraform','CI/CD'], 6),
  ('j8', 'UX Research Intern', 'Pathway Health', 'PH', 'Boston, MA', 'You will partner with cross-functional teams to ship delightful product experiences. We value ownership, craft, and a bias for action. This is a high-impact role with clear room to grow.', false, 'Internship', 32, 40, ARRAY['Interviews','Usability','Synthesis'], 8)
ON CONFLICT (id) DO NOTHING;
`;
/*
const USER_SEED = `
INSERT INTO users (id, email, password, full_name) VALUES
  ('u1', 'alex@workzen.app', 'workzen123', 'Alex Kim'),
  ('u2', 'demo@workzen.app', 'workzen123', 'Demo User')
ON CONFLICT (id) DO NOTHING;
`;
*/
const USER_SEED = `
INSERT INTO users (id, email, password, full_name, role) VALUES
  ('u1', 'alex@workzen.app', 'workzen123', 'Alex Kim', 'candidate'),
  ('u2', 'demo@workzen.app', 'workzen123', 'Demo User', 'candidate'),
  ('u-company', 'company@workzen.app', 'company123', 'WorkZen Hiring Team', 'company')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
`;
const APP_SEED = `
INSERT INTO applications (id, user_id, job_id, status, applied_days_ago) VALUES
  ('a1', 'u1', 'j1', 'pending', 2),
  ('a2', 'u1', 'j3', 'pending', 5),
  ('a3', 'u1', 'j5', 'accepted', 8),
  ('a4', 'u1', 'j2', 'accepted', 12),
  ('a5', 'u1', 'j4', 'rejected', 15),
  ('a6', 'u2', 'j1', 'pending', 3),
  ('a7', 'u2', 'j5', 'accepted', 9),
  ('a8', 'u2', 'j4', 'rejected', 12)
ON CONFLICT (id) DO NOTHING;
`;

const INTERVIEW_SEED = `
INSERT INTO interviews (id, application_id, user_id, company_id, job_id, date, time, start_time, end_time, duration, type, format, meeting_link, location, with_name, with_role, interviewer_name, interviewer_role, notes, status, in_days) VALUES
  ('i1', 'a3', 'u1', 'u-company', 'j5', 'Aug 3, 2026', '10:00 AM', '10:00 AM', '11:00 AM', '60 mins', 'Google Meet', 'Google Meet', 'https://meet.google.com/orb-full-eng', '', 'Sarah Chen', 'Engineering Manager', 'Sarah Chen', 'Engineering Manager', 'We will discuss system architecture and previous React/Node.js projects.', 'scheduled', 3),
  ('i2', 'a3', 'u1', 'u-company', 'j5', 'Aug 6, 2026', '2:00 PM', '2:00 PM', '3:00 PM', '60 mins', 'In Office', 'On-site', '', '100 Market St, Floor 4, Austin, TX', 'David Park', 'Tech Lead', 'David Park', 'Tech Lead', 'On-site technical deep dive and team meet-and-greet.', 'scheduled', 6),
  ('i3', 'a4', 'u1', 'u-company', 'j2', 'Aug 4, 2026', '11:30 AM', '11:30 AM', '12:15 PM', '45 mins', 'Zoom', 'Zoom', 'https://zoom.us/j/9876543210', '', 'Maria Lopez', 'Design Director', 'Maria Lopez', 'Design Director', 'Portfolio presentation and design system walkthrough.', 'scheduled', 4),
  ('i4', 'a7', 'u2', 'u-company', 'j5', 'Aug 5, 2026', '1:00 PM', '1:00 PM', '1:30 PM', '30 mins', 'Phone Call', 'Phone screen', '', '+1 (555) 234-5678', 'James Wu', 'Recruiter', 'James Wu', 'Recruiter', 'Initial 30-minute culture and background screening call.', 'scheduled', 5)
ON CONFLICT (id) DO NOTHING;
`;

const NOTIFICATION_SEED = `
INSERT INTO notifications (id, user_id, type, title, message, related_application_id, related_interview_id, is_read, created_at) VALUES
  ('n1', 'u1', 'interview_scheduled', 'Interview Scheduled', 'Upcoming interview for Full-Stack Engineer at Orbital Inc on Aug 3, 2026 at 10:00 AM.', NULL, 'i1', false, now() - interval '2 hours'),
  ('n2', 'u1', 'application_accepted', 'Application Accepted! 🎉', 'Congratulations! Your application for Full-Stack Engineer at Orbital Inc was accepted.', 'a3', NULL, false, now() - interval '1 day'),
  ('n3', 'u1', 'interview_scheduled', 'Interview Scheduled', 'Upcoming interview for Product Design Intern at Lumen Studio on Aug 4, 2026 at 11:30 AM.', NULL, 'i3', true, now() - interval '2 days'),
  ('n4', 'u1', 'application_accepted', 'Application Accepted! 🎉', 'Congratulations! Your application for Product Design Intern at Lumen Studio was accepted.', 'a4', NULL, true, now() - interval '3 days'),
  ('n5', 'u1', 'application_rejected', 'Application Status Update', 'Thank you for your interest in the Data Analyst Intern role at Meridian Bank. The team has moved forward with other candidates.', 'a5', NULL, true, now() - interval '4 days'),
  ('n6', 'u1', 'application_submitted', 'Application Submitted', 'Your application for Frontend Engineer at Northwind Labs was submitted successfully.', 'a1', NULL, true, now() - interval '5 days'),
  ('n7', 'u2', 'interview_scheduled', 'Interview Scheduled', 'Upcoming interview for Full-Stack Engineer at Orbital Inc on Aug 5, 2026 at 1:00 PM.', NULL, 'i4', false, now() - interval '1 day'),
  ('n8', 'u2', 'application_accepted', 'Application Accepted! 🎉', 'Congratulations! Your application for Full-Stack Engineer at Orbital Inc was accepted.', 'a7', NULL, false, now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;
`;

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

async function initDb(): Promise<PGlite> {
  const db = new PGlite('idb://workzen-db');
  await db.exec(SCHEMA_SQL);
  await db.exec(JOB_SEED);
  await db.exec(USER_SEED);
  await db.exec(APP_SEED);
  await db.exec(INTERVIEW_SEED);
  await db.exec(NOTIFICATION_SEED);
  return db;
}


export async function getDb(): Promise<PGlite> {
  if (!dbInstance) {
    if (!initPromise) {
      initPromise = initDb()
        .then((db) => {
          dbInstance = db;
          return db;
        })
        .catch((err) => {
          console.error('[WorkZen] Database initialization failed:', err);
          initPromise = null;
          throw err;
        });
    }
    return initPromise;
  }
  return dbInstance;
}
