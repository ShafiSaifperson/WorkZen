import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileUp, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { extractTextFromFile, sanitizeAndCleanText } from '@/lib/resumeParser';
import {
  deleteSavedResume,
  getSavedResume,
  saveResume,
  type SavedResume,
} from '@/lib/savedResume';

export function YourResumePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resume, setResume] = useState<SavedResume | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setResume(getSavedResume(user.id));
    }
  }, [user]);

  async function handleFile(file: File) {
    if (!user) return;

    setUploading(true);

    try {
      const extractedText = await extractTextFromFile(file);
      const rawText = sanitizeAndCleanText(extractedText);

      if (rawText.trim().length < 30) {
        window.alert(
          'Could not extract readable text from this file. Please choose a PDF, DOCX, TXT, Markdown, or HTML resume with selectable text.'
        );
        return;
      }

      const savedResume: SavedResume = {
        fileName: file.name,
        fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        rawText,
        savedAt: new Date().toLocaleString(),
      };

      saveResume(user.id, savedResume);
      setResume(savedResume);
    } catch (error) {
      console.error('Saved resume upload failed:', error);
      window.alert(
        error instanceof Error
          ? error.message
          : 'Your resume could not be saved. Please try another file.'
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleDelete() {
    if (!user || !resume) return;

    const confirmed = window.confirm(
      'Delete your saved resume? You can upload a new one at any time.'
    );

    if (!confirmed) return;

    deleteSavedResume(user.id);
    setResume(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-violet-400">Profile</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">
          Your Resume
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Upload one resume and keep it ready for Resume Coach.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.html,.htm"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {!resume ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 bg-white px-6 py-16 text-center shadow-card transition hover:border-brand-400 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Upload className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-ink-900">
              {uploading ? 'Saving your resume…' : 'Upload your resume'}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              PDF, DOCX, TXT, Markdown, or HTML
            </p>
          </div>
        </button>
      ) : (
        <div className="space-y-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold text-ink-900">
                  {resume.fileName}
                </p>
                <p className="text-xs text-ink-500">
                  {resume.fileSize} · Saved {resume.savedAt}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-60"
              >
                <FileUp className="h-4 w-4" />
                Replace
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-ink-900">Saved resume</p>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-200 bg-ink-50 p-4 font-sans text-sm leading-6 text-ink-700">
              {resume.rawText}
            </pre>
          </div>

          <Link
            to="/app/resume-coach?loadSavedResume=true"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            <FileText className="h-4 w-4" />
            Use this resume in Resume Coach
          </Link>
        </div>
      )}
    </div>
  );
}