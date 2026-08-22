import type { AtsReport, ChatMessage, ResumeAppliedChange, ResumeData } from './types';

export interface SavedResume {
  fileName: string;
  fileSize: string;
  rawText: string;
  savedAt: string;
}

export interface ResumeCoachSession {
  resumeData: ResumeData | null;
  report: AtsReport | null;
  appliedChanges: ResumeAppliedChange[];
  messages: ChatMessage[];
  manualEditText?: string;
  activeTab?: 'report' | 'text';
  previewSubTab?: 'visual' | 'raw';
  targetRole?: string;
  updatedAt?: string;
}

function storageKey(userId: string) {
  return `workzen-saved-resume-${userId}`;
}

function coachSessionKey(userId: string) {
  return `workzen-resume-coach-session-${userId}`;
}

export function getSavedResume(userId: string): SavedResume | null {
  try {
    const value = localStorage.getItem(storageKey(userId));
    if (!value) return null;

    const resume = JSON.parse(value) as SavedResume;

    if (!resume.fileName || !resume.rawText) return null;
    return resume;
  } catch {
    return null;
  }
}

export function saveResume(userId: string, resume: SavedResume) {
  localStorage.setItem(storageKey(userId), JSON.stringify(resume));
}

export function deleteSavedResume(userId: string) {
  localStorage.removeItem(storageKey(userId));
}

export function getResumeCoachSession(userId: string): ResumeCoachSession | null {
  try {
    const value = localStorage.getItem(coachSessionKey(userId));
    if (!value) return null;
    return JSON.parse(value) as ResumeCoachSession;
  } catch {
    return null;
  }
}

export function saveResumeCoachSession(userId: string, session: ResumeCoachSession) {
  try {
    localStorage.setItem(
      coachSessionKey(userId),
      JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error('Failed to save resume coach session:', err);
  }
}

export function clearResumeCoachSession(userId: string) {
  try {
    localStorage.removeItem(coachSessionKey(userId));
  } catch (err) {
    console.error('Failed to clear resume coach session:', err);
  }
}