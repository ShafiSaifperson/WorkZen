import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  UserRound,
  Video,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { fetchInterviewById } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Interview } from '@/lib/types';

const formatIcons = {
  'Video call': Video,
  'On-site': MapPin,
  'Phone screen': Phone,
} as const;

export function InterviewDetailPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !interviewId) return;

    fetchInterviewById(user.id, interviewId)
      .then(setInterview)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [interviewId, user]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <p className="mt-4 text-sm text-ink-500">
          {error ?? 'This interview could not be found.'}
        </p>
        <Link
          to="/app/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const FormatIcon = formatIcons[interview.format] ?? Video;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <p className="text-sm font-semibold text-brand-600">Upcoming interview</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {interview.jobTitle}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
          <Building2 className="h-4 w-4" />
          {interview.company}
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <DetailRow icon={Calendar} label="Date" value={interview.date} />
          <DetailRow icon={Clock} label="Time" value={interview.time} />
          <DetailRow icon={FormatIcon} label="Interview format" value={interview.format} />
          <DetailRow
            icon={UserRound}
            label="Interviewer"
            value={`${interview.withName} · ${interview.withRole}`}
          />
        </div>

        <div className="mt-7 border-t border-ink-100 pt-6">
          <p className="text-sm text-ink-500">
            Scheduled in {interview.inDays} day{interview.inDays === 1 ? '' : 's'}.
          </p>

          <Link
            to={`/app/jobs/${interview.jobId}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            View job posting
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-4">
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}