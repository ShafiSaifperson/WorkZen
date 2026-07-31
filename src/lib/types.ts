export type Page =
  | 'dashboard'
  | 'jobs'
  | 'resume-coach'
  | 'cover-letter';

export type AppStatus = 'accepted' | 'pending' | 'rejected';

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  remote: boolean;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  salaryMin: number;
  salaryMax: number;
  postedDaysAgo: number;
  tags: string[];
  description: string;
  match?: number;
}

export interface Application {
  id: string;
  job: Job;
  status: AppStatus;
  appliedDaysAgo: number;
}

export interface Interview {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  format: 'Video call' | 'On-site' | 'Phone screen';
  withName: string;
  withRole: string;
  inDays: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}
