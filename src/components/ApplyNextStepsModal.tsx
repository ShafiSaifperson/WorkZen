import { Link } from 'react-router-dom';
import { FileText, PenLine, X } from 'lucide-react';

interface ApplyNextStepsModalProps {
  isOpen: boolean;
  jobId: string | null;
  onClose: () => void;
}

export function ApplyNextStepsModal({
  isOpen,
  jobId,
  onClose,
}: ApplyNextStepsModalProps) {
  if (!isOpen || !jobId) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-8">
          <p className="text-sm font-semibold text-brand-600">Application preparation</p>
          <h2 className="mt-1 font-display text-xl font-bold text-ink-900">
            Strengthen your application
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Would you like to improve your resume or create a cover letter first?
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            to={`/app/resume-coach?jobId=${encodeURIComponent(jobId)}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 hover:border-brand-300 hover:bg-brand-50"
          >
            <FileText className="h-5 w-5 text-brand-600" />
            <span>
              <span className="block text-sm font-semibold text-ink-900">Use Resume Coach</span>
              <span className="block text-xs text-ink-500">Then apply for this job.</span>
            </span>
          </Link>

          <Link
            to="/app/cover-letter"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 hover:border-brand-300 hover:bg-brand-50"
          >
            <PenLine className="h-5 w-5 text-brand-600" />
            <span>
              <span className="block text-sm font-semibold text-ink-900">Create Cover Letter</span>
              <span className="block text-xs text-ink-500">Prepare your cover letter.</span>
            </span>
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full text-sm font-semibold text-ink-500 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}