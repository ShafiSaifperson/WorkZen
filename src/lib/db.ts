import { PGlite } from '@electric-sql/pglite';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
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
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_days_ago INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'Video call',
  with_name TEXT NOT NULL DEFAULT '',
  with_role TEXT NOT NULL DEFAULT '',
  in_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cover_letters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'professional',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
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

const USER_SEED = `
INSERT INTO users (id, email, password, full_name) VALUES
  ('u1', 'alex@workzen.app', 'workzen123', 'Alex Kim'),
  ('u2', 'demo@workzen.app', 'workzen123', 'Demo User')
ON CONFLICT (id) DO NOTHING;
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
INSERT INTO interviews (id, user_id, job_id, date, time, format, with_name, with_role, in_days) VALUES
  ('i1', 'u1', 'j5', 'Aug 3, 2026', '10:00 AM', 'Video call', 'Sarah Chen', 'Engineering Manager', 3),
  ('i2', 'u1', 'j5', 'Aug 6, 2026', '2:00 PM', 'On-site', 'David Park', 'Tech Lead', 6),
  ('i3', 'u1', 'j2', 'Aug 4, 2026', '11:30 AM', 'Video call', 'Maria Lopez', 'Design Director', 4),
  ('i4', 'u2', 'j5', 'Aug 5, 2026', '1:00 PM', 'Phone screen', 'James Wu', 'Recruiter', 5)
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
