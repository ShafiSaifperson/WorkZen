export interface SavedResume {
  fileName: string;
  fileSize: string;
  rawText: string;
  savedAt: string;
}

function storageKey(userId: string) {
  return `workzen-saved-resume-${userId}`;
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