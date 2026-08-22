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
  companyId?: string | null;
  match?: number;
}

export interface Application {
  id: string;
  job: Job;
  status: AppStatus;
  appliedDaysAgo: number;
}

export type InterviewType =
  | 'In Office'
  | 'Zoom'
  | 'Google Meet'
  | 'Phone Call'
  | 'Other';

export interface Interview {
  id: string;
  applicationId?: string | null;
  candidateId?: string;
  userId?: string;
  companyId?: string | null;
  jobId: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  type?: InterviewType | string;
  format: 'Video call' | 'On-site' | 'Phone screen' | string;
  meetingLink?: string;
  location?: string;
  withName: string;
  withRole: string;
  interviewerName?: string;
  interviewerRole?: string;
  notes?: string;
  status?: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled';
  inDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewInput {
  date: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  type: InterviewType;
  meetingLink?: string;
  location?: string;
  interviewerName: string;
  interviewerRole?: string;
  notes?: string;
}

export interface ChatAction {
  id: string;
  type: 'modify' | 'remove' | 'add';
  title: string;
  originalText?: string;
  suggestedRewrite?: string;
  sectionTarget?: string;
  applied?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp?: string;
  isReport?: boolean;
  action?: ChatAction;
  suggestions?: AtsSuggestion[];
}

export interface AtsCategoryScore {
  name: string;
  score: number; // 0-100
  weight: number;
  status: 'good' | 'warn' | 'crit';
  feedback: string;
}

export interface AtsSuggestion {
  id: string;
  category: 'Impact' | 'Skills' | 'Formatting' | 'Summary' | 'Structure';
  type: 'crit' | 'warn' | 'good';
  actionType?: 'modify' | 'remove' | 'add';
  title: string;
  originalText?: string;
  suggestedRewrite?: string;
  explanation: string;
  sectionTarget?: string;
}

export interface AtsReport {
  overallScore: number;
  targetRole: string;
  summary: string;
  categoryScores: AtsCategoryScore[];
  detectedSkills: string[];
  missingKeywords: string[];
  suggestions: AtsSuggestion[];
  stats: {
    wordCount: number;
    bulletCount: number;
    metricsCount: number;
    actionVerbsCount: number;
  };
}

export interface ResumeAppliedChange {
  id: string;
  suggestionId: string;
  title: string;
  actionType?: 'modify' | 'remove' | 'add';
  originalText: string;
  appliedText: string;
  appliedAt: string;
  precedingLine?: string;
  followingLine?: string;
  exactAddedText?: string;
  originalLineIndex?: number;
  removedHeading?: string;
  headingLineIndex?: number;
}

export interface ResumeData {
  fileName: string;
  fileSize: string;
  rawText: string;
  originalRawText?: string;
  uploadedAt: string;
}
export interface JobInput {
  title: string;
  company: string;
  logo: string;
  location: string;
  description: string;
  remote: boolean;
  type: Job['type'];
  salaryMin: number;
  salaryMax: number;
  tags: string[];
}

export interface CompanyApplication {
  id: string;
  userId?: string;
  status: AppStatus;
  appliedDaysAgo: number;
  candidateName: string;
  candidateEmail: string;
  job: Job;
  interview?: Interview | null;
  createdAt?: string;
}

export type NotificationType =
  | 'application_accepted'
  | 'application_rejected'
  | 'application_submitted'
  | 'interview_scheduled'
  | 'interview_rescheduled';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  relatedApplicationId?: string | null;
  relatedInterviewId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApplicationDetail {
  id: string;
  userId: string;
  jobId: string;
  status: AppStatus;
  appliedDaysAgo: number;
  createdAt: string;
  updatedAt?: string;
  candidateName: string;
  candidateEmail: string;
  job: Job;
  interview?: Interview | null;
}


